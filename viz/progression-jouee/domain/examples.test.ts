import { describe, expect, it } from 'vitest';
import { degreeToken, parseProgression } from '@shell/music/degrees';
import type { TokenizedSong } from '../data/contract';
import { findExamples, highlightRange, indexOfSequence } from './examples';

const T = (s: string) => parseProgression(s)!.map(degreeToken);
const song = (id: string, title: string, year: number | null, sections: number[][]): TokenizedSong => ({
  id,
  corpus: 'irb',
  title,
  artist: '',
  year,
  tonic: 0,
  mode: 'major',
  sections: sections.map((tokens, i) => ({ name: `S${i}`, chords: [], tokens })),
});

describe('recherche de suite', () => {
  it('trouve la position', () => {
    expect(indexOfSequence([1, 2, 3, 4], [2, 3])).toBe(1);
    expect(indexOfSequence([1, 2, 3, 4], [3, 4, 5])).toBe(-1);
    expect(indexOfSequence([1, 2, 3, 4], [])).toBe(-1);
    expect(indexOfSequence([1, 2, 1, 2], [1, 2], 1)).toBe(2);
  });
});

describe('exemples', () => {
  const p = T('I,V,vi,IV');
  const songs = [
    song('b', 'Beta', 1980, [[...p, 5], [9]]),
    song('a', 'Alpha', 1965, [[3, ...p], [...p]]),
    song('c', 'Gamma', null, [[1, 2]]),
    song('d', 'Delta', 1965, [p]),
  ];
  it('liste les morceaux qui la contiennent, par année puis titre', () => {
    const ex = findExamples(songs, parseProgression('I,V,vi,IV')!);
    expect(ex.map((e) => e.song.title)).toEqual(['Alpha', 'Delta', 'Beta']);
    expect(ex[0]).toMatchObject({ section: 0, at: 1, sections: 2 });
  });
});

describe('surlignage dans une grille', () => {
  it('retrouve les accords couverts malgré les répétitions et les silences', () => {
    // Accords : C C G N Am F F → jetons I V vi IV ; on cherche V–vi.
    const tokens = [0, 0, 42, -1, 55, 30, 30];
    expect(highlightRange(tokens, [42, 55])).toEqual([2, 4]);
    expect(highlightRange(tokens, [0, 42])).toEqual([0, 2]);
    expect(highlightRange(tokens, [55, 30])).toEqual([4, 6]);
    expect(highlightRange(tokens, [30, 0])).toBeNull();
  });
});
