# Architecture — MixRight

## Overview
A mobile-first PWA that calculates the correct water-cement ratio for hand-mixed concrete in tropical SEA, adjusted for today's actual humidity and temperature (pulled automatically from GPS + Open-Meteo). User inputs mix class, application type, sand type, and cement age. App outputs adjusted water quantity in liters, bucket/shovel counts by material, and a curing timeline calibrated for current conditions.

---

## Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | SSG + PWA support, Vercel-native |
| Components | shadcn/ui + Tailwind | Fast UI, fully customizable |
| State | React useState / useReducer | No persistence needed — each session is a fresh calculation |
| Data persistence | None (no Supabase) | Stateless tool, no user accounts, no history needed for MVP |
| Weather API | Open-Meteo (free, no key) | Temp + RH by GPS, 10k req/day |
| Geolocation | Browser Geolocation API | Native, no key, no cost |
| Offline | next-pwa service worker | Mix calculator + slump guide work offline; weather needs connection |
| Deployment | Vercel free tier | Zero config Next.js deploy |
| i18n | next-intl | Thai, Tagalog, Bahasa Indonesia, English |

**Monthly cost: $0**

---

## API Integrations
| API | Endpoint | Auth | Rate Limit | Used For |
|-----|----------|------|-----------|---------|
| Open-Meteo | `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m` | None | 10,000/day | Real-time temp (°C) + humidity (%) for water ratio adjustment |
| Browser Geolocation | `navigator.geolocation.getCurrentPosition()` | None (user permission) | Unlimited | GPS coords for weather lookup |

**No other external APIs needed.** Mix math is pure calculation.

---

## Data Flow
```
User opens app
  → Browser requests GPS coords (one-time permission prompt)
  → Coords sent to Open-Meteo → returns temp_2m + relative_humidity_2m
  → User selects: mix class, application, sand type, cement age
  → Calculator engine runs:
      base_wcr = MIX_CLASS_TABLE[mixClass]          // e.g. Class A = 0.45
      humidity_adj = getHumidityAdj(humidity)        // +/- adjustment from RH
      temp_adj = getTempAdj(temperature)             // +/- adjustment from temp
      sand_adj = getSandAdj(sandType)                // river vs crushed rock
      age_adj = getCementAgeAdj(cementAge)           // strength loss from storage
      final_wcr = base_wcr + humidity_adj + temp_adj + sand_adj
      waterLiters = final_wcr * cementKg             // per bag
  → Output: water per bag (L), total buckets by material, cure time estimate
```

---

## Component Tree
```
app/
├── layout.tsx              # Root layout, i18n provider, PWA manifest
├── page.tsx                # Home — language selector + start button
├── calculator/
│   └── page.tsx            # Main calculator flow
├── components/
│   ├── WeatherCard.tsx     # Shows current temp + humidity (auto-loaded)
│   ├── MixSelector.tsx     # Mix class + application type picker
│   ├── MaterialInputs.tsx  # Sand type + cement age inputs
│   ├── ResultsCard.tsx     # Water amount, bucket counts, cure time
│   ├── SlumpGuide.tsx      # Visual reference — "does your pile look like this?"
│   └── LanguageSwitcher.tsx
├── lib/
│   ├── mixCalculator.ts    # Core calculation engine
│   ├── weatherApi.ts       # Open-Meteo fetch + response parsing
│   └── constants.ts        # Mix class tables, adjustment coefficients
└── messages/               # i18n strings
    ├── en.json
    ├── th.json
    ├── tl.json             # Tagalog
    └── id.json             # Bahasa Indonesia
```

---

## State Management
Stateless by design. Each session = fresh calculation. State lives in React useState within the calculator page component. No auth, no database, no user accounts.

If user closes and reopens: they re-enter inputs. This is intentional — conditions change between pours, so stale saved values would be actively harmful.

---

## Offline Strategy
| Feature | Offline | Notes |
|---------|---------|-------|
| Mix calculator | ✅ Works | All math is local |
| Slump visual guide | ✅ Works | Static images, cached |
| Weather fetch | ❌ Requires connection | Shows "manual entry" fallback: user types in temp/humidity from phone's weather app |
| Language switching | ✅ Works | All strings cached |

---

## Feature List (Build Order)

### MVP (v1.0)
1. **Weather auto-fetch** — GPS + Open-Meteo, shows temp/humidity card
2. **Mix calculator core** — class selection, application type, adjusted water output
3. **Sand type input** — river vs. crushed rock adjustment
4. **Cement age input** — strength degradation adjustment
5. **Results card** — water in liters, bucket counts, cure time estimate
6. **Offline manual fallback** — type in temp/humidity if no connection
7. **4 languages** — EN, TH, TL, ID

### v1.1
8. **Slump visual guide** — photo reference grid ("your pile should look like image 3")
9. **Humidity curing tracker** — "check back in X days" push notification

### v2
10. **Pour history log** — localStorage save of past mixes with location tag
11. **Cement brand database** — local SEA brands mapped to realistic strength ratings

---

## Design Direction
NOT generic calculator UI. This is a field tool.

- Color palette: **deep orange + concrete gray + white** — reads in direct sunlight
- Typography: Large, bold — legible on dusty phone screens with dirty fingers
- Layout: Single-column, big tap targets (48px+), no tiny inputs
- Tone: Confident and direct, not chatbot-y. The app is a foreman.
- No decorative animations — this runs on mid-range Androids
