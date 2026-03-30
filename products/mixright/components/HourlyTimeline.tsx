"use client";

import type { HourlyPoint } from "@/lib/weatherApi";

interface Props {
  hourly: HourlyPoint[];
  currentHour: number;
}

// Find the "best work window" — lowest heat index hours between 5am and 6pm
function getBestWorkHours(hourly: HourlyPoint[]): Set<number> {
  const workHours = hourly.filter(h => h.hour >= 5 && h.hour <= 18);
  if (workHours.length === 0) return new Set();
  // Score by temp + UV (lower = better); take bottom 3 contiguous hours
  const scored = workHours
    .map(h => ({ hour: h.hour, score: h.tempC + h.uvIndex * 2 }))
    .sort((a, b) => a.score - b.score);
  return new Set(scored.slice(0, 3).map(s => s.hour));
}

function tempColor(tempC: number): string {
  if (tempC >= 38) return "bg-red-500";
  if (tempC >= 35) return "bg-orange-500";
  if (tempC >= 32) return "bg-amber-400";
  if (tempC >= 28) return "bg-yellow-300";
  return "bg-green-300";
}

function uvColor(uv: number): string {
  if (uv >= 11) return "bg-purple-600";
  if (uv >= 8)  return "bg-red-500";
  if (uv >= 6)  return "bg-orange-400";
  if (uv >= 3)  return "bg-yellow-400";
  return "bg-green-300";
}

export default function HourlyTimeline({ hourly, currentHour }: Props) {
  if (hourly.length === 0) return null;

  const bestHours = getBestWorkHours(hourly);
  // Show hours 4am–9pm for a practical field view
  const visible = hourly.filter(h => h.hour >= 4 && h.hour <= 21);
  const maxTemp = Math.max(...visible.map(h => h.tempC));
  const maxUV   = Math.max(...visible.map(h => h.uvIndex), 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Today by hour
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Best window</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Now</span>
        </div>
      </div>

      {/* Horizontal scroll of hour columns */}
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div className="flex gap-1 min-w-max">
          {visible.map(h => {
            const isCurrent = h.hour === currentHour;
            const isBest    = bestHours.has(h.hour);
            const tempBarH  = Math.max(4, Math.round((h.tempC / maxTemp) * 40));
            const uvBarH    = Math.max(2, Math.round((h.uvIndex / maxUV) * 24));

            return (
              <div
                key={h.hour}
                className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg min-w-[42px] transition-colors ${
                  isCurrent ? "bg-blue-100 ring-1 ring-blue-400"
                  : isBest  ? "bg-green-50 ring-1 ring-green-300"
                  : "bg-muted/30"
                }`}
              >
                {/* Hour label */}
                <span className={`text-[10px] font-bold ${isCurrent ? "text-blue-700" : isBest ? "text-green-700" : "text-muted-foreground"}`}>
                  {h.time}
                </span>

                {/* Temp bar */}
                <div className="flex flex-col justify-end h-10 w-4">
                  <div
                    className={`w-full rounded-sm ${tempColor(h.tempC)}`}
                    style={{ height: `${tempBarH}px` }}
                    title={`${h.tempC}°C`}
                  />
                </div>

                {/* Temp value */}
                <span className="text-[10px] font-semibold text-foreground">{h.tempC}°</span>

                {/* UV bar */}
                <div className="flex flex-col justify-end h-6 w-3 mt-1">
                  <div
                    className={`w-full rounded-sm opacity-80 ${uvColor(h.uvIndex)}`}
                    style={{ height: `${uvBarH}px` }}
                    title={`UV ${h.uvIndex}`}
                  />
                </div>

                {/* UV label (only if > 0) */}
                <span className="text-[9px] text-muted-foreground">
                  {h.uvIndex > 0 ? `UV${h.uvIndex}` : "—"}
                </span>

                {/* Humidity dot */}
                <div
                  className="w-2 h-2 rounded-full bg-blue-300 mt-0.5"
                  style={{ opacity: h.humidityPct / 100 }}
                  title={`${h.humidityPct}% RH`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div>Tall bar = hotter temperature</div>
        <div>Short UV bar = less radiation</div>
        <div>Blue dot opacity = humidity level</div>
        <div>UV is 0 at night — this is correct</div>
      </div>

      <p className="text-xs text-muted-foreground/70">
        Source: <a href="https://open-meteo.com" target="_blank" rel="noopener" className="underline">Open-Meteo</a> (CC BY 4.0) · UV index: solar irradiance, 0 outside daylight hours by definition
      </p>
    </div>
  );
}
