# Architecture — GreenDeck

## Overview

GreenDeck is a Thailand-specific plant care OS for serious collectors and urban gardeners. Users track individual plant specimens (not species), manage growing system configurations (soil, Kratky, NFT, DWC), and receive microclimate-aware care recommendations calibrated for Bangkok balconies, Chiang Mai cool-season windows, and monsoon timing. The app integrates GPS-based microclimate data, AI-powered plant diagnosis, photo journaling per specimen, and an interactive garden map.

**Monthly operating cost: $0.** All APIs on free tier. Supabase free tier. Vercel free tier.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 App Router | SSR for plant detail pages, client components for map/journal |
| Components | shadcn/ui + Tailwind v4 | Heavily customized — botanical palette, not default shadcn look |
| Auth + DB | Supabase (Postgres + Auth + Storage) | Free tier: 500MB DB, 1GB storage, 50K MAU |
| AI / Vision | Google Gemini 1.5 Flash (`@google/generative-ai`) | Plant doctor — free tier 1,500 req/day |
| Weather | Open-Meteo (no key) | Solar radiation, UV, wind, historical data |
| Plant DB | Perenual API (100 req/day free) | Care data, species lookup |
| Plant ID | Pl@ntNet (500 req/day free) | Photo-based identification |
| Air Quality | OpenAQ (no key) | Chiang Mai smoke season PM2.5 |
| Sun Modeling | `suncalc` npm package (browser-side) | Azimuth, altitude, sunrise/sunset for any lat/lon/datetime |
| Deployment | Vercel free tier | Vercel Functions for Gemini + Supabase server actions |
| Font | Google Fonts: `Lora` (headings) + `Inter` (body) | Lora gives botanical editorial feel |

---

## App Structure — Next.js App Router

```
src/app/
├── layout.tsx                        # Root layout: fonts, Supabase provider, global CSS
├── globals.css                       # Botanical design tokens (OKLCH palette)
├── page.tsx                          # Dashboard: location setup + collection summary
├── (auth)/
│   ├── login/page.tsx                # Supabase Auth — magic link + Google OAuth
│   └── callback/route.ts             # OAuth callback handler
├── garden/page.tsx                   # Interactive garden map view
├── plants/
│   ├── page.tsx                      # Collection list — all specimens
│   ├── new/page.tsx                  # Add new plant
│   └── [plantId]/
│       ├── page.tsx                  # Plant detail: timeline, care guide, photo log
│       ├── journal/page.tsx          # Full photo journal for specimen
│       └── doctor/page.tsx           # Plant doctor: upload photo → Gemini diagnosis
├── hydroponics/
│   ├── page.tsx                      # All hydro systems overview
│   └── [systemId]/page.tsx           # System detail: nutrient schedule, pH log
├── microclimate/page.tsx             # Location microclimate dashboard
└── api/
    ├── doctor/route.ts               # POST: Gemini vision — plant diagnosis
    ├── identify/route.ts             # POST: Pl@ntNet proxy — plant ID from photo
    ├── weather/route.ts              # GET: Open-Meteo (server-side, avoids CORS)
    └── airquality/route.ts           # GET: OpenAQ proxy for Chiang Mai PM2.5
```

---

## Database Schema — Supabase Postgres

RLS enabled on all tables. Users can only read/write their own data.

### `profiles`
```sql
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  location_lat  numeric(9,6),
  location_lng  numeric(9,6),
  location_name text,
  floor_number  smallint,
  orientation   text,         -- 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
  region        text default 'central', -- 'central' | 'north' | 'northeast' | 'south'
  created_at    timestamptz default now()
);
```

### `containers`
```sql
create table containers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade not null,
  name          text not null,
  type          text not null,  -- 'pot' | 'tray' | 'nft_channel' | 'dwc_bucket' | 'kratky_jar' | 'bed'
  medium        text,           -- 'aroid_mix' | 'leca' | 'water' | 'perlite' | 'coco' | 'soil'
  volume_liters numeric(6,2),
  map_x         numeric(6,2),
  map_y         numeric(6,2),
  map_width     numeric(6,2) default 8,
  map_height    numeric(6,2) default 8,
  zone_label    text,
  notes         text,
  created_at    timestamptz default now()
);
```

### `plants`
```sql
create table plants (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references profiles(id) on delete cascade not null,
  container_id        uuid references containers(id) on delete set null,
  collector_tag       text,
  common_name         text not null,
  scientific_name     text,
  perenual_id         integer,
  origin_type         text,   -- 'seed' | 'cutting' | 'division' | 'purchase' | 'trade'
  acquired_date       date,
  acquired_from       text,
  stage               text default 'established',
  health_status       text default 'healthy',
  growing_system      text default 'soil',
  last_watered        date,
  last_fertilized     date,
  last_repotted       date,
  watering_interval_days      smallint,
  fertilizer_interval_days    smallint,
  notes               text,
  cover_photo_path    text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
```

