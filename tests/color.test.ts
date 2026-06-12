import { describe, it, expect } from 'vitest';
import { lerpColorArrays, normaliseColors } from '../src/color';

describe('lerpColorArrays', () => {
  it('t=0 returns the normalised `from`', () => {
    const out = new Float32Array(3);
    lerpColorArrays(new Uint8Array([0, 0, 0]), new Uint8Array([255, 255, 255]), 0, out);
    expect(Array.from(out)).toEqual([0, 0, 0]);
  });

  it('t=1 returns the normalised `to`', () => {
    const out = new Float32Array(3);
    lerpColorArrays(new Uint8Array([0, 0, 0]), new Uint8Array([255, 255, 255]), 1, out);
    out.forEach((v) => expect(v).toBeCloseTo(1));
  });

  it('t=0.5 is the midpoint', () => {
    const out = new Float32Array(3);
    lerpColorArrays(new Uint8Array([0, 0, 0]), new Uint8Array([255, 0, 0]), 0.5, out);
    expect(out[0]).toBeCloseTo(0.5);
    expect(out[1]).toBeCloseTo(0);
    expect(out[2]).toBeCloseTo(0);
  });

  it('clamps t outside [0,1]', () => {
    const out = new Float32Array(3);
    lerpColorArrays(new Uint8Array([0, 0, 0]), new Uint8Array([255, 255, 255]), 5, out);
    out.forEach((v) => expect(v).toBeCloseTo(1));
    lerpColorArrays(new Uint8Array([0, 0, 0]), new Uint8Array([255, 255, 255]), -5, out);
    out.forEach((v) => expect(v).toBeCloseTo(0));
  });
});

describe('normaliseColors', () => {
  it('divides by 255', () => {
    const out = new Float32Array(2);
    normaliseColors(new Uint8Array([255, 0]), out);
    expect(out[0]).toBeCloseTo(1);
    expect(out[1]).toBeCloseTo(0);
  });
});
