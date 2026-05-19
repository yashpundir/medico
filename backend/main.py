from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
import os
import uuid
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://medico-1-6iqz.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY")
)

def get_db(authorization: str = Header(None)) -> Client:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ")[1]
    try:
        # Verify the session token using the master secret key client
        user_resp = supabase.auth.get_user(token)
        if not user_resp or not user_resp.user:
            raise HTTPException(status_code=401, detail="Invalid or expired session token")
        
        # Create a request-scoped client using the publishable key or secret key
        # and authenticate it with the user's JWT so RLS policies apply.
        user_client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv("SUPABASE_SECRET_KEY")
        )
        user_client.postgrest.auth(token)
        return user_client
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def sign_document_url(doc: dict) -> dict:
    if doc.get("file_url"):
        filename = doc["file_url"].split("/")[-1]
        storage_path = f"documents/{filename}"
        try:
            signed_url_resp = supabase.storage.from_("documents").create_signed_url(storage_path, 3600)
            doc["file_url"] = signed_url_resp.get("signedUrl") or signed_url_resp.get("signedURL")
        except Exception as e:
            print(f"Error generating signed URL for {filename}: {e}")
    return doc

def sign_and_parse_document(doc: dict) -> dict:
    doc = sign_document_url(doc)
    if not doc.get("visit_id") and doc.get("notes"):
        try:
            data = json.loads(doc["notes"])
            if isinstance(data, dict) and ("date" in data or "condition_ids" in data):
                doc["date"] = data.get("date")
                doc["condition_ids"] = data.get("condition_ids", [])
                doc["notes"] = data.get("notes", "")
        except Exception:
            pass
    return doc

@app.get("/")
def root():
    return {"message": "Medico API is running"}


# --- CONDITIONS ---

@app.get("/conditions")
def get_conditions(db: Client = Depends(get_db)):
    response = db.table("conditions").select("*").execute()
    return response.data

@app.post("/conditions")
def create_condition(name: str = Form(...), status: str = Form("active"), diagnosed_on: str = Form(None), db: Client = Depends(get_db)):
    data = {"name": name, "status": status}
    if diagnosed_on:
        data["diagnosed_on"] = diagnosed_on
    response = db.table("conditions").insert(data).execute()
    return response.data

@app.put("/conditions/{id}")
def update_condition(
    id: str,
    name: str = Form(None),
    status: str = Form(None),
    diagnosed_on: str = Form(None),
    db: Client = Depends(get_db)
):
    update_data = {}
    if name is not None: update_data["name"] = name
    if status is not None: update_data["status"] = status
    if diagnosed_on is not None: update_data["diagnosed_on"] = diagnosed_on
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    resp = db.table("conditions").update(update_data).eq("id", id).execute()
    return resp.data

@app.delete("/conditions/{id}")
def delete_condition(id: str, db: Client = Depends(get_db)):
    resp = db.table("conditions").delete().eq("id", id).execute()
    return resp.data


# --- VISITS ---

@app.get("/visits")
def get_visits(condition_id: str = None, doctor: str = None, db: Client = Depends(get_db)):
    query = db.table("visits").select("*")
    if doctor:
        query = query.ilike("doctor_name", f"%{doctor}%")
    response = query.order("date", desc=True).execute()
    visits = response.data
    
    if condition_id:
        vc_response = db.table("visit_conditions").select("visit_id").eq("condition_id", condition_id).execute()
        valid_visit_ids = {vc["visit_id"] for vc in vc_response.data}
        visits = [v for v in visits if v["id"] in valid_visit_ids]
        
    return visits

@app.get("/visits/{id}")
def get_visit_endpoint(id: str, db: Client = Depends(get_db)):
    return get_visit(id, db)

def get_visit(id: str, db: Client = None):
    client = db if db is not None else supabase
    visit_resp = client.table("visits").select("*").eq("id", id).execute()
    if not visit_resp.data:
        raise HTTPException(status_code=404, detail="Visit not found")
    visit = visit_resp.data[0]
    
    docs_resp = client.table("documents").select("*").eq("visit_id", id).execute()
    visit["documents"] = [sign_and_parse_document(d) for d in docs_resp.data]
    
    conds_resp = client.table("visit_conditions").select("condition_id, conditions(*)").eq("visit_id", id).execute()
    visit["conditions"] = [c["conditions"] for c in conds_resp.data if c.get("conditions")]
    
    meds_resp = client.table("medications").select("*").eq("visit_id", id).execute()
    visit["medications"] = meds_resp.data
    
    return visit

