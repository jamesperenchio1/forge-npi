export interface LifecycleStage {
  id: string;
  name: string;
  startH: number;   // hours after pour
  endH: number;
  description: string;
  actions: string[];
  warnings: string[];
  color: string;      // Tailwind bg color class
  textColor: string;
}

// Temperature factor: accelerates or slows set times relative to 25°C baseline
function tempFactor(tempC: number): number {
  if (tempC >= 38) return 0.60;
  if (tempC >= 33) return 0.75;
  if (tempC >= 28) return 0.90;
  if (tempC >= 23) return 1.00;
  if (tempC >= 18) return 1.20;
  return 1.40;
}

// Humidity factor: high humidity slows surface drying (extends curing beneficial period)
function humidityFactor(humidity: number): number {
  if (humidity >= 85) return 1.35;
  if (humidity >= 75) return 1.15;
  if (humidity >= 60) return 1.00;
  if (humidity >= 45) return 0.90;
  return 0.80; // dry: sets faster but crack risk higher
}

export function calculateLifecycle(
  pourDate: Date,
  tempC: number,
  humidityPct: number,
  isStructural: boolean
): LifecycleStage[] {
  const tf = tempFactor(tempC);
  const hf = humidityFactor(humidityPct);

  const hotWarning = tempC >= 33
    ? "High temp accelerates set — work fast. Cover with wet hessian immediately after placing."
    : "";
  const dryShrinkWarning = humidityPct < 50 && tempC > 30
    ? "Plastic shrinkage risk: low humidity + high heat. Mist surface every 20 min during first 4 hours."
    : "";

  const stages: LifecycleStage[] = [
    {
      id: "plastic",
      name: "Plastic / Workable",
      startH: 0,
      endH: Math.round(2 * tf * 10) / 10,
      description: "Concrete can still be placed, vibrated, and surface-finished.",
      actions: [
        "Place and compact into formwork now",
        "Vibrate to remove air pockets",
        "Screed and float the surface",
        "Do NOT add extra water to make it easier to work",
      ],
      warnings: [hotWarning, dryShrinkWarning].filter(Boolean),
      color: "bg-blue-500",
      textColor: "text-blue-700",
    },
    {
      id: "initial_set",
      name: "Initial Set",
      startH: Math.round(2 * tf * 10) / 10,
      endH: Math.round(6 * tf * 10) / 10,
      description: "Concrete is stiffening. Surface cannot be reworked.",
      actions: [
        "Stop all surface finishing",
        "Begin curing — apply wet hessian or plastic sheet",
        "Protect from rain and direct sun",
      ],
      warnings: [
        "Do NOT disturb formwork",
        hotWarning,
      ].filter(Boolean),
      color: "bg-indigo-500",
      textColor: "text-indigo-700",
    },
    {
      id: "final_set",
      name: "Final Set",
      startH: Math.round(6 * tf * 10) / 10,
      endH: 24 * tf,
      description: "Surface is hard. Internal hydration continues rapidly. Keep moist.",
      actions: [
        "Keep surface wet — re-wet hessian if it dries out",
        "Protect from foot traffic",
        "Maintain curing continuously",
      ],
      warnings: [
        "Allowing surface to dry now causes permanent strength loss",
      ],
      color: "bg-violet-500",
      textColor: "text-violet-700",
    },
    {
      id: "early_strength",
      name: "Early Strength (Days 1–3)",
      startH: 24 * tf,
      endH: 72 * tf * hf,
      description: "Rapid strength gain — ~40% of design strength by day 3. Do not load.",
      actions: [
        "Water morning and evening (or keep hessian continuously wet)",
        "No load on slab, no backfill against walls",
        "Avoid impact or vibration nearby",
      ],
      warnings: [],
      color: "bg-amber-500",
      textColor: "text-amber-700",
    },
    {
      id: "active_curing",
      name: "Active Curing (Days 3–7)",
      startH: 72 * tf * hf,
      endH: 168 * hf,
      description: "Continued strength gain toward working strength. Keep moist.",
      actions: [
        "Continue wetting daily",
        "Lightweight foot traffic OK after day 3 on slabs",
        isStructural ? "Keep formwork in place" : "Light formwork can be removed",
      ],
      warnings: [],
      color: "bg-orange-500",
      textColor: "text-orange-700",
    },
    {
      id: "working_strength",
      name: "Working Strength (Day 7)",
      startH: 168 * hf,
      endH: 336 * hf,
      description: "~65% of design strength. Formwork can be removed from most elements.",
      actions: [
        isStructural ? "Remove column/wall formwork" : "Full use OK for non-structural",
        "Continue wetting for best final strength",
        isStructural ? "No heavy structural loading yet" : "Normal loading OK",
      ],
      warnings: isStructural ? ["Do not apply design load until 28-day cure"] : [],
      color: "bg-green-500",
      textColor: "text-green-700",
    },
    {
      id: "full_cure",
      name: "Full Cure (Day 28)",
      startH: 336 * hf,
      endH: 672,
      description: "100% design strength. All loading permitted.",
      actions: [
        "Curing complete — no more wetting needed",
        isStructural ? "Full structural load can be applied" : "Full use",
        "Surface is ready for sealer or coatings",
      ],
      warnings: [],
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
    },
    {
      id: "dry_tile",
      name: "Ready for Tiling",
      startH: 672,
      endH: humidityPct >= 80 ? 1344 : 840,  // longer in humid climates
      description: `Surface moisture low enough for adhesive bonding. In ${humidityPct}% humidity, expect ${humidityPct >= 80 ? "8–10 weeks" : "4–6 weeks"}.`,
      actions: [
        "Test with plastic sheet taped to floor — no condensation under sheet after 24h",
        "Use moisture-tolerant adhesive if in doubt",
        "Tile grout will not bond properly if slab is still damp",
      ],
      warnings: humidityPct >= 80 ? ["High humidity significantly extends drying time for tiling"] : [],
      color: "bg-teal-500",
      textColor: "text-teal-700",
    },
  ];

  return stages.map(s => ({
    ...s,
    startH: Math.round(s.startH * 10) / 10,
    endH:   Math.round(s.endH * 10) / 10,
  }));
}

export function stageAt(stages: LifecycleStage[], hoursSincePour: number): LifecycleStage | null {
  return stages.find(s => hoursSincePour >= s.startH && hoursSincePour < s.endH) ?? stages[stages.length - 1];
}

export function pourDateToStages(pourDate: Date, tempC: number, humidity: number, isStructural: boolean) {
  const stages = calculateLifecycle(pourDate, tempC, humidity, isStructural);
  // Attach absolute timestamps
  return stages.map(s => ({
    ...s,
    startDate: new Date(pourDate.getTime() + s.startH * 3600000),
    endDate:   new Date(pourDate.getTime() + s.endH   * 3600000),
  }));
}
