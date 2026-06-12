import type { ChipColor } from './types';

// Palette (spec §6). Tune to taste on the real presentation machine.
export const PALETTE = {
  bg: '#0a0e1a',
  gpu: '#3ce08f', // green  — GPU (reconstruction)
  ane: '#a855f7', // purple — ANE (AI / segmentation)
  cpu: '#38bdf8', // azure  — CPU (decision)
  neutral: '#2a3550',
} as const;

export const CHIP_CSS: Record<ChipColor, string> = {
  neutral: PALETTE.neutral,
  gpu: PALETTE.gpu,
  ane: PALETTE.ane,
  cpu: PALETTE.cpu,
};

// ---------------------------------------------------------------------------
// CAMERA — orbits INSIDE the point cloud (indoor scene). Always looks at the
// target. Color-state changes (neutral/obstacles/segmentation) NEVER touch
// this motion. Every value here is a live tuning knob; edit and reload.
// ---------------------------------------------------------------------------
export const ORBIT = {
  radius: 1.0, // metres — the "±1m" circle around the target
  ellipseZ: 1.0, // z-radius multiplier (1 = circle, >1 = ellipse stretched in z)
  periodSec: 16, // seconds for one full revolution (slow, calm)
  target: { x: 0, y: 0, z: 0 }, // scene already recentred to its centroid
  shiftX: 0, // horizontal camera shift (requested knob)
  shiftY: 0, // vertical camera shift (requested knob)
  fov: 70,
  near: 0.01,
  far: 100,
};

// Point rendering
export const POINT_SIZE = 0.022;
export const DIMMED_OPACITY = 0.28; // slide 6 — cloud pushed to the background

// Transition timings (ms)
export const TIMING = {
  colorLerpMs: 750, // per-vertex color morph (3→4→5)
  borderCrossfadeMs: 600,
  framesMs: 800,
  cloudFadeMs: 900,
};

// Cursor auto-hide after this idle time (ms)
export const CURSOR_IDLE_MS = 2500;

// Asset paths (served from public/). NB: filenames are UPPERCASE .PNG on disk —
// case matters on Linux/CI even if macOS resolves case-insensitively.
export const ASSETS = {
  scene: 'assets/scene/scene.json',
  iphone: 'assets/iphone/iphone.png', // transparent-screen bezel overlay
  rgb: 'assets/images/rgb.PNG',
  rgbYolo: 'assets/images/rgb-yolo.PNG', // RGB + YOLO detections (slide 5)
  depth: 'assets/images/depth.PNG',
  allPizza: 'assets/images/all-pizza.PNG', // combined radar (slide 6)
  lowPizza: 'assets/images/low-pizza.PNG', // vertical split (slide 7)
  torsoPizza: 'assets/images/torso-pizza.PNG',
  headPizza: 'assets/images/head-pizza.PNG',
  street: 'assets/images/street.jpg', // not provided yet → graceful fallback
};
