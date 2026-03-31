"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocalPlant } from "../page";

const EMOJIS = ["🌿", "🪴", "🌵", "🌸", "🌺", "🍃", "🌾", "🎋", "🍀", "🌱", "🌼", "🌻", "🍄", "🪷", "🌴"];

export default function NewPlantPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    common_name: "",
    scientific_name: "",
    collector_tag: "",
    health_status: "healthy" as LocalPlant["health_status"],
    growing_system: "soil" as LocalPlant["growing_system"],
    stage: "established" as LocalPlant["stage"],
    notes: "",
    cover_emoji: "🌿",
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function save() {
    if (!form.common_name.trim()) return;
    setSaving(true);
    const existing: LocalPlant[] = JSON.parse(localStorage.getItem("greendeck_plants") ?? "[]");
    const newPlant: LocalPlant = {
      ...form,
      id: crypto.randomUUID(),
      collector_tag: form.collector_tag || `GD-${String(existing.length + 1).padStart(3, "0")}`,
      added_at: new Date().toISOString(),
    };
    localStorage.setItem("greendeck_plants", JSON.stringify([...existing, newPlant]));
    router.push("/plants");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground text-2xl leading-none">‹</button>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>New Plant</h1>
      </div>

      {/* Emoji picker */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Icon</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => update("cover_emoji", e)}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border transition-colors ${
                form.cover_emoji === e ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Common name <span className="text-destructive">*</span>
          </label>
          <input
            value={form.common_name}
            onChange={(e) => update("common_name", e.target.value)}
            placeholder="e.g. Monstera Thai Constellation"
            className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scientific name</label>
          <input
            value={form.scientific_name}
            onChange={(e) => update("scientific_name", e.target.value)}
            placeholder="e.g. Monstera deliciosa 'Thai Constellation'"
            className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm italic outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your label / tag</label>
          <input
            value={form.collector_tag}
            onChange={(e) => update("collector_tag", e.target.value)}
            placeholder="e.g. BKK-001 (auto-generated if blank)"
            className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Health</label>
            <select
              value={form.health_status}
              onChange={(e) => update("health_status", e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="healthy">Healthy</option>
              <option value="watch">Watch</option>
              <option value="sick">Sick</option>
              <option value="dormant">Dormant</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => update("stage", e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="seed">Seed</option>
              <option value="seedling">Seedling</option>
              <option value="juvenile">Juvenile</option>
              <option value="established">Established</option>
              <option value="specimen">Specimen</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Growing System</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["soil", "kratky", "nft", "dwc", "semi_hydro"] as const).map((sys) => (
              <button
                key={sys}
                onClick={() => update("growing_system", sys)}
                className={`rounded-xl border py-2 text-xs font-semibold transition-colors ${
                  form.growing_system === sys ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                }`}
              >
                {sys === "semi_hydro" ? "Semi-Hydro" : sys.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Variegation notes, origin, propagation history…"
            rows={3}
            className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={!form.common_name.trim() || saving}
        className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
      >
        {saving ? "Saving…" : "Save Plant"}
      </button>
    </div>
  );
}
