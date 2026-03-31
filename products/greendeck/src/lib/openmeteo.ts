// Open-Meteo free weather API — no key required
const BASE_URL = "https://api.open-meteo.com/v1";

export async function getForecast(lat: number, lon: number) {
  const url = `${BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,windspeed_10m&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  return res.json();
}
