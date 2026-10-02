import { describe, expect, it } from 'vitest';
import { chordSymbol, MAX_PATH, parseSymbol, readStateFromUrl, stateToSearch } from './state';

describe("état dans l'URL", () => {
  it('valeurs par défaut', () => {
    expect(readStateFromUrl('')).toEqual({ home: 0, path: [] });
    expect(stateToSearch({ home: 0, path: [] })).toBe('');
  });

  it('symboles', () => {
    expect(chordSymbol({ root: 6, cls: 'min' })).toBe('F#m');
    expect(chordSymbol({ root: 11, cls: 'dim' })).toBe('Bdim');
    expect(parseSymbol('Bdim')).toEqual({ root: 11, cls: 'dim' });
    expect(parseSymbol('Bbm')).toEqual({ root: 10, cls: 'min' });
    expect(parseSymbol('Caug')).toBeNull();
    expect(parseSymbol('zz')).toBeNull();
  });

  it('aller-retour', () => {
    const s = readStateFromUrl('?t=G&p=C,Am,D,G,Bm');
    expect(s.home).toBe(7);
    expect(s.path.map(chordSymbol)).toEqual(['C', 'Am', 'D', 'G', 'Bm']);
    expect(readStateFromUrl(stateToSearch(s))).toEqual(s);
    const sharp = { home: 6, path: [{ root: 6, cls: 'min' as const }] };
    expect(readStateFromUrl(stateToSearch(sharp))).toEqual(sharp);
  });

  it("ignore l'illisible et coupe les chemins trop longs", () => {
    expect(readStateFromUrl('?t=H&p=C,zz,G').path.map(chordSymbol)).toEqual(['C', 'G']);
    expect(readStateFromUrl('?t=H').home).toBe(0);
    expect(readStateFromUrl(`?p=${Array(40).fill('C').join(',')}`).path).toHaveLength(MAX_PATH);
  });
});
