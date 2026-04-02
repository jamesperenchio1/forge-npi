"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"growing" | "events">("growing");
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("date");

      if (data) setEvents(data);
      setLoading(false);
    };

    load();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter((e) => e.date >= today);

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
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">Growing guide & events</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("growing")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === "growing" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          Growing Guide
        </button>
        <button
          onClick={() => setTab("events")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === "events" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          Events ({upcomingEvents.length})
        </button>
      </div>

      {/* Content */}
      {tab === "growing" ? (
        <div className="text-center text-muted-foreground py-8">
          <p>Growing guide - Thailand climate calendar</p>
          <p className="text-xs mt-2">Coming soon</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No upcoming events</p>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event.id} className="rounded-2xl bg-card border border-border p-4">
                <p className="font-semibold text-sm">{event.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
                {event.note && <p className="text-xs mt-2">{event.note}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
