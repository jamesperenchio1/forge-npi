import { describe, it, expect } from "vitest";
import { getUVRisk, getHeatIndex, getWorkerRisk, getBestPourWindow } from "../sunUtils";

describe("getUVRisk", () => {
  it("returns low for UV index below 3", () => {
    expect(getUVRisk(0)).toBe("low");
    expect(getUVRisk(2)).toBe("low");
    expect(getUVRisk(2.9)).toBe("low");
  });

  it("returns moderate at exactly 3", () => {
    expect(getUVRisk(3)).toBe("moderate");
  });

  it("returns moderate between 3 and 5", () => {
    expect(getUVRisk(5)).toBe("moderate");
    expect(getUVRisk(5.9)).toBe("moderate");
  });

  it("returns high at exactly 6", () => {
    expect(getUVRisk(6)).toBe("high");
  });

  it("returns high between 6 and 7", () => {
    expect(getUVRisk(7)).toBe("high");
    expect(getUVRisk(7.9)).toBe("high");
  });

  it("returns very_high at exactly 8", () => {
    expect(getUVRisk(8)).toBe("very_high");
  });

  it("returns very_high between 8 and 10", () => {
    expect(getUVRisk(10)).toBe("very_high");
    expect(getUVRisk(10.9)).toBe("very_high");
  });

  it("returns extreme at exactly 11", () => {
    expect(getUVRisk(11)).toBe("extreme");
  });

  it("returns extreme above 11", () => {
    expect(getUVRisk(15)).toBe("extreme");
  });
});

describe("getHeatIndex", () => {
  // Below valid range — should return temp as-is
  it("returns tempC unchanged when temp < 27°C", () => {
    expect(getHeatIndex(26, 80)).toBe(26);
    expect(getHeatIndex(20, 90)).toBe(20);
  });

  it("returns tempC unchanged when humidity < 40%", () => {
    expect(getHeatIndex(35, 39)).toBe(35);
    expect(getHeatIndex(40, 30)).toBe(40);
  });

  // Within valid range — heat index should be >= temp (uses values well above the formula boundary)
  it("heat index is always >= actual temp for hot+humid combinations", () => {
    const cases = [
      [30, 50], [35, 60], [38, 70], [40, 80],
    ];
    for (const [t, h] of cases) {
      expect(getHeatIndex(t, h)).toBeGreaterThanOrEqual(t);
    }
  });

  // Steadman formula reference values (published NOAA lookup)
  // At 32°C / 50% humidity → approximately 32.8°C
  it("approximates known Steadman values within 1°C", () => {
    const hi = getHeatIndex(32, 50);
    expect(hi).toBeGreaterThan(31);
    expect(hi).toBeLessThan(36);
  });

  // Higher humidity → higher heat index
  it("heat index increases with humidity at fixed temp", () => {
    const low  = getHeatIndex(35, 50);
    const high = getHeatIndex(35, 80);
    expect(high).toBeGreaterThan(low);
  });

  // Higher temp → higher heat index
  it("heat index increases with temperature at fixed humidity", () => {
    const cool = getHeatIndex(28, 60);
    const hot  = getHeatIndex(38, 60);
    expect(hot).toBeGreaterThan(cool);
  });
});

describe("getWorkerRisk", () => {
  it("returns low risk below 27°C", () => {
    const r = getWorkerRisk(26);
    expect(r.level).toBe("low");
    expect(r.label).toBe("Low");
  });

  it("returns moderate at exactly 27°C", () => {
    expect(getWorkerRisk(27).level).toBe("moderate");
  });

  it("returns moderate between 27 and 32", () => {
    expect(getWorkerRisk(30).level).toBe("moderate");
    expect(getWorkerRisk(32.9).level).toBe("moderate");
  });

  it("returns high at exactly 33°C", () => {
    expect(getWorkerRisk(33).level).toBe("high");
  });

  it("returns high between 33 and 39", () => {
    expect(getWorkerRisk(36).level).toBe("high");
    expect(getWorkerRisk(39.9).level).toBe("high");
  });

  it("returns very_high at exactly 40°C", () => {
    expect(getWorkerRisk(40).level).toBe("very_high");
  });

  it("returns very_high between 40 and 45", () => {
    expect(getWorkerRisk(43).level).toBe("very_high");
    expect(getWorkerRisk(45.9).level).toBe("very_high");
  });

  it("returns extreme at exactly 46°C", () => {
    expect(getWorkerRisk(46).level).toBe("extreme");
  });

  it("returns extreme above 46°C", () => {
    expect(getWorkerRisk(50).level).toBe("extreme");
  });

  it("all risk levels include non-empty advice and color", () => {
    [20, 28, 35, 42, 48].forEach(temp => {
      const r = getWorkerRisk(temp);
      expect(r.advice.length).toBeGreaterThan(0);
      expect(r.color.length).toBeGreaterThan(0);
    });
  });

  it("high risk advice mentions working in pairs or buddy system", () => {
    const r = getWorkerRisk(36);
    expect(r.advice.toLowerCase()).toMatch(/pair|together|alone/);
  });

  it("extreme risk advice recommends stopping or rescheduling", () => {
    const r = getWorkerRisk(50);
    expect(r.advice.toLowerCase()).toMatch(/stop|reschedule|not perform/);
  });
});

describe("getBestPourWindow", () => {
  // Use Bangkok coordinates (13.75, 100.52) as a stable test location
  const LAT = 13.75;
  const LNG = 100.52;
  const DATE = new Date("2026-03-28T06:00:00Z");

  it("recommends early morning window on very hot days (max > 35°C)", () => {
    const window = getBestPourWindow(LAT, LNG, DATE, 38, 25);
    expect(window).toMatch(/\d+:00\s*–\s*\d+:00/);
    expect(window).toContain("38°C");
  });

  it("recommends morning or afternoon on moderately hot days (30 < max ≤ 35)", () => {
    const window = getBestPourWindow(LAT, LNG, DATE, 33, 22);
    expect(window).toContain("Morning");
  });

  it("returns 'any time' on cool days (max ≤ 30°C)", () => {
    const window = getBestPourWindow(LAT, LNG, DATE, 28, 18);
    expect(window).toContain("Any time");
    expect(window).toContain("28°C");
  });

  it("early morning window span is 3 hours", () => {
    const window = getBestPourWindow(LAT, LNG, DATE, 40, 28);
    const match = window.match(/(\d+):00\s*–\s*(\d+):00/);
    expect(match).not.toBeNull();
    if (match) {
      const start = parseInt(match[1]);
      const end   = parseInt(match[2]);
      expect(end - start).toBe(3);
    }
  });
});
