// audio.js - tiny WebAudio blips, made in code, no files to load.
// A soft tick for loot, a low buzz when the alarm climbs, and a
// two-note sting on a bust or a getaway. Silent until first input.

let ctx = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function blip(freq, seconds, type = 'sine', gain = 0.05, when = 0) {
  const ac = ensure();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, ac.currentTime + when);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + when + seconds);
  osc.connect(amp).connect(ac.destination);
  osc.start(ac.currentTime + when);
  osc.stop(ac.currentTime + when + seconds);
}

export const sfx = {
  unlock() { ensure(); },
  loot() { blip(880, 0.09, 'triangle'); blip(1320, 0.12, 'triangle', 0.04, 0.07); },
  alarm() { blip(196, 0.16, 'sawtooth', 0.035); },
  tool() { blip(520, 0.08, 'square', 0.03); },
  busted() { blip(220, 0.25, 'sawtooth', 0.06); blip(147, 0.4, 'sawtooth', 0.06, 0.2); },
  clear() { blip(659, 0.12, 'triangle'); blip(880, 0.12, 'triangle', 0.05, 0.11); blip(1175, 0.22, 'triangle', 0.05, 0.22); },
};
