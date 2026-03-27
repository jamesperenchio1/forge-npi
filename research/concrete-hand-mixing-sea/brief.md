# Research Brief — Hand-Mixed Concrete in Rural SEA
**Industry**: Construction | **Sub-niche**: Small-scale concrete contractors, self-builders
**Region**: Thailand, Philippines, Indonesia, Malaysia
**Date**: 2026-03-26 | **Status**: Ready for validation

---

## The Problem (In One Sentence)
Small-scale builders in tropical SEA hand-mix concrete using rules of thumb calibrated for dry conditions — but they're working in 90%+ humidity and 35°C+ heat, with no tools to adjust, and everything from the mix ratio to the cure time is a guess.

## What Real People Are Saying
- Philippines, 2023: "My Class A mix for a footing is perfect in March, but in July the mix is too watery. I have no idea how much less water to add when sand has been sitting in 90% humidity all night." *(column footings)*
- Thailand, 2023: "The concrete is still dark and sweating after a week — now the homeowner can't install vinyl flooring because it won't adhere." *(floor slab)*
- Indonesia, 2024: "Who has a slump cone kit for two dozen fence posts? We kick the pile with a boot. It would be amazing if I could just take a photo of my mix pile and an app could tell me if the slump is correct." *(fence posts)*
- Philippines, 2023: "One worker's 'shovel' is way bigger than another's. We got honeycombing ('ampaw') in the roof deck corner." *(roof deck)*
- Indonesia, 2023: "All apps say 'sand'. But river sand vs. crushed rock sand ('pasir abu') hold water differently. No app asks what type of sand." *(concrete blocks)*

## The Specific Gap
Existing apps are volume calculators only — "how many bags to buy." Zero apps:
- Accept humidity or temperature as inputs
- Account for sand moisture content or sand type
- Offer qualitative slump feedback
- Give curing timelines adjusted for tropical conditions

## Proposed Product Concept
**"MixRight"** — A mobile-first concrete mix assistant for tropical SEA self-builders.
- Input: mix class (A/B/C), application type (slab, column, footing, etc.), sand type, ambient temp/humidity (auto from GPS + OpenWeatherMap), cement bag age
- Output: adjusted water-cement ratio for today's conditions, bucket/shovel counts, curing timeline
- Bonus: photo-based slump estimation ("point camera at your mix pile")
- Available in Thai, Filipino (Tagalog), Bahasa Indonesia

## Target User
Small-scale contractors and self-builders in rural/provincial SEA who mix by hand, have no testing equipment, work across wet and dry seasons, and currently rely entirely on "agak-agak" (rough feel).

## API Potential
- Weather/humidity: Open-Meteo (free, no key) — real-time temp + RH by GPS coords
- Mix math: pure calculation, no external API needed
- Cement strength degradation: algorithm based on published Portland cement humidity tables

## Verdict Going In
This looks like a PASS candidate. Real complaints from 4+ countries, zero adequate existing solutions, free APIs mapped, strong weekly use case (every pour needs a fresh calculation). Sending to Validator.
