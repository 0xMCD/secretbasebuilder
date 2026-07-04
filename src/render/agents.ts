/**
 * Inhabitants: little ambient residents (some in spy suits) that wander the
 * base. They walk room floors, pass through the doorway seams, and climb the
 * hatches/shafts — the same connection graph the seam renderer draws is their
 * pathfinding map. Derived from placements (1 per ~2 rooms, max 8), never
 * saved: every base is simply lived-in.
 */
import { ART_CELL, allSeams, placementRect } from '../core/grid';
import { getDef } from '../core/catalog';
import type { Placement } from '../core/types';

const STAND_OFF = 48; // wall + floor band: feet sit on the visible floor
const WALK_SPEED = 110; // world px/s
const CLIMB_SPEED = 80;
const MAX_AGENTS = 8;

interface Door {
  x: number;
  toId: string;
}
interface Hatch {
  x: number;
  toId: string;
}
interface RoomNode {
  id: string;
  left: number;
  right: number;
  floorY: number;
  doors: Door[];
  hatches: Hatch[];
}

interface Agent {
  roomId: string;
  x: number;
  y: number;
  tx: number;
  mode: 'idle' | 'walk' | 'climb';
  pendingDoor: Door | null;
  pendingHatch: Hatch | null;
  climbToY: number;
  climbToId: string;
  timer: number;
  dir: 1 | -1;
  phase: number;
  spy: boolean;
  shirt: string;
  pants: string;
  skin: string;
}

const SHIRTS = ['#e86a5a', '#3a8fd4', '#7fc95c', '#ffd166', '#ff8fdc', '#c9a5ff'];
const PANTS = ['#2e3f52', '#4d3826', '#3a5f2a', '#5c2951'];
const SKINS = ['#ffd9b3', '#e8b088', '#c98a5c', '#8a5a3b'];

let rooms = new Map<string, RoomNode>();
let agents: Agent[] = [];
let signature = '';

function buildGraph(placements: Placement[]): void {
  rooms = new Map();
  const walkable = placements.filter((p) => {
    const def = getDef(p.defId);
    return def && def.layer !== 'decor';
  });
  for (const p of walkable) {
    const rect = placementRect(p)!;
    rooms.set(p.id, {
      id: p.id,
      left: rect.x * ART_CELL + 40,
      right: (rect.x + rect.w) * ART_CELL - 40,
      floorY: (rect.y + rect.h) * ART_CELL - STAND_OFF,
      doors: [],
      hatches: [],
    });
  }
  for (const seam of allSeams(walkable)) {
    const a = rooms.get(seam.aId);
    const b = rooms.get(seam.bId);
    if (!a || !b) continue;
    if (seam.orientation === 'vertical') {
      // Door drawn at the seam's bottom row: walkable only when both floors
      // sit at that row (the usual side-by-side case).
      const doorFloor = (seam.y + seam.len) * ART_CELL - STAND_OFF;
      if (a.floorY === doorFloor && b.floorY === doorFloor) {
        const x = seam.x * ART_CELL;
        a.doors.push({ x, toId: b.id });
        b.doors.push({ x, toId: a.id });
      }
    } else {
      const x = (seam.x + seam.len / 2) * ART_CELL;
      a.hatches.push({ x, toId: b.id });
      b.hatches.push({ x, toId: a.id });
    }
  }
}

function spawnAgent(seedIndex: number): Agent {
  const ids = [...rooms.keys()];
  const room = rooms.get(ids[Math.floor(Math.random() * ids.length)])!;
  const spy = seedIndex % 3 === 0; // every third resident is on duty
  return {
    roomId: room.id,
    x: room.left + Math.random() * (room.right - room.left),
    y: room.floorY,
    tx: 0,
    mode: 'idle',
    pendingDoor: null,
    pendingHatch: null,
    climbToY: 0,
    climbToId: '',
    timer: 0.5 + Math.random() * 2,
    dir: Math.random() < 0.5 ? 1 : -1,
    phase: Math.random() * 10,
    spy,
    shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)],
    pants: PANTS[Math.floor(Math.random() * PANTS.length)],
    skin: SKINS[Math.floor(Math.random() * SKINS.length)],
  };
}

/** Rebuilds the graph when the base changes; keeps surviving agents in place. */
function sync(placements: Placement[]): void {
  const sig = placements.map((p) => `${p.id}:${p.defId}:${p.x},${p.y}`).join('|');
  if (sig === signature) return;
  signature = sig;
  buildGraph(placements);
  if (rooms.size === 0) {
    agents = [];
    return;
  }
  // Keep agents whose room survived; re-home the rest.
  agents = agents.filter(() => true).map((a) => {
    const room = rooms.get(a.roomId);
    if (room) {
      a.x = Math.min(room.right, Math.max(room.left, a.x));
      if (a.mode !== 'climb') a.y = room.floorY;
      return a;
    }
    return spawnAgent(Math.floor(Math.random() * 3));
  });
  const want = Math.min(MAX_AGENTS, Math.max(1, Math.round(rooms.size / 2)));
  while (agents.length < want) agents.push(spawnAgent(agents.length));
  agents.length = want;
}

