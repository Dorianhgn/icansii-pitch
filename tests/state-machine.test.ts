import { describe, it, expect } from 'vitest';
import { Navigator } from '../src/state-machine';
import { SLIDES } from '../src/slides';

describe('Navigator', () => {
  it('starts at 0', () => {
    expect(new Navigator(SLIDES).index).toBe(0);
  });

  it('clamps at the last slide (no wrap)', () => {
    const nav = new Navigator(SLIDES);
    for (let i = 0; i < SLIDES.length + 5; i++) nav.next();
    expect(nav.index).toBe(SLIDES.length - 1);
  });

  it('clamps at 0 going back (no wrap)', () => {
    const nav = new Navigator(SLIDES);
    nav.prev();
    nav.prev();
    expect(nav.index).toBe(0);
  });

  it('next then prev returns to start', () => {
    const nav = new Navigator(SLIDES);
    nav.next();
    nav.prev();
    expect(nav.index).toBe(0);
  });

  it('index always stays within bounds', () => {
    const nav = new Navigator(SLIDES);
    const seq = ['n', 'n', 'p', 'n', 'n', 'n', 'p', 'p', 'p', 'p'];
    for (const s of seq) {
      s === 'n' ? nav.next() : nav.prev();
      expect(nav.index).toBeGreaterThanOrEqual(0);
      expect(nav.index).toBeLessThan(SLIDES.length);
    }
  });

  it('goto clamps', () => {
    const nav = new Navigator(SLIDES);
    nav.goto(999);
    expect(nav.index).toBe(SLIDES.length - 1);
    nav.goto(-5);
    expect(nav.index).toBe(0);
  });
});
