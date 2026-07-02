# Architecture

How the code is organized and the contracts between layers. Read
[`docs/design/gdd.json`](design/gdd.json) first for design intent.

## Stack

- **Vite + TypeScript + React 18** for the app shell and all UI chrome.
- **Hand-rolled Canvas2D renderer** for the base view (no game engine).
  Pixel-crisp via `imageSmoothingEnabled = false` and integer art coordinates.
- **No state library**: a tiny custom store (`src/core/store.ts`) with
  `getState / setState / subscribe`, bridged to React with
  `useSyncExternalStore`. The renderer subscribes directly — it never goes
  through React.
- **Pointer Events everywhere** (mouse + touch unified). No HTML5 drag-and-drop
  (it doesn't work on touch).

## Directory map

```
docs/                      Design + planning (this folder)
scripts/validate-content.mjs   Content manifest validation (npm run validate:content)
public/art/                Final-art drop zone (see Art pipeline)
src/
  content/                 DATA: modules.json, themes.json, environments.json
  core/                    Pure logic, no DOM: types, grid, catalog, state, undo
  persistence/             localStorage autosave + export/import
  render/                  Canvas renderer, camera, sprite cache
  render/procedural/       Placeholder pixel-art generators (palette + furniture)
  input/                   Pointer handling: pan/zoom/drag-drop/move
  ui/                      React components (sidebar, top bar, pickers)
```

### Layering rule

`core` imports nothing from `render`/`ui`/`input`. `render` imports `core` but
not `ui`. `ui` talks to everything through the store and controller functions.
Content JSON is only parsed in `core/catalog.ts` — everyone else consumes typed
objects.

## Key contracts

### Grid & coordinates (`core/grid.ts`)

Fixed world: `COLS=48`, `ROWS=26`, `GROUND_ROW=6`. Cells are square,
`ART_CELL=64` art pixels. `y` grows downward. Buildable region is
`y >= GROUND_ROW`. All placement math (bounds, overlap, edge adjacency) lives
here as pure functions and is unit-tested.

### Catalog (`core/catalog.ts`)

Loads `modules.json` kinds and expands `kinds × sizes` into `ModuleDef`s with
id `` `${kindId}_${w}x${h}` ``. Def ids and theme ids are **stable public
identifiers** — they appear in save files. Never rename a published id;
deprecate instead.

### Store & actions (`core/store.ts`, `core/actions.ts`)

Single `GameState`: `{ baseName, environmentId, placements, overlayOn,
activeTheme, selection }`. Mutations go through action functions (place, move,
remove, `setPlacementTheme`, `resizePlacement`, clear, environment/name) which
snapshot into the undo stack (`core/undo.ts`) and trigger a debounced autosave.
React components and the renderer both subscribe. The selection inspector
(`ui/Inspector.tsx`) is the UI for the per-placement actions.

### Save format (`persistence/save.ts`)

```json
{ "version": 1, "baseName": "...", "environmentId": "suburban",
  "placements": [{ "id": "p1", "defId": "bedroom_3x1", "theme": "tech", "x": 10, "y": 8 }] }
```
Versioned; loaders migrate or reject gracefully. Import skips unknown
`defId`/`theme` values and reports the skipped count.

### Sprite pipeline (`render/sprites.ts` + `render/procedural/`)

Sprite key = `` `${kindId}_${w}x${h}_${themeId}` ``. Resolution order:

1. If the key is listed in `public/art/art-manifest.json`, load
   `public/art/modules/<key>.png` (must be exactly `w*64 × h*64` px).
2. Otherwise generate a deterministic procedural placeholder into an offscreen
   canvas and cache it.

**To ship final art: drop PNGs in `public/art/modules/`, list them in the
manifest, reload. No code changes.** The cache API is shaped to grow a
`frames[]` field later for animated modules.

### Renderer (`render/renderer.ts`)

One `requestAnimationFrame` loop rendering **every frame** (weather and
placement pops are always animating). Cheap because the static environment
(sky, sun/moon, dirt + easter eggs, surface, structure, hatch) is cached per
environment in an offscreen canvas (`render/environment.ts:
getEnvironmentCanvas`); only the weather overlay (`drawWeather(ctx, env, t)`)
and sprites are drawn fresh. Draw order: cached environment → animated weather
→ module sprites (new placements scale-pop for 200ms) → **connection seams**
(quiet arched doorways / ladderways wherever two placements share ≥1 cell of
edge) → ghost preview → selection outline → label overlay.

### Input (`input/`)

A single pointer controller on the canvas plus custom drag initiation from
sidebar cards. Gestures: drag empty space = pan; wheel/pinch = zoom to pointer;
drag a placed module = move it; tap = select; drag from sidebar card = place
with ghost preview. All via Pointer Events + `setPointerCapture`.

## Testing & validation

- `npm test` — vitest over `core/` (grid math, placement rules, undo,
  serialization round-trips).
- `npm run validate:content` — schema + referential checks over
  `src/content/*.json` (unique ids, sizes within limits, palette completeness).
  Run it after any content edit; CI-friendly (exits nonzero).

## Future hooks (do not remove)

- **Animation**: `SpriteEntry` is `{ image, frames?: HTMLCanvasElement[] }`.
- **Characters**: shared-edge adjacency already computed for connection seams
  doubles as the room-to-room walkability graph.
- **New themes/environments**: purely additive JSON + one painter function.
