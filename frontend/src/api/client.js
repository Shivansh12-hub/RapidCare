import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_URL ||
  "https://rapidcare-7vs4.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export const runTriage = (data) =>
  api.post("/triage", {
    complaint: data.complaint,
    vitals: data.vitals || "",
    history: data.history || "None",
    age: data.age ? Number(data.age) : null,
    gender: data.gender || null,
  });

export const getHospitalRecommendations = (patientLat, patientLng, speciality, severity) =>
  api.get("/hospitals/recommend", {
    params: {
      patient_lat: patientLat,
      patient_lng: patientLng,
      speciality,
      severity,
      top_n: 5,
    },
  });

export const getAllHospitals = () => api.get("/hospitals");

export const getRoute = (patientLat, patientLng, hospitalId, severity) =>
  api.post("/route", {
    patient_lat: patientLat,
    patient_lng: patientLng,
    hospital_id: hospitalId,
    severity,
  });

export const sendNotifications = (payload) => api.post("/notify", payload);

export default api;
