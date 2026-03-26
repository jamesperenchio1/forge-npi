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

export interface WeatherResponse {
  current: CurrentWeather;
  forecast: ForecastDay[];
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherResponse> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat.toFixed(4));
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
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

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

  return { current, forecast };
}
