"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function DashboardPage() {
  const [counts, setCounts] = useState({ total: 0, healthy: 0, watch: 0, sick: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { count: total } = await supabase
        .from("plants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: healthy } = await supabase
        .from("plants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("health_status", "healthy");

      const { count: watch } = await supabase
        .from("plants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("health_status", "watch");

      const { count: sick } = await supabase
        .from("plants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("health_status", "sick");

      setCounts({ total: total || 0, healthy: healthy || 0, watch: watch || 0, sick: sick || 0 });
      setLoading(false);
    };

    loadCounts();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>{greeting} 🌿</h1>
        <p className="text-sm text-muted-foreground mt-1">Collection status</p>
      </div>

      {loading ? (
        <Skeleton className="h-32" />
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", count: counts.total, color: "text-blue-700 bg-blue-50" },
            { label: "Healthy", count: counts.healthy, color: "text-green-700 bg-green-50" },
            { label: "Watch", count: counts.watch, color: "text-amber-700 bg-amber-50" },
            { label: "Needs care", count: counts.sick, color: "text-red-700 bg-red-50" },
          ].map(({ label, count, color }) => (
            <div key={label} className={`rounded-2xl border p-3 text-center ${color}`}>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Link href="/plants" className="block rounded-2xl bg-primary text-primary-foreground p-4 text-center text-sm font-semibold">
          View Plants
        </Link>
        <Link href="/garden" className="block rounded-2xl border border-border bg-card p-4 text-center text-sm font-semibold">
          Manage Garden
        </Link>
      </div>
    </div>
  );
}
