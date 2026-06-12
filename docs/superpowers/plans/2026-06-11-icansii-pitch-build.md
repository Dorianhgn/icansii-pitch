# I CAN SII Pitch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, this session) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the offline single-page Three.js pitch app from `docs/superpowers/specs/2026-06-11-icansii-pitch-presentation-design.md`, driven by the baked `scene.json`, with an inside-the-cloud orbiting camera locked on the scene center.

**Architecture:** One persistent Three.js scene (200k-point cloud loaded once; slides only lerp the per-vertex color attribute) + DOM overlay layers (border, iPhone frames, pizza radar, labels) + a declarative state machine navigated by keyboard. Camera orbits a ~1m circle *inside* the cloud, `lookAt` permanently fixed to a tunable target so color-state changes never disturb motion. All config (palette, camera orbit params, timing) centralized in `src/config.ts`.

**Tech Stack:** Vite + TypeScript (vanilla, no UI framework) + Three.js (npm: `Points`/`PointsMaterial`, `CSS2DRenderer`). Vitest for the three pure-logic unit suites.

---

## Locked decisions (from clarification)

- **Camera:** lives *inside* the point cloud (indoor scene — orbiting from outside would only show the exterior shell). Orbits a small circle (default radius `1.0` m) around a target; `lookAt(target)` every frame. Tunable params in `config.ts`: `radius`, `periodSec`, `target {x,y,z}`, `shiftX`, `shiftY`, `ellipseZ`. Color-state transitions (neutral/obstacles/segmentation) must NOT alter camera motion.
- **Data:** load `scene.json` directly (no `.ply` fallback needed). Schema confirmed: `meta`, `positions` (Float-array length 600000 = 200k×3, already recentered to origin), `colors.{neutral,obstacles,segmentation}` (Uint length 600000 each), `labels` (9 × `{text, class, position:[x,y,z]}`).
- **Images:** copy real `rgb.png` + `depth.png` from the log dir now (user will swap them later). `street.jpg` (slide 1) does not exist yet (being generated) → labeled placeholder, must not crash.
- **No TDD on rendering** — unit-test only pure logic.

## Source paths

- Scene: `/home/dorian/iPhoneCanSII/logs/2026-06-11_15-45-59/scene/scene.json`
- RGB:   `/home/dorian/iPhoneCanSII/logs/2026-06-11_15-45-59/rgb.png`
- Depth: `/home/dorian/iPhoneCanSII/logs/2026-06-11_15-45-59/depth.png`

## File structure

```
icansii-pitch/
├─ index.html              # single canvas + overlay roots + loading screen
├─ package.json            # vite, typescript, three, vitest
├─ vite.config.ts
├─ tsconfig.json
├─ vitest.config.ts
├─ public/assets/
│  ├─ scene/scene.json
│  └─ images/{rgb.png, depth.png, street.jpg(placeholder)}
├─ src/
│  ├─ config.ts            # PALETTE, ORBIT, TIMING, CHIP colors
│  ├─ types.ts             # SceneData, SlideState, ChipColor, ColorState
│  ├─ main.ts              # preload → loading screen → bootstrap
│  ├─ slides.ts            # ordered list of 8 SlideState
│  ├─ state-machine.ts     # index + keyboard nav + applyState
│  ├─ color.ts             # lerpColorArrays() pure helper
│  ├─ scene/renderer.ts    # scene/camera/orbit/render loop/CSS2D
│  ├─ scene/PointCloud.ts  # load geometry, setColorState(name,{lerp})
│  ├─ scene/labels.ts      # CSS2D labels anchored to label positions
│  ├─ overlays/PhoneFrames.ts
│  ├─ overlays/PizzaFan.ts
│  ├─ overlays/Border.ts
│  └─ styles.css
└─ tests/
   ├─ state-machine.test.ts
   ├─ color.test.ts
   └─ scene-schema.test.ts
```

---

### Task 1: Scaffold project + assets

