import { describe, expect, it } from 'vitest';
import { readStateFromUrl, stateToSearch } from './state';

describe('état dans l’URL', () => {
  it('fait l’aller-retour', () => {
    expect(readStateFromUrl(stateToSearch({ commune: '21584' }))).toEqual({ commune: '21584' });
    expect(stateToSearch({ commune: null })).toBe('');
  });

  it('accepte les codes corses et ignore le reste', () => {
    expect(readStateFromUrl('?commune=2a004').commune).toBe('2A004');
    expect(readStateFromUrl('?commune=<script>').commune).toBeNull();
    expect(readStateFromUrl('').commune).toBeNull();
  });
});
