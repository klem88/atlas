import { describe, expect, it } from 'vitest';
import { lireAccord } from './grille';
import { dansLaTonalite, ecrireAccord, ecrireDans, nomAccord, nomNote, placer, rang } from './orthographe';

const lu = (s: string, key = 0) => lireAccord(s, key)!;
const noms = (s: string, key = 0) => ecrireAccord(lu(s, key)).map(nomNote);

describe('écrire un accord', () => {
  it('suit les lettres de l\'accord', () => {
    expect(noms('Fa m')).toEqual(['fa', 'la♭', 'do']);
    expect(noms('Mi7')).toEqual(['mi', 'sol♯', 'si', 'ré']);
    expect(noms('La7')).toEqual(['la', 'do♯', 'mi', 'sol']);
    expect(noms('Si♭')).toEqual(['si♭', 'ré', 'fa']);
    expect(noms('Si°')).toEqual(['si', 'ré', 'fa']);
  });

  it('lit la fondamentale dans la tonalité', () => {
    expect(nomNote(dansLaTonalite(8, 0))).toBe('la♭'); // ♭VI en Do
    expect(nomNote(dansLaTonalite(6, 0))).toBe('fa♯'); // ♯IV en Do
    expect(nomNote(dansLaTonalite(10, 6))).toBe('la♯'); // en Fa♯ majeur
    expect(nomAccord(lu('Lab', 3))).toBe('La♭'); // IV de Mi♭
  });

  it('écrit une basse étrangère à l\'accord dans la tonalité', () => {
    expect(nomNote(ecrireDans(11, lu('Do/Si')))).toBe('si');
    expect(nomNote(ecrireDans(7, lu('Fa/Sol')))).toBe('sol');
    expect(nomNote(ecrireDans(68, lu('Fa m')))).toBe('la♭'); // une note MIDI marche aussi
  });
});

describe('nomAccord', () => {
  it('nomme comme le reste du site', () => {
    expect(['Do', 'La m', 'Mi7', 'Fa7M', 'La m7', 'Si °', 'Do/Si', 'Fa/Sol', 'La m/Sol'].map((s) => nomAccord(lu(s)))).toEqual([
      'Do', 'La m', 'Mi7', 'Fa7M', 'La m7', 'Si °', 'Do/Si', 'Fa/Sol', 'La m/Sol',
    ]);
  });
});

describe('placer sur la portée', () => {
  it('calcule l\'octave d\'après la lettre', () => {
    expect(placer(60, { lettre: 0, alteration: 0 })).toEqual({ lettre: 0, alteration: 0, octave: 4 });
    expect(placer(59, { lettre: 0, alteration: -1 }).octave).toBe(4); // do♭4 sonne si3
    expect(rang(placer(60, { lettre: 0, alteration: 0 }))).toBe(28);
    expect(rang(placer(68, { lettre: 5, alteration: -1 }))).toBe(33); // la♭4
  });
});
