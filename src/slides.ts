import type { SlideState } from './types';
import { ASSETS } from './config';

// iPhone screenshot sets reused across slides.
const SENSORS = [
  { src: ASSETS.rgb, caption: 'RGB' },
  { src: ASSETS.depth, caption: 'Profondeur' },
];
const UNDERSTAND = [
  { src: ASSETS.rgbYolo, caption: 'Détection' }, // RGB + YOLO on the AI slide
  { src: ASSETS.depth, caption: 'Profondeur' },
];

// Ordered states (spec §5). The narrative climbs in intelligence:
// raw 3D → obstacles (geometry) → understanding (AI) → decision (CPU → belt).
export const SLIDES: SlideState[] = [
  {
    id: 0,
    name: 'Titre',
    chip: 'neutral',
    cloud: { visible: false, colorState: 'neutral', dimmed: false },
    frames: 'hidden',
    showLabels: false,
    hero: true,
    title: 'I CAN SII',
    subtitle: 'Pitch ton stage en 180 secondes',
  },
  {
    id: 1,
    name: 'Le problème',
    chip: 'neutral',
    cloud: { visible: false, colorState: 'neutral', dimmed: false },
    frames: 'hidden',
    showLabels: false,
    fullImage: ASSETS.street,
  },
  {
    id: 2,
    name: 'Les capteurs',
    chip: 'neutral',
    cloud: { visible: false, colorState: 'neutral', dimmed: false },
    frames: 'center',
    phones: SENSORS,
    showLabels: false,
  },
  {
    id: 3,
    name: 'Reconstruction',
    chip: 'gpu',
    cloud: { visible: true, colorState: 'neutral', dimmed: false },
    frames: 'corner',
    phones: SENSORS,
    showLabels: false,
  },
  {
    id: 4,
    name: 'Obstacles',
    chip: 'gpu',
    cloud: { visible: true, colorState: 'obstacles', dimmed: false },
    frames: 'corner',
    phones: SENSORS,
    showLabels: false,
  },
  {
    id: 5,
    name: 'Compréhension',
    chip: 'ane',
    cloud: { visible: true, colorState: 'segmentation', dimmed: false },
    frames: 'corner',
    phones: UNDERSTAND,
    showLabels: true,
  },
  {
    id: 6,
    name: 'Décision',
    chip: 'cpu',
    cloud: { visible: true, colorState: 'segmentation', dimmed: true },
    frames: 'single',
    phones: [{ src: ASSETS.allPizza, caption: 'Pizza' }],
    showLabels: false,
  },
  {
    id: 7,
    name: 'Verticalité',
    chip: 'neutral',
    cloud: { visible: false, colorState: 'segmentation', dimmed: false },
    frames: 'triple',
    phones: [
      { src: ASSETS.lowPizza, caption: 'Pieds' },
      { src: ASSETS.torsoPizza, caption: 'Torse' },
      { src: ASSETS.headPizza, caption: 'Tête' },
    ],
    showLabels: false,
  },
];
