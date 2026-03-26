# /build

Start the build pipeline for the top validated idea.

## Usage
```
/build [optional: idea slug]
```
If no argument, picks the top item from `backlog/validated.jsonl`.

## What happens
1. Director picks the validated idea
2. Spawns Architect + Dev Expert if not active
3. Creates `build/[product-slug]` branch off `validate/[slug]`
4. Architect writes `products/[slug]/architecture.md`
5. Dev Expert scaffolds: `npx create-next-app@latest [slug] && shadcn init`
6. Feature branches for each component
7. Build → test → merge back to build branch
8. Content Goblin writes video script in parallel
9. Final Director review

## Stack
- Next.js (App Router)
- shadcn/ui (aggressive customization — no two products look the same)
- Tailwind CSS
- Supabase (free tier, only if data persistence needed)
- Vercel deployment target

## Rules
- Mobile-first always
- Real API calls — no mock data
- Working prototype first, pretty second
- Each feature = its own branch off `build/[slug]`

## Output
- `products/[product-slug]/` — full Next.js app
- `content/[product-slug]/video-script.md` — in parallel
- Git branch `build/[product-slug]`
