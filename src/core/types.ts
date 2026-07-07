/**
 * Core domain types. This module is DOM-free and imported by every layer.
 * Design contracts: docs/design/gdd.json → "systems".
 */

export type Rarity = 'common' | 'uncommon' | 'rare';

/** Public stable id of a style theme (appears in save files). */
export type ThemeId = string;
/** Public stable id of a module kind, e.g. "bedroom". */
export type KindId = string;
/** Public stable id of a concrete module definition: `${kindId}_${w}x${h}`. */
export type DefId = string;
/** Public stable id of an environment. */
export type EnvironmentId = string;

export interface ModuleSize {
  w: number; // grid cells wide, 1..6
  h: number; // grid cells tall, 1..3
}

/**
 * Placement layer. Default (undefined) = a ROOM: occupies grid cells, collides
 * with rooms, gets a shell + seams. 'decor' = a PROP: transparent-background
 * sprite that must sit INSIDE a room, ignores room collision, draws on top.
 */
export type Layer = 'decor';

/** A module kind as authored in src/content/modules.json. */
export interface KindDef {
  id: KindId;
  name: string;
  category: string;
  rarity: Rarity;
  tags: string[];
  blurb: string;
  sizes: ModuleSize[];
  layer?: Layer;
}

/** A concrete placeable module: one kind at one size. */
export interface ModuleDef {
  id: DefId;
  kind: KindId;
  name: string;
  category: string;
  rarity: Rarity;
  tags: string[];
  blurb: string;
  w: number;
  h: number;
  layer?: Layer;
}

export interface ThemePalette {
  wall: string;
  wallDark: string;
  floor: string;
  roomBg: string;
  accent: string;
  glow: string;
  trim: string;
  furniture: string;
  furnitureDark: string;
}

export interface ThemeDef {
  id: ThemeId;
  name: string;
  blurb: string;
  palette: ThemePalette;
}

export type WeatherKind = 'sunny' | 'rain' | 'snow' | 'night';
export type StructureKind = 'house' | 'cabin' | 'shack' | 'dome' | 'tower' | 'treehouse' | 'skyline' | 'volcano';

export interface EnvironmentPalette {
  skyTop: string;
  skyBottom: string;
  surface: string;
  dirt: string;
  dirtDark: string;
  dirtSpeckle: string;
  structureMain: string;
  structureRoof: string;
  structureDark: string;
}

export interface EnvironmentDef {
  id: EnvironmentId;
  name: string;
  blurb: string;
  structure: StructureKind;
  weather: WeatherKind;
  palette: EnvironmentPalette;
}

/** One module placed in the world. The unit of the save file. */
export interface Placement {
  id: string; // unique per placement, generated at place time
  defId: DefId;
  theme: ThemeId;
  x: number; // grid column of left edge
  y: number; // grid row of top edge (y grows downward)
}

export interface GameState {
  baseName: string;
  environmentId: EnvironmentId;
  placements: Placement[];
  /** UI: label overlay toggle. */
  overlayOn: boolean;
  /** UI: theme currently selected in the sidebar (styles new placements + thumbnails). */
  activeTheme: ThemeId;
  /** UI: id of the selected placement, if any. */
  selectedId: string | null;
  /** True until the player has confirmed an environment on the start screen. */
  needsEnvironmentPick: boolean;
}

/** Versioned save file — see docs/ARCHITECTURE.md "Save format". */
export interface SaveFileV1 {
  version: 1;
  baseName: string;
  environmentId: EnvironmentId;
  placements: Placement[];
}
export type SaveFile = SaveFileV1;
