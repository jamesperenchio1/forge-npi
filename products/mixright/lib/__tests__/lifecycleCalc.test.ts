import { describe, it, expect } from "vitest";
import { calculateLifecycle, stageAt, pourDateToStages } from "../lifecycleCalc";

const POUR_DATE = new Date("2026-03-28T08:00:00Z");

describe("calculateLifecycle — stage ordering and non-overlap", () => {
  it("returns 8 stages", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    expect(stages).toHaveLength(8);
  });

  it("first stage always starts at 0", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    expect(stages[0].startH).toBe(0);
  });

  it("each stage startH equals previous stage endH", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    for (let i = 1; i < stages.length; i++) {
      expect(stages[i].startH).toBeCloseTo(stages[i - 1].endH, 1);
    }
  });

  it("no stage has endH <= startH (all positive duration)", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    for (const s of stages) {
      expect(s.endH).toBeGreaterThan(s.startH);
    }
  });

  it("stage ids are unique", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    const ids = stages.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("calculateLifecycle — temperature factor", () => {
  // Hot conditions compress early stages
  it("hot conditions (>=38°C) compress plastic/workable stage end", () => {
    const hot    = calculateLifecycle(POUR_DATE, 38, 70, false);
    const normal = calculateLifecycle(POUR_DATE, 25, 70, false);
    expect(hot[0].endH).toBeLessThan(normal[0].endH);
  });

  // Cold conditions extend early stages
  it("cold conditions (<18°C) extend plastic/workable stage", () => {
    const cold   = calculateLifecycle(POUR_DATE, 15, 70, false);
    const normal = calculateLifecycle(POUR_DATE, 25, 70, false);
    expect(cold[0].endH).toBeGreaterThan(normal[0].endH);
  });

  it("tempFactor at 38°C produces tf=0.60 (plastic stage endH ≈ 1.2h)", () => {
    const stages = calculateLifecycle(POUR_DATE, 38, 70, false);
    // plastic endH = round(2 * 0.60 * 10) / 10 = 1.2
    expect(stages[0].endH).toBeCloseTo(1.2, 1);
  });

  it("tempFactor at 25°C produces tf=1.00 (plastic stage endH = 2.0h)", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    expect(stages[0].endH).toBeCloseTo(2.0, 1);
  });

  it("tempFactor below 18°C produces tf=1.40 (plastic stage endH = 2.8h)", () => {
    const stages = calculateLifecycle(POUR_DATE, 10, 70, false);
    expect(stages[0].endH).toBeCloseTo(2.8, 1);
  });
});

describe("calculateLifecycle — humidity factor", () => {
  it("high humidity (>=85%) extends working_strength stage", () => {
    const humid = calculateLifecycle(POUR_DATE, 25, 90, false);
    const dry   = calculateLifecycle(POUR_DATE, 25, 40, false);
    // working_strength startH = 168 * hf; humid hf=1.35, dry hf=0.80
    const workStrengthHumid = humid.find(s => s.id === "working_strength")!;
    const workStrengthDry   = dry.find(s => s.id === "working_strength")!;
    expect(workStrengthHumid.startH).toBeGreaterThan(workStrengthDry.startH);
  });

  it("tiling stage endH is longer in high humidity (>=80%)", () => {
    const humid = calculateLifecycle(POUR_DATE, 25, 85, false);
    const dry   = calculateLifecycle(POUR_DATE, 25, 50, false);
    const tilingHumid = humid.find(s => s.id === "dry_tile")!;
    const tilingDry   = dry.find(s => s.id === "dry_tile")!;
    expect(tilingHumid.endH).toBeGreaterThan(tilingDry.endH);
  });
});

describe("calculateLifecycle — structural vs non-structural", () => {
  it("structural: active_curing stage includes 'Keep formwork in place'", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, true);
    const active = stages.find(s => s.id === "active_curing")!;
    expect(active.actions.join(" ")).toContain("Keep formwork in place");
  });

  it("non-structural: active_curing stage allows light formwork removal", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    const active = stages.find(s => s.id === "active_curing")!;
    expect(active.actions.join(" ")).toContain("Light formwork can be removed");
  });

  it("structural: working_strength has warning about 28-day load", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, true);
    const ws = stages.find(s => s.id === "working_strength")!;
    expect(ws.warnings.join(" ")).toContain("28-day cure");
  });

  it("non-structural: working_strength has no structural warnings", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    const ws = stages.find(s => s.id === "working_strength")!;
    expect(ws.warnings).toHaveLength(0);
  });
});

describe("calculateLifecycle — hot/dry warnings", () => {
  it("plastic stage gets hot warning when temp >= 33°C", () => {
    const stages = calculateLifecycle(POUR_DATE, 33, 70, false);
    const plastic = stages.find(s => s.id === "plastic")!;
    expect(plastic.warnings.join(" ")).toContain("wet hessian");
  });

  it("plastic stage gets shrinkage warning at low humidity + high heat", () => {
    const stages = calculateLifecycle(POUR_DATE, 35, 45, false);
    const plastic = stages.find(s => s.id === "plastic")!;
    expect(plastic.warnings.join(" ")).toContain("Plastic shrinkage risk");
  });

  it("cool conditions produce no warnings on plastic stage", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    const plastic = stages.find(s => s.id === "plastic")!;
    expect(plastic.warnings).toHaveLength(0);
  });
});

describe("stageAt", () => {
  it("returns first stage at hour 0", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    const result = stageAt(stages, 0);
    expect(result?.id).toBe("plastic");
  });

  it("returns correct stage mid-timeline", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    // 48h should be in early_strength (24–72h at neutral conditions)
    const result = stageAt(stages, 48);
    expect(result?.id).toBe("early_strength");
  });

  it("returns last stage when hours exceed all stages", () => {
    const stages = calculateLifecycle(POUR_DATE, 25, 70, false);
    const result = stageAt(stages, 99999);
    expect(result?.id).toBe(stages[stages.length - 1].id);
  });
});

describe("pourDateToStages", () => {
  it("attaches startDate and endDate to each stage", () => {
    const stages = pourDateToStages(POUR_DATE, 25, 70, false);
    for (const s of stages) {
      expect(s.startDate).toBeInstanceOf(Date);
      expect(s.endDate).toBeInstanceOf(Date);
      expect(s.endDate.getTime()).toBeGreaterThan(s.startDate.getTime());
    }
  });

  it("first stage startDate equals pourDate", () => {
    const stages = pourDateToStages(POUR_DATE, 25, 70, false);
    expect(stages[0].startDate.getTime()).toBe(POUR_DATE.getTime());
  });

  it("startDate offset matches startH in milliseconds", () => {
    const stages = pourDateToStages(POUR_DATE, 25, 70, false);
    for (const s of stages) {
      const expectedMs = POUR_DATE.getTime() + s.startH * 3_600_000;
      expect(s.startDate.getTime()).toBeCloseTo(expectedMs, -1); // within 10ms
    }
  });
});
