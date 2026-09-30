import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, normalizeNotes, readStateFromUrl, stateToSearch } from './state';

describe('état dans l’URL', () => {
  it('sans paramètre : l’accord majeur pur, temps normal', () => {
    expect(readStateFromUrl('')).toEqual(DEFAULT_STATE);
  });
  it('lit notes, accordage et temps', () => {
    expect(readStateFromUrl('?notes=60,67&accord=egal&temps=dessin')).toEqual({ notes: [60, 67], tuning: 'egal', mode: 'dessin' });
  });
  it('ignore ce qui est invalide et limite à trois notes', () => {
    expect(readStateFromUrl('?notes=x,60,64,67,71&accord=pythagore&temps=vite')).toEqual({ notes: [60, 64, 67], tuning: 'pur', mode: 'normal' });
    expect(normalizeNotes([67, 67, 60])).toEqual([60, 67]);
  });
  it('n’écrit que ce qui diffère, et fait l’aller-retour', () => {
    expect(stateToSearch(DEFAULT_STATE)).toBe('');
    const s = { notes: [48, 55], tuning: 'egal' as const, mode: 'dessin' as const };
    expect(stateToSearch(s)).toBe('?notes=48,55&accord=egal&temps=dessin');
    expect(readStateFromUrl(stateToSearch(s))).toEqual(s);
  });
});
