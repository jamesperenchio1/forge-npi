"use client";

import { useEffect, useState } from "react";
import { WeatherData, weatherCodeLabel, uvLabel, uvColor } from "@/lib/openmeteo";
import { getPestsForMonth } from "@/lib/pest-calendar";
import Link from "next/link";

export default function DashboardPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const month = new Date().getMonth() + 1;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    if (!navigator.geolocation) {
      // Default to Bangkok
      fetchWeather(13.7563, 100.5018, "Bangkok");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, "Your location"),
      () => fetchWeather(13.7563, 100.5018, "Bangkok (default)")
    );
  }, []);

  async function fetchWeather(lat: number, lon: number, name: string) {
    setLocation({ lat, lon, name });
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error("Weather fetch failed");
      const data = await res.json();
      setWeather(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const pests = getPestsForMonth(month);
  const topPest = pests[0];

  const isChiangMai = location && location.lat > 17.5;
  const isMonsoon = month >= 5 && month <= 10;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "var(--font-lora)" }}>
          {greeting} 🌿
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {location?.name ?? "Detecting location…"}
        </p>
      </div>

      {/* Weather card */}
      {loading ? (
        <div className="rounded-2xl bg-card border border-border p-5 animate-pulse">
          <div className="h-12 bg-muted rounded-xl mb-3" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          Could not load weather data. Check connection.
        </div>
      ) : weather ? (
        <div className="rounded-2xl bg-primary text-primary-foreground p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-4xl font-bold">{Math.round(weather.current.temperature_2m)}°C</p>
              <p className="text-sm opacity-80 mt-0.5">{weatherCodeLabel(weather.current.weather_code)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">UV Index</p>
              <p className="text-2xl font-semibold">{weather.current.uv_index.toFixed(1)}</p>
              <p className={`text-xs font-medium ${uvColor(weather.current.uv_index)} opacity-90`}>
                {uvLabel(weather.current.uv_index)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
            <div>
              <p className="text-xs opacity-70">Humidity</p>
              <p className="font-semibold">{weather.current.relative_humidity_2m}%</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Wind</p>
              <p className="font-semibold">{Math.round(weather.current.wind_speed_10m)} km/h</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Solar</p>
              <p className="font-semibold">{Math.round(weather.current.shortwave_radiation)} W/m²</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Seasonal alerts */}
      {isMonsoon && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
          <span className="text-xl">🌧️</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">Monsoon Season Active</p>
            <p className="text-xs text-blue-700 mt-0.5">May–Oct. Watch for root rot and fungus gnats. Ensure drainage is clear.</p>
          </div>
        </div>
      )}

      {isChiangMai && (month >= 2 && month <= 4) && (
        <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex gap-3">
          <span className="text-xl">🌫️</span>
          <div>
            <p className="text-sm font-semibold text-orange-900">Chiang Mai Smoke Season</p>
            <p className="text-xs text-orange-700 mt-0.5">PM2.5 elevated Feb–Apr. Wipe leaves, move sensitive plants indoors, skip foliar feeding.</p>
          </div>
        </div>
      )}

      {/* Pest alert */}
      {topPest && (
        <div className={`rounded-2xl border p-4 flex gap-3 ${
          topPest.severity === "high" ? "bg-red-50 border-red-200" :
          topPest.severity === "medium" ? "bg-amber-50 border-amber-200" :
          "bg-muted border-border"
        }`}>
          <span className="text-xl">🐛</span>
          <div>
            <p className={`text-sm font-semibold ${
              topPest.severity === "high" ? "text-red-900" :
              topPest.severity === "medium" ? "text-amber-900" : "text-foreground"
            }`}>
              Pest Alert: {topPest.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{topPest.signs}</p>
            <p className="text-xs mt-1 font-medium text-foreground/70">Treatment: {topPest.treatment.slice(0, 80)}…</p>
          </div>
        </div>
      )}

      {/* 7-day forecast */}
      {weather && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">7-Day Forecast</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {weather.daily.time.slice(0, 7).map((date, i) => (
              <div key={date} className="flex flex-col items-center bg-card border border-border rounded-xl px-3 py-2.5 min-w-[64px]">
                <p className="text-xs text-muted-foreground">
                  {i === 0 ? "Today" : new Date(date).toLocaleDateString("en", { weekday: "short" })}
                </p>
                <p className="text-sm font-semibold mt-1">{Math.round(weather.daily.temperature_2m_max[i])}°</p>
                <p className="text-xs text-muted-foreground">{Math.round(weather.daily.temperature_2m_min[i])}°</p>
                {weather.daily.precipitation_sum[i] > 1 && (
                  <span className="text-xs text-blue-500 mt-1">💧{Math.round(weather.daily.precipitation_sum[i])}mm</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/plants/new" className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:border-primary/40 transition-colors active:scale-[0.98]">
            <span className="text-2xl">🌱</span>
            <div>
              <p className="text-sm font-semibold">Add Plant</p>
              <p className="text-xs text-muted-foreground">Log new specimen</p>
            </div>
          </Link>
          <Link href="/doctor" className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:border-primary/40 transition-colors active:scale-[0.98]">
            <span className="text-2xl">🔬</span>
            <div>
              <p className="text-sm font-semibold">Plant Doctor</p>
              <p className="text-xs text-muted-foreground">Diagnose a problem</p>
            </div>
          </Link>
          <Link href="/garden" className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:border-primary/40 transition-colors active:scale-[0.98]">
            <span className="text-2xl">🗺️</span>
            <div>
              <p className="text-sm font-semibold">Garden Map</p>
              <p className="text-xs text-muted-foreground">View layout</p>
            </div>
          </Link>
          <Link href="/plants" className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3 hover:border-primary/40 transition-colors active:scale-[0.98]">
            <span className="text-2xl">📋</span>
            <div>
              <p className="text-sm font-semibold">My Collection</p>
              <p className="text-xs text-muted-foreground">All specimens</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
