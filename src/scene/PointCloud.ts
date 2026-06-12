import * as THREE from 'three';
import type { ColorState, SceneData } from '../types';
import { lerpFloatArrays, normaliseColors } from '../color';
import { POINT_SIZE, DIMMED_OPACITY, TIMING } from '../config';

// Loads the baked geometry ONCE. Slides only change the per-vertex color
// attribute (morphed with a lerp) — positions/order never change, so the 1:1
// color interpolation between states is always valid.
export class PointCloud {
  readonly points: THREE.Points;
  private geometry = new THREE.BufferGeometry();
  private material: THREE.PointsMaterial;

  // Normalised (0..1) color buffers, one per state — lerp source/target.
  private colorBuffers: Record<ColorState, Float32Array>;
  private colorAttr: THREE.BufferAttribute; // Float32, normalised, what's displayed
  private displayed: Float32Array; // snapshot of current colors (lerp source)

  private currentState: ColorState = 'neutral';

  // active color tween
  private tweenFrom: Float32Array | null = null;
  private tweenTo: Float32Array | null = null;
  private tweenElapsed = 0;
  private tweenDur = 0;

  // fade tween (visibility) and dim level
  private fadeTarget = 1; // 0..1
  private fadeCurrent = 0;
  private dimFactor = 1; // 1 = bright, DIMMED_OPACITY = pushed back

  constructor(data: SceneData) {
    const n = data.positions.length / 3;

    this.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(data.positions), 3),
    );

    const toNormalised = (src: number[]): Float32Array => {
      const u = Uint8Array.from(src);
      const f = new Float32Array(u.length);
      normaliseColors(u, f);
      return f;
    };
    this.colorBuffers = {
      neutral: toNormalised(data.colors.neutral),
      obstacles: toNormalised(data.colors.obstacles),
      segmentation: toNormalised(data.colors.segmentation),
    };

    this.displayed = new Float32Array(n * 3);
    this.displayed.set(this.colorBuffers.neutral);
    this.colorAttr = new THREE.Float32BufferAttribute(this.displayed, 3);
    this.colorAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('color', this.colorAttr);

    this.material = new THREE.PointsMaterial({
      size: POINT_SIZE,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0, // starts invisible; faded in on slide 3
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  setColorState(name: ColorState, opts: { lerp: boolean } = { lerp: true }): void {
    if (name === this.currentState && !this.tweenTo) return;
    this.currentState = name;
    if (opts.lerp) {
      this.tweenFrom = this.displayed.slice();
      this.tweenTo = this.colorBuffers[name];
      this.tweenElapsed = 0;
      this.tweenDur = TIMING.colorLerpMs / 1000;
    } else {
      this.displayed.set(this.colorBuffers[name]);
      this.colorAttr.needsUpdate = true;
      this.tweenTo = null;
    }
  }

  setVisible(visible: boolean): void {
    this.fadeTarget = visible ? 1 : 0;
  }

  setDimmed(dimmed: boolean): void {
    this.dimFactor = dimmed ? DIMMED_OPACITY : 1;
  }

  tick(dtSec: number): void {
    // color morph
    if (this.tweenTo) {
      this.tweenElapsed += dtSec;
      const t = Math.min(this.tweenElapsed / this.tweenDur, 1);
      lerpFloatArrays(this.tweenFrom!, this.tweenTo, t, this.displayed);
      this.colorAttr.needsUpdate = true;
      if (t >= 1) {
        this.tweenTo = null;
        this.tweenFrom = null;
      }
    }

    // fade visibility toward target
    const fadeStep = dtSec / (TIMING.cloudFadeMs / 1000);
    if (this.fadeCurrent < this.fadeTarget) {
      this.fadeCurrent = Math.min(this.fadeCurrent + fadeStep, this.fadeTarget);
    } else if (this.fadeCurrent > this.fadeTarget) {
      this.fadeCurrent = Math.max(this.fadeCurrent - fadeStep, this.fadeTarget);
    }

    const targetOpacity = this.fadeCurrent * this.dimFactor;
    // ease material opacity toward dim*fade so slide 6 dim is smooth too
    this.material.opacity += (targetOpacity - this.material.opacity) * Math.min(dtSec * 6, 1);
    this.points.visible = this.material.opacity > 0.002;
  }
}
