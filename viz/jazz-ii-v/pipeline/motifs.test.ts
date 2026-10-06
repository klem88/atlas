import { describe, expect, it } from 'vitest';
import { parseChord } from '@shell/music/chords';
import { progression } from '../domain/progressions';
import { fusionnerRepetitions, occurrences, trouverMotif } from './motifs';

const suite = (s: string) => fusionnerRepetitions(s.split(' ').map(parseChord));
const motif = (id: string) => progression(id).motifs[0]!;

describe('trouverMotif', () => {
  it('trouve un ii–V–I en do', () => {
    expect(trouverMotif(suite('D-7 G7 C^7 A7'), motif('ii-v-i'))).toEqual([0]);
  });

  it('trouve un ii–V–I dans n’importe quelle tonalité', () => {
    expect(trouverMotif(suite('Eb^7 C-7 F7 Bb^7'), motif('ii-v-i'))).toEqual([1]);
  });

  it('ne confond pas les qualités', () => {
    expect(trouverMotif(suite('D G7 C^7'), motif('ii-v-i'))).toEqual([]);
    expect(trouverMotif(suite('D-7 G-7 C^7'), motif('ii-v-i'))).toEqual([]);
  });

  it('fusionne les répétitions et fait boucler la fin sur le début', () => {
    expect(trouverMotif(suite('C^7 C^7 A-7 D-7 G7'), motif('ii-v-i'))).toEqual([2]);
  });

  it('trouve le ii–V–i mineur et la substitution tritonique', () => {
    expect(trouverMotif(suite('Dh7 G7 C-6'), motif('ii-v-i-mineur'))).toEqual([0]);
    expect(trouverMotif(suite('D-7 Db7 C^7'), motif('tritonique'))).toEqual([0]);
  });

  it('compte toutes les variantes du ii–V vers le IV', () => {
    expect(occurrences(suite('C^7 G-7 C7 F^7 F-6 C^7 D-7'), progression('vers-le-iv').motifs)).toEqual([
      [0, 4],
      [3, 3],
    ]);
  });
});
