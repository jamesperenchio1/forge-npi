import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getGeminiModel(modelName = "gemini-1.5-flash") {
  return genAI.getGenerativeModel({ model: modelName });
}

export const DOCTOR_SYSTEM_PROMPT = `You are a plant disease and pest diagnostic expert specialising in tropical Thailand conditions.
You diagnose problems with aroids, ornamental plants, herbs, and hydroponic crops grown in Bangkok, Chiang Mai, and other Thai regions.
Always respond with valid JSON only — no markdown, no text outside the JSON object.`;

export const buildDoctorPrompt = (
  plantName: string | null,
  region: string,
  month: number
): string => {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `Diagnose this plant. Context:
- Plant name: ${plantName ?? "unknown"}
- Location region: ${region} Thailand
- Current month: ${months[month - 1]}

Respond ONLY with this JSON:
{
  "condition": "short condition name",
  "confidence": "high | medium | low",
  "severity": "none | mild | moderate | severe",
  "symptoms_observed": ["list", "of", "symptoms"],
  "likely_cause": "one paragraph plain English",
  "treatment_steps": [{"step": 1, "action": "...", "product": "optional", "thai_availability": "easily found | specialty shop | online only"}],
  "prevention": "one sentence",
  "seasonal_note": "Thailand-specific note or null",
  "urgency": "monitor | act_this_week | act_today | emergency"
}`;
};

export interface DiagnosisResult {
  condition: string;
  confidence: "high" | "medium" | "low";
  severity: "none" | "mild" | "moderate" | "severe";
  symptoms_observed: string[];
  likely_cause: string;
  treatment_steps: { step: number; action: string; product?: string; thai_availability?: string }[];
  prevention: string;
  seasonal_note: string | null;
  urgency: "monitor" | "act_this_week" | "act_today" | "emergency";
}

export function parseDiagnosis(raw: string): DiagnosisResult {
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      condition: "Analysis inconclusive",
      confidence: "low",
      severity: "none",
      symptoms_observed: [],
      likely_cause: "Could not parse diagnosis. Please try again with a clearer photo.",
      treatment_steps: [],
      prevention: "Ensure good lighting and a clear, close-up photo.",
      seasonal_note: null,
      urgency: "monitor",
    };
  }
}
