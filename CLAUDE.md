# Secret Base Builder

2D side-cutaway secret-base sandbox for kids. Web app: Vite + TypeScript +
React (UI) + hand-rolled Canvas2D renderer (base view). No backend.

## Read these first, in order
1. `docs/design/gdd.json` — machine-readable design source of truth.
2. `docs/ARCHITECTURE.md` — layer contracts and directory map.
3. `docs/PLAN.md` — **live status board**; find the first unchecked chunk to
   know what to do next, and update it in the same commit as your work.

## Commands
- `npm run dev` — dev server
- `npm test` — vitest (core logic)
- `npm run validate:content` — validate `src/content/*.json` (run after any content edit)
- `npm run scan:art` — regenerate `art-manifest.json` from `public/art/modules/*.png`
- `npm run build` — typecheck + production build
- Perf: open the app with `?perf` — `window.__drawMs` (per-frame draw cost
  ring buffer) and `window.__spriteStats()` (sprite-cache canvas memory)

## Hard rules
- `src/core/` must stay DOM-free (pure logic; it's the tested layer).
- Content ids (`module kind ids, def ids, theme ids, environment ids,
  challenge ids`) are public and appear in players' save files: **never
  rename or delete, only add.**
- All sprite art is addressed by key `${kindId}_${w}x${h}_${themeId}`. Real
  PNGs in `public/art/modules/` (listed in `public/art/art-manifest.json`)
  override procedural placeholders. Never hardcode sprite pixel sizes —
  everything derives from `ART_CELL` (256px per grid cell; the environment
  layer is authored at 64px logical and upscaled — see render/environment.ts).
- Adding a module kind = edit `src/content/modules.json` + add a painter in
  `src/render/procedural/rooms{Home,Fun,Ops,Decor}.ts` (shared theme-aware
  props in `kit.ts`) + register it in `src/render/procedural/furniture.ts`.
  No engine changes. Themes are CONSTRUCTION, not tint — shells, flavor props,
  and key furniture all switch on the theme id. Kinds with `layer: "decor"`
  are 1×1 transparent props placed INSIDE rooms (see gdd.json → decorLayer).
- Save format is versioned (`persistence/save.ts`); bump + migrate, never break.
- Input is Pointer Events only (touch parity). No HTML5 drag-and-drop, no
  mouse-only events.

## Git
- Work on branch `claude/secret-base-builder-2veuqh`, commit per chunk
  (`Chunk X: <summary>`), push with `git push -u origin <branch>`.
