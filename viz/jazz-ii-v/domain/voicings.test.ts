import { describe, expect, it } from 'vitest';
import { PROGRESSIONS, QUALITES, progression, transpose } from './progressions';
import { CYCLE_QUARTES } from './spelling';
import { BASSE_BAS, BASSE_HAUT, ZONE_MD, autresGuides, shells, voicings } from './voicings';

const pc = (n: number) => ((n % 12) + 12) % 12;
const total = (a: readonly number[], b: readonly number[]) => a.reduce((s, n, k) => s + Math.abs(n - b[k]!), 0);

describe('shells de main gauche', () => {
  it('posent la fondamentale en bas et une note guide juste au-dessus, dans la zone, pour toutes les grilles', () => {
    for (const p of PROGRESSIONS)
      for (const t of CYCLE_QUARTES) {
        const accords = transpose(p, t);
        shells(accords).forEach(([basse, dessus], i) => {
          const acc = accords[i]!;
          expect(pc(basse!), `${p.id} ${acc.nom}`).toBe(acc.racine);
          expect(basse!).toBeGreaterThanOrEqual(BASSE_BAS);
          expect(basse!).toBeLessThanOrEqual(BASSE_HAUT);
          expect(QUALITES[acc.qualite].guides).toContain(dessus! - basse!);
        });
      }
  });

  it('font bouger peu la note du dessus dans un ii–V–I', () => {
    for (const t of CYCLE_QUARTES) {
      const s = shells(transpose(progression('ii-v-i'), t));
      for (let i = 1; i < s.length; i++) expect(Math.abs(s[i]![1]! - s[i - 1]![1]!), `tonalité ${t}`).toBeLessThanOrEqual(7);
    }
  });
});

describe('main droite', () => {
  it('palier 1 : l’autre note guide, que le shell ne joue pas', () => {
    for (const p of PROGRESSIONS)
      for (const t of CYCLE_QUARTES) {
        const accords = transpose(p, t);
        const mg = shells(accords);
        autresGuides(accords, mg).forEach(([n], i) => {
          const acc = accords[i]!;
          const guides = QUALITES[acc.qualite].guides.map((g) => pc(acc.racine + g));
          expect(guides).toContain(pc(n!));
          expect(pc(n!)).not.toBe(pc(mg[i]![1]!));
          expect(n!).toBeGreaterThanOrEqual(55);
          expect(n!).toBeLessThanOrEqual(72);
        });
      }
  });

  it('palier 1 : la note guide de droite descend d’un demi-ton dans un ii–V–I en do (do → si → si)', () => {
    const accords = transpose(progression('ii-v-i'), 0);
    expect(autresGuides(accords, shells(accords)).map(([n]) => n)).toEqual([60, 59, 59]);
  });

  it('voicings à quatre sons : la 3ce ou la 7e en bas, dans la zone, avec les notes guides', () => {
    for (const p of PROGRESSIONS)
      for (const t of CYCLE_QUARTES) {
        const accords = transpose(p, t);
        voicings(accords, 'sansFondamentale').forEach((v, i) => {
          const acc = accords[i]!;
          const guides = QUALITES[acc.qualite].guides.map((g) => pc(acc.racine + g));
          expect(v).toHaveLength(4);
          expect(guides, `${p.id} ${acc.nom}`).toContain(pc(v[0]!));
          for (const g of guides) expect(v.map(pc)).toContain(g);
          for (const n of v) {
            expect(n).toBeGreaterThanOrEqual(ZONE_MD.bas);
            expect(n).toBeLessThanOrEqual(ZONE_MD.haut);
          }
        });
      }
  });

  it('enchaînent un ii–V–I en bougeant peu (Sol13 → Do 7M9 : fa→mi, la→sol, mi→ré)', () => {
    for (const t of CYCLE_QUARTES) {
      const v = voicings(transpose(progression('ii-v-i'), t), 'sansFondamentale');
      for (let i = 1; i < v.length; i++) expect(total(v[i]!, v[i - 1]!)).toBeLessThanOrEqual(5);
    }
  });

  it('font descendre la 7e sur la 3ce en notes guides', () => {
    const [ii, v, i] = voicings(transpose(progression('ii-v-i'), 0), 'guides');
    expect(total(v!, ii!)).toBe(1); // do → si
    expect(total(i!, v!)).toBe(1); // fa → mi
  });
});
