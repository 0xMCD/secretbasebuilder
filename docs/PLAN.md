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

- [x] **F4. Feedback round 3** — size picker became a ◀ ▶ flipper matching the
  style flipper; default sort A→Z; card meta shows rarity only; **detail pass:
  ART_CELL 64 → 128** (real resolution, not zoom) with all 16 painters
  rewritten richer (shading, tiles/planks, glow halos, more props per room);
  environment stays 64px-logical upscaled 2× to cap memory; seams retuned.
  Verified in Chromium incl. closeup inspection.

- [x] **F5. Feedback round 4** — sidebar decluttered: both card pickers are now
  compact native dropdowns (style keeps its accent underline); Clear fixed with
  an in-app confirm dialog (`window.confirm` is silently blocked in sandboxed
  iframes like the hosted artifact!) that starts over fresh (wipes base +
  autosave, returns to environment picker; autosave is suspended while the
  start screen is up); vertical seams draw exactly ONE doorway at the seam's
  bottom-row floor line (upper-row portholes removed).

## Phase P1 — Catalog explosion

- [x] **G. 14 new rooms + Sports category** — football/soccer/basketball/
  baseball fields (with crowd bleachers), movie theater, indoor pool, lava
  room, trampoline park, nerf arena, food buffet, jungle gym, chill-out room,
  dining room, race car garage. 30 kinds → 67 defs → 335 sprite variants.
- [x] **H. Fidelity pass 2** — ART_CELL 128 → 256 (real resolution); painters
  reorganized into `procedural/kit.ts` (shared theme-aware props) +
  `rooms{Home,Fun,Ops}.ts` + `furniture.ts` registry; THEMES ARE CONSTRUCTION:
  per-theme shells (metal/stone/concrete/wallpaper/velvet), themeFlavor
  signature props, and theme-variant beds/couches/lamps. Default zoom
  ~120px/cell. Save verified end-to-end in-browser (autosave reload, export
  file contents, import restore).
- [x] **I. Public deployment** — GitHub Pages workflow
  (`.github/workflows/deploy-pages.yml`, deploys on push to main; assets are
  BASE_URL-relative so subpath hosting works). One-time: enable Pages
  (Settings → Pages → Source: GitHub Actions) and merge to main.
- [x] **P1.1 Playtest feedback round** — tablet fix: cards use touch-action
  pan-y (pan-x on phone) so list scrolling stays native and pointercancel
  aborts drags (also fixed a bug where pointercancel *placed* the module);
  📸 Photo export (PNG cropped to built area + title banner,
  `render/snapshot.ts`); stairs + ladder connector kinds; stacked vertical
  connectors (tagged "vertical") merge into one continuous shaft; 12 new
  rooms: vrroom, closet, gamingden, dinoexhibit, arcade, aquarium, gemmine,
  petstore, classroom, dojo, observatory, skatepark. 44 kinds → 95 defs →
  475 sprite variants.

- [x] **P1.2 Inhabitants + share codes + decorations** — ambient residents
  (`render/agents.ts`) walk floors, use doorways, climb shafts (spy suits on
  every third one); 🔗 Share compresses the save into the URL hash
  (`persistence/share.ts`, replace-confirm on open); decor layer: kinds with
  `layer:'decor'` are 1×1 transparent props placed INSIDE rooms (8 props:
  plant, trophy, banner, disco ball, sleeping dog, lava lamp, painting, robo
  buddy). 52 kinds → 103 defs → 515 sprite variants.
- [x] **P1.3 Playtest polish** — decor size variety (DECOR_META scale+anchor
  per prop); decor separated in the sidebar (always sorts last, divider +
  dashed green cards); stacked vertical connectors now truly merge (themed
  cover erases the shared floor band; ladder rungs/elevator cables continue
  through the joint — no more giant dark boxes); day/night cycle (120s, stars
  + moon at night, rooms stay warm and lit).
- [x] **K. More environments + art scan** — 3 new environments: Treehouse
  Hideaway (canopy cabin, rope ladder, tire swing), City Rooftop (night
  skyline with lit windows, water tower, stair shed), Island Volcano (lava
  drips, smoke, palm) — new `StructureKind`s `treehouse|skyline|volcano`,
  structures tuned to fit the default camera. `npm run scan:art`
  (`scripts/scan-art.mjs`) regenerates `art-manifest.json` from the PNGs in
  `public/art/modules/`, rejecting filenames that match no kind×size×theme.

## Phase P2 — Procedural art is final (playtest decision)

The playtest verdict: keep the procedural art. Phase P2 is now about pushing
it to final quality. The PNG-override pipeline (`scan:art`) stays supported
for one-off hero assets but is no longer the plan of record.

- [x] **P2.A Ambient animation** — `render/fx.ts`: painters emit FxHints
  while painting (through the ctx transform, so scaled decor props work);
  hints are cached with the sprite and replayed every frame, phase-offset per
  placement id. Auto coverage: every `halo()` breathes, every `wallScreen()`
  flickers + blinks its live dot, scoreboards blink. Hand-tuned: pool +
  aquarium water shimmer, swimming fish, rising bubbles (lava, lava lamp),
  lava heat-haze, claw-machine glass sparkle, disco-ball mirror + room-dot
  sparkles, robo-buddy antenna blink + face flicker. Verified 61fps.