export function updateAgents(placements: Placement[], dt: number): void {
  sync(placements);
  for (const a of agents) {
    const room = rooms.get(a.roomId);
    if (!room) continue;
    a.phase += dt * (a.mode === 'walk' ? 9 : a.mode === 'climb' ? 6 : 1.5);
    if (a.mode === 'idle') {
      a.timer -= dt;
      if (a.timer <= 0) {
        const roll = Math.random();
        if (roll < 0.22 && room.doors.length > 0) {
          a.pendingDoor = room.doors[Math.floor(Math.random() * room.doors.length)];
          a.tx = a.pendingDoor.x;
        } else if (roll < 0.4 && room.hatches.length > 0) {
          a.pendingHatch = room.hatches[Math.floor(Math.random() * room.hatches.length)];
          a.tx = a.pendingHatch.x;
        } else {
          a.tx = room.left + Math.random() * (room.right - room.left);
        }
        a.dir = a.tx >= a.x ? 1 : -1;
        a.mode = 'walk';
      }
    } else if (a.mode === 'walk') {
      a.x += WALK_SPEED * dt * a.dir;
      if ((a.dir === 1 && a.x >= a.tx) || (a.dir === -1 && a.x <= a.tx)) {
        a.x = a.tx;
        if (a.pendingDoor) {
          const next = rooms.get(a.pendingDoor.toId);
          a.pendingDoor = null;
          if (next) {
            a.roomId = next.id;
            a.y = next.floorY;
            a.tx = next.left + Math.random() * (next.right - next.left);
            a.dir = a.tx >= a.x ? 1 : -1;
            a.x = Math.min(next.right, Math.max(next.left, a.x));
            continue; // keep walking into the new room next frame
          }
        } else if (a.pendingHatch) {
          const next = rooms.get(a.pendingHatch.toId);
          a.pendingHatch = null;
          if (next) {
            a.mode = 'climb';
            a.climbToY = next.floorY;
            a.climbToId = next.id;
            continue;
          }
        }
        a.mode = 'idle';
        a.timer = 0.8 + Math.random() * 3;
      }
    } else if (a.mode === 'climb') {
      const dirY = a.climbToY > a.y ? 1 : -1;
      a.y += CLIMB_SPEED * dt * dirY;
      if ((dirY === 1 && a.y >= a.climbToY) || (dirY === -1 && a.y <= a.climbToY)) {
        a.y = a.climbToY;
        a.roomId = a.climbToId;
        a.mode = 'idle';
        a.timer = 0.4 + Math.random() * 1.5;
      }
    }
  }
}

/** Draws all agents in ART_CELL world space (~66px tall pixel people). */
export function drawAgents(c: CanvasRenderingContext2D): void {
  for (const a of agents) {
    const walkBob = a.mode === 'walk' ? Math.sin(a.phase * 2) * 2 : 0;
    const x = Math.round(a.x);
    const feet = Math.round(a.y + walkBob);
    const legSwing = a.mode === 'walk' ? Math.sin(a.phase * 2) * 6 : a.mode === 'climb' ? Math.sin(a.phase * 2) * 4 : 0;
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.fillRect(x - 12, Math.round(a.y) - 2, 24, 3); // ground shadow
    // legs
    c.fillStyle = a.spy ? '#14181d' : a.pants;
    c.fillRect(x - 8 + legSwing / 2, feet - 20, 7, 20);
    c.fillRect(x + 1 - legSwing / 2, feet - 20, 7, 20);
    // body
    c.fillStyle = a.spy ? '#1c222b' : a.shirt;
    c.fillRect(x - 10, feet - 46, 20, 26);
    if (a.spy) {
      c.fillStyle = '#e8eef5';
      c.fillRect(x - 2, feet - 46, 4, 10); // shirt V
      c.fillStyle = '#8e2f3c';
      c.fillRect(x - 1, feet - 44, 2, 12); // tie
    }
    // arms (up while climbing)
    c.fillStyle = a.spy ? '#1c222b' : a.shirt;
    if (a.mode === 'climb') {
      c.fillRect(x - 14, feet - 58, 5, 16);
      c.fillRect(x + 9, feet - 58, 5, 16);
    } else {
      c.fillRect(x - 14, feet - 44, 5, 18);
      c.fillRect(x + 9, feet - 44, 5, 18);
    }
    // head
    c.fillStyle = a.skin;
    c.fillRect(x - 8, feet - 64, 16, 18);
    c.fillStyle = a.spy ? '#14181d' : a.pants; // hair
    c.fillRect(x - 8, feet - 64, 16, 5);
    if (a.spy) {
      c.fillStyle = '#14181d';
      c.fillRect(x - 8, feet - 57, 16, 5); // shades
      c.fillStyle = '#38e1ff';
      c.fillRect(x - 6, feet - 56, 4, 2);
      c.fillRect(x + 2, feet - 56, 4, 2);
    } else {
      c.fillStyle = '#14181d';
      c.fillRect(x - 5 + (a.dir === 1 ? 2 : 0), feet - 57, 2, 3); // eyes
      c.fillRect(x + 2 + (a.dir === 1 ? 2 : 0), feet - 57, 2, 3);
    }
  }
}

/** How many residents are currently home (for UI/curiosity). */
export function agentCount(): number {
  return agents.length;
}
