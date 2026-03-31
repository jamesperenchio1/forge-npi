"use client";

import { useEffect, useState, useRef } from "react";
import { LocalPlant } from "../plants/page";

type Container = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  plantIds: string[];
  zones: string[];
};

const CONTAINER_COLORS = [
  "bg-green-100 border-green-300",
  "bg-amber-100 border-amber-300",
  "bg-blue-100 border-blue-300",
  "bg-purple-100 border-purple-300",
  "bg-rose-100 border-rose-300",
];

export default function GardenPage() {
  const [plants, setPlants] = useState<LocalPlant[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = localStorage.getItem("greendeck_plants");
    if (p) setPlants(JSON.parse(p));
    const c = localStorage.getItem("greendeck_garden");
    if (c) setContainers(JSON.parse(c));
  }, []);

  function saveContainers(updated: Container[]) {
    setContainers(updated);
    localStorage.setItem("greendeck_garden", JSON.stringify(updated));
  }

  function addContainer() {
    if (!newName.trim()) return;
    const c: Container = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      x: 10 + Math.random() * 40,
      y: 10 + Math.random() * 40,
      w: 20,
      h: 15,
      color: CONTAINER_COLORS[containers.length % CONTAINER_COLORS.length],
      plantIds: [],
      zones: ["Zone A"],
    };
    saveContainers([...containers, c]);
    setNewName("");
    setAdding(false);
  }

  function deleteContainer(id: string) {
    saveContainers(containers.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  }

  function addZone(containerId: string) {
    const updated = containers.map((c) =>
      c.id === containerId
        ? { ...c, zones: [...c.zones, `Zone ${String.fromCharCode(65 + c.zones.length)}`] }
        : c
    );
    saveContainers(updated);
  }

  const selectedContainer = containers.find((c) => c.id === selected);
  const unplacedPlants = plants.filter(
    (p) => !containers.some((c) => c.plantIds.includes(p.id))
  );

  function assignPlant(containerId: string, plantId: string) {
    const updated = containers.map((c) =>
      c.id === containerId && !c.plantIds.includes(plantId)
        ? { ...c, plantIds: [...c.plantIds, plantId] }
        : c
    );
    saveContainers(updated);
  }

  function removePlantFromContainer(containerId: string, plantId: string) {
    const updated = containers.map((c) =>
      c.id === containerId ? { ...c, plantIds: c.plantIds.filter((id) => id !== plantId) } : c
    );
    saveContainers(updated);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>Garden Map</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{containers.length} container{containers.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"
        >
          + Container
        </button>
      </div>

      {/* Add container form */}
      {adding && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <p className="text-sm font-semibold">New container</p>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addContainer()}
            placeholder="e.g. Balcony shelf #1, NFT channel A"
            className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-2">
            <button onClick={addContainer} className="flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-sm font-semibold">Add</button>
            <button onClick={() => setAdding(false)} className="flex-1 rounded-xl bg-muted border border-border py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Visual garden grid */}
      {containers.length > 0 ? (
        <div
          ref={canvasRef}
          className="relative w-full bg-muted/50 rounded-2xl border border-border overflow-hidden"
          style={{ height: "380px" }}
        >
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle, oklch(0.38 0.12 145) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {containers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(selected === c.id ? null : c.id)}
              className={`absolute rounded-xl border-2 flex flex-col items-center justify-center text-xs font-medium transition-all ${c.color} ${
                selected === c.id ? "ring-2 ring-primary ring-offset-1 scale-[1.02]" : "hover:scale-[1.01]"
              }`}
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: `${c.w}%`,
                height: `${c.h}%`,
                minWidth: "60px",
                minHeight: "50px",
              }}
            >
              <span className="truncate px-1 text-center leading-tight">{c.name}</span>
              {c.plantIds.length > 0 && (
                <span className="text-[10px] opacity-70">{c.plantIds.length} plant{c.plantIds.length !== 1 ? "s" : ""}</span>
              )}
              {c.zones.length > 1 && (
                <span className="text-[10px] opacity-60">{c.zones.length} zones</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl bg-muted/50 border border-dashed border-border">
          <span className="text-4xl">🗺️</span>
          <p className="text-sm text-muted-foreground">Add a container to start mapping your garden</p>
        </div>
      )}

      {/* Selected container detail */}
      {selectedContainer && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{selectedContainer.name}</p>
            <button
              onClick={() => deleteContainer(selectedContainer.id)}
              className="text-destructive text-xs border border-destructive/30 px-2.5 py-1 rounded-lg"
            >
              Delete
            </button>
          </div>

          {/* Zones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zones (compartments)</p>
              <button
                onClick={() => addZone(selectedContainer.id)}
                className="text-xs text-primary font-medium"
              >
                + Zone
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedContainer.zones.map((z) => (
                <span key={z} className="px-2.5 py-1 rounded-full bg-muted border border-border text-xs">{z}</span>
              ))}
            </div>
          </div>

          {/* Plants in this container */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Plants in this container</p>
            {selectedContainer.plantIds.length === 0 ? (
              <p className="text-xs text-muted-foreground">None assigned yet</p>
            ) : (
              <div className="space-y-2">
                {selectedContainer.plantIds.map((pid) => {
                  const plant = plants.find((p) => p.id === pid);
                  return plant ? (
                    <div key={pid} className="flex items-center justify-between">
                      <span className="text-sm">{plant.cover_emoji ?? "🌿"} {plant.common_name}</span>
                      <button
                        onClick={() => removePlantFromContainer(selectedContainer.id, pid)}
                        className="text-xs text-muted-foreground"
                      >
                        remove
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Assign unplaced plants */}
          {unplacedPlants.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assign a plant</p>
              <div className="space-y-1.5">
                {unplacedPlants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => assignPlant(selectedContainer.id, p.id)}
                    className="w-full text-left text-sm px-3 py-2 rounded-xl bg-muted border border-border hover:border-primary/40 transition-colors"
                  >
                    {p.cover_emoji ?? "🌿"} {p.common_name}
                    <span className="text-xs text-muted-foreground ml-2">{p.collector_tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unplaced plants */}
      {unplacedPlants.length > 0 && !selectedContainer && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Not placed on map</p>
          <div className="flex flex-wrap gap-2">
            {unplacedPlants.map((p) => (
              <span key={p.id} className="px-2.5 py-1 rounded-full bg-white border border-amber-200 text-xs">
                {p.cover_emoji ?? "🌿"} {p.common_name}
              </span>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-2">Tap a container to assign plants to it.</p>
        </div>
      )}
    </div>
  );
}
