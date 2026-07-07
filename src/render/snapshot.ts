/**
 * 📸 Photo export: renders the base to a PNG cropped to the built area
 * (placements bounding box + margin), with a title banner. Downloadable and
 * printable — kids get a poster of their base.
 */
import { ART_CELL, placementRect } from '../core/grid';
import { getDef, getEnvironment } from '../core/catalog';
import { getState } from '../core/store';
import { getEnvironmentCanvas } from './environment';
import { drawConnectors } from './renderer';
import { getSprite, variantForId } from './sprites';

const OUT_CELL = 128; // output px per cell — poster-sized without being huge
const BANNER_H = 72;
const MARGIN_CELLS = 1;

export function downloadSnapshot(): void {
  const state = getState();
  if (state.placements.length === 0) return;

  // Bounding box of everything built, padded a little.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of state.placements) {
    const rect = placementRect(p);
    if (!rect) continue;
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.h);
  }
  minX -= MARGIN_CELLS;
  minY -= MARGIN_CELLS;
  maxX += MARGIN_CELLS;
  maxY += MARGIN_CELLS;
  const cellsW = maxX - minX;
  const cellsH = maxY - minY;

  const canvas = document.createElement('canvas');
  canvas.width = cellsW * OUT_CELL;
  canvas.height = cellsH * OUT_CELL + BANNER_H;
  const c = canvas.getContext('2d')!;
  c.imageSmoothingEnabled = false;

  // Title banner
  c.fillStyle = '#131922';
  c.fillRect(0, 0, canvas.width, BANNER_H);
  c.fillStyle = '#38e1ff';
  c.fillRect(0, BANNER_H - 4, canvas.width, 4);
  c.fillStyle = '#e8eef5';
  c.font = `700 ${Math.min(34, canvas.width / 14)}px system-ui, sans-serif`;
  c.textBaseline = 'middle';
  c.fillText(`🕵️ ${state.baseName}`, 20, BANNER_H / 2);
  c.fillStyle = '#6f8296';
  c.font = '600 13px system-ui, sans-serif';
  c.textAlign = 'right';
  c.fillText('SECRET BASE BUILDER', canvas.width - 16, BANNER_H / 2);
  c.textAlign = 'left';

  // World: environment slice (authored at 64px/cell), then sprites + seams.
  const env = getEnvironment(state.environmentId)!;
  const envCanvas = getEnvironmentCanvas(env);
  c.drawImage(
    envCanvas,
    minX * 64,
    minY * 64,
    cellsW * 64,
    cellsH * 64,
    0,
    BANNER_H,
    cellsW * OUT_CELL,
    cellsH * OUT_CELL,
  );

  c.save();
  c.translate(0, BANNER_H);
  c.scale(OUT_CELL / ART_CELL, OUT_CELL / ART_CELL);
  c.translate(-minX * ART_CELL, -minY * ART_CELL);
  const roomPlacements = state.placements.filter((p) => getDef(p.defId)?.layer !== 'decor');
  const decorPlacements = state.placements.filter((p) => getDef(p.defId)?.layer === 'decor');
  const drawSprite = (p: (typeof state.placements)[number]) => {
    const def = getDef(p.defId);
    if (def) c.drawImage(getSprite(def, p.theme, variantForId(p.id)).image, p.x * ART_CELL, p.y * ART_CELL);
  };
  roomPlacements.forEach(drawSprite);
  drawConnectors(c, roomPlacements);
  decorPlacements.forEach(drawSprite);
  c.restore();

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.baseName.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'secret-base'}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