### `photo_logs`
```sql
create table photo_logs (
  id            uuid primary key default gen_random_uuid(),
  plant_id      uuid references plants(id) on delete cascade not null,
  user_id       uuid references profiles(id) on delete cascade not null,
  storage_path  text not null,
  caption       text,
  tags          text[],  -- ['new_leaf', 'pest_spotted', 'repot', 'flower']
  taken_at      timestamptz default now(),
  created_at    timestamptz default now()
);
```

### `care_logs`
```sql
create table care_logs (
  id            uuid primary key default gen_random_uuid(),
  plant_id      uuid references plants(id) on delete cascade not null,
  user_id       uuid references profiles(id) on delete cascade not null,
  action_type   text not null,  -- 'water' | 'fertilize' | 'repot' | 'prune' | 'treat_pest' | 'note'
  notes         text,
  product_used  text,
  performed_at  timestamptz default now()
);
```

### `doctor_logs`
```sql
create table doctor_logs (
  id              uuid primary key default gen_random_uuid(),
  plant_id        uuid references plants(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade not null,
  image_path      text not null,
  diagnosis       text not null,
  confidence      text,
  pest_or_disease text,
  treatment       text,
  model_used      text default 'gemini-1.5-flash',
  created_at      timestamptz default now()
);
```

### `hydroponics_systems`
```sql
create table hydroponics_systems (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references profiles(id) on delete cascade not null,
  container_id          uuid references containers(id) on delete cascade,
  system_type           text not null,  -- 'kratky' | 'nft' | 'dwc'
  reservoir_liters      numeric(6,2),
  current_nutrient_brand text,
  current_ec            numeric(5,2),
  target_ec_min         numeric(5,2),
  target_ec_max         numeric(5,2),
  target_ph_min         numeric(4,2) default 5.5,
  target_ph_max         numeric(4,2) default 6.5,
  last_reservoir_change date,
  notes                 text,
  created_at            timestamptz default now()
);
```

### `ph_logs`
```sql
create table ph_logs (
  id          uuid primary key default gen_random_uuid(),
  system_id   uuid references hydroponics_systems(id) on delete cascade not null,
  user_id     uuid references profiles(id) on delete cascade not null,
  ph_value    numeric(4,2) not null,
  ec_value    numeric(5,2),
  notes       text,
  logged_at   timestamptz default now()
);
```

### `nutrient_logs`
```sql
create table nutrient_logs (
  id                        uuid primary key default gen_random_uuid(),
  system_id                 uuid references hydroponics_systems(id) on delete cascade not null,
  user_id                   uuid references profiles(id) on delete cascade not null,
  product_name              text not null,
  dose_ml_per_liter         numeric(5,2),
  total_ml                  numeric(7,2),
  reservoir_liters_at_dose  numeric(6,2),
  notes                     text,
  dosed_at                  timestamptz default now()
);
```

---

## API Integration Map

### Open-Meteo (no key required)
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lng}
  &current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,shortwave_radiation
  &daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,wind_speed_10m_max,shortwave_radiation_sum
  &hourly=uv_index,shortwave_radiation,wind_speed_10m
  &timezone=auto&forecast_days=7
```
Server-side, cached 30 min via `next: { revalidate: 1800 }`.

### Perenual (100 req/day — cache in localStorage)
```
GET https://perenual.com/api/species-list?key={KEY}&q={name}
→ data[0].id, watering, sunlight[], maintenance
```
Results cached in localStorage by species name. Never re-fetch same species.

### Pl@ntNet (500 req/day)
```
POST https://my-api.plantnet.org/v2/identify/all?api-key={KEY}&lang=en
  multipart: images[] + organs[]
→ results[0].species.scientificNameWithoutAuthor, commonNames[0], score
```
Proxied through `/api/identify/route.ts`.

### SunCalc (browser-side, no API)
```typescript
import SunCalc from 'suncalc';
SunCalc.getTimes(date, lat, lng)  → sunrise, sunset, solarNoon
SunCalc.getPosition(date, lat, lng) → altitude, azimuth
```

### OpenAQ (no key, Chiang Mai only)
```
GET https://api.openaq.org/v3/locations?coordinates={lat},{lng}&radius=50000
GET https://api.openaq.org/v3/sensors/{id}/measurements/daily?limit=7
```
Only queried when `profiles.region === 'north'`. Cached 6hr.

### Gemini 1.5 Flash (server-side only)
```
POST via @google/generative-ai
Model: gemini-1.5-flash
Input: base64 image + structured prompt with region/month/plant context
Output: JSON diagnosis { condition, confidence, severity, treatment_steps, urgency }
```
Max 10 calls/user/day enforced via `doctor_logs` count check.

---

## Gemini Plant Doctor Prompt

```
System: "You are a plant disease and pest diagnostic expert specializing in tropical
Thailand conditions. Always respond in valid JSON only."

