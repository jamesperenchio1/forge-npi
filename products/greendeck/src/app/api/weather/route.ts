import { getWeather } from "@/lib/openmeteo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "13.7563");
  const lon = parseFloat(searchParams.get("lon") ?? "100.5018");

  if (isNaN(lat) || isNaN(lon)) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const data = await getWeather(lat, lon);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
