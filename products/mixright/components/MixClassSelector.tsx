"use client";

import { MIX_CLASSES, MixClassKey } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface Props {
  value: MixClassKey;
  onChange: (v: MixClassKey) => void;
}

const MPAColors: Record<MixClassKey, string> = {
  high:    "bg-red-100 text-red-700 border-red-200",
  general: "bg-orange-100 text-orange-700 border-orange-200",
  basic:   "bg-slate-100 text-slate-600 border-slate-200",
};

export default function MixClassSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      {(["high", "general", "basic"] as MixClassKey[]).map((key) => {
        const cls = MIX_CLASSES[key];
        const selected = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
              selected
                ? `${cls.borderColor} bg-white shadow-md`
                : "border-border bg-muted/30 hover:border-muted-foreground/30"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-black text-base ${selected ? cls.color : "text-foreground"}`}>
                    {cls.label}
                  </span>
                  {selected && (
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground mb-1">{cls.subtitle} · ratio {cls.ratio}</div>
                <div className="flex flex-wrap gap-1">
                  {cls.uses.map(u => (
                    <span key={u} className="text-xs bg-background border border-border rounded px-1.5 py-0.5">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
              <Badge className={`text-sm font-black px-2 shrink-0 ${MPAColors[key]}`}>
                {cls.mpaMid} MPa
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
  );
}
