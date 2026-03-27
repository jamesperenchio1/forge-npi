"use client";

import { APPLICATION_TYPES, MIX_CLASSES } from "@/lib/constants";
import type { SelectedApp } from "@/lib/mixCalculator";

interface Props {
  selected: SelectedApp[];
  onChange: (apps: SelectedApp[]) => void;
}

export default function ApplicationSelector({ selected, onChange }: Props) {
  const selectedIds = new Set(selected.map(s => s.applicationId));

  function toggle(id: string) {
    if (selectedIds.has(id)) {
      onChange(selected.filter(s => s.applicationId !== id));
    } else {
      onChange([...selected, { applicationId: id, numBags: 2 }]);
    }
  }

  function setBags(id: string, bags: number) {
    onChange(selected.map(s => s.applicationId === id ? { ...s, numBags: Math.max(1, bags) } : s));
  }

  return (
    <div className="space-y-2">
      {APPLICATION_TYPES.map(app => {
        const isSelected = selectedIds.has(app.id);
        const sel = selected.find(s => s.applicationId === app.id);
        const rec = MIX_CLASSES[app.recommended];

        return (
          <div key={app.id}>
            <button
              onClick={() => toggle(app.id)}
              className={`w-full text-left rounded-xl border-2 px-3 py-2.5 transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-muted/20 hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {app.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${rec.color} font-medium`}>{rec.label}</span>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {isSelected && <span className="text-white text-xs leading-none">✓</span>}
                  </div>
                </div>
              </div>
            </button>

            {/* Bag count — expands inline when selected */}
            {isSelected && sel && (
              <div className="mx-3 px-3 py-2 bg-background border border-t-0 border-primary/30 rounded-b-xl flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Number of 50kg bags</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBags(app.id, sel.numBags - 1)}
                    className="w-8 h-8 rounded-lg border border-border font-bold text-sm hover:border-primary transition-colors"
                  >−</button>
                  <span className="text-lg font-black text-primary w-6 text-center">{sel.numBags}</span>
                  <button
                    onClick={() => setBags(app.id, sel.numBags + 1)}
                    className="w-8 h-8 rounded-lg border border-border font-bold text-sm hover:border-primary transition-colors"
                  >+</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
