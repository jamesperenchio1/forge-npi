# Validation Report: GreenDeck (thailand-plant-garden)
**Date:** 2026-03-31 | **Validator:** Problem Validator
**Branch:** validate/thailand-plant-garden

---

## Gauntlet Results: PASS ✓

All 5 questions cleared. Verdict at bottom.

---

## Q1 — Is this actually a problem? (3+ independent real sources)

**PASS**

Independent sources with specific, non-generic complaints:

1. **CityFarmer / Bangkok City Farm** (institutional, NGO-backed)
   > "The urban environment is not really appropriate for growing vegetables — many people give up due to many difficulties and lack of proper methods."
   Documented multiple Bangkok urban growers failing due to lack of local guidance.

2. **Tropical Hydroponics Thailand blog** (first-person practitioner)
   > "Could not find quality net cups locally." / "The burning noonday sun would quickly turn an unvented plastic covered High Tunnel into an oven during the dry season."
   First-person grower logging real equipment and climate failures specific to Thailand.

3. **Thai Garden Design blog** (professional Thai landscapers serving Bangkok clients)
   > Nitrogen overapplication from temperate-zone advice stunts tropical plants. Organic manure degrades too fast in heat. Clients "often a little confused" about tropical strategy.
   Professional practitioners documenting systematic knowledge gap.

4. **HortiDaily Thailand hydroponics report** (industry analyst)
   > "Technical level of Thai horticulture is very low and not well developed." 40% of home systems built from low-tech blue plastic pipework and cheap foam.
   Industry-level confirmation of tool and knowledge vacuum.

5. **Bangkok Post mealybug coverage** (national newspaper)
   Mealybug outbreak killed 50-year-old trees in Bangkok and spread across 700+ sq mi. No early warning or seasonal alert system exists for home gardeners.

**Verdict Q1: PASS** — 5 independent sources, specific complaints, not vibes.

---

## Q2 — Is anyone solving it well?

**PASS**

Competitive landscape audited across 8 apps:

| App | Why it fails for this user |
|---|---|
| Planta | No Thai plant DB; temperate watering logic; no monsoon/UV awareness |
| Gardenize | 45k plants but zero Thai herbs (Thai names), zero aroids; no SEA localization |
| Greg | Location-personalized but stops at lat/lon timezone; no monsoon calendar, no smoke season |
| PictureThis | Great plant ID; care advice is generic USA/EU, actively wrong for tropicals |
| Plantix | Agricultural pest tool; built for commercial farmers, not balcony collectors |
| Agrio | Commercial agriculture only; satellite imagery for fields, not pots |
| iNaturalist | Nature ID, not plant care |
| LeafSnap | Manual reminders only, no schedule intelligence |

**No app has:**
- Thai plant names / Thai-language care data
- Monsoon-aware watering logic
- Smoke season alerts (Chiang Mai)
- Per-individual-plant tracking (collectors track cuttings, not species)
- Pot compartmentalization
- Hydroponics system tracking
- Thailand seasonal pest calendar

The Thai collector + hobbyist community has no purpose-built tool. They run on Facebook and Line.

**Verdict Q2: PASS** — nobody is solving this. Closest is Gardenize (generic) + Plantix (commercial farmers). Neither serves the identified user.

---

## Q3 — Can free APIs solve it? (map endpoints to features)

**PASS**

| Feature | API | Endpoint / Method | Cost |
|---|---|---|---|
| Sun path, UV peak hours | Open-Meteo | `hourly=uv_index,shortwave_radiation,direct_radiation` | Free, no key |
| Historical weather for seasonal calendar | Open-Meteo | `/v1/archive?latitude=...&start_date=...` | Free, no key |
| Wind data (balcony exposure) | Open-Meteo | `hourly=windspeed_10m,winddirection_10m` | Free, no key |
| Plant DB + care data | Perenual | `/api/species-list`, `/api/species/{id}` | Free tier (100 req/day) |
| Plant disease / pest ID | PictureThis (no public API) / Pl@ntNet | Pl@ntNet free API: `/v2/identify` | Free (500 req/day) |
| Sun azimuth/elevation for shadow modeling | SunCalc (JS library) | Browser-side calculation, no API call | Free, open source |
| Air quality (Chiang Mai smoke season) | OpenAQ | `/v3/locations`, `/v3/measurements` | Free, no key |
| Photo upload + storage | Supabase Storage | `supabase.storage.from('plants').upload()` | Free tier (1GB) |
| Persistent garden layout | Supabase DB | Standard Postgres rows | Free tier (500MB) |

