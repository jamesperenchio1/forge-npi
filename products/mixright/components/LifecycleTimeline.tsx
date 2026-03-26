"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { pourDateToStages } from "@/lib/lifecycleCalc";

interface Props {
  pourDate: Date;
  tempC: number;
  humidity: number;
  isStructural: boolean;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(hours: number): string {
  if (hours < 1)    return `${Math.round(hours * 60)} min`;
  if (hours < 24)   return `${Math.round(hours)}h`;
  if (hours < 168)  return `${Math.round(hours / 24)} days`;
  return `${Math.round(hours / 168)} weeks`;
}

export default function LifecycleTimeline({ pourDate, tempC, humidity, isStructural }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>("plastic");
  const stages = pourDateToStages(pourDate, tempC, humidity, isStructural);
  const now = new Date();

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        Pour date: <span className="font-semibold text-foreground">{fmtDate(pourDate)}</span>
      </div>

      {stages.map(stage => {
        const isNow     = now >= stage.startDate && now < stage.endDate;
        const isPast    = now >= stage.endDate;
        const isExpanded = expandedId === stage.id;

        return (
          <button
            key={stage.id}
            onClick={() => setExpandedId(isExpanded ? null : stage.id)}
            className={`w-full text-left rounded-xl border transition-all ${
              isNow    ? "border-primary shadow-md"
              : isPast ? "border-border opacity-60"
              :          "border-border"
            }`}
          >
            <div className="flex items-center gap-3 p-3">
              {/* Color bar */}
              <div className={`w-1 self-stretch rounded-full ${stage.color} shrink-0`} style={{ minHeight: 32 }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-sm font-semibold ${isNow ? "text-primary" : "text-foreground"}`}>
                    {isNow && "▶ "}{stage.name}
                  </span>
                  {isNow && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium shrink-0">NOW</span>}
                  {isPast && <span className="text-xs text-muted-foreground shrink-0">Done</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {fmtDate(stage.startDate)}
                  {" — "}
                  {fmtDuration(stage.endH - stage.startH)}
                </div>
              </div>

              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>

            {isExpanded && (
              <div className="px-4 pb-3 space-y-2 border-t border-border">
                <p className="text-sm text-muted-foreground mt-2">{stage.description}</p>

                {stage.actions.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Actions</div>
                    <ul className="space-y-1">
                      {stage.actions.map((a, i) => (
                        <li key={i} className="text-xs flex gap-1.5">
                          <span className="text-primary shrink-0">→</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {stage.warnings.length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 space-y-1">
                    {stage.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-destructive font-medium">⚠ {w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
