import { describe, expect, it } from 'vitest';
import { DIATONIC } from '../../suis-les-fleches/domain/layout';
import { arcPath, CENTER, DISK, diatonicPoint, homeArc, KEY_RING, keyAngle, polar, ringRotation, SAT_DISK, satellitePoints, TONIC_DISK } from './geometry';

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('cercle', () => {
  it('I au centre, les sept disques séparés et dans le cadre', () => {
    expect(diatonicPoint('I')).toEqual({ x: CENTER, y: CENTER });
    const pts = DIATONIC.map((c) => diatonicPoint(c.label));
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) expect(dist(pts[i]!, pts[j]!)).toBeGreaterThan(DISK + TONIC_DISK);
    for (const p of pts) expect(Math.hypot(p.x - CENTER, p.y - CENTER) + DISK).toBeLessThan(KEY_RING - 20);
  });

  it("les satellites ne touchent ni la gamme, ni l'anneau, ni leurs voisins", () => {
    const items = [
      { id: 'a', anchor: 'V' },
      { id: 'b', anchor: 'V' },
      { id: 'c', anchor: 'vii°' },
      { id: 'd', anchor: 'I' },
      { id: 'e', anchor: null },
    ];
    const sat = satellitePoints(items);
    const all = [...sat.values()];
    for (const p of all) {
      for (const c of DIATONIC) expect(dist(p, diatonicPoint(c.label))).toBeGreaterThan(SAT_DISK + DISK);
      expect(Math.hypot(p.x - CENTER, p.y - CENTER) + SAT_DISK).toBeLessThan(KEY_RING - 15);
    }
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(dist(all[i]!, all[j]!)).toBeGreaterThan(2 * SAT_DISK);
  });
});

describe('anneau des tonalités', () => {
  it('Do en haut, rangé par quintes', () => {
    expect(keyAngle(0)).toBe(-90);
    expect(keyAngle(7)).toBe(-60);
    expect(keyAngle(5)).toBe(240);
  });

  it('tourne par le plus court chemin', () => {
    expect(ringRotation(0, 0, 7)).toBe(-30);
    expect(ringRotation(-30, 7, 0)).toBe(0);
    expect(ringRotation(0, 0, 5)).toBe(30);
  });

  it("l'arc de la maison à la tonalité du moment", () => {
    expect(homeArc(0, 0)).toBeNull();
    expect(homeArc(0, 7)).toEqual({ from: -90, to: -60 });
    expect(homeArc(0, 5)).toEqual({ from: -90, to: -120 });
  });

  it('trace un arc dans le bon sens', () => {
    const [x0, y0] = [polar(100, -90).x, polar(100, -90).y];
    expect(arcPath(100, -90, -60)).toBe(`M${x0.toFixed(1)},${y0.toFixed(1)} A100,100 0 0 1 ${polar(100, -60).x.toFixed(1)},${polar(100, -60).y.toFixed(1)}`);
    expect(arcPath(100, -90, -120)).toContain(' 0 0 0 ');
  });
});
