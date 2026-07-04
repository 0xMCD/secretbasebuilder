/**
 * The only module that parses src/content/*.json. Everyone else consumes the
 * typed, expanded catalog exported here.
 */
import modulesJson from '../content/modules.json';
import themesJson from '../content/themes.json';
import environmentsJson from '../content/environments.json';
import type {
  DefId,
  EnvironmentDef,
  KindDef,
  ModuleDef,
  ThemeDef,
} from './types';

export const CATEGORIES: { id: string; name: string }[] = modulesJson.categories;

export const KINDS: KindDef[] = modulesJson.kinds as KindDef[];

/** Kinds × sizes, expanded. Def id = `${kindId}_${w}x${h}` (public, stable). */
export const MODULE_DEFS: ModuleDef[] = KINDS.flatMap((kind) =>
  kind.sizes.map((size) => ({
    id: `${kind.id}_${size.w}x${size.h}`,
    kind: kind.id,
    name: kind.name,
    category: kind.category,
    rarity: kind.rarity,
    tags: kind.tags,
    blurb: kind.blurb,
    w: size.w,
    h: size.h,
    layer: kind.layer,
  })),
);

export const THEMES: ThemeDef[] = themesJson.themes as ThemeDef[];

export const ENVIRONMENTS: EnvironmentDef[] = environmentsJson.environments as EnvironmentDef[];

const defById = new Map<DefId, ModuleDef>(MODULE_DEFS.map((d) => [d.id, d]));
const themeById = new Map(THEMES.map((t) => [t.id, t]));
const environmentById = new Map(ENVIRONMENTS.map((e) => [e.id, e]));

export function getDef(defId: DefId): ModuleDef | undefined {
  return defById.get(defId);
}

export function getTheme(themeId: string): ThemeDef | undefined {
  return themeById.get(themeId);
}

export function getEnvironment(envId: string): EnvironmentDef | undefined {
  return environmentById.get(envId);
}

export const DEFAULT_THEME = THEMES[0].id;
export const DEFAULT_ENVIRONMENT = ENVIRONMENTS[0].id;

/** Sprite cache key — derived, never stored. See docs/ARCHITECTURE.md. */
export function spriteKey(def: ModuleDef, themeId: string): string {
  return `${def.kind}_${def.w}x${def.h}_${themeId}`;
}
