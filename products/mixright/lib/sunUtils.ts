import SunCalc from "suncalc";

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  goldenHourEnd: Date;
  goldenHourStart: Date;
}

export interface SunPosition {
  altitudeDeg: number;   // degrees above horizon (0 = horizon, 90 = zenith)
  azimuthDeg: number;    // degrees clockwise from north
  arcPercent: number;    // 0–100, position along the day arc (0=sunrise, 50=noon, 100=sunset)
}

export type UVRisk = "low" | "moderate" | "high" | "very_high" | "extreme";
export type WorkerRisk = "low" | "moderate" | "high" | "very_high" | "extreme";

export function getSunTimes(lat: number, lng: number, date: Date): SunTimes {
  const times = SunCalc.getTimes(date, lat, lng);
  return {
    sunrise:        times.sunrise,
    sunset:         times.sunset,
    solarNoon:      times.solarNoon,
    goldenHourEnd:  times.goldenHourEnd,
    goldenHourStart: times.goldenHour,
  };
}

export function getSunPosition(lat: number, lng: number, date: Date): SunPosition {
  const pos = SunCalc.getPosition(date, lat, lng);
  const altDeg = Math.round((pos.altitude * 180) / Math.PI * 10) / 10;

  // arcPercent: fraction of the day between sunrise and sunset
  const times = SunCalc.getTimes(date, lat, lng);
  const sunriseMs = times.sunrise.getTime();
  const sunsetMs  = times.sunset.getTime();
  const nowMs     = date.getTime();
  const arcPct    = Math.min(100, Math.max(0, ((nowMs - sunriseMs) / (sunsetMs - sunriseMs)) * 100));

  return {
    altitudeDeg: altDeg,
    azimuthDeg:  Math.round(((pos.azimuth * 180) / Math.PI + 180) % 360),
    arcPercent:  Math.round(arcPct),
  };
}

export function getUVRisk(uvIndex: number): UVRisk {
  if (uvIndex < 3)  return "low";
  if (uvIndex < 6)  return "moderate";
  if (uvIndex < 8)  return "high";
  if (uvIndex < 11) return "very_high";
  return "extreme";
}

// Steadman heat index formula (valid for temp ≥ 27°C, humidity ≥ 40%)
export function getHeatIndex(tempC: number, humidity: number): number {
  if (tempC < 27 || humidity < 40) return tempC;
  const T = tempC, H = humidity;
  return (
    -8.78469475556 +
    1.61139411 * T +
    2.33854883889 * H -
    0.14611605 * T * H -
    0.012308094 * T * T -
    0.0164248277778 * H * H +
    0.002211732 * T * T * H +
    0.00072546 * T * H * H -
    0.000003582 * T * T * H * H
  );
}

export function getWorkerRisk(heatIndexC: number): { level: WorkerRisk; label: string; advice: string; color: string } {
  if (heatIndexC < 27) return { level: "low",       label: "Low",       advice: "Normal work. Stay hydrated.",                          color: "text-green-600" };
  if (heatIndexC < 33) return { level: "moderate",  label: "Moderate",  advice: "Rest every 45 min in shade. Drink 250ml/hour.",         color: "text-yellow-600" };
  if (heatIndexC < 40) return { level: "high",      label: "High",      advice: "20 min work / 10 min shade rotation. Buddy system.",   color: "text-orange-600" };
  if (heatIndexC < 46) return { level: "very_high", label: "Very High", advice: "Limit heavy work. Frequent shade. Watch for symptoms.", color: "text-red-600" };
  return { level: "extreme", label: "Extreme", advice: "Stop outdoor heavy work. Reschedule pour if possible.",                          color: "text-red-700" };
}

// Best time of day to pour: find the coolest early-morning window before solar noon
export function getBestPourWindow(lat: number, lng: number, date: Date, maxTempC: number, minTempC: number): string {
  const times = SunCalc.getTimes(date, lat, lng);
  const noonHour = times.solarNoon.getHours();

  // If very hot day (max > 35°C), strongly recommend early morning
  if (maxTempC > 35) {
    const riseHour = times.sunrise.getHours();
    const start = riseHour + 1;
    return `${start}:00 – ${start + 3}:00 (before ${noonHour}:00 solar peak — ${maxTempC}°C forecast high)`;
  }
  // Moderate day
  if (maxTempC > 30) {
    return `Morning (before ${noonHour}:00) or after 16:00 when temp drops`;
  }
  // Cool day
  return `Any time — ${maxTempC}°C max is acceptable for concrete work`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}
