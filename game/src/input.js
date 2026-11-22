// input.js - keyboard state for the thief.
// WASD / arrows move, Shift tiptoes, E works (hack, crack, EMP is X),
// Q drops a decoy coin, R restarts after a bust or a clean getaway.

export function createInput() {
  const held = new Set();
  const pressed = new Set();
  const codes = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyQ', 'KeyX', 'KeyR', 'Space',
  ]);
  window.addEventListener('keydown', (ev) => {
    if (codes.has(ev.code)) ev.preventDefault();
    if (!held.has(ev.code)) pressed.add(ev.code);
    held.add(ev.code);
  });
  window.addEventListener('keyup', (ev) => { held.delete(ev.code); });
  window.addEventListener('blur', () => { held.clear(); });

  return {
    moveVector() {
      let x = 0;
      let y = 0;
      if (held.has('KeyA') || held.has('ArrowLeft')) x -= 1;
      if (held.has('KeyD') || held.has('ArrowRight')) x += 1;
      if (held.has('KeyW') || held.has('ArrowUp')) y -= 1;
      if (held.has('KeyS') || held.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
      return { x, y };
    },
    tiptoe() { return held.has('ShiftLeft') || held.has('ShiftRight'); },
    interact() { return held.has('KeyE') || held.has('Space'); },
    takePressed(code) {
      if (pressed.has(code)) { pressed.delete(code); return true; }
      return false;
    },
    endFrame() { pressed.clear(); },
  };
}
