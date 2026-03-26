# /status

Show the office dashboard.

## What it displays
```
🏢 FORGE NPI — Office Status
════════════════════════════

ROSTER
  Active agents: [N]
  [agent name] — [role] — [current task or IDLE]

PIPELINE
  Research queue: [N industries in rotation]
  Backlog: [N] ideas total
    → [N] validated (ready to build)
    → [N] rejected
    → [N] shipped

CURRENT WORK
  Branch: [current git branch]
  Stage: [research | validate | build | content | ship]
  Topic: [current topic slug]

SHIPPED PRODUCTS
  [N] live products
  [list with Vercel URLs]

LAST 5 COMMS (from office/comms.jsonl)
  [timestamp] [from→to] [message]
```

## Usage
```
/status
```
No arguments needed.
