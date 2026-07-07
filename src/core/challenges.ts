/**
 * Blueprint challenges: pure placement-logic checks over the current base.
 * Cards are content (src/content/challenges.json); completing one stamps a
 * cosmetic badge (persisted in the save). No gates, no currency — a card is
 * a building prompt, not a requirement.
 */
import challengesJson from '../content/challenges.json';
import { getDef, KINDS, VERTICAL_KINDS } from './catalog';
import { allSeams } from './grid';
import type { Placement } from './types';

export type Condition =
  | { type: 'hasKind'; kind: string; count?: number }
  | { type: 'adjacentKinds'; a: string; b: string }
  | { type: 'allSameTheme'; theme: string }
  | { type: 'floors'; count: number }
  | { type: 'minRooms'; count: number }
  | { type: 'maxRooms'; count: number }
  | { type: 'connected' };

export interface Challenge {
  id: string;
  emoji: string;
  name: string;
  blurb: string;
  conditions: Condition[];
}

export const CHALLENGES: Challenge[] = challengesJson.challenges as Challenge[];

const kindName = (kindId: string): string => KINDS.find((k) => k.id === kindId)?.name ?? kindId;

/** Human-readable checklist line for a condition (shown on the card). */
export function describeCondition(c: Condition): string {
  switch (c.type) {
    case 'hasKind':
      return (c.count ?? 1) > 1 ? `${c.count}× ${kindName(c.kind)}` : `A ${kindName(c.kind)}`;
    case 'adjacentKinds':
      return `${kindName(c.a)} right next to ${kindName(c.b)}`;
    case 'allSameTheme':
      return `Every room in the ${c.theme} style`;
    case 'floors':
      return `Rooms on ${c.count} different floors`;
    case 'minRooms':
      return `At least ${c.count} rooms`;
    case 'maxRooms':
      return `No more than ${c.count} rooms`;
    case 'connected':
      return 'Everything connected (doors, stairs, elevators…)';
  }
}

const isRoom = (p: Placement): boolean => getDef(p.defId)?.layer !== 'decor';
const kindOf = (p: Placement): string => getDef(p.defId)?.kind ?? '';

/**
 * Passability matches the structure rule (P4.0): side-by-side seams connect
 * (doorways); floor/ceiling seams connect only through a vertical connector.
 */
function isConnected(rooms: Placement[]): boolean {
  if (rooms.length <= 1) return true;
  const adj = new Map<string, string[]>();
  for (const p of rooms) adj.set(p.id, []);
  for (const seam of allSeams(rooms)) {
    const passable =
      seam.orientation === 'vertical' ||
      VERTICAL_KINDS.has(kindOf(rooms.find((p) => p.id === seam.aId)!)) ||
      VERTICAL_KINDS.has(kindOf(rooms.find((p) => p.id === seam.bId)!));
    if (passable) {
      adj.get(seam.aId)!.push(seam.bId);
      adj.get(seam.bId)!.push(seam.aId);
    }
  }
  const seen = new Set<string>([rooms[0].id]);
  const queue = [rooms[0].id];
  while (queue.length > 0) {
    for (const next of adj.get(queue.pop()!) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === rooms.length;
}

export function checkCondition(c: Condition, placements: Placement[]): boolean {
  const rooms = placements.filter(isRoom);
  switch (c.type) {
    case 'hasKind':
      return placements.filter((p) => kindOf(p) === c.kind).length >= (c.count ?? 1);
    case 'adjacentKinds':
      return allSeams(placements).some((seam) => {
        const ka = kindOf(placements.find((p) => p.id === seam.aId)!);
        const kb = kindOf(placements.find((p) => p.id === seam.bId)!);
        return (ka === c.a && kb === c.b) || (ka === c.b && kb === c.a);
      });
    case 'allSameTheme':
      return rooms.length > 0 && rooms.every((p) => p.theme === c.theme);
    case 'floors':
      return new Set(rooms.map((p) => p.y)).size >= c.count;
    case 'minRooms':
      return rooms.length >= c.count;
    case 'maxRooms':
      return rooms.length > 0 && rooms.length <= c.count;
    case 'connected':
      return rooms.length > 0 && isConnected(rooms);
  }
}

export function checkChallenge(ch: Challenge, placements: Placement[]): boolean {
  return ch.conditions.every((c) => checkCondition(c, placements));
}

/** Ids of all challenges the current base satisfies right now. */
export function satisfiedChallenges(placements: Placement[]): string[] {
  return CHALLENGES.filter((ch) => checkChallenge(ch, placements)).map((ch) => ch.id);
}
