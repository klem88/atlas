import { describe, expect, it } from 'vitest';
import type { Chord } from '../../suis-les-fleches/domain/harmony';
import { journeyOf } from './journey';
import { doors, guideOf, hopsTo, nextHop, routeTo } from './route';

const M = (root: number): Chord => ({ root, cls: 'maj' });
const m = (root: number): Chord => ({ root, cls: 'min' });
const dim = (root: number): Chord => ({ root, cls: 'dim' });
const [C, D, E, F, G, A, B] = [0, 2, 4, 5, 7, 9, 11];

describe('la route sur l’anneau', () => {
  it('de voisine en voisine, côté dièses ou bémols (à six crans : dièses)', () => {
    expect(nextHop(C, G)).toBe(G);
    expect(nextHop(C, F)).toBe(F);
    expect(hopsTo(C, A)).toEqual([G, D, A]);
    expect(hopsTo(C, 3)).toEqual([F, 10, 3]);
    expect(hopsTo(C, 6)).toEqual([G, D, A, E, B, 6]);
  });

  it('les portes entre deux tonalités voisines', () => {
    expect(doors(C, G)).toEqual({ pass: [m(B), M(D), dim(6)], back: [m(D), M(F), dim(B)] });
    expect(doors(C, F)).toEqual({ pass: [m(G), M(10), dim(E)], back: [m(E), M(G), dim(B)] });
  });
});

