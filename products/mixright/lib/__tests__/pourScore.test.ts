import { describe, it, expect } from "vitest";
import { computePourScore, pourScoreLabel, pourScoreReason } from "../pourScore";
import type { ForecastDay } from "../weatherApi";

function day(overrides: Partial<ForecastDay> = {}): ForecastDay {
  return {
    date: "2026-03-28",
    maxTempC: 25,
    minTempC: 18,
    maxHumidity: 60,
    precipMm: 0,
    weatherCode: 0,
    windSpeedMax: 10,
    uvIndexMax: 5,
    ...overrides,
  };
}

describe("computePourScore", () => {
  // --- Green ---
  it("returns green for ideal conditions", () => {
    expect(computePourScore(day())).toBe("green");
  });

  // --- Red: rain threshold ---
  it("returns red when precipMm is exactly 5 (not above)", () => {
    // 5mm is NOT > 5, so should not be red from rain alone
    expect(computePourScore(day({ precipMm: 5 }))).not.toBe("red");
  });

  it("returns red when precipMm exceeds 5mm", () => {
    expect(computePourScore(day({ precipMm: 5.1 }))).toBe("red");
    expect(computePourScore(day({ precipMm: 20 }))).toBe("red");
  });

  // --- Red: weather code ---
  it("returns red for weather code 51 (drizzle threshold)", () => {
    expect(computePourScore(day({ weatherCode: 51 }))).toBe("red");
  });

  it("returns red for weather codes above 51", () => {
    expect(computePourScore(day({ weatherCode: 63 }))).toBe("red");
    expect(computePourScore(day({ weatherCode: 95 }))).toBe("red");
  });

  it("does NOT return red for weather code 50", () => {
    // Code 50 is below rain threshold but above overcast (3), should be yellow
    expect(computePourScore(day({ weatherCode: 50 }))).toBe("yellow");
  });

  // --- Red: heat threshold ---
  it("returns red when maxTempC is exactly 38", () => {
    expect(computePourScore(day({ maxTempC: 38 }))).toBe("red");
  });

  it("returns red when maxTempC exceeds 38", () => {
    expect(computePourScore(day({ maxTempC: 40 }))).toBe("red");
  });

  it("does NOT return red at 37.9°C", () => {
    expect(computePourScore(day({ maxTempC: 37.9 }))).not.toBe("red");
  });

  // --- Red: wind threshold ---
  it("returns red when windSpeedMax is exactly 40", () => {
    expect(computePourScore(day({ windSpeedMax: 40 }))).toBe("red");
  });

  it("returns red when windSpeedMax exceeds 40", () => {
    expect(computePourScore(day({ windSpeedMax: 55 }))).toBe("red");
  });

  it("does NOT return red at wind 39", () => {
    expect(computePourScore(day({ windSpeedMax: 39 }))).not.toBe("red");
  });

  // --- Yellow: overcast ---
  it("returns yellow for weather code 3 (overcast)", () => {
    expect(computePourScore(day({ weatherCode: 3 }))).toBe("yellow");
  });

  it("returns yellow for weather codes between 3 and 50", () => {
    expect(computePourScore(day({ weatherCode: 45 }))).toBe("yellow");
  });

  it("returns green for weather code 2 (partly cloudy)", () => {
    expect(computePourScore(day({ weatherCode: 2 }))).toBe("green");
  });

  // --- Yellow: hot ---
  it("returns yellow at exactly 33°C", () => {
    expect(computePourScore(day({ maxTempC: 33 }))).toBe("yellow");
  });

  it("returns yellow between 33 and 38", () => {
    expect(computePourScore(day({ maxTempC: 35 }))).toBe("yellow");
  });

  it("returns green at 32.9°C", () => {
    expect(computePourScore(day({ maxTempC: 32.9 }))).toBe("green");
  });

  // --- Yellow: humidity ---
  it("returns yellow at exactly 90% humidity", () => {
    expect(computePourScore(day({ maxHumidity: 90 }))).toBe("yellow");
  });

  it("returns yellow above 90% humidity", () => {
    expect(computePourScore(day({ maxHumidity: 95 }))).toBe("yellow");
  });

  it("returns green at 89% humidity", () => {
    expect(computePourScore(day({ maxHumidity: 89 }))).toBe("green");
  });

  // --- Yellow: light rain ---
  it("returns yellow for precipMm > 0 and ≤ 5", () => {
    expect(computePourScore(day({ precipMm: 0.5 }))).toBe("yellow");
    expect(computePourScore(day({ precipMm: 5 }))).toBe("yellow");
  });

  // --- Yellow: moderate wind ---
  it("returns yellow at exactly 25 kph wind", () => {
    expect(computePourScore(day({ windSpeedMax: 25 }))).toBe("yellow");
  });

  it("returns green at 24 kph wind", () => {
    expect(computePourScore(day({ windSpeedMax: 24 }))).toBe("green");
  });
});

describe("pourScoreLabel", () => {
  it("returns correct label for green", () => {
    expect(pourScoreLabel("green")).toBe("Good day to pour");
  });

  it("returns correct label for yellow", () => {
    expect(pourScoreLabel("yellow")).toBe("Pour with caution");
  });

  it("returns correct label for red", () => {
    expect(pourScoreLabel("red")).toBe("Avoid pouring");
  });
});

describe("pourScoreReason", () => {
  it("returns 'good conditions' when no issues", () => {
    expect(pourScoreReason(day())).toBe("good conditions");
  });

  it("includes rain expected for precipMm > 5", () => {
    expect(pourScoreReason(day({ precipMm: 10 }))).toContain("rain expected");
  });

  it("includes rain expected for weatherCode >= 51", () => {
    expect(pourScoreReason(day({ weatherCode: 61 }))).toContain("rain expected");
  });

  it("includes extreme heat message at 38°C", () => {
    const reason = pourScoreReason(day({ maxTempC: 38 }));
    expect(reason).toContain("extreme heat");
    expect(reason).toContain("38°C");
  });

  it("includes plastic shrinkage risk at high wind", () => {
    expect(pourScoreReason(day({ windSpeedMax: 40 }))).toContain("plastic shrinkage risk");
  });

  it("includes overcast for weatherCode between 3 and 50", () => {
    expect(pourScoreReason(day({ weatherCode: 3 }))).toContain("overcast");
  });

  it("does NOT include overcast for weatherCode >= 51 (uses rain instead)", () => {
    // weatherCode 51 triggers rain expected, not overcast
    expect(pourScoreReason(day({ weatherCode: 51 }))).not.toContain("overcast");
  });

  it("includes hot day message at 33°C", () => {
    const reason = pourScoreReason(day({ maxTempC: 33 }));
    expect(reason).toContain("33°C");
    expect(reason).toContain("pour early morning");
  });

  it("includes very high humidity message", () => {
    expect(pourScoreReason(day({ maxHumidity: 90 }))).toContain("very high humidity");
  });

  it("includes possible light rain for 0 < precip ≤ 5", () => {
    expect(pourScoreReason(day({ precipMm: 2 }))).toContain("possible light rain");
  });

  it("can combine multiple reasons", () => {
    const reason = pourScoreReason(day({ maxTempC: 35, maxHumidity: 90 }));
    expect(reason).toContain("hot day");
    expect(reason).toContain("very high humidity");
  });
});
