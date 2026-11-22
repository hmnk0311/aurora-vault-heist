// shots.js - staged scenes for the maker's screenshots.
// ?shot=start|play|alarm|clear&seed=1 freezes the game in a scene the
// real rules can reach: the thief mid-crossing with cones, cameras,
// loot and the alarm meter all in frame. The live game never reads
// this file's scenes; it only sets the first frame when asked.

import { createWorld } from './world.js';

export function shotWorld(name) {
  const world = createWorld(0);
  if (name === 'start') {
    world.player.x = 180; world.player.y = 470; world.player.facing = 0.4;
    world.message = 'Night 1: cross the lobby. The office keycard is top left.';
    return world;
  }
  if (name === 'play') {
    world.player.x = 470; world.player.y = 285; world.player.facing = 0.1;
    world.hasKeycard = true;
    world.loot.find((l) => l.id === 'keycard').taken = true;
    world.loot.find((l) => l.id === 'cash1').taken = true;
    world.haul = 4000;
    world.alarm = 22;
    world.message = 'In the gallery with the keycard - the terminal is top middle.';
    return world;
  }
  if (name === 'alarm') {
    world.player.x = 655; world.player.y = 300; world.player.facing = 0;
    world.hasKeycard = true; world.lasersOff = false;
    world.loot.find((l) => l.id === 'keycard').taken = true;
    world.alarm = 78;
    world.seenNow = true;
    world.guards[2].state = 'chase';
    world.guards[2].x = 700; world.guards[2].y = 360;
    world.message = 'SEEN at the laser line! Break line of sight or the meter fills.';
    return world;
  }
  // clear: at the van with the diamond, meter low, haul counted.
  world.player.x = 66; world.player.y = 540;
  world.hasKeycard = true; world.lasersOff = true; world.vaultOpen = true;
  world.hasDiamond = true;
  for (const l of world.loot) l.taken = true;
  world.haul = 91000;
  world.alarm = 12;
  world.state = 'clear';
  world.endReason = 'Clean getaway. Ghost bonus $15,000.';
  world.message = 'The Aurora Diamond, three nights running.';
  return world;
}

export function isShotMode(params) {
  return params.has('shot');
}
