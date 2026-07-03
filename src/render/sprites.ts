/**
 * Sprite cache with manifest-first resolution:
 *   1. real PNG from public/art/modules/<key>.png if listed in art-manifest.json
 *   2. procedural placeholder (deterministic, generated once, cached)
 * Future hook: SpriteEntry.frames for animated modules.
 */
import type { ModuleDef } from '../core/types';
import { ART_CELL } from '../core/grid';
import { getTheme, spriteKey } from '../core/catalog';
import { generateModuleSprite } from './procedural/moduleSprite';

export interface SpriteEntry {
  image: CanvasImageSource;
  /** Reserved for animated modules (P2+): if set, renderer cycles frames. */
  frames?: CanvasImageSource[];
}

const cache = new Map<string, SpriteEntry>();
let finalArtKeys: Set<string> = new Set();
let onSpriteReady: (() => void) | null = null;

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
 * Returns the sprite for a def+theme synchronously. If final art exists but
 * isn't loaded yet, returns the procedural placeholder now and triggers a
 * redraw when the PNG arrives.
 */
export function getSprite(def: ModuleDef, themeId: string): SpriteEntry {
  const key = spriteKey(def, themeId);
  const hit = cache.get(key);
  if (hit) return hit;

  const theme = getTheme(themeId);
  const placeholder: SpriteEntry = {
    image: generateModuleSprite(def, themeId, theme!.palette),
  };
  cache.set(key, placeholder);

  if (finalArtKeys.has(key)) {
    const img = new Image();
    img.onload = () => {
      cache.set(key, { image: img });
      thumbnailCache.delete(key);
      onSpriteReady?.();
    };
    img.src = `${import.meta.env.BASE_URL}art/modules/${key}.png`;
  }
  return placeholder;
}

// --- sidebar thumbnails (data URLs, cached) ---

const thumbnailCache = new Map<string, string>();
const THUMB_H = 40;

export function getThumbnailURL(def: ModuleDef, themeId: string): string {
  const key = spriteKey(def, themeId);
  const hit = thumbnailCache.get(key);
  if (hit) return hit;
  const sprite = getSprite(def, themeId).image;
  const scale = THUMB_H / (def.h * ART_CELL);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(def.w * ART_CELL * scale);
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL();
  thumbnailCache.set(key, url);
  return url;
}

/** Test/dev helper. */
export function clearSpriteCache(): void {
  cache.clear();
  thumbnailCache.clear();
}
