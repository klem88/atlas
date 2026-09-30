import { describe, expect, it } from 'vitest';
import { LABEL_MIN_ZOOM, placeLabels, type LabelCandidate } from './labels';

const view = { k: 4, tx: 0, ty: 0, width: 400, height: 300 };
const c = (index: number, x: number, y: number, width = 40): LabelCandidate => ({ index, x, y, width });

describe('placeLabels', () => {
  it('ne nomme rien en vue d’ensemble', () => {
    expect(placeLabels([c(0, 50, 50)], { ...view, k: LABEL_MIN_ZOOM - 0.5 })).toEqual([]);
  });

  it('place le nom au centre de la commune, dans le repère zoomé', () => {
    expect(placeLabels([c(0, 50, 30)], { ...view, tx: -10, ty: 5 })).toEqual([{ index: 0, x: 190, y: 125 }]);
  });

  it('garde la commune la plus importante quand deux noms se chevauchent', () => {
    const placed = placeLabels([c(7, 50, 30), c(3, 52, 31), c(9, 80, 60)], view);
    expect(placed.map((p) => p.index)).toEqual([7, 9]);
  });

  it('écarte les noms qui dépasseraient de la vue', () => {
    expect(placeLabels([c(0, 1, 30), c(1, 50, 74.5)], view)).toEqual([]);
  });
});

describe('placeLabels, densité', () => {
  it('limite le nombre de noms à la surface de la carte', () => {
    const grid = Array.from({ length: 100 }, (_, i) => c(i, 10 + (i % 10) * 8, 10 + Math.floor(i / 10) * 5, 10));
    // 400 × 300 px → 13 noms au plus.
    expect(placeLabels(grid, view).length).toBe(13);
  });
});
