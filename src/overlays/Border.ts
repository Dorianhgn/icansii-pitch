import type { ChipColor } from '../types';
import { CHIP_CSS } from '../config';

// The page border = the active chip (spec §6). Color crossfade is handled by
// the CSS transition on `--chip-color`; the slow breathing pulse is a CSS
// keyframe animation. Neutral chip (slides 0–2) is dim and discreet.
export class Border {
  private root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  setChip(chip: ChipColor): void {
    // Set on the #border element; the ::after pulse inherits these vars and the
    // CSS transition on --chip-color crossfades the color smoothly.
    this.root.style.setProperty('--chip-color', CHIP_CSS[chip]);
    // brighter glow for an active chip, dim for neutral
    this.root.style.setProperty('--chip-glow', chip === 'neutral' ? '0.22' : '0.6');
  }
}
