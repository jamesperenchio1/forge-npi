// Pest pressure calendar — static data keyed by month and plant family
export type PestEntry = {
  name: string;
  months: number[]; // 1-indexed
  plants: string[];
  severity: "low" | "medium" | "high";
  notes: string;
};

export const PEST_CALENDAR: PestEntry[] = [
  {
    name: "Aphids",
    months: [3, 4, 5, 9, 10],
    plants: ["roses", "vegetables", "herbs"],
    severity: "medium",
    notes: "Watch leaf undersides; neem oil spray effective.",
  },
  {
    name: "Spider Mites",
    months: [6, 7, 8],
    plants: ["tomatoes", "cucumbers", "herbs"],
    severity: "high",
    notes: "Hot dry weather accelerates outbreak; increase humidity.",
  },
  {
    name: "Fungus Gnats",
    months: [1, 2, 11, 12],
    plants: ["seedlings", "houseplants"],
    severity: "low",
    notes: "Overwatering promotes larvae; let topsoil dry between waterings.",
  },
];

export function getPestsForMonth(month: number): PestEntry[] {
  return PEST_CALENDAR.filter((p) => p.months.includes(month));
}
