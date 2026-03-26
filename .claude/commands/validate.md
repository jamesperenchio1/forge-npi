# /validate

Run the 5-question validation gauntlet on a research brief or backlog idea.

## Usage
```
/validate [optional: idea name or slug]
```
If no argument, validates the most recent research brief.

## What happens
1. Spawns Validator if not active
2. Creates `validate/[slug]` branch off `research/[slug]`
3. Runs all 5 questions — all must pass
4. Writes `research/[slug]/validation.md`
5. On PASS: appends to `backlog/validated.jsonl`, triggers API Hunter
6. On FAIL: appends to `backlog/rejected.jsonl` with reason
7. Logs verdict to `office/comms.jsonl` and `office/decisions.md`

## Output
- `research/[slug]/validation.md`
- Updated `backlog/validated.jsonl` or `backlog/rejected.jsonl`
- Entry in `office/comms.jsonl`
