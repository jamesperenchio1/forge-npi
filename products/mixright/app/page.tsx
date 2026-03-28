"use client";

import { useState, useEffect } from "react";
import { MapPin, FlaskConical, CalendarDays, ClipboardList, Lock, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import LocationPicker from "@/components/LocationPicker";
import WeatherDashboard from "@/components/WeatherDashboard";
import MixClassSelector from "@/components/MixClassSelector";
import ApplicationSelector from "@/components/ApplicationSelector";
import ForecastCalendar from "@/components/ForecastCalendar";
import LifecycleTimeline from "@/components/LifecycleTimeline";
import ResultsDashboard from "@/components/ResultsDashboard";

import { fetchWeather, type CurrentWeather, type ForecastDay } from "@/lib/weatherApi";
import { calculateMultiMix, type SelectedApp, type MultiMixResult } from "@/lib/mixCalculator";
import { computePourScore } from "@/lib/pourScore";
import type { MixClassKey } from "@/lib/constants";

type Tab = "location" | "mix" | "results" | "plan";

// Default to Bangkok if no GPS
const DEFAULT_LAT = 13.7563;
const DEFAULT_LNG = 100.5018;
const STORAGE_KEY = "mixright_state_v1";

export default function Home() {
  // Location
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [locationSet, setLocationSet] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);

  // Manual weather override
  const [manualMode, setManualMode] = useState(false);
  const [manualTemp, setManualTemp] = useState(30);
  const [manualHumidity, setManualHumidity] = useState(65);

  // Online status
  const [isOnline, setIsOnline] = useState(true);

  // Mix inputs
  const [projectRef, setProjectRef] = useState("");
  const [mixClass, setMixClass] = useState<MixClassKey>("general");
  const [selectedApps, setSelectedApps] = useState<SelectedApp[]>([
    { applicationId: "slab", numBags: 2 },
  ]);
  const [sandType, setSandType] = useState<"river" | "crushed" | "mixed">("river");
  const [cementAge, setCementAge] = useState(0);

  // Plan
  const [pourDate, setPourDate] = useState<string | null>(null);

  // Results
  const [result, setResult] = useState<MultiMixResult | null>(null);

  // Nav
  const [tab, setTab] = useState<Tab>("location");

  // Online/offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Restore inputs from localStorage on mount (not weather — always refetch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (typeof s.lat === "number") setLat(s.lat);
      if (typeof s.lng === "number") setLng(s.lng);
      if (typeof s.projectRef === "string") setProjectRef(s.projectRef);
      if (s.mixClass) setMixClass(s.mixClass);
      if (Array.isArray(s.selectedApps) && s.selectedApps.length) setSelectedApps(s.selectedApps);
      if (s.sandType) setSandType(s.sandType);
      if (typeof s.cementAge === "number") setCementAge(s.cementAge);
      if (typeof s.pourDate === "string") setPourDate(s.pourDate);
    } catch {}
  }, []);

  // Persist inputs to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        lat, lng, projectRef, mixClass, selectedApps, sandType, cementAge, pourDate,
      }));
    } catch {}
  }, [lat, lng, projectRef, mixClass, selectedApps, sandType, cementAge, pourDate]);

  async function handleLocationConfirm(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchWeather(newLat, newLng);
      setCurrentWeather(data.current);
      setForecast(data.forecast);
      setLocationSet(true);
      setManualMode(false);
      if (!pourDate && data.forecast.length > 0) setPourDate(data.forecast[0].date);
    } catch {
      setWeatherError("Could not fetch weather. Check connection or use manual entry below.");
    }
    setWeatherLoading(false);
  }

  function handleManualWeather() {
    const today = new Date();
    const fakeForecast: ForecastDay[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split("T")[0],
        maxTempC: manualTemp + 3,
        minTempC: Math.max(15, manualTemp - 7),
        maxHumidity: manualHumidity,
        precipMm: 0,
        weatherCode: 0,
        windSpeedMax: 10,
        uvIndexMax: 5,
      };
    });
    setCurrentWeather({
      temperatureC: manualTemp,
      humidityPct:  manualHumidity,
      windSpeedKph: 10,
      uvIndex:      5,
    });
    setForecast(fakeForecast);
    setLocationSet(true);
    setWeatherError(null);
    setManualMode(false);
    if (!pourDate) setPourDate(fakeForecast[0].date);
  }

  function handleCalculate() {
    if (!currentWeather || selectedApps.length === 0) return;
    const r = calculateMultiMix(
      selectedApps,
      sandType,
      cementAge,
      currentWeather.temperatureC,
      currentWeather.humidityPct,
    );
    setResult(r);
    setTab("results");
  }

  const hasApps      = selectedApps.length > 0;
  const canCalculate = locationSet && hasApps;

  // Primary application for lifecycle (use most structurally demanding)
  const primaryApp = selectedApps.length > 0
    ? selectedApps.find(a => ["footing", "column", "stairs"].includes(a.applicationId)) ?? selectedApps[0]
    : null;
  const isPrimaryStructural = primaryApp
    ? ["footing", "column", "stairs"].includes(primaryApp.applicationId)
    : false;

  const pourDateObj = pourDate ? new Date(pourDate + "T07:00:00") : null;

  // Use selected forecast day's conditions for lifecycle accuracy
  const selectedForecastDay  = forecast.find(d => d.date === pourDate);
  const lifecycleTempC       = selectedForecastDay?.maxTempC    ?? currentWeather?.temperatureC ?? 28;
  const lifecycleHumidity    = selectedForecastDay?.maxHumidity ?? currentWeather?.humidityPct  ?? 70;

  const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "location", label: "Location", Icon: MapPin },
    { id: "mix",      label: "Mix",      Icon: FlaskConical },
    { id: "results",  label: "Results",  Icon: result ? ClipboardList : Lock },
    { id: "plan",     label: "Plan",     Icon: CalendarDays },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-yellow-400 text-yellow-900 text-xs font-semibold text-center py-1.5 px-4 flex items-center justify-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
          Offline — use manual weather entry below
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-orange-600 text-primary-foreground px-4 pt-6 pb-4 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl font-black tracking-tight">MixRight</h1>
            <span className="text-sm opacity-75 font-medium">concrete calculator</span>
          </div>
          {projectRef && (
            <div className="mt-1 text-xs opacity-80 font-medium truncate">{projectRef}</div>
          )}
          {currentWeather && (
            <div className="flex items-center gap-3 mt-2 text-sm opacity-90">
              <span className="font-bold">{currentWeather.temperatureC}°C</span>
              <span>{currentWeather.humidityPct}% humidity</span>
              <span className="text-xs opacity-70">{lat.toFixed(2)}°, {lng.toFixed(2)}°</span>
            </div>
          )}
        </div>
      </header>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-5 space-y-4">

          {/* ── LOCATION TAB ── */}
          {tab === "location" && (
            <>
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Construction site location
              </div>

              <LocationPicker
                lat={lat} lng={lng}
                onConfirm={handleLocationConfirm}
                loading={weatherLoading}
              />

              {/* Manual entry shortcut (shown before any weather is loaded) */}
              {!currentWeather && !weatherLoading && !manualMode && (
                <button
                  className="text-xs text-muted-foreground underline underline-offset-2 w-full text-center py-1"
                  onClick={() => setManualMode(true)}
                >
                  No GPS or connection? Enter weather manually
                </button>
              )}

              {weatherError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-sm text-destructive">
                  {weatherError}
                </div>
              )}

              {/* Manual weather entry form */}
              {(manualMode || (!isOnline && !currentWeather)) && (
                <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Manual weather entry
                    </div>
                    {manualMode && isOnline && (
                      <button
                        className="text-xs text-muted-foreground underline"
                        onClick={() => setManualMode(false)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Temperature</span>
                      <span className="font-bold">{manualTemp}°C</span>
                    </div>
                    <input
                      type="range" min={15} max={45} step={1} value={manualTemp}
                      onChange={e => setManualTemp(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>15°C cool</span><span>45°C extreme</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Humidity</span>
                      <span className="font-bold">{manualHumidity}%</span>
                    </div>
                    <input
                      type="range" min={30} max={100} step={1} value={manualHumidity}
                      onChange={e => setManualHumidity(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>30% dry</span><span>100% saturated</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    7-day forecast will be estimated from these values.
                  </p>

                  <Button className="w-full" onClick={handleManualWeather}>
                    Use these values →
                  </Button>
                </div>
              )}

              {currentWeather && (
                <>
                  <Separator />
                  <WeatherDashboard
                    lat={lat} lng={lng}
                    weather={currentWeather}
                    todayForecast={forecast[0]}
                  />
                  <Button className="w-full" onClick={() => setTab("mix")}>
                    Set up your mix →
                  </Button>
                </>
              )}
            </>
          )}

          {/* ── MIX TAB ── */}
          {tab === "mix" && (
            <>
              {/* Project reference */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">
                  Project reference (optional)
                </label>
                <input
                  type="text"
                  value={projectRef}
                  onChange={e => setProjectRef(e.target.value)}
                  placeholder="e.g. Block A – Column F3, or engineer spec no."
                  className="w-full border border-input rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <Separator />

              {/* Mix class */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Concrete strength
                </div>
                <MixClassSelector value={mixClass} onChange={setMixClass} />
                <p className="text-xs text-muted-foreground mt-2">
                  The mix class is auto-suggested per application below, but this sets the default.
                </p>
              </div>

              <Separator />

              {/* Applications */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  What are you pouring? (select all that apply)
                </div>
                <ApplicationSelector selected={selectedApps} onChange={setSelectedApps} />
              </div>

              <Separator />

              {/* Sand type */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Sand type
                </div>
                <div className="space-y-2">
                  {[
                    { v: "river",   label: "River sand",              desc: "Smooth, rounded grains — most common in SEA rivers" },
                    { v: "crushed", label: "Crushed rock / pasir abu", desc: "Sharp, angular grains — slightly more water needed" },
                    { v: "mixed",   label: "Mixed / not sure",         desc: "Middle estimate used" },
                  ].map(s => (
                    <button
                      key={s.v}
                      onClick={() => setSandType(s.v as "river" | "crushed" | "mixed")}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border-2 transition-all ${
                        sandType === s.v
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="font-semibold text-sm">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Cement age */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Cement bag age
                </div>
                <div className="space-y-2">
                  {[
                    { v: 0, label: "Fresh (≤1 month)",     desc: "Full strength expected" },
                    { v: 2, label: "1–3 months",           desc: "OK — check for lumps before mixing" },
                    { v: 4, label: "3–6 months",           desc: "10–20% strength loss — avoid structural use" },
                    { v: 8, label: "6+ months (degraded)", desc: "Do not use for columns, footings, or beams" },
                  ].map(a => (
                    <button
                      key={a.v}
                      onClick={() => setCementAge(a.v)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border-2 transition-all ${
                        cementAge === a.v
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="font-semibold text-sm">{a.label}</div>
                      <div className="text-xs text-muted-foreground">{a.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full h-14 text-base font-black"
                onClick={handleCalculate}
                disabled={!canCalculate}
              >
                {!locationSet ? "Set location first" : !hasApps ? "Select at least one application" : "Calculate Mix"}
              </Button>
            </>
          )}

          {/* ── RESULTS TAB ── */}
          {tab === "results" && (
            <>
              {!result ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-muted-foreground text-sm">Complete the Mix tab and calculate to see results.</p>
                  <Button variant="outline" onClick={() => setTab("mix")}>Go to Mix</Button>
                </div>
              ) : (
                <>
                  <ResultsDashboard
                    result={result}
                    projectRef={projectRef}
                    humidity={currentWeather?.humidityPct ?? 70}
                    tempC={currentWeather?.temperatureC ?? 28}
                    lat={lat}
                    lng={lng}
                  />

                  {/* Pour date quick-picker */}
                  {forecast.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                          When are you pouring?
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
                          {forecast.map((day, i) => {
                            const score      = computePourScore(day);
                            const isSelected = day.date === pourDate;
                            const label      = i === 0 ? "Today"
                                             : i === 1 ? "Tmrw"
                                             : new Date(day.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
                            const dotColor   = score === "green"  ? "bg-green-500"
                                             : score === "yellow" ? "bg-yellow-400"
                                             : "bg-red-500";
                            return (
                              <button
                                key={day.date}
                                onClick={() => setPourDate(day.date)}
                                className={`snap-start flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 transition-all min-w-[60px] ${
                                  isSelected
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-muted-foreground/40"
                                }`}
                              >
                                <span className="text-xs font-semibold">{label}</span>
                                <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                                <span className="text-xs text-muted-foreground">{day.maxTempC}°</span>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Dot = pour conditions · green good · yellow caution · red avoid
                        </p>
                      </div>
                    </>
                  )}

                  {pourDate && pourDateObj && currentWeather && (
                    <>
                      <Separator />
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Concrete lifecycle from pour date
                      </div>
                      <LifecycleTimeline
                        pourDate={pourDateObj}
                        tempC={lifecycleTempC}
                        humidity={lifecycleHumidity}
                        isStructural={isPrimaryStructural}
                      />
                    </>
                  )}

                  <Button
                    variant="outline" className="w-full"
                    onClick={() => { setResult(null); setTab("mix"); }}
                  >
                    Recalculate
                  </Button>
                </>
              )}
            </>
          )}

          {/* ── PLAN TAB ── */}
          {tab === "plan" && (
            <>
              {forecast.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-muted-foreground text-sm">Set your location first to see the 7-day forecast.</p>
                  <Button variant="outline" onClick={() => setTab("location")}>Go to Location</Button>
                </div>
              ) : (
                <>
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    7-day pour planner
                  </div>
                  <ForecastCalendar forecast={forecast} selectedDate={pourDate} onSelect={setPourDate} />

                  {pourDate && pourDateObj && currentWeather && (
                    <>
                      <Separator />
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Concrete lifecycle — {pourDate}
                      </div>
                      <LifecycleTimeline
                        pourDate={pourDateObj}
                        tempC={lifecycleTempC}
                        humidity={lifecycleHumidity}
                        isStructural={isPrimaryStructural}
                      />
                    </>
                  )}

                  {result && (
                    <>
                      <Separator />
                      <Button className="w-full" onClick={() => setTab("results")}>
                        View mix results →
                      </Button>
                    </>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </div>

      {/* Bottom nav */}
      <nav className="sticky bottom-0 bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-2 z-20">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {TABS.map(({ id, label, Icon }) => {
            const isActive   = tab === id;
            const isDisabled = id === "results" && !result;
            return (
              <button
                key={id}
                onClick={() => !isDisabled && setTab(id)}
                disabled={isDisabled}
                className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all ${
                  isActive    ? "bg-primary/10 text-primary"
                  : isDisabled ? "opacity-30 cursor-not-allowed text-muted-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                <span className={`text-[10px] font-semibold ${isActive ? "text-primary" : ""}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
