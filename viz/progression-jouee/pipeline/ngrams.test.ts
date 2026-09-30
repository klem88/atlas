import { describe, expect, it } from 'vitest';
import { countNgrams, decadeIndex, firstYear, keyOf, packSections, songNgrams, tokensOfKey, type SongTokens } from './ngrams';

const song = (sections: number[][], extra: Partial<SongTokens> = {}): SongTokens => ({
  tokens: packSections(sections),
  genre: 0,
  decade: 0,
  minor: false,
  year: 2000,
  ...extra,
});

describe('clés', () => {
  it('code et décode', () => {
    expect(tokensOfKey(keyOf([0, 42, 71]))).toEqual([0, 42, 71]);
    expect(keyOf(Uint8Array.from([1, 2]))).toBe(keyOf([1, 2]));
    expect([...packSections([[1, 2], [3]])]).toEqual([1, 2, 255, 3]);
  });
});

describe('n-grammes d’un morceau', () => {
  it('reste dans une section et dédoublonne', () => {
    const s = song([
      [1, 2, 3, 1, 2, 3],
      [3, 4],
    ]);
    expect([...songNgrams(s, 2, null)].map(tokensOfKey)).toEqual([
      [1, 2],
      [2, 3],
      [3, 1],
      [3, 4],
    ]);
    expect([...songNgrams(s, 3, null)].map(tokensOfKey)).toEqual([
      [1, 2, 3],
      [2, 3, 1],
      [3, 1, 2],
    ]);
  });
  it('élague avec les sous-suites autorisées', () => {
    const s = song([[1, 2, 3, 4]]);
    const allowed = new Set([keyOf([1, 2]), keyOf([2, 3])]);
    expect([...songNgrams(s, 3, allowed)].map(tokensOfKey)).toEqual([[1, 2, 3]]);
  });
});

describe('comptage', () => {
  it('compte un morceau une fois par suite et répartit par genre, décennie et mode', () => {
    const songs = [
      song([[1, 2, 3, 1, 2, 3]], { genre: 0, decade: 1, year: 1965 }),
      song([[1, 2, 3]], { genre: 1, decade: 2, year: 1975, minor: true }),
      song([[2, 3, 4]], { genre: 1, decade: 2, year: 1971 }),
    ];
    const counts = countNgrams(songs, 2, 2, null, { genres: 2, decades: 3 });
    expect([...counts.keys()].map(tokensOfKey)).toEqual([
      [1, 2],
      [2, 3],
    ]);
    expect(counts.get(keyOf([2, 3]))).toEqual({ total: 3, minor: 1, earliest: [1965, 1971, 1975], byGenre: [1, 2], byDecade: [0, 1, 2] });
    expect(firstYear(counts.get(keyOf([2, 3]))!)).toBe(1975);
    expect(counts.get(keyOf([1, 2]))).toEqual({ total: 2, minor: 1, earliest: [1965, 1975], byGenre: [1, 1], byDecade: [0, 1, 1] });
    expect(firstYear(counts.get(keyOf([1, 2]))!)).toBeNull();
  });
  it('ignore les genres et décennies inconnus', () => {
    const counts = countNgrams([song([[1, 2]], { genre: -1, decade: -1, year: null })], 2, 1, null, { genres: 1, decades: 1 });
    expect(counts.get(keyOf([1, 2]))).toEqual({ total: 1, minor: 0, earliest: [], byGenre: [0], byDecade: [0] });
  });
  it('tient une date de 1900 pour un bouche-trou et ne garde que les trois plus anciennes', () => {
    const songs = [1900, 1980, 1960, 1970, 1975].map((y) => song([[1, 2]], { year: y }));
    const t = countNgrams(songs, 2, 1, null, { genres: 1, decades: 1 }).get(keyOf([1, 2]))!;
    expect(t.earliest).toEqual([1960, 1970, 1975]);
    expect(firstYear(t)).toBe(1975);
  });
});

describe('décennies', () => {
  it('range les années', () => {
    expect(decadeIndex(1949)).toBe(0);
    expect(decadeIndex(1900)).toBe(-1);
    expect(decadeIndex(1950)).toBe(0);
    expect(decadeIndex(1999)).toBe(4);
    expect(decadeIndex(2024)).toBe(7);
    expect(decadeIndex(null)).toBe(-1);
  });
});
