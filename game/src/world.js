// world.js - the state of one night's job, and its rules.
// The thief crosses the floor, lifts loot, works the terminal and the
// vault door, spends tools that cost alarm, and has to be standing at
// the van with the diamond when the job is done. Being seen fills the
// alarm meter; a full meter is a bust, fairly warned the whole way.

import {
  PLAYER_RADIUS, PLAYER_WALK, PLAYER_TIPTOE, VISION_RANGE, VISION_HALF_ANGLE,
  CAMERA_RANGE, CAMERA_HALF_ANGLE, ALARM_MAX, ALARM_GUARD_RATE,
  ALARM_CAMERA_RATE, ALARM_DRAIN, ALARM_EMP_COST, EMP_CHARGES, EMP_SECONDS,
  DECOY_CHARGES, HACK_SECONDS, VAULT_SECONDS, NIGHTS,
} from './config.js';
import { buildFloor, buildActors, buildLoot, TERMINAL, VAULT_DOOR, LASER_LINE, EXIT_PAD, START_POS } from './levels.js';
import { createGuard, updateGuard, createCamera, updateCamera, hearNoise } from './guards.js';
import { hasLineOfSight, insideCone, pointInRect } from './vision.js';

export function createWorld(nightIndex) {
  const floor = buildFloor();
  const actors = buildActors(nightIndex);
  const night = NIGHTS[nightIndex];
  const world = {
    nightIndex,
    time: 0,
    state: 'playing',
    player: { x: START_POS.x, y: START_POS.y, facing: 0, tiptoe: false, inVent: false, inShadow: false },
    solids: floor.solids,
    covers: floor.covers,
    vents: floor.vents,
    shadows: floor.shadows,
    blockers: [...floor.solids, ...floor.covers],
    guards: actors.guards.map((g) => createGuard(g, night.guardSpeed)),
    cameras: actors.cameras.map((c) => createCamera(c, night.cameraSpeed)),
    loot: buildLoot(nightIndex),
    alarm: 0,
    seenNow: false,
    seenByGuard: null,
    empLeft: EMP_CHARGES,
    decoyLeft: DECOY_CHARGES,
    empTimer: 0,
    decoys: [],
    hasKeycard: false,
    lasersOff: false,
    vaultOpen: false,
    hasDiamond: false,
    workKind: null,
    workLeft: 0,
    haul: 0,
    lockdown: false,
    message: 'Lift the KEYCARD from the office, then work the LASER TERMINAL.',
    endReason: '',
    laserTrippedAt: -99,
  };
  world.playerVisibleTo = (watcher) => visibleTo(world, watcher);
  return world;
}

function visibleTo(world, watcher) {
  const p = world.player;
  if (p.inVent) return false;
  const isCamera = watcher.disabledLeft !== undefined;
  if (isCamera && watcher.disabledLeft > 0) return false;
  const range = isCamera ? CAMERA_RANGE : VISION_RANGE;
  const half = isCamera ? CAMERA_HALF_ANGLE : VISION_HALF_ANGLE;
  const probe = insideCone(watcher.x, watcher.y, watcher.facing, half, range, p.x, p.y);
  if (!probe.inside) return false;
  return hasLineOfSight(watcher.x, watcher.y, p.x, p.y, world.blockers);
}

function collides(world, x, y) {
  if (x < PLAYER_RADIUS || x > 960 - PLAYER_RADIUS) return true;
  if (y < PLAYER_RADIUS || y > 588 - PLAYER_RADIUS) return true;
  for (const b of world.blockers) {
    if (x + PLAYER_RADIUS > b.x && x - PLAYER_RADIUS < b.x + b.w) {
      if (y + PLAYER_RADIUS > b.y && y - PLAYER_RADIUS < b.y + b.h) return true;
    }
  }
  if (!world.vaultOpen) {
    const d = VAULT_DOOR;
    if (x + PLAYER_RADIUS > d.x && x - PLAYER_RADIUS < d.x + d.w &&
        y + PLAYER_RADIUS > d.y && y - PLAYER_RADIUS < d.y + d.h) return true;
  }
  return false;
}