**Files:** Create `package.json`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `index.html`, `src/styles.css`. Copy assets into `public/assets/`.

- [ ] **Step 1: npm init + deps**

```bash
cd /home/dorian/icansii-pitch
npm init -y
npm install three
npm install -D vite typescript @types/three vitest jsdom
```

- [ ] **Step 2: Copy baked assets**

```bash
mkdir -p public/assets/scene public/assets/images
cp /home/dorian/iPhoneCanSII/logs/2026-06-11_15-45-59/scene/scene.json public/assets/scene/scene.json
cp /home/dorian/iPhoneCanSII/logs/2026-06-11_15-45-59/rgb.png public/assets/images/rgb.png
cp /home/dorian/iPhoneCanSII/logs/2026-06-11_15-45-59/depth.png public/assets/images/depth.png
```
Generate a placeholder `street.jpg` (dark slate, "street image pending" text) so slide 1 never 404s.

- [ ] **Step 3: tsconfig / vite / vitest config**

`tsconfig.json`: `target ES2020`, `module ESNext`, `moduleResolution bundler`, `strict true`, `lib ["ES2020","DOM"]`.
`vite.config.ts`: default static config (root = project, `build.outDir dist`).
`vitest.config.ts`: `environment 'jsdom'`, `include ['tests/**/*.test.ts']`.

- [ ] **Step 4: index.html + styles.css skeleton**

`index.html`: `#loading`, `#border`, `#canvas-root`, `#labels-root`, `#overlay-root`, `<script type="module" src="/src/main.ts">`. `styles.css`: full-screen dark (`#0a0e1a`), no scroll, cursor hide class.

- [ ] **Step 5: Verify scaffold**

Run: `npx vite build` → Expected: builds with no source yet (or stub `main.ts` logging). Confirm `public/assets/scene/scene.json` is 16.8M and served.

---

### Task 2: Config + types (single source of truth)

**Files:** Create `src/config.ts`, `src/types.ts`.

- [ ] **Step 1: types.ts**

```ts
export type ColorState = 'neutral' | 'obstacles' | 'segmentation';
export type ChipColor = 'neutral' | 'gpu' | 'ane' | 'cpu';
export interface SceneLabel { text: string; class: number; position: [number, number, number]; }
export interface SceneData {
  meta: { n_points: number; centroid: number[]; states: string[]; };
  positions: number[];                    // length N*3
  colors: Record<ColorState, number[]>;   // each length N*3, 0..255
  labels: SceneLabel[];
}
export interface SlideState {
  id: number;
  name: string;
  chip: ChipColor;                 // border color
  cloud: { visible: boolean; colorState: ColorState; dimmed: boolean };
  frames: 'hidden' | 'center' | 'corner' | 'front' | 'triple';
  showLabels: boolean;
  showPizza: boolean;
  fullImage?: string;              // slide 1 street image
  title?: string;                  // slide 0 / 7 text
}
```

- [ ] **Step 2: config.ts** — palette, orbit, timing all tunable here

```ts
export const PALETTE = {
  bg: '#0a0e1a',
  gpu: '#3ce08f',   // green  — GPU
  ane: '#a855f7',   // purple — ANE
  cpu: '#38bdf8',   // azure  — CPU
  neutral: '#2a3550',
};
// Camera: orbits INSIDE the cloud, always looking at target. Tune live.
export const ORBIT = {
  radius: 1.0,      // metres — the "±1m" circle around the target
  ellipseZ: 1.0,    // z-radius multiplier (1 = circle, >1 = ellipse)
  periodSec: 16,    // seconds per full orbit (slow)
  target: { x: 0, y: 0, z: 0 },   // recentred scene centroid
  shiftX: 0,        // horizontal camera shift (user-requested knob)
  shiftY: 0,        // vertical camera shift (user-requested knob)
  fov: 70,
};
export const TIMING = { colorLerpMs: 750, borderCrossfadeMs: 600, framesMs: 800 };
export const POINT_SIZE = 0.025;
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit` passes.

