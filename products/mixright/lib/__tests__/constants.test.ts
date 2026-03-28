import { describe, it, expect } from "vitest";
import {
  MIX_CLASSES,
  APPLICATION_TYPES,
  SAND_ADJUSTMENTS,
  getHumidityWaterAdj,
  getTempWaterAdj,
  getCementAgeWarning,
  getCureTime,
  getWeatherInfo,
  WEATHER_CODES,
} from "../constants";

describe("MIX_CLASSES", () => {
  it("defines high, general, and basic mix classes", () => {
    expect(MIX_CLASSES).toHaveProperty("high");
    expect(MIX_CLASSES).toHaveProperty("general");
    expect(MIX_CLASSES).toHaveProperty("basic");
  });

  it("high strength has lowest WCR (most water-restrictive)", () => {
    expect(MIX_CLASSES.high.wcr).toBeLessThan(MIX_CLASSES.general.wcr);
    expect(MIX_CLASSES.general.wcr).toBeLessThan(MIX_CLASSES.basic.wcr);
  });

  it("all mix classes have positive proportions", () => {
    for (const [, cls] of Object.entries(MIX_CLASSES)) {
      expect(cls.proportions.sand).toBeGreaterThan(0);
      expect(cls.proportions.gravel).toBeGreaterThan(0);
    }
  });

  it("gravel proportion is always greater than sand (standard concrete ratios)", () => {
    for (const [, cls] of Object.entries(MIX_CLASSES)) {
      expect(cls.proportions.gravel).toBeGreaterThanOrEqual(cls.proportions.sand);
    }
  });
});

describe("APPLICATION_TYPES", () => {
  it("contains 9 application types", () => {
    expect(APPLICATION_TYPES).toHaveLength(9);
  });

  it("all application IDs are unique", () => {
    const ids = APPLICATION_TYPES.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all recommended mix classes are valid keys", () => {
    const validKeys = new Set(["high", "general", "basic"]);
    for (const app of APPLICATION_TYPES) {
      expect(validKeys.has(app.recommended)).toBe(true);
    }
  });

  it("structural applications use high-strength mix", () => {
    const structural = APPLICATION_TYPES.filter(a => a.isStructural);
    for (const app of structural) {
      expect(app.recommended).toBe("high");
    }
  });

  it("known structural types are footing, column, stairs", () => {
    const structuralIds = APPLICATION_TYPES.filter(a => a.isStructural).map(a => a.id);
    expect(structuralIds).toContain("footing");
    expect(structuralIds).toContain("column");
    expect(structuralIds).toContain("stairs");
  });
});

describe("SAND_ADJUSTMENTS", () => {
  it("river sand has zero adjustment (baseline)", () => {
    expect(SAND_ADJUSTMENTS.river).toBe(0);
  });

  it("crushed sand has positive adjustment (needs more water)", () => {
    expect(SAND_ADJUSTMENTS.crushed).toBeGreaterThan(0);
  });

  it("mixed sand adjustment is between river and crushed", () => {
    expect(SAND_ADJUSTMENTS.mixed).toBeGreaterThan(SAND_ADJUSTMENTS.river);
    expect(SAND_ADJUSTMENTS.mixed).toBeLessThan(SAND_ADJUSTMENTS.crushed);
  });
});

describe("getHumidityWaterAdj", () => {
  it("returns -0.8 at 90% humidity", () => {
    expect(getHumidityWaterAdj(90)).toBe(-0.8);
    expect(getHumidityWaterAdj(95)).toBe(-0.8);
  });

  it("returns -0.4 at 80-89% humidity", () => {
    expect(getHumidityWaterAdj(80)).toBe(-0.4);
    expect(getHumidityWaterAdj(89)).toBe(-0.4);
  });

  it("returns -0.2 at 70-79% humidity", () => {
    expect(getHumidityWaterAdj(70)).toBe(-0.2);
    expect(getHumidityWaterAdj(79)).toBe(-0.2);
  });

  it("returns 0 at 60-69% humidity (neutral)", () => {
    expect(getHumidityWaterAdj(60)).toBe(0);
    expect(getHumidityWaterAdj(65)).toBe(0);
  });

  it("returns 0.2 at 50-59% humidity", () => {
    expect(getHumidityWaterAdj(50)).toBe(0.2);
    expect(getHumidityWaterAdj(59)).toBe(0.2);
  });

  it("returns 0.4 below 50% humidity (driest)", () => {
    expect(getHumidityWaterAdj(49)).toBe(0.4);
    expect(getHumidityWaterAdj(10)).toBe(0.4);
  });

  it("adjustment decreases monotonically as humidity increases", () => {
    const humidities = [10, 50, 60, 70, 80, 90];
    const adjs = humidities.map(h => getHumidityWaterAdj(h));
    for (let i = 1; i < adjs.length; i++) {
      expect(adjs[i]).toBeLessThanOrEqual(adjs[i - 1]);
    }
  });
});

