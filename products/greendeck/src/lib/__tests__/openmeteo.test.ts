import { describe, it, expect } from 'vitest';
import { weatherCodeLabel, uvLabel } from '../openmeteo';

describe('weatherCodeLabel', () => {
  it('returns Clear sky for code 0', () => {
    expect(weatherCodeLabel(0)).toBe('Clear sky');
  });
  it('returns Partly cloudy for code 1-3', () => {
    expect(weatherCodeLabel(1)).toBe('Partly cloudy');
    expect(weatherCodeLabel(3)).toBe('Partly cloudy');
  });
  it('returns Rain for code 61', () => {
    expect(weatherCodeLabel(61)).toBe('Rain');
  });
  it('returns Thunderstorm for code 95', () => {
    expect(weatherCodeLabel(95)).toBe('Thunderstorm');
  });
});

describe('uvLabel', () => {
  it('returns low label for UV < 3', () => {
    const result = uvLabel(1);
    expect(typeof result === 'string' ? result : result.label).toMatch(/low/i);
  });
  it('returns extreme for UV >= 11', () => {
    const result = uvLabel(11);
    expect(typeof result === 'string' ? result : result.label).toMatch(/extreme/i);
  });
});
