import { describe, expect, it } from 'vitest';
import { closureTurns, curvePoints, integerRatios, precession, relativeRatios } from './curve';

describe('rapports', () => {
  it('rapports relatifs à la note la plus grave, dans l’accordage donné', () => {
    const r = relativeRatios([60, 64, 67], 'pur');
    expect(r[0]).toBe(1);
    expect(r[1]).toBeCloseTo(1.25, 12);
    expect(r[2]).toBeCloseTo(1.5, 12);
    expect(relativeRatios([67, 60], 'egal')[1]).toBeCloseTo(2 ** (7 / 12), 12);
  });
  it('rapports entiers d’un accord pur : 4:5:6 pour l’accord majeur, 2:3 pour la quinte, 10:12:15 pour le mineur', () => {
    expect(integerRatios([60, 64, 67])).toEqual([4, 5, 6]);
    expect(integerRatios([60, 67])).toEqual([2, 3]);
    expect(integerRatios([60, 63, 67])).toEqual([10, 12, 15]);
    expect(integerRatios([60, 72])).toEqual([1, 2]);
    expect(integerRatios([60])).toEqual([1]);
  });
  it('la courbe pure se referme au bout du premier entier en tours de la note grave', () => {
    expect(closureTurns([60, 64, 67])).toBe(4);
    expect(closureTurns([60, 67])).toBe(2);
    expect(closureTurns([60, 72])).toBe(1);
  });
});

describe('précession', () => {
  it('nulle pour un accord pur', () => {
    expect(precession([60, 64, 67], 'pur')).toEqual([0, 0, 0]);
  });
  it('tempérée : cycles gagnés ou perdus par période de la grave, par rapport au pur', () => {
    const p = precession([60, 64, 67], 'egal');
    expect(p[0]).toBe(0);
    expect(p[1]).toBeCloseTo(2 ** (4 / 12) - 1.25, 9); // +0,0099 cycle par tour
    expect(p[2]).toBeCloseTo(2 ** (7 / 12) - 1.5, 9); // −0,0017 cycle par tour
  });
});

describe('points de la courbe', () => {
  it('trois notes : x, y, z sont les sinus de chaque note ; deux notes : z = 0', () => {
    const pts = curvePoints([1, 1.25, 1.5], 0, 1, 4);
    expect(pts).toHaveLength(5 * 3);
    expect(pts[0]).toBeCloseTo(0, 6);
    // Au quart de la période de la grave : x = sin(π/2) = 1
    expect(pts[3]).toBeCloseTo(1, 6);
    expect(pts[4]).toBeCloseTo(Math.sin(2 * Math.PI * 1.25 * 0.25), 6);
    const flat = curvePoints([1, 1.5], 0, 1, 4);
    expect(flat[2]).toBe(0);
    expect(flat[5]).toBe(0);
  });
  it('une courbe pure recommence exactement après ses tours de fermeture', () => {
    const a = curvePoints([4, 5, 6], 0, 1, 100);
    const b = curvePoints([4, 5, 6], 1, 1, 100);
    for (let i = 0; i < a.length; i++) expect(a[i]).toBeCloseTo(b[i]!, 5);
  });
});
