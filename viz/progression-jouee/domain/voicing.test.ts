import { describe, expect, it } from 'vitest';
import { chordFromNotes, degreeFromNotes, voice } from './voicing';

describe('voix d’un degré', () => {
  it('pose la basse sur la fondamentale et la triade dans la fenêtre', () => {
    const v = voice({ step: 0, cls: 'maj' }, 0);
    expect(v[0]).toBe(36);
    expect(v.slice(1).map((n) => n % 12).sort()).toEqual([0, 4, 7]);
    for (const n of v.slice(1)) expect(n).toBeGreaterThanOrEqual(52);
    for (const n of v.slice(1)) expect(n).toBeLessThanOrEqual(72);
  });
  it('choisit le renversement le plus proche du précédent', () => {
    const c = voice({ step: 0, cls: 'maj' }, 0);
    const g = voice({ step: 7, cls: 'maj' }, 0, c);
    const moved = g.slice(1).reduce((a, n) => a + Math.min(...c.slice(1).map((p) => Math.abs(p - n))), 0);
    expect(moved).toBeLessThanOrEqual(4);
  });
  it('sonne les six classes', () => {
    expect(voice({ step: 2, cls: 'min' }, 0).slice(1).map((n) => n % 12).sort()).toEqual([2, 5, 9]);
    expect(voice({ step: 11, cls: 'dim' }, 0).slice(1).map((n) => n % 12).sort((a, b) => a - b)).toEqual([2, 5, 11]);
    expect(voice({ step: 0, cls: 'aug' }, 0).slice(1).map((n) => n % 12).sort()).toEqual([0, 4, 8]);
    expect(voice({ step: 7, cls: 'sus' }, 0).slice(1).map((n) => n % 12).sort()).toEqual([0, 2, 7]);
    expect(voice({ step: 0, cls: 'other' }, 0).slice(1)).toHaveLength(2);
  });
});

describe('reconnaissance d’accord', () => {
  it('trouve la triade et sa fondamentale, quel que soit le renversement', () => {
    expect(chordFromNotes([60, 64, 67])).toEqual({ root: 0, cls: 'maj' });
    expect(chordFromNotes([64, 67, 72])).toEqual({ root: 0, cls: 'maj' });
    expect(chordFromNotes([57, 60, 64])).toEqual({ root: 9, cls: 'min' });
    expect(chordFromNotes([59, 62, 65])).toEqual({ root: 11, cls: 'dim' });
    expect(chordFromNotes([60, 64, 68])).toEqual({ root: 0, cls: 'aug' });
    expect(chordFromNotes([60, 65, 67])).toEqual({ root: 0, cls: 'sus' });
    expect(chordFromNotes([60, 64, 67, 70])).toEqual({ root: 0, cls: 'maj' });
  });
  it('accepte une quinte à vide, refuse le reste', () => {
    expect(chordFromNotes([60, 67])).toEqual({ root: 0, cls: 'maj' });
    expect(chordFromNotes([60, 65])).toEqual({ root: 5, cls: 'maj' });
    expect(chordFromNotes([60])).toBeNull();
    expect(chordFromNotes([60, 61, 62])).toBeNull();
  });
  it('donne le degré dans la tonalité', () => {
    expect(degreeFromNotes([67, 71, 74], 0)).toEqual({ step: 7, cls: 'maj' });
    expect(degreeFromNotes([67, 71, 74], 7)).toEqual({ step: 0, cls: 'maj' });
  });
});
