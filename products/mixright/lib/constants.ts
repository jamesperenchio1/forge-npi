// Mix class base water-cement ratios (by weight)
export const MIX_CLASS_BASE_WCR: Record<string, number> = {
  A: 0.45, // High strength: columns, beams, footings (1:1.5:3)
  B: 0.55, // Medium: floor slabs, walls (1:2:4)
  C: 0.65, // Low: fence posts, non-structural fills (1:3:6)
};

export const MIX_CLASS_LABELS: Record<string, Record<string, string>> = {
  en: { A: "Class A — Structural (columns, footings)", B: "Class B — General (slabs, walls)", C: "Class C — Light (posts, fill)" },
  th: { A: "คลาส A — โครงสร้าง", B: "คลาส B — ทั่วไป", C: "คลาส C — เบา" },
  tl: { A: "Klase A — Istruktura", B: "Klase B — Pangkalahatan", C: "Klase C — Magaan" },
  id: { A: "Kelas A — Struktural", B: "Kelas B — Umum", C: "Kelas C — Ringan" },
};

// Mix proportions (cement : sand : gravel by volume, 1 bag = 50kg cement)
export const MIX_PROPORTIONS: Record<string, { cement: number; sand: number; gravel: number; cementKg: number }> = {
  A: { cement: 1, sand: 1.5, gravel: 3, cementKg: 50 },
  B: { cement: 1, sand: 2, gravel: 4, cementKg: 50 },
  C: { cement: 1, sand: 3, gravel: 6, cementKg: 50 },
};

// Application types (note: 'id_text' is the Indonesian translation to avoid conflict with the 'id' key)
export type ApplicationType = {
  id: string;
  en: string;
  th: string;
  tl: string;
  id_text: string;
};

export const APPLICATION_TYPES: ApplicationType[] = [
  { id: "footing", en: "Column footing / Foundation", th: "ฐานราก", tl: "Pundasyon", id_text: "Pondasi" },
  { id: "column", en: "Column / Beam", th: "เสา / คาน", tl: "Haligi / Vigas", id_text: "Kolom / Balok" },
  { id: "slab", en: "Floor slab", th: "พื้น", tl: "Sahig", id_text: "Pelat lantai" },
  { id: "wall", en: "Wall / Fence", th: "กำแพง / รั้ว", tl: "Dingding / Bakod", id_text: "Dinding / Pagar" },
  { id: "post", en: "Fence post / Pole", th: "เสาเข็ม", tl: "Poste", id_text: "Tiang pagar" },
  { id: "slope", en: "Ramp / Canal / Slope", th: "ทางลาด / ท่อระบายน้ำ", tl: "Rampa / Kanal", id_text: "Ramp / Saluran" },
  { id: "blocks", en: "Concrete blocks", th: "บล็อกคอนกรีต", tl: "Bloke ng kongkreto", id_text: "Batako" },
];

// Sand type adjustments to WCR (crushed/manufactured sand absorbs more water)
export const SAND_ADJUSTMENTS: Record<string, number> = {
  river: 0,      // River sand (smooth, fine) — baseline
  crushed: 0.03, // Crushed rock / manufactured sand (sharp, porous) — needs slightly more water
  mixed: 0.015,  // Mixed / unknown
};

// Humidity adjustments to water addition (liters per 50kg bag)
// High humidity = sand already holds more moisture = reduce added water
export function getHumidityWaterAdj(humidity: number): number {
  if (humidity >= 90) return -0.8; // Very humid: sand is pre-wetted
  if (humidity >= 80) return -0.4;
  if (humidity >= 70) return -0.2;
  if (humidity >= 60) return 0;    // Baseline
  if (humidity >= 50) return 0.2;  // Drier: sand is drier
  return 0.4;                      // Very dry
}

// Temperature adjustments to water addition (liters per 50kg bag)
// High temp = faster evaporation during mixing = slightly more water to compensate
export function getTempWaterAdj(tempC: number): number {
  if (tempC >= 38) return 0.5;
  if (tempC >= 34) return 0.3;
  if (tempC >= 30) return 0.1;
  if (tempC >= 25) return 0;   // Baseline
  return -0.2;                 // Cool conditions
}

// Cement age strength factor (humidity storage degrades Portland cement)
// Returns a label + warning, not a WCR adjustment (old cement = use fresh if possible)
export function getCementAgeWarning(months: number): { level: "ok" | "warn" | "danger"; en: string; th: string; tl: string; id: string } {
  if (months <= 1) return { level: "ok", en: "Fresh — full strength expected", th: "ใหม่ — ความแข็งแรงเต็มที่", tl: "Sariwa — buong lakas", id: "Segar — kekuatan penuh" };
  if (months <= 3) return { level: "warn", en: "OK but check for lumps. Sieve if needed.", th: "โอเค แต่ตรวจก้อน ร่อนถ้าจำเป็น", tl: "OK ngunit suriin ang tipak. Salain kung kailangan.", id: "OK tapi periksa gumpalan. Ayak jika perlu." };
  if (months <= 6) return { level: "warn", en: "Degraded — strength may be 10-20% lower. Use Class A for structural work.", th: "ลดลง — ความแข็งแรงอาจลดลง 10-20%", tl: "Bumaba — lakas maaaring 10-20% mas mababa", id: "Turun — kekuatan mungkin 10-20% lebih rendah" };
  return { level: "danger", en: "Significantly degraded. Do NOT use for structural work (columns, footings, beams).", th: "ลดลงมาก — ห้ามใช้กับงานโครงสร้าง", tl: "Malubhang bumaba — HUWAG gamitin para sa istruktura", id: "Turun signifikan — JANGAN gunakan untuk struktural" };
}

// Curing time in days for 70% strength (adjusted for humidity)
// High humidity = slower evaporation = longer moist cure needed
export function getCureTime(humidity: number, applicationId: string): { minDays: number; note: Record<string, string> } {
  const isStructural = ["footing", "column"].includes(applicationId);
  const base = isStructural ? 14 : 7;

  let days = base;
  if (humidity >= 85) days = Math.round(base * 1.4); // Slow cure in very high humidity
  else if (humidity >= 75) days = Math.round(base * 1.2);
  else if (humidity < 60) days = Math.round(base * 0.9); // Drier = cure faster but watch cracking

  return {
    minDays: days,
    note: {
      en: humidity >= 85
        ? `Keep surface wet for ${days} days. In high humidity, test with a plastic sheet — if moisture collects under it after 24h, the slab is still curing.`
        : `Keep surface wet for ${days} days. Water lightly morning and evening.`,
      th: `รักษาความชื้นพื้นผิว ${days} วัน`,
      tl: `Panatilihing basa ang ibabaw sa loob ng ${days} araw.`,
      id: `Jaga permukaan tetap lembab selama ${days} hari.`,
    },
  };
}
