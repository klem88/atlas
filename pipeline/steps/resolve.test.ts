import { describe, expect, it } from 'vitest';
import { PriceSource } from '../../src/data/contract';
import { resolvePrice } from './resolve';

const obs = (pxm2: number | null, n = 20) => ({ pxm2, n });

describe('resolvePrice', () => {
  it('privilégie le prix communal annuel', () => {
    expect(resolvePrice({ communeAnnual: obs(3000), communeTriennial: obs(2900), epciAnnual: obs(2500) })).toEqual({
      pxm2: 3000,
      src: PriceSource.CommuneAnnual,
      rejectedOutlier: false,
    });
  });

  it('se replie dans l’ordre commune 3 ans → EPCI annuel → EPCI 3 ans', () => {
    expect(resolvePrice({ communeAnnual: obs(null, 4), communeTriennial: obs(2900) }).src).toBe(PriceSource.CommuneTriennial);
    expect(resolvePrice({ communeAnnual: obs(null), communeTriennial: obs(null), epciAnnual: obs(2500) }).src).toBe(PriceSource.EpciAnnual);
    expect(resolvePrice({ epciAnnual: obs(null), epciTriennial: obs(2400) }).src).toBe(PriceSource.EpciTriennial);
  });

  it('renvoie None quand aucune source n’est disponible', () => {
    expect(resolvePrice({})).toEqual({ pxm2: null, src: PriceSource.None, rejectedOutlier: false });
  });

  it('arrondit à l’euro', () => {
    expect(resolvePrice({ communeAnnual: obs(2666.67) }).pxm2).toBe(2667);
  });

  it('écarte les valeurs aberrantes et passe à la source suivante', () => {
    expect(resolvePrice({ communeAnnual: obs(12), communeTriennial: obs(1800) })).toEqual({
      pxm2: 1800,
      src: PriceSource.CommuneTriennial,
      rejectedOutlier: true,
    });
    expect(resolvePrice({ communeAnnual: obs(Number.NaN) }).src).toBe(PriceSource.None);
  });
});
