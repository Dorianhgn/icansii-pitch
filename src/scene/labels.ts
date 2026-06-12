import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { SceneLabel } from '../types';

// Deterministic per-class color so a label's pill matches its segmentation hue
// family (purely cosmetic — keeps the slide-5 overlay legible). HSL by coco_id.
function classColor(cocoId: number): string {
  const hue = (cocoId * 47) % 360;
  return `hsl(${hue}, 70%, 65%)`;
}

// Floating CSS2D labels anchored at each object's centroid. Because they live
// in the scene graph, they track the cloud as the camera orbits, and CSS2D
// keeps them screen-facing and legible.
export class Labels {
  readonly group = new THREE.Group();

  constructor(labels: SceneLabel[]) {
    for (const l of labels) {
      const el = document.createElement('div');
      el.className = 'cloud-label';
      el.textContent = l.text;
      el.style.color = classColor(l.class);

      const obj = new CSS2DObject(el);
      obj.position.set(l.position[0], l.position[1], l.position[2]);
      this.group.add(obj);
    }
    this.group.visible = false;
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }
}
