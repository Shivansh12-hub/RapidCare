import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import IntakeView from "./views/IntakeView";
import DecisionView from "./views/DecisionView";
import RouteView from "./views/RouteView";
import api from "./api/client";

const viewOrder = ["intake", "decision", "route"];

const pageTransition = {
  initial: { opacity: 0, y: 10, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, filter: "blur(6px)", transition: { duration: 0.25, ease: "easeIn" } }
};

export default function App() {
  const [view, setView] = useState("intake");
  const [isBusy, setIsBusy] = useState(false);

  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    gender: "",
    bloodGroup: "",
    complaint: "",
    incidentType: "",
    vitals: {
      pulse: "",
      oxygen: "",
      systolic: "",
      diastolic: ""
    },
    location: {
      lat: null,
      lng: null,
      address: ""
    }
  });

  const [triageResult, setTriageResult] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [route, setRoute] = useState(null);

  const progressIndex = useMemo(() => viewOrder.indexOf(view), [view]);

  const handleAnalyze = async (nextFormData) => {
    setIsBusy(true);
    setFormData(nextFormData);

    try {
      const triageResponse = await api.post("/api/triage", {
        ...nextFormData
      });

      const triagePayload = triageResponse?.data ?? null;
      setTriageResult(triagePayload);

      const hospitalResponse = await api.get("/api/hospitals/recommend", {
        params: {
          severity: triagePayload?.severity,
          speciality: triagePayload?.speciality,
          lat: nextFormData?.location?.lat,
          lng: nextFormData?.location?.lng
        }
      });

      setHospitals(hospitalResponse?.data?.hospitals ?? []);
      setView("decision");
    } catch (error) {
      console.error("RapidCare analysis failed", error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleHospitalSelect = async (hospital) => {
    if (!hospital) {
      return;
    }

    setIsBusy(true);
    setSelectedHospital(hospital);

    try {
      const routeResponse = await api.post("/api/route", {
        patientLocation: formData?.location,
        destinationHospital: hospital,
        triage: triageResult
      });

      setRoute(routeResponse?.data ?? null);
      setView("route");
    } catch (error) {
      console.error("RapidCare route lookup failed", error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleNotify = async () => {
    if (!selectedHospital || !triageResult) {
      return;
    }

    try {
      await api.post("/api/notify", {
        hospitalId: selectedHospital?.id,
        triage: triageResult,
        route
      });
    } catch (error) {
      console.error("RapidCare notification failed", error);
    }
  };

  const stepLabel = (index) => {
    if (index === 0) return "Intake";
    if (index === 1) return "Decision";
    return "Route";
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-8 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-red-500/20 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-6 pt-4 sm:px-6 lg:px-8">
        <header className="mb-4 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300/80">Emergency Intelligence Console</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">RapidCare</h1>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-900/50 px-3 py-2">
              {viewOrder.map((current, index) => {
                const active = index <= progressIndex;
                return (
                  <div key={current} className="flex items-center gap-2">
                    <div
                      className={[
                        "h-2.5 w-2.5 rounded-full transition-all duration-300",
                        active ? "bg-red-500 shadow-[0_0_18px_rgba(232,52,42,0.9)]" : "bg-slate-600"
                      ].join(" ")}
                    />
                    <span className={active ? "text-xs font-semibold text-slate-200" : "text-xs text-slate-400"}>{stepLabel(index)}</span>
                    {index < viewOrder.length - 1 && <span className="mx-1 text-slate-500">/</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <section className="relative flex-1 rounded-3xl border border-white/10 bg-slate-900/40 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          {isBusy && (
            <div className="absolute right-4 top-4 z-20 rounded-full border border-white/15 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-md">
              Processing live emergency data...
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={view} variants={pageTransition} initial="initial" animate="animate" exit="exit" className="h-full">
              {view === "intake" && (
                <IntakeView
                  formData={formData}
                  setFormData={setFormData}
                  onAnalyze={handleAnalyze}
                  isBusy={isBusy}
                />
              )}

              {view === "decision" && (
                <DecisionView
                  triageResult={triageResult}
                  hospitals={hospitals}
                  selectedHospital={selectedHospital}
                  onSelectHospital={handleHospitalSelect}
                  onBack={() => setView("intake")}
                  isBusy={isBusy}
                />
              )}

              {view === "route" && (
                <RouteView
                  triageResult={triageResult}
                  selectedHospital={selectedHospital}
                  route={route}
                  onBack={() => setView("decision")}
                  onNotify={handleNotify}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
