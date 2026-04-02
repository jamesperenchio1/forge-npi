# GreenDeck — Full Stack Refactor Plan
**Branch:** `refactor/greendeck-supabase-shadcn`  
**Executor:** Claude Opus  
**Goal:** Replace localStorage + custom CSS with Supabase (DB + Auth) + shadcn/ui everywhere. No half-measures — every page, every component.

---

## Stack After Refactor
| Layer | Before | After |
|-------|--------|-------|
| Persistence | `localStorage` | Supabase Postgres |
| Auth | None | Supabase Auth (email/password + magic link) |
| UI components | Mix of custom CSS + some shadcn | shadcn/ui exclusively |
| State | React useState + localStorage | React state + Supabase real-time |
| Styles | Some inline styles, hand-rolled toggles/tabs | Tailwind v4 + shadcn variants only |

---

## Phase 0 — Supabase Project Setup

### 0.1 Install dependencies
```bash
cd /home/james/forge-npi/products/greendeck
npm install @supabase/supabase-js @supabase/ssr
```

### 0.2 Environment variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<from Supabase dashboard>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
```
These are already in Vercel env — add them there too after setup.

### 0.3 Supabase client helpers
Create `src/lib/supabase/client.ts` (browser):
```typescript
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

Create `src/lib/supabase/server.ts` (server components/API routes):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}
```

Create `src/lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options)) } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return supabaseResponse
}
```

Create `src/middleware.ts`:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## Phase 1 — Database Schema

Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New query):

```sql
-- Enable RLS everywhere
-- Users are identified by auth.uid()

-- Plants collection
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collector_tag TEXT NOT NULL DEFAULT '',
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy','watch','sick','dormant')),
  growing_system TEXT NOT NULL DEFAULT 'soil' CHECK (growing_system IN ('soil','kratky','nft','dwc','semi_hydro')),
  stage TEXT NOT NULL DEFAULT 'seedling' CHECK (stage IN ('seed','seedling','juvenile','established','specimen')),
  notes TEXT,
  cover_emoji TEXT DEFAULT '🌿',
  main_photo_index INTEGER DEFAULT 0,
  watering_needs TEXT,
  sunlight_needs TEXT,
  care_level TEXT,
  description TEXT,
  gemini_details_fetched BOOLEAN DEFAULT FALSE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Photos per plant (replaces photos[] in LocalPlant)
CREATE TABLE plant_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,           -- base64 data URL or Supabase Storage URL (future)
  comment TEXT,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0
);

-- Care logs
CREATE TABLE care_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,          -- 'water','fertilize','repot','prune','observe','treat'
  note TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doctor diagnosis logs
CREATE TABLE doctor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  plant_name TEXT,
  condition TEXT,
  urgency TEXT,
  severity TEXT,
  confidence REAL,
  treatment JSONB,             -- { steps, products, thai_availability }
  resolved BOOLEAN DEFAULT FALSE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garden zones
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'oklch(0.7 0.15 145)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garden containers (pots)
CREATE TABLE containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT 'medium' CHECK (size IN ('small','medium','large','xl')),
  grid_w INTEGER DEFAULT 3,
  grid_h INTEGER DEFAULT 3,
  pos_x REAL DEFAULT 10,       -- % position on canvas
  pos_y REAL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Container sections (divisions within a pot)
CREATE TABLE container_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Main',
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0
);

-- Calendar events
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('water','fertilize','repot','prune','harvest','task','note')),
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hydroponics devices
CREATE TABLE hydro_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('pump','airstone','light','fan','heater','sensor','other')),
  watts REAL NOT NULL DEFAULT 0,
  hours_per_day REAL NOT NULL DEFAULT 24,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User preferences (electricity rate, location, etc.)
CREATE TABLE user_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  electricity_rate_thb REAL DEFAULT 4.15,
  location_lat REAL,
  location_lon REAL,
  location_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies (enable on all tables, users only see their own rows)
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydro_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prefs ENABLE ROW LEVEL SECURITY;

