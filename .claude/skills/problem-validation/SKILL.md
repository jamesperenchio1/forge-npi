---
name: problem-validation
description: Trigger when validating a specific idea from the backlog against the 5-question gauntlet. Spawns Validator agent.
metadata:
  author: forge-npi
  version: "1.0"
---

# Problem Validation Skill

## When to Use
Trigger when:
- A research brief is complete and Director wants to validate an idea
- Manually validating a specific backlog item with `/validate`
- Before any build work begins — validation is mandatory

## Workflow

### Step 1: Spawn Validator (if not active)
Create `.claude/agents/validator.md` if it doesn't exist. Add to roster + comms.

### Step 2: Create validate branch
```bash
git checkout research/[topic-slug]
git checkout -b validate/[topic-slug]
```

### Step 3: Run the gauntlet
Answer all 5 questions using Gemini for additional targeted research if needed:
- Q1: Is this actually a problem? (3+ real sources)
- Q2: Existing adequate solution?
- Q3: Specific free APIs mapped to features?
- Q4: Niche enough target audience?
- Q5: Weekly return use case?

### Step 4: Write validation report
Output to `research/[slug]/validation.md`

### Step 5: Update backlog
**If PASS:**
```bash
echo '{"id": "[slug]", "idea": "...", "niche": "...", "timestamp": "[ISO8601]", "validation": "research/[slug]/validation.md"}' >> backlog/validated.jsonl
```

**If REJECT:**
```bash
echo '{"id": "[slug]", "idea": "...", "reason": "...", "failed_question": "Q[N]", "timestamp": "[ISO8601]"}' >> backlog/rejected.jsonl
```

### Step 6: Log decision
```json
{"from": "validator", "to": "director", "type": "decision", "message": "PASS/REJECT: [idea]. [One-line reason]", "timestamp": "..."}
```

### Step 7: If PASS, hand to Architect
Trigger api-discovery skill, then notify Director to start build cycle.

## Eval Queries (Should Trigger)
1. "Validate the concrete mix calculator idea"
2. "Run the 5-question gauntlet on this idea"
3. "Is this actually a real problem people have?"
4. "Check if there are existing solutions for [idea]"
5. "Does this idea pass validation?"
6. "Validate what's in the research brief"
7. "Should we build this or not?"
8. "Kill check on the backlog idea"
9. "Problem validation for fish disease tracker"
10. "Run validation before we start building"

## Eval Queries (Should NOT Trigger)
1. "Start a new research cycle"
2. "Find APIs for weather data"
3. "Write the video script"
4. "Build the product"
5. "Deploy to Vercel"
6. "Show me the backlog"
7. "What industries have we researched?"
8. "Merge validate branch to research"
9. "Generate 10 new product ideas"
10. "What's the office status?"
