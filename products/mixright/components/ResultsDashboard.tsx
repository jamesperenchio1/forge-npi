"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MIX_CLASSES, APPLICATION_TYPES } from "@/lib/constants";
import type { MultiMixResult } from "@/lib/mixCalculator";

interface Props {
  result: MultiMixResult;
  projectRef: string;
  humidity: number;
  tempC: number;
  lat?: number;
  lng?: number;
}

const CURING_METHODS = [
  {
    name: "Wet hessian + plastic sheet",
    when: "Best for structural elements and hot days",
    how: "Lay damp hessian directly on concrete, cover with plastic to retain moisture. Re-wet hessian 2× daily.",
    cost: "$",
  },
  {
    name: "Plastic sheeting only",
    when: "Non-structural slabs, light rain risk",
    how: "Lay plastic directly on concrete immediately after initial set. Weight down the edges. Check for tears daily.",
    cost: "$",
  },
  {
    name: "Curing compound (spray)",
    when: "Large areas, dry/windy conditions",
    how: "Spray evenly immediately after finishing. Forms a membrane that retains moisture. Cannot tile over — must be mechanically removed.",
    cost: "$$",
  },
];

function getCureExplanation(humidity: number, isStructural: boolean) {
  const base = isStructural ? 14 : 7;
  let multiplier = 1.0;
  let humidityLabel = "";
  let humidityReason = "";

  if (humidity >= 85) {
    multiplier = 1.4;
    humidityLabel = `${humidity}% — tropical / rainy season`;
    humidityReason = "Air is near-saturated, so concrete surface moisture evaporates very slowly. You have a longer window of active hydration — use it.";
  } else if (humidity >= 75) {
    multiplier = 1.2;
    humidityLabel = `${humidity}% — humid`;
    humidityReason = "Humid air slows surface drying. Extending curing by 20% improves final strength.";
  } else if (humidity >= 60) {
    multiplier = 1.0;
    humidityLabel = `${humidity}% — moderate`;
    humidityReason = "Normal conditions. Standard curing period applies.";
  } else {
    multiplier = 0.9;
    humidityLabel = `${humidity}% — dry`;
    humidityReason = "Low humidity means fast evaporation. Water more often during this shorter window.";
  }

  const days = Math.round(base * multiplier);
  return { base, multiplier, days, humidityLabel, humidityReason };
}

function buildShareText(result: MultiMixResult, projectRef: string, tempC: number, humidity: number, lat?: number, lng?: number): string {
  const lines: string[] = ["MixRight — Concrete Mix Recipe"];
  if (projectRef) lines.push(`Project: ${projectRef}`);
  if (lat !== undefined && lng !== undefined) {
    lines.push(`Location: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°  |  ${tempC}°C  ${humidity}% RH`);
  }
  lines.push("");
  result.perApp.forEach(app => {
    const cls = MIX_CLASSES[app.mixClass];
    lines.push(`── ${app.applicationLabel} (${cls.label}, ${cls.ratio})`);
    lines.push(`   Water: ${app.waterPerBag}L per bag${app.numBags > 1 ? ` · Total ${app.totalWater}L for ${app.numBags} bags` : ""}`);
    lines.push(`   Per bag: 1 cement : ${app.buckets.sand}× sand : ${app.buckets.gravel}× gravel (20L buckets)`);
    lines.push(`   Keep wet: ${app.cureTime.minDays} days`);
  });
  if (result.perApp.length > 1) {
    lines.push("");
    lines.push(`TOTALS: ${result.totals.totalBags} bags · ${result.totals.totalWater}L water · ${result.totals.totalSandBuckets}× sand · ${result.totals.totalGravelBuckets}× gravel`);
  }
  const adjParts: string[] = [];
  if (result.adjustments.humidity    !== 0) adjParts.push(`humidity ${result.adjustments.humidity    > 0 ? "+" : ""}${result.adjustments.humidity}L/bag`);
  if (result.adjustments.temperature !== 0) adjParts.push(`temp ${result.adjustments.temperature     > 0 ? "+" : ""}${result.adjustments.temperature}L/bag`);
  if (adjParts.length) lines.push(`\nWeather adjustments: ${adjParts.join(", ")}`);
  lines.push("─");
  lines.push("MixRight · mixright.vercel.app");
  return lines.join("\n");
}

