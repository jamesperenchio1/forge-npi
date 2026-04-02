"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type Zone = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
};

type Container = {
  id: string;
  user_id: string;
  zone_id?: string;
  name: string;
  size: string;
  grid_w: number;
  grid_h: number;
  pos_x: number;
  pos_y: number;
  created_at: string;
  container_sections?: Array<{ id: string; label: string; plant_id?: string }>;
};

export default function GardenPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: zoneData } = await supabase
        .from("zones")
        .select("*")
        .eq("user_id", user.id);

      const { data: containerData } = await supabase
        .from("containers")
        .select("*, container_sections(*)")
        .eq("user_id", user.id);

      if (zoneData) setZones(zoneData);
      if (containerData) setContainers(containerData);
      if (zoneData?.[0]) setActiveZoneId(zoneData[0].id);
      setLoading(false);
    };

    load();
  }, []);

  const activeZone = zones.find((z) => z.id === activeZoneId);
  const activeContainers = containers.filter((c) => c.zone_id === activeZoneId || (!activeZoneId && !c.zone_id));

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>Your Garden</h1>
        <p className="text-sm text-muted-foreground mt-1">Organize your plants by zone</p>
      </div>

      {/* Zone tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => setActiveZoneId(zone.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeZoneId === zone.id
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {zone.name}
          </button>
        ))}
        <button className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border border-dashed border-border text-muted-foreground hover:text-foreground">
          + Zone
        </button>
      </div>

      {/* Garden canvas */}
      <div className="rounded-2xl border border-border bg-card p-4 min-h-96 space-y-4">
        <p className="text-xs text-muted-foreground">Containers in {activeZone?.name || "Garden"}</p>
        
        {activeContainers.length === 0 ? (
          <div className="h-80 flex items-center justify-center flex-col gap-4 text-center text-muted-foreground">
            <p>No containers yet</p>
            <button className="text-primary text-sm font-semibold hover:underline">+ Add container</button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeContainers.map((container) => (
              <div key={container.id} className="rounded-xl bg-background border border-border p-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{container.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {container.container_sections?.length || 1} section{container.container_sections?.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link href={`/garden/${container.id}`} className="text-primary text-sm">›</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/plants" className="block text-center text-sm text-primary hover:underline">
        Go to Plants to add to containers
      </Link>
    </div>
  );
}
