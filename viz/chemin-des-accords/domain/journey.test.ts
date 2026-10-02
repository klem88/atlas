import { describe, expect, it } from 'vitest';
import type { Chord } from '../../suis-les-fleches/domain/harmony';
import { bandsOf, journeyOf, leanOf } from './journey';

const M = (root: number): Chord => ({ root, cls: 'maj' });
const m = (root: number): Chord => ({ root, cls: 'min' });
const dim = (root: number): Chord => ({ root, cls: 'dim' });
const [C, D, E, F, G, A, B] = [0, 2, 4, 5, 7, 9, 11];

describe('leanOf : vers où un accord fait pencher', () => {
  it('rien pour la gamme, les emprunts sombres et les dominantes de cibles mineures', () => {
    expect(leanOf(M(G), C)).toBeNull();
    expect(leanOf(m(F), C)).toBeNull(); // iv emprunté : une couleur
    expect(leanOf(M(8), C)).toBeNull(); // ♭VI emprunté
    expect(leanOf(M(E), C)).toBeNull(); // V/vi
  });

  it('vers les bémols : ♭VII et v penchent vers la sous-dominante', () => {
    expect(leanOf(M(10), C)).toBe(F);
    expect(leanOf(m(G), C)).toBe(F);
    expect(leanOf(M(F), G)).toBe(C); // Fa est le ♭VII de Sol
  });
  it('V/V penche vers la dominante, un accord d’ailleurs vers la tonalité la plus proche qui le contient', () => {
    expect(leanOf(M(D), C)).toBe(G);
    expect(leanOf(m(6), C)).toBe(D); // Fa♯ m : iii de Ré, la plus proche
    expect(leanOf(dim(B), G)).toBe(C); // Si ° n'est que dans Do
  });
});

describe('journeyOf', () => {
  it('reste dans la gamme', () => {
    const j = journeyOf(C, [M(C), M(G), m(A), M(F)]);
    expect(j.steps.map((s) => s.event.kind)).toEqual(['gamme', 'gamme', 'gamme', 'gamme']);
    expect(j.steps.map((s) => s.label)).toEqual(['I', 'V', 'vi', 'IV']);
    expect([j.key, j.leaning, j.pending]).toEqual([C, null, null]);
  });

  it('un détour : Ré frôle Sol, Fa l’éteint', () => {
    const j = journeyOf(C, [M(C), M(D), M(G), M(F)]);
    expect(j.steps.map((s) => s.event)).toEqual([
      { kind: 'gamme' },
      { kind: 'frole', target: G },
      { kind: 'suspens', target: G },
      { kind: 'eteint', target: G, frole: 1 },
    ]);
    expect(j.steps.every((s) => s.key === C)).toBe(true);
    expect(j.leaning).toBeNull();
  });

  it('une modulation confirmée : Si m n’existe qu’en Sol, Ré est le pivot', () => {
    const j = journeyOf(C, [M(C), m(A), M(D), M(G), m(B)]);
    expect(j.steps[4]!.event).toEqual({ kind: 'confirme', from: C, to: G, pivot: 2 });
    expect(j.steps.map((s) => s.key)).toEqual([C, C, G, G, G]);
    expect(j.steps.map((s) => s.label)).toEqual(['I', 'vi', 'V', 'I', 'iii']);
    expect(j.steps[2]!.pivot).toEqual({ before: 'V/V', after: 'V' });
    expect([j.key, j.leaning, j.pending]).toEqual([G, null, null]);
    expect(bandsOf(j)).toEqual([
      { key: C, from: 0, to: 1 },
      { key: G, from: 2, to: 4 },
    ]);
  });

  it('un suspens prolongé : les accords communs ne tranchent pas', () => {
    const j = journeyOf(C, [M(C), M(D), M(G), m(E), M(C)]);
    expect(j.steps.slice(2).map((s) => s.event.kind)).toEqual(['suspens', 'suspens', 'suspens']);
    expect([j.key, j.leaning, j.pending]).toEqual([C, G, 1]);
  });

  it('un frôlement relancé, puis confirmé ailleurs', () => {
    const j = journeyOf(C, [M(C), M(D), m(6), M(A)]);
    expect(j.steps[2]!.event).toEqual({ kind: 'frole', target: D });
    expect(j.steps[3]!.event).toEqual({ kind: 'confirme', from: C, to: D, pivot: 2 });
    expect(j.steps.map((s) => s.key)).toEqual([C, C, D, D]);
  });

  it('les couleurs ne frôlent rien', () => {
    const emprunt = journeyOf(C, [M(C), m(F), M(C)]);
    expect(emprunt.steps[1]!.event).toEqual({ kind: 'couleur', cause: 'emprunt', anchor: 'IV' });
    expect(emprunt.leaning).toBeNull();
    const dominante = journeyOf(C, [M(C), M(E), m(A)]);
    expect(dominante.steps[1]!.event).toEqual({ kind: 'couleur', cause: 'dominante', anchor: 'vi' });
  });

  it('un accord répété ne change rien', () => {
    const j = journeyOf(C, [M(C), M(D), M(D)]);
    expect(j.steps[2]!.event).toEqual({ kind: 'repete' });
    expect(j.leaning).toBe(G);
  });

  it('annuler = recalculer sans le dernier accord', () => {
    const path = [M(C), m(A), M(D), M(G), m(B)];
    const j = journeyOf(C, path.slice(0, -1));
    expect([j.key, j.leaning, j.pending]).toEqual([C, G, 2]);
  });

  it('aller en Sol, puis rentrer à la maison', () => {
    const j = journeyOf(C, [M(C), M(D), M(G), m(B), dim(B), M(C), M(F)]);
    expect(j.steps[4]!.event).toEqual({ kind: 'frole', target: C });
    expect(j.steps[6]!.event).toEqual({ kind: 'confirme', from: G, to: C, pivot: 4 });
    expect(j.key).toBe(C);
    expect(bandsOf(j).map((b) => b.key)).toEqual([C, G, C]);
  });

  it('un départ hors de la maison frôle dès le premier accord', () => {
    const j = journeyOf(C, [M(D)]);
    expect(j.steps[0]!.event).toEqual({ kind: 'frole', target: G });
  });
});

