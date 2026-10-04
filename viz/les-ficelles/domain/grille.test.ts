import { describe, expect, it } from 'vitest';
import { accordDuDegre, avecBasse, basseDe, cliche, decouper, degre, egaux, lireAccord, notesDe, symbole, transposer } from './grille';

const C = 0;
const lu = (s: string, key = C) => lireAccord(s, key)!;

describe('lireAccord', () => {
  it('lit les noms français', () => {
    expect(lireAccord('Lam', C)).toEqual({ root: 9, couleur: 'min', key: 0 });
    expect(lireAccord('La m', C)).toEqual({ root: 9, couleur: 'min', key: 0 });
    expect(lireAccord('Fa7M', C)).toEqual({ root: 5, couleur: '7M', key: 0 });
    expect(lireAccord('Sol7', C)).toEqual({ root: 7, couleur: '7', key: 0 });
    expect(lireAccord('Si♭', C)).toEqual({ root: 10, couleur: 'maj', key: 0 });
    expect(lireAccord('Sib', C)).toEqual({ root: 10, couleur: 'maj', key: 0 });
    expect(lireAccord('Si°', C)).toEqual({ root: 11, couleur: 'dim', key: 0 });
    expect(lireAccord('Do/Si', C)).toEqual({ root: 0, couleur: 'maj', key: 0, bass: 11 });
    expect(lireAccord('ré m7', 2)).toEqual({ root: 2, couleur: 'm7', key: 2 });
  });

  it('lit l\'écriture anglaise', () => {
    expect(lireAccord('Am', C)).toEqual({ root: 9, couleur: 'min', key: 0 });
    expect(lireAccord('Fmaj7', C)).toEqual({ root: 5, couleur: '7M', key: 0 });
    expect(lireAccord('C/B', C)).toEqual({ root: 0, couleur: 'maj', key: 0, bass: 11 });
    expect(lireAccord('F#m', C)).toEqual({ root: 6, couleur: 'min', key: 0 });
  });

  it('refuse ce que la page ne sait pas jouer', () => {
    for (const s of ['Csus4', 'Caug', 'Bm7b5', 'Xyz', '']) expect(lireAccord(s, C)).toBeNull();
  });
});

describe('symbole', () => {
  it('fait l\'aller-retour avec lireAccord', () => {
    for (const s of ['C', 'Am', 'Fmaj7', 'G7', 'Bdim', 'C/B', 'Am7', 'F#m', 'Bb', 'Am/G']) expect(symbole(lu(s))).toBe(s);
  });
});

describe('decouper', () => {
  it('recolle les suffixes isolés', () => {
    expect(decouper('Do La m Fa7M, Sol')).toEqual(['Do', 'Lam', 'Fa7M', 'Sol']);
    expect(decouper('Do – Lam – Fa – Sol')).toEqual(['Do', 'Lam', 'Fa', 'Sol']);
    expect(decouper('  ')).toEqual([]);
  });
});

describe('degré', () => {
  it('lit le degré dans la tonalité de l\'accord, septièmes comprises', () => {
    expect(degre(lu('Sol7'))).toBe('V');
    expect(degre(lu('Fa7M'))).toBe('IV');
    expect(degre(lu('La m7'))).toBe('vi');
    expect(degre(lu('Si°'))).toBe('vii°');
    expect(degre(lu('Mi'))).toBeNull(); // V/vi : hors de la gamme
    expect(degre(lu('Fa m'))).toBeNull(); // emprunt
  });

  it('donne l\'accord d\'un degré et le cliché dans toute tonalité', () => {
    expect(accordDuDegre('vi', C)).toEqual({ root: 9, couleur: 'min', key: 0 });
    expect(cliche(7).map((a) => a.root)).toEqual([7, 4, 0, 2]);
    expect(cliche(7).every((a) => a.key === 7)).toBe(true);
  });
});

describe('basse et transposition', () => {
  it('n\'écrit pas de basse quand c\'est la fondamentale', () => {
    const doSi = lu('Do/Si');
    expect(basseDe(doSi)).toBe(11);
    expect('bass' in avecBasse(doSi, 0)).toBe(false);
    expect(avecBasse(lu('Do'), 11)).toEqual(doSi);
  });

  it('transpose fondamentale, basse et tonalité', () => {
    expect(transposer(lu('Do/Si'), 2)).toEqual({ root: 2, couleur: 'maj', key: 2, bass: 1 });
  });

  it('donne les notes, fondamentale d\'abord', () => {
    expect(notesDe(lu('Mi7'))).toEqual([4, 8, 11, 2]);
    expect(notesDe(lu('Fa m'))).toEqual([5, 8, 0]);
  });

  it('compare deux accords', () => {
    expect(egaux(lu('Do/Si'), lu('C/B'))).toBe(true);
    expect(egaux(lu('Do'), lu('Do/Si'))).toBe(false);
  });
});
