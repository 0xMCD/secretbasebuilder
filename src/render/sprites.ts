/**
 * Sprite cache with manifest-first resolution:
 *   1. real PNG from public/art/modules/<key>.png if listed in art-manifest.json
 *   2. procedural placeholder (deterministic, generated once, cached)
 * Future hook: SpriteEntry.frames for animated modules.
 */
import type { ModuleDef } from '../core/types';
import { ART_CELL } from '../core/grid';
import { getTheme, spriteKey } from '../core/catalog';
import type { FxHint } from './fx';
import { generateModuleSprite } from './procedural/moduleSprite';

export interface SpriteEntry {
  image: CanvasImageSource;
  /** Ambient-animation hints the renderer replays each frame (render/fx.ts). */
  fx: FxHint[];
}

const cache = new Map<string, SpriteEntry>();
let finalArtKeys: Set<string> = new Set();
let onSpriteReady: (() => void) | null = null;

/**
 * Per-placement variation: each def×theme renders in a few rng-seeded
 * variants (different stains, plank joints, book colors, prop rolls…), and a
 * placement picks its variant from its id — so two copies of the same room
 * are never pixel-identical, and the choice survives save/load for free.
 */
export const SPRITE_VARIANTS = 3;

export function variantForId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % SPRITE_VARIANTS;
}

/** Loads the final-art manifest. Call once at startup; safe to fail. */
export async function initSprites(requestRedraw: () => void): Promise<void> {
  onSpriteReady = requestRedraw;
  try {
    // BASE_URL-relative so subpath hosting (e.g. GitHub Pages) works.
    const res = await fetch(`${import.meta.env.BASE_URL}art/art-manifest.json`);
    if (res.ok) {
      const manifest = (await res.json()) as { modules?: string[] };
      finalArtKeys = new Set(manifest.modules ?? []);
    }
  } catch {
    // No manifest → all procedural. Fine.
  }
}

/**
 * Returns the sprite for a def+theme+variant synchronously. If final art
 * exists but isn't loaded yet, returns the procedural placeholder now and
 * triggers a redraw when the PNG arrives.
 */
export function getSprite(def: ModuleDef, themeId: string, variant = 0): SpriteEntry {
  const baseKey = spriteKey(def, themeId);
  const key = `${baseKey}#${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const theme = getTheme(themeId);
  const generated = generateModuleSprite(def, themeId, theme!.palette, variant);
  const placeholder: SpriteEntry = { image: generated.canvas, fx: generated.fx };
  cache.set(key, placeholder);

  if (finalArtKeys.has(baseKey)) {
    const img = new Image();
    img.onload = () => {
      // Final PNG art replaces the look wholesale (all variants); procedural
      // fx hints no longer line up with it, so they're dropped.
      for (let v = 0; v < SPRITE_VARIANTS; v++) cache.set(`${baseKey}#${v}`, { image: img, fx: [] });
      thumbnailCache.delete(baseKey);
      onSpriteReady?.();
    };
    img.src = `${import.meta.env.BASE_URL}art/modules/${baseKey}.png`;
  }
  return placeholder;
}

// --- sidebar thumbnails (data URLs, cached) ---

const thumbnailCache = new Map<string, string>();
/** 2× the 46 CSS px the card shows, so thumbnails stay crisp on retina. */
const THUMB_H = 92;

export function getThumbnailURL(def: ModuleDef, themeId: string): string {
  const key = spriteKey(def, themeId);
  const hit = thumbnailCache.get(key);
  if (hit) return hit;
  const sprite = getSprite(def, themeId).image;
  // Progressive halving with smoothing ≈ area averaging — a 256px-per-cell
  // sprite jumped straight to 40px turns to mush; halving keeps detail.
  let cw = def.w * ART_CELL;
  let ch = def.h * ART_CELL;
  let cur: CanvasImageSource = sprite;
  while (ch / 2 > THUMB_H * 1.5) {
    const step = document.createElement('canvas');
    step.width = Math.max(1, Math.round(cw / 2));
    step.height = Math.max(1, Math.round(ch / 2));
    const sctx = step.getContext('2d')!;
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(cur, 0, 0, step.width, step.height);
    cur = step;
    cw = step.width;
    ch = step.height;
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((cw * THUMB_H) / ch));
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(cur, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL();
  thumbnailCache.set(key, url);
  return url;
}

/** Test/dev helper. */
export function clearSpriteCache(): void {
  cache.clear();
  thumbnailCache.clear();
}
