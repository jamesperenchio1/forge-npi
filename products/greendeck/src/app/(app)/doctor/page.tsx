"use client";

import { useState, useRef } from "react";
import { DiagnosisResult } from "@/lib/gemini";
import { getPestsForMonth } from "@/lib/pest-calendar";
import Image from "next/image";

function compressImage(file: File, maxPx = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const base64 = canvas.toDataURL("image/jpeg", quality).split(",")[1];
      resolve(base64);
    };
    img.onerror = reject;
    img.src = url;
  });
}

const URGENCY_STYLES: Record<string, string> = {
  monitor: "bg-green-50 border-green-200 text-green-900",
  act_this_week: "bg-amber-50 border-amber-200 text-amber-900",
  act_today: "bg-orange-50 border-orange-200 text-orange-900",
  emergency: "bg-red-50 border-red-200 text-red-900",
};

const URGENCY_LABELS: Record<string, string> = {
  monitor: "Monitor",
  act_this_week: "Act this week",
  act_today: "Act today",
  emergency: "Emergency",
};

export default function DoctorPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [plantName, setPlantName] = useState("");
  const [region, setRegion] = useState("central");
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawBase64, setRawBase64] = useState<string | null>(null);

  const month = new Date().getMonth() + 1;
  const pests = getPestsForMonth(month, region);

  async function handleFile(file: File) {
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setResult(null);
    setError(null);
    const b64 = await compressImage(file);
    setRawBase64(b64);
  }

  async function diagnose() {
    if (!rawBase64) return;
    setDiagnosing(true);
    setError(null);
    try {
      const res = await fetch("/api/doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: rawBase64,
          plantName: plantName || null,
          region,
          month,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Diagnosis failed");
      setResult(json.diagnosis);
    } catch (e) {
      setError(String(e));
    } finally {
      setDiagnosing(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>Plant Doctor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload a photo — Gemini AI diagnoses your plant</p>
      </div>

      {/* Pest season banner */}
      {pests.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">This month in Thailand</p>
          <div className="space-y-1">
            {pests.slice(0, 2).map((p) => (
              <div key={p.name} className="flex items-start gap-2">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 ${
                  p.severity === "high" ? "bg-red-500" : p.severity === "medium" ? "bg-amber-500" : "bg-green-500"
                }`} />
                <p className="text-xs text-amber-900"><strong>{p.name}</strong> — {p.signs}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-2xl border-2 border-dashed border-border bg-card cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
      >
        {preview ? (
          <div className="relative w-full aspect-video">
            <Image src={preview} alt="Plant photo" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-white text-sm font-medium">Tap to change</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-4xl">📷</span>
            <p className="text-sm font-medium text-foreground">Tap to upload or drop photo</p>
            <p className="text-xs text-muted-foreground">Camera or gallery • JPEG, PNG, HEIC</p>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {/* Context */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plant name (optional)</label>
          <input
            value={plantName}
            onChange={(e) => setPlantName(e.target.value)}
            placeholder="e.g. Monstera Thai Constellation"
            className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="central">Central Thailand (Bangkok)</option>
            <option value="north">Northern Thailand (Chiang Mai)</option>
            <option value="south">Southern Thailand (Phuket / Hua Hin)</option>
            <option value="northeast">Northeast Thailand (Isan)</option>
          </select>
        </div>
      </div>

      <button
        onClick={diagnose}
        disabled={!rawBase64 || diagnosing}
        className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
      >
        {diagnosing ? "Diagnosing…" : "Diagnose Plant"}
      </button>

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Diagnosis result */}
      {result && (
        <div className="space-y-4">
          <div className={`rounded-2xl border p-4 ${URGENCY_STYLES[result.urgency] ?? "bg-card border-border"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-base">{result.condition}</p>
                <p className="text-xs mt-0.5 opacity-70">
                  Confidence: {result.confidence} · Severity: {result.severity}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/60 border border-current/20 whitespace-nowrap">
                {URGENCY_LABELS[result.urgency]}
              </span>
            </div>
          </div>

          {result.likely_cause && (
            <div className="rounded-2xl bg-card border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Diagnosis</p>
              <p className="text-sm leading-relaxed">{result.likely_cause}</p>
            </div>
          )}

          {result.symptoms_observed.length > 0 && (
            <div className="rounded-2xl bg-card border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Symptoms Observed</p>
              <ul className="space-y-1">
                {result.symptoms_observed.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-primary mt-0.5">·</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.treatment_steps.length > 0 && (
            <div className="rounded-2xl bg-card border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Treatment Plan</p>
              <ol className="space-y-3">
                {result.treatment_steps.map((t) => (
                  <li key={t.step} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">
                      {t.step}
                    </span>
                    <div>
                      <p className="text-sm">{t.action}</p>
                      {t.product && <p className="text-xs text-muted-foreground mt-0.5">Product: {t.product}</p>}
                      {t.thai_availability && (
                        <p className="text-xs text-primary/70 mt-0.5">Availability: {t.thai_availability}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.prevention && (
            <div className="rounded-2xl bg-muted border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Prevention</p>
              <p className="text-sm">{result.prevention}</p>
            </div>
          )}

          {result.seasonal_note && (
            <div className="rounded-2xl bg-secondary border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Thailand Note</p>
              <p className="text-sm">{result.seasonal_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
