'use client';

import { useEffect, useState, useRef } from 'react';
import { WeatherData, weatherCodeLabel, uvLabel, uvColor } from '@/lib/openmeteo';
import { getPestsForMonth } from '@/lib/pest-calendar';
import { getSunPosition, getSunTimes, getDaySunPath } from '@/lib/suncalc';
import { PestIcon } from '@/components/pest/PestIcon';
import SunCalc from 'suncalc';
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

const WEATHER_CACHE_KEY = 'greendeck_weather_cache';
const WEATHER_CACHE_TTL = 30 * 60 * 1000;

interface WeatherCache { data: WeatherData; lat: number; lon: number; timestamp: number; }

function getCachedWeather(lat: number, lon: number): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const cache: WeatherCache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > WEATHER_CACHE_TTL) return null;
    if (Math.abs(cache.lat - lat) > 0.5 || Math.abs(cache.lon - lon) > 0.5) return null;
    return cache.data;
  } catch { return null; }
}

function setCachedWeather(lat: number, lon: number, data: WeatherData) {
  try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ data, lat, lon, timestamp: Date.now() })); } catch {}
}

async function fetchHistoricalWeather(lat: number, lon: number, date: string): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    start_date: date,
    end_date: date,
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,shortwave_radiation,precipitation',
    timezone: 'auto',
  });
  const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
  if (!res.ok) throw new Error('Historical weather fetch failed');
  const raw = await res.json();
  // Shape into WeatherData — archive has no current/daily, synthesise from hourly
  const h = raw.hourly;
  const midIdx = 12; // noon
  return {
    current: {
      temperature_2m: h.temperature_2m?.[midIdx] ?? 0,
      relative_humidity_2m: h.relative_humidity_2m?.[midIdx] ?? 0,
      wind_speed_10m: h.wind_speed_10m?.[midIdx] ?? 0,
      uv_index: h.uv_index?.[midIdx] ?? 0,
      shortwave_radiation: h.shortwave_radiation?.[midIdx] ?? 0,
      precipitation: h.precipitation?.[midIdx] ?? 0,
      weather_code: 0,
    },
    daily: {
      time: [date],
      temperature_2m_max: [Math.max(...(h.temperature_2m ?? [0]))],
      temperature_2m_min: [Math.min(...(h.temperature_2m ?? [0]))],
      precipitation_sum: [(h.precipitation ?? []).reduce((a: number, b: number) => a + b, 0)],
      uv_index_max: [Math.max(...(h.uv_index ?? [0]))],
      wind_speed_10m_max: [Math.max(...(h.wind_speed_10m ?? [0]))],
      weather_code: [0],
    },
    hourly: {
      time: h.time ?? [],
      temperature_2m: h.temperature_2m ?? [],
      relative_humidity_2m: h.relative_humidity_2m ?? [],
      wind_speed_10m: h.wind_speed_10m ?? [],
      uv_index: h.uv_index ?? [],
      shortwave_radiation: h.shortwave_radiation ?? [],
      precipitation: h.precipitation ?? [],
    },
  };
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return toDateInputValue(new Date());
}

function formatTime15(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// Converts a date string "YYYY-MM-DD" to a Date at midnight local time
function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// ─── SunArcSVG ────────────────────────────────────────────────────────────────

function getDaySunPathForDate(lat: number, lon: number, date: Date): Array<{ hour: number; altitude: number; azimuth: number }> {
  return Array.from({ length: 24 }, (_, hour) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0);
    const pos = SunCalc.getPosition(d, lat, lon);
    return {
      hour,
      altitude: (pos.altitude * 180) / Math.PI,
      azimuth: ((pos.azimuth * 180) / Math.PI + 180 + 360) % 360,
    };
  });
}

