// render.js - draws one frame of the heist on the canvas.
// The palette is the plan at a glance: midnight floors, gold loot,
// amber guard cones, red camera cones, teal shadow you can hide in,
// and a scarlet laser line you cross at your peril.

import { VIEW_W, VIEW_H, HUD_H, ALARM_MAX, HACK_SECONDS, VAULT_SECONDS, NIGHTS } from './config.js';
import { TERMINAL, VAULT_DOOR, LASER_LINE, EXIT_PAD } from './levels.js';
import { conePolygon } from './vision.js';

const INK = '#0b1020';
const FLOOR = '#1b2440';
const FLOOR_ALT = '#202a4a';

export function drawWorld(ctx, world) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawHud(ctx, world);
  ctx.save();
  ctx.translate(0, HUD_H);
  drawFloor(ctx, world);
  drawZones(ctx, world);
  drawLoot(ctx, world);
  drawFixtures(ctx, world);
  drawCones(ctx, world);
  drawActors(ctx, world);
  drawOverlays(ctx, world);
  ctx.restore();
}

function drawHud(ctx, world) {
  ctx.fillStyle = '#0e1530';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#f5d76e';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('AURORA VAULT HEIST', 14, 32);
  ctx.fillStyle = '#8fa3c8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(`NIGHT ${world.nightIndex + 1}/${NIGHTS.length}`, 14, 47);
  ctx.fillStyle = '#cfe3ff';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`Haul $${world.haul.toLocaleString()}`, 250, 32);
  ctx.fillText(`EMP ${world.empLeft}  •  Coins ${world.decoyLeft}`, 400, 32);
  ctx.fillText(world.hasKeycard ? 'Keycard ✓' : 'Keycard —', 560, 32);
  // The alarm meter: always on screen, always honest.
  ctx.fillStyle = '#3a1420';
  ctx.fillRect(700, 14, 240, 22);
  const frac = world.alarm / ALARM_MAX;
  ctx.fillStyle = frac > 0.7 ? '#ff4757' : frac > 0.35 ? '#ffa502' : '#2ed573';
  ctx.fillRect(702, 16, 236 * frac, 18);
  ctx.strokeStyle = '#e8ecf8';
  ctx.strokeRect(700, 14, 240, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ALARM', 792, 29);
  if (world.lockdown) {
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('LOCKDOWN WATCH', 700, 45);
  }
  drawObjectives(ctx, world);
}

// The job in five steps, always on screen: a first-time viewer can
// read the whole heist plan off a single screenshot.
function drawObjectives(ctx, world) {
  const steps = [
    ['KEYCARD', world.hasKeycard],
    ['LASERS', world.lasersOff],
    ['VAULT', world.vaultOpen],
    ['DIAMOND', world.hasDiamond],
    ['GETAWAY', world.state === 'clear'],
  ];
  ctx.fillStyle = 'rgba(9,13,28,0.55)';
  ctx.fillRect(230, 2, 470, 15);
  ctx.font = 'bold 10px system-ui, sans-serif';
  let x = 236;
  steps.forEach(([label, done], i) => {
    ctx.fillStyle = done ? '#2ed573' : '#8fa3c8';
    const text = `${done ? '✓' : '▢'} ${label}`;
    ctx.fillText(text, x, 13);
    x += ctx.measureText(text).width + 14;
    void i;
  });
}

function drawFloor(ctx, world) {
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H - HUD_H);
  ctx.fillStyle = FLOOR_ALT;
  for (let x = 0; x < VIEW_W; x += 48) {
    for (let y = 0; y < VIEW_H - HUD_H; y += 48) {
      if ((x + y) / 48 % 2 === 0) ctx.fillRect(x, y, 48, 48);
    }
  }
  ctx.strokeStyle = '#39477a';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, VIEW_W - 4, VIEW_H - HUD_H - 4);
  roomLabel(ctx, 'OFFICE', 60, 30);
  roomLabel(ctx, 'SECURITY', 350, 30);
  roomLabel(ctx, 'GALLERY', 440, 470);
  roomLabel(ctx, 'VAULT', 790, 130);
  roomLabel(ctx, 'LOBBY', 130, 300);
  void world;
}

