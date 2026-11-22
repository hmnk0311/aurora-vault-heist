// main.js - boots Aurora Vault Heist and runs the frame loop.
// Three nights in the same bank: clear a night at the van with the
// diamond to unlock the next, bust and you retry the same night.
// The score is the haul across all three nights.

import { VIEW_W, VIEW_H, NIGHTS } from './config.js';
import { createInput } from './input.js';
import { createWorld, updateWorld } from './world.js';
import { drawWorld } from './render.js';
import { shotWorld, isShotMode } from './shots.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(location.search);
const input = createInput();

let night = 0;
let totalHaul = 0;
let world = isShotMode(params) ? shotWorld(params.get('shot') || 'start') : createWorld(0);
let last = performance.now();
let wasSeen = false;
let endPlayed = false;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!isShotMode(params)) {
    const before = world.state;
    updateWorld(world, input, dt);
    if (world.seenNow && !wasSeen && world.alarm > 30) sfx.alarm();
    wasSeen = world.seenNow;
    if (before === 'playing' && world.state === 'busted' && !endPlayed) { sfx.busted(); endPlayed = true; }
    if (before === 'playing' && world.state === 'clear' && !endPlayed) { sfx.clear(); endPlayed = true; }
    if ((world.state === 'busted' || world.state === 'clear') && input.takePressed('KeyR')) {
      if (world.state === 'clear' && night === NIGHTS.length - 1) {
        // Campaign complete: bank the third night, report the total,
        // and start a fresh campaign instead of looping Night 3.
        totalHaul += world.haul;
        const campaignTotal = totalHaul;
        totalHaul = 0;
        night = 0;
        world = createWorld(0);
        world.message = `CAMPAIGN COMPLETE - three nights banked: $${campaignTotal.toLocaleString()}. Night 1 again: beat that total.`;
      } else {
        if (world.state === 'clear') {
          totalHaul += world.haul;
          night += 1;
        }
        world = createWorld(night);
        if (night > 0 && totalHaul > 0) {
          world.message = `${NIGHTS[night].name}. Banked so far: $${totalHaul.toLocaleString()}`;
        }
      }
      endPlayed = false;
    }
    input.endFrame();
  }
  drawWorld(ctx, world);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