function SunArcSVG({ lat, lon, forDate }: { lat: number; lon: number; forDate?: Date }) {
  const useDate = forDate ?? new Date();
  const sunTimes = getSunTimes(lat, lon, useDate);
  const currentPos = forDate ? getSunPosition(lat, lon, new Date(forDate.getFullYear(), forDate.getMonth(), forDate.getDate(), 12)) : getSunPosition(lat, lon);
  const path = forDate ? getDaySunPathForDate(lat, lon, forDate) : getDaySunPath(lat, lon);

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

// ─── Chart config ─────────────────────────────────────────────────────────────

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

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Thailand Seasons ─────────────────────────────────────────────────────────

const THAI_SEASONS = [
  {
    id: 'cool-dry',
    label: 'Cool & Dry',
    months: 'Nov–Feb',
    activeMonths: [11, 12, 1, 2],
    body: 'NE monsoon winds, cool nights, clear days. 20–33°C. Best for cool-season crops (tomato, basil, cucumber). Low humidity.',
  },
  {
    id: 'hot-dry',
    label: 'Hot & Dry Pre-Monsoon',
    months: 'Mar–May',
    activeMonths: [3, 4, 5],
    body: 'Most intense heat of year. 34–40°C, very low rainfall. Spider mites and aphids peak. Water stress risk. Mulch heavily.',
  },
  {
    id: 'early-rains',
    label: 'Early Rains / Transition',
    months: 'May–Jun',
    activeMonths: [5, 6],
    body: 'First SW monsoon rains arrive. High humidity spike. Fungus gnat and thrips activity rises. 30–38°C.',
  },
  {
    id: 'main-monsoon',
    label: 'Main Monsoon',
    months: 'Jul–Sep',
    activeMonths: [7, 8, 9],
    body: 'Daily heavy rain, 28–34°C. Root rot risk. Excellent for water-loving crops. Reduce watering schedule. Typhoon risk Sep–Oct.',
  },
  {
    id: 'late-monsoon',
    label: 'Late Monsoon / Flood Risk',
    months: 'Oct',
    activeMonths: [10],
    body: 'Rain tapers off but flooding risk. 27–33°C. Begin planting cool-season crops indoors. Scale insects return.',
  },
  {
    id: 'transition-cool',
    label: 'Transition to Cool',
    months: 'Nov',
    activeMonths: [11],
    body: 'Rapidly cooling, clear skies return. 25–35°C. Mealybug and powdery mildew season begins. Best transplanting window.',
  },
];

// ─── Pest info links ───────────────────────────────────────────────────────────

const PEST_LINKS: Record<string, string> = {
  'Mealybugs': 'https://en.wikipedia.org/wiki/Mealybug',
  'Spider Mites': 'https://en.wikipedia.org/wiki/Spider_mite',
  'Fungus Gnats': 'https://en.wikipedia.org/wiki/Fungus_gnat',
  'Thrips': 'https://en.wikipedia.org/wiki/Thrips',
  'Aphids': 'https://en.wikipedia.org/wiki/Aphid',
  'Root Rot (Pythium)': 'https://en.wikipedia.org/wiki/Pythium',
  'Smoke/PM2.5 Damage': 'https://en.wikipedia.org/wiki/Particulates',
  'Powdery Mildew': 'https://en.wikipedia.org/wiki/Powdery_mildew',
  'Leaf Blight (Alternaria)': 'https://en.wikipedia.org/wiki/Alternaria',
  'Scale Insects': 'https://en.wikipedia.org/wiki/Scale_insect',
};

// ─── SVG condition icons (no emojis) ──────────────────────────────────────────

function IconThermometer() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  );
}

function IconDroplets() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
    </svg>
  );
}

function IconWind() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
    </svg>
  );
}

