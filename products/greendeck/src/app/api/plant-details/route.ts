import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const MODEL_CHAIN = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

const PROMPT = (name: string) => `You are a plant expert. Return a JSON object (no markdown, no code blocks, pure JSON only) with information about the plant named "${name}".

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

function parseJSON(raw: string) {
  const cleaned = raw.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('No JSON found in response');
  }
}

function isQuotaError(e: unknown): boolean {
  if (e instanceof Error) return e.message.includes('429') || e.message.includes('quota');
  return String(e).includes('429') || String(e).includes('quota');
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const name = body?.name?.toString().trim();
  if (!name) return NextResponse.json({ error: 'Plant name is required' }, { status: 400 });

  let lastError: unknown;

  for (const modelName of MODEL_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(PROMPT(name));
      const details = parseJSON(result.response.text());
      return NextResponse.json({ details });
    } catch (e: unknown) {
      lastError = e;
      if (isQuotaError(e)) continue;
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: `All models failed. Last: ${String(lastError)}` }, { status: 500 });
}
