from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
import os
import uuid

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SECRET_KEY")
)

@app.get("/")
def root():
    return {"message": "Medico API is running"}


# --- CONDITIONS ---

@app.get("/conditions")
def get_conditions():
    response = supabase.table("conditions").select("*").execute()
    return response.data

@app.post("/conditions")
def create_condition(name: str = Form(...), status: str = Form("active"), diagnosed_on: str = Form(None)):
    data = {"name": name, "status": status}
    if diagnosed_on:
        data["diagnosed_on"] = diagnosed_on
    response = supabase.table("conditions").insert(data).execute()
    return response.data


# --- VISITS ---

@app.get("/visits")
def get_visits(condition_id: str = None, doctor: str = None):
    query = supabase.table("visits").select("*")
    if doctor:
        query = query.ilike("doctor_name", f"%{doctor}%")
    response = query.order("date", desc=True).execute()
    visits = response.data
    
    if condition_id:
        vc_response = supabase.table("visit_conditions").select("visit_id").eq("condition_id", condition_id).execute()
        valid_visit_ids = {vc["visit_id"] for vc in vc_response.data}
        visits = [v for v in visits if v["id"] in valid_visit_ids]
        
    return visits

@app.get("/visits/{id}")
def get_visit(id: str):
    visit_resp = supabase.table("visits").select("*").eq("id", id).execute()
    if not visit_resp.data:
        raise HTTPException(status_code=404, detail="Visit not found")
    visit = visit_resp.data[0]
    
    docs_resp = supabase.table("documents").select("*").eq("visit_id", id).execute()
    visit["documents"] = docs_resp.data
    
    conds_resp = supabase.table("visit_conditions").select("condition_id, conditions(*)").eq("visit_id", id).execute()
    visit["conditions"] = [c["conditions"] for c in conds_resp.data if c.get("conditions")]
    
    meds_resp = supabase.table("medications").select("*").eq("visit_id", id).execute()
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
    echs_referred: bool = Form(None)
):
    update_data = {}
    if date is not None: update_data["date"] = date
    if doctor_name is not None: update_data["doctor_name"] = doctor_name
    if hospital_or_clinic is not None: update_data["hospital_or_clinic"] = hospital_or_clinic
    if specialty is not None: update_data["specialty"] = specialty
    if reason is not None: update_data["reason"] = reason
    if echs_referred is not None: update_data["echs_referred"] = echs_referred
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    resp = supabase.table("visits").update(update_data).eq("id", id).execute()
    return resp.data

@app.delete("/visits/{id}")
def delete_visit(id: str):
    resp = supabase.table("visits").delete().eq("id", id).execute()
    return resp.data

@app.post("/visits")
def create_visit(
    date: str = Form(...),
    doctor_name: str = Form(None),
    hospital_or_clinic: str = Form(None),
    specialty: str = Form(None),
    reason: str = Form(None),
    echs_referred: bool = Form(False),
    condition_ids: str = Form(None)  # comma separated UUIDs
):
    visit_data = {
        "date": date,
        "doctor_name": doctor_name,
        "hospital_or_clinic": hospital_or_clinic,
        "specialty": specialty,
        "reason": reason,
        "echs_referred": echs_referred
    }
    visit_response = supabase.table("visits").insert(visit_data).execute()
    visit = visit_response.data[0]
    visit_id = visit["id"]

    if condition_ids:
        ids = [cid.strip() for cid in condition_ids.split(",") if cid.strip()]
        for cid in ids:
            supabase.table("visit_conditions").insert({
                "visit_id": visit_id,
                "condition_id": cid
            }).execute()

    return visit


# --- DOCUMENTS ---

@app.post("/documents")
async def upload_document(
    visit_id: str = Form(...),
    type: str = Form(...),
    notes: str = Form(None),
    file: UploadFile = File(...)
):
    file_bytes = await file.read()
    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    storage_path = f"documents/{file_name}"

    supabase.storage.from_("documents").upload(storage_path, file_bytes, {"content-type": file.content_type})

    file_url = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public/documents/{file_name}"

    doc_data = {
        "visit_id": visit_id,
        "type": type,
        "file_url": file_url,
        "notes": notes
    }
    response = supabase.table("documents").insert(doc_data).execute()
    return response.data

@app.get("/documents/{visit_id}")
def get_documents(visit_id: str):
    response = supabase.table("documents").select("*").eq("visit_id", visit_id).execute()
    return response.data

@app.delete("/documents/{id}")
def delete_document(id: str):
    doc_resp = supabase.table("documents").select("file_url").eq("id", id).execute()
    if not doc_resp.data:
        raise HTTPException(status_code=404, detail="Document not found")
        
    file_url = doc_resp.data[0].get("file_url")
    if file_url:
        file_name = file_url.split("/")[-1]
        try:
            supabase.storage.from_("documents").remove([f"documents/{file_name}"])
        except Exception as e:
            print(f"Failed to delete file from storage: {e}")
        
    resp = supabase.table("documents").delete().eq("id", id).execute()
    return {"message": "Document deleted"}

# --- MEDICATIONS ---

@app.get("/medications")
def get_medications():
    resp = supabase.table("medications").select("*, visits(date, doctor_name), conditions(name)").order("created_at", desc=True).execute()
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
    condition_id: str = Form(None)
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
        
    resp = supabase.table("medications").insert(med_data).execute()
    return resp.data