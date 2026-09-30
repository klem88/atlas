import { describe, expect, it } from 'vitest';
import { parseProgression, progressionLabel } from '@shell/music/degrees';
import type { Meta, Shard } from '../data/contract';
import { findProgression, lookup, peaks, readsAsMinor, resultSentence, toRelativeMajor, toRelativeMinor } from './lookup';

const meta: Meta = {
  version: 1,
  generatedAt: '',
  lengths: [2, 3, 4],
  minSongs: [20, 20, 20],
  genres: ['pop', 'rock', 'jazz'],
  decades: [1950, 1960, 1970],
  corpus: { songs: 1000, withGenre: 600, withYear: 500, minor: 300, byGenre: [300, 200, 100], byDecade: [10, 200, 290] },
  keyAccuracy: { irb: { n: 1, signature: 1, exact: 1 }, billboard: { n: 1, tonic: 1, signature: 1 } },
  named: { irb: 0, billboard: 0 },
};
const shard: Shard = {
  n: 4,
  rows: {
    'I,V,vi,IV': [400, 100, 1954, 200, 100, 10, 2, 100, 250],
    'vi,IV,I,V': [120, 60, 1961, 50, 40, 5, 0, 30, 80],
    'IV,I,V,vi': [30, 10, 0, 10, 10, 1, 0, 10, 20],
  },
};
const P = (s: string) => parseProgression(s)!;

describe('relatif', () => {
  it('convertit dans les deux sens', () => {
    expect(progressionLabel(toRelativeMajor(P('i,bVI,bIII,bVII')))).toBe('vi–IV–I–V');
    expect(progressionLabel(toRelativeMinor(P('vi,IV,I,V')))).toBe('i–bVI–bIII–bVII');
  });
  it('reconnaît une saisie pensée en mineur', () => {
    expect(readsAsMinor(P('i,bVII,bVI,V'))).toBe(true);
    expect(readsAsMinor(P('I,V,vi,IV'))).toBe(false);
    expect(readsAsMinor(P('ii,V,I'))).toBe(false);
    expect(readsAsMinor(P('vi,IV,I,V'))).toBe(false);
  });
});

describe('recherche', () => {
  it('lit une ligne et calcule les parts', () => {
    const f = findProgression(P('I,V,vi,IV'), shard, meta)!;
    expect(f.total).toBe(400);
    expect(f.share).toBeCloseTo(0.4);
    expect(f.firstYear).toBe(1954);
    expect(f.byGenre[0]).toEqual({ label: 'pop', count: 200, share: 200 / 300 });
    expect(f.byDecade[1]).toEqual({ label: '1960', count: 100, share: 0.5 });
    expect(findProgression(P('IV,I,V,vi'), shard, meta)!.firstYear).toBeNull();
    expect(findProgression(P('I,I,I,I'), shard, meta)).toBeNull();
  });
  it('ramène une saisie mineure et classe les rotations', () => {
    const l = lookup(P('i,bVI,bIII,bVII'), shard, meta);
    expect(progressionLabel(l.degrees)).toBe('vi–IV–I–V');
    expect(l.found!.total).toBe(120);
    expect(l.rotations.map((r) => progressionLabel(r.degrees))).toEqual(['I–V–vi–IV', 'IV–I–V–vi']);
    expect(l.threshold).toBe(20);
  });
  it('trouve les sommets en part, en écartant les petites catégories', () => {
    const f = findProgression(P('I,V,vi,IV'), shard, meta)!;
    const p = peaks(f, 200, meta);
    expect(p.genre!.label).toBe('pop');
    // Les années 1950 ont 20 % (2/10) mais seulement 10 morceaux : écartées ; 1970 = 250/290.
    expect(p.decade!.label).toBe('1970');
  });
});

describe('phrase', () => {
  it('dit le compte, la part, la première année, le genre et la décennie', () => {
    const s = resultSentence(lookup(P('I,V,vi,IV'), shard, meta), meta);
    expect(s).toContain('I–V–vi–IV est dans 400 morceaux');
    expect(s).toContain('40 %');
    expect(s).toContain('1954');
    expect(s).toContain('pop');
    expect(s).toContain('années 1970');
  });
  it('dit « moins de » quand la suite n’est pas retenue', () => {
    expect(resultSentence(lookup(P('I,I,I,I'), shard, meta), meta)).toContain('moins de 20 morceaux');
  });
});
