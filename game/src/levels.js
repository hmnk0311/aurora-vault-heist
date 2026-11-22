// levels.js - the floor plan of the Meridian Trust bank.
// The same vault is robbed on three nights. The walls never move, but
// every night the patrols, cameras and loot layout shift a little, so
// a route that was safe yesterday has to be re-read today.
//
// Coordinates are pixels inside the floor area (below the HUD strip).
// Kinds of rect: wall (solid, blocks sight), cover (solid, blocks
// sight, drawn low so the player can plan around it), vent (a duct the
// thief can crawl through: slow, and cameras cannot see inside it).

function wall(x, y, w, h) { return { x, y, w, h, kind: 'wall' }; }
function cover(x, y, w, h, label) { return { x, y, w, h, kind: 'cover', label }; }
function vent(x, y, w, h) { return { x, y, w, h, kind: 'vent' }; }

export function buildFloor() {
  const solids = [
    // Outer shell is drawn by the renderer; these are interior walls.
    // Office (top left) - holds the keycard.
    wall(0, 128, 196, 12), wall(196, 40, 12, 100),
    // Security room (top middle) - holds the laser terminal. Its
    // bottom wall has a 40px door below the terminal, and its left
    // wall is split so the vent duct passes through a grille gap.
    wall(300, 128, 90, 12), wall(430, 128, 90, 12),
    wall(300, 40, 12, 12), wall(300, 86, 12, 54), wall(508, 40, 12, 62),
    // Gallery dividers (middle) with two gaps: a wide door and a vent.
    wall(360, 250, 12, 150), wall(360, 470, 12, 118),
    wall(620, 140, 12, 150), wall(620, 380, 12, 208),
    // Vault block (right): thick walls, one door on its left side.
    wall(700, 96, 260, 14), wall(700, 360, 260, 14), wall(946, 96, 14, 278),
    wall(700, 96, 14, 96), wall(700, 282, 14, 92),
    // Lobby furniture walls near the entry.
    wall(120, 330, 130, 12),
  ];
  const covers = [
    cover(56, 196, 54, 30, 'desk'),
    cover(120, 430, 64, 34, 'counter'),
    cover(238, 196, 44, 44, 'plant'),
    cover(420, 180, 70, 32, 'display'),
    cover(500, 320, 70, 32, 'display'),
    cover(420, 500, 64, 34, 'crate'),
    cover(540, 470, 44, 44, 'plant'),
    cover(742, 150, 52, 30, 'shelf'),
    cover(742, 300, 52, 30, 'shelf'),
  ];
  const vents = [
    // The duct runs along the top of the gallery, from the lobby
    // plant room across to a grille just outside the vault door.
    vent(228, 52, 260, 34),
    vent(560, 52, 118, 34),
  ];
  const shadows = [
    { x: 220, y: 420, w: 110, h: 70 },
    { x: 470, y: 240, w: 120, h: 60 },
    { x: 640, y: 480, w: 90, h: 70 },
  ];
  return { solids, covers, vents, shadows };
}

export function buildActors(nightIndex) {
  const guards = [
    { waypoints: [[150, 260], [300, 260], [300, 520], [150, 520]], phase: 0 },
    { waypoints: [[470, 140], [580, 140], [580, 420], [470, 420]], phase: 2 },
    { waypoints: [[660, 520], [880, 520], [880, 420], [660, 420]], phase: 4 },
  ];
  if (nightIndex >= 2) {
    guards.push({ waypoints: [[250, 90], [560, 90], [560, 200], [250, 200]], phase: 1 });
  }
  const cameras = [
    { x: 330, y: 66, base: 0.5, sweep: 0.9, phase: 0 },
    { x: 600, y: 262, base: 2.6, sweep: 1.1, phase: 2.1 },
    { x: 706, y: 386, base: -1.8, sweep: 0.8, phase: 4.2 },
  ];
  return { guards, cameras };
}

export function buildLoot(nightIndex) {
  const loot = [
    { id: 'keycard', kind: 'keycard', x: 84, y: 84, value: 0, label: 'KEYCARD' },
    { id: 'cash1', kind: 'cash', x: 455, y: 196, value: 4000, label: 'CASH' },
    { id: 'cash2', kind: 'cash', x: 535, y: 336, value: 4000, label: 'CASH' },
    { id: 'gold1', kind: 'gold', x: 660, y: 250, value: 9000, label: 'GOLD' },
    { id: 'gold2', kind: 'gold', x: 250, y: 455, value: 9000, label: 'GOLD' },
    { id: 'diamond', kind: 'diamond', x: 838, y: 232, value: 50000, label: 'AURORA DIAMOND' },
  ];
  if (nightIndex >= 1) {
    loot.push({ id: 'cash3', kind: 'cash', x: 690, y: 500, value: 6000, label: 'CASH' });
  }
  return loot;
}

export const TERMINAL = { x: 410, y: 84, w: 44, h: 26, label: 'LASER TERMINAL' };
export const VAULT_DOOR = { x: 694, y: 192, w: 26, h: 90 };
export const LASER_LINE = { x1: 632, y1: 300, x2: 700, y2: 300 };
export const EXIT_PAD = { x: 24, y: 520, w: 84, h: 56, label: 'GETAWAY VAN' };
export const START_POS = { x: 66, y: 488 };
