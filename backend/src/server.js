const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const hospitals = require("./data/hospitals");
const { haversineDistanceKm, estimateEtaMinutes, estimateTraffic } = require("./utils");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8000);
const originCsv = process.env.FRONTEND_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:3000";
const allowedOrigins = originCsv.split(",").map((item) => item.trim());

const allowedOriginSet = new Set(allowedOrigins);
const localhostOriginRegex = /^http:\/\/localhost:\d+$/;

function normalizeTriageResult(result = {}) {
  const severity = String(result.severity || "P3").toUpperCase();
  const severityConfig = {
    P1: { label: "Critical", icon: "🚨", color: "#E8342A", description: "Immediate life-threatening - golden hour active" },
    P2: { label: "Urgent", icon: "⚠️", color: "#F59E0B", description: "Urgent intervention needed" },
    P3: { label: "Stable", icon: "✅", color: "#16A34A", description: "Stable - monitor and route safely" }
  };

  const tone = severityConfig[severity] || severityConfig.P3;

  return {
    severity,
    severity_label: result.severity_label || tone.label,
    severity_color: result.severity_color || tone.color,
    severity_icon: result.severity_icon || tone.icon,
    speciality: result.speciality || "General Medicine",
    confidence: Number(result.confidence ?? 0.8),
    description: result.description || tone.description,
    method: result.method || "ml_api"
  };
}

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOriginSet.has(origin) || localhostOriginRegex.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    }
  })
);
app.use(express.json());

function triageHeuristic(complaint = "", vitals = "", history = "") {
  const text = `${complaint} ${vitals} ${history}`.toLowerCase();

  let severity = "P3";
  let severity_label = "Stable";
  let severity_icon = "✅";
  let description = "Stable - monitor and route safely";
  let speciality = "General Medicine";

  const criticalWords = ["unconscious", "bleeding", "no pulse", "cardiac arrest", "stroke", "head injury"];
  const urgentWords = ["chest pain", "breathless", "fracture", "severe pain", "high fever", "seizure"];

  if (criticalWords.some((word) => text.includes(word))) {
    severity = "P1";
    severity_label = "Critical";
    severity_icon = "🚨";
    description = "Immediate life-threatening - golden hour active";
  } else if (urgentWords.some((word) => text.includes(word))) {
    severity = "P2";
    severity_label = "Urgent";
    severity_icon = "⚠️";
    description = "Urgent intervention needed";
  }

  if (text.includes("accident") || text.includes("trauma") || text.includes("bleeding")) {
    speciality = "Trauma Surgery";
  } else if (text.includes("chest") || text.includes("heart") || text.includes("cardiac")) {
    speciality = "Cardiology";
  } else if (text.includes("stroke") || text.includes("seizure") || text.includes("head")) {
    speciality = "Neurology";
  } else if (text.includes("breath") || text.includes("asthma") || text.includes("spo2")) {
    speciality = "Pulmonology";
  }

  return {
    severity,
    severity_label,
    severity_color: severity === "P1" ? "#E8342A" : severity === "P2" ? "#F59E0B" : "#16A34A",
    severity_icon,
    speciality,
    confidence: 0.81,
    description,
    method: "heuristic_fallback"
  };
}

function scoreHospital(hospital, input) {
  const distanceKm = haversineDistanceKm(input.patient_lat, input.patient_lng, hospital.lat, hospital.lng);
  const etaMin = estimateEtaMinutes(distanceKm, input.severity);
  const trafficLevel = estimateTraffic(etaMin);

  let score = 0;

  if (hospital.specialities.includes(input.speciality)) {
    score += 35;
  } else if (input.severity === "P1" && hospital.has_trauma_centre === "Yes") {
    score += 22;
  } else {
    score += 5;
  }

  score += Math.min(20, hospital.icu_beds_free * 1.8);
  score += Math.max(0, 20 - distanceKm * 1.5);
  score += hospital.rating * 2;
  score += Math.max(0, 10 - hospital.avg_er_wait_min * 0.2);

  if (input.severity === "P1" && hospital.has_trauma_centre === "Yes") {
    score += 5;
  }
  if (hospital.has_blood_bank === "Yes") {
    score += 3;
  }
  if (hospital.general_beds_free > 0) {
    score += 2;
  }

  return {
    ...hospital,
    distance_km: Number(distanceKm.toFixed(1)),
    eta_min: etaMin,
    traffic_level: trafficLevel,
    match_score: Number(score.toFixed(1))
  };
}

app.get("/", (_req, res) => {
  res.json({ status: "RapidCare backend running", docs: "/api" });
});

app.get("/api", (_req, res) => {
  res.json({
    endpoints: ["POST /api/triage", "GET /api/hospitals", "GET /api/hospitals/recommend", "POST /api/route", "POST /api/notify"]
  });
});

