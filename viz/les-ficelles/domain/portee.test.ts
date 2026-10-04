import { describe, expect, it } from 'vitest';
import { lireAccord } from './grille';
import { INTERLIGNE, placerAccord, Y_FA, Y_SOL, yDe } from './portee';

const lu = (s: string) => lireAccord(s, 0)!;

describe('hauteurs sur la portée', () => {
  it('place les lignes extrêmes de chaque clé', () => {
    expect(yDe(38, 'sol')).toBe(Y_SOL); // fa5, ligne du haut
    expect(yDe(30, 'sol')).toBe(Y_SOL + 4 * INTERLIGNE); // mi4, ligne du bas
    expect(yDe(26, 'fa')).toBe(Y_FA); // la3
    expect(yDe(18, 'fa')).toBe(Y_FA + 4 * INTERLIGNE); // sol2
  });
});

describe('placerAccord', () => {
  it('met la basse en clé de fa, le reste en clé de sol, et le do4 sur une ligne supplémentaire', () => {
    const [b, t, a, s] = placerAccord([48, 60, 64, 67], lu('Do'));
    expect(b!.cle).toBe('fa');
    expect([t!.cle, a!.cle, s!.cle]).toEqual(['sol', 'sol', 'sol']);
    expect(t!.lignes).toEqual([yDe(28, 'sol')]);
    expect(a!.lignes).toEqual([]);
  });

  it('écrit la♭ dans Fa m', () => {
    const notes = placerAccord([41, 60, 65, 68], lu('Fa m'));
    expect(notes[3]).toMatchObject({ lettre: 5, alteration: -1, octave: 4 });
  });

  it('décale la note du dessus d’une seconde', () => {
    const notes = placerAccord([43, 57, 59, 62], lu('Sol'));
    expect(notes.map((n) => n.decale)).toEqual([false, false, true, false]);
  });
});
