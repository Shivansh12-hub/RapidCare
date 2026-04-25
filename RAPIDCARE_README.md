# RapidCare 🚑
### AI-Powered Emergency Hospital Routing System for India

> **"Every second counts. RapidCare routes ambulances to the right hospital, in the right time, with the right resources — before the patient even arrives."**

---

## Table of Contents

- [What is RapidCare?](#what-is-rapidcare)
- [How it Works — The Full Flow](#how-it-works--the-full-flow)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [The Data Files](#the-data-files)
- [Backend Guide](#backend-guide)
- [Frontend Guide](#frontend-guide)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Common Errors & Fixes](#common-errors--fixes)

---

## What is RapidCare?

In India, thousands of patients die every year not because treatment was unavailable — but because the ambulance went to the wrong hospital. A heart attack patient gets taken to a hospital with no cardiologist. A trauma victim arrives at a facility with zero ICU beds. The golden hour is wasted.

RapidCare solves this. It is a web application designed to be used inside ambulances by compounders, paramedics, doctors, or even family members in an emergency. The person describes the patient's condition in plain language — no medical training required — and the system instantly finds the best hospital for that specific condition, notifies the hospital's ER to prepare, and shows the fastest route avoiding traffic.

---

## How it Works — The Full Flow

Understanding this flow is essential before you write a single line of code. Every screen, every API call, and every component exists to serve these steps.

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1 — PATIENT FORM                                          │
│  User fills in: age, gender, blood group, incident type,        │
│  describes the condition in their own words, and optional        │
│  vitals. The app silently captures GPS coordinates.             │
└───────────────────────┬─────────────────────────────────────────┘
                        │  POST /api/triage
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2 — NLP TRIAGE ENGINE (Backend ML Model)                  │
│  Reads the text description. Returns:                           │
│    - Severity  → P1 Critical / P2 Urgent / P3 Stable            │
│    - Speciality → Cardiology / Trauma Surgery / Neurology etc.  │
└───────────────────────┬─────────────────────────────────────────┘
                        │  GET /api/hospitals/recommend
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3 — HOSPITAL SCORING ENGINE (Backend)                     │
│  Scores all 50 hospitals using:                                 │
│    - Speciality match (does this hospital have the right dept?) │
│    - ICU / bed availability (are beds actually free right now?) │
│    - Distance + ETA (how far, accounting for traffic?)          │
│    - Rating, ER wait time, trauma centre, blood bank            │
│  Returns the top 5 ranked hospitals.                            │
└───────────────────────┬─────────────────────────────────────────┘
                        │  User selects a hospital
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4 — NOTIFICATIONS (Backend)                               │
│  Simultaneously fires:                                          │
│    - Hospital ER alert (prepare bed, which staff to call)       │
│    - SMS to family member's phone                               │
│    - Police PCR van alert (only for P1 road accidents)          │
└───────────────────────┬─────────────────────────────────────────┘
                        │  POST /api/route
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5 — ROUTE ENGINE (Backend)                                │
│  Calculates fastest route. Returns:                             │
│    - Distance in km, ETA in minutes                             │
│    - Traffic level and highway to take                          │
│    - Turn-by-turn instructions                                  │
│    - GPS waypoints to draw the route on the map                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| What | Technology | Why |
|---|---|---|
| Language | Python 3.10+ | The ML model is Python — keep it all in one language |
| Framework | FastAPI | Auto-generates `/docs` API playground, fast, type-safe |
| ML Model | scikit-learn | TF-IDF + Logistic Regression — lightweight, no GPU needed |
| Data | pandas | Read and score hospitals from CSV |
| Model saving | joblib | Save trained model to `.pkl` file |
| SMS | MSG91 | Cheapest SMS API for India, supports Hindi |
| Database | SQLite (prototype) | Zero setup, file-based, good enough for hackathon |

### Frontend
| What | Technology | Why |
|---|---|---|
| Framework | React.js | Component-based, widely known, easy to structure |
| Styling | Tailwind CSS or plain CSS | Your choice — plain CSS with variables works fine |
| Map | Leaflet.js + react-leaflet | Free, no API key needed, works great in India |
| HTTP | Axios | Cleaner than fetch(), easy error handling |
| Icons | Lucide React | Clean, consistent icon set |

---

## Project Structure

This is the exact folder layout you should create. Do not deviate from this — the backend Python files import from specific paths.

```
rapidcare/
│
├── backend/
│   ├── main.py                      ← FastAPI app, registers all routes
│   ├── train.py                     ← Run once to train + save the ML model
│   ├── requirements.txt
│   ├── .env                         ← Secret keys. NEVER commit this to git
│   │
│   ├── api/                         ← Route handlers (one file per feature)
│   │   ├── __init__.py
│   │   ├── triage.py                ← POST /api/triage
│   │   ├── hospitals.py             ← GET  /api/hospitals/recommend
│   │   │                               GET  /api/hospitals
│   │   ├── routes.py                ← POST /api/route
│   │   └── notifications.py         ← POST /api/notify
│   │
│   ├── services/                    ← Business logic — copy the 4 .py files here
│   │   ├── __init__.py
│   │   ├── triage_model.py          ← (given) NLP classifier
│   │   ├── hospital_matcher.py      ← (given) scoring + ranking
│   │   ├── route_engine.py          ← (given) route calculation
│   │   └── notification.py          ← (given) alert dispatcher
│   │
│   ├── data/                        ← Copy the 3 CSV files here
│   │   ├── patients.csv             ← 1000 patient records (training data)
│   │   ├── hospitals.csv            ← 50 Delhi NCR hospitals
│   │   └── routes.csv               ← 1000 route records
│   │
│   └── ml_models/                   ← Created automatically after train.py runs
│       ├── severity_model.pkl
│       └── speciality_model.pkl
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.jsx                  ← Root, holds all state, renders steps
│   │   │
│   │   ├── api/
│   │   │   └── client.js            ← ALL axios calls live here, nothing else
│   │   │
│   │   └── components/
│   │       ├── PatientForm.jsx      ← Step 1: the intake form
│   │       ├── TriageResult.jsx     ← Step 2: severity + speciality banner
│   │       ├── HospitalList.jsx     ← Step 3: ranked hospital cards
│   │       ├── MapView.jsx          ← Step 4: Leaflet map with route
│   │       ├── RouteInfoBar.jsx     ← ETA, distance, traffic stats
│   │       └── NotifPanel.jsx       ← ER notified confirmation box
│   │
│   ├── package.json
│   └── .env
│
└── RAPIDCARE_README.md              ← This file
```

---

## The Data Files

You have three CSV files. Understand what each one contains because the backend reads them directly.

### patients.csv — 1000 rows

This is the **training data** for the NLP model. Each row is one patient case.

| Column | Type | Example | Used for |
|---|---|---|---|
| `patient_id` | string | P0001 | Unique ID |
| `age` | int | 34 | Feature |
| `gender` | string | Male | Feature |
| `blood_group` | string | O+ | Info |
| `chief_complaint` | string | "Patient had road accident, unconscious, bleeding from ear..." | **Main NLP input** |
| `vitals` | string | "BP 90/60, HR 140, SpO2 85%, GCS 7" | **NLP input** |
| `past_medical_history` | string | Hypertension | **NLP input** |
| `severity` | string | P1 | **Target label 1** — model learns to predict this |
| `required_speciality` | string | Trauma Surgery | **Target label 2** — model learns to predict this |
| `incident_type` | string | Road accident | Info |
| `incident_lat` | float | 28.68 | Patient location |
| `incident_lng` | float | 77.35 | Patient location |
| `ambulance_called` | string | Yes | Info |
| `bystander_cpr` | string | No | Info |
| `timestamp` | string | 2024-07-02 00:05 | Info |

The NLP model trains on `chief_complaint + vitals + past_medical_history` as combined input text and learns to predict `severity` and `required_speciality`.

---

### hospitals.csv — 50 rows

This is the **hospital database**. The scoring engine reads this file to rank hospitals for each patient.

| Column | Type | Example | Used for |
|---|---|---|---|
| `hospital_id` | string | H010 | Unique ID |
| `name` | string | Safdarjung Hospital | Display |
| `lat` | float | 28.63 | Distance calculation |
| `lng` | float | 77.26 | Distance calculation |
| `type` | string | Trust | Display |
| `total_beds` | int | 478 | Info |
| `icu_beds_total` | int | 20 | Info |
| `icu_beds_free` | int | 18 | **Scoring — higher = better** |
| `general_beds_free` | int | 14 | Scoring |
| `ventilators_free` | int | 0 | Info |
| `operation_theatres` | int | 10 | Info |
| `specialities` | string | Trauma Surgery\|Orthopaedics\|Neurology | **Scoring — pipe-separated, split on `\|`** |
| `has_trauma_centre` | string | Yes | **Scoring bonus for P1** |
| `has_blood_bank` | string | Yes | Scoring |
| `has_cath_lab` | string | No | Info |
| `has_mri` | string | Yes | Info |
| `ambulances_available` | int | 1 | Info |
| `rating` | float | 3.7 | **Scoring** |
| `avg_er_wait_min` | int | 39 | **Scoring — lower = better** |
| `contact_number` | string | 011-17037740 | Display + notification |

**Important**: The `specialities` column stores multiple values separated by a pipe `|` character. When you read this in Python or JavaScript, split on `|` to get an array: `"Trauma Surgery|Orthopaedics|Neurology".split("|")`.

---

### routes.csv — 1000 rows

This is **supplementary data** showing how patients were routed. You don't need this for the core app — it's useful for analytics and showing stats on a dashboard.

| Column | Example | Meaning |
|---|---|---|
| `route_id` | R0001 | Unique ID |
| `patient_id` | P0001 | Links to patients.csv |
| `hospital_id` | H033 | Links to hospitals.csv |
| `distance_km` | 24.65 | Distance to hospital |
| `eta_min` | 59 | Estimated arrival time |
| `traffic_level` | Low | Traffic at time of case |
| `time_of_day` | Early morning | When the case happened |
| `road_type` | City arterial road | Type of road taken |
| `ambulance_type` | ALS (Advanced Life Support) | Ambulance category |
| `route_via` | NH58 | Highway used |
| `alt_hospital_id` | H020 | Alternative hospital considered |
| `alt_distance_km` | 31.75 | Distance to alternative |
| `alt_eta_min` | 76 | ETA to alternative |
| `time_saved_min` | 17 | Minutes saved vs alternative |
| `optimal_route` | Yes | Was this the faster option? |
| `speciality_match` | No | Did the hospital have the right dept? |
| `icu_available` | Yes | Was ICU free? |
| `recommended` | No | Was this the top recommendation? |

---

## Backend Guide

### Step 1 — Install dependencies

Create a `requirements.txt` in the `backend/` folder with this exact content:

```
fastapi==0.111.0
uvicorn==0.30.0
scikit-learn==1.4.2
pandas==2.2.2
numpy==1.26.4
joblib==1.4.2
python-dotenv==1.0.1
requests==2.32.3
pydantic==2.7.1
```

Then install:

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

### Step 2 — Copy the service files

Copy these four Python files from the ML project into `backend/services/`:

```
triage_model.py      →  backend/services/triage_model.py
hospital_matcher.py  →  backend/services/hospital_matcher.py
route_engine.py      →  backend/services/route_engine.py
notification.py      →  backend/services/notification.py
```

Also create empty `__init__.py` files so Python recognises them as packages:

```bash
touch backend/api/__init__.py
touch backend/services/__init__.py
```

---

### Step 3 — Train the ML model

Before starting the server, you need to train the model and save it as `.pkl` files. Create `backend/train.py`:

```python
# backend/train.py
# Run this ONCE before starting the server.
# It trains the NLP model on patients.csv and saves two .pkl files.

import pandas as pd
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from services.triage_model import TriageModel

print("Loading patients.csv...")
patients = pd.read_csv("data/patients.csv")
print(f"Loaded {len(patients)} patient records.")

print("Training severity + speciality classifiers...")
model = TriageModel()
model.train(patients)

os.makedirs("ml_models", exist_ok=True)
model.save("ml_models/")
print("Done. Models saved to ml_models/")
print("You can now start the server with: uvicorn main:app --reload")
```

Run it:

```bash
cd backend
python train.py
```

You should see training output with precision/recall scores, and two new files appear:
- `backend/ml_models/severity_model.pkl`
- `backend/ml_models/speciality_model.pkl`

You only need to run this once. After that, just start the server normally.

---

### Step 4 — Write main.py

This is the entry point. It creates the FastAPI app, adds CORS so the React frontend can call it, and registers all route handlers.

```python
# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import triage, hospitals, routes, notifications

app = FastAPI(
    title="RapidCare API",
    description="Emergency hospital routing system for Indian ambulances",
    version="1.0.0",
)

# CORS — without this, your React app (port 3000) cannot call this server (port 8000)
# The browser will block the request with a CORS error. This middleware allows it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React dev server (Create React App)
        "http://localhost:5173",   # React dev server (Vite)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route handlers
app.include_router(triage.router,         prefix="/api", tags=["Triage"])
app.include_router(hospitals.router,      prefix="/api", tags=["Hospitals"])
app.include_router(routes.router,         prefix="/api", tags=["Routes"])
app.include_router(notifications.router,  prefix="/api", tags=["Notifications"])

@app.get("/")
def health_check():
    return {"status": "RapidCare API is running", "docs": "/docs"}
```

---

### Step 5 — Write the API route handlers

#### api/triage.py

This handler receives the patient's text description and runs it through the ML model.

```python
# backend/api/triage.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from services.triage_model import TriageModel

router = APIRouter()

# Load model ONCE when the server starts. Never reload inside a request handler.
# Loading a model on every request would make the API take 2-3 seconds per call.
_model = TriageModel()
try:
    _model.load("ml_models/")
    print("[Triage] ML model loaded from ml_models/")
except Exception as e:
    print(f"[Triage] Warning: Could not load model ({e}). Using keyword fallback.")

# Severity display metadata
SEV_META = {
    "P1": {
        "label":       "Critical",
        "color":       "#E8342A",
        "description": "Immediate life-threatening — golden hour is active",
        "icon":        "🚨",
    },
    "P2": {
        "label":       "Urgent",
        "color":       "#F59E0B",
        "description": "Urgent — patient needs hospital within 2 hours",
        "icon":        "⚠️",
    },
    "P3": {
        "label":       "Stable",
        "color":       "#16A34A",
        "description": "Stable — non-life-threatening, can wait short time",
        "icon":        "✅",
    },
}

class TriageRequest(BaseModel):
    complaint:  str
    vitals:     Optional[str] = ""
    history:    Optional[str] = "None"
    age:        Optional[int] = None
    gender:     Optional[str] = None

@router.post("/triage")
def run_triage(req: TriageRequest):
    """
    Analyses patient condition text and returns severity + speciality.
    This is the first API call made after the form is submitted.
    """
    result = _model.predict(req.complaint, req.vitals or "", req.history or "None")
    sev    = result["severity"]
    meta   = SEV_META[sev]

    return {
        "severity":       sev,
        "severity_label": meta["label"],
        "severity_color": meta["color"],
        "severity_icon":  meta["icon"],
        "speciality":     result["speciality"],
        "confidence":     result.get("confidence", 0.0),
        "description":    meta["description"],
        "method":         result["method"],
    }
```

---

#### api/hospitals.py

This handler scores all 50 hospitals and returns the top 5 for the patient's condition and location.

```python
# backend/api/hospitals.py

from fastapi import APIRouter, Query
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from services.hospital_matcher import HospitalMatcher

router  = APIRouter()
matcher = HospitalMatcher("data/hospitals.csv")

@router.get("/hospitals/recommend")
def recommend_hospitals(
    patient_lat : float = Query(..., description="Patient GPS latitude,  e.g. 28.62"),
    patient_lng : float = Query(..., description="Patient GPS longitude, e.g. 77.21"),
    speciality  : str   = Query(..., description="Required speciality from triage result"),
    severity    : str   = Query("P1", description="P1, P2, or P3"),
    top_n       : int   = Query(5,   ge=1, le=10),
):
    """
    Scores all hospitals and returns the top N ranked by match score.
    Call this immediately after /api/triage with the speciality from that response.
    """
    ranked = matcher.recommend(patient_lat, patient_lng, speciality, severity, top_n)

    hospitals_out = []
    for rank, row in ranked.iterrows():
        specialities_list = [s.strip() for s in str(row.get("specialities", "")).split("|") if s.strip()]
        hospitals_out.append({
            "hospital_id":       row["hospital_id"],
            "name":              row["name"],
            "type":              row["type"],
            "lat":               float(row["lat"]),
            "lng":               float(row["lng"]),
            "distance_km":       round(float(row["distance_km"]), 1),
            "eta_min":           int(row["eta_min"]),
            "traffic_level":     row["traffic_level"],
            "total_beds":        int(row["total_beds"]),
            "icu_beds_free":     int(row["icu_beds_free"]),
            "general_beds_free": int(row["general_beds_free"]),
            "ventilators_free":  int(row["ventilators_free"]),
            "specialities":      specialities_list,
            "has_trauma_centre": row["has_trauma_centre"],
            "has_blood_bank":    row["has_blood_bank"],
            "has_cath_lab":      row["has_cath_lab"],
            "has_mri":           row["has_mri"],
            "rating":            float(row["rating"]),
            "avg_er_wait_min":   int(row["avg_er_wait_min"]),
            "contact_number":    row["contact_number"],
            "match_score":       float(row["match_score"]),
            "rank":              rank,
        })

    return {
        "hospitals":               hospitals_out,
        "total_hospitals_checked": len(matcher.df),
        "speciality_searched":     speciality,
        "severity":                severity,
    }


@router.get("/hospitals")
def get_all_hospitals():
    """
    Returns all 50 hospitals. Used by the frontend to draw all pins on the map
    when the page first loads, before any patient details are entered.
    """
    out = []
    for _, row in matcher.df.iterrows():
        out.append({
            "hospital_id":  row["hospital_id"],
            "name":         row["name"],
            "lat":          float(row["lat"]),
            "lng":          float(row["lng"]),
            "type":         row["type"],
            "icu_beds_free":int(row["icu_beds_free"]),
            "specialities": [s.strip() for s in str(row["specialities"]).split("|")],
            "rating":       float(row["rating"]),
        })
    return {"hospitals": out, "total": len(out)}
```

---

#### api/routes.py

This handler takes the patient location and chosen hospital ID and computes the fastest route.

```python
# backend/api/routes.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from services.route_engine import compute_route
from services.hospital_matcher import HospitalMatcher

router  = APIRouter()
matcher = HospitalMatcher("data/hospitals.csv")

class RouteRequest(BaseModel):
    patient_lat:  float
    patient_lng:  float
    hospital_id:  str
    severity:     str = "P1"

@router.post("/route")
def get_route(req: RouteRequest):
    """
    Calculates the fastest route from patient to the selected hospital.
    Returns distance, ETA, waypoints for map drawing, and turn-by-turn instructions.
    Call this when the user clicks a hospital card.
    """
    try:
        hospital = matcher.get_hospital(req.hospital_id)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Hospital {req.hospital_id} not found")

    route = compute_route(
        req.patient_lat, req.patient_lng,
        float(hospital["lat"]), float(hospital["lng"]),
        severity=req.severity,
    )
    return route
```

---

#### api/notifications.py

This handler sends alerts to the hospital ER, the patient's family, and police if needed.

```python
# backend/api/notifications.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from services.notification import (
    send_hospital_alert, send_family_sms,
    send_police_alert, _get_required_actions
)
from services.hospital_matcher import HospitalMatcher

router  = APIRouter()
matcher = HospitalMatcher("data/hospitals.csv")

class NotifyRequest(BaseModel):
    hospital_id:    str
    patient_info:   dict
    route:          dict
    family_phone:   Optional[str] = None
    incident_type:  str = "Medical emergency"
    patient_lat:    float = 0.0
    patient_lng:    float = 0.0

@router.post("/notify")
def send_notifications(req: NotifyRequest):
    """
    Fires all three alerts simultaneously:
      1. Hospital ER — tells them the patient is coming and what to prepare
      2. Family SMS  — tells family which hospital and ETA
      3. Police PCR  — only for P1 road accidents, requests traffic clearance
    Call this right after the route is displayed to the user.
    """
    try:
        hospital = matcher.get_hospital(req.hospital_id).to_dict()
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Hospital {req.hospital_id} not found")

    send_hospital_alert(hospital, req.patient_info, req.route)

    family_status = "skipped"
    if req.family_phone:
        send_family_sms(req.family_phone, hospital, req.route)
        family_status = "sent"

    police_result = send_police_alert(
        req.patient_lat, req.patient_lng,
        req.patient_info.get("severity", "P3"),
        req.incident_type,
    )

    actions = _get_required_actions(req.patient_info)

    return {
        "hospital_alert":   "sent",
        "family_sms":       family_status,
        "police_alert":     police_result["status"],
        "actions_prepared": actions,
        "timestamp":        datetime.now().isoformat(),
    }
```

---

### Step 6 — Start the server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Now open `http://localhost:8000/docs` in your browser. You will see an interactive playground where you can test every endpoint without writing any frontend code. This is invaluable for testing — use it before touching the frontend at all.

---

### How the Scoring Formula Works

The `hospital_matcher.py` service scores every hospital out of roughly 100 points. Higher score = better match.

```
Score =

  35 pts  — Speciality match
              Full 35 if the hospital has exactly the required speciality.
              22 pts if it's a trauma/emergency case and the hospital has a trauma centre.
              5 pts minimum (any ER can stabilise).

  20 pts  — ICU bed availability
              min(20, icu_beds_free × 1.8)
              A hospital with 11+ free ICU beds gets the full 20 pts.
              A hospital with 0 free ICU beds gets 0 pts.

  20 pts  — Proximity (closer = more points)
              max(0, 20 - distance_km × 1.5)
              A hospital 0 km away = 20 pts.
              A hospital 13+ km away = 0 pts.

  10 pts  — Hospital rating
              rating × 2  (rating is out of 5, so max = 10 pts)

  10 pts  — ER wait time (lower wait = more points)
              max(0, 10 - avg_er_wait_min × 0.2)
              A hospital with 0 min wait = 10 pts.
              A hospital with 50+ min wait = 0 pts.

   5 pts  — Trauma centre bonus (only for P1 patients)

   3 pts  — Blood bank available

   2 pts  — At least one general bed free
```

---

## Frontend Guide

### Step 1 — Create the React app

```bash
npx create-react-app rapidcare-frontend
cd rapidcare-frontend
npm install axios leaflet react-leaflet lucide-react
```

If you are using Vite instead of Create React App:

```bash
npm create vite@latest rapidcare-frontend -- --template react
cd rapidcare-frontend
npm install axios leaflet react-leaflet lucide-react
```

---

### Step 2 — Write the API client

Keep every single API call in one file. Never write `axios.get(...)` or `fetch(...)` directly inside a component. This makes it easy to change the base URL later or add auth headers globally.

```javascript
// frontend/src/api/client.js

import axios from 'axios';

// In development this is http://localhost:8000/api
// In production replace with your deployed backend URL
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,  // 15 second timeout — emergencies can't wait
    headers: { 'Content-Type': 'application/json' },
});

// ── Step 2 of the flow ──────────────────────────────────────────
// Takes the patient form data, returns severity + speciality
export const runTriage = (data) =>
    api.post('/triage', {
        complaint: data.complaint,
        vitals:    data.vitals    || '',
        history:   data.history   || 'None',
        age:       data.age       || null,
        gender:    data.gender    || null,
    });

// ── Step 3 of the flow ──────────────────────────────────────────
// Takes triage result + patient GPS, returns top 5 hospitals ranked
export const getHospitalRecommendations = (patientLat, patientLng, speciality, severity) =>
    api.get('/hospitals/recommend', {
        params: {
            patient_lat: patientLat,
            patient_lng: patientLng,
            speciality:  speciality,
            severity:    severity,
            top_n:       5,
        }
    });

// ── Used on page load for map ────────────────────────────────────
// Returns all 50 hospitals to draw grey pins on the map
export const getAllHospitals = () =>
    api.get('/hospitals');

// ── Step 5 of the flow ──────────────────────────────────────────
// Takes patient + hospital, returns route with waypoints + ETA
export const getRoute = (patientLat, patientLng, hospitalId, severity) =>
    api.post('/route', {
        patient_lat: patientLat,
        patient_lng: patientLng,
        hospital_id: hospitalId,
        severity:    severity,
    });

// ── Step 4 of the flow ──────────────────────────────────────────
// Fires ER alert + SMS + police. Call this after route is shown.
export const sendNotifications = (payload) =>
    api.post('/notify', payload);
```

---

### Step 3 — App state and structure

The entire app is one page with progressive steps. All shared state lives in `App.jsx`. Components receive what they need as props.

```jsx
// frontend/src/App.jsx

import { useState, useEffect } from 'react';
import { getAllHospitals } from './api/client';
import PatientForm   from './components/PatientForm';
import TriageResult  from './components/TriageResult';
import HospitalList  from './components/HospitalList';
import MapView       from './components/MapView';
import RouteInfoBar  from './components/RouteInfoBar';
import NotifPanel    from './components/NotifPanel';

// Step numbers
// 1 = form visible, nothing else
// 2 = triage result shown
// 3 = hospital list shown
// 4 = route + map shown

export default function App() {
    const [step,             setStep]             = useState(1);
    const [patientCoords,    setPatientCoords]    = useState({ lat: 28.6139, lng: 77.2090 });
    const [formData,         setFormData]         = useState({});
    const [triageResult,     setTriageResult]     = useState(null);
    const [hospitals,        setHospitals]        = useState([]);
    const [allHospitals,     setAllHospitals]     = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [route,            setRoute]            = useState(null);
    const [loading,          setLoading]          = useState(false);

    // Load all hospital pins when page opens
    useEffect(() => {
        getAllHospitals()
            .then(res => setAllHospitals(res.data.hospitals))
            .catch(console.error);
    }, []);

    const handleTriageComplete = (triage, topHospitals, coords, form) => {
        setTriageResult(triage);
        setHospitals(topHospitals);
        setPatientCoords(coords);
        setFormData(form);
        setStep(3);
    };

    const handleHospitalSelect = (hospital, routeData) => {
        setSelectedHospital(hospital);
        setRoute(routeData);
        setStep(4);
    };

    const handleReset = () => {
        setStep(1);
        setTriageResult(null);
        setHospitals([]);
        setSelectedHospital(null);
        setRoute(null);
        setFormData({});
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', height: '100vh', overflow: 'hidden' }}>

            {/* LEFT — form + progressive results */}
            <div style={{ overflowY: 'auto', borderRight: '1px solid #e5e7eb', background: '#fff' }}>

                {/* Step indicator */}
                <StepIndicator current={step} />

                {/* Step 1 — always visible */}
                <PatientForm
                    onComplete={handleTriageComplete}
                    onReset={handleReset}
                />

                {/* Step 2+ — appear progressively */}
                {step >= 2 && <TriageResult result={triageResult} />}
                {step >= 3 && (
                    <HospitalList
                        hospitals={hospitals}
                        requiredSpeciality={triageResult?.speciality}
                        patientCoords={patientCoords}
                        patientInfo={formData}
                        severity={triageResult?.severity}
                        onSelect={handleHospitalSelect}
                    />
                )}
                {step >= 4 && <NotifPanel hospital={selectedHospital} />}
            </div>

            {/* RIGHT — map (always visible) */}
            <div style={{ position: 'relative', background: '#f3f4f6' }}>
                <MapView
                    allHospitals={allHospitals}
                    recommendedHospitals={step >= 3 ? hospitals : []}
                    selectedHospital={selectedHospital}
                    patientCoords={patientCoords}
                    route={route}
                    showPatient={step >= 3}
                />
                {step >= 4 && route && <RouteInfoBar route={route} />}
            </div>

        </div>
    );
}
```

---

### Step 4 — PatientForm component

The form is the most important component. Keep it clean and fast to fill in — this is being used in an emergency.

```jsx
// frontend/src/components/PatientForm.jsx

import { useState, useEffect } from 'react';
import { runTriage, getHospitalRecommendations } from '../api/client';

const INCIDENT_TYPES = [
    'Road accident', 'Medical emergency', 'Home accident',
    'Workplace injury', 'Natural causes',
];
const HISTORY_OPTIONS = [
    'None', 'Hypertension', 'Diabetes', 'Heart disease',
    'Asthma', 'COPD', 'CKD', 'Epilepsy',
];
const BLOOD_GROUPS = ['Unknown', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function PatientForm({ onComplete, onReset }) {
    const [form, setForm] = useState({
        complaint:     '',
        vitals:        '',
        history:       'None',
        age:           '',
        gender:        '',
        blood_group:   'Unknown',
        incident_type: 'Medical emergency',
        family_phone:  '',
    });
    const [coords,       setCoords]       = useState({ lat: 28.6139, lng: 77.2090 });
    const [locationMsg,  setLocationMsg]  = useState('Using Delhi centre as default');
    const [loading,      setLoading]      = useState(false);
    const [error,        setError]        = useState('');

    // Get user GPS location silently on mount
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            pos => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationMsg('Using your current location ✓');
            },
            () => setLocationMsg('Location unavailable — using Delhi centre'),
            { timeout: 8000 }
        );
    }, []);

    const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.complaint.trim()) {
            setError('Please describe the patient condition.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            // API Call 1: triage
            const triageRes = await runTriage(form);
            const triage    = triageRes.data;

            // API Call 2: hospitals — uses the speciality from triage
            const hospRes   = await getHospitalRecommendations(
                coords.lat, coords.lng,
                triage.speciality,
                triage.severity,
            );

            // Pass everything up to App.jsx
            onComplete(triage, hospRes.data.hospitals, coords, {
                ...form,
                patient_lat: coords.lat,
                patient_lng: coords.lng,
            });
        } catch (err) {
            setError('Server error: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 4 }}>Patient Details</h2>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>{locationMsg}</p>

            {/* Age + Gender row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                    <label style={labelStyle}>Age</label>
                    <input type="number" placeholder="e.g. 45" value={form.age}
                           onChange={update('age')} style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>Gender</label>
                    <select value={form.gender} onChange={update('gender')} style={inputStyle}>
                        <option value="">Select</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </div>
            </div>

            {/* Blood group + Incident type row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                    <label style={labelStyle}>Blood Group</label>
                    <select value={form.blood_group} onChange={update('blood_group')} style={inputStyle}>
                        {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                    </select>
                </div>
                <div>
                    <label style={labelStyle}>Incident Type</label>
                    <select value={form.incident_type} onChange={update('incident_type')} style={inputStyle}>
                        {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* Condition description — the most important field */}
            <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>
                    Describe condition — Hindi or English, your own words *
                </label>
                <textarea
                    placeholder="e.g. Patient met with a road accident. He is unconscious, there is bleeding from the ear, BP is very low..."
                    value={form.complaint}
                    onChange={update('complaint')}
                    style={{ ...inputStyle, minHeight: 100, resize: 'vertical', lineHeight: 1.5 }}
                />
            </div>

            {/* Vitals */}
            <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Vitals (if known)</label>
                <input type="text" placeholder="e.g. BP 90/60, HR 140, SpO2 85%"
                       value={form.vitals} onChange={update('vitals')} style={inputStyle} />
            </div>

            {/* Medical history */}
            <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Past Medical History</label>
                <select value={form.history} onChange={update('history')} style={inputStyle}>
                    {HISTORY_OPTIONS.map(h => <option key={h}>{h}</option>)}
                </select>
            </div>

            {/* Family phone */}
            <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Family Phone (for SMS alert)</label>
                <input type="tel" placeholder="+91-9876543210"
                       value={form.family_phone} onChange={update('family_phone')} style={inputStyle} />
            </div>

            {error && (
                <p style={{ color: '#E8342A', fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                    width: '100%', padding: '13px', border: 'none', borderRadius: 10,
                    background: loading ? '#d1d5db' : '#E8342A',
                    color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                }}
            >
                {loading ? 'Analysing condition...' : 'Find Best Hospitals →'}
            </button>
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
```

---

### Step 5 — HospitalList component

```jsx
// frontend/src/components/HospitalList.jsx

import { useState } from 'react';
import { getRoute, sendNotifications } from '../api/client';

export default function HospitalList({ hospitals, requiredSpeciality, patientCoords, patientInfo, severity, onSelect }) {
    const [selected, setSelected] = useState(null);
    const [loading,  setLoading]  = useState(false);

    const handleConfirm = async () => {
        if (!selected) return;
        setLoading(true);
        try {
            // Get route to the selected hospital
            const routeRes = await getRoute(
                patientCoords.lat, patientCoords.lng,
                selected.hospital_id, severity,
            );

            // Fire notifications — don't await, let it happen in background
            sendNotifications({
                hospital_id:   selected.hospital_id,
                patient_info:  {
                    age:         patientInfo.age,
                    gender:      patientInfo.gender,
                    blood_group: patientInfo.blood_group,
                    severity:    severity,
                    speciality:  requiredSpeciality,
                    complaint:   patientInfo.complaint,
                    vitals:      patientInfo.vitals,
                },
                route:          routeRes.data,
                family_phone:   patientInfo.family_phone || null,
                incident_type:  patientInfo.incident_type,
                patient_lat:    patientCoords.lat,
                patient_lng:    patientCoords.lng,
            }).catch(console.error);

            onSelect(selected, routeRes.data);
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const maxScore = hospitals[0]?.match_score || 100;

    return (
        <div style={{ padding: '0 20px 20px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Top {hospitals.length} Hospitals</h3>

            {hospitals.map((h, i) => (
                <div
                    key={h.hospital_id}
                    onClick={() => setSelected(h)}
                    style={{
                        border: `1.5px solid ${selected?.hospital_id === h.hospital_id ? '#E8342A' : '#e5e7eb'}`,
                        background: selected?.hospital_id === h.hospital_id ? '#fff8f8' : '#fff',
                        borderRadius: 12, padding: 14, marginBottom: 10, cursor: 'pointer',
                        position: 'relative',
                    }}
                >
                    {/* Rank badge */}
                    <span style={{
                        position: 'absolute', top: 12, right: 12,
                        width: 24, height: 24, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                        background: selected?.hospital_id === h.hospital_id ? '#E8342A' : '#f3f4f6',
                        color: selected?.hospital_id === h.hospital_id ? '#fff' : '#6b7280',
                    }}>
                        {i + 1}
                    </span>

                    {/* Name + type */}
                    <div style={{ fontWeight: 700, fontSize: 14, paddingRight: 28 }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>
                        {h.type} · {h.distance_km} km away
                    </div>

                    {/* Status pills */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        <Pill text={`ICU: ${h.icu_beds_free} free`} color={h.icu_beds_free > 5 ? 'green' : h.icu_beds_free > 0 ? 'amber' : 'red'} />
                        <Pill text={`~${h.eta_min} min`} color="gray" />
                        <Pill text={`${h.rating}★`} color="gray" />
                        {h.has_trauma_centre === 'Yes' && <Pill text="Trauma" color="green" />}
                        {h.has_blood_bank    === 'Yes' && <Pill text="Blood Bank" color="gray" />}
                    </div>

                    {/* Speciality tags */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                        {h.specialities.map(s => (
                            <span key={s} style={{
                                padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                background: s === requiredSpeciality ? '#ede9fe' : '#f3f4f6',
                                color:      s === requiredSpeciality ? '#5b21b6' : '#6b7280',
                            }}>
                                {s}
                            </span>
                        ))}
                    </div>

                    {/* Match score bar */}
                    <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2 }}>
                        <div style={{
                            height: '100%', borderRadius: 2, background: '#E8342A',
                            width: `${Math.round(h.match_score / maxScore * 100)}%`,
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                        <span>Match score</span>
                        <span>{h.match_score} pts</span>
                    </div>
                </div>
            ))}

            <button
                onClick={handleConfirm}
                disabled={!selected || loading}
                style={{
                    width: '100%', padding: 12, border: 'none', borderRadius: 10, marginTop: 4,
                    background: !selected || loading ? '#d1d5db' : '#E8342A',
                    color: '#fff', fontWeight: 700, fontSize: 14,
                    cursor: !selected || loading ? 'not-allowed' : 'pointer',
                }}
            >
                {loading ? 'Getting route...' : selected ? `Notify ${selected.name} & Show Route →` : 'Select a hospital above'}
            </button>
        </div>
    );
}

function Pill({ text, color }) {
    const colors = {
        green: { bg: '#f0fdf4', text: '#16a34a' },
        amber: { bg: '#fffbeb', text: '#d97706' },
        red:   { bg: '#fff0ef', text: '#E8342A' },
        gray:  { bg: '#f3f4f6', text: '#6b7280' },
    };
    const c = colors[color] || colors.gray;
    return (
        <span style={{ padding: '3px 7px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text }}>
            {text}
        </span>
    );
}
```

---

### Step 6 — MapView component

Install Leaflet and react-leaflet. Note the two things that always trip people up with Leaflet in React — the CSS import and the icon fix. Both are required.

```bash
npm install leaflet react-leaflet
```

```jsx
// frontend/src/components/MapView.jsx

// REQUIRED: import Leaflet CSS or the map will render as a broken blank box
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';

// REQUIRED: fix broken marker icons in React (this is a known Leaflet + webpack bug)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl:       require('leaflet/dist/images/marker-icon.png'),
    shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

// Custom red icon for patient location
const patientIcon = new L.Icon({
    iconUrl:       'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconSize:      [25, 41],
    iconAnchor:    [12, 41],
    popupAnchor:   [1, -34],
});

// Custom green icon for selected hospital
const selectedHospIcon = new L.Icon({
    iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconSize:   [25, 41],
    iconAnchor: [12, 41],
    popupAnchor:[1, -34],
});

// Pans the map smoothly when selected hospital changes
function MapController({ center }) {
    const map = useMap();
    if (center) map.flyTo(center, 13, { duration: 1.2 });
    return null;
}

export default function MapView({ allHospitals, recommendedHospitals, selectedHospital, patientCoords, route, showPatient }) {
    const DELHI_CENTER = [28.6139, 77.2090];
    const mapCenter = selectedHospital
        ? [(patientCoords.lat + selectedHospital.lat) / 2, (patientCoords.lng + selectedHospital.lng) / 2]
        : DELHI_CENTER;

    // Build route polyline: patient → waypoints → hospital
    const routePoints = route ? [
        [patientCoords.lat, patientCoords.lng],
        ...(route.waypoints || []).map(wp => [wp.lat, wp.lng]),
        [selectedHospital.lat, selectedHospital.lng],
    ] : [];

    return (
        <MapContainer center={DELHI_CENTER} zoom={11} style={{ height: '100%', width: '100%' }}>
            {/* Map tiles — OpenStreetMap. Free. No API key. Works offline on cached tiles. */}
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'
            />

            {/* Auto-pan when hospital is selected */}
            {selectedHospital && (
                <MapController center={mapCenter} />
            )}

            {/* All 50 hospitals — grey pins */}
            {allHospitals.map(h => (
                <Marker key={h.hospital_id} position={[h.lat, h.lng]}>
                    <Popup>
                        <strong>{h.name}</strong><br />
                        {h.type} · ICU free: {h.icu_beds_free}<br />
                        Rating: {h.rating}★
                    </Popup>
                </Marker>
            ))}

            {/* Top 5 recommended hospitals — yellow circle highlight */}
            {recommendedHospitals.map(h => (
                <Circle key={`rec-${h.hospital_id}`}
                    center={[h.lat, h.lng]} radius={300}
                    color="#F59E0B" fillColor="#F59E0B" fillOpacity={0.2}
                />
            ))}

            {/* Selected hospital — green marker + larger circle */}
            {selectedHospital && (
                <>
                    <Marker position={[selectedHospital.lat, selectedHospital.lng]} icon={selectedHospIcon}>
                        <Popup>
                            <strong>{selectedHospital.name}</strong><br />
                            ICU free: {selectedHospital.icu_beds_free}<br />
                            ETA: ~{selectedHospital.eta_min} min<br />
                            📞 {selectedHospital.contact_number}
                        </Popup>
                    </Marker>
                    <Circle center={[selectedHospital.lat, selectedHospital.lng]}
                        radius={400} color="#16a34a" fillColor="#16a34a" fillOpacity={0.15} />
                </>
            )}

            {/* Patient location — red pulsing marker */}
            {showPatient && (
                <>
                    <Marker position={[patientCoords.lat, patientCoords.lng]} icon={patientIcon}>
                        <Popup>Patient location</Popup>
                    </Marker>
                    <Circle center={[patientCoords.lat, patientCoords.lng]}
                        radius={250} color="#E8342A" fillColor="#E8342A" fillOpacity={0.25} />
                </>
            )}

            {/* Route line — red dashed */}
            {routePoints.length > 0 && (
                <Polyline positions={routePoints}
                    color="#E8342A" weight={4} dashArray="10, 6" opacity={0.85} />
            )}
        </MapContainer>
    );
}
```

---

### Step 7 — RouteInfoBar and NotifPanel

```jsx
// frontend/src/components/RouteInfoBar.jsx

export default function RouteInfoBar({ route }) {
    if (!route) return null;
    const stats = [
        { value: route.distance_km,   unit: 'kilometres'   },
        { value: route.eta_min,       unit: 'minutes ETA'  },
        { value: route.traffic_level, unit: 'traffic'      },
        { value: route.via_highway,   unit: 'route via'    },
    ];
    if (route.green_corridor) {
        stats.push({ value: 'ACTIVE', unit: 'green corridor', highlight: true });
    }
    return (
        <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#fff', borderTop: '1px solid #e5e7eb',
            display: 'flex', gap: 8, padding: '12px 16px',
        }}>
            {stats.map(s => (
                <div key={s.unit} style={{
                    flex: 1, textAlign: 'center', padding: '8px 4px',
                    background: s.highlight ? '#f0fdf4' : '#f9fafb',
                    borderRadius: 8,
                }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: s.highlight ? '#16a34a' : '#E8342A' }}>
                        {s.value}
                    </div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{s.unit}</div>
                </div>
            ))}
        </div>
    );
}
```

```jsx
// frontend/src/components/NotifPanel.jsx

export default function NotifPanel({ hospital }) {
    if (!hospital) return null;
    return (
        <div style={{ padding: '16px 20px' }}>
            <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 12, padding: 16, textAlign: 'center',
            }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🏥</div>
                <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 15 }}>
                    Notification sent to {hospital.name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    ER team alerted · Bed being prepared · Staff on standby
                </div>
                <div style={{ fontSize: 12, color: '#374151', marginTop: 8, fontWeight: 600 }}>
                    📞 {hospital.contact_number}
                </div>
            </div>
        </div>
    );
}
```

---

```jsx
// frontend/src/components/TriageResult.jsx

export default function TriageResult({ result }) {
    if (!result) return null;
    const styles = {
        P1: { bg: '#fff0ef', border: '#fccac8', badge: '#E8342A' },
        P2: { bg: '#fffbeb', border: '#fde68a', badge: '#f59e0b' },
        P3: { bg: '#f0fdf4', border: '#bbf7d0', badge: '#16a34a' },
    };
    const s = styles[result.severity] || styles.P3;
    return (
        <div style={{
            margin: '0 20px 4px',
            background: s.bg, border: `1px solid ${s.border}`,
            borderRadius: 12, padding: '14px 16px',
        }}>
            <span style={{
                background: s.badge, color: '#fff',
                borderRadius: 6, padding: '2px 8px',
                fontSize: 11, fontWeight: 700, display: 'inline-block', marginBottom: 6,
            }}>
                {result.severity} — {result.severity_label}
            </span>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Required: {result.speciality}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{result.description}</div>
        </div>
    );
}
```

---

## API Reference

Quick reference for every endpoint. Test all of these at `http://localhost:8000/docs` before writing frontend code.

### POST /api/triage

**Request**
```json
{
  "complaint": "Patient had road accident. Unconscious. Bleeding from ear. BP very low.",
  "vitals":    "BP 90/60, HR 140, SpO2 85%",
  "history":   "None",
  "age":       34,
  "gender":    "Male"
}
```

**Response**
```json
{
  "severity":       "P1",
  "severity_label": "Critical",
  "severity_color": "#E8342A",
  "severity_icon":  "🚨",
  "speciality":     "Trauma Surgery",
  "confidence":     0.87,
  "description":    "Immediate life-threatening — golden hour is active",
  "method":         "ml_model"
}
```

---

### GET /api/hospitals/recommend

**Query params**: `patient_lat`, `patient_lng`, `speciality`, `severity`, `top_n` (default 5)

**Example URL**
```
GET /api/hospitals/recommend?patient_lat=28.62&patient_lng=77.21&speciality=Trauma%20Surgery&severity=P1
```

**Response**
```json
{
  "hospitals": [
    {
      "hospital_id":       "H010",
      "name":              "Safdarjung Hospital",
      "type":              "Trust",
      "lat":               28.63,
      "lng":               77.26,
      "distance_km":       2.4,
      "eta_min":           8,
      "traffic_level":     "Moderate",
      "icu_beds_free":     18,
      "general_beds_free": 14,
      "specialities":      ["Trauma Surgery", "Orthopaedics", "Neurology", "General Surgery"],
      "has_trauma_centre": "Yes",
      "has_blood_bank":    "Yes",
      "rating":            3.7,
      "avg_er_wait_min":   39,
      "contact_number":    "011-17037740",
      "match_score":       84.2,
      "rank":              1
    }
  ],
  "total_hospitals_checked": 50,
  "speciality_searched":     "Trauma Surgery",
  "severity":                "P1"
}
```

---

### GET /api/hospitals

No parameters. Returns all 50 hospitals for the map.

```json
{
  "hospitals": [ { "hospital_id": "H001", "name": "Apollo Hospital", "lat": 28.64, "lng": 77.37, ... } ],
  "total": 50
}
```

---

### POST /api/route

**Request**
```json
{
  "patient_lat": 28.62,
  "patient_lng": 77.21,
  "hospital_id": "H010",
  "severity":    "P1"
}
```

**Response**
```json
{
  "distance_km":     2.4,
  "eta_min":         8,
  "traffic_label":   "Morning peak",
  "traffic_level":   "High",
  "road_type":       "City arterial road",
  "via_highway":     "Ring Road",
  "green_corridor":  true,
  "waypoints": [
    { "lat": 28.621, "lng": 77.215 },
    { "lat": 28.626, "lng": 77.230 },
    { "lat": 28.629, "lng": 77.248 }
  ],
  "turn_by_turn": [
    "Head towards Ring Road from current location",
    "Take Ring Road towards the hospital zone",
    "Exit at hospital approach road",
    "Arrive at hospital emergency entrance"
  ],
  "patient_coords":  { "lat": 28.62, "lng": 77.21 },
  "hospital_coords": { "lat": 28.63, "lng": 77.26 }
}
```

---

### POST /api/notify

**Request**
```json
{
  "hospital_id":   "H010",
  "patient_info": {
    "age":         34,
    "gender":      "Male",
    "blood_group": "O+",
    "severity":    "P1",
    "speciality":  "Trauma Surgery",
    "complaint":   "Road accident, unconscious, head injury",
    "vitals":      "BP 90/60, HR 140"
  },
  "route": {
    "distance_km": 2.4,
    "eta_min":     8,
    "via_highway": "Ring Road"
  },
  "family_phone":  "+91-9876543210",
  "incident_type": "Road accident",
  "patient_lat":   28.62,
  "patient_lng":   77.21
}
```

**Response**
```json
{
  "hospital_alert":   "sent",
  "family_sms":       "sent",
  "police_alert":     "sent",
  "actions_prepared": [
    "Prepare ER bed",
    "Assign duty doctor",
    "ICU bed on standby",
    "Resuscitation team alert",
    "Trauma surgeon alert",
    "OT on standby",
    "Blood bank alert"
  ],
  "timestamp": "2024-11-14T10:32:00"
}
```

---

## Environment Variables

### backend/.env
```env
PORT=8000
DEBUG=true

# MSG91 SMS — register at msg91.com, create a transactional template
MSG91_API_KEY=your_key_here
MSG91_TEMPLATE_ID=your_template_id_here

# Google Maps — only needed if you replace route_engine.py simulation with real routing
GOOGLE_MAPS_API_KEY=your_key_here

# Database
DATABASE_URL=sqlite:///./rapidcare.db
```

### frontend/.env
```env
REACT_APP_API_URL=http://localhost:8000/api
```

---

## Running Locally

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
python train.py              # only needed once
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` — every endpoint is testable there with a visual form.

### Frontend
```bash
cd frontend
npm install
npm start                    # opens http://localhost:3000
```

---

## Common Errors & Fixes

**CORS error in browser console**
The React app and FastAPI server run on different ports. The browser blocks cross-port requests unless the backend explicitly allows them. Fix: make sure `CORSMiddleware` is added in `main.py` with `allow_origins=["http://localhost:3000"]`. If you're using Vite, also add `http://localhost:5173`.

**`ModuleNotFoundError: No module named 'services'`**
The `api/` files import from `services/`. Make sure both folders have an `__init__.py` file and you run the server from inside the `backend/` directory, not from the project root.

**`FileNotFoundError: ml_models/severity_model.pkl`**
You haven't run `train.py` yet. Run `python train.py` from inside `backend/` first.

**Leaflet map renders as a blank grey box**
You are missing the CSS import. Add `import 'leaflet/dist/leaflet.css'` at the top of `MapView.jsx`. This is required — without it, Leaflet renders nothing.

**Leaflet marker icons are broken (white squares)**
This is a known webpack + Leaflet bug. Add the `delete L.Icon.Default.prototype._getIconUrl` fix shown in the MapView component above.

**`Hospital H010 not found` (404)**
The hospital_id in the route request doesn't match any row in hospitals.csv. Make sure you're passing the `hospital_id` field from the recommendations response (e.g. `"H010"`), not the array index.

**Speciality not matching any hospital**
The speciality string is case-sensitive and must exactly match one of these 18 values: `Cardiology`, `Trauma Surgery`, `Neurology`, `Neurosurgery`, `Pulmonology`, `General Surgery`, `Paediatrics`, `Obstetrics`, `Orthopaedics`, `Nephrology`, `Plastic Surgery`, `Psychiatry`, `Endocrinology`, `Oncology`, `Vascular Surgery`, `Emergency Medicine`, `General Medicine`, `Urology`. The triage model always returns one of these exact strings so as long as you pass the value directly from the triage response you won't have this problem.

**SMS not sending**
The notification.py file currently prints to console instead of actually sending SMS. To activate real SMS, sign up at msg91.com, create a transactional SMS template, add your API key and template ID to `.env`, and replace the `print()` calls in `send_family_sms()` with the MSG91 HTTP API call.

---

*RapidCare — built for the hackathon, designed for India's golden hour.*
