import { describe, it, expect } from 'vitest';
import { getMonthlyPests, getTopPestAlert, THAILAND_PESTS as PEST_CALENDAR } from '../pest-calendar';

const VALID_ICON_TYPES = ['bug', 'fly', 'fungus', 'mite', 'aphid', 'scale', 'smoke', 'blight', 'mold'];
const VALID_TYPES = ['pest', 'disease'];

describe('PEST_CALENDAR data', () => {
  it('has at least 10 entries', () => {
    expect(PEST_CALENDAR.length).toBeGreaterThanOrEqual(10);
  });
  it('all entries have required fields', () => {
    for (const p of PEST_CALENDAR) {
      expect(p.name, `${p.name} missing name`).toBeTruthy();
      expect(p.months.length, `${p.name} has no months`).toBeGreaterThan(0);
      expect(['low', 'medium', 'high'], `${p.name} bad severity`).toContain(p.severity);
      expect(p.signs, `${p.name} missing signs`).toBeTruthy();
      expect(p.treatment, `${p.name} missing treatment`).toBeTruthy();
    }
  });
  it('all entries have iconType', () => {
    for (const p of PEST_CALENDAR) {
      expect(VALID_ICON_TYPES, `${p.name} has invalid iconType: ${p.iconType}`).toContain(p.iconType);
    }
  });
  it('all entries have type pest or disease', () => {
    for (const p of PEST_CALENDAR) {
      expect(VALID_TYPES).toContain(p.type);
    }
  });
  it('all months are valid (1-12)', () => {
    for (const p of PEST_CALENDAR) {
      for (const m of p.months) {
        expect(m).toBeGreaterThanOrEqual(1);
        expect(m).toBeLessThanOrEqual(12);
      }
    }
  });
});

describe('getMonthlyPests', () => {
  it('returns array for any month', () => {
    for (let m = 1; m <= 12; m++) {
      expect(Array.isArray(getMonthlyPests(m))).toBe(true);
    }
  });
  it('all returned pests include that month', () => {
    for (let m = 1; m <= 12; m++) {
      const pests = getMonthlyPests(m);
      for (const p of pests) {
        expect(p.months).toContain(m);
      }
    }
  });
  it('sorts high severity first', () => {
    // Find a month that has both high and low severity pests
    const pests = getMonthlyPests(1);
    if (pests.length > 1) {
      const order = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < pests.length; i++) {
        expect(order[pests[i - 1].severity]).toBeLessThanOrEqual(order[pests[i].severity]);
      }
    }
  });
  it('regional filter works — north pests appear for north region', () => {
    const allPests = getMonthlyPests(3);
    const northPests = getMonthlyPests(3, 'north');
    // north should have >= all (since it includes 'all' region pests + north-specific)
    expect(northPests.length).toBeGreaterThanOrEqual(allPests.length);
  });
});

describe('getTopPestAlert', () => {
  it('returns the highest severity pest or null', () => {
    for (let m = 1; m <= 12; m++) {
      const top = getTopPestAlert(m);
      if (top) {
        expect(['low', 'medium', 'high']).toContain(top.severity);
      }
    }
  });
  it('returns high severity when available', () => {
    // Month 1 has Mealybugs (high) and Spider Mites (high)
    const top = getTopPestAlert(1);
    expect(top?.severity).toBe('high');
  });
});
