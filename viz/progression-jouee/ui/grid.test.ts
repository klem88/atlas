import { describe, expect, it } from 'vitest';
import { prettySymbol } from './grid';

describe('symboles lisibles', () => {
  it('allège les trois écritures', () => {
    expect(prettySymbol('C:maj')).toBe('C');
    expect(prettySymbol('C:maj/3')).toBe('C/3');
    expect(prettySymbol('A:min7')).toBe('Am7');
    expect(prettySymbol('B:hdim7')).toBe('Bø7');
    expect(prettySymbol('C:maj(9)')).toBe('C9');
    expect(prettySymbol('Dmin7')).toBe('Dm7');
    expect(prettySymbol('Bdim')).toBe('B°');
    expect(prettySymbol('Cmaj7')).toBe('Cmaj7');
    expect(prettySymbol('G7')).toBe('G7');
  });
});
