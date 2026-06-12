import type { SlideState } from '../types';

// The lit-screen iPhone glyph that emerges from the "I" (mockup variant E5).
// Self-contained SVG: its own fills are immune to the parent's background-clip:text.
const PHONE_SVG = `<svg class="hero-glyph" viewBox="0 0 60 120" aria-hidden="true">` +
  `<defs><linearGradient id="heroScreen" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0" stop-color="#cfe6ff"/><stop offset=".5" stop-color="#8fb8ff"/>` +
  `<stop offset="1" stop-color="#6f8cff"/></linearGradient></defs>` +
  `<rect x="3" y="3" width="54" height="114" rx="15" fill="none" stroke="#cfd6e6" stroke-width="4"/>` +
  `<rect x="9" y="9" width="42" height="102" rx="9" fill="url(#heroScreen)"/>` +
  `<rect x="22" y="10" width="16" height="6" rx="3" fill="#0a0e1a"/></svg>`;

// Owns the title overlay (#title-layer). Two modes:
//  - hero  → animated "I CAN SII" → "iPhone CAN SII" reveal (slide 0)
//  - plain → static <title-text>/<title-sub> for any other titled slide
export class TitleHero {
  constructor(private readonly el: HTMLElement) {}

  render(slide: SlideState): void {
    // Never clobber the structural `overlay-layer` class; only toggle our own.
    this.el.classList.remove('hidden', 'play');

    if (slide.hero) {
      // Collapsed structure reads "I CAN SII" (the space comes from hero-rest);
      // play() opens the gap and fills it with the glyph + "Phone" → "iPhone".
      this.el.classList.add('hero-mode');
      this.el.innerHTML =
        `<div class="hero">` +
        `<span class="hero-i">I</span>` +
        `<span class="hero-phone">${PHONE_SVG}<span class="hero-word">Phone</span></span>` +
        `<span class="hero-rest">&nbsp;CAN&nbsp;SII</span>` +
        `</div>` +
        (slide.subtitle ? `<div class="title-sub hero-sub">${slide.subtitle}</div>` : '');
      return;
    }

    this.el.classList.remove('hero-mode');

    if (slide.title) {
      this.el.innerHTML =
        `<div class="title-text">${slide.title}</div>` +
        (slide.subtitle ? `<div class="title-sub">${slide.subtitle}</div>` : '');
      return;
    }

    this.el.classList.add('hidden');
    this.el.innerHTML = '';
  }

  // (Re)start the reveal. No-op unless the hero is currently mounted.
  play(): void {
    if (!this.el.classList.contains('hero-mode')) return;
    this.el.classList.remove('play');
    void this.el.offsetWidth; // force reflow so re-adding restarts the transitions
    this.el.classList.add('play');
  }
}
