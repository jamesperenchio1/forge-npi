"use client";

import { useState, useRef, useEffect } from "react";
import { DiagnosisResult } from "@/lib/gemini";
import { getPestsForMonth } from "@/lib/pest-calendar";
import { DoctorLog, LocalPlant } from "@/types";
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

// Small thumbnail for log previews
function compressThumbnail(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.onload = () => {
      const scale = Math.min(1, 120 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6).split(",")[1]);
    };
    img.src = `data:image/jpeg;base64,${base64}`;
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

function loadLogs(): DoctorLog[] {
  try {
    return JSON.parse(localStorage.getItem("greendeck_doctor_logs") ?? "[]");
  } catch {
    return [];
  }
}

function saveLogs(logs: DoctorLog[]) {
  localStorage.setItem("greendeck_doctor_logs", JSON.stringify(logs));
}

function loadPlants(): LocalPlant[] {
  try {
    return JSON.parse(localStorage.getItem("greendeck_plants") ?? "[]");
  } catch {
    return [];
  }
}

type Tab = "diagnose" | "history";

export default function DoctorPage() {
  const [tab, setTab] = useState<Tab>("diagnose");
  const [preview, setPreview] = useState<string | null>(null);
  const [plantName, setPlantName] = useState("");
  const [plantId, setPlantId] = useState("");
  const [region, setRegion] = useState("central");
  const [diagnosing, setDiagnosing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [rawBase64, setRawBase64] = useState<string | null>(null);
  const [logs, setLogs] = useState<DoctorLog[]>([]);
  const [plants, setPlants] = useState<LocalPlant[]>([]);
  const [savingLog, setSavingLog] = useState(false);
  const [logSaved, setLogSaved] = useState(false);

  const month = new Date().getMonth() + 1;
  const pests = getPestsForMonth(month, region);

  useEffect(() => {
    setLogs(loadLogs());
    setPlants(loadPlants());
  }, []);

  function handlePlantSelect(id: string) {
    setPlantId(id);
    if (id) {
      const p = plants.find((pl) => pl.id === id);
      setPlantName(p ? p.common_name : "");
    } else {
      setPlantName("");
    }
  }

  async function handleFile(file: File) {
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setResult(null);
    setError(null);
    setLogSaved(false);
    const b64 = await compressImage(file);
    setRawBase64(b64);
  }

  async function diagnose() {
    if (!rawBase64) return;
    setDiagnosing(true);
    setError(null);
    setLogSaved(false);
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

  async function saveToLog() {
    if (!result) return;
    setSavingLog(true);
    let thumbnail: string | undefined;
    try {
      if (rawBase64) thumbnail = await compressThumbnail(rawBase64);
    } catch {
      // thumbnail optional
    }
    const log: DoctorLog = {
      id: crypto.randomUUID(),
      plant_id: plantId || undefined,
      plant_name: plantName || "Unknown plant",
      condition: result.condition,
      confidence: result.confidence,
      severity: result.severity,
      urgency: result.urgency,
      symptoms_observed: result.symptoms_observed,
      likely_cause: result.likely_cause,
      treatment_steps: result.treatment_steps,
      prevention: result.prevention,
      seasonal_note: result.seasonal_note ?? undefined,
      timestamp: new Date().toISOString(),
      resolved: false,
      image_preview: thumbnail,
    };
    const updated = [log, ...logs];
    setLogs(updated);
    saveLogs(updated);
    setSavingLog(false);
    setLogSaved(true);
  }

  function toggleResolved(id: string) {
    const updated = logs.map((l) => l.id === id ? { ...l, resolved: !l.resolved } : l);
    setLogs(updated);
    saveLogs(updated);
  }

  function deleteLog(id: string) {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    saveLogs(updated);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>Plant Doctor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Diagnose plant problems with Gemini AI</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {(["diagnose", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "diagnose" ? "🔬 Diagnose" : `📋 History${logs.length > 0 ? ` (${logs.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "diagnose" && (
        <>
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
                <p className="text-xs text-muted-foreground">Camera or gallery · JPEG, PNG, HEIC</p>
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plant</label>
              {plants.length > 0 && (
                <select
                  value={plantId}
                  onChange={(e) => handlePlantSelect(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— Enter name manually —</option>
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.cover_emoji ?? "🌿"} {p.common_name}{p.collector_tag ? ` (${p.collector_tag})` : ""}
                    </option>
                  ))}
                </select>
              )}
              {!plantId && (
                <input
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  placeholder="e.g. Monstera Thai Constellation"
                  className="mt-1.5 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
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
                          {"thai_availability" in t && t.thai_availability && (
                            <p className="text-xs text-primary/70 mt-0.5">Availability: {String(t.thai_availability)}</p>
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

              {/* Save to log */}
              {logSaved ? (
                <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-800 font-medium text-center">
                  ✅ Saved to history
                </div>
              ) : (
                <button
                  onClick={saveToLog}
                  disabled={savingLog}
                  className="w-full rounded-2xl border border-primary text-primary py-3 font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
                >
                  {savingLog ? "Saving…" : "📋 Save to Log"}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <p className="text-3xl mb-3">🔬</p>
              <p className="text-sm font-medium text-foreground">No diagnoses saved yet</p>
              <p className="text-xs text-muted-foreground mt-1">Run a diagnosis and tap &quot;Save to Log&quot;</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`rounded-2xl border p-4 space-y-2 ${
                  log.resolved ? "opacity-60 bg-muted border-border" : URGENCY_STYLES[log.urgency] ?? "bg-card border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  {log.image_preview && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <Image
                        src={`data:image/jpeg;base64,${log.image_preview}`}
                        alt="Plant"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{log.condition}</p>
                        <p className="text-xs opacity-70">
                          {log.plant_name} · {new Date(log.timestamp).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/50 border border-current/20 whitespace-nowrap flex-shrink-0">
                        {URGENCY_LABELS[log.urgency] ?? log.urgency}
                      </span>
                    </div>
                    {log.likely_cause && (
                      <p className="text-xs mt-1.5 opacity-80 line-clamp-2">{log.likely_cause}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => toggleResolved(log.id)}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-semibold border transition-colors ${
                      log.resolved
                        ? "bg-muted border-border text-muted-foreground"
                        : "bg-green-100 border-green-300 text-green-800"
                    }`}
                  >
                    {log.resolved ? "↩ Reopen" : "✅ Mark Resolved"}
                  </button>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="px-3 rounded-xl py-1.5 text-xs font-semibold border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
