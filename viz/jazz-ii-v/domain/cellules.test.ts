import { describe, expect, it } from 'vitest';
import { abcNotes, abcWarnings } from '@shell/music/score';
import { abcCellule, armure, cleAbc } from './abc';
import { FENETRE, MD_BAS, MD_HAUT, cellule, type Cellule } from './cellules';
import { notesDuMode } from './modes';
import { PALIERS } from './paliers';
import { PROGRESSIONS, QUALITES, progression, transpose } from './progressions';
import { CYCLE_QUARTES } from './spelling';
import { voicingsMainGauche } from './voicings';

const pc = (n: number) => ((n % 12) + 12) % 12;

function celluleDe(id: string, tonique: number, n: number): Cellule {
  const accords = transpose(progression(id), tonique);
  const palier = PALIERS[n - 1]!;
  return cellule(palier, accords, voicingsMainGauche(accords, palier.main));
}

const accordA = (c: Cellule, t: number) => c.accords.filter((a) => a.debut <= t).pop()!;

describe('armure', () => {
  it('nomme la tonalité pour abcjs', () => {
    expect(cleAbc(10, 'majeur')).toBe('Bb');
    expect(cleAbc(6, 'mineur')).toBe('F#m');
  });

  it('donne les altérations de la clé', () => {
    expect(armure(10, 'majeur')).toEqual([0, 0, -1, 0, 0, 0, -1]); // si♭ et mi♭
    expect(armure(9, 'mineur')).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(armure(4, 'majeur')).toEqual([1, 1, 0, 1, 1, 0, 0]); // fa♯ do♯ sol♯ ré♯
  });
});

describe('main gauche', () => {
  it('palier 2 en do : le voicing à quatre sons, en noire pointée puis croche', () => {
    const c = celluleDe('ii-v-i', 0, 2);
    expect(c.mg.slice(0, 2).map((e) => [e.debut, e.duree, e.notes])).toEqual([
      [0, 1.5, [53, 57, 60, 64]], // fa la do mi
      [1.5, 0.5, [53, 57, 60, 64]],
    ]);
    expect(c.mg[0]!.noms).toEqual(['fa', 'la', 'do', 'mi']);
  });

  it('palier 3 : l’accord de la mesure 2 arrive sur le « et » de 4 de la mesure 1', () => {
    const c = celluleDe('ii-v-i', 0, 3);
    expect(c.mg.map((e) => e.debut)).toContain(3.5);
    expect(c.mg.find((e) => e.debut === 3.5)!.notes.map(pc)).toEqual([5, 9, 11, 4]); // fa la si mi : Sol 7
  });

  it('palier 1 : 3ce et 7e tenues', () => {
    const c = celluleDe('ii-v-i', 0, 1);
    expect(c.mg.map((e) => [e.debut, e.duree, e.notes.length])).toEqual([
      [0, 4, 2],
      [4, 4, 2],
    ]);
  });
});

describe('main droite', () => {
  it('se tait aux paliers 1 à 3', () => {
    for (const n of [1, 2, 3]) expect(celluleDe('ii-v-i', 0, n).md).toEqual([]);
  });

  for (const p of PROGRESSIONS)
    for (const n of [4, 5, 6])
      it(`${p.id}, palier ${n} : notes du mode, dans la zone, 3ce sur chaque changement d’accord`, () => {
        for (const t of CYCLE_QUARTES) {
          const c = celluleDe(p.id, t, n);
          for (const e of c.md) {
            const acc = accordA(c, e.debut);
            const m = e.notes[0]!;
            expect(m).toBeGreaterThanOrEqual(MD_BAS - 1);
            expect(m).toBeLessThanOrEqual(MD_HAUT);
            const chromatique = n === 6 && e.debut === 3.5; // le demi-ton du dessous de l'encerclement
            if (!chromatique) expect(notesDuMode(acc.racine, acc.mode), `${t} ${acc.nom} ${e.debut}`).toContain(pc(m));
            if (e.debut === acc.debut && e.debut > 0 && n !== 5)
              expect(pc(m), `${t} ${acc.nom}`).toBe(pc(acc.racine + QUALITES[acc.qualite].guides[0]));
          }
        }
      });

  it('palier 4 : seize croches', () => {
    const c = celluleDe('ii-v-i', 0, 4);
    expect(c.md.map((e) => e.debut)).toEqual([...Array(16).keys()].map((i) => i / 2));
  });

  it('palier 5 : part du « et » de 1, finit sur une note guide au temps 4, puis une mesure de silence', () => {
    const c = celluleDe('ii-v-i', 0, 5);
    expect(c.md[0]!.debut).toBe(0.5);
    const fin = c.md[c.md.length - 1]!;
    expect(fin.debut).toBe(3);
    expect([5, 0]).toContain(pc(fin.notes[0]!)); // fa ou do, notes guides de Ré m7
    expect(c.md.every((e) => e.debut < 4)).toBe(true);
  });

  it('palier 6 : fa, ré♯, mi vers Do 7M… ici do, la♯, si vers Sol 7', () => {
    const c = celluleDe('ii-v-i', 0, 6);
    const enc = c.md.filter((e) => e.debut >= 3 && e.debut <= 4);
    expect(enc.map((e) => e.noms[0])).toEqual(['do', 'la♯', 'si']);
    expect(enc[1]!.notes[0]).toBe(enc[2]!.notes[0]! - 1);
  });
});

describe('partition ABC', () => {
  /** Attaques (temps, hauteur) d'une voix, telles que les joue abcjs. */
  const attaques = (abc: string, piste: number) =>
    abcNotes(abc)
      .filter((n) => n.track === piste)
      .map((n) => `${n.start * 4}:${n.midi}`)
      .sort();
  const attendues = (evts: Cellule['md']) => evts.flatMap((e) => e.notes.map((m) => `${e.debut}:${m}`)).sort();

  for (const p of PROGRESSIONS)
    it(`${p.id} : se lit sans avertissement et rejoue exactement les notes calculées, dans les 12 tonalités`, () => {
      for (const t of CYCLE_QUARTES)
        for (const palier of PALIERS) {
          const c = celluleDe(p.id, t, palier.n);
          const abc = abcCellule(c, t, p.mode);
          expect(abcWarnings(abc), abc).toEqual([]);
          expect(attaques(abc, 0), `${t} palier ${palier.n} MD\n${abc}`).toEqual(attendues(c.md));
          expect(attaques(abc, 1), `${t} palier ${palier.n} MG\n${abc}`).toEqual(attendues(c.mg));
        }
    });

  it('écrit le Charleston en do comme on l’attend', () => {
    const abc = abcCellule(celluleDe('ii-v-i', 0, 2), 0, 'majeur');
    expect(abc).toContain('[F,A,CE]3');
    expect(abc).toContain('"^Swing · Ré m7"');
  });

  it('dure deux mesures', () => {
    const c = celluleDe('turnaround', 0, 4);
    const fin = Math.max(...abcNotes(abcCellule(c, 0, 'majeur')).map((n) => (n.start + n.duration) * 4));
    expect(fin).toBe(FENETRE);
  });
});
