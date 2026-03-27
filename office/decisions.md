# FORGE NPI — Decision Log

## 2026-03-26 — First Research Cycle Industry Pick

**Decision**: Construction → Hand-mixed concrete in rural Southeast Asia

**Reasoning**:
- Construction is massively underserved by tech at the small-contractor level
- Hand-mixing is the norm in rural Thailand/Philippines/Indonesia — no mixer trucks, no slump testing kits
- Humidity and ambient temperature dramatically affect water-cement ratio, but there's zero tooling for this
- Completely different from idea-forge's existing aquaculture/plant research (no overlap)
- High forum activity expected: construction Facebook groups in SEA are enormous and complaint-heavy
- Strong API potential: weather/humidity (OpenWeatherMap, Open-Meteo free), concrete mix calculators (math-based, no API needed)
- Clear weekly use case: every pour requires a recalculation

**Alternative considered**: Maritime (fishing vessel maintenance logs) — deprioritized for later cycle

**Next action**: Scout runs Gemini research, Director distills to brief, Validator runs gauntlet

## 2026-03-26 — GO on MixRight

**Decision**: Build MixRight — tropical SEA concrete mix assistant

**Validation result**: All 5 questions PASS
- Q1: Real problem — 10 independent sources, PH/TH/ID/MY, recurring theme in large communities
- Q2: No adequate solution — all existing apps are volume calculators, zero humidity/temp inputs
- Q3: Open-Meteo API confirmed free, no-key, endpoint verified, 10k req/day rate limit
- Q4: Niche confirmed — initial wedge: Filipino OFW self-builders (digitally savvy, construction-motivated)
- Q5: Daily use case — multiple pours per week per project, intra-day weather variance forces recalculation

**Next steps**: Architect + Dev Expert spawned, build/mixright branch, scaffold Next.js PWA
