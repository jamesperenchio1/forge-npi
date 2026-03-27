"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ForecastDay } from "@/lib/weatherApi";
import { computePourScore, pourScoreReason, SCORE_COLORS } from "@/lib/pourScore";
import { getWeatherInfo } from "@/lib/constants";

interface Props {
  forecast: ForecastDay[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function ForecastCalendar({ forecast, selectedDate, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Select your pour date to see concrete lifecycle</p>
      {forecast.map(day => {
        const score  = computePourScore(day);
        const reason = pourScoreReason(day);
        const colors = SCORE_COLORS[score];
        const weather = getWeatherInfo(day.weatherCode);
        const isSelected = selectedDate === day.date;

        return (
          <button
            key={day.date}
            onClick={() => onSelect(day.date)}
            className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
              isSelected
                ? "border-primary shadow-md bg-primary/5"
                : `${colors.bg} border-transparent hover:border-muted-foreground/20`
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-semibold text-sm">{dayLabel(day.date)}</div>
                  <div className="text-xs text-muted-foreground">{weather.label}</div>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <div className="text-sm font-bold">{day.maxTempC}° <span className="text-muted-foreground font-normal">{day.minTempC}°</span></div>
                  <div className="text-xs text-muted-foreground">{day.maxHumidity}% humidity</div>
                </div>
                <div className={`w-3 h-3 rounded-full shrink-0 ${colors.dot}`} title={reason} />
              </div>
            </div>

            {/* Pour score reason */}
            <div className={`text-xs mt-1 ${colors.text} font-medium`}>
              {reason === "good conditions" ? "✓ Good conditions for concrete" : `⚠ ${reason}`}
            </div>

            {/* Extra warnings */}
            {day.precipMm > 0 && (
              <div className="text-xs text-blue-600 mt-0.5">💧 {day.precipMm}mm rain expected</div>
            )}
            {day.windSpeedMax >= 25 && (
              <div className="text-xs text-amber-600 mt-0.5">💨 {day.windSpeedMax} km/h wind — plastic shrinkage risk</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