@app.put("/visits/{id}")
def update_visit(
    id: str,
    date: str = Form(None),
    doctor_name: str = Form(None),
    hospital_or_clinic: str = Form(None),
    specialty: str = Form(None),
    reason: str = Form(None),
    echs_referred: bool = Form(None),
    condition_ids: str = Form(None),
    db: Client = Depends(get_db)
):
    update_data = {}
    if date is not None: update_data["date"] = date
    if doctor_name is not None: update_data["doctor_name"] = doctor_name
    if hospital_or_clinic is not None: update_data["hospital_or_clinic"] = hospital_or_clinic
    if specialty is not None: update_data["specialty"] = specialty
    if reason is not None: update_data["reason"] = reason
    if echs_referred is not None: update_data["echs_referred"] = echs_referred
    
    if update_data:
        db.table("visits").update(update_data).eq("id", id).execute()
        
    if condition_ids is not None:
        db.table("visit_conditions").delete().eq("visit_id", id).execute()
        ids = [cid.strip() for cid in condition_ids.split(",") if cid.strip()]
        for cid in ids:
            db.table("visit_conditions").insert({
                "visit_id": id,
                "condition_id": cid
            }).execute()
            
    return get_visit(id, db)

@app.delete("/visits/{id}")
def delete_visit(id: str, db: Client = Depends(get_db)):
    resp = db.table("visits").delete().eq("id", id).execute()
    return resp.data

@app.post("/visits")
def create_visit(
    date: str = Form(...),
    doctor_name: str = Form(None),
    hospital_or_clinic: str = Form(None),
    specialty: str = Form(None),
    reason: str = Form(None),
    echs_referred: bool = Form(False),
    condition_ids: str = Form(None),  # comma separated UUIDs
    db: Client = Depends(get_db)
):
    visit_data = {
        "date": date,
        "doctor_name": doctor_name,
        "hospital_or_clinic": hospital_or_clinic,
        "specialty": specialty,
        "reason": reason,
        "echs_referred": echs_referred
    }
    visit_response = db.table("visits").insert(visit_data).execute()
    visit = visit_response.data[0]
    visit_id = visit["id"]

    if condition_ids:
        ids = [cid.strip() for cid in condition_ids.split(",") if cid.strip()]
        for cid in ids:
            db.table("visit_conditions").insert({
                "visit_id": visit_id,
                "condition_id": cid
            }).execute()

    return visit


# --- DOCUMENTS ---

@app.post("/documents")
async def upload_document(
    type: str = Form(...),
    visit_id: str = Form(None),
    notes: str = Form(None),
    date: str = Form(None),
    condition_ids: str = Form(None),
    file: UploadFile = File(...),
    db: Client = Depends(get_db)
):
    file_bytes = await file.read()
    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    storage_path = f"documents/{file_name}"

    # Verify and upload to private storage
    supabase.storage.from_("documents").upload(storage_path, file_bytes, {"content-type": file.content_type})

    file_url = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public/documents/{file_name}"

    db_notes = notes
    if not visit_id:
        cids = [cid.strip() for cid in condition_ids.split(",") if cid.strip()] if condition_ids else []
        db_notes = json.dumps({
            "date": date or "",
            "condition_ids": cids,
            "notes": notes or ""
        })

    doc_data = {
        "type": type,
        "file_url": file_url,
        "notes": db_notes
    }
    if visit_id:
        doc_data["visit_id"] = visit_id

    response = db.table("documents").insert(doc_data).execute()
    doc = sign_and_parse_document(response.data[0])
    return [doc]

@app.get("/documents/{visit_id}")
def get_documents(visit_id: str, db: Client = Depends(get_db)):
    response = db.table("documents").select("*").eq("visit_id", visit_id).execute()
    return [sign_and_parse_document(d) for d in response.data]

@app.get("/standalone-documents")
def get_standalone_documents(db: Client = Depends(get_db)):
    response = db.table("documents").select("*").is_("visit_id", "null").execute()
    return [sign_and_parse_document(d) for d in response.data]

@app.delete("/documents/{id}")
def delete_document(id: str, db: Client = Depends(get_db)):
    doc_resp = db.table("documents").select("file_url").eq("id", id).execute()
    if not doc_resp.data:
        raise HTTPException(status_code=404, detail="Document not found")
        
    file_url = doc_resp.data[0].get("file_url")
    if file_url:
        file_name = file_url.split("/")[-1]
        try:
            supabase.storage.from_("documents").remove([f"documents/{file_name}"])
        except Exception as e:
            print(f"Failed to delete file from storage: {e}")
        
    resp = db.table("documents").delete().eq("id", id).execute()
    return {"message": "Document deleted"}

# --- MEDICATIONS ---

@app.get("/medications")
def get_medications(db: Client = Depends(get_db)):
    resp = db.table("medications").select("*, visits(date, doctor_name), conditions(name)").order("created_at", desc=True).execute()
    return resp.data

@app.post("/medications")
def create_medication(
    visit_id: str = Form(...),
    name: str = Form(...),
    dosage: str = Form(None),
    frequency: str = Form(None),
    prescribed_on: str = Form(None),
    prescribed_until: str = Form(None),
    prescribed_by: str = Form(None),
    status: str = Form("ongoing"),
    condition_id: str = Form(None),
    db: Client = Depends(get_db)
):
    med_data = {
        "visit_id": visit_id,
        "name": name,
        "dosage": dosage,
        "frequency": frequency,
        "prescribed_on": prescribed_on,
        "prescribed_until": prescribed_until,
        "prescribed_by": prescribed_by,
        "status": status
    }
    if condition_id:
        med_data["condition_id"] = condition_id
        
    resp = db.table("medications").insert(med_data).execute()
    return resp.data