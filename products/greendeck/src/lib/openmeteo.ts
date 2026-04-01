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
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    uv_index: number[];
    shortwave_radiation: number[];
    precipitation: number[];
  };
  minutely_15?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    precipitation: number[];
    shortwave_radiation: number[];
  };
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,shortwave_radiation,precipitation,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,wind_speed_10m_max,weather_code',
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,shortwave_radiation,precipitation',
    minutely_15: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,shortwave_radiation',
    forecast_days: '7',
    timezone: 'auto',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Weather fetch failed');
  return res.json();
}

// Keep old name for backward compat with weather API route
export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  return fetchWeather(lat, lon);
}

export function weatherCodeLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

export function uvLabel(uv: number): string {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  if (uv < 11) return 'Very High';
  return 'Extreme';
}

export function uvColor(uv: number): string {
  if (uv < 3) return 'text-green-600';
  if (uv < 6) return 'text-yellow-600';
  if (uv < 8) return 'text-orange-500';
  if (uv < 11) return 'text-red-600';
  return 'text-purple-700';
}
