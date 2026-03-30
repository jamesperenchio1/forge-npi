// Mix classes — plain English, not A/B/C
// C30 (premium) is the practical upper limit for hand mixing.
// Above C30, water-cement ratio control is too critical for manual batching.
// Source: ACI 211.1 — Standard Practice for Selecting Proportions for Normal Concrete
export type MixClassKey = "premium" | "high" | "general" | "basic";

export const MIX_CLASSES: Record<MixClassKey, {
  label: string;
  subtitle: string;
  ratio: string;
  mpaMid: number;
  uses: string[];
  wcr: number;
  proportions: { sand: number; gravel: number };
  color: string;
  borderColor: string;
  handMixWarning?: string;
}> = {
  premium: {
    label: "C30 Premium",
    subtitle: "High-load structural — hand-mix limit",
    ratio: "1 : 1 : 2",
    mpaMid: 30,
    uses: ["Retaining walls", "Heavy columns", "Industrial slabs", "Transfer beams"],
    wcr: 0.40,
    proportions: { sand: 1, gravel: 2 },
    color: "text-purple-700",
    borderColor: "border-purple-500",
    handMixWarning: "C30 is the maximum reliable strength for hand mixing. WCR 0.40 is very stiff — add water slowly and measure carefully. Consider a mechanical mixer for batches over 3 bags.",
  },
  high: {
    label: "High Strength",
    subtitle: "Structural elements",
    ratio: "1 : 1.5 : 3",
    mpaMid: 25,
    uses: ["Columns", "Footings", "Beams", "Stairs"],
    wcr: 0.45,
    proportions: { sand: 1.5, gravel: 3 },
    color: "text-red-600",
    borderColor: "border-red-500",
  },
  general: {
    label: "General Purpose",
    subtitle: "Most common pours",
    ratio: "1 : 2 : 4",
    mpaMid: 20,
    uses: ["Floor slabs", "Walls", "Driveways", "Garden paths"],
    wcr: 0.55,
    proportions: { sand: 2, gravel: 4 },
    color: "text-orange-600",
    borderColor: "border-orange-400",
  },
  basic: {
    label: "Basic Mix",
    subtitle: "Non-structural",
    ratio: "1 : 3 : 6",
    mpaMid: 15,
    uses: ["Fence posts", "Fill concrete", "Bedding mortar"],
    wcr: 0.65,
    proportions: { sand: 3, gravel: 6 },
    color: "text-slate-600",
    borderColor: "border-slate-400",
  },
};

// Application types with recommended mix class
export type ApplicationType = {
  id: string;
  label: string;
  icon: string;
  recommended: MixClassKey;
  isStructural: boolean;
};

export const APPLICATION_TYPES: ApplicationType[] = [
  { id: "footing",  label: "Column Footing / Foundation", icon: "", recommended: "high",    isStructural: true  },
  { id: "column",   label: "Column / Beam",               icon: "", recommended: "high",    isStructural: true  },
  { id: "slab",     label: "Floor Slab",                  icon: "", recommended: "general", isStructural: false },
  { id: "wall",     label: "Wall / Fence Panel",          icon: "", recommended: "general", isStructural: false },
  { id: "stairs",   label: "Stairs / Steps",              icon: "", recommended: "high",    isStructural: true  },
  { id: "driveway", label: "Driveway / Path",             icon: "", recommended: "general", isStructural: false },
  { id: "post",     label: "Fence Post / Pole",           icon: "", recommended: "basic",   isStructural: false },
  { id: "slope",    label: "Ramp / Canal / Slope",        icon: "", recommended: "general", isStructural: false },
  { id: "blocks",   label: "Concrete Blocks",             icon: "", recommended: "basic",   isStructural: false },
];

// Sand type adjustments
export const SAND_ADJUSTMENTS: Record<string, number> = {
  river:   0,     // baseline
  crushed: 0.03,  // needs slightly more water
  mixed:   0.015,
};

// Humidity → water adjustment (L per 50kg bag)
export function getHumidityWaterAdj(humidity: number): number {
  if (humidity >= 90) return -0.8;
  if (humidity >= 80) return -0.4;
  if (humidity >= 70) return -0.2;
  if (humidity >= 60) return 0;
  if (humidity >= 50) return 0.2;
  return 0.4;
}

// Temperature → water adjustment (L per 50kg bag)
export function getTempWaterAdj(tempC: number): number {
  if (tempC >= 38) return 0.5;
  if (tempC >= 34) return 0.3;
  if (tempC >= 30) return 0.1;
  if (tempC >= 25) return 0;
  return -0.2;
}

// Cement age warning
export function getCementAgeWarning(months: number): { level: "ok" | "warn" | "danger"; message: string } {
  if (months <= 1) return { level: "ok",     message: "Fresh — full strength expected" };
  if (months <= 3) return { level: "warn",   message: "OK but check for lumps. Sieve if needed." };
  if (months <= 6) return { level: "warn",   message: "Degraded — strength may be 10–20% lower. Use High Strength for structural work." };
  return           { level: "danger", message: "Significantly degraded. Do NOT use for columns, footings or beams." };
}

// Curing time (days to keep wet)
export function getCureTime(humidity: number, isStructural: boolean): { minDays: number; note: string } {
  const base = isStructural ? 14 : 7;
  let days = base;
  if (humidity >= 85) days = Math.round(base * 1.4);
  else if (humidity >= 75) days = Math.round(base * 1.2);
  else if (humidity < 60) days = Math.round(base * 0.9);

  return {
    minDays: days,
    note: humidity >= 85
      ? `Keep surface wet for ${days} days. High humidity slows evaporation — test with a plastic sheet: moisture condensing underneath means still curing.`
      : `Keep surface wet for ${days} days. Water lightly morning and evening.`,
  };
}

// WMO weather codes → description
export const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0:  { label: "Clear sky",        icon: "" },
  1:  { label: "Mainly clear",     icon: "" },
  2:  { label: "Partly cloudy",    icon: "" },
  3:  { label: "Overcast",         icon: "" },
  45: { label: "Fog",              icon: "" },
  48: { label: "Icy fog",          icon: "" },
  51: { label: "Light drizzle",    icon: "" },
  53: { label: "Drizzle",          icon: "" },
  61: { label: "Light rain",       icon: "" },
  63: { label: "Rain",             icon: "" },
  65: { label: "Heavy rain",       icon: "" },
  80: { label: "Rain showers",     icon: "" },
  81: { label: "Showers",          icon: "" },
  82: { label: "Violent showers",  icon: "" },
  95: { label: "Thunderstorm",     icon: "" },
  99: { label: "Thunderstorm+",    icon: "" },
};

export function getWeatherInfo(code: number): { label: string; icon: string } {
  // Find closest matching code
  const known = Object.keys(WEATHER_CODES).map(Number).sort((a, b) => a - b);
  for (let i = known.length - 1; i >= 0; i--) {
    if (code >= known[i]) return WEATHER_CODES[known[i]];
  }
  return { label: "Unknown", icon: "" };
}
