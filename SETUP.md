# RapidCare — Full Stack Setup & Deployment

## Project Overview

RapidCare is a production-grade MERN web application for emergency hospital routing in ambulances. It uses AI-powered triage to recommend the best hospital based on patient condition, location, and available resources.

**Architecture:**
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion + Leaflet Maps
- **Backend**: Node.js + Express.js with CORS
- **State Management**: React Hooks
- **API Integration**: Axios with centralized client

---

## Full Stack Startup Guide

### Prerequisites

- Node.js 18+ (download from nodejs.org)
- npm 9+ (comes with Node.js)
- Git (optional, for version control)
- Browser with geolocation support (Chrome, Firefox, Safari, Edge)

### Step 1: Clone or Download the Project

```bash
cd "New folder (3)"
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 4: Start Backend Server

**Terminal 1:**
```bash
cd backend
npm run dev
```

You should see:
```
RapidCare backend running on http://localhost:8000
```

### Step 5: Start Frontend Dev Server

**Terminal 2:**
```bash
cd frontend
npm run dev
```

You should see:
```
VITE ready on http://localhost:5173 (or 5174/5175 if port is in use)
```

### Step 6: Open the App

Go to the URL shown in Terminal 2 (e.g., http://localhost:5173/) in your browser.

---

## Full User Flow

### 1. **Intake Screen** (Patient Details)
- Enter patient age, gender, blood group
- Describe condition in plain text or Hindi
- Enter vitals (optional but recommended)
- Select medical history and incident type
- Click "Analyze and Find Hospitals"

**Behind the scenes:**
- Geolocation captured automatically
- POST /api/triage analyzes condition text
- GET /api/hospitals/recommend scores all hospitals
- Top 5 hospitals ranked by suitability

### 2. **Decision Screen** (Hospital Selection)
- AI banner shows severity (P1 Critical / P2 Urgent / P3 Stable) and specialty
- 5 hospital cards ranked by match score
- Each card shows: ETA, ICU beds, rating, specialties, distance
- Click a hospital to select
- Click "Confirm and Start Route" to proceed

**Behind the scenes:**
- POST /api/route calculates fastest route + waypoints
- POST /api/notify sends alerts:
  - Hospital ER team alert
  - Family SMS (if phone provided)
  - Police notification (if P1 road accident)

### 3. **Route Screen** (Execution)
- Full-screen map with patient location (red) and hospital (green)
- Route polyline drawn from patient to hospital
- Floating panel shows:
  - ETA in minutes
  - Distance in km
  - Traffic level
  - Notification status (sent/pending)

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/triage` | POST | Analyze patient condition, return severity + specialty |
| `/api/hospitals` | GET | Get all 50 hospitals for map |
| `/api/hospitals/recommend` | GET | Get top 5 hospitals ranked for patient |
| `/api/route` | POST | Calculate fastest route to hospital |
| `/api/notify` | POST | Send alerts to hospital, family, police |

### Example Payloads

**POST /api/triage**
```json
{
  "complaint": "Road accident, unconscious, ear bleeding",
  "vitals": "BP 90/60, HR 140, SpO2 85%",
  "history": "Hypertension",
  "age": 34,
  "gender": "Male"
}
```

**Response:**
```json
{
  "severity": "P1",
  "severity_label": "Critical",
  "speciality": "Trauma Surgery",
  "confidence": 0.81,
  "description": "Immediate life-threatening - golden hour active"
}
```

---

## Environment Variables

### Backend (.env)

```env
PORT=8000
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Production Deployment

### Frontend Build

```bash
cd frontend
npm run build
```

Output: `frontend/dist/` folder ready for any static host (Vercel, Netlify, AWS S3, etc.)

### Backend Deployment

```bash
cd backend
npm start
```

Deploy to: Heroku, Railway, Render, DigitalOcean App Platform, AWS EC2, etc.

**Update FRONTEND_ORIGINS in .env for production URLs.**

---

## Troubleshooting

### "Backend not working"
- Check backend terminal for errors
- Verify http://localhost:8000/ returns 200 status
- Ensure both servers are running

### "APIs returning 404"
- Check API URL in frontend .env: `VITE_API_URL=http://localhost:8000/api`
- Verify backend port matches (default 8000)
- Restart frontend after changing .env

### "CORS errors in browser console"
- Backend CORS middleware checks FRONTEND_ORIGINS
- Add your frontend URL to backend .env if deploying

### "Map not loading / blank"
- Check browser console for Leaflet errors
- Verify react-leaflet CSS is imported in MapView.jsx
- Zoom in/out on map to trigger render

### "Geolocation not working"
- App requires HTTPS for geolocation in production
- Use HTTPS in .env for production frontend
- On localhost, browser allows geolocation without HTTPS

---

## Future: ML Integration

To replace the heuristic triage with real ML:

1. Train ML model (Python scikit-learn, TensorFlow, etc.)
2. Expose model as FastAPI endpoint
3. Update backend to call ML endpoint instead of heuristic
4. Or use pre-trained model via API (Azure ML, AWS SageMaker, custom)

**ML Endpoint Contract:**
```json
POST /api/ml/predict
{
  "complaint": "string",
  "vitals": "string",
  "history": "string"
}

Response:
{
  "severity": "P1|P2|P3",
  "speciality": "string",
  "confidence": 0.0-1.0
}
```

---

## File Structure

```
RapidCare/
├── backend/
│   ├── src/
│   │   ├── server.js           (Express app + all endpoints)
│   │   ├── utils.js            (Distance & ETA helpers)
│   │   └── data/
│   │       └── hospitals.js    (Hospital database)
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             (Root component, state management)
│   │   ├── main.jsx            (React entry)
│   │   ├── index.css           (Global styles)
│   │   ├── api/
│   │   │   └── client.js       (Axios API client)
│   │   ├── views/
│   │   │   ├── IntakeView.jsx  (Patient form)
│   │   │   ├── DecisionView.jsx (Hospital selection)
│   │   │   └── RouteView.jsx   (Route execution)
│   │   └── components/
│   │       ├── MapView.jsx     (Leaflet map)
│   │       ├── RoutePanel.jsx  (Route info overlay)
│   │       ├── HospitalCard.jsx (Hospital card)
│   │       ├── AIBanner.jsx    (Triage result banner)
│   │       └── ...
│   ├── package.json
│   ├── .env
│   └── vite.config.js
│
└── RAPIDCARE_README.md         (Full technical docs)
```

---

## Key Features Implemented

✅ **Real-time GPS detection** — Automatic patient location capture  
✅ **AI-powered triage** — Severity + specialty classification  
✅ **Hospital ranking** — Multi-factor scoring algorithm  
✅ **Interactive maps** — Leaflet with route visualization  
✅ **Fast routing** — ETA + traffic level calculation  
✅ **Multi-alert system** — Hospital + family + police notifications  
✅ **Responsive UI** — Works on mobile, tablet, desktop  
✅ **Dark theme** — High-contrast glassmorphic design  
✅ **Smooth animations** — Framer Motion transitions  
✅ **Error recovery** — Retry flows for all API calls  

---

## Support & Documentation

- **API Docs**: http://localhost:8000/api (while running)
- **Frontend Dev**: http://localhost:5173
- **Tech Stack**: React 18, Express.js, Leaflet, Tailwind CSS, Framer Motion

---

*RapidCare — Every second counts. Route ambulances to the right hospital, the right way, the right time.*
