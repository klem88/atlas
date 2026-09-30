import { describe, expect, it } from 'vitest';
import { progressionLabel } from '@shell/music/degrees';
import { readStateFromUrl, stateToSearch } from './state';

describe('état ↔ URL', () => {
  it('lit les paramètres et revient au défaut sinon', () => {
    const s = readStateFromUrl('?p=ii,V,I&t=Eb&ex=irb:12');
    expect(progressionLabel(s.progression)).toBe('ii–V–I');
    expect(s.tonic).toBe(3);
    expect(s.example).toBe('irb:12');
    const d = readStateFromUrl('?p=zz&t=H&ex=<script>');
    expect(progressionLabel(d.progression)).toBe('I–V–vi–IV');
    expect(d.tonic).toBe(0);
    expect(d.example).toBeNull();
  });
  it('n’écrit que ce qui diffère du défaut', () => {
    expect(stateToSearch(readStateFromUrl(''))).toBe('');
    expect(stateToSearch(readStateFromUrl('?p=ii,V,I&t=F%23'))).toBe('?p=ii,V,I&t=F#');
    expect(stateToSearch(readStateFromUrl('?p=I,V,vi,IV&t=C&ex=bb:0003'))).toBe('?ex=bb:0003');
  });
});