function crossesLaser(world, px, py) {
  if (world.lasersOff) return false;
  const { x1, y1, x2, y2 } = LASER_LINE;
  const cross = (px - x1) * (y2 - y1) - (py - y1) * (x2 - x1);
  const along = (px - x1) * (x2 - x1) + (py - y1) * (y2 - y1);
  const len2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  return Math.abs(cross) < 260 && along > 0 && along < len2;
}

export function updateWorld(world, input, dt) {
  if (world.state !== 'playing') return;
  world.time += dt;
  const p = world.player;

  // Movement, with a slower crawl inside the vents.
  const mv = input.moveVector();
  p.tiptoe = input.tiptoe();
  p.inVent = world.vents.some((v) => pointInRect(p.x, p.y, v));
  p.inShadow = world.shadows.some((s) => pointInRect(p.x, p.y, s));
  let speed = p.tiptoe ? PLAYER_TIPTOE : PLAYER_WALK;
  if (p.inVent) speed *= 0.55;
  if (mv.x !== 0 || mv.y !== 0) {
    p.facing = Math.atan2(mv.y, mv.x);
    const nx = p.x + mv.x * speed * dt;
    const ny = p.y + mv.y * speed * dt;
    if (!collides(world, nx, p.y)) p.x = nx;
    if (!collides(world, p.x, ny)) p.y = ny;
  }

  // Tools: EMP fries the cameras for a while but the surge is noticed;
  // a decoy coin pulls the nearest guard who can hear it.
  if (input.takePressed('KeyX') && world.empLeft > 0 && world.empTimer <= 0) {
    world.empLeft -= 1;
    world.empTimer = EMP_SECONDS;
    world.alarm = Math.min(ALARM_MAX, world.alarm + ALARM_EMP_COST);
    for (const c of world.cameras) c.disabledLeft = EMP_SECONDS;
    world.message = 'EMP fired - cameras are blind. Move now.';
  }
  if (input.takePressed('KeyQ') && world.decoyLeft > 0) {
    world.decoyLeft -= 1;
    const dx = p.x + Math.cos(p.facing) * 120;
    const dy = p.y + Math.sin(p.facing) * 120;
    world.decoys.push({ x: dx, y: dy, left: 4 });
    for (const g of world.guards) {
      if (Math.hypot(g.x - dx, g.y - dy) < 270) hearNoise(g, dx, dy);
    }
    world.message = 'A coin clinks across the tiles...';
  }
  world.empTimer = Math.max(0, world.empTimer - dt);
  for (const c of world.cameras) c.disabledLeft = Math.max(0, c.disabledLeft - dt);
  world.decoys = world.decoys.filter((d) => (d.left -= dt) > 0);

  // Work: hacking, cracking and lifting all take standing still.
  updateWork(world, input, dt);

  // Loot pickup.
  for (const item of world.loot) {
    if (item.taken) continue;
    if (Math.hypot(p.x - item.x, p.y - item.y) < 26) {
      if (item.kind === 'diamond' && !world.vaultOpen) continue;
      item.taken = true;
      world.haul += item.value;
      if (item.kind === 'keycard') { world.hasKeycard = true; world.message = 'Keycard lifted. The vault door will open for you now.'; }
      else if (item.kind === 'diamond') { world.hasDiamond = true; world.message = 'THE AURORA DIAMOND IS YOURS. Get to the van!'; }
      else world.message = `${item.label} bagged: $${item.value.toLocaleString()}`;
    }
  }

  // Lasers.
  if (crossesLaser(world, p.x, p.y) && world.time - world.laserTrippedAt > 1.2) {
    world.laserTrippedAt = world.time;
    world.alarm = Math.min(ALARM_MAX, world.alarm + 30);
    world.message = 'You clipped a laser beam!';
  }

  // Watchers.
  for (const c of world.cameras) updateCamera(c, world.time);
  world.seenNow = false;
  world.seenByGuard = null;
  let strongest = 0;
  for (const g of world.guards) {
    if (visibleTo(world, g)) {
      world.seenNow = true;
      world.seenByGuard = g;
      strongest = Math.max(strongest, ALARM_GUARD_RATE);
    }
  }
  for (const c of world.cameras) {
    if (visibleTo(world, c)) {
      world.seenNow = true;
      strongest = Math.max(strongest, ALARM_CAMERA_RATE);
    }
  }
  if (world.seenNow) {
    let rate = strongest;
    if (p.tiptoe) rate *= 0.55;
    if (p.inShadow) rate *= 0.5;
    world.alarm = Math.min(ALARM_MAX, world.alarm + rate * dt);
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM_DRAIN * dt);
  }
  // Lockdown watch: past halfway on the meter, patrols speed up.
  const wasLockdown = world.lockdown;
  world.lockdown = world.alarm >= ALARM_MAX * 0.55;
  if (world.lockdown && !wasLockdown) {
    world.message = 'LOCKDOWN WATCH - the patrols pick up the pace!';
  }
  for (const g of world.guards) updateGuard(g, dt, world);

  // A guard who reaches the thief ends the night, meter or not.
  for (const g of world.guards) {
    if (Math.hypot(g.x - p.x, g.y - p.y) < 24 && !p.inVent) {
      return bust(world, 'A guard got a hand on you.');
    }
  }
  if (world.alarm >= ALARM_MAX) return bust(world, 'The alarm hit full and the vault locked down.');

  // Escape.
  if (world.hasDiamond && pointInRect(p.x, p.y, EXIT_PAD)) {
    world.state = 'clear';
    const ghost = world.alarm < 25 ? 15000 : world.alarm < 60 ? 6000 : 0;
    world.haul += ghost;
    world.endReason = ghost > 0 ? `Clean getaway. Ghost bonus $${ghost.toLocaleString()}.` : 'You got out, loud but rich.';
  }
}

