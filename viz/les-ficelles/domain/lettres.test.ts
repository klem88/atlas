import { describe, expect, it } from 'vitest';
import { cliche, decouper, lireAccord, symbole, transposer, type Grille } from './grille';
import { dominante } from './ficelles/dominante';
import { emprunt } from './ficelles/emprunt';
import { enrichis } from './ficelles/enrichis';
import { montee } from './ficelles/montee';
import { suspendu } from './ficelles/suspendu';
import { ecrireAccord, nomAccord } from './orthographe';

const saisie = (s: string, key = 0): Grille => decouper(s).map((x) => lireAccord(x, key)!);
const noms = (g: Grille) => g.map(nomAccord);

describe('la lettre de la fondamentale', () => {
  it('garde la lettre tapée', () => {
    expect(noms(saisie('Do#m Sol# Re#m'))).toEqual(['Do♯ m', 'Sol♯', 'Ré♯ m']);
    expect(noms(saisie('Do Do♯° Ré m'))).toEqual(['Do', 'Do♯ °', 'Ré m']);
    expect(noms(saisie('Réb Mi#'))).toEqual(['Ré♭', 'Mi♯']);
    expect(noms(saisie('Do#m/Si Fa#/La#'))).toEqual(['Do♯ m/Si', 'Fa♯/La♯']); // une basse étrangère reste dans la tonalité
    // Une lettre qui est déjà celle de la tonalité ne s’écrit pas : l’accord reste le même objet.
    expect(lireAccord('Db', 0)).toEqual({ root: 1, couleur: 'maj', key: 0 });
    expect(lireAccord('C#m', 0)).toEqual({ root: 1, couleur: 'min', key: 0, lettre: 0 });
  });

  it('la suit dans la transposition', () => {
    expect(nomAccord(transposer(lireAccord('Do#m', 0)!, 2))).toBe('Ré♯ m');
    expect(nomAccord(transposer(lireAccord('Do#m/Sol#', 0)!, 2))).toBe('Ré♯ m/La♯');
  });

  it('fait l’aller-retour du symbole, dièses compris', () => {
    for (const s of ['C#m', 'G#', 'D#m', 'Db', 'E#', 'Cb7']) expect(symbole(lireAccord(s, 0)!)).toBe(s);
    for (const s of ['C#', 'Ab', 'F#m']) expect(symbole(lireAccord(s, 7)!)).toBe(s);
  });
});

describe('la chaîne de dominantes', () => {
  it('remonte les quintes sur les bonnes lettres', () => {
    let g: Grille = cliche(0);
    for (let k = 0; k < 3; k++) g = dominante.appliquer(g, 1).grille;
    expect(noms(g)).toEqual(['Do', 'Fa♯7', 'Si7', 'Mi7', 'La m', 'Fa', 'Sol']);
    expect(dominante.explique(g, 1)).toContain('Do♯7 annonce Fa♯7 : son mi♯ monte d’un demi-ton vers le fa♯');
    g = dominante.appliquer(g, 1).grille;
    expect(noms(g).slice(0, 3)).toEqual(['Do', 'Do♯7', 'Fa♯7']);
  });

  it('en Mi♭ aussi : Mi7 et non Fa♭7', () => {
    let g: Grille = cliche(3);
    for (let k = 0; k < 4; k++) g = dominante.appliquer(g, 1).grille;
    expect(noms(g)).toEqual(['Mi♭', 'Mi7', 'La7', 'Ré7', 'Sol7', 'Do m', 'La♭', 'Si♭']);
  });
});

describe('les explications dans d’autres tonalités', () => {
  it('en Sol', () => {
    const g = cliche(7);
    expect(dominante.explique(g, 1)).toContain('Si7 annonce Mi m : son ré♯ monte d’un demi-ton vers le mi');
    expect(suspendu.explique(g, 3)).toContain('Do/Ré garde la basse ré');
    expect(suspendu.explique(g, 3)).toContain('plus de fa♯');
    expect(emprunt.explique(g, 2)).toContain('le mi descend au mi♭');
  });

  it('en Mi♭', () => {
    const g = cliche(3);
    expect(dominante.explique(g, 1)).toContain('Sol7 annonce Do m : son si monte d’un demi-ton vers le do');
    expect(emprunt.explique(g, 2)).toContain('le do descend au do♭');
    expect(enrichis.explique(g, 3)).toContain('on ajoute la♭');
    expect(montee.explique(g, 3)).toContain('Do7, la dominante de Fa');
  });
});

describe('la montée depuis une tonalité en dièses', () => {
  it('monte de Fa♯ à Sol♯, amenée par Ré♯7', () => {
    const r = montee.appliquer(cliche(6), 3);
    expect(noms(r.grille)).toEqual(['Fa♯', 'Ré♯ m', 'Si', 'Do♯', 'Ré♯7', 'Sol♯', 'Mi♯ m', 'Do♯', 'Ré♯']);
    expect(montee.explique(cliche(6), 3)).toContain('Ré♯7, la dominante de Sol♯');
  });

  it('monte de Si à Do♯, amenée par Sol♯7', () => {
    expect(montee.explique(cliche(11), 3)).toContain('Sol♯7, la dominante de Do♯');
  });
});

describe('une longue chaîne de dominantes', () => {
  it('reste écrivable : au-delà d’un dièse, la fondamentale reprend la lettre de la tonalité', () => {
    let g: Grille = cliche(0);
    for (let k = 0; k < 12; k++) g = dominante.appliquer(g, 1).grille;
    for (const a of g) for (const n of ecrireAccord(a)) expect(Math.abs(n.alteration)).toBeLessThanOrEqual(2);
    expect(noms(g).join(' ')).not.toContain('undefined');
    expect(noms(g).slice(0, 8).join(' – ')).toBe('Do – La7 – Ré7 – Sol7 – Si♯7 – Mi♯7 – La♯7 – Ré♯7');
  });

  it('suit la lettre dans le Sol suspendu d’une montée en dièses', () => {
    const r = montee.appliquer(cliche(6), 3);
    expect(nomAccord(suspendu.appliquer(r.grille, 8).grille[8]!)).toBe('Do♯/Ré♯');
  });
});
