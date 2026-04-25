import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

const defaultIcon = new L.Icon({
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const patientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const ambulanceIcon = L.divIcon({
  className: "",
  html: '<div style="height:34px;width:34px;border-radius:999px;background:rgba(232,52,42,0.92);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;box-shadow:0 0 0 4px rgba(232,52,42,0.2);animation:pulse-ambulance 2s infinite">🚑</div><style>@keyframes pulse-ambulance { 0%, 100% { box-shadow: 0 0 0 4px rgba(232,52,42,0.2), 0 0 12px rgba(232,52,42,0.4); } 50% { box-shadow: 0 0 0 8px rgba(232,52,42,0.1), 0 0 24px rgba(232,52,42,0.6); } }</style>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const ambulanceIconLive = L.divIcon({
  className: "",
  html: '<div style="height:40px;width:40px;border-radius:999px;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;box-shadow:0 0 0 6px rgba(16,185,129,0.3);animation:pulse-live 1.5s infinite">🚑</div><style>@keyframes pulse-live { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16,185,129,0.3); } 50% { transform: scale(1.08); box-shadow: 0 0 0 10px rgba(16,185,129,0.15); } }</style>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function FlyToSelection({ center, enabled = true }) {
  const map = useMap();
  const lastCenterRef = useRef(null);

  useEffect(() => {
    if (!enabled || !center || center.length !== 2) {
      return;
    }

    const rounded = [Number(center[0].toFixed(4)), Number(center[1].toFixed(4))];
    const last = lastCenterRef.current;

    if (!last || last[0] !== rounded[0] || last[1] !== rounded[1]) {
      map.flyTo(center, 12, { duration: 0.7 });
      lastCenterRef.current = rounded;
    }
  }, [map, center, enabled]);

  return null;
}

function routePoints(route, patientCoords, selectedHospital) {
  if (!patientCoords || !selectedHospital) {
    return [];
  }

  const source = [Number(patientCoords.lat), Number(patientCoords.lng)];
  const destination = [Number(selectedHospital.lat), Number(selectedHospital.lng)];

  // Always provide a visible route at least from source to destination.
  if (!route) {
    return [source, destination];
  }

  return [
    source,
    ...((route.waypoints || []).map((wp) => [wp.lat, wp.lng])),
    destination,
  ];
}

function FitToRoute({ points }) {
  const map = useMap();
  const signatureRef = useRef("");

  useEffect(() => {
    if (!points || points.length < 2) {
      return;
    }

    const signature = points.map((p) => `${Number(p[0]).toFixed(4)},${Number(p[1]).toFixed(4)}`).join("|");
    if (signatureRef.current === signature) {
      return;
    }
    signatureRef.current = signature;

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [34, 34], animate: true, duration: 0.7 });
  }, [map, points]);

  return null;
}

function MapView({
  allHospitals = [],
  recommendedHospitals = [],
  selectedHospital,
  patientCoords,
  route,
  showPatient,
  liveTracking = false,
  liveCoords = null,
  onTrackingUpdate,
  className = "h-full min-h-[520px] w-full",
}) {
  const defaultCenter = [28.6139, 77.209];
  const focusCenter =
    selectedHospital && patientCoords
      ? [(selectedHospital.lat + patientCoords.lat) / 2, (selectedHospital.lng + patientCoords.lng) / 2]
      : defaultCenter;

  const polylinePoints = useMemo(
    () => routePoints(route, patientCoords, selectedHospital),
    [route, patientCoords, selectedHospital]
  );

  const [trackingIndex, setTrackingIndex] = useState(0);

  const nearestRouteIndex = useMemo(() => {
    if (!liveCoords || polylinePoints.length < 2) {
      return -1;
    }

    const lat = Number(liveCoords.lat);
    const lng = Number(liveCoords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return -1;
    }

    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    polylinePoints.forEach((point, index) => {
      const dx = point[0] - lat;
      const dy = point[1] - lng;
      const dist = dx * dx + dy * dy;
      if (dist < bestDistance) {
        bestDistance = dist;
        bestIndex = index;
      }
    });

    return bestIndex;
  }, [liveCoords, polylinePoints]);

  useEffect(() => {
    setTrackingIndex(0);
  }, [polylinePoints]);

  useEffect(() => {
    if (liveCoords?.lat && liveCoords?.lng) {
      return;
    }

    if (!liveTracking || polylinePoints.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setTrackingIndex((prev) => {
        if (prev >= polylinePoints.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, 1400);

    return () => window.clearInterval(timer);
  }, [liveTracking, polylinePoints, liveCoords]);

  const livePositionFromDevice =
    liveCoords && Number.isFinite(Number(liveCoords.lat)) && Number.isFinite(Number(liveCoords.lng))
      ? [Number(liveCoords.lat), Number(liveCoords.lng)]
      : null;

  const ambulancePosition =
    liveTracking && livePositionFromDevice
      ? livePositionFromDevice
      : null;

  const travelledPoints =
    liveTracking && polylinePoints.length > 1
      ? polylinePoints.slice(
          0,
          Math.min(
            (nearestRouteIndex >= 0 ? nearestRouteIndex : trackingIndex) + 1,
            polylinePoints.length
          )
        )
      : [];

  useEffect(() => {
    if (!liveTracking || !polylinePoints.length || !onTrackingUpdate) {
      return;
    }

    const totalSteps = Math.max(1, polylinePoints.length - 1);
    let progress = Math.min(1, trackingIndex / totalSteps);
    let source = "simulated";

    if (livePositionFromDevice && polylinePoints.length > 1) {
      const nearestIndex = nearestRouteIndex >= 0 ? nearestRouteIndex : 0;
      progress = Math.min(1, nearestIndex / totalSteps);
      source = "live";
    }

    onTrackingUpdate({
      progress,
      position: ambulancePosition,
      step: trackingIndex,
      totalSteps,
      source,
    });
  }, [liveTracking, polylinePoints, onTrackingUpdate, trackingIndex, ambulancePosition, livePositionFromDevice, nearestRouteIndex]);

  return (
    <div className={className}>
      <MapContainer center={defaultCenter} zoom={11} className="h-full min-h-[520px] w-full rounded-2xl" scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <FlyToSelection center={focusCenter} enabled={!liveTracking} />
  {polylinePoints.length > 1 && <FitToRoute points={polylinePoints} />}

        {allHospitals.map((h) => (
          <Marker key={h.hospital_id} icon={defaultIcon} position={[h.lat, h.lng]}>
            <Popup>
              <strong>{h.name}</strong>
              <br />
              ICU: {h.icu_beds_free}
            </Popup>
          </Marker>
        ))}

        {recommendedHospitals.map((h) => (
          <Circle
            key={`rec-${h.hospital_id}`}
            center={[h.lat, h.lng]}
            radius={280}
            color="#6366F1"
            fillColor="#6366F1"
            fillOpacity={0.16}
          />
        ))}

        {selectedHospital && (
          <>
            <Marker icon={hospitalIcon} position={[selectedHospital.lat, selectedHospital.lng]}>
              <Popup>
                <strong>{selectedHospital.name}</strong>
                <br />
                ETA: {selectedHospital.eta_min} min
              </Popup>
            </Marker>
            <Circle
              center={[selectedHospital.lat, selectedHospital.lng]}
              radius={430}
              color="#16A34A"
              fillColor="#16A34A"
              fillOpacity={0.12}
            />
          </>
        )}

        {showPatient && patientCoords && (
          <>
            <Marker icon={patientIcon} position={[patientCoords.lat, patientCoords.lng]}>
              <Popup>Patient location</Popup>
            </Marker>
            <Circle
              center={[patientCoords.lat, patientCoords.lng]}
              radius={250}
              color="#E8342A"
              fillColor="#E8342A"
              fillOpacity={0.18}
            />
          </>
        )}

        {polylinePoints.length > 1 && <Polyline positions={polylinePoints} color="#6366F1" weight={5} opacity={0.45} />}

        {travelledPoints.length > 1 && <Polyline positions={travelledPoints} color="#E8342A" weight={6} opacity={0.95} />}

        {ambulancePosition && (
          <>
            <Marker 
              icon={livePositionFromDevice ? ambulanceIconLive : ambulanceIcon} 
              position={ambulancePosition}
            >
              <Popup>{livePositionFromDevice ? "🟢 Live GPS Ambulance" : "📍 Route Ambulance"}</Popup>
            </Marker>
            <Circle 
              center={ambulancePosition} 
              radius={livePositionFromDevice ? 150 : 120} 
              color={livePositionFromDevice ? "#10b981" : "#E8342A"} 
              fillColor={livePositionFromDevice ? "#10b981" : "#E8342A"} 
              fillOpacity={livePositionFromDevice ? 0.2 : 0.15} 
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;
