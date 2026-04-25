import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import IntakeView from "./views/IntakeView";
import DecisionView from "./views/DecisionView";
import RouteView from "./views/RouteView";
import { getAllHospitals } from "./api/client";

const viewMeta = {
  intake: { label: "Intake", step: "01" },
  decision: { label: "Decision", step: "02" },
  route: { label: "Route", step: "03" },
};

function App() {
  const [view, setView] = useState("intake");
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    blood_group: "Unknown",
    complaint: "",
    vitals: "",
    history: "None",
    family_phone: "",
    incident_type: "Medical emergency",
    patient_lat: 28.6139,
    patient_lng: 77.209,
  });
  const [patientCoords, setPatientCoords] = useState({ lat: 28.6139, lng: 77.209 });
  const [triageResult, setTriageResult] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [allHospitals, setAllHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [route, setRoute] = useState(null);
  const [notificationState, setNotificationState] = useState(null);
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const activeMeta = useMemo(() => viewMeta[view], [view]);

  useEffect(() => {
    getAllHospitals()
      .then((response) => setAllHospitals(response.data.hospitals || []))
      .catch(() => setAllHospitals([]));
  }, []);

  const handleBack = () => {
    if (view === "route") {
      setView("decision");
      return;
    }
    if (view === "decision") {
      setView("intake");
    }
  };

  const handleReset = () => {
    setView("intake");
    setFormData({
      age: "",
      gender: "",
      blood_group: "Unknown",
      complaint: "",
      vitals: "",
      history: "None",
      family_phone: "",
      incident_type: "Medical emergency",
      patient_lat: 28.6139,
      patient_lng: 77.209,
    });
    setPatientCoords({ lat: 28.6139, lng: 77.209 });
    setTriageResult(null);
    setHospitals([]);
    setSelectedHospital(null);
    setRoute(null);
    setNotificationState(null);
    setApiError("");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 selection:bg-[#E8342A]/40 selection:text-white">
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 15% 10%, rgba(99,102,241,0.24), transparent 45%), radial-gradient(circle at 90% 85%, rgba(232,52,42,0.2), transparent 42%)",
        }}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:mb-8 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                RapidCare Command
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-white sm:text-3xl">
                Ambulance Decision Console
              </h1>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-3 py-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#16A34A]" />
              <p className="text-sm font-semibold text-slate-200">Live Dispatch Link</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5">
              <span className="text-xs font-medium text-slate-300">Active View</span>
              <span className="rounded-lg bg-[#E8342A] px-2 py-1 text-xs font-bold tracking-wide text-white">
                {activeMeta.step} {activeMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={view === "intake"}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl bg-[#6366F1] px-3 py-2 text-sm font-bold text-white shadow-lg shadow-[#6366F1]/30 transition hover:brightness-110"
              >
                New Case
              </button>
            </div>
          </div>
        </header>

        <section className="relative flex-1 overflow-hidden rounded-3xl border border-white/15 bg-slate-900/35 p-3 shadow-2xl backdrop-blur-xl sm:p-4">
          {(isLoading || apiError) && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs">
              <span className="text-slate-200">{isLoading ? "Processing live emergency data..." : "Ready"}</span>
              {apiError && <span className="font-semibold text-red-300">{apiError}</span>}
            </div>
          )}
          <AnimatePresence mode="wait">
            {view === "intake" && (
              <motion.div
                key="intake"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.42, ease: "easeOut" }}
                className="h-full"
              >
                <IntakeView
                  formData={formData}
                  setFormData={setFormData}
                  setTriageResult={setTriageResult}
                  setHospitals={setHospitals}
                  setPatientCoords={setPatientCoords}
                  setApiError={setApiError}
                  setIsLoading={setIsLoading}
                  isLoading={isLoading}
                  onAnalyzed={() => setView("decision")}
                />
              </motion.div>
            )}

            {view === "decision" && (
              <motion.div
                key="decision"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.42, ease: "easeOut" }}
                className="h-full"
              >
                <DecisionView
                  triageResult={triageResult}
                  hospitals={hospitals}
                  selectedHospital={selectedHospital}
                  setSelectedHospital={setSelectedHospital}
                  setRoute={setRoute}
                  formData={formData}
                  patientCoords={patientCoords}
                  allHospitals={allHospitals}
                  setNotificationState={setNotificationState}
                  setApiError={setApiError}
                  setIsLoading={setIsLoading}
                  isLoading={isLoading}
                  onConfirmSelection={() => setView("route")}
                />
              </motion.div>
            )}

            {view === "route" && (
              <motion.div
                key="route"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.42, ease: "easeOut" }}
                className="h-full"
              >
                <RouteView
                  route={route}
                  selectedHospital={selectedHospital}
                  triageResult={triageResult}
                  patientCoords={patientCoords}
                  allHospitals={allHospitals}
                  notificationState={notificationState}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

export default App;