describe("getTempWaterAdj", () => {
  it("returns 0.5 at >= 38°C", () => {
    expect(getTempWaterAdj(38)).toBe(0.5);
    expect(getTempWaterAdj(45)).toBe(0.5);
  });

  it("returns 0.3 at 34-37°C", () => {
    expect(getTempWaterAdj(34)).toBe(0.3);
    expect(getTempWaterAdj(37)).toBe(0.3);
  });

  it("returns 0.1 at 30-33°C", () => {
    expect(getTempWaterAdj(30)).toBe(0.1);
    expect(getTempWaterAdj(33)).toBe(0.1);
  });

  it("returns 0 at 25-29°C (neutral)", () => {
    expect(getTempWaterAdj(25)).toBe(0);
    expect(getTempWaterAdj(29)).toBe(0);
  });

  it("returns -0.2 below 25°C", () => {
    expect(getTempWaterAdj(24)).toBe(-0.2);
    expect(getTempWaterAdj(10)).toBe(-0.2);
  });

  it("adjustment increases with temperature", () => {
    const temps = [10, 25, 30, 34, 38];
    const adjs = temps.map(t => getTempWaterAdj(t));
    for (let i = 1; i < adjs.length; i++) {
      expect(adjs[i]).toBeGreaterThanOrEqual(adjs[i - 1]);
    }
  });
});

describe("getCementAgeWarning", () => {
  it("ok for <= 1 month", () => {
    expect(getCementAgeWarning(0).level).toBe("ok");
    expect(getCementAgeWarning(1).level).toBe("ok");
  });

  it("warn for 2-3 months", () => {
    expect(getCementAgeWarning(2).level).toBe("warn");
    expect(getCementAgeWarning(3).level).toBe("warn");
  });

  it("warn for 4-6 months", () => {
    expect(getCementAgeWarning(4).level).toBe("warn");
    expect(getCementAgeWarning(6).level).toBe("warn");
  });

  it("danger for > 6 months", () => {
    expect(getCementAgeWarning(7).level).toBe("danger");
    expect(getCementAgeWarning(24).level).toBe("danger");
  });

  it("all levels return a non-empty message", () => {
    [0, 2, 5, 12].forEach(months => {
      expect(getCementAgeWarning(months).message.length).toBeGreaterThan(0);
    });
  });
});

describe("getCureTime", () => {
  it("structural base is 14 days, non-structural is 7 days", () => {
    const structural    = getCureTime(70, true);
    const nonStructural = getCureTime(70, false);
    expect(structural.minDays).toBeGreaterThan(nonStructural.minDays);
  });

  it("high humidity extends cure days", () => {
    const humid = getCureTime(90, false);
    const normal = getCureTime(70, false);
    expect(humid.minDays).toBeGreaterThan(normal.minDays);
  });

  it("low humidity can reduce cure days slightly", () => {
    const dry    = getCureTime(50, false);
    const normal = getCureTime(70, false);
    expect(dry.minDays).toBeLessThan(normal.minDays);
  });

  it("high humidity note mentions plastic sheet test", () => {
    const r = getCureTime(90, false);
    expect(r.note).toContain("plastic sheet");
  });

  it("normal humidity note mentions morning and evening watering", () => {
    const r = getCureTime(70, false);
    expect(r.note).toContain("morning and evening");
  });

  it("minDays is always positive", () => {
    [30, 50, 60, 75, 85, 95].forEach(h => {
      expect(getCureTime(h, false).minDays).toBeGreaterThan(0);
      expect(getCureTime(h, true).minDays).toBeGreaterThan(0);
    });
  });
});

describe("getWeatherInfo", () => {
  it("returns correct label for known WMO codes", () => {
    expect(getWeatherInfo(0).label).toBe("Clear sky");
    expect(getWeatherInfo(3).label).toBe("Overcast");
    expect(getWeatherInfo(51).label).toBe("Light drizzle");
    expect(getWeatherInfo(95).label).toBe("Thunderstorm");
  });

  it("falls back to nearest lower code for unknown codes", () => {
    // Code 62 is not in the table — nearest lower is 61 (Light rain)
    expect(getWeatherInfo(62).label).toBe("Light rain");
  });

  it("returns Unknown for codes below all known codes", () => {
    expect(getWeatherInfo(-1).label).toBe("Unknown");
  });

  it("all known WEATHER_CODE entries return themselves exactly", () => {
    for (const [code] of Object.entries(WEATHER_CODES)) {
      const result = getWeatherInfo(Number(code));
      expect(result.label).toBe(WEATHER_CODES[Number(code)].label);
    }
  });
});
