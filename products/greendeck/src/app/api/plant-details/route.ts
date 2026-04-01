import { getGeminiModel } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) return Response.json({ error: 'name required' }, { status: 400 });

    const model = getGeminiModel('gemini-1.5-flash');
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Return JSON for plant "${name}": { "scientific_name": "...", "care_level": "easy|moderate|difficult", "watering": "...", "sunlight": "...", "description": "..." }. Respond ONLY with valid JSON, no markdown.`,
        }],
      }],
    });

    const raw = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const details = JSON.parse(raw);
    return Response.json({ details });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
