import type { SlideState } from '../types';

// The outline iPhone glyph from mockup E (tmp/title-mockups/title-e.png):
// thin silver stroke, no fill, speaker slit — matches the "Phone" word color.
const PHONE_SVG = `<svg class="hero-glyph" viewBox="0 0 24 40" aria-hidden="true" ` +
  `fill="none" stroke="#cdd6ea" stroke-width="2">` +
  `<rect x="2" y="2" width="20" height="36" rx="4"/>` +
  `<line x1="9" y1="6" x2="15" y2="6"/></svg>`;

// Owns the title overlay (#title-layer). Two modes:
//  - hero  → animated "I CAN SII" → "iPhone CAN SII" reveal (slide 0)
//  - plain → static <title-text>/<title-sub> for any other titled slide
export class TitleHero {
  private played = false;

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
      // Coming back to slide 0 after the reveal already played: show the final
      // state instantly (fresh children are first styled with .play present,
      // so no transition runs).
      if (this.played) this.el.classList.add('play');
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
    this.played = true;
    this.el.classList.remove('play');
    void this.el.offsetWidth; // force reflow so re-adding restarts the transitions
    this.el.classList.add('play');
  }

  // Advance-key hook: the first "next" press on the hero slide plays the
  // reveal instead of navigating. Returns true when the press was consumed.
  consumeAdvance(): boolean {
    if (!this.el.classList.contains('hero-mode') || this.played) return false;
    this.play();
    return true;
  }
}