-- Helper: one policy per table (SELECT/INSERT/UPDATE/DELETE for own rows)
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY['plants','plant_photos','care_logs','doctor_logs','zones','containers','container_sections','calendar_events','hydro_devices','user_prefs'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    -- user_prefs uses user_id as PK
    IF tbl = 'user_prefs' THEN
      EXECUTE format('CREATE POLICY "%s_own" ON %s FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', tbl, tbl);
    ELSE
      EXECUTE format('CREATE POLICY "%s_own" ON %s FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', tbl, tbl);
    END IF;
  END LOOP;
END $$;
```

---

## Phase 2 — Auth Pages

### 2.1 Login page — `src/app/(auth)/login/page.tsx`
Replace the existing stub. Use shadcn `Card`, `Input`, `Button`, `Label`.  
Support: email + password sign-in, magic link option, link to sign-up.  
After login → redirect to `/dashboard`.

```typescript
// Key logic (not full file — write full component):
const supabase = createClient()
// Sign in with password:
await supabase.auth.signInWithPassword({ email, password })
// Magic link:
await supabase.auth.signInWithOtp({ email })
// Redirect to /dashboard on success
```

### 2.2 Sign-up page — `src/app/(auth)/signup/page.tsx`
Same UI style as login. Fields: email, password, confirm password.
After signup → show "Check your email to confirm" message.

### 2.3 Auth callback — `src/app/auth/callback/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
```

### 2.4 Sign-out button
Add to `src/app/(app)/layout.tsx` nav — a `Button` variant="ghost" that calls:
```typescript
await supabase.auth.signOut()
router.push('/login')
```

---

## Phase 3 — Page-by-Page Migration (localStorage → Supabase)

For each page, the pattern is:
1. Replace `useState + localStorage.getItem/setItem` with `useEffect → supabase.from(...).select()`
2. Replace mutations with `supabase.from(...).insert/update/delete()`
3. Add `user_id: user.id` to all inserts
4. Handle loading/error states with shadcn `Skeleton` or spinner

### 3.1 Plants list — `src/app/(app)/plants/page.tsx`
```typescript
// Load: 
const { data: plants } = await supabase.from('plants').select('*, plant_photos(*)').eq('user_id', user.id).order('added_at', { ascending: false })
// Each plant.plant_photos[plant.main_photo_index] is the main photo
```
- Show main photo as avatar (already planned in current fix)
- Filter chips stay the same, just filter client-side from loaded data

### 3.2 New plant — `src/app/(app)/plants/new/page.tsx`
```typescript
// Insert plant:
const { data: plant } = await supabase.from('plants').insert({ user_id, ...fields }).select().single()
// Insert photos:
await supabase.from('plant_photos').insert(photos.map((p, i) => ({ plant_id: plant.id, user_id, url: p.url, comment: p.comment, taken_at: p.timestamp, sort_order: i })))
```

### 3.3 Plant detail — `src/app/(app)/plants/[id]/page.tsx`
```typescript
// Load:
const { data: plant } = await supabase.from('plants').select('*, plant_photos(*), care_logs(*)').eq('id', id).single()
// Update:
await supabase.from('plants').update({ ...fields }).eq('id', id)
// Photos: insert/delete from plant_photos
// Care logs: insert into care_logs
```

### 3.4 Garden — `src/app/(app)/garden/page.tsx`
```typescript
// Load zones + containers + sections:
const { data: zones } = await supabase.from('zones').select('*').eq('user_id', user.id)
const { data: containers } = await supabase.from('containers').select('*, container_sections(*)').eq('user_id', user.id)
// Zone create: supabase.from('zones').insert(...)
// Container create: supabase.from('containers').insert(...)
// Section update: supabase.from('container_sections').upsert(...)
// Drag position: supabase.from('containers').update({ pos_x, pos_y }).eq('id', id)
```

### 3.5 Calendar — `src/app/(app)/calendar/page.tsx`
```typescript
// Load events:
const { data: events } = await supabase.from('calendar_events').select('*').eq('user_id', user.id)
// Create event: supabase.from('calendar_events').insert({ user_id, title, date, type, note })
// Delete event: supabase.from('calendar_events').delete().eq('id', id)
```

### 3.6 Doctor — `src/app/(app)/doctor/page.tsx`
```typescript
// Load logs:
const { data: logs } = await supabase.from('doctor_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false })
// Save diagnosis: supabase.from('doctor_logs').insert({ user_id, ...result })
// Resolve: supabase.from('doctor_logs').update({ resolved: true }).eq('id', id)
```

### 3.7 Hydroponics — `src/app/(app)/hydroponics/page.tsx`
```typescript
// Load devices + rate:
const { data: devices } = await supabase.from('hydro_devices').select('*').eq('user_id', user.id)
const { data: prefs } = await supabase.from('user_prefs').select('electricity_rate_thb').eq('user_id', user.id).single()
// Toggle: supabase.from('hydro_devices').update({ enabled: !device.enabled }).eq('id', id)
// Rate update: supabase.from('user_prefs').upsert({ user_id, electricity_rate_thb: rate })
```

### 3.8 Dashboard — `src/app/(app)/dashboard/page.tsx`
```typescript
// Load plant counts:
const { count: healthy } = await supabase.from('plants').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('health_status', 'healthy')
// Weather: unchanged (API route proxy)
```

### 3.9 Weather — `src/app/(app)/weather/page.tsx`
- No DB changes (weather is from Open-Meteo API)
- Remove localStorage weather cache → use React state cache (sessionStorage acceptable)
- User location preference → save to `user_prefs.location_*` in Supabase

---

## Phase 4 — shadcn/ui Audit (Replace Every Custom Element)

Go through every page and replace:

| Custom pattern | Replace with |
|---------------|-------------|
| `<button className="rounded-full w-10 h-6...">` toggle | `<Switch>` from `@/components/ui/switch` |
| `<button className="px-3 py-1.5 rounded-full...">` filter chips | `<Button variant="outline" size="sm">` or `<Badge>` |
| `<input className="rounded-xl border...">` | `<Input>` from `@/components/ui/input` |
| `<select className="...">` | `<Select>` from `@/components/ui/select` |
| `<textarea className="...">` | `<Textarea>` from `@/components/ui/textarea` |
| `<div className="rounded-2xl bg-card border...">` card | `<Card><CardContent>` from `@/components/ui/card` |
| Custom tab bars (zone tabs, calendar tabs) | `<Tabs><TabsList><TabsTrigger>` from `@/components/ui/tabs` |
| Custom dialog/sheet | `<Sheet>` or `<Dialog>` from shadcn (already partially done) |
| `<span className="text-xs px-2 py-0.5 rounded-full...">` | `<Badge variant="...">` |
| Loading skeleton divs with `animate-pulse` | `<Skeleton>` from `@/components/ui/skeleton` |

**Install missing shadcn components** (run these — they're not in `src/components/ui/` yet):
```bash
npx shadcn@latest add skeleton
npx shadcn@latest add tooltip
npx shadcn@latest add separator
npx shadcn@latest add avatar
npx shadcn@latest add accordion
```

**Use `Avatar` for plant photos:**
```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
// In plants list, plant detail, garden PlantIcon:
<Avatar>
  <AvatarImage src={mainPhoto?.url} />
  <AvatarFallback>{plant.cover_emoji ?? '🌿'}</AvatarFallback>
</Avatar>
```

---

## Phase 5 — Types Cleanup

Update `src/types/index.ts` to match Supabase row shapes (snake_case from DB, but keep camelCase in app):

```typescript
// Remove LocalPlant.photos: PhotoEntry[] — now separate table
// Add: plant_photos returned by join query
export type PlantRow = {
  id: string
  user_id: string
  collector_tag: string
  common_name: string
  scientific_name?: string
  health_status: 'healthy' | 'watch' | 'sick' | 'dormant'
  growing_system: 'soil' | 'kratky' | 'nft' | 'dwc' | 'semi_hydro'
  stage: 'seed' | 'seedling' | 'juvenile' | 'established' | 'specimen'
  notes?: string
  cover_emoji?: string
  main_photo_index: number
  watering_needs?: string
  sunlight_needs?: string
  care_level?: string
  description?: string
  gemini_details_fetched: boolean
  added_at: string
  plant_photos?: PhotoRow[]    // joined
  care_logs?: CareLogRow[]     // joined
}

export type PhotoRow = {
  id: string
  plant_id: string
  user_id: string
  url: string
  comment?: string
  taken_at: string
  sort_order: number
}

export type CareLogRow = { id: string; plant_id: string; user_id: string; type: string; note?: string; logged_at: string }
export type DoctorLogRow = { id: string; user_id: string; plant_id?: string; plant_name?: string; condition?: string; urgency?: string; severity?: string; confidence?: number; treatment?: object; resolved: boolean; logged_at: string }
export type ZoneRow = { id: string; user_id: string; name: string; color: string; created_at: string }
export type ContainerRow = { id: string; user_id: string; zone_id?: string; name: string; size: string; grid_w: number; grid_h: number; pos_x: number; pos_y: number; created_at: string; container_sections?: SectionRow[] }
export type SectionRow = { id: string; container_id: string; user_id: string; label: string; plant_id?: string; sort_order: number }
export type CalendarEventRow = { id: string; user_id: string; title: string; date: string; type: string; plant_id?: string; note?: string; created_at: string }
export type HydroDeviceRow = { id: string; user_id: string; name: string; category: string; watts: number; hours_per_day: number; enabled: boolean; created_at: string }
export type UserPrefsRow = { user_id: string; electricity_rate_thb: number; location_lat?: number; location_lon?: number; location_name?: string; updated_at: string }

// Keep PhotoEntry for backwards compat during migration
export type PhotoEntry = { url: string; timestamp: string; comment?: string }
```

---

## Phase 6 — API Routes Update

`src/app/api/plant-details/route.ts` — add user auth check:
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

`src/app/api/doctor/route.ts` — same auth check.

`src/app/api/weather/route.ts` — no change needed (public proxy).

---

## Phase 7 — Verification Checklist

After implementation, verify with Playwright MCP browser preview:

```
1. [ ] /login — email/password login works, redirects to /dashboard
2. [ ] /signup — creates account, sends confirmation email  
3. [ ] /dashboard — shows weather + plant counts from Supabase
4. [ ] /plants — shows all plants with photo avatars (not emoji)
5. [ ] /plants/new — saves plant + photos to Supabase (check DB)
6. [ ] /plants/[id] — loads from DB, care log saves to DB
7. [ ] /garden — zones + containers load from DB, drag persists
8. [ ] /calendar — events load from DB, create/delete works
9. [ ] /doctor — diagnosis saves to DB, history loads
10. [ ] /hydroponics — devices load from DB, toggle/edit persists
11. [ ] /weather — loads correctly, no localStorage dependency
12. [ ] Log out → redirected to /login, protected routes blocked
13. [ ] New incognito window → protected routes redirect to /login
```

Run tests:
```bash
npx tsc --noEmit         # 0 errors
npx vitest run           # all pass
npx playwright test      # all pass
```

---

## File Change Summary

| File | Action |
|------|--------|
| `src/lib/supabase/client.ts` | CREATE |
| `src/lib/supabase/server.ts` | CREATE |
| `src/lib/supabase/middleware.ts` | CREATE |
| `src/middleware.ts` | CREATE |
| `src/app/(auth)/login/page.tsx` | REWRITE |
| `src/app/(auth)/signup/page.tsx` | REWRITE |
| `src/app/auth/callback/route.ts` | CREATE |
| `src/app/(app)/layout.tsx` | ADD sign-out button, remove localStorage nav state |
| `src/app/(app)/dashboard/page.tsx` | Supabase plant counts, pest links, forecast link |
| `src/app/(app)/plants/page.tsx` | Supabase load, photo avatar, shadcn components |
| `src/app/(app)/plants/new/page.tsx` | Supabase insert, shadcn Input/Button/Label |
| `src/app/(app)/plants/[id]/page.tsx` | Supabase load/update, shadcn Avatar |
| `src/app/(app)/garden/page.tsx` | Supabase zones/containers, shadcn Tabs/Switch, bigger canvas |
| `src/app/(app)/calendar/page.tsx` | Supabase events, shadcn Tabs |
| `src/app/(app)/doctor/page.tsx` | Supabase logs, pest reference links |
| `src/app/(app)/weather/page.tsx` | Remove localStorage cache, import PEST_LINKS from lib |
| `src/app/(app)/hydroponics/page.tsx` | Supabase devices, shadcn Switch |
| `src/app/api/plant-details/route.ts` | Add auth check |
| `src/app/api/doctor/route.ts` | Add auth check |
| `src/lib/pest-calendar.ts` | Export PEST_LINKS |
| `src/types/index.ts` | Replace LocalPlant with Supabase row types |
| `.env.local` | ADD Supabase keys |

---

## Notes for Opus

- **Do not** use `localStorage` anywhere after this refactor. If you see `localStorage`, replace it.
- **Do not** write inline `style={{ ... }}` or custom CSS classes for UI elements that have a shadcn equivalent.
- Every `<button>` must be `<Button>` from shadcn. Every `<input>` must be `<Input>`. Every tab bar must be `<Tabs>`.
- All Supabase calls in `'use client'` components must use `createClient()` from `@/lib/supabase/client`
- All Supabase calls in Server Components, API routes, or middleware must use the server client from `@/lib/supabase/server`
- RLS is enabled — always pass `user_id` on insert, never query without user context
- The Supabase project needs to be created first (free tier at supabase.com) before env vars can be set
