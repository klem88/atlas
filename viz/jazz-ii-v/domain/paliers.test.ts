import { describe, expect, it } from 'vitest';
import { PALIERS, encerclement, exemple } from './paliers';
import { PROGRESSIONS, dureeGrille, progression, transpose } from './progressions';

const iiVI = transpose(progression('ii-v-i'), 0);
const debuts = (n: number) => [...new Set(exemple(PALIERS[n - 1]!, iiVI, 16).map((h) => h.beat))];

describe('exemples de main gauche', () => {
  it('palier 1 : un coup de deux notes par accord, à son début', () => {
    const hits = exemple(PALIERS[0]!, iiVI, 16);
    expect(hits).toHaveLength(6);
    expect(debuts(1)).toEqual([0, 4, 8]);
  });

  it('palier 2 : Charleston, sur 1 et sur le « et » de 2 de chaque mesure', () => {
    expect(debuts(2)).toEqual([0, 1.5, 4, 5.5, 8, 9.5, 12, 13.5]);
  });

  it('palier 3 : chaque mesure est anticipée sur le « et » de 4 d’avant, retour de boucle compris', () => {
    expect(debuts(3)).toEqual([1.5, 3.5, 5.5, 7.5, 9.5, 11.5, 13.5, 15.5]);
  });

  it('paliers 4 à 6 : la main gauche du Charleston', () => {
    for (const n of [4, 5, 6]) expect(debuts(n)).toEqual(debuts(2));
  });

  it('restent dans la boucle, pour toutes les grilles', () => {
    for (const p of PROGRESSIONS)
      for (const palier of PALIERS)
        for (const h of exemple(palier, transpose(p, p.tonique), dureeGrille(p))) {
          expect(h.beat).toBeGreaterThanOrEqual(0);
          expect(h.beat).toBeLessThan(dureeGrille(p));
        }
  });
});

describe('les paliers', () => {
  it('sont numérotés de 1 à 6, chacun avec un rythme', () => {
    expect(PALIERS.map((p) => p.n)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const p of PALIERS) expect(p.rythme.length).toBeGreaterThan(0);
  });
});

describe('encerclement', () => {
  it('vise mi par fa et ré♯ quand Sol 7 va vers Do 7M', () => {
    expect(encerclement(iiVI[1]!, iiVI[2]!)).toEqual({ vers: 'Do 7M', dessus: 'fa', dessous: 'ré♯', cible: 'mi' });
  });

  it('vise si par do et la♯ quand Ré m7 va vers Sol 7', () => {
    expect(encerclement(iiVI[0]!, iiVI[1]!)).toMatchObject({ dessus: 'do', dessous: 'la♯', cible: 'si' });
  });

  it('vise la 3ce mineure en mineur (do, vers La m6)', () => {
    const mineur = transpose(progression('ii-v-i-mineur'), 9);
    expect(encerclement(mineur[1]!, mineur[2]!).cible).toBe('do');
  });
});
