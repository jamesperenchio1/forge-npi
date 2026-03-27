"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, Droplets, Thermometer, AlertTriangle } from "lucide-react";
import SunArc from "./SunArc";
import {
  getSunTimes, getSunPosition, getUVRisk, getHeatIndex, getWorkerRisk,
  getBestPourWindow, formatTime,
} from "@/lib/sunUtils";
import type { CurrentWeather, ForecastDay } from "@/lib/weatherApi";

interface Props {
  lat: number;
  lng: number;
  weather: CurrentWeather;
  todayForecast?: ForecastDay;
}

export default function WeatherDashboard({ lat, lng, weather, todayForecast }: Props) {
  const [sunData, setSunData] = useState<{
    arcPct: number;
    altDeg: number;
    sunrise: string;
    sunset: string;
    bestWindow: string;
  } | null>(null);

  useEffect(() => {
    const now = new Date();
    const times = getSunTimes(lat, lng, now);
    const pos   = getSunPosition(lat, lng, now);
    const bestWindow = todayForecast
      ? getBestPourWindow(lat, lng, now, todayForecast.maxTempC, todayForecast.minTempC)
      : getBestPourWindow(lat, lng, now, weather.temperatureC + 5, weather.temperatureC - 3);
    setSunData({
      arcPct:     pos.arcPercent,
      altDeg:     pos.altitudeDeg,
      sunrise:    formatTime(times.sunrise),
      sunset:     formatTime(times.sunset),
      bestWindow,
    });
  }, [lat, lng, weather, todayForecast]);

  const heatIndex   = getHeatIndex(weather.temperatureC, weather.humidityPct);
  const workerRisk  = getWorkerRisk(heatIndex);
  const uvRisk      = getUVRisk(weather.uvIndex);

  const uvColors: Record<string, string> = {
    low: "bg-green-100 text-green-700", moderate: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700", very_high: "bg-red-100 text-red-700",
    extreme: "bg-red-200 text-red-800",
  };

  return (
    <div className="space-y-3">
      {/* Main weather stats */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div>
              <div className="text-3xl font-black text-primary">{weather.temperatureC}°</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Thermometer className="w-3 h-3" /> Temp
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-blue-600">{weather.humidityPct}%</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Droplets className="w-3 h-3" /> Humidity
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-600">{weather.windSpeedKph}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Wind className="w-3 h-3" /> km/h
              </div>
            </div>
          </div>

          {/* Sun arc */}
          {sunData && (
            <SunArc
              arcPercent={sunData.arcPct}
              altitudeDeg={sunData.altDeg}
              sunriseLabel={sunData.sunrise}
              sunsetLabel={sunData.sunset}
            />
          )}
        </CardContent>
      </Card>

      {/* Worker risk + UV */}
      <div className="grid grid-cols-2 gap-3">
        <Card className={`border-0 shadow-sm ${workerRisk.level === "low" ? "bg-green-50" : workerRisk.level === "moderate" ? "bg-yellow-50" : "bg-red-50"}`}>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className={`w-3.5 h-3.5 ${workerRisk.color}`} />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workers</span>
            </div>
            <div className={`text-base font-black ${workerRisk.color}`}>{workerRisk.label}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-snug">{workerRisk.advice}</div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-sm`}>
          <CardContent className="pt-3 pb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">UV Index</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-amber-600">{weather.uvIndex}</span>
              <Badge className={`text-xs ${uvColors[uvRisk]}`}>
                {uvRisk.replace("_", " ")}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Heat index: <span className="font-semibold">{Math.round(heatIndex)}°C</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best pour window */}
      {sunData && (
        <Card className="border-primary/20 border shadow-sm">
          <CardContent className="pt-3 pb-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Best time to pour today
            </div>
            <div className="text-sm font-semibold text-primary">{sunData.bestWindow}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
