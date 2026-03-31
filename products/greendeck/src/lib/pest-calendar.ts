export type PestEntry = {
  name: string;
  months: number[];
  severity: "low" | "medium" | "high";
  treatment: string;
  signs: string;
  region?: "all" | "north" | "central" | "south";
};

// Thailand-specific seasonal pest calendar
// Sources: Bangkok Post, Thai Garden Design, Sound Horticulture
export const THAILAND_PESTS: PestEntry[] = [
  {
    name: "Mealybugs",
    months: [11, 12, 1, 2, 10],
    severity: "high",
    signs: "White cottony clusters at leaf joints, sooty mold follows",
    treatment: "Neem oil spray, tobacco water, or isopropyl alcohol on cotton swab. Biological: Cryptolaemus beetles.",
    region: "all",
  },
  {
    name: "Spider Mites",
    months: [3, 4, 5, 11, 12, 1],
    severity: "high",
    signs: "Fine webbing on leaves, stippled/bronze discolouration, leaf drop",
    treatment: "Strong water spray, insecticidal soap every 4–5 days. Increase humidity.",
    region: "all",
  },
  {
    name: "Fungus Gnats",
    months: [5, 6, 7, 8, 9, 10],
    severity: "medium",
    signs: "Tiny black flies near soil, yellowing seedlings, root damage",
    treatment: "Let top 3cm of soil dry fully. Yellow sticky traps. H₂O₂ drench (1:4 ratio).",
    region: "all",
  },
  {
    name: "Thrips",
    months: [3, 4, 5, 6, 7],
    severity: "medium",
    signs: "Silver streaks on leaves, black excrement spots, distorted new growth",
    treatment: "Neem oil, spinosad spray. Amblyseius cucumeris predatory mites for biocontrol.",
    region: "all",
  },
  {
    name: "Aphids",
    months: [2, 3, 4, 11, 12],
    severity: "low",
    signs: "Clusters of soft insects on new growth, sticky honeydew, ant activity",
    treatment: "Strong water blast, neem oil, soapy water spray. Encourage ladybugs.",
    region: "all",
  },
  {
    name: "Root Rot (Pythium)",
    months: [5, 6, 7, 8, 9, 10],
    severity: "high",
    signs: "Wilting despite wet soil, brown/mushy roots, yellowing leaves",
    treatment: "Reduce watering. Improve drainage. Hydrogen peroxide drench. Remove affected roots.",
    region: "all",
  },
  {
    name: "Smoke/PM2.5 Damage",
    months: [2, 3, 4],
    severity: "medium",
    signs: "Leaf surface grime, reduced photosynthesis, slow growth",
    treatment: "Wipe leaves with damp cloth. Move sensitive plants indoors. Avoid foliar feeding.",
    region: "north",
  },
];

export function getPestsForMonth(month: number, region: string = "all"): PestEntry[] {
  return THAILAND_PESTS.filter(
    (p) =>
      p.months.includes(month) &&
      (p.region === "all" || p.region === region)
  ).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}

export function getTopPestAlert(month: number, region: string = "all"): PestEntry | null {
  const pests = getPestsForMonth(month, region);
  return pests[0] ?? null;
}
