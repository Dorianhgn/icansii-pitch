import type { SlideState } from './types';

// Pure, DOM-free navigation. Clamped at both ends (no wrap, idempotent at the
// extremities — spec §8). Unit-tested in tests/state-machine.test.ts.
export class Navigator {
  private idx = 0;
  constructor(private readonly slides: SlideState[]) {
    if (slides.length === 0) throw new Error('Navigator needs at least one slide');
  }
  get index(): number {
    return this.idx;
  }
  get length(): number {
    return this.slides.length;
  }
  current(): SlideState {
    return this.slides[this.idx];
  }
  next(): SlideState {
    if (this.idx < this.slides.length - 1) this.idx++;
    return this.current();
  }
  prev(): SlideState {
    if (this.idx > 0) this.idx--;
    return this.current();
  }
  goto(i: number): SlideState {
    this.idx = Math.max(0, Math.min(this.slides.length - 1, i));
    return this.current();
  }
}

// ---- DOM/scene side-effects (not unit-tested; verified by running) ----
import type { PointCloud } from './scene/PointCloud';
import type { Labels } from './scene/labels';
import type { Border } from './overlays/Border';
import type { PhoneFrames } from './overlays/PhoneFrames';
import type { TitleHero } from './overlays/TitleHero';

export interface Stage {
  pointCloud: PointCloud;
  labels: Labels;
  border: Border;
  phoneFrames: PhoneFrames;
  fullImageEl: HTMLElement;
  titleHero: TitleHero;
}

export function applyState(slide: SlideState, stage: Stage, lerp = true): void {
  stage.border.setChip(slide.chip);

  stage.pointCloud.setVisible(slide.cloud.visible);
  stage.pointCloud.setColorState(slide.cloud.colorState, { lerp });
  stage.pointCloud.setDimmed(slide.cloud.dimmed);

  stage.labels.setVisible(slide.showLabels);

  stage.phoneFrames.apply(slide.phones ?? [], slide.frames);

  // Full-screen problem image (slide 1), with graceful fallback if missing.
  if (slide.fullImage) {
    showFullImage(stage.fullImageEl, slide.fullImage);
  } else {
    stage.fullImageEl.classList.add('hidden');
  }

  // Title overlay (hero on slide 0, plain otherwise). The hero reveal is NOT
  // played here: it waits for the presenter's first advance key (see
  // bindKeyboard's beforeNext). Once played, render() shows the final state.
  stage.titleHero.render(slide);
}

function showFullImage(el: HTMLElement, src: string): void {
  el.classList.remove('hidden', 'placeholder');
  const probe = new Image();
  probe.onload = () => {
    el.classList.remove('placeholder');
    el.style.backgroundImage = `url("${src}")`;
  };
  probe.onerror = () => {
    el.style.backgroundImage = 'none';
    el.classList.add('placeholder'); // discreet "image pending" panel
  };
  probe.src = src;
}

const NEXT_KEYS = new Set(['ArrowRight', 'PageDown', ' ', 'Spacebar']);
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp']);

// Wires keyboard navigation + fullscreen + a hold-to-show slide index helper.
// `beforeNext` may consume an advance press (e.g. slide 0 plays its title
// reveal on the first press; the next press actually navigates).
export function bindKeyboard(
  nav: Navigator,
  onChange: (slide: SlideState) => void,
  indexEl: HTMLElement,
  beforeNext?: () => boolean,
): void {
  window.addEventListener('keydown', (e) => {
    if (NEXT_KEYS.has(e.key)) {
      e.preventDefault();
      if (beforeNext?.()) return;
      onChange(nav.next());
    } else if (PREV_KEYS.has(e.key)) {
      e.preventDefault();
      onChange(nav.prev());
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    } else if (e.key === 'i' || e.key === 'I') {
      indexEl.textContent = `${nav.index} · ${nav.current().name}`;
      indexEl.classList.add('show');
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'i' || e.key === 'I') indexEl.classList.remove('show');
  });
}

function toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}
