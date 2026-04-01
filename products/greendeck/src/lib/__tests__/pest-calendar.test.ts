import { describe, it, expect } from 'vitest';
import { getMonthlyPests, THAILAND_PESTS as PEST_CALENDAR } from '../pest-calendar';

describe('PEST_CALENDAR', () => {
  it('has entries', () => {
    expect(PEST_CALENDAR.length).toBeGreaterThan(0);
  });
  it('all entries have required fields', () => {
    for (const p of PEST_CALENDAR) {
      expect(p.name).toBeTruthy();
      expect(p.months.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(p.severity);
    }
  });
});

describe('getMonthlyPests', () => {
  it('returns pests for a given month', () => {
    const pests = getMonthlyPests(4); // April
    expect(Array.isArray(pests)).toBe(true);
  });
  it('filters by month correctly', () => {
    const pests = getMonthlyPests(1);
    for (const p of pests) {
      expect(p.months).toContain(1);
    }
  });
});
