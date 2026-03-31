// Pl@ntNet plant identification API
const BASE_URL = "https://my-api.plantnet.org/v2";

export async function identifyPlant(imageBase64: string, organs = ["leaf"]) {
  const apiKey = process.env.NEXT_PUBLIC_PLANTNET_API_KEY;
  const url = `${BASE_URL}/identify/all?api-key=${apiKey}`;
  const formData = new FormData();
  const blob = await (await fetch(`data:image/jpeg;base64,${imageBase64}`)).blob();
  formData.append("images", blob, "plant.jpg");
  organs.forEach((o) => formData.append("organs", o));
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`PlantNet error: ${res.status}`);
  return res.json();
}
