import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { ORBIT, PALETTE } from '../config';

type FrameCb = (dtSec: number) => void;

// Persistent Three.js stage. The camera orbits a small circle INSIDE the point
// cloud and always looks at ORBIT.target — this motion is owned here and is
// completely independent of slide / color state, so transitions never disturb it.
export class Renderer {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly webgl: THREE.WebGLRenderer;
  readonly labelRenderer: CSS2DRenderer;

  private clock = new THREE.Clock();
  private frameCbs: FrameCb[] = [];

  constructor(canvasRoot: HTMLElement, labelsRoot: HTMLElement) {
    this.scene.background = new THREE.Color(PALETTE.bg);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(ORBIT.fov, aspect, ORBIT.near, ORBIT.far);

    this.webgl = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.webgl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.webgl.setSize(window.innerWidth, window.innerHeight);
    canvasRoot.appendChild(this.webgl.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    Object.assign(this.labelRenderer.domElement.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      pointerEvents: 'none',
    });
    labelsRoot.appendChild(this.labelRenderer.domElement);

    window.addEventListener('resize', this.onResize);
  }

  add(obj: THREE.Object3D): void {
    this.scene.add(obj);
  }

  onFrame(cb: FrameCb): void {
    this.frameCbs.push(cb);
  }

  start(): void {
    this.webgl.setAnimationLoop(this.tick);
  }

  private tick = (): void => {
    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;

    // Inside-cloud orbit: position on a (possibly elliptical) circle of radius
    // ORBIT.radius around the target; gaze locked on the target every frame.
    const a = (t / ORBIT.periodSec) * Math.PI * 2;
    this.camera.position.set(
      ORBIT.target.x + ORBIT.shiftX + ORBIT.radius * Math.cos(a),
      ORBIT.target.y + ORBIT.shiftY,
      ORBIT.target.z + ORBIT.radius * ORBIT.ellipseZ * Math.sin(a),
    );
    this.camera.lookAt(ORBIT.target.x, ORBIT.target.y, ORBIT.target.z);

    for (const cb of this.frameCbs) cb(dt);

    this.webgl.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.webgl.setSize(w, h);
    this.labelRenderer.setSize(w, h);
  };
}
