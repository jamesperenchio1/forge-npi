"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LocalPlant } from "../page";
import { getPestsForMonth } from "@/lib/pest-calendar";
import { use } from "react";

const HEALTH_STYLES: Record<string, string> = {
  healthy: "bg-green-100 text-green-800 border-green-200",
  watch: "bg-amber-100 text-amber-800 border-amber-200",
  sick: "bg-red-100 text-red-800 border-red-200",
  dormant: "bg-slate-100 text-slate-600 border-slate-200",
};

const GROWING_TIPS: Record<string, { watering: string; light: string; tip: string }> = {
  soil: { watering: "When top 2–3cm is dry", light: "Bright indirect to full sun", tip: "In Bangkok heat, water morning — not afternoon. Dark pots cook roots." },
  kratky: { watering: "Top up reservoir when 50% depleted", light: "Bright indirect (avoid direct noon sun)", tip: "Check roots weekly. White/tan roots = healthy. Brown = root rot risk." },
  nft: { watering: "Continuous flow — monitor pump", light: "6–8 hrs daily", tip: "In monsoon, protect channels from flooding. Check EC weekly." },
  dwc: { watering: "Maintain reservoir level", light: "High light preferred", tip: "Oxygenate well in Bangkok heat — dissolved O₂ drops above 28°C." },
  semi_hydro: { watering: "Bottom water when reservoir dry", light: "Bright indirect", tip: "LECA wicks moisture. Flush every 4–6 weeks to prevent salt buildup." },
};

export default function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [plant, setPlant] = useState<LocalPlant | null>(null);
  const [editing, setEditing] = useState(false);
  const [healthEdit, setHealthEdit] = useState<LocalPlant["health_status"]>("healthy");

  const month = new Date().getMonth() + 1;
  const pests = getPestsForMonth(month);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("greendeck_plants") ?? "[]") as LocalPlant[];
    const found = stored.find((p) => p.id === id);
    if (found) { setPlant(found); setHealthEdit(found.health_status); }
  }, [id]);

  function updateHealth(status: LocalPlant["health_status"]) {
    if (!plant) return;
    const stored = JSON.parse(localStorage.getItem("greendeck_plants") ?? "[]") as LocalPlant[];
    const updated = stored.map((p) => p.id === plant.id ? { ...p, health_status: status } : p);
    localStorage.setItem("greendeck_plants", JSON.stringify(updated));
    setPlant({ ...plant, health_status: status });
    setHealthEdit(status);
    setEditing(false);
  }

  function deletePlant() {
    if (!confirm("Delete this plant?")) return;
    const stored = JSON.parse(localStorage.getItem("greendeck_plants") ?? "[]") as LocalPlant[];
    localStorage.setItem("greendeck_plants", JSON.stringify(stored.filter((p) => p.id !== id)));
    router.push("/plants");
  }

  if (!plant) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground">Plant not found.</p>
      <Link href="/plants" className="text-primary text-sm mt-2 block">← Back to collection</Link>
    </div>
  );

  const tips = GROWING_TIPS[plant.growing_system];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground text-2xl leading-none mt-1">‹</button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-3xl">{plant.cover_emoji ?? "🌿"}</span>
            <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>{plant.common_name}</h1>
          </div>
          {plant.scientific_name && (
            <p className="text-sm text-muted-foreground italic mt-0.5">{plant.scientific_name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">{plant.collector_tag}</p>
        </div>
      </div>

      {/* Health status */}
      <div className={`rounded-2xl border p-4 ${HEALTH_STYLES[plant.health_status]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Health Status</p>
            <p className="text-lg font-semibold mt-0.5 capitalize">{plant.health_status}</p>
          </div>
          <button onClick={() => setEditing(!editing)} className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/60 border border-current/20">
            Update
          </button>
        </div>
        {editing && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(["healthy", "watch", "sick", "dormant"] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateHealth(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-colors ${
                  healthEdit === s ? "bg-white border-current" : "bg-white/40 border-white/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Growing System", value: plant.growing_system.toUpperCase().replace("_", "-") },
          { label: "Stage", value: plant.stage.charAt(0).toUpperCase() + plant.stage.slice(1) },
          { label: "Added", value: new Date(plant.added_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" }) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl bg-card border border-border p-3.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold mt-0.5">{value}</p>
          </div>
        ))}
        <Link href="/doctor" className="rounded-2xl bg-primary/10 border border-primary/30 p-3.5 flex items-center gap-2 hover:bg-primary/20 transition-colors">
          <span className="text-lg">🔬</span>
          <div>
            <p className="text-xs text-primary/80">Plant Doctor</p>
            <p className="text-sm font-semibold text-primary">Diagnose</p>
          </div>
        </Link>
      </div>

      {/* Care guide */}
      {tips && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Care Guide</p>
          <div className="space-y-2.5">
            <div className="flex gap-2.5">
              <span className="text-lg">💧</span>
              <div><p className="text-xs text-muted-foreground">Watering</p><p className="text-sm">{tips.watering}</p></div>
            </div>
            <div className="flex gap-2.5">
              <span className="text-lg">☀️</span>
              <div><p className="text-xs text-muted-foreground">Light</p><p className="text-sm">{tips.light}</p></div>
            </div>
            <div className="flex gap-2.5">
              <span className="text-lg">🌏</span>
              <div><p className="text-xs text-muted-foreground">Thailand tip</p><p className="text-sm">{tips.tip}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Current pest risks */}
      {pests.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Watch for this month</p>
          <div className="space-y-2.5">
            {pests.slice(0, 2).map((p) => (
              <div key={p.name} className="flex items-start gap-3">
                <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  p.severity === "high" ? "bg-red-500" : p.severity === "medium" ? "bg-amber-500" : "bg-green-500"
                }`} />
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.signs}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {plant.notes && (
        <div className="rounded-2xl bg-muted border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm whitespace-pre-wrap">{plant.notes}</p>
        </div>
      )}

      {/* Delete */}
      <button
        onClick={deletePlant}
        className="w-full rounded-2xl border border-destructive/30 text-destructive py-3 text-sm font-medium"
      >
        Delete Plant
      </button>
    </div>
  );
}
