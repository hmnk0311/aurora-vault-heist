// guards.js - patrol guards and sweeping cameras.
// A guard walks his waypoints, pauses to look around, chases a thief
// he can see, searches the last place he saw one, and answers decoy
// coins. A camera just sweeps: patient, tireless, and blind while an
// EMP lasts.

import { GUARD_PATROL, GUARD_CHASE, GUARD_SEARCH } from './config.js';
import { hasLineOfSight, angleDelta } from './vision.js';

export function createGuard(spec, speedScale) {
  return {
    x: spec.waypoints[0][0],
    y: spec.waypoints[0][1],
    waypoints: spec.waypoints,
    wpIndex: 1,
    facing: 0,
    state: 'patrol',
    pauseLeft: 0,
    searchLeft: 0,
    targetX: 0,
    targetY: 0,
    speedScale,
    phase: spec.phase,
  };
}

function moveToward(g, tx, ty, speed, dt, blockers) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 3) return true;
  const step = Math.min(dist, speed * dt);
  const nx = g.x + (dx / dist) * step;
  const ny = g.y + (dy / dist) * step;
  if (hasLineOfSight(g.x, g.y, nx, ny, blockers)) {
    g.x = nx; g.y = ny;
  } else {
    // Slide along whichever axis stays clear.
    if (hasLineOfSight(g.x, g.y, nx, g.y, blockers)) g.x = nx;
    else if (hasLineOfSight(g.x, g.y, g.x, ny, blockers)) g.y = ny;
  }
  g.facing = Math.atan2(dy, dx);
  return dist - step < 3;
}

export function updateGuard(g, dt, world) {
  const blockers = world.blockers;
  // Lockdown: once the alarm passes the halfway mark the whole patrol
  // shifts up a gear. The meter warned you the whole way up.
  const boost = world.lockdown ? 1.22 : 1;
  if (world.seenByGuard === g && world.playerVisibleTo(g)) {
    g.state = 'chase';
    g.targetX = world.player.x;
    g.targetY = world.player.y;
    g.searchLeft = 3.2;
  }
  if (g.state === 'chase') {
    if (moveToward(g, g.targetX, g.targetY, GUARD_CHASE * g.speedScale * boost, dt, blockers)) {
      g.state = 'search';
    }
    if (!world.playerVisibleTo(g)) {
      g.searchLeft -= dt;
      if (g.searchLeft <= 0) g.state = 'search';
    }
    return;
  }
  if (g.state === 'search') {
    g.searchLeft -= dt;
    g.facing += Math.sin(world.time * 1.7 + g.phase) * dt * 1.9;
    if (moveToward(g, g.targetX, g.targetY, GUARD_SEARCH * g.speedScale * boost, dt, blockers) && g.searchLeft <= 0) {
      g.state = 'patrol';
    }
    if (g.searchLeft < -2.5) g.state = 'patrol';
    return;
  }
  if (g.state === 'investigate') {
    if (moveToward(g, g.targetX, g.targetY, GUARD_SEARCH * g.speedScale * boost, dt, blockers)) {
      g.pauseLeft = 1.4;
      g.state = 'look';
    }
    return;
  }
  if (g.state === 'look') {
    g.pauseLeft -= dt;
    g.facing += dt * 1.4;
    if (g.pauseLeft <= 0) g.state = 'patrol';
    return;
  }
  // patrol
  if (g.pauseLeft > 0) {
    g.pauseLeft -= dt;
    g.facing += Math.sin(world.time * 1.3 + g.phase) * dt * 1.2;
    return;
  }
  const [tx, ty] = g.waypoints[g.wpIndex];
  if (moveToward(g, tx, ty, GUARD_PATROL * g.speedScale * boost, dt, blockers)) {
    g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
    g.pauseLeft = 0.9;
  }
}

export function hearNoise(g, x, y) {
  if (g.state === 'chase') return;
  g.state = 'investigate';
  g.targetX = x;
  g.targetY = y;
}

export function createCamera(spec, speedScale) {
  return {
    x: spec.x, y: spec.y,
    base: spec.base, sweep: spec.sweep, phase: spec.phase,
    facing: spec.base, speedScale, disabledLeft: 0,
  };
}

export function updateCamera(c, time) {
  c.facing = c.base + Math.sin(time * 0.55 * c.speedScale + c.phase) * c.sweep;
}

export function faceToward(entity, tx, ty, dt, turnRate = 6) {
  const want = Math.atan2(ty - entity.y, tx - entity.x);
  entity.facing += angleDelta(want, entity.facing) * Math.min(1, dt * turnRate);
}
