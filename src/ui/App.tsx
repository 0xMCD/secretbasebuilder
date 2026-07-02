import { MODULE_DEFS, THEMES, ENVIRONMENTS } from '../core/catalog';

/** Placeholder shell — replaced by the real layout in Chunk E (see docs/PLAN.md). */
export function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Secret Base Builder</h1>
      <p>
        Content system online: {MODULE_DEFS.length} module defs, {THEMES.length}{' '}
        themes, {ENVIRONMENTS.length} environments.
      </p>
    </div>
  );
}
