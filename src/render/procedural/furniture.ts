/**
 * Painter registry: kind id → interior painter.
 * To add a module kind: add its entry in src/content/modules.json, then a
 * painter in roomsHome / roomsFun / roomsOps (shared props live in kit.ts)
 * and register it here. Unknown kinds fall back to a generic room.
 */
import {
  ceilingLamp, crate, plant, poster, type Interior, type Painter,
} from './kit';
import {
  bathroomP, bedroomP, buffetP, chillP, classroomP, closetP, diningP,
  greenhouseP, hallwayP, kitchenP, libraryP, livingP, storageP,
} from './roomsHome';
import {
  aquariumP, arcadeP, baseballP, basketballP, dinoexhibitP, dojoP,
  entertainmentP, footballP, gamingdenP, gameroomP, junglegymP, lavaP, nerfP,
  petstoreP, poolP, skateparkP, soccerP, theaterP, trampolineP, vrroomP,
} from './roomsFun';
import {
  commandP, elevatorP, garageP, gemmineP, labP, ladderP, observatoryP,
  racegarageP, siloP, stairsP, vaultP,
} from './roomsOps';

export type { Interior, Painter };

/** Fallback for kinds with no painter yet: generic room with accent sign. */
const genericP: Painter = (ctx, room, pal, rng, _def, theme) => {
  ceilingLamp(ctx, pal, theme, room.x + room.w / 2, room.y);
  crate(ctx, pal, room.x + 20, room.floor - 48, 48);
  poster(ctx, pal, room.x + room.w / 2 - 28, room.y + 28, 56, 36);
  if (rng.chance(0.5)) plant(ctx, pal, room.x + room.w - 48, room.floor);
};

export const PAINTERS: Record<string, Painter> = {
  // home & living
  bedroom: bedroomP,
  kitchen: kitchenP,
  hallway: hallwayP,
  bathroom: bathroomP,
  storage: storageP,
  living: livingP,
  dining: diningP,
  chill: chillP,
  buffet: buffetP,
  library: libraryP,
  greenhouse: greenhouseP,
  // fun & sports
  entertainment: entertainmentP,
  gameroom: gameroomP,
  theater: theaterP,
  pool: poolP,
  lava: lavaP,
  trampoline: trampolineP,
  nerf: nerfP,
  junglegym: junglegymP,
  football: footballP,
  soccer: soccerP,
  basketball: basketballP,
  baseball: baseballP,
  closet: closetP,
  classroom: classroomP,
  vrroom: vrroomP,
  gamingden: gamingdenP,
  dinoexhibit: dinoexhibitP,
  arcade: arcadeP,
  aquarium: aquariumP,
  petstore: petstoreP,
  dojo: dojoP,
  skatepark: skateparkP,
  // ops & infrastructure
  lab: labP,
  command: commandP,
  vault: vaultP,
  garage: garageP,
  racegarage: racegarageP,
  gemmine: gemmineP,
  observatory: observatoryP,
  elevator: elevatorP,
  stairs: stairsP,
  ladder: ladderP,
  silo: siloP,
};

export function getPainter(kind: string): Painter {
  return PAINTERS[kind] ?? genericP;
}
