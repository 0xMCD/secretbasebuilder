import { useMemo, useState, type RefObject } from 'react';
import { CATEGORIES, MODULE_DEFS, THEMES } from '../core/catalog';
import type { ModuleDef } from '../core/types';
import { setActiveTheme } from '../core/actions';
import { beginCatalogDrag } from '../input/catalogDrag';
import { getThumbnailURL } from '../render/sprites';
import { useGameState } from './hooks';

type SortKey = 'name' | 'size' | 'category';

const RARITY_LABEL: Record<string, string> = {
  common: '',
  uncommon: '◆ uncommon',
  rare: '★ rare',
};

export function Sidebar({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement> }) {
  const { activeTheme } = useGameState();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('category');

  const defs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = MODULE_DEFS.filter((d) => {
      if (category !== 'all' && d.category !== category) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    const by: Record<SortKey, (a: ModuleDef, b: ModuleDef) => number> = {
      name: (a, b) => a.name.localeCompare(b.name) || a.w - b.w,
      size: (a, b) => a.w * a.h - b.w * b.h || a.name.localeCompare(b.name),
      category: (a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name) || a.w - b.w,
    };
    return [...filtered].sort(by[sort]);
  }, [search, category, sort]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="theme-row">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={t.id === activeTheme ? 'theme-chip active' : 'theme-chip'}
              style={{ ['--swatch' as string]: t.palette.accent }}
              onClick={() => setActiveTheme(t.id)}
              title={t.blurb}
            >
              {t.name}
            </button>
          ))}
        </div>
        <input
          className="search"
          placeholder="Search rooms…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-row">
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
            <option value="category">By category</option>
            <option value="name">By name</option>
            <option value="size">By size</option>
          </select>
        </div>
      </div>
      <div className="card-list">
        {defs.map((def) => (
          <ModuleCard key={def.id} def={def} theme={activeTheme} canvasRef={canvasRef} />
        ))}
        {defs.length === 0 && <div className="empty-list">No rooms match. Try another search!</div>}
      </div>
    </div>
  );
}

function ModuleCard({
  def,
  theme,
  canvasRef,
}: {
  def: ModuleDef;
  theme: string;
  canvasRef: RefObject<HTMLCanvasElement>;
}) {
  return (
    <div
      className={`card rarity-${def.rarity}`}
      onPointerDown={(e) => {
        if (canvasRef.current) beginCatalogDrag(def.id, e.nativeEvent, canvasRef.current);
      }}
      title={`${def.blurb} — drag me into the base!`}
    >
      <img className="card-thumb" src={getThumbnailURL(def, theme)} alt="" draggable={false} />
      <div className="card-info">
        <div className="card-name">{def.name}</div>
        <div className="card-meta">
          {def.w}×{def.h}
          {RARITY_LABEL[def.rarity] && <span className={`rarity ${def.rarity}`}> {RARITY_LABEL[def.rarity]}</span>}
        </div>
      </div>
    </div>
  );
}
