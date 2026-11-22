// vision.js - line of sight and vision cones.
// Sight is blocked by walls and by solid cover. Vent ducts and shadow
// carpets are handled by the caller: a thief inside a vent is hidden
// from cameras, and a thief on shadow is spotted more slowly.

export function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rect at all?
  let tMin = 0;
  let tMax = 1;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const axes = [
    [x1, dx, r.x, r.x + r.w],
    [y1, dy, r.y, r.y + r.h],
  ];
  for (const [start, dir, lo, hi] of axes) {
    if (Math.abs(dir) < 1e-9) {
      if (start < lo || start > hi) return false;
    } else {
      let t1 = (lo - start) / dir;
      let t2 = (hi - start) / dir;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (const b of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return false;
  }
  return true;
}

export function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function insideCone(ox, oy, facing, halfAngle, range, px, py) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { inside: false, dist };
  const ang = Math.atan2(dy, dx);
  return { inside: Math.abs(angleDelta(ang, facing)) <= halfAngle, dist };
}

export function conePolygon(ox, oy, facing, halfAngle, range, blockers) {
  // Cast a fan of rays and stop each at the first blocker, so cones
  // bend around corners instead of shining through walls.
  const steps = 26;
  const pts = [[ox, oy]];
  for (let i = 0; i <= steps; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / steps;
    let best = range;
    const ex = ox + Math.cos(a) * range;
    const ey = oy + Math.sin(a) * range;
    for (const b of blockers) {
      const hit = rayRectDistance(ox, oy, a, b);
      if (hit !== null && hit < best) best = hit;
    }
    pts.push([ox + Math.cos(a) * best, oy + Math.sin(a) * best]);
    void ex; void ey;
  }
  return pts;
}

function rayRectDistance(ox, oy, angle, r) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let tMin = 0;
  let tMax = Infinity;
  const axes = [
    [ox, dx, r.x, r.x + r.w],
    [oy, dy, r.y, r.y + r.h],
  ];
  for (const [start, dir, lo, hi] of axes) {
    if (Math.abs(dir) < 1e-9) {
      if (start < lo || start > hi) return null;
    } else {
      let t1 = (lo - start) / dir;
      let t2 = (hi - start) / dir;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return null;
    }
  }
  return tMin > 0.01 ? tMin : null;
}

export function pointInRect(px, py, r, pad = 0) {
  return px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad;
}
