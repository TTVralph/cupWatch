# CupWatch

CupWatch is a mobile-first World Cup 2026 companion site built to answer matchday questions quickly without login walls, betting prompts, autoplay videos, or cluttered feeds.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Vercel-ready deployment defaults

## Pages

- **Today** — live, upcoming, and finished match cards with status, teams, score/time, venue, and group/round.
- **Standings** — mock group tables with played, wins, draws, losses, goal difference, and points.
- **Bracket** — knockout placeholders for Round of 32 through the Final.
- **News** — clean headline cards with source, time, and short summaries.

## Data layer

UI pages use `getCupWatchDataService()` from `src/services/data-service.ts`. The current implementation returns mock data, while internal API routes under `src/app/api/*` expose the same service boundary for future ESPN-backed implementations.

## Development

```bash
npm install
npm run dev
```

```bash
npm run typecheck
npm run build
```
