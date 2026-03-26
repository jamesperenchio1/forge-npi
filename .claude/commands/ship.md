# /ship

Deploy a completed product and push everything to GitHub.

## Usage
```
/ship [optional: product slug]
```
If no argument, ships the most recently completed build.

## What happens
1. Director final review — does it work? Real APIs? Mobile-friendly?
2. Merge `build/[slug]` → `validate/[slug]` → `research/[slug]` → `main` (squash each)
3. Tag release on main: `v[product-n].0`
4. Deploy to Vercel: `vercel --prod` from `products/[slug]/`
5. Push to GitHub
6. Append to `backlog/shipped.jsonl`
7. Update `office/roster.md` and `CLAUDE.md` industry rotation
8. Log to `office/comms.jsonl`
9. Content Goblin finalizes video assets in `content/[slug]/`

## Pre-ship checklist
- [ ] Real API calls working (not mocked)
- [ ] Mobile layout tested
- [ ] Loads in < 3s on mobile
- [ ] Vercel env vars set
- [ ] README.md complete in products/[slug]/
- [ ] Video script written

## Output
- Live Vercel URL
- GitHub commit tagged
- Updated `backlog/shipped.jsonl`
- Final `content/[slug]/` assets
