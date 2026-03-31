import { getGeminiModel, buildDoctorPrompt, parseDiagnosis, DOCTOR_SYSTEM_PROMPT } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType = "image/jpeg", plantName, region = "central", month } = body;

    if (!imageBase64) {
      return Response.json({ error: "imageBase64 required" }, { status: 400 });
    }

    const currentMonth = month ?? new Date().getMonth() + 1;
    const model = getGeminiModel("gemini-1.5-flash");

    const result = await model.generateContent({
      systemInstruction: DOCTOR_SYSTEM_PROMPT,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            { text: buildDoctorPrompt(plantName, region, currentMonth) },
          ],
        },
      ],
    });

    const raw = result.response.text();
    const diagnosis = parseDiagnosis(raw);

    return Response.json({ diagnosis });
  } catch (e) {
    console.error("Doctor route error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
