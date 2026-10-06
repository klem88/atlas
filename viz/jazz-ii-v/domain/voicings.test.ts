import { describe, expect, it } from 'vitest';
import { PROGRESSIONS, QUALITES, progression, transpose } from './progressions';
import { CYCLE_QUARTES } from './spelling';
import { BAS, HAUT, voicingsMainGauche } from './voicings';

const pc = (n: number) => ((n % 12) + 12) % 12;

describe('notes guides', () => {
  it('font descendre la 7e sur la 3ce dans un ii–V–I en do', () => {
    expect(voicingsMainGauche(transpose(progression('ii-v-i'), 0), 'guides')).toEqual([
      [53, 60], // fa, do
      [53, 59], // fa, si
      [52, 59], // mi, si
    ]);
  });
});

describe('voicings sans fondamentale', () => {
  it('donnent la forme A puis B puis A sur un ii–V–I en do', () => {
    const [ii, v, i] = voicingsMainGauche(transpose(progression('ii-v-i'), 0), 'sansFondamentale');
    expect(ii!.map(pc)).toEqual([5, 9, 0, 4]); // fa la do mi
    expect(v!.map(pc)).toEqual([5, 9, 11, 4]); // fa la si mi
    expect(i!.map(pc)).toEqual([4, 7, 11, 2]); // mi sol si ré
  });

  for (const main of ['guides', 'sansFondamentale'] as const)
    it(`restent dans la zone et contiennent les notes guides (${main})`, () => {
      for (const p of PROGRESSIONS)
        for (const t of CYCLE_QUARTES) {
          const accords = transpose(p, t);
          voicingsMainGauche(accords, main).forEach((v, i) => {
            const acc = accords[i]!;
            for (const n of v) {
              expect(n).toBeGreaterThanOrEqual(BAS);
              expect(n).toBeLessThanOrEqual(HAUT);
            }
            for (const g of QUALITES[acc.qualite].guides) expect(v.map(pc), `${p.id} ${acc.nom}`).toContain(pc(acc.racine + g));
          });
        }
    });

  it('bougent peu dans un ii–V–I, quelle que soit la tonalité', () => {
    for (const t of CYCLE_QUARTES) {
      const v = voicingsMainGauche(transpose(progression('ii-v-i'), t), 'sansFondamentale');
      for (let i = 1; i < v.length; i++) {
        const total = v[i]!.reduce((s, n, k) => s + Math.abs(n - v[i - 1]![k]!), 0);
        expect(total).toBeLessThanOrEqual(5); // Sol13 → Do 7M9 : fa→mi, la→sol, mi→ré
      }
    }
  });
});
