import { describe, expect, it } from 'vitest';
import { checkCondition, checkChallenge, CHALLENGES, satisfiedChallenges } from './challenges';
import type { Placement } from './types';

const p = (id: string, defId: string, x: number, y: number, theme = 'cozy'): Placement => ({
  id,
  defId,
  theme,
  x,
  y,
});

describe('challenge conditions', () => {
  it('hasKind counts placements of a kind across sizes', () => {
    const base = [p('a', 'bedroom_2x1', 0, 8), p('b', 'bedroom_3x1', 3, 8), p('c', 'kitchen_2x1', 7, 8)];
    expect(checkCondition({ type: 'hasKind', kind: 'bedroom' }, base)).toBe(true);
    expect(checkCondition({ type: 'hasKind', kind: 'bedroom', count: 2 }, base)).toBe(true);
    expect(checkCondition({ type: 'hasKind', kind: 'bedroom', count: 3 }, base)).toBe(false);
    expect(checkCondition({ type: 'hasKind', kind: 'pool' }, base)).toBe(false);
  });

  it('adjacentKinds needs a shared seam between the two kinds', () => {
    const touching = [p('a', 'lab_2x2', 0, 8), p('b', 'library_2x2', 2, 8)];
    const apart = [p('a', 'lab_2x2', 0, 8), p('b', 'library_2x2', 5, 8)];
    expect(checkCondition({ type: 'adjacentKinds', a: 'lab', b: 'library' }, touching)).toBe(true);
    expect(checkCondition({ type: 'adjacentKinds', a: 'library', b: 'lab' }, touching)).toBe(true);
    expect(checkCondition({ type: 'adjacentKinds', a: 'lab', b: 'library' }, apart)).toBe(false);
  });

  it('allSameTheme ignores nothing and fails on any off-theme room', () => {
    const cozy = [p('a', 'bedroom_2x1', 0, 8), p('b', 'kitchen_2x1', 2, 8)];
    const mixed = [p('a', 'bedroom_2x1', 0, 8), p('b', 'kitchen_2x1', 2, 8, 'tech')];
    expect(checkCondition({ type: 'allSameTheme', theme: 'cozy' }, cozy)).toBe(true);
    expect(checkCondition({ type: 'allSameTheme', theme: 'cozy' }, mixed)).toBe(false);
    expect(checkCondition({ type: 'allSameTheme', theme: 'cozy' }, [])).toBe(false);
  });

  it('floors counts distinct room rows; decor does not count as a room', () => {
    const base = [
      p('a', 'bedroom_2x1', 0, 7),
      p('b', 'kitchen_2x1', 0, 8),
      p('c', 'living_2x1', 0, 9),
      p('d', 'plantpot_1x1', 0, 12), // decor: not a room, not a floor
    ];
    expect(checkCondition({ type: 'floors', count: 3 }, base)).toBe(true);
    expect(checkCondition({ type: 'floors', count: 4 }, base)).toBe(false);
    expect(checkCondition({ type: 'minRooms', count: 3 }, base)).toBe(true);
    expect(checkCondition({ type: 'maxRooms', count: 3 }, base)).toBe(true);
    expect(checkCondition({ type: 'maxRooms', count: 2 }, base)).toBe(false);
  });

  it('connected follows the solid-floors rule: stacked rooms need a vertical connector', () => {
    // Two rooms side by side: connected via doorway seam.
    expect(
      checkCondition({ type: 'connected' }, [p('a', 'bedroom_2x1', 0, 8), p('b', 'kitchen_2x1', 2, 8)]),
    ).toBe(true);
    // Two rooms stacked with NO connector: solid floor between them → NOT connected.
    expect(
      checkCondition({ type: 'connected' }, [p('a', 'bedroom_2x1', 0, 8), p('b', 'kitchen_2x1', 0, 9)]),
    ).toBe(false);
    // Same stack tied together by a ladder touching both floors.
    expect(
      checkCondition({ type: 'connected' }, [
        p('a', 'bedroom_2x1', 0, 8),
        p('b', 'kitchen_2x1', 0, 9),
        p('l', 'ladder_1x2', 2, 8),
      ]),
    ).toBe(true);
  });
});

describe('challenge deck', () => {
  it('spy-starter completes with a bedroom + kitchen + bathroom', () => {
    const ch = CHALLENGES.find((c) => c.id === 'spy-starter')!;
    const base = [p('a', 'bedroom_2x1', 0, 8), p('b', 'kitchen_2x1', 2, 8), p('c', 'bathroom_1x1', 4, 8)];
    expect(checkChallenge(ch, base)).toBe(true);
    expect(satisfiedChallenges(base)).toContain('spy-starter');
    expect(checkChallenge(ch, base.slice(0, 2))).toBe(false);
  });

  it('every card in the deck is checkable against an empty base without throwing', () => {
    for (const ch of CHALLENGES) expect(typeof checkChallenge(ch, [])).toBe('boolean');
  });
});