**Key confirmations:**
- Open-Meteo: no API key, no rate limit cap for non-commercial, 80yr historical data for seasonal pattern modeling
- Supabase: free tier handles photo storage + persistent garden layouts + plant logs
- SunCalc: open-source JS library, runs entirely in browser, calculates sun azimuth + altitude for any lat/lon at any datetime

**Only gap:** No free AI-powered pest ID API with tropical species coverage. Mitigations: (1) Pl@ntNet free tier for plant ID; (2) rules-based seasonal pest alerts from Thailand pest calendar (hardcoded); (3) photo log with manual tagging. Full AI pest diagnosis is a paid-tier unlock later.

**Verdict Q3: PASS** — core features fully solvable with free APIs. Pest AI is a known limitation with clear workarounds.

---

## Q4 — Is it niche enough?

**PASS**

Initial wedge: **Bangkok balcony/rooftop aroid collectors + serious herb growers**

This is not "gardeners in Thailand" (too broad). It is:
- Urban, high-rise dwelling
- 50–1,000+ plant collections
- Tracking individual specimens (cuttings, propagations)
- Globally networked via BIEPS / collector Facebook groups
- Willing to spend time on plant care; tools that save effort have real value

**TAM sanity check:**
- Bangkok population: ~11M. Urban gardening interest: active Facebook groups in thousands of members. BIEPS attendance: international. Thai aroid export industry: globally recognized (Monstera Thai Constellation invented in Thailand).
- This is not "everyone." It's the person who already has 400 plants and needs to stop losing them to mealybugs in November.

**Expansion path exists** but isn't needed at launch: Chiang Mai cool-season growers → coastal gardens → SEA expat community → broader SEA tropics.

**Verdict Q4: PASS** — niche enough to build a tight wedge product, large enough collector community to get early traction.

---

## Q5 — Would someone open this URL weekly?

**PASS**

Behavioral evidence that this is habitual, not one-time:

- Serious collectors photograph **every new leaf** — this is weekly or more
- Watering schedules, fertilizer tracking, humidity monitoring — **daily to weekly** for serious growers
- Seasonal events (mealybug season approaching, monsoon starts, pre-monsoon heat spike) generate **recurring check-ins**
- Plant health logs, photo journals — collectors already do this manually; a tool makes it faster = higher retention
- Hydroponics: nutrient solution changes, pH checks, reservoir monitoring — **weekly at minimum**

The high-value user (aroid collector with 200+ plants) has legitimate daily use cases. The median user (20–50 plant balcony garden) has clear weekly use cases.

**Verdict Q5: PASS** — multiple independent recurring behaviors, not a one-time lookup tool.

---

## Final Verdict: PASS — GO ON BUILD

All 5 questions cleared. No kill conditions found.

**Product name:** GreenDeck
**Build brief:**
- Location-aware microclimate engine (Open-Meteo solar + UV + wind + AQI)
- Interactive garden map with pot compartmentalization and plant labeling
- Per-plant photo journal (timestamped, comments, growth log)
- Plant timeline + Thailand-specific care guide with seasonal triggers
- Pest doctor with Thailand seasonal calendar (rules-based, no AI cost)
- Hydroponics system support (Kratky, NFT, DWC, soil)
- Sun/shadow modeling per balcony/rooftop orientation (SunCalc)
- Stretch: 3D garden view (Three.js)

**Tech stack:** Next.js + shadcn/ui + Tailwind + Supabase + Vercel (standard)
**APIs:** Open-Meteo (no key), Perenual (free tier), Pl@ntNet (free tier), SunCalc (JS lib), OpenAQ (free), Supabase Storage

**Next step:** API Hunter maps all endpoints in detail → Architect designs system → Dev builds.
