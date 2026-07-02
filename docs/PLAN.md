# Build Plan — chunked & resumable

This is the **live status board**. Every chunk is one commit (or a small series)
and leaves the repo in a working state, so any session can stop and the next
one can resume. **Update the checkboxes in the same commit as the work.**

How to resume a session:
1. `git log --oneline -5` to see the last completed chunk.
2. Find the first unchecked box below; read its "Definition of done".
3. `npm install && npm test && npm run validate:content` to confirm a clean base.

---

## Phase P0 — Foundation

- [x] **A. Design docs** — `docs/design/gdd.json` (machine-readable source of
  truth), `docs/GDD.md`, `docs/ARCHITECTURE.md`, this plan, root `CLAUDE.md`.
  *Done when: a fresh model can describe the game and its contracts from docs alone.*

- [x] **B. Scaffold + content system** — Vite/React/TS app boots; `src/content/`
  manifests (13 module kinds × sizes, 5 themes, 5 environments);
  `scripts/validate-content.mjs` passes; `core/types.ts` + `core/catalog.ts`.
  *Done when: `npm run dev` shows a page, `npm run validate:content` exits 0.*

- [x] **C. Core engine** — `core/grid.ts` (bounds/overlap/adjacency),
  `core/store.ts`, `core/actions.ts` (place/move/remove/clear/setEnvironment),
  `core/undo.ts`, `persistence/save.ts` (autosave + export/import). Vitest
  coverage for all placement math and save round-trips.
  *Done when: `npm test` passes with meaningful core tests.*

- [x] **D. Rendering** — `render/renderer.ts` (rAF + dirty flag, draw order per
  ARCHITECTURE.md), `render/camera.ts`, `render/sprites.ts` (manifest-first,
  procedural fallback, cache), `render/procedural/` (theme palettes + furniture
  painters for all 13 kinds), `render/environment.ts` (5 environments: sky,
  weather, surface structure, dirt), connection seams, label overlay.
  *Done when: a hardcoded demo base renders correctly with pan/zoom.*

- [x] **E. UI + interaction** — sidebar catalog (thumbnails from sprite
  pipeline, search/filter/sort, theme selector), pointer-event drag-to-place
  with ghost validity tint, move/select/delete, environment picker (start
  screen + switcher), top bar (name, overlay toggle, undo/redo, export/import,
  clear). Works with touch.
  *Done when: the full core loop from GDD.md is playable on desktop and tablet.*

- [x] **F. Polish pass** — empty-state hints ("drag a room into the dirt!"),
  keyboard shortcuts (Delete, Ctrl+Z/Y), favicon/title, README with screenshots,
  `npm run build` clean. *(Verified end-to-end in Chromium via Playwright:
  environment pick → drag-place → overlap/sky rejection → theme switch →
  labels → delete/undo → zoom/pan → autosave survives reload.)*

- [x] **F2. Feedback round 1** — default zoom 1.5 (cell ≈ 96px ≈ 1"), quiet
  arched door/ladder seams, sidebar collapsed to one card per kind with size
  chips, selection inspector (restyle / resize-in-place / remove), vibes pass:
  animated weather + cached static environment, placement pop, dirt easter
  eggs (gems/bones/worms), UI glow-up + wordmark. Verified in Chromium.

- [x] **F3. Feedback round 2** — standardized size tiers (S 1×1 / M 2×1 /
  L 3×1 / XL 4×1, always visible as chips), per-card ◀ ▶ style flipper
  (replaces the global theme row; cards start on varied styles), 3 new tall
  kinds (greenhouse 2×2/3×2, library 2×2/3×2, rocket silo 2×3/3×3 rare) with
  painters, touch pass (all controls ≥42px, style dots 32px) + phone
  bottom-sheet catalog layout ≤760px. Verified on 1280×800 and 390×844.

## Phase P1 — Catalog explosion *(future sessions)*

- [ ] G. 15+ more module kinds (gym, pool, aquarium, armory, library, kennel,
  rocket silo, greenhouse, server room, escape tube, ...).
- [ ] H. Decorations/props layer (posters, plants, rugs) placed ON modules.
- [ ] I. More environments (treehouse, city rooftop, island volcano) + art
  scan script that auto-regenerates `art-manifest.json`.

## Phase P2 — Final art

- [ ] J. Replace placeholders per-module via `public/art/` pipeline.
- [ ] K. `frames[]` animation support in sprite cache + renderer.

## Phase P3 — Life

- [ ] L. Characters walking the connection graph between rooms.
- [ ] M. Ambient animation (screens flicker, weather motion), day/night.

---

**Conventions for whoever picks this up:**
- Branch: `claude/secret-base-builder-2veuqh`. Commit per chunk, message
  `Chunk X: <summary>`.
- Respect the layering rule in ARCHITECTURE.md (`core` is DOM-free).
- Content ids are public/stable once committed — never rename, only add.
- After content edits run `npm run validate:content`; after core edits run
  `npm test`.
