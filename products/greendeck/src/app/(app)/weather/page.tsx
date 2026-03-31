"use client";

import { useEffect, useState } from "react";
import { WeatherData, weatherCodeLabel, uvLabel } from "@/lib/openmeteo";
import { getPestsForMonth } from "@/lib/pest-calendar";

function SunArc({ hour }: { hour: number }) {
  const progress = Math.max(0, Math.min(1, (hour - 6) / 12));
  const cx = 150;
  const cy = 100;
  const r = 80;
  const startAngle = Math.PI;
  const endAngle = 0;
  const angle = startAngle + progress * (endAngle - startAngle);
  const sunX = cx + r * Math.cos(angle);
  const sunY = cy + r * Math.sin(angle) * -1 + r;

  return (
    <svg viewBox="0 0 300 110" className="w-full" style={{ maxHeight: "110px" }}>
      <path d="M 70 100 A 80 80 0 0 1 230 100" fill="none" stroke="oklch(0.84 0.022 140)" strokeWidth="2" />
      {progress > 0 && (
        <path
          d={`M 70 100 A 80 80 0 0 1 ${sunX} ${sunY}`}
          fill="none"
          stroke="oklch(0.72 0.14 80)"
          strokeWidth="2.5"
        />
      )}
      <circle cx={sunX} cy={sunY} r="8" fill="oklch(0.72 0.14 80)" />
      <text x="65" y="115" textAnchor="middle" fontSize="10" fill="oklch(0.50 0.025 140)">6am</text>
      <text x="150" y="15" textAnchor="middle" fontSize="10" fill="oklch(0.50 0.025 140)">12pm</text>
      <text x="235" y="115" textAnchor="middle" fontSize="10" fill="oklch(0.50 0.025 140)">6pm</text>
    </svg>
  );
}

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("Detecting…");

  const hour = new Date().getHours();
  const month = new Date().getMonth() + 1;
  const pests = getPestsForMonth(month);
  const isMonsoon = month >= 5 && month <= 10;
  const isPreMonsoonHeat = month >= 3 && month <= 5;

  useEffect(() => {
    const geoOpts = { timeout: 8000 };
    navigator.geolocation?.getCurrentPosition(
      (p) => { setLocationName("Your location"); load(p.coords.latitude, p.coords.longitude); },
      () => { setLocationName("Bangkok (default)"); load(13.7563, 100.5018); },
      geoOpts
    );
    if (!navigator.geolocation) load(13.7563, 100.5018);
  }, []);

  async function load(lat: number, lon: number) {
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      setWeather(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-lora)" }}>Microclimate</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{locationName}</p>
      </div>

      {/* Sun arc */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sun Position Today</p>
        <SunArc hour={hour} />
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">UV Now</p>
            {loading ? <p className="text-sm font-semibold">—</p> : (
              <p className={`text-sm font-semibold ${uvLabel(weather?.current.uv_index ?? 0).color}`}>
                {weather?.current.uv_index.toFixed(1)} ({uvLabel(weather?.current.uv_index ?? 0).label})
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Peak UV</p>
            <p className="text-sm font-semibold">10am–2pm</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Solar</p>
            {loading ? <p className="text-sm font-semibold">—</p> : (
              <p className="text-sm font-semibold">{Math.round(weather?.current.shortwave_radiation ?? 0)} W/m²</p>
            )}
          </div>
        </div>
      </div>

      {/* Current conditions */}
      {!loading && weather && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Temperature", value: `${Math.round(weather.current.temperature_2m)}°C`, icon: "🌡️" },
            { label: "Humidity", value: `${weather.current.relative_humidity_2m}%`, icon: "💧" },
            { label: "Wind", value: `${Math.round(weather.current.wind_speed_10m)} km/h`, icon: "💨" },
            { label: "Conditions", value: weatherCodeLabel(weather.current.weather_code), icon: "🌤️" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-2xl bg-card border border-border p-3.5 flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Thailand seasons */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Thailand Seasons</p>
        <div className="space-y-2.5">
          {[
            { months: "Nov–Feb", label: "Cool & Dry Season", active: month <= 2 || month === 11 || month === 12, icon: "🌤️", tip: "Best planting window. Cooler nights, less pest pressure." },
            { months: "Mar–May", label: "Pre-Monsoon Heat", active: isPreMonsoonHeat, icon: "☀️", tip: "40°C+ possible. Shade cloth essential. Spider mite risk peaks." },
            { months: "May–Oct", label: "Monsoon Season", active: isMonsoon, icon: "🌧️", tip: "Heavy rain. Root rot risk. Clear drainage. Fungus gnats active." },
          ].map(({ months, label, active, icon, tip }) => (
            <div key={months} className={`rounded-xl p-3 flex gap-3 ${active ? "bg-primary/10 border border-primary/30" : "bg-muted/50 border border-border"}`}>
              <span className="text-xl mt-0.5">{icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{label}</p>
                  {active && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">NOW</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{months} · {tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pest calendar */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Pest Calendar — {new Date().toLocaleDateString("en", { month: "long" })}
        </p>
        {pests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Low pest pressure this month.</p>
        ) : (
          <div className="space-y-3">
            {pests.map((p) => (
              <div key={p.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    p.severity === "high" ? "bg-red-100 text-red-800" :
                    p.severity === "medium" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                  }`}>{p.severity}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.signs}</p>
                <p className="text-xs text-foreground/70">💊 {p.treatment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Care advice based on weather */}
      {weather && (
        <div className="rounded-2xl bg-secondary border border-border p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today's Care Advice</p>
          {weather.current.uv_index >= 8 && (
            <p className="text-sm">☀️ <strong>High UV today ({weather.current.uv_index.toFixed(0)}).</strong> Move sensitive seedlings to partial shade 10am–2pm.</p>
          )}
          {weather.current.relative_humidity_2m < 50 && (
            <p className="text-sm">💨 <strong>Low humidity ({weather.current.relative_humidity_2m}%).</strong> Mist aroids and check soil moisture — pots dry faster today.</p>
          )}
          {weather.current.relative_humidity_2m > 85 && (
            <p className="text-sm">🌫️ <strong>High humidity ({weather.current.relative_humidity_2m}%).</strong> Check for fungal issues and ensure airflow around dense plants.</p>
          )}
          {weather.current.temperature_2m >= 35 && (
            <p className="text-sm">🌡️ <strong>Heat stress risk ({Math.round(weather.current.temperature_2m)}°C).</strong> Dark pots cook roots — wrap or swap for fabric grow bags.</p>
          )}
          {weather.current.precipitation > 5 && (
            <p className="text-sm">🌧️ <strong>Rain today.</strong> Check drainage is clear. Skip watering. Watch for root rot in poorly draining pots.</p>
          )}
          {weather.current.uv_index < 8 && weather.current.relative_humidity_2m >= 50 && weather.current.relative_humidity_2m <= 85 && weather.current.temperature_2m < 35 && weather.current.precipitation <= 5 && (
            <p className="text-sm">✅ Conditions look good for plant care today.</p>
          )}
        </div>
      )}
    </div>
  );
}
