import { describe, expect, it } from 'vitest';
import { addTransitions, matrixRows, newMatrix, TOKENS } from './transitions';

describe('transitions', () => {
  it('compte les paires consécutives dans une section, pas à cheval', () => {
    const m = newMatrix();
    const n = addTransitions(m, [1, 2, 3, 255, 3, 1, 2]);
    expect(n).toBe(4);
    expect(m[1 * TOKENS + 2]).toBe(2);
    expect(m[2 * TOKENS + 3]).toBe(1);
    expect(m[3 * TOKENS + 1]).toBe(1);
    expect(m[3 * TOKENS + 3]).toBe(0);
  });
  it('ignore une répétition immédiate qui aurait échappé', () => {
    const m = newMatrix();
    expect(addTransitions(m, [5, 5, 6])).toBe(1);
  });
  it('sort les lignes triées au-dessus du seuil', () => {
    const m = newMatrix();
    addTransitions(m, [1, 2, 1, 2, 1, 3]);
    expect(matrixRows(m, 2)).toEqual([
      [1, 2, 2],
      [2, 1, 2],
    ]);
    expect(matrixRows(m, 1)).toHaveLength(3);
  });
});
