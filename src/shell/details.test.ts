import { describe, expect, it } from 'vitest';
import { readDetailsPref } from './details';

describe('readDetailsPref', () => {
  it('cache les détails par défaut', () => {
    expect(readDetailsPref({ getItem: () => null })).toBe(false);
    expect(readDetailsPref(undefined)).toBe(false);
  });

  it('retient le choix du lecteur', () => {
    expect(readDetailsPref({ getItem: () => 'on' })).toBe(true);
    expect(readDetailsPref({ getItem: () => 'off' })).toBe(false);
  });

  it('reste sur la valeur par défaut si le stockage est bloqué', () => {
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(readDetailsPref(blocked)).toBe(false);
  });
});
