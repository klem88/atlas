import { describe, expect, it } from 'vitest';
import { readStateFromUrl, stateToSearch } from './state';

describe('état ↔ URL', () => {
  it('lit et écrit les trois paramètres', () => {
    const s = readStateFromUrl('?a=pop&b=metal&de=V');
    expect(s).toEqual({ a: 'pop', b: 'metal', from: 7 * 6 });
    expect(stateToSearch(s)).toBe('?a=pop&b=metal&de=V');
  });
  it('revient au défaut, et distingue « pas de B »', () => {
    expect(readStateFromUrl('')).toEqual({ a: 'irb', b: 'pop', from: null });
    expect(stateToSearch(readStateFromUrl(''))).toBe('');
    expect(readStateFromUrl('?b=aucun').b).toBeNull();
    expect(stateToSearch({ a: 'irb', b: null, from: null })).toBe('?b=aucun');
    expect(readStateFromUrl('?a=<x>&de=zz')).toEqual({ a: 'irb', b: 'pop', from: null });
  });
  it('garde les clés à espace', () => {
    expect(readStateFromUrl('?a=pop%20rock').a).toBe('pop rock');
    expect(stateToSearch({ a: 'pop rock', b: 'pop', from: null })).toBe('?a=pop%20rock');
  });
});
