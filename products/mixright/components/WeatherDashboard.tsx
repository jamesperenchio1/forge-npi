"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, Droplets, Thermometer, AlertTriangle } from "lucide-react";
import SunArc from "./SunArc";
import HourlyTimeline from "./HourlyTimeline";
import {
  getSunTimes, getSunPosition, getUVRisk, getHeatIndex, getWorkerRisk,
  getBestPourWindow, formatTime,
} from "@/lib/sunUtils";
import type { CurrentWeather, ForecastDay, HourlyPoint } from "@/lib/weatherApi";

interface Props {
  lat: number;
  lng: number;
  weather: CurrentWeather;
  todayForecast?: ForecastDay;
  todayHourly?: HourlyPoint[];
}

export default function WeatherDashboard({ lat, lng, weather, todayForecast, todayHourly = [] }: Props) {
  const [sunData, setSunData] = useState<{
    arcPct: number;
    altDeg: number;
    sunrise: string;
    sunset: string;
    bestWindow: string;
    currentHour: number;
  } | null>(null);

  useEffect(() => {
    const now = new Date();
    const times = getSunTimes(lat, lng, now);
    const pos   = getSunPosition(lat, lng, now);
    const bestWindow = todayForecast
      ? getBestPourWindow(lat, lng, now, todayForecast.maxTempC, todayForecast.minTempC)
      : getBestPourWindow(lat, lng, now, weather.temperatureC + 5, weather.temperatureC - 3);
    setSunData({
      arcPct:      pos.arcPercent,
      altDeg:      pos.altitudeDeg,
      sunrise:     formatTime(times.sunrise),
      sunset:      formatTime(times.sunset),
      bestWindow,
      currentHour: now.getHours(),
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
            <div className="text-[10px] text-muted-foreground/60 mt-1.5">
              Per NIOSH/OSHA heat stress guidelines
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
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
            {weather.uvIndex === 0 && (
              <div className="text-[10px] text-muted-foreground/70 mt-1 leading-snug">
                UV is 0 outside daylight hours — normal
              </div>
            )}
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

      {/* Hourly timeline */}
      {todayHourly.length > 0 && sunData && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-3 pb-3">
            <HourlyTimeline hourly={todayHourly} currentHour={sunData.currentHour} />
          </CardContent>
        </Card>
      )}

      {/* Data sources */}
      <div className="text-[10px] text-muted-foreground/60 px-1 leading-relaxed space-y-0.5">
        <div>Weather: <a href="https://open-meteo.com" target="_blank" rel="noopener" className="underline">Open-Meteo.com</a> (free & open-source, CC BY 4.0)</div>
        <div>Heat index: Steadman (1979) formula, as used by NOAA/NWS</div>
        <div>Solar position: SunCalc library (Vladimir Agafonkin)</div>
      </div>
    </div>
  );
}
