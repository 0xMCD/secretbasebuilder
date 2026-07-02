#!/usr/bin/env node
/**
 * Validates src/content/*.json and public/art/art-manifest.json.
 * Run after ANY content edit: npm run validate:content
 * Exits nonzero on failure (CI-friendly). No dependencies.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const errors = [];
const err = (msg) => errors.push(msg);

const HEX = /^#[0-9a-f]{6}$/i;
const ID = /^[a-z][a-z0-9-]*$/;
const RARITIES = ['common', 'uncommon', 'rare'];
const WEATHERS = ['sunny', 'rain', 'snow', 'night'];
const STRUCTURES = ['house', 'cabin', 'shack', 'dome', 'tower'];
const THEME_PALETTE_KEYS = [
  'wall', 'wallDark', 'floor', 'roomBg', 'accent', 'glow', 'trim',
  'furniture', 'furnitureDark',
];
const ENV_PALETTE_KEYS = [
  'skyTop', 'skyBottom', 'surface', 'dirt', 'dirtDark', 'dirtSpeckle',
  'structureMain', 'structureRoof', 'structureDark',
];
// Grid limits — keep in sync with src/core/grid.ts
const MAX_W = 6;
const MAX_H = 3;

function checkUnique(items, label) {
  const seen = new Set();
  for (const it of items) {
    if (seen.has(it.id)) err(`${label}: duplicate id "${it.id}"`);
    seen.add(it.id);
  }
}

function checkPalette(palette, keys, label) {
  for (const key of keys) {
    const v = palette?.[key];
    if (typeof v !== 'string' || !HEX.test(v)) {
      err(`${label}: palette.${key} must be a #rrggbb hex color, got ${JSON.stringify(v)}`);
    }
  }
}

// ---- modules.json ----
const modules = read('src/content/modules.json');
const categoryIds = new Set((modules.categories ?? []).map((c) => c.id));
if (categoryIds.size === 0) err('modules.json: categories must be non-empty');
checkUnique(modules.kinds ?? [], 'modules.json kinds');
for (const kind of modules.kinds ?? []) {
  const label = `modules.json kind "${kind.id}"`;
  if (!ID.test(kind.id ?? '')) err(`${label}: id must match ${ID}`);
  if (!kind.name) err(`${label}: missing name`);
  if (!kind.blurb) err(`${label}: missing blurb`);
  if (!categoryIds.has(kind.category)) err(`${label}: unknown category "${kind.category}"`);
  if (!RARITIES.includes(kind.rarity)) err(`${label}: rarity must be one of ${RARITIES}`);
  if (!Array.isArray(kind.tags)) err(`${label}: tags must be an array`);
  if (!Array.isArray(kind.sizes) || kind.sizes.length === 0) {
    err(`${label}: sizes must be a non-empty array`);
    continue;
  }
  const sizeKeys = new Set();
  for (const { w, h } of kind.sizes) {
    if (!Number.isInteger(w) || w < 1 || w > MAX_W) err(`${label}: width ${w} out of range 1..${MAX_W}`);
    if (!Number.isInteger(h) || h < 1 || h > MAX_H) err(`${label}: height ${h} out of range 1..${MAX_H}`);
    const key = `${w}x${h}`;
    if (sizeKeys.has(key)) err(`${label}: duplicate size ${key}`);
    sizeKeys.add(key);
  }
}

// ---- themes.json ----
const themes = read('src/content/themes.json');
checkUnique(themes.themes ?? [], 'themes.json');
if ((themes.themes ?? []).length === 0) err('themes.json: must define at least one theme');
for (const theme of themes.themes ?? []) {
  const label = `themes.json theme "${theme.id}"`;
  if (!ID.test(theme.id ?? '')) err(`${label}: id must match ${ID}`);
  if (!theme.name) err(`${label}: missing name`);
  checkPalette(theme.palette, THEME_PALETTE_KEYS, label);
}

// ---- environments.json ----
const environments = read('src/content/environments.json');
checkUnique(environments.environments ?? [], 'environments.json');
if ((environments.environments ?? []).length === 0) err('environments.json: must define at least one environment');
for (const env of environments.environments ?? []) {
  const label = `environments.json environment "${env.id}"`;
  if (!ID.test(env.id ?? '')) err(`${label}: id must match ${ID}`);
  if (!env.name) err(`${label}: missing name`);
  if (!WEATHERS.includes(env.weather)) err(`${label}: weather must be one of ${WEATHERS}`);
  if (!STRUCTURES.includes(env.structure)) err(`${label}: structure must be one of ${STRUCTURES}`);
  checkPalette(env.palette, ENV_PALETTE_KEYS, label);
}

// ---- art-manifest.json ----
const artManifest = read('public/art/art-manifest.json');
const kindIds = new Set((modules.kinds ?? []).map((k) => k.id));
const themeIds = new Set((themes.themes ?? []).map((t) => t.id));
const validSpriteKeys = new Set();
for (const kind of modules.kinds ?? []) {
  for (const { w, h } of kind.sizes ?? []) {
    for (const theme of themes.themes ?? []) {
      validSpriteKeys.add(`${kind.id}_${w}x${h}_${theme.id}`);
    }
  }
}
if (!Array.isArray(artManifest.modules)) {
  err('art-manifest.json: "modules" must be an array of sprite keys');
} else {
  for (const key of artManifest.modules) {
    if (!validSpriteKeys.has(key)) {
      err(`art-manifest.json: "${key}" does not match any kind×size×theme (kinds: ${[...kindIds].length}, themes: ${[...themeIds].length})`);
    }
  }
}

// ---- report ----
if (errors.length > 0) {
  console.error(`Content validation FAILED with ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
const defCount = (modules.kinds ?? []).reduce((n, k) => n + k.sizes.length, 0);
console.log(
  `Content OK: ${modules.kinds.length} kinds → ${defCount} defs × ${themes.themes.length} themes = ${defCount * themes.themes.length} sprite variants; ${environments.environments.length} environments; ${artManifest.modules.length} final-art overrides.`,
);
