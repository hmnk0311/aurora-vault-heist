// config.js - shared numbers for Aurora Vault Heist.
// One screen is the whole job: the canvas is the bank floor, and the
// top strip is the HUD where the alarm meter always stays visible.

export const VIEW_W = 960;
export const VIEW_H = 640;
export const HUD_H = 52;
export const FLOOR_H = VIEW_H - HUD_H;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK = 148;
export const PLAYER_TIPTOE = 74;

export const GUARD_RADIUS = 13;
export const GUARD_PATROL = 62;
export const GUARD_CHASE = 128;
export const GUARD_SEARCH = 84;

export const VISION_RANGE = 168;
export const VISION_HALF_ANGLE = 0.62;
export const CAMERA_RANGE = 190;
export const CAMERA_HALF_ANGLE = 0.42;

export const ALARM_MAX = 100;
export const ALARM_GUARD_RATE = 38;
export const ALARM_CAMERA_RATE = 24;
export const ALARM_DRAIN = 7;
export const ALARM_EMP_COST = 8;

export const EMP_CHARGES = 2;
export const EMP_SECONDS = 6;
export const DECOY_CHARGES = 3;
export const DECOY_RADIUS = 270;

export const HACK_SECONDS = 1.8;
export const VAULT_SECONDS = 2.4;

export const NIGHTS = [
  { name: 'Night 1 - First Cut', guardSpeed: 1.0, cameraSpeed: 1.0, extraGuard: false },
  { name: 'Night 2 - Tighter Rota', guardSpeed: 1.18, cameraSpeed: 1.25, extraGuard: false },
  { name: 'Night 3 - Full Lockdown Crew', guardSpeed: 1.34, cameraSpeed: 1.5, extraGuard: true },
];