---

### Task 3: color.ts pure helper (TDD)

**Files:** Create `src/color.ts`, `tests/color.test.ts`.

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { lerpColorArrays } from '../src/color';
describe('lerpColorArrays', () => {
  it('t=0 returns from', () => {
    const out = new Float32Array(3);
    lerpColorArrays(new Uint8Array([0,0,0]), new Uint8Array([255,255,255]), 0, out);
    expect(Array.from(out)).toEqual([0,0,0]);
  });
  it('t=1 returns to (normalised 0..1)', () => {
    const out = new Float32Array(3);
    lerpColorArrays(new Uint8Array([0,0,0]), new Uint8Array([255,255,255]), 1, out);
    out.forEach(v => expect(v).toBeCloseTo(1));
  });
  it('t=0.5 midpoint', () => {
    const out = new Float32Array(3);
    lerpColorArrays(new Uint8Array([0,0,0]), new Uint8Array([255,0,0]), 0.5, out);
    expect(out[0]).toBeCloseTo(0.5);
  });
});
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run tests/color.test.ts`).

- [ ] **Step 3: Implement**

```ts
// Writes per-vertex lerp of two Uint8 color arrays into a normalised (0..1) Float32 buffer.
export function lerpColorArrays(from: Uint8Array, to: Uint8Array, t: number, out: Float32Array): void {
  for (let i = 0; i < out.length; i++) {
    const f = from[i] / 255, g = to[i] / 255;
    out[i] = f + (g - f) * t;
  }
}
```

- [ ] **Step 4: Run → PASS.**

---

### Task 4: renderer.ts — persistent scene, inside-cloud orbit camera

**Files:** Create `src/scene/renderer.ts`.

Responsibilities: create `WebGLRenderer` (antialias, full-screen, devicePixelRatio capped at 2), `PerspectiveCamera(ORBIT.fov)`, `CSS2DRenderer` overlay, resize handling, and the RAF loop. Each frame advances orbit angle from elapsed clock:

```ts
const a = (clock.getElapsedTime() / ORBIT.periodSec) * Math.PI * 2;
camera.position.set(
  ORBIT.target.x + ORBIT.shiftX + ORBIT.radius * Math.cos(a),
  ORBIT.target.y + ORBIT.shiftY,
  ORBIT.target.z + ORBIT.radius * ORBIT.ellipseZ * Math.sin(a),
);
camera.lookAt(ORBIT.target.x, ORBIT.target.y, ORBIT.target.z);
```

Expose `addToScene(obj)`, `onFrame(cb)` (for color lerp ticking), `camera`, `scene`, `labelRenderer`. Camera motion is independent of any slide state — never paused on transitions.

- [ ] **Step 1:** Implement renderer with the orbit math above.
- [ ] **Step 2: Verify** — temporary `main.ts` adds an `AxesHelper`; `npx vite` shows axes orbiting smoothly at 60 FPS, look-at fixed on origin.

---

### Task 5: PointCloud.ts — load once, swap colors with lerp

**Files:** Create `src/scene/PointCloud.ts`.

- [ ] **Step 1:** `load(data: SceneData)`: build `BufferGeometry`, set `position` from `Float32Array(data.positions)`, set `color` attribute from normalised `neutral`. `PointsMaterial({ size: POINT_SIZE, vertexColors: true, sizeAttenuation: true })`. Keep refs to all three Uint8 color arrays.
- [ ] **Step 2:** `setColorState(name, { lerp })`: if `lerp`, start a `TIMING.colorLerpMs` tween from the current displayed colors to target using `lerpColorArrays` into the color attribute (`needsUpdate = true` each tick); else snap. `tick(dt)` advances active tween. `setDimmed(bool)` scales material `opacity`/brightness for slide 6.
- [ ] **Step 3:** `setVisible(bool)` for fade-in (slide 3) / hide (slides 0–2, 7).
- [ ] **Step 4: Verify** — manual: cycling states in console lerps neutral→obstacles→segmentation with no flash, camera undisturbed.

---

### Task 6: labels.ts — CSS2D labels at COCO centroids

**Files:** Create `src/scene/labels.ts`.

- [ ] **Step 1:** For each `SceneLabel`, create a `CSS2DObject` (styled pill, class-colored) positioned at `label.position`. Group added to scene so labels track the cloud as the camera orbits.
- [ ] **Step 2:** `setVisible(bool)` toggles group; used by slide 5 only.
- [ ] **Step 3: Verify** — labels appear anchored over the right regions, stay legible as camera orbits (they billboard via CSS2D).

---

### Task 7: Border.ts — pulsing chip-colored frame

**Files:** Create `src/overlays/Border.ts` (+ styles in `styles.css`).

- [ ] **Step 1:** Inset border via pseudo-element `box-shadow`, slow ~2.5s breathing pulse (CSS keyframes on opacity/glow). `setChip(chip)` crossfades color over `TIMING.borderCrossfadeMs` by transitioning a CSS custom property `--chip-color`. Slides 0–2 → neutral/discreet.
- [ ] **Step 2: Verify** — color crossfade is smooth (no hard cut); pulse breathes.

---

### Task 8: PhoneFrames.ts — RGB/depth mockups with layout states

**Files:** Create `src/overlays/PhoneFrames.ts`.

- [ ] **Step 1:** Build two iPhone-framed `<img>` (rgb left, depth right). `setLayout(layout)` applies CSS transforms with `TIMING.framesMs` transitions: `center` (slide 2, large centered), `corner` (slides 3–5, small top-left insets), `front` (slide 6, back to foreground), `triple` (slide 7, 3 side-by-side mockups), `hidden`. Missing image → keep frame, show label, no crash.
- [ ] **Step 2: Verify** — frames glide between layouts; broken `street.jpg` placeholder does not break the page.

---

### Task 9: PizzaFan.ts — 5-cone SVG radar

**Files:** Create `src/overlays/PizzaFan.ts`.

- [ ] **Step 1:** SVG fan of 5 angular cones; `setSectors(colors[5])` paints each green/yellow/red. `setVisible(bool)`. Default demo state for slide 6 (one red sector = the branch). Slide 7 reuses it vertically (feet/torso/head) — expose `setOrientation('horizontal'|'vertical')`.
- [ ] **Step 2: Verify** — renders crisp at full screen, colors update.

---

### Task 10: slides.ts — the 8 ordered states

**Files:** Create `src/slides.ts`. Encodes the spec §5 table exactly.

```ts
import { SlideState } from './types';
export const SLIDES: SlideState[] = [
  { id:0, name:'Titre',          chip:'neutral', cloud:{visible:false,colorState:'neutral',dimmed:false}, frames:'hidden', showLabels:false, showPizza:false, title:'I CAN SII' },
  { id:1, name:'Le problème',    chip:'neutral', cloud:{visible:false,colorState:'neutral',dimmed:false}, frames:'hidden', showLabels:false, showPizza:false, fullImage:'/assets/images/street.jpg' },
  { id:2, name:'Les capteurs',   chip:'neutral', cloud:{visible:false,colorState:'neutral',dimmed:false}, frames:'center', showLabels:false, showPizza:false },
  { id:3, name:'Reconstruction', chip:'gpu',     cloud:{visible:true, colorState:'neutral',dimmed:false}, frames:'corner', showLabels:false, showPizza:false },
  { id:4, name:'Obstacles',      chip:'gpu',     cloud:{visible:true, colorState:'obstacles',dimmed:false}, frames:'corner', showLabels:false, showPizza:false },
  { id:5, name:'Compréhension',  chip:'ane',     cloud:{visible:true, colorState:'segmentation',dimmed:false}, frames:'corner', showLabels:true,  showPizza:false },
  { id:6, name:'Décision',       chip:'cpu',     cloud:{visible:true, colorState:'segmentation',dimmed:true},  frames:'front',  showLabels:false, showPizza:true },
  { id:7, name:'Verticalité',    chip:'neutral', cloud:{visible:false,colorState:'segmentation',dimmed:false}, frames:'triple', showLabels:false, showPizza:true },
];
```

- [ ] **Verify** via Task 11 test.

---

### Task 11: state-machine.ts — nav + applyState (TDD on bounds)

**Files:** Create `src/state-machine.ts`, `tests/state-machine.test.ts`, `tests/scene-schema.test.ts`.

- [ ] **Step 1: Failing tests**

`state-machine.test.ts`: `next()` past last stays at last; `prev()` past 0 stays at 0; `next` then `prev` returns to start; index never out of `[0, SLIDES.length-1]`.
`scene-schema.test.ts`: load `public/assets/scene/scene.json`; assert `positions.length === colors.neutral.length === colors.obstacles.length === colors.segmentation.length`; assert all `=== meta.n_points*3`; assert `labels.length === 9` and each label has 3-number position.

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** a pure `Navigator` class (index + `next`/`prev` clamped) separate from DOM, so it's unit-testable. `applyState(slide)` (DOM/scene side-effects) wires: `pointCloud.setVisible/.setColorState/.setDimmed`, `labels.setVisible`, `border.setChip`, `phoneFrames.setLayout`, `pizza.setVisible`, full-image overlay, title overlay. Keyboard: `ArrowRight/PageDown/Space`→next, `ArrowLeft/PageUp`→prev, `F`→fullscreen. Cursor auto-hide after inactivity.

- [ ] **Step 4: Run → PASS.**

---

### Task 12: main.ts — preload + bootstrap + loading screen

**Files:** Create `src/main.ts`.

- [ ] **Step 1:** Show `#loading`. `fetch('/assets/scene/scene.json')` + preload all images via `Image()` promises. Only when ALL resolve: build renderer, pointcloud, labels, overlays, navigator; apply slide 0; hide loading; enable keyboard. Missing asset → console warn + discreet fallback, never block. `onFrame` ticks `pointCloud.tick(dt)`.
- [ ] **Step 2: Verify** — `npx vite`: loading screen shows then app boots at slide 0; full walkthrough 0→7→0 works; 60 FPS.

