# Secret Base Builder — Game Design Document

> **Machine-readable source of truth: [`docs/design/gdd.json`](design/gdd.json).**
> This file is the human-friendly companion. If they ever disagree, `gdd.json` wins — fix this file.

*Working title: **Me and Sailor Bunker** (from the original crayon concept art).*

## What is this?

A web-based creative sandbox where kids build the ultimate secret base in a 2D
side-cutaway view — the classic "draw your bunker on paper" fantasy, brought to
life in high-fidelity pixel art. Spy Kids energy: somewhat realistic, a bit
techy, a bit fantastical.

There are **no resources, costs, or failure states**. You drag rooms from a big
catalog on the right into an underground grid, and they snap together into a
living base.

## The core loop

1. Pick an **environment** — one choice that bundles the above-ground structure,
   the weather, and the kind of dirt (e.g. *suburban house / sunny / brown loam*,
   or *research dome / snow / gray stone*).
2. Browse the **catalog sidebar**: scrollable cards with pixel thumbnails and
   names. Search, filter by category, sort, and switch the **theme** (tech /
   fantasy / realistic / cozy / glam) to restyle everything.
3. **Drag modules** into the dirt. A grid-snapped ghost shows green (valid) or
   red (overlap / out of bounds). Adjacent rooms automatically connect with
   doorways so the base reads as one structure.
4. Pan and zoom around your creation. Toggle the **label overlay** to see every
   room's name. Move or delete anything, undo anything.
5. It autosaves locally; export/import a `.json` file to keep or share a base.

## Why it's fun

**Variety.** The catalog is the game. 1-tall modules come in standard size
tiers — S (1×1), M (2×1), L (3×1), and sometimes XL (4×1) — always visible as
chips on the card; the ◀ ▶ flipper on each card cycles its style. 2- and
3-tall modules (garage, elevator shaft, command center, greenhouse, library,
rocket silo) are rarer and feel special. Every module comes in all 5 themes,
and style is per-room: mixing them is half the fun. Launch kinds: bedroom,
kitchen, hallway, bathroom, storage, entertainment, living area, game room,
lab, command center, vault, garage, elevator, greenhouse, library, rocket
silo.

## The three big technical promises

1. **Content is data.** Modules, themes, and environments are JSON manifests in
   `src/content/`. Adding content never requires engine changes.
2. **Art is swappable.** Every sprite has a deterministic key
   (`kind_WxH_theme`). Until final art exists, a procedural generator draws
   real pixel-art placeholders (palette walls + furniture silhouettes). Drop a
   PNG at the conventional path and it wins automatically.
3. **Sessions are resumable.** Work is chunked in [`docs/PLAN.md`](PLAN.md)
   with live status, so any model/dev can pick up where the last one stopped.

## Later (deliberately not now)

Animated modules, characters that walk between connected rooms, day/night,
sound, share links, optional challenge modes. The architecture reserves hooks
for these — see `outOfScopeV1` in `gdd.json`.
