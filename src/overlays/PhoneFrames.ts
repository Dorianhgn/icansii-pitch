import type { FramesLayout } from '../types';

interface PhoneSpec {
  src: string;
  caption: string;
}

interface Box {
  left: string;
  top: string;
  w: string;
  h: string;
  opacity: number;
}

// Per-layout placement of up to three iPhone mockups. Values are vw/vh so they
// scale to any projector. Transitions are defined on `.phone` in styles.css, so
// changing these just animates the frames between staging positions.
const LAYOUTS: Record<FramesLayout, Box[]> = {
  hidden: [
    { left: '28%', top: '50%', w: '22vw', h: '48vh', opacity: 0 },
    { left: '72%', top: '50%', w: '22vw', h: '48vh', opacity: 0 },
    { left: '50%', top: '50%', w: '16vw', h: '36vh', opacity: 0 },
  ],
  center: [
    { left: '29%', top: '50%', w: '23vw', h: '50vh', opacity: 1 },
    { left: '71%', top: '50%', w: '23vw', h: '50vh', opacity: 1 },
    { left: '50%', top: '50%', w: '16vw', h: '36vh', opacity: 0 },
  ],
  corner: [
    { left: '11%', top: '20%', w: '10vw', h: '22vh', opacity: 1 },
    { left: '11%', top: '48%', w: '10vw', h: '22vh', opacity: 1 },
    { left: '50%', top: '50%', w: '16vw', h: '36vh', opacity: 0 },
  ],
  front: [
    { left: '31%', top: '52%', w: '21vw', h: '46vh', opacity: 1 },
    { left: '69%', top: '52%', w: '21vw', h: '46vh', opacity: 1 },
    { left: '50%', top: '50%', w: '16vw', h: '36vh', opacity: 0 },
  ],
  triple: [
    { left: '22%', top: '50%', w: '16vw', h: '36vh', opacity: 1 },
    { left: '50%', top: '50%', w: '16vw', h: '36vh', opacity: 1 },
    { left: '78%', top: '50%', w: '16vw', h: '36vh', opacity: 1 },
  ],
};

export class PhoneFrames {
  private phones: HTMLElement[] = [];

  constructor(root: HTMLElement, specs: PhoneSpec[]) {
    for (const spec of specs) {
      const phone = document.createElement('div');
      phone.className = 'phone';

      const img = document.createElement('img');
      img.alt = spec.caption;
      img.src = spec.src;
      // Missing asset → keep the frame, show a discreet fallback (spec §9).
      img.addEventListener('error', () => {
        img.remove();
        const fb = document.createElement('div');
        fb.className = 'phone-fallback';
        fb.textContent = spec.caption;
        phone.appendChild(fb);
      });
      phone.appendChild(img);

      const cap = document.createElement('div');
      cap.className = 'phone-caption';
      cap.textContent = spec.caption;
      phone.appendChild(cap);

      root.appendChild(phone);
      this.phones.push(phone);
    }
  }

  setLayout(layout: FramesLayout): void {
    const boxes = LAYOUTS[layout];
    this.phones.forEach((phone, i) => {
      const b = boxes[i] ?? { ...boxes[boxes.length - 1], opacity: 0 };
      phone.style.left = b.left;
      phone.style.top = b.top;
      phone.style.width = b.w;
      phone.style.height = b.h;
      phone.style.transform = 'translate(-50%, -50%)';
      phone.style.opacity = String(b.opacity);
    });
  }
}
