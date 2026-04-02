import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const name = body?.name?.toString().trim();
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a plant expert. Return a JSON object (no markdown, no code blocks, pure JSON only) with information about the plant named "${name}".

Format:
{
  "scientific_name": "Genus species",
  "care_level": "easy",
  "watering": "Brief watering guide (1-2 sentences)",
  "sunlight": "Sunlight requirements (1-2 sentences)",
  "description": "Short description of the plant (2-3 sentences)"
}

For care_level use exactly: easy, moderate, or difficult.
Respond ONLY with the JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let details;
    try {
      details = JSON.parse(raw);
    } catch {
      // Try to extract JSON from the response
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        details = JSON.parse(match[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    return NextResponse.json({ details });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('plant-details error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
