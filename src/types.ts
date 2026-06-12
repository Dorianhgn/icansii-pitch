// ---- Baked scene data contract (see spec §4) ----
export type ColorState = 'neutral' | 'obstacles' | 'segmentation';

// Active chip = page border color. Maps to a brain of the phone.
export type ChipColor = 'neutral' | 'gpu' | 'ane' | 'cpu';

export interface SceneLabel {
  text: string;
  class: number; // coco_id
  position: [number, number, number];
}

export interface SceneData {
  meta: {
    n_points: number;
    centroid: number[];
    states: string[];
    [k: string]: unknown;
  };
  positions: number[]; // length N*3, already recentered to origin
  colors: Record<ColorState, number[]>; // each length N*3, values 0..255
  labels: SceneLabel[];
}

// ---- Slide / state machine ----
export type FramesLayout = 'hidden' | 'center' | 'corner' | 'front' | 'triple';

export interface SlideState {
  id: number;
  name: string;
  chip: ChipColor;
  cloud: { visible: boolean; colorState: ColorState; dimmed: boolean };
  frames: FramesLayout;
  showLabels: boolean;
  showPizza: boolean;
  fullImage?: string; // slide 1 street image path
  title?: string; // slide 0 hero text
  subtitle?: string;
}
