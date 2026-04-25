import { motion } from "framer-motion";

function RoutePanel({ route, selectedHospital, notificationState, tracking, geoStatus, geoError }) {
  if (!route || !selectedHospital) {
    return null;
  }

  const progressPercent = Math.round((tracking?.progress || 0) * 100);
  const etaRemaining = Math.max(0, Math.round(route.eta_min * (1 - (tracking?.progress || 0))));
  const livePosition =
    tracking?.position && Array.isArray(tracking.position)
      ? `${tracking.position[0].toFixed(5)}, ${tracking.position[1].toFixed(5)}`
      : "Awaiting lock";
  const gpsStatus = tracking?.source === "live" ? "Live GPS lock" : "Simulated tracking";

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-3 md:inset-x-auto md:right-3 md:top-3 md:w-[360px]">
      <div className="pointer-events-auto rounded-2xl border border-white/20 bg-slate-900/70 p-4 shadow-2xl backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Execution ETA</p>
        <div className="mt-2 flex items-end justify-between">
          <p className="text-4xl font-black text-white">{etaRemaining}m</p>
          <p className="text-sm text-slate-300">{route.distance_km} km</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Traffic" value={route.traffic_level || route.traffic_label || "Moderate"} />
          <Stat label="Via" value={route.via_highway || route.road_type || "Primary Route"} />
        </div>

        <div className="mt-3 rounded-xl bg-white/10 p-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-300">
            <span>Ambulance progress</span>
            <span className="font-semibold text-slate-100">{progressPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full bg-[#E8342A]"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-300">
            {tracking?.source === "live" ? "🟢 Live GPS: " : "📍 Position: "}{livePosition}
          </p>
          {geoStatus && geoStatus !== "live" && (
            <p className="mt-1 text-[11px] text-amber-300">
              {geoStatus === "requesting" ? "⏳ Requesting location permission..." : geoError || "GPS unavailable, using route tracking."}
            </p>
          )}
        </div>
      </div>

      <div className="pointer-events-auto rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl">
        <p className="text-sm font-bold text-white">{selectedHospital.name}</p>
        <p className="text-xs text-slate-300">Hospital notified, ER preparing.</p>
        <div className="mt-3 grid grid-cols-[52px_1fr] items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16A34A]/20"
          >
            <span className="text-2xl">✓</span>
          </motion.div>
          <div className="space-y-1 text-xs text-slate-200">
            <p>Hospital alert: <span className="font-semibold text-green-300">{notificationState?.hospital_alert || "sent"}</span></p>
            <p>Family SMS: <span className="font-semibold text-green-300">{notificationState?.family_sms || "pending"}</span></p>
            <p>Police alert: <span className="font-semibold text-green-300">{notificationState?.police_alert || "pending"}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/10 p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export default RoutePanel;
