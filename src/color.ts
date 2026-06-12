// Per-vertex linear interpolation between two Uint8 (0..255) color buffers,
// written into a normalised (0..1) Float32 buffer suitable for a Three.js
// `color` BufferAttribute. `from`, `to`, and `out` must share length.
export function lerpColorArrays(
  from: Uint8Array,
  to: Uint8Array,
  t: number,
  out: Float32Array,
): void {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  for (let i = 0; i < out.length; i++) {
    const f = from[i] / 255;
    const g = to[i] / 255;
    out[i] = f + (g - f) * k;
  }
}

// Normalise a whole Uint8 color buffer into an existing Float32 buffer (t=1 case).
export function normaliseColors(src: Uint8Array, out: Float32Array): void {
  for (let i = 0; i < out.length; i++) out[i] = src[i] / 255;
}

// Per-vertex lerp between two ALREADY-normalised (0..1) Float32 buffers. Used by
// the live color morph, where the source is the currently displayed buffer.
export function lerpFloatArrays(
  from: Float32Array,
  to: Float32Array,
  t: number,
  out: Float32Array,
): void {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  for (let i = 0; i < out.length; i++) out[i] = from[i] + (to[i] - from[i]) * k;
}
