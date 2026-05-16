# Medico — Project Handoff Document
> This document contains everything a coding agent needs to understand, continue, and extend the Medico project. Read it fully before writing any code.

---

## 1. What Is This Project?

Medico is a **personal medical records management app** built for a single patient (the developer's mother, ~60 years old). The goal is to digitize, organize, and make navigable a large collection of physical medical documents spanning many years — prescriptions, lab reports, CT scans, X-rays, ECG reports, referrals, discharge summaries, etc.

The app is **private, login-protected, and cloud-accessible** — usable from any device (laptop, phone) via the internet.

---

## 2. The Big Picture — All Phases

The project is broken into phases. We are currently in **Phase 1**.

### Phase 1 — Organize (CURRENT)
Build a minimal skeleton app that allows:
- Adding a "Visit" (a single interaction with the medical system — a doctor's appointment, a test, a referral)
- Uploading one or more documents (PDFs or images) per visit
- Tagging each visit with metadata: date, doctor, hospital, specialty, reason, conditions, ECHS referral flag
- Viewing a list of all visits and their documents
- Adding and managing known health conditions

### Phase 2 — Navigate
- Timeline view of all visits (chronological)
- Filter by: doctor, hospital, condition, document type, date range
- Full text search across all documents
- Condition-centric view: click a condition → see all related visits, documents, medications

### Phase 3 — Understand
- AI-powered automatic extraction of metadata from uploaded documents
- Auto-tagging documents (extract doctor name, date, medications from PDFs)
- Medication timeline — track what was prescribed when, by whom, for what
- Lab value tracking over time (e.g. HbA1c, TSH, BP readings as charts)

### Phase 4 — Assist
- AI summarization of a condition's full history
- Pre-appointment brief generator ("here's a summary to hand to a new doctor")
- Pattern recognition across visits and conditions
- Natural language querying ("what did Dr. Sharma prescribe for her knee last year?")

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React (JavaScript) | UI, runs in browser |
| Backend | FastAPI (Python) | API, business logic |
| Database | Supabase (Postgres) | Stores all metadata, tags, visit records |
| File Storage | Supabase Storage | Stores actual PDF/image files |
| Hosting (future) | Railway or Render | Deploy backend to internet |
| Hosting (future) | Vercel or Netlify | Deploy frontend to internet |

---

## 4. Development Environment

- **Server:** University Linux server (`rudra`), accessed via SSH
- **Working directory:** `/data1/yashasvi/medico/`
- **OS:** Ubuntu 24
- **Python:** 3.13.9 (system), using `venv` for project isolation
- **Node:** v24.15.0 (installed via nvm, located at `/data1/yashasvi/.nvm`)
- **Git remote:** `https://github.com/yashpundir/medico.git`

### Project Structure
```
/data1/yashasvi/medico/
├── backend/
│   ├── venv/               # Python virtual environment (never commit this)
│   ├── main.py             # FastAPI app — all endpoints live here for now
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Secret keys (never commit this)
├── frontend/
│   └── medico-frontend/    # create-react-app project
│       └── src/
│           ├── App.js
│           └── components/
│               ├── AddVisit.js
│               └── AddCondition.js
└── .gitignore
```

### To Start the Backend
```bash
cd /data1/yashasvi/medico/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### To Start the Frontend
```bash
cd /data1/yashasvi/medico/frontend/medico-frontend
npm start
```
Runs on `http://localhost:3000`. Talks to backend at `http://localhost:8000`.

---

## 5. Environment Variables

Located at `/data1/yashasvi/medico/backend/.env`. Never commit this file.

```
SUPABASE_URL=https://xqqfkczvtdrqazjnrxvs.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_0jZYC7MyeQaR4aehlfwp7g_VG8f1V95
SUPABASE_SECRET_KEY=<secret — already set on server, do not expose>
```

- The backend uses `SUPABASE_SECRET_KEY` (full privileged access)
- The frontend will eventually use `SUPABASE_PUBLISHABLE_KEY` (safe to expose, but RLS must be enabled — it already is)

---

## 6. Supabase Setup

- **Project name:** medico
- **Project ID:** xqqfkczvtdrqazjnrxvs
- **Region:** South Asia (Mumbai) — ap-south-1
- **Storage bucket:** `documents` (private)
- **Row Level Security (RLS):** Enabled on all tables

### Database Schema

```sql
-- Conditions (her known health issues)
create table conditions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  status text check (status in ('active', 'resolved')) default 'active',
  diagnosed_on date,
  created_at timestamp default now()
);

-- Visits (a single trip to a doctor/hospital)
create table visits (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  doctor_name text,
  hospital_or_clinic text,
  specialty text,
  reason text,
  echs_referred boolean default false,
  created_at timestamp default now()
);

-- Junction table linking visits to conditions (many-to-many)
create table visit_conditions (
  visit_id uuid references visits(id) on delete cascade,
  condition_id uuid references conditions(id) on delete cascade,
  primary key (visit_id, condition_id)
);

-- Documents (attached to a visit)
create table documents (
  id uuid default gen_random_uuid() primary key,
  visit_id uuid references visits(id) on delete cascade,
  type text check (type in ('prescription', 'lab_report', 'scan', 'referral', 'discharge_summary', 'other')),
  file_url text,
  notes text,
  created_at timestamp default now()
);

-- Medications (manually entered from prescriptions)
create table medications (
  id uuid default gen_random_uuid() primary key,
  visit_id uuid references visits(id) on delete cascade,
  condition_id uuid references conditions(id),
  name text not null,
  dosage text,
  frequency text,
  prescribed_on date,
  prescribed_until date,
  prescribed_by text,
  status text check (status in ('ongoing', 'completed', 'stopped')) default 'ongoing',
  created_at timestamp default now()
);
```

---

## 7. Backend — API Endpoints

All endpoints are in `backend/main.py`. The backend uses FastAPI with `python-multipart` for form data and file uploads, and the `supabase` Python client for database and storage operations.

### Currently Implemented

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/conditions` | List all conditions |
| POST | `/conditions` | Create a new condition |
| GET | `/visits` | List all visits (newest first) |
| POST | `/visits` | Create a new visit (with condition tags) |
| POST | `/documents` | Upload a document and attach to a visit |
| GET | `/documents/{visit_id}` | Get all documents for a visit |

### Still Needed (build these next)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/visits/{id}` | Get a single visit with its documents and conditions |
| PUT | `/visits/{id}` | Edit a visit |
| DELETE | `/visits/{id}` | Delete a visit |
| DELETE | `/documents/{id}` | Delete a document |
| GET | `/medications` | List all medications |
| POST | `/medications` | Add a medication |
| GET | `/visits?condition_id=x` | Filter visits by condition |
| GET | `/visits?doctor=x` | Filter visits by doctor |

---

## 8. Frontend — Current State

Built with `create-react-app`. Minimal boilerplate removed. Currently has:

- `App.js` — simple nav between "Add Visit" and "Add Condition" pages
- `components/AddCondition.js` — form to add a health condition
- `components/AddVisit.js` — form to add a visit, upload documents, tag conditions

### Still Needed (build these next)

- `components/VisitList.js` — list all visits in a table/card format, with links to their documents
- `components/VisitDetail.js` — single visit view with all documents, conditions, medications
- `components/MedicationList.js` — list all medications with filters
- Routing — use `react-router-dom` to give each page its own URL
- Better UI — currently unstyled, use Tailwind CSS or a component library like shadcn/ui

---

## 9. Domain Knowledge — Important Context

This is critical context that affects design decisions:

### ECHS Referral System
The patient's father served in the Indian Air Force, so the family has access to ECHS (Ex-Servicemen Contributory Health Scheme) — a government healthcare scheme for military veterans. ECHS facilities often lack resources and refer patients to empanelled private hospitals. So there are two types of visits:
- **ECHS visit** — where they are seen at the ECHS facility and referred elsewhere
- **Hospital visit** — the actual treatment visit at a private/empanelled hospital

The `echs_referred` boolean on the visits table captures this. In the future, we may want to link a referral visit to the downstream treatment visit.

### Document Types and Their Challenges
- **Prescriptions** — often handwritten by doctors, completely unreadable by OCR. Strategy: store the scan as-is, manually enter key fields (medication, dosage, doctor, date).
- **Lab reports** — may contain graphs (e.g. hormone level curves). Modern vision LLMs (Claude, GPT-4o) can read these graphs when the PDF page is rendered as an image. Use `pdf2image` library in Python to convert PDF pages to images before sending to LLM.
- **X-rays, CT scans** — raw DICOM images are specialized. Some come with a written radiology report, some don't. Focus on capturing the written report. Vision LLMs can attempt to read the raw scan but with limited reliability. Store all of them regardless.
- **ECG** — the printed trace is hard to parse, but there's usually an interpretation note on the page. Capture that.
- **24hr Holter Monitor report** — pages of graph data monitoring heart behavior over 24 hours. Store full PDF. Summary/conclusion page is the clinically useful part.

### AI Layer (Phase 3-4)
- Use the Anthropic Claude API for AI features
- To process PDFs with graphs/images: render PDF pages to images using `pdf2image`, send images to Claude vision API
- Claude can extract: medication names, dosages, doctor names, dates, lab values, diagnoses from documents
- Claude can summarize a condition's history across multiple visits
- Do NOT attempt to build this in Phase 1 or 2. Focus on data entry and navigation first.

---

## 10. What To Build Next (Immediate Priority)

The immediate next step is completing Phase 1. Here is the ordered task list:

1. **Complete the frontend components** — VisitList and VisitDetail views so the user can actually see what they've entered
2. **Add react-router-dom** for proper page routing
3. **Add basic styling** — even minimal Tailwind CSS so it's usable on mobile
4. **Add medication entry** — a form to manually enter medications from a prescription, attached to a visit
5. **Test end-to-end** — add a few real visits and documents, make sure everything saves and displays correctly
6. **Deploy** — backend to Railway/Render, frontend to Vercel/Netlify, so it's accessible from anywhere

---

## 11. Deployment Plan (When Ready)

### Backend (Railway or Render)
- Add a `Procfile` or `railway.json` with start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set environment variables (SUPABASE_URL, SUPABASE_SECRET_KEY) in the platform dashboard
- Update CORS in `main.py` to only allow the frontend's domain instead of `"*"`

### Frontend (Vercel or Netlify)
- Change the API base URL from `http://localhost:8000` to the deployed backend URL
- Run `npm run build` and deploy the `build/` folder
- Or connect the GitHub repo and let Vercel auto-deploy on push

---

## 12. Key Decisions Already Made

- **No local storage** — everything is cloud (Supabase), accessible from anywhere
- **No conda** — using plain `venv` for the backend, cleaner for deployment
- **RLS enabled** — all Supabase tables have Row Level Security on
- **Handwritten prescriptions** — not attempting OCR, store scan + manual data entry
- **PDF storage** — store original PDFs in Supabase Storage, render as images only when sending to AI (Phase 3+)
- **`venv` folder named `venv`** — standard convention, already in `.gitignore`
- **Branch name** — `master` (not `main`) on GitHub

---

## 13. Python Dependencies

Located in `backend/requirements.txt`. Key packages:
- `fastapi` — web framework
- `uvicorn` — ASGI server
- `python-multipart` — for form data and file upload handling
- `supabase` — Supabase Python client
- `python-dotenv` — loads `.env` file

Install with:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

---

*Last updated during conversation with Claude (Anthropic). Developer: Yashasvi (yashpundir on GitHub).*
