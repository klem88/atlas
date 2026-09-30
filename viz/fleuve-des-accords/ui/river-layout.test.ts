import { describe, expect, it } from 'vitest';
import type { Flow } from '../domain/flow';
import { layoutRiver, ribbonPath } from './river-layout';

const flow: Flow = {
  left: [
    { token: 1, label: 'I', value: 60 },
    { token: 2, label: 'V', value: 40 },
  ],
  right: [
    { token: 2, label: 'V', value: 50 },
    { token: 1, label: 'I', value: 50 },
  ],
  links: [
    { from: 1, to: 2, value: 50, share: 50 / 60 },
    { from: 1, to: 1, value: 10, share: 10 / 60 },
    { from: 2, to: 1, value: 40, share: 1 },
  ],
  total: 100,
};

describe('géométrie du fleuve', () => {
  it('empile les nœuds proportionnellement et sans chevauchement', () => {
    const l = layoutRiver(flow, { width: 400, height: 206, gap: 6, padTop: 0, padBottom: 0 });
    expect(l.left[0]!.h).toBeCloseTo(120);
    expect(l.left[1]!.h).toBeCloseTo(80);
    expect(l.left[1]!.y).toBeCloseTo(126);
    expect(l.right[0]!.h).toBeCloseTo(100);
  });
  it('fait sortir les rubans dans l’ordre et les fait rentrer sans se chevaucher', () => {
    const l = layoutRiver(flow, { width: 400, height: 206, gap: 6, padTop: 0, padBottom: 0 });
    const fromI = l.ribbons.filter((r) => r.from === 1);
    expect(fromI[0]!.y0a).toBeCloseTo(0);
    expect(fromI[0]!.y0b).toBeCloseTo(100);
    expect(fromI[1]!.y0a).toBeCloseTo(100);
    expect(fromI[1]!.y0b).toBeCloseTo(120);
    const intoI = l.ribbons.filter((r) => r.to === 1).sort((a, b) => a.y1a - b.y1a);
    expect(intoI[0]!.y1a).toBeCloseTo(106);
    expect(intoI[1]!.y1a).toBeCloseTo(intoI[0]!.y1b);
    expect(intoI[1]!.y1b).toBeCloseTo(206);
  });
  it('écrit un chemin fermé', () => {
    const l = layoutRiver(flow, { width: 400, height: 200 });
    expect(ribbonPath(l.ribbons[0]!)).toMatch(/^M.*Z$/);
  });
});
