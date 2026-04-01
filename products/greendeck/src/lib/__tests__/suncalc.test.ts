import { describe, it, expect } from 'vitest';
import { getSunPosition, getSunTimes, getDaySunPath } from '../suncalc';

const BANGKOK = { lat: 13.7563, lon: 100.5018 };

describe('getSunPosition', () => {
  it('returns altitude and azimuth', () => {
    const pos = getSunPosition(BANGKOK.lat, BANGKOK.lon);
    expect(typeof pos.altitude).toBe('number');
    expect(typeof pos.azimuthDegrees).toBe('number');
    expect(pos.azimuthDegrees).toBeGreaterThanOrEqual(0);
    expect(pos.azimuthDegrees).toBeLessThan(360);
  });
});

describe('getSunTimes', () => {
  it('returns sunrise before sunset', () => {
    const times = getSunTimes(BANGKOK.lat, BANGKOK.lon);
    expect(times.sunrise.getTime()).toBeLessThan(times.sunset.getTime());
  });
});

describe('getDaySunPath', () => {
  it('returns 24 entries', () => {
    const path = getDaySunPath(BANGKOK.lat, BANGKOK.lon);
    expect(path.length).toBe(24);
  });
  it('each entry has hour, altitude, azimuth', () => {
    const path = getDaySunPath(BANGKOK.lat, BANGKOK.lon);
    expect(path[0]).toHaveProperty('hour', 0);
    expect(path[12]).toHaveProperty('hour', 12);
  });
});