function roomLabel(ctx, text, x, y) {
  ctx.fillStyle = 'rgba(207,227,255,0.35)';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(text, x, y);
}

function drawZones(ctx, world) {
  for (const s of world.shadows) {
    ctx.fillStyle = 'rgba(46,213,115,0.13)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(46,213,115,0.4)';
    ctx.strokeRect(s.x, s.y, s.w, s.h);
  }
  for (const v of world.vents) {
    ctx.fillStyle = '#2c3a5e';
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = '#7f8db3';
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(v.x, v.y, v.w, v.h);
    ctx.setLineDash([]);
    ctx.fillStyle = '#aebadd';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('VENT', v.x + 6, v.y + 21);
  }
  // Getaway pad.
  ctx.fillStyle = world.hasDiamond ? 'rgba(46,213,115,0.35)' : 'rgba(255,255,255,0.08)';
  ctx.fillRect(EXIT_PAD.x, EXIT_PAD.y, EXIT_PAD.w, EXIT_PAD.h);
  ctx.strokeStyle = '#2ed573';
  ctx.strokeRect(EXIT_PAD.x, EXIT_PAD.y, EXIT_PAD.w, EXIT_PAD.h);
  // The getaway van, side-on: body, cab, windshield and wheels, so
  // the exit reads as a vehicle and not a labelled rectangle.
  const vx = EXIT_PAD.x + 6;
  const vy = EXIT_PAD.y + 10;
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(vx, vy, 72, 30);
  ctx.fillStyle = '#85c1e9';
  ctx.fillRect(vx + 52, vy + 5, 14, 10);
  ctx.fillStyle = '#f5d76e';
  ctx.fillRect(vx + 68, vy + 18, 4, 6);
  ctx.fillStyle = '#10162e';
  ctx.beginPath(); ctx.arc(vx + 16, vy + 32, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(vx + 56, vy + 32, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dff5e6';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText('GETAWAY VAN', EXIT_PAD.x + 4, EXIT_PAD.y + 8);
}

function drawFixtures(ctx, world) {
  for (const r of world.solids) {
    ctx.fillStyle = '#4a587f';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  for (const r of world.covers) {
    ctx.fillStyle = '#6b4f2a';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#c99a4a';
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
  // Laser terminal.
  ctx.fillStyle = world.lasersOff ? '#2ed573' : '#ff6b81';
  ctx.fillRect(TERMINAL.x, TERMINAL.y, TERMINAL.w, TERMINAL.h);
  ctx.fillStyle = '#10162e';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.fillText('LASER', TERMINAL.x + 6, TERMINAL.y + 16);
  // Vault door.
  ctx.fillStyle = world.vaultOpen ? '#57607e' : '#d4af37';
  ctx.fillRect(VAULT_DOOR.x, VAULT_DOOR.y, VAULT_DOOR.w, VAULT_DOOR.h);
  ctx.fillStyle = '#10162e';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText(world.vaultOpen ? 'OPEN' : 'VAULT', VAULT_DOOR.x - 2, VAULT_DOOR.y + 48);
  // The vault wheel: spokes on the door face.
  const wx = VAULT_DOOR.x + 13;
  const wy = VAULT_DOOR.y + 45;
  ctx.strokeStyle = '#10162e';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(wx, wy, 9, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI * i) / 3 + 0.4;
    ctx.beginPath();
    ctx.moveTo(wx - Math.cos(a) * 9, wy - Math.sin(a) * 9);
    ctx.lineTo(wx + Math.cos(a) * 9, wy + Math.sin(a) * 9);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  // Set dressing: framed art on the gallery wall, gold piles waiting
  // inside the vault, and the bank's name over the lobby counter.
  ctx.fillStyle = '#5b2a86';
  ctx.fillRect(612, 200, 26, 38);
  ctx.fillRect(612, 440, 26, 38);
  ctx.strokeStyle = '#c99a4a';
  ctx.strokeRect(612, 200, 26, 38);
  ctx.strokeRect(612, 440, 26, 38);
  for (const [gx, gy] of [[786, 318], [872, 148], [872, 330]]) {
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(gx, gy, 30, 9);
    ctx.fillRect(gx + 4, gy - 8, 22, 8);
    ctx.fillRect(gx + 8, gy - 15, 14, 7);
    ctx.strokeStyle = '#a87f1f';
    ctx.strokeRect(gx, gy, 30, 9);
  }
  ctx.fillStyle = 'rgba(245,215,110,0.5)';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('MERIDIAN TRUST', 96, 318);
  // Laser beam across the vault corridor.
  if (!world.lasersOff) {
    ctx.strokeStyle = '#ff2e4d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(LASER_LINE.x1, LASER_LINE.y1);
    ctx.lineTo(LASER_LINE.x2, LASER_LINE.y2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

function drawLoot(ctx, world) {
  for (const item of world.loot) {
    if (item.taken) continue;
    if (item.kind === 'diamond') {
      ctx.fillStyle = '#7ee8fa';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 14);
      ctx.lineTo(item.x + 12, item.y);
      ctx.lineTo(item.x, item.y + 14);
      ctx.lineTo(item.x - 12, item.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    } else if (item.kind === 'keycard') {
      ctx.fillStyle = '#ffdd59';
      ctx.fillRect(item.x - 11, item.y - 7, 22, 14);
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#8e44ad';
      ctx.fillRect(item.x - 14, item.y - 11, 28, 22);
      ctx.strokeStyle = '#f5d76e';
      ctx.lineWidth = 2;
      ctx.strokeRect(item.x - 14, item.y - 11, 28, 22);
      ctx.lineWidth = 1;
      ctx.fillStyle = '#f39c12';
      ctx.beginPath(); ctx.arc(item.x + 5, item.y - 3, 4, 0, Math.PI * 2); ctx.fill();
    } else if (item.kind === 'gold') {
      ctx.fillStyle = '#f5d76e';
      ctx.fillRect(item.x - 12, item.y - 6, 24, 12);
      ctx.strokeStyle = '#a87f1f';
      ctx.strokeRect(item.x - 12, item.y - 6, 24, 12);
    } else {
      ctx.fillStyle = '#7bed9f';
      ctx.fillRect(item.x - 11, item.y - 7, 22, 14);
      ctx.fillStyle = '#14532d';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillText('$', item.x - 3, item.y + 4);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillText(item.label, item.x - 16, item.y + 26);
  }
}

function drawCones(ctx, world) {
  for (const c of world.cameras) {
    if (c.disabledLeft > 0) continue;
    const pts = conePolygon(c.x, c.y, c.facing, 0.42, 190, world.blockers);
    fillCone(ctx, pts, 'rgba(255,46,77,0.30)');
  }
  for (const g of world.guards) {
    const pts = conePolygon(g.x, g.y, g.facing, 0.62, 168, world.blockers);
    fillCone(ctx, pts, g.state === 'chase' ? 'rgba(255,71,87,0.42)' : 'rgba(255,165,2,0.30)');
  }
}

function fillCone(ctx, pts, style) {
  ctx.fillStyle = style;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function drawActors(ctx, world) {
  for (const d of world.decoys) {
    ctx.fillStyle = '#ffeaa7';
    ctx.beginPath(); ctx.arc(d.x, d.y, 5, 0, Math.PI * 2); ctx.fill();
    // Sound rings off the coin: you can see what the guards hear.
    ctx.strokeStyle = 'rgba(255,234,167,0.6)';
    const ring = 10 + (world.time * 14) % 16;
    ctx.beginPath(); ctx.arc(d.x, d.y, ring, 0, Math.PI * 2); ctx.stroke();
  }
  for (const c of world.cameras) {
    ctx.fillStyle = c.disabledLeft > 0 ? '#57607e' : '#ff2e4d';
    ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillText('CAM', c.x - 10, c.y - 12);
  }
  for (const g of world.guards) {
    // Navy uniform, amber vest stripe, cap brim toward his facing:
    // a guard reads as a guard at a glance, not a token.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(g.x + 2, g.y + 3, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#46587e';
    ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = g.state === 'chase' ? '#ff4757' : '#ffa502';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.lineWidth = 1;
    // Head with a navy cap, turned toward his facing.
    const hx = g.x + Math.cos(g.facing) * 3;
    const hy = g.y + Math.sin(g.facing) * 3;
    ctx.fillStyle = '#e8b08a';
    ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1d2739';
    ctx.beginPath();
    ctx.arc(hx, hy, 6, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineTo(hx + Math.cos(g.facing) * 8, hy + Math.sin(g.facing) * 8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffa502';
    ctx.fillRect(g.x - 9, g.y + 8, 18, 3);
    if (g.state === 'chase' || g.state === 'search') {
      ctx.fillStyle = '#ff4757';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('!', g.x - 3, g.y - 20);
    } else if (g.state === 'investigate' || g.state === 'look') {
      ctx.fillStyle = '#ffeaa7';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText('?', g.x - 4, g.y - 20);
    }
  }
  const p = world.player;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.arc(p.x + 2, p.y + 3, 13, 0, Math.PI * 2); ctx.fill();
  // The loot bag on his back: grey when empty, gold once the
  // diamond is in it - the screenshot tells you how the job is going.
  ctx.fillStyle = world.hasDiamond ? '#f5d76e' : '#57607e';
  ctx.fillRect(p.x - Math.cos(p.facing) * 10 - 7, p.y - Math.sin(p.facing) * 10 - 7, 14, 14);
  ctx.fillStyle = p.inVent ? '#48dbfb' : '#eccc68';
  ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#10162e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.facing) * 15, p.y + Math.sin(p.facing) * 15);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText('THIEF', p.x - 16, p.y - 20);
  if (world.seenNow) {
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('SEEN!', p.x - 18, p.y - 34);
  }
}

function drawOverlays(ctx, world) {
  // Danger vignette: the frame itself closes in when the job is hot.
  if (world.state === 'playing' && (world.seenNow || world.lockdown)) {
    const pulse = 0.35 + 0.2 * Math.sin(world.time * 6);
    ctx.strokeStyle = `rgba(255,46,77,${world.seenNow ? pulse : 0.3})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, VIEW_W - 10, VIEW_H - HUD_H - 10);
    ctx.lineWidth = 1;
  }
  ctx.fillStyle = 'rgba(9,13,28,0.88)';
  ctx.fillRect(0, VIEW_H - HUD_H - 30, VIEW_W, 30);
  ctx.fillStyle = '#e8ecf8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(world.message, 12, VIEW_H - HUD_H - 10);
  if (world.workKind) {
    const total = world.workKind === 'hack' ? HACK_SECONDS : VAULT_SECONDS;
    ctx.fillStyle = '#f5d76e';
    ctx.fillRect(360, 250, 240 * Math.max(0, 1 - world.workLeft / total), 10);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(360, 250, 240, 10);
  }
  if (world.state !== 'playing') {
    ctx.fillStyle = 'rgba(5,8,20,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H - HUD_H);
    ctx.fillStyle = world.state === 'clear' ? '#2ed573' : '#ff4757';
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.fillText(world.state === 'clear' ? 'CLEAN GETAWAY!' : 'BUSTED', 300, 270);
    ctx.fillStyle = '#ffffff';
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText(world.endReason, 300, 305);
    ctx.fillText(`Haul $${world.haul.toLocaleString()} - press R`, 300, 335);
  }
}