describe('routeTo', () => {
  it('Do vers Sol : commun, tire, confirme, arrive', () => {
    const r = routeTo(journeyOf(C, [M(C), M(G)]), G)!;
    expect([r.target, r.hop, r.hops]).toEqual([G, G, [G]]);
    expect(r.recipe.map((s) => [s.chord, s.why])).toEqual([
      [m(A), 'pivot'],
      [M(D), 'frole'],
      [m(B), 'confirme'],
      [M(G), 'arrivee'],
    ]);
    expect(r.recipe.map((s) => s.here)).toEqual(['vi', 'V/V', 'vii', 'V']);
    expect(r.recipe.map((s) => s.there)).toEqual(['ii', 'V', 'iii', 'I']);
  });

  it('Do vers Fa : Ré m, Si♭, Sol m, Fa', () => {
    const r = routeTo(journeyOf(C, [M(C)]), F)!;
    expect(r.recipe.map((s) => [s.chord, s.why])).toEqual([
      [m(D), 'pivot'],
      [M(10), 'frole'],
      [m(G), 'confirme'],
      [M(F), 'arrivee'],
    ]);
  });

  it('saute le pivot si on y est déjà, et ne garde que la fin quand on penche déjà', () => {
    expect(routeTo(journeyOf(C, [M(C), m(A)]), G)!.recipe.map((s) => s.why)).toEqual(['frole', 'confirme', 'arrivee']);
    expect(routeTo(journeyOf(C, [M(C), M(D)]), G)!.recipe.map((s) => s.chord)).toEqual([m(B), M(G)]);
  });

  it('ne fait jamais rejouer le dernier accord : il cède la place à celui qui fait pencher', () => {
    expect(routeTo(journeyOf(C, [M(C), m(B)]), G)!.recipe.map((s) => [s.chord, s.why])).toEqual([
      [M(D), 'confirme'],
      [M(G), 'arrivee'],
    ]);
    expect(routeTo(journeyOf(C, [M(C), m(G)]), F)!.recipe.map((s) => [s.chord, s.why])).toEqual([
      [M(10), 'confirme'],
      [M(F), 'arrivee'],
    ]);
  });

  it('chaque pas de la recette, rejoué par la règle, fait ce qu’il annonce, et mène à l’étape', () => {
    const starts: [number, Chord[]][] = [
      [C, [M(C)]],
      [C, [M(C), M(G)]],
      [C, [M(C), m(A)]],
      [C, [M(C), M(D)]],
      [C, [M(C), m(B)]],
      [C, [M(C), m(G)]],
      [C, [M(C), m(G), M(C)]],
      [C, [M(C), m(B), M(C)]],
      [C, [M(C), M(10), M(C), M(10)]],
      [C, [M(C), M(D), M(C), M(D)]],
      [G, [M(G)]],
    ];
    for (const [home, path] of starts) {
      const j = journeyOf(home, path);
      const targets = [(j.key + 7) % 12, (j.key + 5) % 12, ...(j.leaning !== null ? [j.leaning] : [])];
      for (const target of targets) {
        const r = routeTo(j, target)!;
        const where = `${path.map((c) => `${c.root}${c.cls}`).join(',')} vers ${target}`;
        // Une recette vide n’est admise que si aucune porte ne fait pencher ni ne confirme (aucun cas aujourd’hui).
        expect(r.recipe.length, where).toBeGreaterThan(0);
        const played = [...path];
        for (const s of r.recipe) {
          played.push(s.chord);
          const e = journeyOf(home, played).steps[played.length - 1]!.event;
          expect(e.kind, `${where}, ${s.chord.root}${s.chord.cls}`).not.toBe('repete');
          expect(e.kind, `${where}, ${s.chord.root}${s.chord.cls}`).not.toBe('boucle');
          if (s.why === 'frole') expect(e, where).toEqual({ kind: 'frole', target: r.hop });
          if (s.why === 'confirme') expect(e.kind === 'confirme' && e.to === r.hop, `${where} : ${JSON.stringify(e)}`).toBe(true);
        }
        expect(journeyOf(home, played).key, where).toBe(r.hop);
      }
    }
  });

  it('après Do – Sol m – Do, on ne rejoue pas Sol m (ce serait une boucle) : Si♭ confirme', () => {
    expect(routeTo(journeyOf(C, [M(C), m(G), M(C)]), F)!.recipe.map((s) => [s.chord, s.why])).toEqual([
      [M(10), 'confirme'],
      [M(F), 'arrivee'],
    ]);
  });

  it('après une boucle Do – Si♭ – Do – Si♭, Si♭ ne mène plus vers Fa', () => {
    const r = routeTo(journeyOf(C, [M(C), M(10), M(C), M(10)]), F)!;
    expect(r.recipe.some((s) => s.why === 'frole' && s.chord.root === 10 && s.chord.cls === 'maj')).toBe(false);
    expect(r.pass).not.toContainEqual(M(10));
    expect(r.recipe.map((s) => [s.chord, s.why])).toEqual([
      [m(D), 'pivot'],
      [m(G), 'frole'],
      [M(10), 'confirme'],
      [M(F), 'arrivee'],
    ]);
  });

  it('une destination lointaine guide vers la première voisine', () => {
    const r = routeTo(journeyOf(C, [M(C)]), A)!;
    expect([r.hop, r.hops]).toEqual([G, [G, D, A]]);
    expect(r.recipe[r.recipe.length - 1]!.chord).toEqual(M(G));
  });

  it('rien quand on est déjà dans la tonalité visée', () => {
    expect(routeTo(journeyOf(C, [M(C), m(A), M(D), M(G), m(B)]), G)).toBeNull();
    expect(routeTo(journeyOf(C, []), C)).toBeNull();
  });

  it('au départ, sans accord joué, la recette commence par le pivot', () => {
    expect(routeTo(journeyOf(C, []), G)!.recipe[0]!.chord).toEqual(m(A));
  });
});

describe('guideOf', () => {
  it('mène, commun, ramène, neutre', () => {
    const r = routeTo(journeyOf(C, [M(C)]), G)!;
    expect(guideOf(M(D), r, C)).toBe('mene');
    expect(guideOf(m(B), r, C)).toBe('mene');
    expect(guideOf(m(A), r, C)).toBe('commun');
    expect(guideOf(M(F), r, C)).toBe('ramene');
    expect(guideOf(M(10), r, C)).toBe('neutre');
  });
});
