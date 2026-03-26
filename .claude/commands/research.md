# /research

Trigger a new research cycle for an unexplored industry niche.

## Usage
```
/research [optional: industry or niche hint]
```

## What happens
1. Director checks `backlog/ideas.jsonl` and `CLAUDE.md` industry rotation tracker
2. Picks an unexplored industry + specific sub-niche
3. Creates `research/[slug]/` branch and directories
4. Spawns Scout if not active
5. Director writes the Gemini prompt (specific, opinionated, not generic)
6. Runs Gemini CLI, dumps to `research/[slug]/raw/`
7. Director distills to `brief.md` (500 words max)
8. Logs to `office/comms.jsonl`
9. Prompts Director to run `/validate` when brief looks promising

## Output
- `research/[slug]/raw/gemini-output.md`
- `research/[slug]/brief.md`
- Entry in `office/comms.jsonl`
- Git branch `research/[slug]`
