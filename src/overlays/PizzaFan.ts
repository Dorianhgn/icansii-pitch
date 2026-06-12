import { PALETTE } from '../config';

export type SectorColor = 'green' | 'yellow' | 'red';

const SECTOR_FILL: Record<SectorColor, string> = {
  green: PALETTE.gpu,
  yellow: '#facc15',
  red: '#ef4444',
};

const SVG_NS = 'http://www.w3.org/2000/svg';

// Radar "pizza" — 5 angular cones fanning from an apex. Colors encode proximity
// (green = clear, red = obstacle). Drives the CPU/decision story (spec §5 #6)
// and is reused vertically (feet/torso/head) on the conclusion slide (#7).
export class PizzaFan {
  private root: HTMLElement;
  private svg: SVGSVGElement;
  private wedges: SVGPathElement[] = [];
  private orientation: 'horizontal' | 'vertical' = 'horizontal';

  constructor(root: HTMLElement) {
    this.root = root;
    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('viewBox', '0 0 200 200');
    this.svg.setAttribute('width', '46vmin');
    this.svg.setAttribute('height', '46vmin');
    root.appendChild(this.svg);
    this.build();
  }

  private build(): void {
    const cx = 100;
    const cy = 170; // apex near bottom; fan opens upward
    const r = 150;
    const total = 100; // total fan spread degrees
    const start = -90 - total / 2; // centered on straight up
    const step = total / 5;

    for (let i = 0; i < 5; i++) {
      const a0 = ((start + i * step) * Math.PI) / 180;
      const a1 = ((start + (i + 1) * step) * Math.PI) / 180;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`);
      path.setAttribute('stroke', PALETTE.bg);
      path.setAttribute('stroke-width', '2');
      path.style.transition = 'fill 400ms ease';
      this.svg.appendChild(path);
      this.wedges.push(path);
    }
    this.setSectors(['green', 'green', 'red', 'green', 'green']);
  }

  setSectors(colors: SectorColor[]): void {
    this.wedges.forEach((w, i) => {
      w.setAttribute('fill', SECTOR_FILL[colors[i] ?? 'green']);
    });
  }

  setOrientation(o: 'horizontal' | 'vertical'): void {
    this.orientation = o;
    // vertical = rotate the fan to read bottom→top as feet/torso/head
    this.svg.style.transform = o === 'vertical' ? 'rotate(-90deg)' : 'none';
  }

  setVisible(visible: boolean): void {
    this.root.classList.toggle('hidden', !visible);
  }

  get currentOrientation(): 'horizontal' | 'vertical' {
    return this.orientation;
  }
}
