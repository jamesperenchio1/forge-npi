# GreenDeck — Developer Reference

Thailand plant care OS for serious collectors. Next.js 16 App Router, Tailwind v4, all data in localStorage.

## Stack
- **Next.js 16.2.1** + App Router + Turbopack, TypeScript
- **React 19**, Tailwind CSS v4, OKLCH color tokens
- **shadcn/ui** component library
- **localStorage** — sole persistence layer (no backend wired)
- **Open-Meteo** — free weather API (forecast + historical archive)
- **Google Gemini** (`gemini-2.0-flash` → `gemini-1.5-flash` → `gemini-1.5-flash-8b` fallback chain)
- **suncalc** — sun position/times
- **recharts** — weather charts
- **react-day-picker v9** — calendar
- **@dnd-kit** — drag-and-drop garden canvas
- **Vercel** — deployment (`greendeck-app` project)

## Pages & Routes

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard` | `(app)/dashboard/page.tsx` | Overview: weather, plant stats, pests |
| `/plants` | `(app)/plants/page.tsx` | Plant inventory list |
| `/plants/new` | `(app)/plants/new/page.tsx` | Add plant (photo upload, AI lookup) |
| `/plants/[id]` | `(app)/plants/[id]/page.tsx` | Plant detail, care log, photo gallery |
| `/garden` | `(app)/garden/page.tsx` | Zone-tab garden layout with container map |
| `/calendar` | `(app)/calendar/page.tsx` | Growing Guide (year Gantt) + Events tabs |
| `/doctor` | `(app)/doctor/page.tsx` | AI plant diagnosis via Gemini |
| `/weather` | `(app)/weather/page.tsx` | Climate: sun arc, 7-day charts, seasons, pests |
| `/hydroponics` | `(app)/hydroponics/page.tsx` | Power cost calculator (THB/kWh) |

## localStorage Keys

| Key | Contents |
|-----|----------|
| `greendeck_plants` | `LocalPlant[]` |
| `greendeck_garden` | `Container[]` |
| `greendeck_zones` | `Zone[]` |
| `greendeck_care_logs` | `CareLog[]` |
| `greendeck_doctor_logs` | `DoctorLog[]` |
| `greendeck_calendar` | `CalendarEvent[]` |
| `greendeck_weather_cache` | `{ data, lat, lon, timestamp }` (30-min TTL) |
| `greendeck_hydro` | `HydroDevice[]` |
| `greendeck_hydro_rate` | `string` (THB/kWh) |

## Key Types (src/types/index.ts)

- **`PhotoEntry`** — `{ url: string, timestamp: string, comment?: string }` — replaces old `string[]`
- **`LocalPlant`** — includes `photos?: PhotoEntry[]`, `mainPhotoIndex?: number`
- **`HydroDevice`** — `{ id, name, category, watts, hours_per_day, enabled }`
- **`Container`** — has `sections: PotSection[]`, `zone_id?`
- **`Zone`** — `{ id, name, color }`

## API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/plant-details` | Gemini lookup: plant name → care info JSON |
| `POST /api/doctor` | Gemini diagnosis: image + symptoms → treatment plan |
| `GET /api/weather?lat=&lon=` | Proxies Open-Meteo forecast |

**Gemini model chain**: `gemini-2.0-flash` → `gemini-1.5-flash` → `gemini-1.5-flash-8b`
On 429 (quota exceeded), returns user-friendly error message — do NOT show raw API error.

## Weather

Forecast: `api.open-meteo.com/v1/forecast`
Historical: `archive-api.open-meteo.com/v1/archive?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

Bangkok default: lat 13.7563, lon 100.5018
Cache: 30 min TTL in localStorage. Shows Bangkok cached data immediately, geo in background.

## Nav (layout.tsx)

7 items: Home `/dashboard`, Plants `/plants`, Garden `/garden`, Doctor `/doctor`, Calendar `/calendar`, Climate `/weather`, Hydro `/hydroponics`

## Running Tests

```bash
# Unit tests (vitest)
npx vitest run

# E2e tests (Playwright, port 3002)
npx playwright test

# TypeScript check
npx tsc --noEmit
```

E2e tests run on port **3002** (ports 3000 and 3001 are occupied by other apps on this machine).

## Deploy

```bash
cd /home/james/forge-npi/products/greendeck
npx vercel deploy --prod
```

Live: `https://greendeck-app.vercel.app`
Vercel project: `greendeck-app` (ID: `prj_cwVbcHXnKspdHEHeX3px1Xxk5JuR`)
GEMINI_API_KEY is set in Vercel env.
