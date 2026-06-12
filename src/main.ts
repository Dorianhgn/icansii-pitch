import './styles.css';
import type { SceneData } from './types';
import { ASSETS, CURSOR_IDLE_MS } from './config';
import { Renderer } from './scene/renderer';
import { PointCloud } from './scene/PointCloud';
import { Labels } from './scene/labels';
import { Border } from './overlays/Border';
import { PhoneFrames } from './overlays/PhoneFrames';
import { PizzaFan } from './overlays/PizzaFan';
import { SLIDES } from './slides';
import { Navigator, applyState, bindKeyboard, type Stage } from './state-machine';

const $ = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing from index.html`);
  return el;
};

// Preload an image; resolves even on error so a missing asset never blocks boot.
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn(`[preload] image missing, will fall back: ${src}`);
      resolve();
    };
    img.src = src;
  });
}

async function loadScene(): Promise<SceneData> {
  const res = await fetch(ASSETS.scene);
  if (!res.ok) throw new Error(`scene.json failed to load: ${res.status}`);
  return (await res.json()) as SceneData;
}

function setLoadProgress(pct: number, status?: string): void {
  const fill = document.querySelector<HTMLElement>('.loading-bar-fill');
  if (fill) fill.style.width = `${Math.round(pct * 100)}%`;
  if (status) {
    const s = document.querySelector<HTMLElement>('.loading-status');
    if (s) s.textContent = status;
  }
}

function setupCursorAutoHide(): void {
  let timer: number | undefined;
  const reset = (): void => {
    document.body.classList.remove('cursor-hidden');
    window.clearTimeout(timer);
    timer = window.setTimeout(() => document.body.classList.add('cursor-hidden'), CURSOR_IDLE_MS);
  };
  window.addEventListener('mousemove', reset);
  reset();
}

async function bootstrap(): Promise<void> {
  // 1) Preload EVERYTHING before enabling navigation (spec §9).
  setLoadProgress(0.05, 'chargement de la scène…');
  const scenePromise = loadScene();
  const imagePromise = Promise.all([
    preloadImage(ASSETS.rgb),
    preloadImage(ASSETS.depth),
    preloadImage(ASSETS.street),
  ]);

  const data = await scenePromise;
  setLoadProgress(0.7, 'préparation du nuage…');
  await imagePromise;
  setLoadProgress(0.9, 'initialisation…');

  // 2) Build the persistent stage.
  const renderer = new Renderer($('canvas-root'), $('labels-root'));
  const pointCloud = new PointCloud(data);
  renderer.add(pointCloud.points);

  const labels = new Labels(data.labels);
  renderer.add(labels.group);

  const border = new Border($('border'));
  const phoneFrames = new PhoneFrames($('frames-layer'), [
    { src: ASSETS.rgb, caption: 'RGB' },
    { src: ASSETS.depth, caption: 'Profondeur' },
    { src: ASSETS.rgb, caption: 'Tête' },
  ]);
  const pizza = new PizzaFan($('pizza-layer'));

  const stage: Stage = {
    pointCloud,
    labels,
    border,
    phoneFrames,
    pizza,
    fullImageEl: $('full-image'),
    titleEl: $('title-layer'),
  };

  // 3) Drive color/fade tweens every frame; camera orbit is independent.
  renderer.onFrame((dt) => pointCloud.tick(dt));
  renderer.start();

  // 4) Navigation. Apply slide 0 without a lerp (instant initial state).
  const nav = new Navigator(SLIDES);

  // slide index helper element
  const indexEl = document.createElement('div');
  indexEl.id = 'slide-index';
  document.body.appendChild(indexEl);

  applyState(nav.current(), stage, false);
  bindKeyboard(nav, (slide) => applyState(slide, stage, true), indexEl);

  setupCursorAutoHide();

  // 5) Reveal.
  setLoadProgress(1, 'prêt');
  const loading = $('loading');
  loading.classList.add('done');
  window.setTimeout(() => loading.classList.add('hidden'), 600);
}

bootstrap().catch((err) => {
  console.error(err);
  const status = document.querySelector<HTMLElement>('.loading-status');
  if (status) status.textContent = `erreur de chargement : ${err.message}`;
});
