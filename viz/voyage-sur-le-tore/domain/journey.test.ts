import { describe, expect, it } from 'vitest';
import type { NamedSong } from '../data/contract';
import { buildJourney, journeyPath, journeyWords } from './journey';

const song: NamedSong = {
  id: 'irb:1',
  corpus: 'irb',
  title: 'Test',
  artist: '',
  year: 1950,
  tonic: 0,
  mode: 'major',
  sections: [
    { name: 'A', chords: [['Cmaj7', 4], ['Cmaj7', 4], ['Am7', 4], ['Dm7', 2], ['G7', 2]] },
    { name: 'B', chords: [['N', 4], ['Bø7', 4], ['E7', 4]] },
  ],
};

describe('voyage', () => {
  it('met la grille à plat, ramène chaque accord à une triade, compte les pas', () => {
    const j = buildJourney(song);
    expect(j.stops).toHaveLength(8);
    expect(j.beats).toBe(28);
    expect(j.stops[5]!.triad).toBeNull();
    expect(j.stops[6]!.exact).toBe(false);
    expect(j.stops[6]!.triad).toEqual({ root: 11, mode: 'min' });
    // C → Am (1), Am → Dm (2), Dm → G (3 : une seule note commune), G → Bm (1), Bm → E (3)
    expect(j.stats.steps.map((s) => s.distance)).toEqual([1, 2, 3, 1, 3]);
    expect(j.stats.mean).toBeCloseTo(2);
  });
  it('trace le chemin sans répétition immédiate', () => {
    const p = journeyPath(buildJourney(song));
    expect(p.map((x) => x.stop.symbol)).toEqual(['Cmaj7', 'Am7', 'Dm7', 'G7', 'Bø7', 'E7']);
  });
  it('qualifie le voyage', () => {
    expect(journeyWords(buildJourney(song).stats)).toContain('pas moyens');
  });
});
