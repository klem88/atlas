import { describe, expect, it } from 'vitest';
import { cliche, lireAccord } from './domain/grille';
import { readStateFromUrl, stateToSearch } from './state';

describe('état dans l’URL', () => {
  it('part du cliché en Do, sans paramètre', () => {
    expect(readStateFromUrl('')).toEqual({ home: 0, depart: cliche(0), pile: [] });
    expect(stateToSearch({ home: 0, depart: cliche(0), pile: [] })).toBe('');
  });

  it('fait l’aller-retour', () => {
    const s = {
      home: 7,
      depart: ['G', 'G/F#', 'Em', 'Cmaj7', 'D7'].map((x) => lireAccord(x, 7)!),
      pile: [{ id: 'enrichis' as const, index: 2 }, { id: 'montee' as const, index: 4 }],
    };
    const q = stateToSearch(s);
    expect(q).toBe('?t=G&p=G,G/F%23,Em,Cmaj7,D7&f=enrichis.2,montee.4');
    expect(readStateFromUrl(q)).toEqual(s);
  });

  it('retombe sur le cliché si le départ est illisible ou trop court', () => {
    expect(readStateFromUrl('?t=D&p=D').depart).toEqual(cliche(2));
    expect(readStateFromUrl('?p=C,Xyz,G').depart).toEqual(cliche(0));
  });

  it('ignore les ficelles inconnues', () => {
    expect(readStateFromUrl('?f=descend.0,magie.2,emprunt.x').pile).toEqual([{ id: 'descend', index: 0 }]);
  });
});