function bust(world, reason) {
  world.state = 'busted';
  world.endReason = reason;
}

function startWork(world, kind, seconds) {
  // workKind persists between frames while the same job is held, so
  // the timer only starts on the first frame of a new job.
  if (world.workKind !== kind) { world.workKind = kind; world.workLeft = seconds; }
}

function updateWork(world, input, dt) {
  const p = world.player;
  if (!input.interact()) { world.workKind = null; world.workLeft = 0; return; }
  const nearTerminal = Math.abs(p.x - (TERMINAL.x + 22)) < 52 && Math.abs(p.y - (TERMINAL.y + 44)) < 52;
  const nearVault = Math.abs(p.x - (VAULT_DOOR.x - 18)) < 44 && Math.abs(p.y - (VAULT_DOOR.y + 45)) < 70;
  if (nearTerminal && !world.lasersOff) {
    startWork(world, 'hack', HACK_SECONDS);
    world.workLeft -= dt;
    world.message = 'Hacking the laser terminal... hold E.';
    if (world.workLeft <= 0) { world.lasersOff = true; world.message = 'Lasers dark. The vault corridor is open.'; }
    return;
  }
  if (nearVault && !world.vaultOpen) {
    if (!world.hasKeycard) { world.message = 'The vault door wants a KEYCARD (office, top left).'; return; }
    startWork(world, 'vault', VAULT_SECONDS);
    world.workLeft -= dt;
    world.message = 'Working the vault door... hold E.';
    if (world.workLeft <= 0) { world.vaultOpen = true; world.message = 'The vault swings open. Take the diamond.'; }
    return;
  }
  world.workKind = null;
  world.workLeft = 0;
}
