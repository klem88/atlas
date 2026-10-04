import { describe, expect, it } from 'vitest';
import { realiser } from '@shell/music/realisation';
import { accordDuDegre, basseDe, cliche, LABELS, notesDe, type Accord, type Grille } from '../grille';
import { FICELLES, ficelle, IDS } from './index';
import { MAX_GRILLE, TROP_LONGUE } from './type';

const deg = (l: string): Accord => accordDuDegre(l, 0);
const PAIRES: Grille[] = LABELS.flatMap((a) => LABELS.map((b) => [deg(a), deg(b)]));
const TRIPLES: Grille[] = LABELS.flatMap((a) => LABELS.flatMap((b) => LABELS.map((c) => [deg(a), deg(b), deg(c)])));
const LONGUES: Grille[] = [cliche(0), cliche(7), cliche(3), ['I', 'iii', 'vi', 'IV', 'ii', 'V', 'I', 'V'].map(deg)];

describe('le registre', () => {
  it(`a six ficelles, dans l’ordre de la page`, () => {
    expect(IDS).toEqual(['descend', 'emprunt', 'dominante', 'suspendu', 'enrichis', 'montee']);
    expect(ficelle('montee').id).toBe('montee');
  });
});

describe('le contrat, sur toutes les paires et triples de la gamme', () => {
  it(`chaque endroit s’applique, reste dans les bornes et s’explique`, () => {
    for (const g of [...PAIRES, ...TRIPLES, ...LONGUES])
      for (const f of FICELLES)
        for (const e of f.endroits(g)) {
          const r = f.appliquer(g, e);
          expect(r.grille.length).toBeLessThanOrEqual(MAX_GRILLE);
          expect(r.touches.length).toBeGreaterThan(0);
          for (const t of r.touches) expect(t >= 0 && t < r.grille.length).toBe(true);
          for (const z of f.zone(g, e)) expect(z >= 0 && z < g.length).toBe(true);
          expect(f.explique(g, e).length).toBeGreaterThan(20);
        }
  });

  it('toute grille transformée se joue à quatre voix', () => {
    for (const g of [...PAIRES, ...LONGUES])
      for (const f of FICELLES)
        for (const e of f.endroits(g)) {
          const r = f.appliquer(g, e);
          expect(() => realiser(r.grille.map((a) => ({ notes: notesDe(a), basse: basseDe(a) })))).not.toThrow();
        }
  });

  it('une grille pleine le dit, plutôt que de réclamer ce qui est déjà là', () => {
    const pleine: Grille = Array.from({ length: MAX_GRILLE }, (_, k) => cliche(0)[k % 4]!);
    for (const id of ['descend', 'emprunt', 'dominante', 'montee'] as const) {
      expect(ficelle(id).endroits(pleine)).toEqual([]);
      expect(ficelle(id).pourquoiPas(pleine)).toBe(TROP_LONGUE);
    }
    expect(ficelle('montee').pourquoiPas([...cliche(0), ...cliche(2)])).toBe('La progression est déjà montée une fois.');
  });

  it('la dominante qui annonce donne un exemple dans la tonalité', () => {
    expect(ficelle('dominante').pourquoiPas([deg('V'), deg('I')])).toContain('(par exemple Mi7 avant La m)');
    expect(ficelle('dominante').pourquoiPas([accordDuDegre('V', 7), accordDuDegre('I', 7)])).toContain('(par exemple Si7 avant Mi m)');
  });

  it('une ficelle sans endroit dit pourquoi', () => {
    for (const f of FICELLES) expect(f.pourquoiPas([deg('I'), deg('I')]).length).toBeGreaterThan(20);
  });
});
