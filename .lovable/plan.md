

## Issues & Fixes in `src/pages/Founders.tsx`

### 1. Highlight on "20 vagas" not visible
The current approach uses `backgroundImage` with a `linear-gradient` for the marker effect, but `AMBER_BG` is defined as `hsl(25, 95%, 53% / 0.1)` — only 10% opacity, nearly invisible. Fix: increase opacity to ~35% so the highlight strip is actually visible (e.g. `hsl(25, 95%, 53% / 0.35)`).

### 2. Balloon identical on mobile and desktop
Currently the balloon uses `-top-10 sm:-top-14` — different positioning per breakpoint. The balloon pill itself is small (`text-[0.7rem]`, `px-3 py-1`). In the desktop reference it looks bigger and rounder.

**Fix:** Remove responsive differences — use a single consistent style for both mobile and desktop:
- Increase pill size: `px-4 py-1.5`, `text-xs` instead of `text-[0.7rem]`
- Use consistent top offset: `-top-12` (no `sm:` variant)
- Keep `rounded-full` and existing gradient

Both changes are in a single file: `src/pages/Founders.tsx`.

