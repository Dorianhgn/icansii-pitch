import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SceneData } from '../src/types';

// Guards the non-negotiable contract (spec §4): identical vertex order/count
// across all three color states, so the 1:1 color lerp can never break.
const scenePath = resolve(__dirname, '../public/assets/scene/scene.json');
const data = JSON.parse(readFileSync(scenePath, 'utf-8')) as SceneData;

describe('scene.json contract', () => {
  it('positions length is n_points * 3', () => {
    expect(data.positions.length).toBe(data.meta.n_points * 3);
  });

  it('all three color states share positions length', () => {
    expect(data.colors.neutral.length).toBe(data.positions.length);
    expect(data.colors.obstacles.length).toBe(data.positions.length);
    expect(data.colors.segmentation.length).toBe(data.positions.length);
  });

  it('has the expected states', () => {
    expect(data.meta.states).toEqual(['neutral', 'obstacles', 'segmentation']);
  });

  it('color byte values are within 0..255', () => {
    // sample-check to keep the test fast
    for (const state of ['neutral', 'obstacles', 'segmentation'] as const) {
      const arr = data.colors[state];
      for (let i = 0; i < arr.length; i += 9973) {
        expect(arr[i]).toBeGreaterThanOrEqual(0);
        expect(arr[i]).toBeLessThanOrEqual(255);
      }
    }
  });

  it('labels have text, numeric class, and a 3-tuple position', () => {
    expect(data.labels.length).toBeGreaterThan(0);
    for (const l of data.labels) {
      expect(typeof l.text).toBe('string');
      expect(typeof l.class).toBe('number');
      expect(l.position).toHaveLength(3);
      l.position.forEach((c) => expect(typeof c).toBe('number'));
    }
  });
});
