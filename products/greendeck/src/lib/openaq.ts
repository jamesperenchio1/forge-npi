// OpenAQ free air quality API — no key required for v2
const BASE_URL = "https://api.openaq.org/v2";

export async function getAirQuality(lat: number, lon: number, radius = 10000) {
  const url = `${BASE_URL}/locations?coordinates=${lat},${lon}&radius=${radius}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenAQ error: ${res.status}`);
  return res.json();
}
