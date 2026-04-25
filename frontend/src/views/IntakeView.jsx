import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getHospitalRecommendations, runTriage } from "../api/client";

const incidentTypes = [
  "Road accident",
  "Medical emergency",
  "Home accident",
  "Workplace injury",
  "Natural causes",
];

const historyOptions = [
  "None",
  "Hypertension",
  "Diabetes",
  "Heart disease",
  "Asthma",
  "COPD",
  "CKD",
  "Epilepsy",
];

const bloodGroups = ["Unknown", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function IntakeView({
  formData,
  setFormData,
  setTriageResult,
  setHospitals,
  setPatientCoords,
  setApiError,
  setIsLoading,
  isLoading,
  onAnalyzed,
}) {
  const [locationMsg, setLocationMsg] = useState("Detecting location...");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMsg("GPS unavailable - using Delhi center");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setPatientCoords(coords);
        setFormData((prev) => ({
          ...prev,
          patient_lat: coords.lat,
          patient_lng: coords.lng,
        }));
        setLocationMsg("GPS locked");
      },
      () => {
        setLocationMsg("GPS unavailable - using Delhi center");
      },
      { timeout: 8000 }
    );
  }, [setFormData, setPatientCoords]);

  const canSubmit = useMemo(() => formData.complaint?.trim().length > 10, [formData.complaint]);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async () => {
    if (!canSubmit) {
      setLocalError("Please enter chief complaint.");
      return;
    }

    setLocalError("");
    setApiError("");
    setIsLoading(true);

    const coords = {
      lat: formData.patient_lat || 28.6139,
      lng: formData.patient_lng || 77.209,
    };

    try {
      const triageRes = await runTriage(formData);
      const triage = triageRes.data;
      const hospitalRes = await getHospitalRecommendations(
        coords.lat,
        coords.lng,
        triage.speciality,
        triage.severity
      );

      setTriageResult(triage);
      setHospitals(hospitalRes.data.hospitals || []);
      setPatientCoords(coords);
      onAnalyzed();
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Failed to analyze.";
      setApiError(message);
      setLocalError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid h-full gap-3 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Patient Intake</p>
        <h2 className="mt-1 text-xl font-black text-white">Fast Emergency Entry</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Age">
            <input type="number" value={formData.age} onChange={updateField("age")} placeholder="45" className={inputClass} />
          </Field>
          <Field label="Gender">
            <select value={formData.gender} onChange={updateField("gender")} className={inputClass}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Blood Group">
            <select value={formData.blood_group} onChange={updateField("blood_group")} className={inputClass}>
              {bloodGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Incident Type">
            <select value={formData.incident_type} onChange={updateField("incident_type")} className={inputClass}>
              {incidentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Chief Complaint" className="mt-3">
          <textarea
            value={formData.complaint}
            onChange={updateField("complaint")}
            placeholder="Road accident, unconscious, ear bleeding..."
            className={`${inputClass} min-h-[120px] resize-y`}
          />
        </Field>

        <Field label="Vitals" className="mt-3">
          <input
            type="text"
            value={formData.vitals}
            onChange={updateField("vitals")}
            placeholder="BP 90/60, HR 140, SpO2 85%"
            className={inputClass}
          />
        </Field>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Medical History">
            <select value={formData.history} onChange={updateField("history")} className={inputClass}>
              {historyOptions.map((history) => (
                <option key={history} value={history}>
                  {history}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Family Phone">
            <input
              type="tel"
              value={formData.family_phone}
              onChange={updateField("family_phone")}
              placeholder="+91-9876543210"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
          <span>{locationMsg}</span>
          <span>
            {Number(formData.patient_lat || 28.6139).toFixed(4)}, {Number(formData.patient_lng || 77.209).toFixed(4)}
          </span>
        </div>

        {localError && <p className="mt-3 text-sm text-red-300">{localError}</p>}

        <motion.button
          type="button"
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          onClick={handleAnalyze}
          disabled={isLoading || !canSubmit}
          className="mt-4 w-full rounded-xl bg-[#E8342A] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#E8342A]/30 disabled:cursor-not-allowed disabled:opacity-60 transition"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
              Analyzing...
            </span>
          ) : (
            "Analyze and Find Hospitals"
          )}
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0.75 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#6366F1]/15 to-transparent p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">AI Feedback</p>
        
        {localError && (
          <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-xs font-semibold text-red-300">⚠️ Error</p>
            <p className="mt-1 text-sm text-red-200">{localError}</p>
          </div>
        )}

        {isLoading && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-300">Analyzing with ML model...</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-[#6366F1]"
                initial={{ width: "20%" }}
                animate={{ width: ["20%", "65%", "45%", "72%"] }}
                transition={{ repeat: Infinity, duration: 2.4 }}
              />
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Severity Assessment</p>
            <p className="mt-2 text-lg font-extrabold text-white">
              {formData.complaint?.trim().length > 10 ? "Ready to analyze" : "Enter chief complaint to begin"}
            </p>
            {formData.complaint?.trim().length > 10 && (
              <p className="mt-2 text-xs text-slate-300">
                ✓ Complaint captured ({formData.complaint.length} characters)
                <br />
                Click analyze to run ML triage
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/35";

export default IntakeView;
