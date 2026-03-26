import type { ForecastDay } from "./weatherApi";

export type PourScore = "green" | "yellow" | "red";

export function computePourScore(day: ForecastDay): PourScore {
  // Red: rain, dangerous heat, high wind
  if (day.precipMm > 5)        return "red";  // significant rain
  if (day.weatherCode >= 51)   return "red";  // rain/storm codes
  if (day.maxTempC >= 38)      return "red";  // dangerous heat for workers + rapid evaporation
  if (day.windSpeedMax >= 40)  return "red";  // plastic shrinkage risk

  // Yellow: marginal conditions
  if (day.weatherCode >= 3)    return "yellow"; // overcast or worse
  if (day.maxTempC >= 33)      return "yellow"; // hot — early morning only
  if (day.maxHumidity >= 90)   return "yellow"; // very humid — slow cure
  if (day.precipMm > 0)        return "yellow"; // light rain possible
  if (day.windSpeedMax >= 25)  return "yellow"; // moderate wind

  return "green";
}

export function pourScoreLabel(score: PourScore): string {
  if (score === "green")  return "Good day to pour";
  if (score === "yellow") return "Pour with caution";
  return "Avoid pouring";
}

export function pourScoreReason(day: ForecastDay): string {
  const reasons: string[] = [];
  if (day.precipMm > 5 || day.weatherCode >= 51) reasons.push("rain expected");
  if (day.maxTempC >= 38) reasons.push(`extreme heat ${day.maxTempC}°C`);
  if (day.windSpeedMax >= 40) reasons.push("high wind — plastic shrinkage risk");
  if (day.weatherCode >= 3 && day.weatherCode < 51) reasons.push("overcast");
  if (day.maxTempC >= 33 && day.maxTempC < 38) reasons.push(`hot day ${day.maxTempC}°C — pour early morning`);
  if (day.maxHumidity >= 90) reasons.push("very high humidity");
  if (day.precipMm > 0 && day.precipMm <= 5) reasons.push("possible light rain");
  return reasons.length ? reasons.join(", ") : "good conditions";
}

export const SCORE_COLORS: Record<PourScore, { bg: string; text: string; dot: string }> = {
  green:  { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  red:    { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"    },
};