export default function ResultsDashboard({ result, projectRef, humidity, tempC, lat, lng }: Props) {
  const hasMultiple = result.perApp.length > 1;
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = buildShareText(result, projectRef, tempC, humidity, lat, lng);
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "MixRight — Mix Recipe", text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  return (
    <div className="space-y-4">
      {/* Share button */}
      <div className="flex justify-end">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border"
        >
          {copied
            ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied!</>
            : <><Share2 className="w-3.5 h-3.5" /> Share recipe</>
          }
        </button>
      </div>

      {/* Project reference */}
      {projectRef && (
        <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
          <span className="text-xs text-muted-foreground">Project ref:</span>
          <span className="text-sm font-semibold">{projectRef}</span>
        </div>
      )}

      {/* Cement warning */}
      {result.cementWarning.level !== "ok" && (
        <Card className={`border-2 ${result.cementWarning.level === "danger" ? "border-destructive bg-destructive/5" : "border-yellow-400 bg-yellow-50"}`}>
          <CardContent className="pt-3 pb-3">
            <p className={`text-sm font-semibold ${result.cementWarning.level === "danger" ? "text-destructive" : "text-yellow-700"}`}>
              {result.cementWarning.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Per-application results */}
      {result.perApp.map(app => {
        const cls = MIX_CLASSES[app.mixClass];
        return (
          <Card key={app.applicationId} className="border shadow-sm">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{app.applicationLabel}</div>
                  <div className={`text-xs ${cls.color} font-medium`}>{cls.label} · {cls.ratio}</div>
                </div>
                <Badge variant="outline" className="text-xs">{app.numBags} bag{app.numBags > 1 ? "s" : ""}</Badge>
              </div>

              {/* Water */}
              <div className="text-center py-2 bg-primary/5 rounded-xl">
                <div className="text-4xl font-black text-primary">{app.waterPerBag}<span className="text-lg ml-1 font-semibold">L</span></div>
                <div className="text-xs text-muted-foreground">water per bag</div>
                {app.numBags > 1 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Total: <span className="font-bold text-foreground">{app.totalWater}L</span>
                  </div>
                )}
              </div>

              {/* Buckets */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Per bag (20L buckets)</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted rounded-lg py-2">
                    <div className="font-black text-sm">1 bag</div>
                    <div className="text-xs text-muted-foreground">Cement</div>
                  </div>
                  <div className="bg-muted rounded-lg py-2">
                    <div className="font-black text-sm">{app.buckets.sand}×</div>
                    <div className="text-xs text-muted-foreground">Sand</div>
                  </div>
                  <div className="bg-muted rounded-lg py-2">
                    <div className="font-black text-sm">{app.buckets.gravel}×</div>
                    <div className="text-xs text-muted-foreground">Gravel</div>
                  </div>
                </div>
              </div>

              {/* Cure time */}
              {(() => {
                const appType = APPLICATION_TYPES.find(a => a.id === app.applicationId);
                const explanation = getCureExplanation(humidity, appType?.isStructural ?? false);
                return (
                  <div className="bg-muted/40 rounded-lg px-3 py-3 space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Keep wet for</div>
                      <div className="text-lg font-black text-primary">{app.cureTime.minDays} days</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{app.cureTime.note}</div>
                    </div>

                    {/* How this was calculated */}
                    <div className="border-t border-border/40 pt-2 space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How this number was calculated</div>

                      <div className="text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Base ({explanation.base === 14 ? "structural element" : "non-structural"})</span>
                          <span className="font-mono font-bold">{explanation.base} days</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Humidity: {explanation.humidityLabel}</span>
                          <span className="font-mono font-bold">× {explanation.multiplier}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/40 pt-1">
                          <span className="font-semibold">{explanation.base} × {explanation.multiplier} = {explanation.days} days</span>
                          <span className="font-mono font-black text-primary">{explanation.days}d</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground italic">{explanation.humidityReason}</p>

                      <div className="bg-background/60 rounded-lg px-3 py-2 space-y-1">
                        <div className="text-xs font-semibold">Why does keeping it wet matter?</div>
                        <p className="text-xs text-muted-foreground">
                          Concrete doesn't "dry" to get strong — it <span className="font-semibold text-foreground">reacts with water</span> (hydration).
                          If the surface dries out before {explanation.days} days, the reaction stops permanently and the concrete is weaker than it should be.
                          Water morning and evening, or lay damp hessian under plastic sheeting.
                        </p>
                      </div>

                      <div className="bg-background/60 rounded-lg px-3 py-2 space-y-1">
                        <div className="text-xs font-semibold">Why does humidity change the number?</div>
                        <p className="text-xs text-muted-foreground">
                          {humidity >= 75
                            ? `At ${humidity}% humidity, the air is already holding a lot of moisture. Your concrete surface won't dry out as fast — which is good. The longer window means you can keep the hydration reaction running for more days, which builds more strength.`
                            : `At ${humidity}% humidity, the air is relatively dry and pulls moisture out of the concrete quickly. You need to work harder (water more often), but the accelerated evaporation also slightly speeds up the reaction, so the total window is a bit shorter.`
                          }
                        </p>
                      </div>

                      <div className="bg-background/60 rounded-lg px-3 py-2 space-y-1">
                        <div className="text-xs font-semibold">The humidity multiplier table</div>
                        <div className="text-xs font-mono space-y-0.5 text-muted-foreground">
                          <div className={`flex justify-between ${humidity >= 85 ? "text-primary font-bold" : ""}`}>
                            <span>85%+ (rainy season)</span><span>base × 1.4</span>
                          </div>
                          <div className={`flex justify-between ${humidity >= 75 && humidity < 85 ? "text-primary font-bold" : ""}`}>
                            <span>75–84% (humid)</span><span>base × 1.2</span>
                          </div>
                          <div className={`flex justify-between ${humidity >= 60 && humidity < 75 ? "text-primary font-bold" : ""}`}>
                            <span>60–74% (moderate)</span><span>base × 1.0</span>
                          </div>
                          <div className={`flex justify-between ${humidity < 60 ? "text-primary font-bold" : ""}`}>
                            <span>below 60% (dry)</span><span>base × 0.9</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        );
      })}

      {/* Combined totals for multi-app */}
      {hasMultiple && (
        <Card className="border-2 border-primary/30 shadow-md">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Combined totals</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center bg-primary/5 rounded-xl py-3">
                <div className="text-3xl font-black text-primary">{result.totals.totalBags}</div>
                <div className="text-xs text-muted-foreground">bags cement</div>
              </div>
              <div className="text-center bg-blue-50 rounded-xl py-3">
                <div className="text-3xl font-black text-blue-600">{result.totals.totalWater}L</div>
                <div className="text-xs text-muted-foreground">water total</div>
              </div>
              <div className="text-center bg-muted rounded-xl py-3">
                <div className="text-3xl font-black">{result.totals.totalSandBuckets}×</div>
                <div className="text-xs text-muted-foreground">sand buckets</div>
              </div>
              <div className="text-center bg-muted rounded-xl py-3">
                <div className="text-3xl font-black">{result.totals.totalGravelBuckets}×</div>
                <div className="text-xs text-muted-foreground">gravel buckets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustments */}
      {(result.adjustments.humidity !== 0 || result.adjustments.temperature !== 0) && (
        <Card className="bg-muted/30">
          <CardContent className="pt-3 pb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Weather adjustments applied</div>
            <div className="space-y-1 text-sm">
              {result.adjustments.humidity !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Humidity</span>
                  <span className={`font-semibold ${result.adjustments.humidity < 0 ? "text-blue-600" : "text-orange-600"}`}>
                    {result.adjustments.humidity > 0 ? "+" : ""}{result.adjustments.humidity}L/bag
                  </span>
                </div>
              )}
              {result.adjustments.temperature !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperature</span>
                  <span className={`font-semibold ${result.adjustments.temperature < 0 ? "text-blue-600" : "text-orange-600"}`}>
                    {result.adjustments.temperature > 0 ? "+" : ""}{result.adjustments.temperature}L/bag
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Curing methods */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Curing methods</div>
        <div className="space-y-2">
          {CURING_METHODS.map(m => (
            <Card key={m.name} className="bg-muted/20">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-sm">{m.name}</div>
                  <span className="text-xs text-muted-foreground font-mono">{m.cost}</span>
                </div>
                <div className="text-xs text-primary font-medium mb-1">{m.when}</div>
                <div className="text-xs text-muted-foreground">{m.how}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
