---
name: npi-research
description: Trigger when starting a new research cycle for an unexplored industry niche. Use to structure the research phase of the pipeline.
metadata:
  author: forge-npi
  version: "1.0"
---

# NPI Research Skill

## When to Use
Trigger this skill when:
- Starting a new research cycle for an industry not yet in backlog/ideas.jsonl
- The Director has picked an industry + sub-niche and needs to deploy the Scout
- You need to structure a Gemini research prompt for maximum specificity

## Workflow

### Step 1: Check backlog
Read `backlog/ideas.jsonl` — confirm this niche hasn't been researched before.

### Step 2: Create branch and directories
```bash
git checkout main
git checkout -b research/[topic-slug]
mkdir -p research/[topic-slug]/raw
```

### Step 3: Spawn Scout (if not active)
Create `.claude/agents/scout.md` if it doesn't exist. Add to roster.

### Step 4: Director writes Gemini prompt
Structure it as:
```
"Search Reddit, forums, Facebook groups, and complaint sites for people in [SPECIFIC NICHE]
who are frustrated about [SPECIFIC THING]. Real posts only — no hypotheticals.
I want verbatim quotes from people saying 'I wish someone would...' or 'why isn't there a...'
Focus on [REGION/CONTEXT]. Find the 10 most specific, weird, underserved complaints.
Include source URLs. Skip anything with a good existing solution."
```

### Step 5: Execute and dump
```bash
gemini -p "$(cat <<'PROMPT'
[INSERT DIRECTOR'S PROMPT]
PROMPT
)" > research/[slug]/raw/gemini-output.md
```

### Step 6: Distill
Director reads raw output, writes `research/[slug]/brief.md` (500 words max).
DO NOT load the full raw output into Claude context.

### Step 7: Log
Append to `office/comms.jsonl`:
```json
{"from": "scout", "to": "director", "type": "update", "message": "Research complete for [slug]", "timestamp": "[ISO8601]"}
```

### Step 8: Hand off to Validator
If brief looks promising, trigger problem-validation skill.

## Eval Queries (Should Trigger)
1. "Start a research cycle for waste management"
2. "Research small-scale concrete contractors in Thailand"
3. "Find problems in the beekeeping industry in rural SEA"
4. "Scout new ideas in the maritime sector"
5. "What problems do small fish sauce producers have?"
6. "Research problems in the hand-weaving textile industry"
7. "Find underserved niches in Philippine aquaculture"
8. "Start researching problems in the gig economy for motorbike taxis"
9. "Research new industry for idea generation"
10. "Deploy scout for construction sub-niche"

## Eval Queries (Should NOT Trigger)
1. "Build the product now"
2. "Validate this idea" (use problem-validation skill instead)
3. "What APIs are available for weather data?" (use api-discovery)
4. "Write the video script for concrete-mix-calc"
5. "Deploy to Vercel"
6. "Show office status"
7. "Merge the research branch"
8. "What's in the backlog?"
9. "Summarize the validation report"
10. "Add a new feature to the product"
