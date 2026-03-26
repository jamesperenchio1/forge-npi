---
name: api-discovery
description: Trigger when hunting for free public APIs to power a validated product idea. Spawns API Hunter agent.
metadata:
  author: forge-npi
  version: "1.0"
---

# API Discovery Skill

## When to Use
Trigger when:
- A product idea has passed validation and needs API mapping
- Building a feature that requires external data
- Checking if a specific data type is available for free

## Primary Sources to Search
1. https://github.com/public-apis/public-apis — canonical list
2. RapidAPI free tier
3. any-api.com
4. free-apis.github.io
5. apilist.fun

## Spawn API Hunter (if not active)
Create `.claude/agents/api-hunter.md` if it doesn't exist. Add to roster + comms.

## Output Format
Write to `research/[slug]/apis.md`:
```markdown
# APIs for [Product Idea]

## Core APIs (Required)
### [API Name]
- Endpoint: https://...
- Auth: None | API Key (free) | OAuth
- Rate Limit: X requests/day
- Response: JSON | XML
- Reliability: [verified / unverified]
- Used for: [specific feature this powers]
- Notes: [anything weird about it]

## Supporting APIs (Nice to have)
[same format]

## Rejected APIs
- [API Name]: [reason rejected — rate limit too low, requires paid tier, unreliable, etc.]
```

## Rules
- No paid APIs. Free tier must cover our use case.
- Document rate limits — don't discover limits after building
- Test that the endpoint actually works before documenting
- Look for weird combinations — weather + astronomy + soil data + tide tables

## Eval Queries (Should Trigger)
1. "Find free APIs for concrete mix calculations"
2. "What weather APIs are free?"
3. "Are there free APIs for soil composition data?"
4. "Hunt for APIs that give us tidal data"
5. "What free APIs exist for agricultural data?"
6. "Find an API for [specific data type]"
7. "Map APIs to features for this product"
8. "API Hunter, find free endpoints for humidity data"
9. "Is there a free API for [thing]?"
10. "Search public-apis for marine data"

## Eval Queries (Should NOT Trigger)
1. "Start a research cycle"
2. "Validate this idea"
3. "Build the product"
4. "Write the video script"
5. "Deploy to Vercel"
6. "What's in the backlog?"
7. "Show me validated ideas"
8. "Run the 5-question gauntlet"
9. "What industries haven't we covered?"
10. "Merge the validate branch"
