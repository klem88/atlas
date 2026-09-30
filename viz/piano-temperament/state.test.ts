import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, normalizeNotes, readStateFromUrl, stateToSearch } from './state';

describe('état dans l’URL', () => {
  it('sans paramètre : la quinte do4–sol4 tempérée', () => {
    expect(readStateFromUrl('')).toEqual(DEFAULT_STATE);
  });
  it('lit les notes, l’accordage et la paire', () => {
    expect(readStateFromUrl('?notes=60,64,67&accord=pur&paire=2')).toEqual({ notes: [60, 64, 67], tuning: 'pur', pair: 2 });
  });
  it('ignore ce qui est invalide', () => {
    expect(readStateFromUrl('?notes=abc,60,200&accord=zut&paire=-3')).toEqual({ notes: [60], tuning: 'egal', pair: 0 });
  });
  it('trie, dédoublonne et limite à quatre notes', () => {
    expect(normalizeNotes([67, 60, 60, 64, 71, 72])).toEqual([60, 64, 67, 71]);
  });
  it('n’écrit que ce qui diffère de la vue par défaut', () => {
    expect(stateToSearch(DEFAULT_STATE)).toBe('');
    expect(stateToSearch({ notes: [60, 64], tuning: 'egal', pair: 0 })).toBe('?notes=60,64');
    expect(stateToSearch({ notes: [60, 67], tuning: 'pur', pair: 1 })).toBe('?accord=pur&paire=1');
  });
  it('fait l’aller-retour', () => {
    const s = { notes: [48, 55, 64], tuning: 'pythagore' as const, pair: 2 };
    expect(readStateFromUrl(stateToSearch(s))).toEqual(s);
  });
});
