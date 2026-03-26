"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MIX_CLASSES } from "@/lib/constants";
import type { MultiMixResult } from "@/lib/mixCalculator";

interface Props {
  result: MultiMixResult;
  projectRef: string;
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

export default function ResultsDashboard({ result, projectRef }: Props) {
  const hasMultiple = result.perApp.length > 1;

  return (
    <div className="space-y-4">
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
              ⚠ {result.cementWarning.message}
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
              <div className="bg-muted/40 rounded-lg px-3 py-2">
                <div className="text-xs font-semibold text-muted-foreground">Keep wet for</div>
                <div className="text-lg font-black text-primary">{app.cureTime.minDays} days</div>
                <div className="text-xs text-muted-foreground mt-0.5">{app.cureTime.note}</div>
              </div>
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
