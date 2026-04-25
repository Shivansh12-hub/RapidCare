import { motion } from "framer-motion";

function HospitalCard({ hospital, index, selected, requiredSpeciality, onSelect, maxScore }) {
  const scorePercent = Math.max(6, Math.round((hospital.match_score / (maxScore || 100)) * 100));

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.28 }}
      onClick={() => onSelect(hospital)}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected
          ? "scale-[1.01] border-[#E8342A]/80 bg-[#E8342A]/10 shadow-glow"
          : "border-white/10 bg-white/5 hover:-translate-y-0.5 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">{hospital.name}</h3>
          <p className="text-xs text-slate-300">{hospital.type} · {hospital.distance_km} km</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{hospital.eta_min}m</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-300">ETA</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Tag label={`ICU ${hospital.icu_beds_free}`} />
        <Tag label={`${hospital.rating}★`} />
        {hospital.has_trauma_centre === "Yes" && <Tag label="Trauma" tone="success" />}
        {hospital.has_blood_bank === "Yes" && <Tag label="Blood Bank" />}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(hospital.specialities || []).slice(0, 3).map((tag) => (
          <span
            key={tag}
            className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
              tag === requiredSpeciality ? "bg-[#6366F1]/35 text-indigo-100" : "bg-white/10 text-slate-300"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-[#E8342A]"
          initial={{ width: 0 }}
          animate={{ width: `${scorePercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300">
        <span>Match score</span>
        <span>{hospital.match_score}</span>
      </div>

      <p className="mt-2 text-xs text-slate-300">
        Why this hospital: {hospital.traffic_level} traffic, {hospital.avg_er_wait_min}m avg ER wait.
      </p>
    </motion.button>
  );
}

function Tag({ label, tone = "neutral" }) {
  const classes =
    tone === "success"
      ? "bg-[#16A34A]/25 text-green-100"
      : "bg-white/10 text-slate-200";

  return <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

export default HospitalCard;
