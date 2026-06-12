# I CAN SII — pitch 180s

Single-page, offline Three.js pitch app. Dark UI, keyboard-driven, with a baked
200k-point cloud as the centerpiece. See the spec in
`docs/superpowers/specs/` and the build plan in `docs/superpowers/plans/`.

## Run

```bash
npm install
npm run dev       # http://127.0.0.1:5173  (development)
# or, for the day-of, the static build:
npm run build
npm run preview   # http://127.0.0.1:4173
```

Then press **F** for fullscreen. Everything is local — no network needed at runtime.

## Controls

- **Advance:** → / PageDown / Space (clicker-friendly)
- **Back:** ← / PageUp
- **Fullscreen:** F
- **Hold I:** show current slide index/name (presenter helper)
- Bounds are clamped (no wrap, no crash at the ends).

## Camera (the orbit)

The camera lives **inside** the cloud (indoor scene) and orbits a small circle
around the scene center, always looking at it. Color-state changes never disturb
it. All knobs are at the top of `src/config.ts` → `ORBIT`:

```ts
radius   // the "±1m" circle (default 1.0)
ellipseZ // 1 = circle, >1 = ellipse stretched in z
periodSec// seconds per revolution (default 16, slow)
target   // point orbited & looked at (scene is recentred → {0,0,0})
shiftX   // horizontal camera shift
shiftY   // vertical camera shift
fov
```

Edit and reload — tune it by eye on the presentation machine.

## Assets

`public/assets/` holds the baked `scene/scene.json` (positions + 3 color states +
labels) and `images/{rgb,depth}.png`. The slide-1 `images/street.jpg` is optional;
until you drop it in, slide 1 shows a discreet "image pending" panel instead of
crashing. Swap any image freely — paths are in `src/config.ts` → `ASSETS`.

## Tests

```bash
npm test    # vitest: color lerp, navigation bounds, scene.json schema contract
```

## Verification status

Build, typecheck (`tsc --noEmit`), and all 16 unit tests pass; the preview server
serves every asset (200). **WebGL rendering, 60 FPS, and the orbit feel were NOT
verified here** (no GPU/browser in the build environment) — confirm those on the
real Mac before the pitch (spec §9).
