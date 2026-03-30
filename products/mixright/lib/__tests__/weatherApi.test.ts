import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWeather } from "../weatherApi";

function makeApiResponse(overrides: Record<string, unknown> = {}) {
  return {
    current: {
      temperature_2m: 31.4,
      relative_humidity_2m: 75,
      wind_speed_10m: 18,
      uv_index: 7.2,
    },
    daily: {
      time: ["2026-03-28", "2026-03-29"],
      temperature_2m_max:       [34.0, 32.5],
      temperature_2m_min:       [24.0, 23.1],
      relative_humidity_2m_max: [88,   82],
      precipitation_sum:        [0.0,  1.4],
      weathercode:              [0,    61],
      wind_speed_10m_max:       [22,   30],
      uv_index_max:             [8.4,  6.0],
    },
    // hourly is optional — omitting it should produce an empty todayHourly array
    ...overrides,
  };
}

describe("fetchWeather", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the Open-Meteo API with correct coordinates", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(),
    } as Response);

    await fetchWeather(13.7563, 100.5018);

    const calledUrl = (vi.mocked(fetch).mock.calls[0][0] as string);
    expect(calledUrl).toContain("13.7563");
    expect(calledUrl).toContain("100.5018");
    expect(calledUrl).toContain("open-meteo.com");
  });

  it("requests 7 forecast days", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(),
    } as Response);

    await fetchWeather(13.7563, 100.5018);

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("forecast_days=7");
  });

  it("transforms current weather with correct rounding", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(),
    } as Response);

    const result = await fetchWeather(0, 0);

    expect(result.current.temperatureC).toBe(31.4); // round(31.4 * 10) / 10
    expect(result.current.humidityPct).toBe(75);    // Math.round
    expect(result.current.windSpeedKph).toBe(18);   // Math.round
    expect(result.current.uvIndex).toBe(7.2);       // round(7.2 * 10) / 10
  });

  it("transforms forecast array to correct number of days", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(),
    } as Response);

    const result = await fetchWeather(0, 0);
    expect(result.forecast).toHaveLength(2);
  });

  it("transforms forecast day fields correctly", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(),
    } as Response);

    const result = await fetchWeather(0, 0);
    const day0 = result.forecast[0];

    expect(day0.date).toBe("2026-03-28");
    expect(day0.maxTempC).toBe(34.0);
    expect(day0.minTempC).toBe(24.0);
    expect(day0.maxHumidity).toBe(88);
    expect(day0.precipMm).toBe(0.0);
    expect(day0.weatherCode).toBe(0);
    expect(day0.windSpeedMax).toBe(22);
    expect(day0.uvIndexMax).toBe(8.4);
  });

  it("rounds precipitation to 1 decimal place", async () => {
    const raw = makeApiResponse();
    (raw.daily as Record<string, unknown>).precipitation_sum = [1.449, 2.999];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => raw,
    } as Response);

    const result = await fetchWeather(0, 0);
    expect(result.forecast[0].precipMm).toBe(1.4);
    expect(result.forecast[1].precipMm).toBe(3.0);
  });

  it("throws on non-OK HTTP response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response);

    await expect(fetchWeather(0, 0)).rejects.toThrow("Open-Meteo error: 429");
  });

  it("throws on network failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchWeather(0, 0)).rejects.toThrow("Network error");
  });

  it("returns empty todayHourly when hourly key is absent from response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(), // no hourly key
    } as Response);

    const result = await fetchWeather(0, 0);
    expect(result.todayHourly).toEqual([]);
  });

  it("parses todayHourly when hourly data is present", async () => {
    const withHourly = makeApiResponse({
      hourly: {
        time:                  ["2026-03-28T06:00", "2026-03-28T12:00"],
        temperature_2m:        [28.5, 35.1],
        relative_humidity_2m:  [80,   60],
        wind_speed_10m:        [10,   18],
        uv_index:              [2.0,  9.5],
      },
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => withHourly,
    } as Response);

    const result = await fetchWeather(0, 0);
    expect(result.todayHourly).toHaveLength(2);
    expect(result.todayHourly[0].hour).toBe(6);
    expect(result.todayHourly[0].tempC).toBe(28.5);
    expect(result.todayHourly[1].uvIndex).toBe(9.5);
    expect(result.todayHourly[1].time).toBe("12:00");
  });
});
