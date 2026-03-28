import { describe, it, expect } from "vitest";
import { calculateMultiMix } from "../mixCalculator";
import { MIX_CLASSES } from "../constants";

const BUCKET_L = 20;
const CEMENT_BAG_L = 33.3;

describe("calculateMultiMix", () => {
  // Basic output shape
  it("returns the correct structure", () => {
    const result = calculateMultiMix(
      [{ applicationId: "slab", numBags: 2 }],
      "river",
      1,
      25,
      60
    );
    expect(result).toHaveProperty("perApp");
    expect(result).toHaveProperty("totals");
    expect(result).toHaveProperty("cementWarning");
    expect(result).toHaveProperty("adjustments");
    expect(result.perApp).toHaveLength(1);
  });

  // Correct mix class selection
  it("uses recommended mix class for each application type", () => {
    const result = calculateMultiMix(
      [
        { applicationId: "footing", numBags: 1 },
        { applicationId: "slab",    numBags: 1 },
        { applicationId: "post",    numBags: 1 },
      ],
      "river",
      1,
      25,
      60
    );
    expect(result.perApp[0].mixClass).toBe("high");
    expect(result.perApp[1].mixClass).toBe("general");
    expect(result.perApp[2].mixClass).toBe("basic");
  });

  it("respects mixClassOverride", () => {
    const result = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1, mixClassOverride: "high" }],
      "river",
      1,
      25,
      60
    );
    expect(result.perApp[0].mixClass).toBe("high");
  });

  // Water-cement ratio baseline (river sand, 25°C, 60% humidity — zero adjustments)
  it("calculates waterPerBag from WCR at neutral conditions (general/river)", () => {
    const result = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }],
      "river",
      1,
      25,  // 0 temp adj
      60   // 0 humidity adj
    );
    const wcr = MIX_CLASSES.general.wcr; // 0.55
    const expectedBaseWater = 50 * wcr;  // 27.5 L
    // river sand adj = 0, humidity adj = 0, temp adj = 0
    expect(result.perApp[0].waterPerBag).toBeCloseTo(expectedBaseWater, 0);
  });

  // Sand type adjustments increase water
  it("increases waterPerBag for crushed sand vs river sand", () => {
    const river = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river",   1, 25, 60
    );
    const crushed = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "crushed", 1, 25, 60
    );
    expect(crushed.perApp[0].waterPerBag).toBeGreaterThan(river.perApp[0].waterPerBag);
  });

  it("mixed sand waterPerBag is between river and crushed", () => {
    const river = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river", 1, 25, 60
    );
    const mixed = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "mixed", 1, 25, 60
    );
    const crushed = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "crushed", 1, 25, 60
    );
    expect(mixed.perApp[0].waterPerBag).toBeGreaterThan(river.perApp[0].waterPerBag);
    expect(mixed.perApp[0].waterPerBag).toBeLessThan(crushed.perApp[0].waterPerBag);
  });

  // Temperature adjustments
  it("adds more water at high temperatures (>=38°C)", () => {
    const hot = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river", 1, 38, 60
    );
    const neutral = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river", 1, 25, 60
    );
    expect(hot.adjustments.temperature).toBe(0.5);
    expect(hot.perApp[0].waterPerBag).toBeGreaterThan(neutral.perApp[0].waterPerBag);
  });

  it("reduces water at low temperatures (<25°C)", () => {
    const cool = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river", 1, 20, 60
    );
    expect(cool.adjustments.temperature).toBe(-0.2);
  });

  // Humidity adjustments
  it("reduces water at high humidity (>=90%)", () => {
    const humid = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river", 1, 25, 90
    );
    expect(humid.adjustments.humidity).toBe(-0.8);
  });

  it("adds water at low humidity (<50%)", () => {
    const dry = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river", 1, 25, 40
    );
    expect(dry.adjustments.humidity).toBe(0.4);
  });

  // Minimum water floor
  it("waterPerBag never drops below 10L", () => {
    // Use extreme cool+humid conditions to drive water down
    const result = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river", 1, 15, 95
    );
    expect(result.perApp[0].waterPerBag).toBeGreaterThanOrEqual(10);
  });

  // Bucket calculations
  it("calculates correct sand buckets per bag for general mix", () => {
    const result = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river", 1, 25, 60
    );
    // general: sand proportion = 2
    const expectedSand = Math.round((2 * CEMENT_BAG_L / BUCKET_L) * 10) / 10;
    expect(result.perApp[0].buckets.sand).toBeCloseTo(expectedSand, 1);
  });

  it("calculates correct gravel buckets per bag for high-strength mix", () => {
    const result = calculateMultiMix(
      [{ applicationId: "footing", numBags: 1 }], "river", 1, 25, 60
    );
    // high: gravel proportion = 3
    const expectedGravel = Math.round((3 * CEMENT_BAG_L / BUCKET_L) * 10) / 10;
    expect(result.perApp[0].buckets.gravel).toBeCloseTo(expectedGravel, 1);
  });

  // Totals accumulation
  it("accumulates totals correctly across multiple applications", () => {
    const result = calculateMultiMix(
      [
        { applicationId: "slab",    numBags: 2 },
        { applicationId: "footing", numBags: 3 },
      ],
      "river",
      1,
      25,
      60
    );
    expect(result.totals.totalBags).toBe(5);
    const expectedWater = Math.round(
      (result.perApp[0].totalWater + result.perApp[1].totalWater) * 10
    ) / 10;
    expect(result.totals.totalWater).toBeCloseTo(expectedWater, 1);
  });

  it("totalWater equals waterPerBag * numBags for single app", () => {
    const result = calculateMultiMix(
      [{ applicationId: "slab", numBags: 4 }], "river", 1, 25, 60
    );
    const app = result.perApp[0];
    expect(app.totalWater).toBeCloseTo(app.waterPerBag * 4, 0);
  });

  // Cement age warning
  it("returns ok warning for fresh cement (<=1 month)", () => {
    const result = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river", 1, 25, 60
    );
    expect(result.cementWarning.level).toBe("ok");
  });

  it("returns danger warning for old cement (>6 months)", () => {
    const result = calculateMultiMix(
      [{ applicationId: "slab", numBags: 1 }], "river", 7, 25, 60
    );
    expect(result.cementWarning.level).toBe("danger");
  });

  // Empty apps array
  it("handles empty selectedApps with zero totals", () => {
    const result = calculateMultiMix([], "river", 1, 25, 60);
    expect(result.perApp).toHaveLength(0);
    expect(result.totals.totalBags).toBe(0);
    expect(result.totals.totalWater).toBe(0);
  });
});