describe('règle symétrique et boucle', () => {
  it('Si♭ fait pencher vers Fa, Sol m confirme', () => {
    const j = journeyOf(C, [M(C), M(10), M(F), m(G)]);
    expect(j.steps.map((s) => s.event)).toEqual([
      { kind: 'gamme' },
      { kind: 'frole', target: F },
      { kind: 'suspens', target: F },
      { kind: 'confirme', from: C, to: F, pivot: 1 },
    ]);
    expect(j.key).toBe(F);
    expect(j.steps[1]!.pivot).toEqual({ before: '♭VII', after: 'IV' });
  });

  it('Si♭ rejoué après un accord commun autre que la tonique confirme', () => {
    expect(journeyOf(C, [M(C), M(10), M(F), M(10)]).steps[3]!.event).toEqual({ kind: 'confirme', from: C, to: F, pivot: 1 });
  });

  it('Do – Si♭ – Do – Si♭ : une boucle, on reste en Do, et Si♭ n’y frôle plus', () => {
    const j = journeyOf(C, [M(C), M(10), M(C), M(10)]);
    expect(j.steps[3]!.event).toEqual({ kind: 'boucle', target: F, frole: 1 });
    expect([j.key, j.leaning, j.pending]).toEqual([C, null, null]);
    const longer = journeyOf(C, [M(C), M(10), M(C), M(10), M(C), M(10)]);
    expect(longer.steps[5]!.event).toEqual({ kind: 'couleur', cause: 'emprunt', anchor: 'vii°' });
    expect(longer.leaning).toBeNull();
  });

  it('la boucle vaut aussi côté dièses ; après un autre accord que la tonique, Ré confirme', () => {
    expect(journeyOf(C, [M(C), M(D), M(C), M(D)]).steps[3]!.event).toEqual({ kind: 'boucle', target: G, frole: 1 });
    expect(journeyOf(C, [M(C), M(D), M(G), M(D)]).steps[3]!.event).toEqual({ kind: 'confirme', from: C, to: G, pivot: 1 });
  });

  it('la mémoire des boucles s’oublie quand on change de tonalité', () => {
    const j = journeyOf(C, [M(C), M(10), M(C), M(10), M(D), M(G), m(B), M(F)]);
    expect(j.steps[6]!.event.kind).toBe('confirme');
    expect(j.key).toBe(G);
    expect(j.steps[7]!.event).toEqual({ kind: 'frole', target: C });
  });

  it('[C, Bb, C, Bb, D, Bb] : après la boucle, Si♭ relancé est éteint', () => {
    expect(journeyOf(C, [M(C), M(10), M(C), M(10), M(D), M(10)]).steps[5]!.event).toEqual({ kind: 'eteint', target: G, frole: 4 });
  });

  it('m(G) en boucle reste une couleur', () => {
    expect(journeyOf(C, [M(C), m(G), M(C), m(G)]).steps[3]!.event).toEqual({ kind: 'boucle', target: F, frole: 1 });
  });

  it('[C, D, Bb, C, Bb] : Si♭ après Ré frôleur boucle', () => {
    expect(journeyOf(C, [M(C), M(D), M(10), M(C), M(10)]).steps[4]!.event).toEqual({ kind: 'boucle', target: F, frole: 2 });
  });
});
