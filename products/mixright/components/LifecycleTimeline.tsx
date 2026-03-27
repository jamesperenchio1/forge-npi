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

  // Explain what the temperature factor is doing so users understand the times
  const tf = tempC >= 38 ? 0.60 : tempC >= 33 ? 0.75 : tempC >= 28 ? 0.90 : tempC >= 23 ? 1.00 : tempC >= 18 ? 1.20 : 1.40;
  const hf = humidity >= 85 ? 1.35 : humidity >= 75 ? 1.15 : humidity >= 60 ? 1.00 : humidity >= 45 ? 0.90 : 0.80;
  const tempEffect = tf < 1 ? `${Math.round((1 - tf) * 100)}% faster than normal (hot)` : tf > 1 ? `${Math.round((tf - 1) * 100)}% slower than normal (cool)` : "normal speed";
  const humidEffect = hf > 1 ? `extended by ${Math.round((hf - 1) * 100)}% (humid air slows surface drying)` : hf < 1 ? `shortened by ${Math.round((1 - hf) * 100)}% (dry air accelerates evaporation)` : "at standard duration";

  return (
    <div className="space-y-2">
      {/* How the timeline was calculated */}
      <div className="bg-muted/40 rounded-xl px-3 py-3 space-y-2 mb-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How these times were calculated</div>
        <p className="text-xs text-muted-foreground">
          Every stage below is adjusted for your current conditions: <span className="font-semibold text-foreground">{tempC}°C</span> and <span className="font-semibold text-foreground">{humidity}% humidity</span>.
        </p>
        <div className="text-xs space-y-1">
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold shrink-0">Temp</span>
            <span className="text-muted-foreground">
              At {tempC}°C, chemical reactions in the concrete run <span className="font-semibold text-foreground">{tempEffect}</span>. Hot weather = shorter working window, faster set. Cool weather = more time to place but slower to reach usable strength.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-500 font-bold shrink-0">Humidity</span>
            <span className="text-muted-foreground">
              At {humidity}% RH, later stages (days 1–28) are <span className="font-semibold text-foreground">{humidEffect}</span>. High humidity keeps the surface moist longer — beneficial for strength gain.
            </span>
          </div>
        </div>
        <div className="bg-background/60 rounded-lg px-3 py-2">
          <div className="text-xs font-semibold mb-1">The factor table</div>
          <div className="text-xs font-mono text-muted-foreground space-y-0.5">
            <div className="font-semibold text-foreground/70">Temperature (set speed)</div>
            <div className={`flex justify-between ${tempC >= 38 ? "text-primary font-bold" : ""}`}><span>38°C+</span><span>× 0.60 (very fast)</span></div>
            <div className={`flex justify-between ${tempC >= 33 && tempC < 38 ? "text-primary font-bold" : ""}`}><span>33–38°C</span><span>× 0.75 (fast)</span></div>
            <div className={`flex justify-between ${tempC >= 28 && tempC < 33 ? "text-primary font-bold" : ""}`}><span>28–33°C</span><span>× 0.90 (slightly fast)</span></div>
            <div className={`flex justify-between ${tempC >= 23 && tempC < 28 ? "text-primary font-bold" : ""}`}><span>23–28°C</span><span>× 1.00 (standard)</span></div>
            <div className={`flex justify-between ${tempC < 23 ? "text-primary font-bold" : ""}`}><span>below 23°C</span><span>× 1.20–1.40 (slow)</span></div>
            <div className="font-semibold text-foreground/70 mt-1">Humidity (curing duration)</div>
            <div className={`flex justify-between ${humidity >= 85 ? "text-primary font-bold" : ""}`}><span>85%+</span><span>× 1.35 (extended)</span></div>
            <div className={`flex justify-between ${humidity >= 75 && humidity < 85 ? "text-primary font-bold" : ""}`}><span>75–84%</span><span>× 1.15</span></div>
            <div className={`flex justify-between ${humidity >= 60 && humidity < 75 ? "text-primary font-bold" : ""}`}><span>60–74%</span><span>× 1.00 (standard)</span></div>
            <div className={`flex justify-between ${humidity < 60 ? "text-primary font-bold" : ""}`}><span>below 60%</span><span>× 0.80–0.90 (shorter)</span></div>
          </div>
        </div>
      </div>

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
                    {stage.name}
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
                          <span className="text-primary shrink-0">-</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {stage.warnings.length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 space-y-1">
                    {stage.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-destructive font-medium">{w}</p>
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