app.post("/api/triage", async (req, res) => {
  const { complaint, vitals, history, age, gender } = req.body || {};
  if (!complaint || !String(complaint).trim()) {
    return res.status(400).json({ detail: "complaint is required" });
  }

  const mlApiUrl = process.env.ML_API_URL || "https://rapidcare-api.onrender.com";

  try {
    // The ML service expects /triage with chief_complaint key.
    const mlResponse = await axios.post(
      `${mlApiUrl}/triage`,
      { chief_complaint: complaint, vitals: vitals || "", history: history || "None", age, gender },
      { timeout: 8000 }
    );

    return res.json(normalizeTriageResult(mlResponse.data));
  } catch (mlError) {
    console.warn("ML API failed, falling back to heuristic:", mlError.message);

    // Fall back to local heuristic
    return res.json(triageHeuristic(complaint, vitals, history));
  }
});

app.get("/api/hospitals", (_req, res) => {
  const compact = hospitals.map((h) => ({
    hospital_id: h.hospital_id,
    name: h.name,
    lat: h.lat,
    lng: h.lng,
    type: h.type,
    icu_beds_free: h.icu_beds_free,
    specialities: h.specialities,
    rating: h.rating
  }));

  res.json({ hospitals: compact, total: compact.length });
});

app.get("/api/hospitals/recommend", (req, res) => {
  const patient_lat = Number(req.query.patient_lat);
  const patient_lng = Number(req.query.patient_lng);
  const speciality = String(req.query.speciality || "General Medicine");
  const severity = String(req.query.severity || "P1");
  const top_n = Math.max(1, Math.min(10, Number(req.query.top_n || 5)));

  if (!Number.isFinite(patient_lat) || !Number.isFinite(patient_lng)) {
    return res.status(400).json({ detail: "patient_lat and patient_lng are required numeric query params" });
  }

  const scored = hospitals
    .map((hospital) => scoreHospital(hospital, { patient_lat, patient_lng, speciality, severity }))
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, top_n)
    .map((hospital, index) => ({ ...hospital, rank: index + 1 }));

  return res.json({
    hospitals: scored,
    total_hospitals_checked: hospitals.length,
    speciality_searched: speciality,
    severity
  });
});

app.post("/api/route", (req, res) => {
  const { patient_lat, patient_lng, hospital_id, severity = "P1" } = req.body || {};

  const lat = Number(patient_lat);
  const lng = Number(patient_lng);
  const hospital = hospitals.find((item) => item.hospital_id === hospital_id);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !hospital_id) {
    return res.status(400).json({ detail: "patient_lat, patient_lng and hospital_id are required" });
  }
  if (!hospital) {
    return res.status(404).json({ detail: `Hospital ${hospital_id} not found` });
  }

  const distanceKm = haversineDistanceKm(lat, lng, hospital.lat, hospital.lng);
  const etaMin = estimateEtaMinutes(distanceKm, severity);

  const waypoints = [
    { lat: Number((lat + (hospital.lat - lat) * 0.33).toFixed(6)), lng: Number((lng + (hospital.lng - lng) * 0.33).toFixed(6)) },
    { lat: Number((lat + (hospital.lat - lat) * 0.66).toFixed(6)), lng: Number((lng + (hospital.lng - lng) * 0.66).toFixed(6)) }
  ];

  return res.json({
    distance_km: Number(distanceKm.toFixed(1)),
    eta_min: etaMin,
    traffic_label: etaMin > 18 ? "Peak traffic" : "Smooth corridor",
    traffic_level: estimateTraffic(etaMin),
    road_type: "City arterial road",
    via_highway: "Ring Road",
    green_corridor: severity === "P1",
    waypoints,
    turn_by_turn: [
      "Proceed to nearest arterial road",
      "Take Ring Road towards hospital zone",
      "Exit near emergency gate",
      "Arrive at emergency entrance"
    ],
    patient_coords: { lat, lng },
    hospital_coords: { lat: hospital.lat, lng: hospital.lng }
  });
});

app.post("/api/notify", (req, res) => {
  const { hospital_id, patient_info = {}, route = {}, family_phone, incident_type = "Medical emergency" } = req.body || {};
  const hospital = hospitals.find((item) => item.hospital_id === hospital_id);

  if (!hospital) {
    return res.status(404).json({ detail: `Hospital ${hospital_id} not found` });
  }

  const severity = patient_info.severity || "P3";
  const isRoadCritical = severity === "P1" && String(incident_type).toLowerCase().includes("road");

  return res.json({
    hospital_alert: "sent",
    family_sms: family_phone ? "sent" : "skipped",
    police_alert: isRoadCritical ? "sent" : "skipped",
    actions_prepared: [
      "Prepare ER bed",
      "Assign duty doctor",
      severity === "P1" ? "ICU bed on standby" : "Triage bay prepared",
      route.eta_min <= 10 ? "Immediate handover protocol" : "Standard handover protocol"
    ],
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`RapidCare backend running on http://localhost:${port}`);
});
