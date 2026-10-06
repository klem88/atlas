import { describe, expect, it } from 'vitest';
import { notesDuMode } from './modes';
import { PROGRESSIONS, QUALITES, dureeGrille, progression, transpose, voicingDe } from './progressions';
import { CYCLE_QUARTES } from './spelling';

const noms = (id: string, tonique: number) => transpose(progression(id), tonique).map((a) => a.nom);

describe('transposition', () => {
  it('écrit le ii–V–I en do', () => {
    expect(noms('ii-v-i', 0)).toEqual(['Ré m7', 'Sol 7', 'Do 7M']);
  });

  it('écrit le ii–V–i en la mineur', () => {
    expect(noms('ii-v-i-mineur', 9)).toEqual(['Si ø', 'Mi 7alt', 'La m6']);
  });

  it('orthographie les degrés altérés', () => {
    expect(noms('tritonique', 0)[1]).toBe('Ré♭ 7');
    expect(noms('diminue', 0)[1]).toBe('Do♯ °7');
    expect(noms('backdoor', 3).slice(0, 2)).toEqual(['La♭ m7', 'Ré♭ 7']);
  });

  it('enchaîne Autumn Leaves en si♭ comme sur la grille habituelle', () => {
    expect(noms('autumn-leaves', 10)).toEqual(['Do m7', 'Fa 7', 'Si♭ 7M', 'Mi♭ 7M', 'La ø', 'Ré 7alt', 'Sol m6']);
  });

  it('n’écrit jamais de double altération, dans aucune tonalité', () => {
    for (const p of PROGRESSIONS)
      for (const t of CYCLE_QUARTES) for (const acc of transpose(p, t)) expect(acc.note).not.toMatch(/♭♭|♯♯/);
  });

  it('place les débuts bout à bout', () => {
    expect(transpose(progression('ii-v-i'), 0).map((a) => a.debut)).toEqual([0, 4, 8]);
  });
});

describe('les grilles', () => {
  it('ont des identifiants uniques', () => {
    expect(new Set(PROGRESSIONS.map((p) => p.id)).size).toBe(PROGRESSIONS.length);
  });

  it('font un nombre entier de mesures', () => {
    for (const p of PROGRESSIONS) expect(dureeGrille(p) % 4, p.id).toBe(0);
  });

  it('donnent à chaque accord un mode qui contient ses notes guides', () => {
    for (const p of PROGRESSIONS)
      for (const acc of transpose(p, p.tonique)) {
        const mode = notesDuMode(acc.racine, acc.mode);
        for (const g of QUALITES[acc.qualite].guides) expect(mode, `${p.id} ${acc.nom}`).toContain((acc.racine + g) % 12);
      }
  });

  it('donnent à chaque accord un mode qui contient toutes ses notes', () => {
    for (const p of PROGRESSIONS)
      for (const acc of transpose(p, p.tonique)) {
        const mode = notesDuMode(acc.racine, acc.mode);
        for (const n of QUALITES[acc.qualite].notes) expect(mode, `${p.id} ${acc.nom}`).toContain((acc.racine + n) % 12);
        for (const n of voicingDe(acc)) expect(mode, `${p.id} ${acc.nom} (voicing)`).toContain((acc.racine + n) % 12);
      }
  });
});
