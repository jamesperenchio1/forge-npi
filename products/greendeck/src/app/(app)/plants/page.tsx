"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export type LocalPlant = {
  id: string;
  collector_tag: string;
  common_name: string;
  scientific_name?: string;
  health_status: "healthy" | "watch" | "sick" | "dormant";
  growing_system: "soil" | "kratky" | "nft" | "dwc" | "semi_hydro";
  stage: "seed" | "seedling" | "juvenile" | "established" | "specimen";
  notes?: string;
  added_at: string;
  cover_emoji?: string;
};

const HEALTH_STYLES: Record<string, string> = {
  healthy: "bg-green-100 text-green-800",
  watch: "bg-amber-100 text-amber-800",
  sick: "bg-red-100 text-red-800",
  dormant: "bg-slate-100 text-slate-600",
};

const SYSTEM_LABELS: Record<string, string> = {
  soil: "Soil",
  kratky: "Kratky",
  nft: "NFT",
  dwc: "DWC",
  semi_hydro: "Semi-Hydro",
};

export default function PlantsPage() {
  const [plants, setPlants] = useState<LocalPlant[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const stored = localStorage.getItem("greendeck_plants");
    if (stored) setPlants(JSON.parse(stored));
  }, []);

  const filtered = filter === "all" ? plants : plants.filter((p) => p.health_status === filter);
  const counts = {
    healthy: plants.filter((p) => p.health_status === "healthy").length,
    watch: plants.filter((p) => p.health_status === "watch").length,
    sick: plants.filter((p) => p.health_status === "sick").length,
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>My Collection</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{plants.length} specimen{plants.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/plants/new"
          className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold active:scale-[0.97] transition-transform"
        >
          + Add
        </Link>
      </div>

      {/* Health summary */}
      {plants.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "healthy", label: "Healthy", count: counts.healthy, color: "text-green-700 bg-green-50 border-green-200" },
            { key: "watch", label: "Watch", count: counts.watch, color: "text-amber-700 bg-amber-50 border-amber-200" },
            { key: "sick", label: "Needs care", count: counts.sick, color: "text-red-700 bg-red-50 border-red-200" },
          ].map(({ key, label, count, color }) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? "all" : key)}
              className={`rounded-2xl border p-3 text-center transition-all ${color} ${filter === key ? "ring-2 ring-offset-1 ring-primary/40" : ""}`}
            >
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filter chips */}
      {plants.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", "healthy", "watch", "sick", "dormant"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Plant list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-6xl">{plants.length === 0 ? "🌱" : "🔍"}</span>
          <div className="text-center">
            <p className="font-semibold">{plants.length === 0 ? "No plants yet" : "No plants match this filter"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {plants.length === 0 ? "Add your first specimen to get started" : "Try a different filter"}
            </p>
          </div>
          {plants.length === 0 && (
            <Link
              href="/plants/new"
              className="rounded-2xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold"
            >
              Add First Plant
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((plant) => (
            <div
              key={plant.id}
              className="rounded-2xl bg-card border border-border p-4 flex items-center gap-4 active:scale-[0.99] transition-transform"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                {plant.cover_emoji ?? "🌿"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm truncate">{plant.common_name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${HEALTH_STYLES[plant.health_status]}`}>
                    {plant.health_status}
                  </span>
                </div>
                {plant.scientific_name && (
                  <p className="text-xs text-muted-foreground italic mt-0.5 truncate">{plant.scientific_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {SYSTEM_LABELS[plant.growing_system]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {plant.collector_tag}
                  </span>
                </div>
              </div>
              <Link href={`/plants/${plant.id}`} className="text-primary text-sm">›</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
