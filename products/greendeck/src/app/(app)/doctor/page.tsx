"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function DoctorPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("doctor_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false });

      if (data) setLogs(data);
      setLoading(false);
    };

    load();
  }, []);

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
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>Plant Doctor</h1>
        <p className="text-sm text-muted-foreground mt-1">AI diagnosis history</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No diagnoses yet</p>
          <p className="text-xs mt-2">Take a plant photo to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl bg-card border border-border p-4 space-y-2">
              <p className="font-semibold text-sm">{log.plant_name || "Unknown plant"}</p>
              {log.condition && <p className="text-xs text-amber-700">{log.condition}</p>}
              {log.treatment && (
                <div className="text-xs text-muted-foreground">
                  {typeof log.treatment === "string" ? log.treatment : JSON.stringify(log.treatment)}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">{new Date(log.logged_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
