import { describe, it, expect } from 'vitest';
import { weatherCodeLabel, uvLabel, uvColor } from '../openmeteo';

describe('weatherCodeLabel', () => {
  it('returns Clear sky for code 0', () => {
    expect(weatherCodeLabel(0)).toBe('Clear sky');
  });
  it('returns Partly cloudy for codes 1-3', () => {
    expect(weatherCodeLabel(1)).toBe('Partly cloudy');
    expect(weatherCodeLabel(2)).toBe('Partly cloudy');
    expect(weatherCodeLabel(3)).toBe('Partly cloudy');
  });
  it('returns Foggy for codes 4-49', () => {
    expect(weatherCodeLabel(45)).toBe('Foggy');
  });
  it('returns Drizzle for codes 50-57', () => {
    expect(weatherCodeLabel(51)).toBe('Drizzle');
  });
  it('returns Rain for codes 61-67', () => {
    expect(weatherCodeLabel(61)).toBe('Rain');
    expect(weatherCodeLabel(65)).toBe('Rain');
  });
  it('returns Rain showers for codes 80-82', () => {
    expect(weatherCodeLabel(80)).toBe('Rain showers');
    expect(weatherCodeLabel(82)).toBe('Rain showers');
  });
  it('returns Thunderstorm for codes 95-99', () => {
    expect(weatherCodeLabel(95)).toBe('Thunderstorm');
    expect(weatherCodeLabel(99)).toBe('Thunderstorm');
  });
  it('returns Unknown for unrecognised codes', () => {
    expect(weatherCodeLabel(999)).toBe('Unknown');
  });
});

describe('uvLabel', () => {
  it('returns Low for UV < 3', () => {
    expect(uvLabel(0)).toMatch(/low/i);
    expect(uvLabel(2.9)).toMatch(/low/i);
  });
  it('returns Moderate for UV 3-5', () => {
    expect(uvLabel(3)).toMatch(/moderate/i);
    expect(uvLabel(5.9)).toMatch(/moderate/i);
  });
  it('returns High for UV 6-7', () => {
    expect(uvLabel(6)).toMatch(/high/i);
    expect(uvLabel(7.9)).toMatch(/high/i);
  });
  it('returns Very High for UV 8-10', () => {
    expect(uvLabel(8)).toMatch(/very high/i);
    expect(uvLabel(10.9)).toMatch(/very high/i);
  });
  it('returns Extreme for UV >= 11', () => {
    expect(uvLabel(11)).toMatch(/extreme/i);
    expect(uvLabel(15)).toMatch(/extreme/i);
  });
});

describe('uvColor', () => {
  it('returns a text- CSS class string', () => {
    expect(uvColor(0)).toMatch(/^text-/);
    expect(uvColor(5)).toMatch(/^text-/);
    expect(uvColor(11)).toMatch(/^text-/);
  });
  it('returns different colours for different ranges', () => {
    const low = uvColor(1);
    const extreme = uvColor(12);
    expect(low).not.toBe(extreme);
  });
});
