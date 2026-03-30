export interface CurrentWeather {
  temperatureC: number;
  humidityPct: number;
  windSpeedKph: number;
  uvIndex: number;
}

export interface ForecastDay {
  date: string;           // "YYYY-MM-DD"
  maxTempC: number;
  minTempC: number;
  maxHumidity: number;
  precipMm: number;
  weatherCode: number;
  windSpeedMax: number;
  uvIndexMax: number;
}

// One hourly data point for the intraday timeline.
// UV index is 0 at night — this is correct; solar UV only exists during daylight.
// Source: Open-Meteo hourly variables — open-meteo.com/en/docs
export interface HourlyPoint {
  time: string;       // "HH:00"
  hour: number;       // 0–23
  tempC: number;
  humidityPct: number;
  windKph: number;
  uvIndex: number;
}

export interface WeatherResponse {
  current: CurrentWeather;
  forecast: ForecastDay[];
  todayHourly: HourlyPoint[];  // 24 points for today; empty if unavailable
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherResponse> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude",  lat.toFixed(4));
  url.searchParams.set("longitude", lng.toFixed(4));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index");
  url.searchParams.set("daily", [
    "temperature_2m_max",
    "temperature_2m_min",
    "relative_humidity_2m_max",
    "precipitation_sum",
    "weathercode",
    "wind_speed_10m_max",
    "uv_index_max",
  ].join(","));
  url.searchParams.set("hourly", [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "uv_index",
  ].join(","));
  url.searchParams.set("timezone",      "auto");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("forecast_hours", "24");  // only today's 24 hours for hourly

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

  const data = await res.json();

  const current: CurrentWeather = {
    temperatureC: Math.round(data.current.temperature_2m * 10) / 10,
    humidityPct:  Math.round(data.current.relative_humidity_2m),
    windSpeedKph: Math.round(data.current.wind_speed_10m),
    uvIndex:      Math.round(data.current.uv_index * 10) / 10,
  };

  const forecast: ForecastDay[] = (data.daily.time as string[]).map((date: string, i: number) => ({
    date,
    maxTempC:    Math.round(data.daily.temperature_2m_max[i] * 10) / 10,
    minTempC:    Math.round(data.daily.temperature_2m_min[i] * 10) / 10,
    maxHumidity: Math.round(data.daily.relative_humidity_2m_max[i]),
    precipMm:    Math.round(data.daily.precipitation_sum[i] * 10) / 10,
    weatherCode: data.daily.weathercode[i],
    windSpeedMax: Math.round(data.daily.wind_speed_10m_max[i]),
    uvIndexMax:  Math.round(data.daily.uv_index_max[i] * 10) / 10,
  }));

  // Parse today's 24-hour breakdown (may be absent in mock/offline mode)
  let todayHourly: HourlyPoint[] = [];
  if (data.hourly?.time) {
    todayHourly = (data.hourly.time as string[]).map((iso: string, i: number) => {
      const hour = new Date(iso).getHours();
      return {
        time: `${String(hour).padStart(2, "0")}:00`,
        hour,
        tempC:       Math.round(data.hourly.temperature_2m[i] * 10) / 10,
        humidityPct: Math.round(data.hourly.relative_humidity_2m[i]),
        windKph:     Math.round(data.hourly.wind_speed_10m[i]),
        uvIndex:     Math.round(data.hourly.uv_index[i] * 10) / 10,
      };
    });
  }

  return { current, forecast, todayHourly };
}