---

### Task 13: Full walkthrough + perf verification

- [ ] **Step 1:** `npm run build` succeeds; `npm run preview` serves.
- [ ] **Step 2:** Manual: arrow through all 8 slides both directions, confirm: border colors gpu/ane/cpu correct; color lerps smooth; camera orbit never pauses across state changes; labels only on slide 5; pizza on 6/7; frames layout transitions; bounds clamped at ends.
- [ ] **Step 3:** Confirm offline: stop any network, reload from `preview` — still works (all assets local).
- [ ] **Step 4:** Note FPS via stats overlay (dev-only) — target stable 60.

---

## Self-review against spec

- §2 stack (Vite+TS+Three vanilla) → Tasks 1,2. ✓
- §3 persistent scene + DOM overlays + state machine → Tasks 4–12. ✓
- §4 data contract (load once, swap color attr, lerp) → Tasks 5,11(schema test). ✓
- §5 8 slides table → Task 10 (matches row-for-row). ✓
- §6 border pulse + crossfade + neutral on 0–2 → Task 7. ✓
- §7 transitions (color lerp, frame moves, labels) → Tasks 5,8,6. ✓ (rotation = inside-cloud orbit per locked decision, supersedes spec's "constant Y spin")
- §8 nav keys incl. PageDown/Space/F + bounds → Task 11. ✓
- §9 preload/loading-screen/no-crash → Task 12. ✓
- §10 YAGNI (no browser inference, no .npz, no framework) → respected. ✓

**Deviation from spec, by user instruction:** camera is an *inside-the-cloud orbit on a ~1m circle locked to center*, not the spec's "auto-rotation constante autour de l'axe Y." Documented in Locked decisions.