- [x] **P2.B Big-room composition pass** — contact-sheet audit (Photo export
  of every big kind at max size) found tall rooms with dead upper halves and
  capped hero props. Fixed the heavy hitters: grandstand rebuild shared by
  all 4 sports fields (raised deck on columns, packed crowd, sponsor boards,
  bunting, scaled scoreboards); theater (movie composed to fill the screen,
  full-height curtains, seat rows that pack + scale); pool (high-dive tower,
  curved water slide, swim-meet bunting); garage (hydraulic lift w/ second
  car, pegboard wall, chain-hoist engine); race garage (bigger car, pit
  gantry w/ lights + air hoses, blinking timing board, tire wall); silo
  (warm-white hero rocket, second service arm + fuel line, blinking beacon,
  steam); lab (ceiling pipe run, hanging monitors, canister rack, live tank
  bubbles).
- [x] **P2.B2 Remaining-room densify** — gameroom (air-hockey table,
  high-score wall); trampoline park (chunky framed beds w/ springs, angled
  wall-trampoline, hanging rings, neon bounce sign, dive-worthy foam pit);
  junglegym (monkey bars across 72% w/ swing rings, cargo net, wider ball
  pit); skatepark (quarter-pipes scaled to room w/ deck rails, graffiti
  mural, fun box); dino exhibit (skeleton scaled to fill the hall + wired
  pterosaur overhead); vault (safe-deposit wall w/ one ajar glowing box,
  third laser + breathing-laser fx, blinking camera); observatory (telescope
  reaches the roof slit, dome ribs, comet, twinkling stars); gemmine
  (twinkling gem veins). Color policy codified in kit.ts: theme palette for
  construction/furniture, deliberate fixed hero colors stay.
- [x] **P2.C Per-placement variation** — sprite cache key gains a variant
  index (3 variants per def×theme); the variant seeds every rng roll during
  painting (shell stains, plank joints, shelf books, prop chances) so no
  painter changes were needed. A placement picks its variant by hashing its
  id — survives save/load for free; moved modules keep their variant; PNG
  overrides apply to all variants. Verified: adjacent identical libraries/
  bedrooms render visibly different (pixel-hash check).
- [x] **P2.E Performance pass** — measured first (Playwright probe + `?perf`
  query flag that records real draw() CPU cost on `window.__drawMs`, and
  `window.__spriteStats()` for canvas memory, which the JS heap hides).
  Findings on a 154-module stress base: draw cost was fine (2ms @ 60fps
  budget) but the sprite cache held 116MB of canvases, unbounded. Fixes:
  viewport culling (draw@default 2.0→0.9ms, and sprite generation became
  lazy — boot memory 116→59MB since offscreen rooms don't paint until
  scrolled into view); LRU byte budget (192MB) on the sprite cache so long
  restyling sessions can't grow without bound; environment world canvases
  (~20MB each) evict on switch instead of accumulating.
- [x] **P2.D Catalog & picker polish** — thumbnails render at 2× CSS size
  with progressive-halving downscale (area-average quality instead of
  nearest-neighbor mush); environment picker cards show a real rendered
  scene (structure + weather sample + dirt strip, cropped from the painters
  directly — the full world canvas is never materialized) instead of four
  color swatches.

## Phase P4 — Play value (toys, prompts, audiences — NO economy/resources)

- [x] **P4.0 Structural realism (prerequisite)** — stacked rooms do NOT
  connect vertically: no floor hatches between two regular rooms, and
  residents may only change floors through a vertical connector
  (elevator / stairs / ladder) touching both. Side-by-side doorways stay.
  (`VERTICAL_KINDS` moved to core/catalog; renderer + agent graph share it.)
- [x] **P4.1 Interactive props** — tap a room and it pokes back
  (`render/reactions.ts`, triggered from the tap-select path; one-shot
  world-space overlays, no state, no save impact): silo → test-fire
  (countdown strobes + 3-2-1 lamps, engine flame, billowing steam, TEST-OK
  confetti); disco ball → 8s dance party (orbiting color spots, flashing
  ball, and every resident bounces + waves via agents.startParty); aquarium
  → feeding time (flakes rain, fish dart up); trampoline → bounce show
  (flying balls, star pops at apex). `?perf` also exposes `__reactions`.
- [ ] **P4.2 Blueprint challenges** — a deck of optional prompt cards
  ("a spy needs: a bedroom next to a rocket silo and somewhere to swim");
  completion stamps a cosmetic badge. Pure placement-logic checks, no
  gates, no currency. `content/challenges.json` + save-format bump for
  completed-card stamps.
- [ ] **P4.3 Secret-base secrets** — bookcase-door connector (looks solid
  until a resident walks through), fireman pole, periscope room;
  excavatable dirt treasures that become museum displays; Base-o-pedia
  collection book.
- [ ] **P4.4 Resident life** — destination behaviors: sleep in beds at
  night, swim in pools, sit on couches, watch the theater screen, a pet
  that follows a resident around.
- [ ] **P4.5 Visitors & events** — inspector spy tours the base and leaves
  a silly report card; delivery drone drops a free decor prop; meteor
  shower at night; lost dog appears if you have a pet store.

## Phase P3 — Life

- [x] L. Characters walking between rooms — shipped as P1.2 inhabitants
  (walk floors, use doorways, climb shafts).
- [x] M. Ambient animation + day/night — day/night shipped in P1.3; ambient
  animation shipped as P2.A.

---

**Conventions for whoever picks this up:**
- Branch: `claude/secret-base-builder-2veuqh`. Commit per chunk, message
  `Chunk X: <summary>`.
- Respect the layering rule in ARCHITECTURE.md (`core` is DOM-free).
- Content ids are public/stable once committed — never rename, only add.
- After content edits run `npm run validate:content`; after core edits run
  `npm test`.
