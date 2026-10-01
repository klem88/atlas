import { describe, expect, it } from 'vitest';
import { parseProgression } from '@shell/music/degrees';
import type { Meta, Shard } from '../../progression-jouee/data/contract';
import { chordName, countOf, fanSentence, nextChords, progressionNames, weightedPick } from './next';

const meta: Meta = {
  version: 1,
  generatedAt: '',
  lengths: [2, 3, 4],
  minSongs: [20, 20, 20],
  genres: ['pop', 'rock'],
  decades: [1960],
  corpus: { songs: 1000, withGenre: 500, withYear: 500, minor: 100, byGenre: [300, 200], byDecade: [500] },
  keyAccuracy: { irb: { n: 1, signature: 1, exact: 1 }, billboard: { n: 1, tonic: 1, signature: 1 } },
  named: { irb: 0, billboard: 0 },
};
// [total, minor, firstYear, pop, rock, d1960]
const p2: Shard = { n: 2, rows: { 'I,V': [400, 10, 0, 200, 100, 0], 'I,IV': [300, 10, 0, 100, 150, 0], 'V,I': [500, 0, 0, 250, 200, 0] } };
const p3: Shard = { n: 3, rows: { 'I,V,vi': [240, 10, 0, 150, 40, 0], 'I,V,IV': [100, 0, 0, 20, 50, 0], 'I,IV,V': [200, 0, 0, 80, 100, 0] } };
const P = (s: string) => parseProgression(s)!;

describe('éventail', () => {
  it('donne les continuations d’une suite avec leur probabilité conditionnelle', () => {
    const fan = nextChords(P('I,V'), p3, p2, meta, null);
    expect(fan.base).toBe(400);
    expect(fan.candidates.map((c) => [c.key, c.count, c.p])).toEqual([
      ['vi', 240, 0.6],
      ['IV', 100, 0.25],
    ]);
    expect(fan.other).toBeCloseTo(0.15);
  });
  it('restreint à un style', () => {
    const fan = nextChords(P('I,V'), p3, p2, meta, 'rock');
    expect(fan.base).toBe(100);
    expect(fan.candidates[0]).toMatchObject({ key: 'IV', count: 50, p: 0.5 });
    expect(countOf(p2.rows['I,V']!, meta, 'pop')).toBe(200);
    expect(countOf(p2.rows['I,V']!, meta, 'zz')).toBe(0);
  });
  it('part d’un seul accord avec la somme des paires comme base', () => {
    const fan = nextChords([P('I,V')[0]!], p2, null, meta, null);
    expect(fan.base).toBe(700);
    expect(fan.candidates.map((c) => c.key)).toEqual(['V', 'IV']);
    expect(fan.candidates[0]!.p).toBeCloseTo(400 / 700);
  });
  it('agrège par premier accord pour la suite vide', () => {
    const fan = nextChords([], p2, null, meta, null);
    expect(fan.candidates.map((c) => [c.key, c.count])).toEqual([
      ['I', 700],
      ['V', 500],
    ]);
    expect(fan.other).toBe(0);
  });
  it('tire au sort selon les poids', () => {
    const fan = nextChords(P('I,V'), p3, p2, meta, null);
    expect(weightedPick(fan.candidates, () => 0.1)!.key).toBe('vi');
    expect(weightedPick(fan.candidates, () => 0.99)!.key).toBe('IV');
    expect(weightedPick([], () => 0.5)).toBeNull();
  });
});

describe('noms et phrases', () => {
  it('nomme les accords dans une tonalité', () => {
    expect(chordName({ step: 0, cls: 'maj' }, 0)).toBe('Do');
    expect(chordName({ step: 9, cls: 'min' }, 0)).toBe('La m');
    expect(chordName({ step: 7, cls: 'maj' }, 2)).toBe('La');
    expect(chordName({ step: 11, cls: 'dim' }, 0)).toBe('Si °');
    expect(progressionNames(P('I,V,vi,IV'), 7)).toBe('Sol – Ré – Mi m – Do');
  });
  it('écrit la phrase', () => {
    const fan = nextChords(P('I,V'), p3, p2, meta, null);
    expect(fanSentence(P('I,V'), fan, 0, null)).toBe('Après Do – Sol, 60 % des chansons vont au La m, 25 % au Fa.');
    expect(fanSentence([], nextChords([], p2, null, meta, null), 0, null)).toContain('Do');
  });
});
