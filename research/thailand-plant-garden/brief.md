# Research Brief: Thailand Plant Garden App
**Date:** 2026-03-31 | **Word count:** ~480

---

## The Niche

Serious plant enthusiasts in urban Thailand — Bangkok balcony/rooftop growers, Chiang Mai cool-season growers, and Thai aroid collectors who participate in a globally-networked collector community. Not casual gardeners. Not commercial farmers. The person who has 1,000+ plants on their 5th-floor balcony and photographs every new leaf unfurl on their variegated Monstera.

---

## The Problem

Thailand's climate is brutal and location-specific in ways no existing app accounts for:

- **Bangkok**: 40°C+ heat in dry season, dark pots cook roots, monsoon flooding (Sept–Oct), clay soils, high-rise wind tunnels, UV so intense it scorches seedlings before 10am
- **Chiang Mai**: Burning season Feb–Apr (PM2.5 at 15x WHO limits), cooler winter windows for crops that Bangkok can't grow
- **Coastal**: Salt spray kills edibles; totally different species selection required

Every existing plant app (Planta, Gardenize, Greg, PictureThis) gives the same temperate-zone advice — and it's wrong here. High nitrogen fertilizer stunts tropical plants. Generic watering schedules don't account for monsoon. No app has Thai herbs with Thai names, aroids with Thai provenance, or Thailand's seasonal pest calendar (mealybug peaks in dry season, fungus gnats explode in monsoon).

Real users give up. Quote: *"The urban environment is not really appropriate for growing vegetables — many people give up due to difficulties and lack of proper methods."*

---

## The User

Thai collector who:
- Tracks individual plant specimens, not species (each cutting has a history)
- Photographs every new leaf for variegation progression
- Manages collections across containers with compartments (one pot = multiple zones)
- Runs DIY hydroponics (Kratky, NFT, DWC) with no digital tracking tool
- Lives in a high-rise balcony or rooftop, cares intensely about microclimate
- Wants to know: will this corner of my balcony kill my Anthurium in March?

---

## The Opportunity

No purpose-built tool exists for this person. The closest is Gardenize (generic, not tropical) or Agrio (commercial agriculture). The entire Thai collector + hobbyist community manages their collections on Facebook and Line. The gap is real, documented, and unserved.

---

## Feature Set (from user + research)

1. **Location-aware microclimate** — sun path, UV peak hours, monsoon calendar, smoke season alerts (Chiang Mai), wind exposure by floor/orientation, house shadow modeling
2. **Interactive garden map** — drag-and-drop layout, pot compartmentalization (VM-style zones inside one container), labeling
3. **Plant timeline + care guide** — step-by-step from seed/cutting to harvest; Thailand-specific seasonal triggers
4. **Photo journal** — timestamped uploads, comments, growth log per individual plant
5. **Plant doctor** — pest/disease ID from photo, with Thai seasonal pest calendar
6. **Hydroponics + growing system support** — Kratky, NFT, DWC, soil; nutrient tracking
7. **Sun/shadow modeling** — orientations relative to user's space, Open-Meteo solar radiation data
8. **(Stretch) 3D garden view** — Three.js-based, persistent layout memory

---

## Free APIs Confirmed

- **Open-Meteo** — no key, solar radiation + UV + wind + historical 80yr, lat/lon global
- **Perenual** — plant DB with care data, free tier
- **SunCalc** — sun path / azimuth / elevation by coordinate

---

## Verdict

Strong signal. No competition in this exact niche. Real complaints, real users, real gap. Proceed to validate.
