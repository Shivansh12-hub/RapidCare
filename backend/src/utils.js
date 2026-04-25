function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function estimateEtaMinutes(distanceKm, severity) {
  const baseSpeed = severity === "P1" ? 45 : severity === "P2" ? 35 : 28;
  const eta = (distanceKm / baseSpeed) * 60;
  return Math.max(4, Math.round(eta));
}

function estimateTraffic(etaMin) {
  if (etaMin <= 8) {
    return "Low";
  }
  if (etaMin <= 16) {
    return "Moderate";
  }
  return "High";
}

module.exports = {
  haversineDistanceKm,
  estimateEtaMinutes,
  estimateTraffic
};
