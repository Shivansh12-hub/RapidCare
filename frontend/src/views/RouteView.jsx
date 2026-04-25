import { useEffect, useState } from "react";
import MapView from "../components/MapView";
import RoutePanel from "../components/RoutePanel";

function RouteView({ route, selectedHospital, triageResult, patientCoords, allHospitals, notificationState }) {
  const [tracking, setTracking] = useState({
    progress: 0,
    position: null,
    step: 0,
    totalSteps: 1,
    source: "simulated",
  });
  const [liveCoords, setLiveCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("requesting");
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("unsupported");
      setGeoError("Geolocation is not supported on this device/browser.");
      return;
    }

    setGeoStatus("requesting");
    setGeoError("");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGeoStatus("live");
        setGeoError("");
        setLiveCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        setGeoStatus("error");
        setGeoError(error?.message || "Unable to acquire live GPS.");
        setLiveCoords(null);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <div className="relative h-[68vh] min-h-[520px] overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      <MapView
        className="h-full w-full"
        allHospitals={allHospitals}
        recommendedHospitals={selectedHospital ? [selectedHospital] : []}
        selectedHospital={selectedHospital}
        patientCoords={patientCoords}
        route={route}
        showPatient
        liveTracking
        liveCoords={liveCoords}
        onTrackingUpdate={setTracking}
      />
      <RoutePanel
        route={route}
        selectedHospital={selectedHospital}
        triageResult={triageResult}
        notificationState={notificationState}
        tracking={tracking}
        geoStatus={geoStatus}
        geoError={geoError}
      />
    </div>
  );
}

export default RouteView;
