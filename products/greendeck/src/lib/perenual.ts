// Perenual plant care API
const BASE_URL = "https://perenual.com/api";

export async function searchPlants(query: string) {
  const apiKey = process.env.PERENUAL_API_KEY;
  const url = `${BASE_URL}/species-list?key=${apiKey}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Perenual error: ${res.status}`);
  return res.json();
}

export async function getPlantDetails(id: number) {
  const apiKey = process.env.PERENUAL_API_KEY;
  const url = `${BASE_URL}/species/details/${id}?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Perenual error: ${res.status}`);
  return res.json();
}
