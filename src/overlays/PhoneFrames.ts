import type { FramesLayout, PhoneSpec } from '../types';
import { ASSETS } from '../config';

interface Box {
  left: string; // center X
  top: string; // center Y
  h: string; // height (vh); width follows the bezel aspect-ratio
  opacity: number;
}

// Per-layout placement of up to three iPhone mockups. Positions are by CENTER;
// height drives the size and the bezel's fixed aspect-ratio gives the width, so
// the phone never distorts. Transitions live on `.phone` in styles.css.
const LAYOUTS: Record<FramesLayout, Box[]> = {
  hidden: [
    { left: '50%', top: '50%', h: '48vh', opacity: 0 },
    { left: '50%', top: '50%', h: '48vh', opacity: 0 },
    { left: '50%', top: '50%', h: '48vh', opacity: 0 },
  ],
  center: [
    { left: '34%', top: '50%', h: '70vh', opacity: 1 },
    { left: '66%', top: '50%', h: '70vh', opacity: 1 },
    { left: '50%', top: '50%', h: '70vh', opacity: 0 },
  ],
  corner: [
    { left: '13%', top: '27%', h: '40vh', opacity: 1 },
    { left: '13%', top: '72%', h: '40vh', opacity: 1 },
    { left: '50%', top: '50%', h: '40vh', opacity: 0 },
  ],
  front: [
    { left: '32%', top: '52%', h: '62vh', opacity: 1 },
    { left: '68%', top: '52%', h: '62vh', opacity: 1 },
    { left: '50%', top: '50%', h: '62vh', opacity: 0 },
  ],
  single: [
    { left: '50%', top: '50%', h: '78vh', opacity: 1 },
    { left: '50%', top: '50%', h: '78vh', opacity: 0 },
    { left: '50%', top: '50%', h: '78vh', opacity: 0 },
  ],
  triple: [
    { left: '20%', top: '52%', h: '66vh', opacity: 1 },
    { left: '50%', top: '52%', h: '66vh', opacity: 1 },
    { left: '80%', top: '52%', h: '66vh', opacity: 1 },
  ],
};

interface PhoneEls {
  root: HTMLElement;
  img: HTMLImageElement;
  fallback: HTMLElement;
  caption: HTMLElement;
}

// Three reusable iPhone mockups. Each is a transparent-screen bezel (iphone.png)
// with a screenshot behind it. Content (src/caption) is set per slide; position
// comes from the slide's layout. Frames beyond the slide's screenshots fade out.
export class PhoneFrames {
  private phones: PhoneEls[] = [];

  constructor(root: HTMLElement) {
    for (let i = 0; i < 3; i++) {
      const phone = document.createElement('div');
      phone.className = 'phone';

      const screen = document.createElement('div');
      screen.className = 'phone-screen';
      const img = document.createElement('img');
      img.alt = '';
      const fallback = document.createElement('div');
      fallback.className = 'phone-fallback hidden';
      img.addEventListener('error', () => {
        img.style.visibility = 'hidden';
        fallback.classList.remove('hidden');
      });
      img.addEventListener('load', () => {
        img.style.visibility = 'visible';
        fallback.classList.add('hidden');
      });
      screen.appendChild(img);
      screen.appendChild(fallback);

      const bezel = document.createElement('img');
      bezel.className = 'phone-bezel';
      bezel.alt = '';
      bezel.src = ASSETS.iphone;

      const caption = document.createElement('div');
      caption.className = 'phone-caption';

      phone.appendChild(screen);
      phone.appendChild(bezel);
      phone.appendChild(caption);
      root.appendChild(phone);
      this.phones.push({ root: phone, img, fallback, caption });
    }
  }

  // Set which screenshots show and where. `specs` drives content for phones
  // 0..n-1; `layout` positions all three (extra frames fade to opacity 0).
  apply(specs: PhoneSpec[], layout: FramesLayout): void {
    const boxes = LAYOUTS[layout];
    this.phones.forEach((p, i) => {
      const spec = specs[i];
      const box = boxes[i] ?? boxes[boxes.length - 1];
      // Only show a frame that both has content AND a visible slot.
      const visible = !!spec && box.opacity > 0;

      if (spec) {
        if (p.img.getAttribute('src') !== spec.src) p.img.src = spec.src;
        p.caption.textContent = spec.caption ?? '';
        p.fallback.textContent = spec.caption ?? '';
        p.caption.style.display = spec.caption ? '' : 'none';
      }

      p.root.style.left = box.left;
      p.root.style.top = box.top;
      p.root.style.height = box.h;
      p.root.style.opacity = String(visible ? 1 : 0);
    });
  }
}
