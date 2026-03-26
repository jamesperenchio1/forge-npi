---
name: content-script
description: Trigger when generating video scripts for a shipped or near-shipped product. Spawns Content Goblin agent.
metadata:
  author: forge-npi
  version: "1.0"
---

# Content Script Skill

## When to Use
Trigger when:
- A product has been built and is ready to ship
- Director wants a video script for TikTok/Reels content
- Creating content assets alongside a build

## Spawn Content Goblin (if not active)
Create `.claude/agents/content-goblin.md` if it doesn't exist. Add to roster + comms.

## The Character
The Gen Z kid. Chronically online. Obnoxiously enthusiastic about the most niche things. Tone-deaf in a charming way. The main character in every video. Their energy is: Supreme drop urgency + Eric Andre chaos + rural Thailand setting.

The humor is the CONTRAST: hyper-online character using a niche utility product in a rural, unglamorous setting. Don't explain the joke.

## Script Structure
```markdown
## [PRODUCT NAME] — Video #[N]

**HOOK** (0-2s): [Must stop the scroll. Unhinged. No context. Confusing in the best way.]

**SETUP** (2-8s): [The problem, stated as if it's a crisis. Dramatic.]

**REVEAL** (8-20s): [Show the product. Screen recording + voiceover. Fast cuts.]

**PAYOFF** (20-35s): [Why it matters, delivered with the energy of announcing your own wedding]

**CTA** (35-40s): [Link in bio. Nothing more. They know what to do.]

**SETTING**: Rural Thailand — [specific: rice field, concrete porch, beside a motor scooter, etc.]
**FILMING STYLE**: voiceover + screen recording | POV | hands-only demo | text-on-screen (no face)
**CAPTION**: [Platform-specific. Short. Contains the bit.]
**SOUNDS**: [Trending audio suggestion OR "original audio — The Director's unhinged narration"]
```

## Tone Rules
- Never explain the joke
- The product is the most important thing that has ever existed
- Rural Thailand setting is never commented on — it's just the world
- Gen Z references should be 2-3 generations deep (not surface level)
- Scripts should work WITHOUT showing a face — voiceover, hands, phone screen only

## Output Location
`content/[product-slug]/video-script.md`
Also create:
- `content/[product-slug]/hooks.md` — 10 hook variations
- `content/[product-slug]/shot-list.md` — what to film
- `content/[product-slug]/thumbnail-brief.md` — thumbnail concept

## Eval Queries (Should Trigger)
1. "Write the video script for the concrete mix calculator"
2. "Content Goblin, make a TikTok script"
3. "Create social content for this product"
4. "Write hooks for the launch post"
5. "Generate a shot list for filming"
6. "What would the Gen Z character say about this?"
7. "Create the thumbnail brief"
8. "Write the caption for Instagram"
9. "Script out the product reveal video"
10. "Content assets for shipping"

## Eval Queries (Should NOT Trigger)
1. "Start a research cycle"
2. "Validate this idea"
3. "Find free APIs"
4. "Build the frontend"
5. "Deploy to Vercel"
6. "What's in the backlog?"
7. "Run the 5-question gauntlet"
8. "What industries haven't we covered?"
9. "Merge the build branch"
10. "Show me validated ideas"