function IconCloud() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
    </svg>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('Bangkok');
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({ lat: 13.7563, lon: 100.5018 });
  const [chartTab, setChartTab] = useState<ChartTab>('temperature');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [historicalMode, setHistoricalMode] = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const loadedRef = useRef(false);

  const month = new Date().getMonth() + 1;
  const pests = getPestsForMonth(month);

  useEffect(() => {
    // Show cached Bangkok data immediately
    const cached = getCachedWeather(13.7563, 100.5018);
    if (cached) {
      setWeather(cached);
      setLoading(false);
      setLocationName('Bangkok');
    } else {
      load(13.7563, 100.5018, 'Bangkok');
    }

    // Then try geolocation in background
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lon = p.coords.longitude;
        if (loadedRef.current) return;
        setCoords({ lat, lon });
        const localCached = getCachedWeather(lat, lon);
        if (localCached) {
          setWeather(localCached);
          setLoading(false);
          setLocationName('Your location');
        } else {
          load(lat, lon, 'Your location');
        }
      },
      () => { /* stay on Bangkok */ },
      { timeout: 6000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(lat: number, lon: number, name: string) {
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setCachedWeather(lat, lon, data);
      setWeather(data);
      setLocationName(name);
      loadedRef.current = true;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDateChange(dateStr: string) {
    setSelectedDate(dateStr);
    const today = todayStr();
    if (dateStr >= today) {
      // Forecast mode — reload normal data
      setHistoricalMode(false);
      if (!weather || historicalMode) {
        load(coords.lat, coords.lon, locationName);
      }
      return;
    }
    // Historical mode
    setHistoricalMode(true);
    setHistLoading(true);
    try {
      const data = await fetchHistoricalWeather(coords.lat, coords.lon, dateStr);
      setWeather(data);
    } catch (e) {
      console.error(e);
    } finally {
      setHistLoading(false);
    }
  }

  // ── Chart data helpers ────────────────────────────────────────────────────

  function getChartData(tab: ChartTab) {
    if (!weather?.hourly?.time) return [];
    const cfg = CHART_CONFIG[tab];
    const arr = weather.hourly[cfg.key] as number[];

    if (historicalMode) {
      // Show all hours in the historical day
      return weather.hourly.time.map((t, i) => {
        const d = new Date(t);
        return {
          time: `${d.getHours().toString().padStart(2, '0')}:00`,
          date: t,
          value: arr[i] ?? 0,
        };
      });
    }

    const now = new Date();
    const startIdx = weather.hourly.time.findIndex(
      (t) => new Date(t) >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 6)
    );
    const s = Math.max(0, startIdx);
    return weather.hourly.time.slice(s, s + 168).map((t, i) => {
      const d = new Date(t);
      return {
        time: `${d.getHours().toString().padStart(2, '0')}:00`,
        date: t,
        value: arr[s + i] ?? 0,
      };
    });
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
  const chart15Data = (!historicalMode && weather) ? get15MinData(chartTab) : [];
  const cfg = CHART_CONFIG[chartTab];

  // X-axis tick formatter: show "Thu 3" only at midnight, else blank
  function xAxisTickFormatter(dateIso: string): string {
    const d = new Date(dateIso);
    if (d.getHours() === 0) {
      return `${DAY_SHORT[d.getDay()]} ${d.getDate()}`;
    }
    return '';
  }

  // Tooltip label formatter: "Thu Apr 3, 14:00"
  function tooltipLabelFormatter(dateIso: unknown): string {
    const d = new Date(String(dateIso));
    return d.toLocaleString('en', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  const forecastTitle = historicalMode
    ? `${cfg.label} — Historical`
    : `${cfg.label} — Next 7 Days`;

  const selectedDateObj = selectedDate ? parseDateLocal(selectedDate) : undefined;
  const sunDate = historicalMode && selectedDateObj ? selectedDateObj : undefined;

  // Historical label
  const historicalLabel = (() => {
    if (!historicalMode || !selectedDate) return null;
    const d = parseDateLocal(selectedDate);
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  })();

  // Active season detection
  const activeSeasons = THAI_SEASONS.filter((s) => s.activeMonths.includes(month));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-lora)' }}>Climate</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{locationName}</p>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">View date</label>
        <input
          type="date"
          value={selectedDate}
          max={todayStr()}
          onChange={(e) => handleDateChange(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {historicalMode && (
          <span className="text-xs font-semibold text-primary whitespace-nowrap">
            Historical: {historicalLabel}
          </span>
        )}
        {histLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
      </div>

      {/* Sun arc */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          {historicalMode ? `Sun Path — ${historicalLabel}` : 'Sun Position Today'}
        </p>
        <SunArcSVG lat={coords.lat} lon={coords.lon} forDate={sunDate} />
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
              {getSunTimes(coords.lat, coords.lon, sunDate).solarNoon.toLocaleTimeString('en', {
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

      {/* Current conditions — no emojis */}
      {!loading && weather && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Temperature', value: `${Math.round(weather.current.temperature_2m)}°C`, Icon: IconThermometer },
            { label: 'Humidity', value: `${weather.current.relative_humidity_2m}%`, Icon: IconDroplets },
            { label: 'Wind', value: `${Math.round(weather.current.wind_speed_10m)} km/h`, Icon: IconWind },
            { label: 'Conditions', value: weatherCodeLabel(weather.current.weather_code), Icon: IconCloud },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl bg-card border border-border p-3.5 flex items-center gap-3">
              <Icon />
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{forecastTitle}</p>

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

          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9 }}
                  interval={0}
                  tickFormatter={xAxisTickFormatter}
                  tickCount={8}
                />
                <YAxis
                  tick={{ fontSize: 9 }}
                  width={34}
                  label={cfg.unit ? { value: cfg.unit, angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 9 } } : undefined}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  labelFormatter={tooltipLabelFormatter}
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

          {!historicalMode && chart15Data.length > 0 && (
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

      {/* Thailand seasons — 6 seasons, no emojis */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Thailand Seasons</p>
        <div className="space-y-2.5">
          {[
            ...THAI_SEASONS.filter((s) => activeSeasons.some((a) => a.id === s.id)),
            ...THAI_SEASONS.filter((s) => !activeSeasons.some((a) => a.id === s.id)),
          ].map((season) => {
            const active = activeSeasons.some((a) => a.id === season.id);
            return (
              <div
                key={season.id}
                className={`rounded-xl p-3 ${active ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50 border border-border'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">{season.label}</p>
                  <span className="text-xs text-muted-foreground">({season.months})</span>
                  {active && (
                    <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold ml-auto">NOW</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{season.body}</p>
              </div>
            );
          })}
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
            {pests.map((p) => {
              const infoUrl = PEST_LINKS[p.name];
              return (
                <div key={p.name} className="flex gap-3">
                  <PestIcon type={p.iconType} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{p.name}</p>
                      {infoUrl && (
                        <a
                          href={infoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`More info: ${p.name}`}
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors text-[10px] font-bold leading-none flex-shrink-0"
                        >
                          i
                        </a>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.severity === 'high' ? 'bg-red-100 text-red-800' :
                        p.severity === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                      }`}>{p.severity}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        p.type === 'pest' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-purple-50 border-purple-200 text-purple-700'
                      }`}>{p.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.signs}</p>
                    <p className="text-xs text-foreground/70 mt-0.5">Treatment: {p.treatment}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Care advice */}
      {weather && !historicalMode && (
        <div className="rounded-2xl bg-secondary border border-border p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today's Care Advice</p>
          {weather.current.uv_index >= 8 && (
            <p className="text-sm"><strong>High UV today ({weather.current.uv_index.toFixed(0)}).</strong> Move sensitive seedlings to partial shade 10am–2pm.</p>
          )}
          {weather.current.relative_humidity_2m < 50 && (
            <p className="text-sm"><strong>Low humidity ({weather.current.relative_humidity_2m}%).</strong> Mist aroids and check soil moisture — pots dry faster today.</p>
          )}
          {weather.current.relative_humidity_2m > 85 && (
            <p className="text-sm"><strong>High humidity ({weather.current.relative_humidity_2m}%).</strong> Check for fungal issues and ensure airflow around dense plants.</p>
          )}
          {weather.current.temperature_2m >= 35 && (
            <p className="text-sm"><strong>Heat stress risk ({Math.round(weather.current.temperature_2m)}°C).</strong> Dark pots cook roots — wrap or swap for fabric grow bags.</p>
          )}
          {weather.current.precipitation > 5 && (
            <p className="text-sm"><strong>Rain today.</strong> Check drainage is clear. Skip watering. Watch for root rot in poorly draining pots.</p>
          )}
          {weather.current.uv_index < 8 && weather.current.relative_humidity_2m >= 50 && weather.current.relative_humidity_2m <= 85 && weather.current.temperature_2m < 35 && weather.current.precipitation <= 5 && (
            <p className="text-sm">Conditions look good for plant care today.</p>
          )}
        </div>
      )}
    </div>
  );
}
