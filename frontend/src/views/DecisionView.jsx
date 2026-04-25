import { useMemo } from "react";
import { motion } from "framer-motion";
import AIBanner from "../components/AIBanner";
import HospitalCard from "../components/HospitalCard";
import MapView from "../components/MapView";
import { getRoute, sendNotifications } from "../api/client";

function DecisionView({
  triageResult,
  hospitals,
  selectedHospital,
  setSelectedHospital,
  setRoute,
  formData,
  patientCoords,
  allHospitals,
  setNotificationState,
  setApiError,
  setIsLoading,
  isLoading = false,
  onConfirmSelection,
}) {
  const maxScore = useMemo(() => hospitals[0]?.match_score || 100, [hospitals]);
  const isEmpty = hospitals.length === 0;

  const handleConfirmSelection = async () => {
    if (!selectedHospital || !triageResult) {
      return;
    }

    setApiError("");
    setIsLoading(true);

    try {
      const routeRes = await getRoute(
        patientCoords.lat,
        patientCoords.lng,
        selectedHospital.hospital_id,
        triageResult.severity
      );
      const routeData = routeRes.data;

      setRoute(routeData);

      const notifyRes = await sendNotifications({
        hospital_id: selectedHospital.hospital_id,
        patient_info: {
          age: formData.age ? Number(formData.age) : null,
          gender: formData.gender,
          blood_group: formData.blood_group,
          severity: triageResult.severity,
          speciality: triageResult.speciality,
          complaint: formData.complaint,
          vitals: formData.vitals,
        },
        route: routeData,
        family_phone: formData.family_phone || null,
        incident_type: formData.incident_type,
        patient_lat: patientCoords.lat,
        patient_lng: patientCoords.lng,
      });

      setNotificationState(notifyRes.data);
      onConfirmSelection();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Failed to confirm hospital. Please try again.";
      setApiError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid h-full gap-3 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-3 overflow-y-auto pr-1">
        <AIBanner triageResult={triageResult} />

        {isEmpty ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm text-slate-300">No suitable hospitals found in your area.</p>
            <p className="mt-2 text-xs text-slate-400">Please expand search radius or try another location.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hospitals.map((hospital, idx) => (
              <HospitalCard
                key={hospital.hospital_id}
                hospital={hospital}
                index={idx}
                maxScore={maxScore}
                requiredSpeciality={triageResult?.speciality}
                selected={selectedHospital?.hospital_id === hospital.hospital_id}
                onSelect={setSelectedHospital}
              />
            ))}
          </div>
        )}

        <motion.button
          whileTap={{ scale: isLoading || !selectedHospital ? 1 : 0.985 }}
          type="button"
          disabled={!selectedHospital || isLoading || isEmpty}
          onClick={handleConfirmSelection}
          className="w-full rounded-xl bg-[#E8342A] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#E8342A]/30 disabled:cursor-not-allowed disabled:opacity-60 transition"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
              Confirming...
            </span>
          ) : selectedHospital ? (
            `Confirm ${selectedHospital.name}`
          ) : (
            "Select a hospital"
          )}
        </motion.button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <MapView
          allHospitals={allHospitals}
          recommendedHospitals={hospitals}
          selectedHospital={selectedHospital}
          patientCoords={patientCoords}
          route={null}
          showPatient
        />
      </div>
    </div>
  );
}

export default DecisionView;
