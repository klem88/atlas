import { describe, expect, it } from 'vitest';
import { chordTones, onceEvery, parseChordChanges, read, relativeDegree, shares } from './solo';

describe('degrés relatifs à l’accord', () => {
  it('compte depuis la fondamentale', () => {
    expect(relativeDegree(65, 5)).toBe(0); // fa sur F
    expect(relativeDegree(69, 5)).toBe(4); // la sur F : tierce
    expect(relativeDegree(63, 5)).toBe(10); // mi♭ sur F : septième mineure
    expect(relativeDegree(60, 7)).toBe(5); // do sur G : onzième
  });
  it('connaît les notes de l’accord', () => {
    expect(chordTones('dom7')).toEqual([0, 4, 7, 10]);
    expect(chordTones('hdim')).toEqual([0, 3, 6, 10]);
  });
});

describe('lecture d’une répartition', () => {
  it('trouve la note la plus jouée, les trois premières, la note évitée et la part hors accord', () => {
    const counts = new Array<number>(12).fill(0);
    counts[2] = 30; // neuvième
    counts[4] = 25; // tierce
    counts[10] = 20; // septième mineure
    counts[7] = 15; // quinte
    counts[0] = 5; // fondamentale
    counts[5] = 5; // onzième
    const r = read(counts, 'dom7');
    expect(r.total).toBe(100);
    expect(r.top).toBe(2);
    expect(r.top3).toEqual([2, 4, 10]);
    expect(r.avoided).toBe(9); // la treizième n'est jamais jouée
    expect(r.outside).toBeCloseTo(0.35);
    expect(shares(counts)[2]).toBeCloseTo(0.3);
    expect(read(new Array(12).fill(0), 'maj').avoided).toBeNull();
  });
  it('met une part en mots', () => {
    expect(onceEvery(0.5)).toBe('une fois sur deux');
    expect(onceEvery(0.17)).toBe('une fois sur six');
    expect(onceEvery(0.3)).toBe('une fois sur trois');
    expect(onceEvery(0.04)).toBe('4 % du temps');
    expect(onceEvery(0)).toBe('jamais');
  });
});

describe('grille textuelle de Weimar', () => {
  it('lit les parties, les mesures et les accords', () => {
    const g = parseChordChanges('A1: ||Bb6 G7 |C-7 F7 |Bb G-7 |NC   ||\nB1: ||D7   |D7   ||');
    expect(g).toHaveLength(2);
    expect(g[0]!.name).toBe('A1');
    expect(g[0]!.bars).toHaveLength(4);
    expect(g[0]!.bars[0]!.chords).toEqual(['Bb6', 'G7']);
    expect(g[0]!.bars[3]!.chords).toEqual([]);
    expect(g[1]!.bars.map((b) => b.chords[0])).toEqual(['D7', 'D7']);
  });
  it('tolère une ligne sans nom de partie', () => {
    const g = parseChordChanges('||Eb7 |Ab7 ||');
    expect(g[0]!.name).toBe('');
    expect(g[0]!.bars).toHaveLength(2);
  });
});