User (with image):
"Diagnose this plant. Context:
- Plant: {name or 'unknown'}
- Region: {region} Thailand
- Month: {monthName}
- PM2.5: {value or 'N/A'}

Respond ONLY with:
{
  \"condition\": \"short name\",
  \"confidence\": \"high|medium|low\",
  \"severity\": \"none|mild|moderate|severe\",
  \"symptoms_observed\": [\"...\"],
  \"likely_cause\": \"one paragraph\",
  \"treatment_steps\": [{\"step\": 1, \"action\": \"...\", \"thai_availability\": \"easily found|specialty|online\"}],
  \"prevention\": \"one sentence\",
  \"seasonal_note\": \"Thailand-specific note or null\",
  \"urgency\": \"monitor|act_this_week|act_today|emergency\"
}"
```

---

## Data Flow: Location → Care Recommendations

```
1. GPS → profiles (lat/lng/region)
2. /api/weather → Open-Meteo (30min cache)
3. SunCalc (browser) → sun position + balcony exposure by orientation
4. /api/airquality → OpenAQ PM2.5 (6hr cache, north region only)
5. lib/microclimatEngine.ts → MicroclimateSummary {
     uvPeakWindow, directSunHours, windExposureLevel,
     smokePm25, monsoonActive,
     careModifiers: { wateringMultiplier, fertilizerHold, shadeRecommended }
   }
6. CareGuide component → care steps + pest calendar for this month/region
```

---

## Photo Storage (Supabase Storage)

**Bucket:** `plant-photos`
**Path:** `{userId}/{plantId}/{timestamp}-{random}.jpg`
**Doctor images:** `{userId}/doctor/{timestamp}-{random}.jpg`
**Compression:** client-side canvas, max 1200px, quality 0.82 → ~150–300KB/photo
**Quota warning:** show in-app alert at 60% of 1GB

RLS: users can only read/write/delete their own folder (first path segment = `auth.uid()`).

---

## Build Order

1. **Foundation** — Supabase schema migrations, auth flow, profiles + location onboarding, bottom nav
2. **Plant collection core** — types, `/plants` list, `/plants/new` (with Pl@ntNet ID), plant detail page
3. **Photo journal** — `compressImage()`, upload hook, journal page, plant doctor (Gemini)
4. **Microclimate** — weather API, SunCalc wrappers, microclimate engine, monsoon + pest calendars
5. **Garden map** — SVG drag-drop canvas, container CRUD, plant tokens, zone overlays
6. **Hydroponics** — system tracking, pH log, nutrient schedule
7. **Stretch** — Three.js 3D garden view (`next/dynamic`, `ssr: false`)

---

## Design System

**Feel:** Bangkok rooftop at 7am — damp, lush, botanical field notebook. NOT a SaaS dashboard.

### OKLCH Color Palette
```css
--background:      oklch(0.96 0.018 135);   /* warm sage white */
--foreground:      oklch(0.15 0.025 140);   /* deep botanical green-black */
--primary:         oklch(0.38 0.12 145);    /* deep malachite green */
--secondary:       oklch(0.88 0.04 80);     /* warm peat/terracotta */
--accent:          oklch(0.72 0.14 80);     /* golden amber — new leaf */
--muted:           oklch(0.91 0.015 140);
--destructive:     oklch(0.52 0.21 25);     /* coral-red — disease alerts */
--radius: 0.875rem;
```

### Typography
- **Lora** (serif) — headings, plant names, section titles
- **Inter** — body text, labels, data

### Rules
- No hard rectangular cards — `border-radius: 1.25rem` minimum
- Photos fill card width — never thumbnails
- 48×48px minimum tap targets
- Bottom nav: 64px + safe area
- `max-w-lg mx-auto` on all content
- Skeleton loading shimmer, not spinners

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # server only
GEMINI_API_KEY=               # server only
PERENUAL_API_KEY=             # server only
PLANTNET_API_KEY=             # server only
# Open-Meteo and OpenAQ need no keys
```

---

## Free Tier Budget

| Service | Limit | Safe at |
|---|---|---|
| Supabase DB | 500MB | ~50MB for 1K users |
| Supabase Storage | 1GB | ~300MB for 200 users × 50 photos |
| Open-Meteo | 10K req/day | 30min cache = ~200/day |
| Perenual | 100 req/day | localStorage cache |
| Pl@ntNet | 500 req/day | One per new plant |
| Gemini 1.5 Flash | 1,500 req/day | 10/user/day limit |
| Vercel | 100GB-hr/month | Lightweight proxies |
