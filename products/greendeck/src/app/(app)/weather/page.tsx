'use client';

import { useEffect, useState } from 'react';
import { WeatherData, weatherCodeLabel, uvLabel, uvColor } from '@/lib/openmeteo';
import { getPestsForMonth } from '@/lib/pest-calendar';
import { getSunPosition, getSunTimes, getDaySunPath } from '@/lib/suncalc';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getHours().toString().padStart(2, '0')}:00`;
}

function formatTime15(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function SunArcSVG({ lat, lon }: { lat: number; lon: number }) {
  const sunTimes = getSunTimes(lat, lon);
  const currentPos = getSunPosition(lat, lon);
  const path = getDaySunPath(lat, lon);

  const abovePath = path.filter((p) => p.altitude > 0);

  const W = 300;
  const H = 110;

  function azToX(az: number): number {
    const clamped = Math.max(90, Math.min(270, az));
    return ((clamped - 90) / 180) * (W - 40) + 20;
  }
  function altToY(alt: number): number {
    return H - 10 - (alt / 90) * (H - 20);
  }

  const sunriseLabel = sunTimes.sunrise.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
  const sunsetLabel = sunTimes.sunset.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });

  let arcD = '';
  for (let i = 0; i < abovePath.length; i++) {
    const x = azToX(abovePath[i].azimuth);
    const y = altToY(abovePath[i].altitude);
    arcD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }

  const isAboveHorizon = currentPos.altitudeDegrees > 0;
  const sunX = azToX(currentPos.azimuthDegrees);
  const sunY = altToY(Math.max(0, currentPos.altitudeDegrees));

  return (
    <svg viewBox={`0 0 ${W} ${H + 15}`} className="w-full" style={{ maxHeight: '130px' }}>
      <line x1="20" y1={H - 10} x2={W - 20} y2={H - 10} stroke="#d1fae5" strokeWidth="1.5" />
      {arcD && (
        <path d={arcD} fill="none" stroke="#d1fae5" strokeWidth="2" />
      )}
      {isAboveHorizon && (
        <circle cx={sunX} cy={sunY} r="9" fill="#facc15" stroke="#fde68a" strokeWidth="2" />
      )}
      <text x="20" y={H + 12} textAnchor="middle" fontSize="9" fill="#6b7280">E {sunriseLabel}</text>
      <text x={W - 20} y={H + 12} textAnchor="middle" fontSize="9" fill="#6b7280">W {sunsetLabel}</text>
      {!isAboveHorizon && (
        <text x={W / 2} y={H / 2 + 5} textAnchor="middle" fontSize="11" fill="#9ca3af">Below horizon</text>
      )}
    </svg>
  );
}

type ChartTab = 'temperature' | 'humidity' | 'wind' | 'uv' | 'precipitation';

const CHART_CONFIG: Record<ChartTab, {
  label: string;
  key: keyof WeatherData['hourly'];
  color: string;
  fill: string;
  unit: string;
}> = {
  temperature: { label: 'Temperature', key: 'temperature_2m', color: '#22c55e', fill: '#dcfce7', unit: '°C' },
  humidity: { label: 'Humidity', key: 'relative_humidity_2m', color: '#3b82f6', fill: '#dbeafe', unit: '%' },
  wind: { label: 'Wind', key: 'wind_speed_10m', color: '#8b5cf6', fill: '#ede9fe', unit: 'km/h' },
  uv: { label: 'UV Index', key: 'uv_index', color: '#f59e0b', fill: '#fef3c7', unit: '' },
  precipitation: { label: 'Precipitation', key: 'precipitation', color: '#0ea5e9', fill: '#e0f2fe', unit: 'mm' },
};

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('Detecting...');
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({ lat: 13.7563, lon: 100.5018 });
  const [chartTab, setChartTab] = useState<ChartTab>('temperature');

  const month = new Date().getMonth() + 1;
  const pests = getPestsForMonth(month);
  const isMonsoon = month >= 5 && month <= 10;
  const isPreMonsoonHeat = month >= 3 && month <= 5;

  useEffect(() => {
    const geoOpts = { timeout: 8000 };
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setLocationName('Your location');
        setCoords({ lat: p.coords.latitude, lon: p.coords.longitude });
        load(p.coords.latitude, p.coords.longitude);
      },
      () => {
        setLocationName('Bangkok (default)');
        load(13.7563, 100.5018);
      },
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

  function getChartData(tab: ChartTab) {
    if (!weather?.hourly?.time) return [];
    const cfg = CHART_CONFIG[tab];
    const now = new Date();
    const startIdx = weather.hourly.time.findIndex(
      (t) => new Date(t) >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 6)
    );
    const s = Math.max(0, startIdx);
    const arr = weather.hourly[cfg.key] as number[];
    return weather.hourly.time.slice(s, s + 48).map((t, i) => ({
      time: formatTime(t),
      value: arr[s + i] ?? 0,
    }));
  }

  function get15MinData(tab: ChartTab) {
    if (!weather?.minutely_15?.time) return [];
    const cfg = CHART_CONFIG[tab];
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const arr = weather.minutely_15[cfg.key as keyof typeof weather.minutely_15] as number[] | undefined;
    if (!arr) return [];
    const filtered = weather.minutely_15.time
      .map((t, i) => ({ t, v: arr[i] }))
      .filter(({ t }) => {
        const d = new Date(t);
        return d >= twoHoursAgo && d <= now;
      });
    return filtered.map(({ t, v }) => ({ time: formatTime15(t), value: v ?? 0 }));
  }

  const chartData = weather ? getChartData(chartTab) : [];
  const chart15Data = weather ? get15MinData(chartTab) : [];
  const cfg = CHART_CONFIG[chartTab];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-lora)' }}>Climate</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{locationName}</p>
      </div>

      {/* Sun arc */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sun Position Today</p>
        <SunArcSVG lat={coords.lat} lon={coords.lon} />
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">UV Now</p>
            {loading ? (
              <p className="text-sm font-semibold">--</p>
            ) : (
              <p className={`text-sm font-semibold ${uvColor(weather?.current.uv_index ?? 0)}`}>
                {weather?.current.uv_index.toFixed(1)} ({uvLabel(weather?.current.uv_index ?? 0)})
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Solar Noon</p>
            <p className="text-sm font-semibold">
              {getSunTimes(coords.lat, coords.lon).solarNoon.toLocaleTimeString('en', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Solar</p>
            {loading ? (
              <p className="text-sm font-semibold">--</p>
            ) : (
              <p className="text-sm font-semibold">{Math.round(weather?.current.shortwave_radiation ?? 0)} W/m2</p>
            )}
          </div>
        </div>
      </div>

      {/* Current conditions */}
      {!loading && weather && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Temperature', value: `${Math.round(weather.current.temperature_2m)}°C`, icon: '🌡️' },
            { label: 'Humidity', value: `${weather.current.relative_humidity_2m}%`, icon: '💧' },
            { label: 'Wind', value: `${Math.round(weather.current.wind_speed_10m)} km/h`, icon: '💨' },
            { label: 'Conditions', value: weatherCodeLabel(weather.current.weather_code), icon: '🌤️' },
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

      {/* Time-series charts */}
      {!loading && weather && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">48-Hour Forecast</p>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(Object.keys(CHART_CONFIG) as ChartTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setChartTab(tab)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  chartTab === tab
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                {CHART_CONFIG[tab].label}
              </button>
            ))}
          </div>

          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{ fontSize: 9 }} interval={5} />
                <YAxis tick={{ fontSize: 9 }} width={28} unit={cfg.unit} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v) => [`${Number(v).toFixed(1)}${cfg.unit}`, cfg.label]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={cfg.color}
                  fill={cfg.fill}
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {chart15Data.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Last 2 Hours (15-min resolution)</p>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart15Data} margin={{ top: 2, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" tick={{ fontSize: 8 }} interval={2} />
                    <YAxis tick={{ fontSize: 8 }} width={24} unit={cfg.unit} />
                    <Tooltip
                      contentStyle={{ fontSize: 10, borderRadius: 8 }}
                      formatter={(v) => [`${Number(v).toFixed(1)}${cfg.unit}`, cfg.label]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={cfg.color}
                      strokeWidth={2}
                      dot={{ r: 2, fill: cfg.color }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Thailand seasons */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Thailand Seasons</p>
        <div className="space-y-2.5">
          {[
            { months: 'Nov–Feb', label: 'Cool & Dry Season', active: month <= 2 || month === 11 || month === 12, icon: '🌤️', tip: 'Best planting window. Cooler nights, less pest pressure.' },
            { months: 'Mar–May', label: 'Pre-Monsoon Heat', active: isPreMonsoonHeat, icon: '☀️', tip: '40°C+ possible. Shade cloth essential. Spider mite risk peaks.' },
            { months: 'May–Oct', label: 'Monsoon Season', active: isMonsoon, icon: '🌧️', tip: 'Heavy rain. Root rot risk. Clear drainage. Fungus gnats active.' },
          ].map(({ months, label, active, icon, tip }) => (
            <div key={months} className={`rounded-xl p-3 flex gap-3 ${active ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50 border border-border'}`}>
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
          Pest Calendar — {new Date().toLocaleDateString('en', { month: 'long' })}
        </p>
        {pests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Low pest pressure this month.</p>
        ) : (
          <div className="space-y-3">
            {pests.map((p) => (
              <div key={p.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{p.emoji} {p.name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    p.severity === 'high' ? 'bg-red-100 text-red-800' :
                    p.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                  }`}>{p.severity}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.signs}</p>
                <p className="text-xs text-foreground/70">Treatment: {p.treatment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Care advice */}
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
