const BASE = "https://api.open-meteo.com/v1";

export interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    uv_index: number;
    shortwave_radiation: number;
    precipitation: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    uv_index_max: number[];
    wind_speed_10m_max: number[];
    weather_code: number[];
  };
  hourly: {
    time: string[];
    uv_index: number[];
    shortwave_radiation: number[];
  };
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,shortwave_radiation,precipitation,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,wind_speed_10m_max,weather_code",
    hourly: "uv_index,shortwave_radiation",
    timezone: "auto",
    forecast_days: "7",
  });
  const res = await fetch(`${BASE}/forecast?${params}`, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json();
}

export function weatherCodeLabel(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 49) return "Foggy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

export function uvLabel(uv: number): { label: string; color: string } {
  if (uv < 3) return { label: "Low", color: "text-green-600" };
  if (uv < 6) return { label: "Moderate", color: "text-yellow-600" };
  if (uv < 8) return { label: "High", color: "text-orange-500" };
  if (uv < 11) return { label: "Very High", color: "text-red-600" };
  return { label: "Extreme", color: "text-purple-700" };
}
