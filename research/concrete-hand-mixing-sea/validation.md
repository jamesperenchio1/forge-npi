# Validation Report — MixRight (Hand-Mixed Concrete Assistant)
**Slug**: concrete-hand-mixing-sea
**Date**: 2026-03-26
**Validator**: Validator Agent

---

## Verdict: ✅ PASS — BUILD THIS

All 5 questions passed. No caveats. Strong green light.

---

### Q1 — Actually a problem? ✅ PASS

**Finding**: Problem is real, regional, and technically validated.

Communities confirmed active: r/Thailand, r/Philippines, Kaskus (ID, millions of daily users), Pantip (TH), Skyscrapercity (SEA construction sections), numerous country-specific FB groups (tens of thousands of members each).

Complaints are not isolated — honeycombing ("ampaw"), sweating slabs, rainy-season mix failures, and "agak-agak" (rough feel) quality checks are *recurring themes* across years of discussion in all four countries.

**Technical confirmation**: ACI and Cement & Concrete Institute guidelines explicitly state ambient temperature and relative humidity are critical for curing time and final strength. The complaints map directly to predictable consequences of ignoring these variables. This is not user error — it's an engineering reality being handled with zero tooling.

**Sources**: 10 independent complaint quotes across PH, TH, ID, MY from 2022-2024 (see raw/gemini-output.md)

---

### Q2 — Existing adequate solution? ✅ PASS (no solution exists)

**Finding**: The market is almost entirely unaddressed.

Top 20 apps on Play Store + App Store reviewed. All are volume calculators ("how many bags to buy"). Not a single app with significant downloads:
- Accepts humidity or temperature as inputs
- Adjusts water-cement ratio for environmental conditions
- Provides slump guidance (visual or otherwise)
- Gives tropical curing timelines

The biggest players ("Concrete Calculator," "Cement Mix Calculator") have 1M+ downloads but are pure material quantity tools. MixRight's core differentiator — environmental adjustment — does not exist anywhere in the market.

---

### Q3 — Free APIs available? ✅ PASS

**Core API**: Open-Meteo (open-meteo.com)
- Endpoint: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m`
- Auth: None required (no API key)
- Rate limit: 10,000 requests/day per IP — not a bottleneck
- Response: Clean JSON, `current.temperature_2m` (°C) + `current.relative_humidity_2m` (%)

**Mix math**: Pure calculation — no external API needed. Water-cement ratio adjustment for humidity is based on published Portland cement tables, implementable as a local algorithm.

**Cement degradation**: Algorithm based on published strength loss tables (no API needed).

**Verdict**: Entire product buildable with one free API + local math. Zero API cost.

---

### Q4 — Niche enough? ✅ PASS

**Target**: Small-scale contractors + self-builders in rural/provincial SEA who hand-mix, have no testing equipment, work across wet/dry seasons.

This is behavioral + geographic + situational targeting — not just demographic. The "5-10M addressable users" number is multi-layered:
`(small-scale builders) AND (tropical SEA) AND (hand-mixing) AND (no testing equipment)`

**Recommended initial sub-segment**: Filipino OFW (Overseas Filipino Worker) self-builders — digitally savvy, actively managing home construction remotely, concentrated in online communities, highly motivated to ensure quality. Ideal for early-adopter wedge.

Not too broad. Niche approved.

---

### Q5 — Weekly return use case? ✅ PASS

**Finding**: This is a *daily use* tool during active projects, not a one-off calculator.

- A single small building project involves multiple pours over weeks: foundations, columns, slabs, beams
- Tropical SEA weather changes intra-day (dry morning → humid afternoon) — mix calculated at 8am may be wrong by 3pm
- Realistic cadence for active contractor: several times per week, multiple times per pour day
- It becomes a core workflow tool (like a tape measure) not a project estimator

Usage cadence is tightly coupled to construction schedules — natural re-engagement built in.

---

## Product Snapshot

**Name**: MixRight
**Tagline**: The concrete mix calculator that actually knows it's raining.

**Core Flow**:
1. User opens app, GPS auto-detects location
2. Open-Meteo pulls current temp + humidity (no login, no key)
3. User selects: mix class (A/B/C), application (slab/column/footing/wall), sand type (river/crushed), cement bag age
4. App outputs: adjusted water amount (liters), bucket/shovel counts for today's conditions, estimated cure time for current humidity
5. Optional: photo slump guide ("does your pile look like this?")

**Languages**: Thai, Tagalog, Bahasa Indonesia, English
**Platform**: Mobile-first PWA (works offline after first load)
**Cost to operate**: $0/month

---

## Next Steps
1. Append to `backlog/validated.jsonl`
2. Spawn API Hunter to fully document Open-Meteo response schema
3. Spawn Architect to design the system
4. Spawn Dev Expert to scaffold the build
5. Branch: `build/mixright`
