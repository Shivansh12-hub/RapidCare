import { motion } from "framer-motion";

const severityTone = {
  P1: "from-[#E8342A]/30 to-[#E8342A]/5 border-[#E8342A]/70 text-red-100",
  P2: "from-amber-500/30 to-amber-500/5 border-amber-400/70 text-amber-100",
  P3: "from-green-500/30 to-green-500/5 border-green-400/70 text-green-100",
};

function AIBanner({ triageResult }) {
  if (!triageResult) {
    return null;
  }

  const tone = severityTone[triageResult.severity] || severityTone.P3;
  const headline = `${triageResult.severity_icon || ""} ${triageResult.severity_label?.toUpperCase() || "STABLE"} - ${
    triageResult.speciality?.toUpperCase() || "GENERAL MEDICINE"
  } REQUIRED`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r px-4 py-4 shadow-glow ${tone}`}
    >
      <motion.span
        aria-hidden="true"
        className="absolute right-4 top-4 h-3 w-3 rounded-full bg-[#E8342A]"
        animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.35, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">AI Decision</p>
      <h2 className="mt-1 text-lg font-black leading-tight sm:text-2xl">{headline}</h2>
      <p className="mt-2 text-sm text-slate-200/90">{triageResult.description}</p>
    </motion.div>
  );
}

export default AIBanner;
