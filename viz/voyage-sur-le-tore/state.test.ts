import { describe, expect, it } from 'vitest';
import { readStateFromUrl, stateToSearch } from './state';

describe('état ↔ URL', () => {
  it('lit, valide et réécrit', () => {
    expect(readStateFromUrl('?morceau=irb:362&vitesse=lente')).toEqual({ song: 'irb:362', speed: 'lente' });
    expect(stateToSearch({ song: 'irb:362', speed: 'lente' })).toBe('?morceau=irb:362&vitesse=lente');
    expect(readStateFromUrl('?morceau=<x>&vitesse=vite')).toEqual({ song: 'irb:63', speed: 'normale' });
    expect(stateToSearch(readStateFromUrl(''))).toBe('');
  });
});
