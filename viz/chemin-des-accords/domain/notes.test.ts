import { describe, expect, it } from 'vitest';
import type { Chord } from '../../suis-les-fleches/domain/harmony';
import { roleText } from '../../suis-les-fleches/domain/moves';
import { journeyOf } from './journey';
import { arrivalText, haloTip, noteFor, pct, pivotTip, recipeText, stepCard, whereText, type NoteContext, type NoteKind } from './notes';
import { routeTo } from './route';

const M = (root: number): Chord => ({ root, cls: 'maj' });
const m = (root: number): Chord => ({ root, cls: 'min' });
const dim = (root: number): Chord => ({ root, cls: 'dim' });
const ctx = (over: Partial<NoteContext> = {}): NoteContext => ({ share: 0.2, satellites: 0, seen: new Set<NoteKind>(['halos']), ...over });
const note = (chords: Chord[], over: Partial<NoteContext> = {}) => noteFor(journeyOf(0, chords), ctx(over));

describe('noteFor', () => {
  it('départ, puis halos la première fois', () => {
    expect(note([], { seen: new Set() })!.kind).toBe('depart');
    expect(note([M(0)], { seen: new Set() })).toMatchObject({ kind: 'halos', once: true });
    expect(note([M(0)])).toBeNull();
  });

  it('frôlement, suspens, extinction', () => {
    expect(note([M(0), M(2)])!.text).toBe('Ré n’est pas dans Do majeur : il tire vers Sol majeur. Pour y passer, joue Si m ou Fa♯ ° (ils n’existent qu’en Sol) ; pour rester en Do, joue Ré m, Fa ou Si °.');
    expect(note([M(0), M(2), m(4)])!.text).toBe('Mi m est en Do comme en Sol : on ne sait pas encore. Si m ou Fa♯ ° passeraient en Sol ; Ré m, Fa ou Si ° ramèneraient en Do.');
    expect(note([M(0), M(10)])!.text).toBe('Si♭ n’est pas dans Do majeur : il tire vers Fa majeur. Pour y passer, joue Sol m ou Mi ° (ils n’existent qu’en Fa) ; pour rester en Do, joue Mi m, Sol ou Si °.');
    expect(note([M(0), M(2), M(5)])!.text).toBe(`Fa n’existe qu’en Do majeur : Ré n’était qu’un détour vers Sol majeur (on dit une tonicisation).`);
    expect(note([M(0), M(2), m(5)])!.text).toMatch(/^Fa m ramène en Do majeur/);
  });

  it('frôlement vers une tonalité lointaine : pas de liste de portes', () => {
    expect(note([M(0), M(1)])!.text).toBe('Ré♭ n’est pas dans Do majeur : il tire vers La♭ majeur, à quatre crans. Un accord qui n’existe qu’en La♭ y fera passer ; un accord qui n’existe qu’en Do te ramènera.');
  });

  it('confirmation avec pivot, puis retour à la maison', () => {
    expect(note([M(0), m(9), M(2), M(7), m(11)])!.text).toBe(`Si m n’existe qu’en Sol majeur : on y est. Ré a servi de pivot : V/V en Do, V en Sol.`);
    expect(note([M(0), M(2), M(7), m(11), dim(11), M(0), M(5)])!.kind).toBe('retour');
  });

  it('retour à la maison par modulation : la légende « retour » est celle qui reste', () => {
    expect(note([M(0), M(2), M(7), m(11), dim(11), M(0), M(5)])!.kind).toBe('retour');
  });

  it('rejouer le même accord n’est pas un pas rare', () => {
    expect(note([M(0), M(0)], { share: 0 })?.kind).not.toBe('rare');
  });

  it('emprunt, emprunt en boucle, dominante vers un accord mineur', () => {
    expect(note([M(0), m(5)])!.text).toBe('Fa m vient de Do mineur : une ombre passagère, on reste en Do.');
    expect(note([M(0), M(10), M(0), M(10)])!.text).toBe('Do – Si♭ en boucle : le son du rock (mode mixolydien). On reste en Do : Si♭ est une couleur, pas une destination.');
    expect(note([M(0), M(10), M(0), M(10)])!.kind).toBe('boucle');
    expect(note([M(0), M(4)])!.text).toBe(`Mi pointe vers La m : il l’éclaire sans quitter Do majeur (une dominante secondaire).`);
  });

  it('pas rare et premier satellite, par priorité', () => {
    expect(note([M(0), M(7)], { share: 0.004 })!.text).toBe(`Peu de chansons font ce pas. Rien n’est interdit : à toi de juger à l’oreille.`);
    expect(note([M(0), M(7)], { share: 0.004 })!.kind).toBe('rare');
    // Au premier accord, les halos s'expliquent avant les satellites.
    expect(note([M(0)], { satellites: 2, seen: new Set<NoteKind>() })).toMatchObject({ kind: 'halos', once: true });
    expect(note([M(0)], { satellites: 2, seen: new Set<NoteKind>(['halos']) })).toMatchObject({ kind: 'satellite', once: true });
    expect(note([M(0), M(7)], { satellites: 2 })).toMatchObject({ kind: 'satellite', once: true });
    expect(note([M(0), M(7)], { satellites: 2, seen: new Set<NoteKind>(['halos', 'satellite']) })).toBeNull();
    // Un événement l'emporte sur une légende d'apprentissage.
    expect(note([M(0), M(2)], { satellites: 2, share: 0.004 })!.kind).toBe('frole');
  });
});

describe('textes', () => {
  it('où je suis', () => {
    expect(whereText(journeyOf(0, []))).toBe('la maison');
    expect(whereText(journeyOf(0, [M(0), M(2)]))).toBe('on penche vers Sol majeur');
    expect(whereText(journeyOf(0, [M(0), M(2), M(7), m(11)]))).toBe('parti de Do majeur, un cran vers les dièses');
    // En Sol, Si ° frôle Do, Do est commun, Fa n'existe qu'en Do : on a modulé d'un cran vers les bémols.
    expect(whereText(journeyOf(7, [M(7), dim(11), M(0), M(5)]))).toBe('parti de Sol majeur, un cran vers les bémols');
  });

  it('parts et bulles', () => {
    expect(pct(0.354)).toBe('35 %');
    expect(pct(0.004)).toBe('< 1 %');
    expect(haloTip(M(7), { chord: m(4), label: 'iii', share: 0.35, count: 0, satellite: false, anchor: null })).toBe('35 % des chansons qui jouent Sol font ensuite Mi m.');
    expect(pivotTip(M(2), 'V/V', 'V')).toBe('Ré appartient aux deux tonalités : V/V avant, V après.');
  });
});

describe('guidage et fiche', () => {
  it('les pas de la recette', () => {
    const r = routeTo(journeyOf(0, [M(0), M(7)]), 7)!;
    expect(r.recipe.map((s) => recipeText(s, 0, 7, 0))).toEqual([
      'commun : vi en Do, ii en Sol',
      'tire vers Sol (V/V)',
      'n’existe qu’en Sol : confirmé',
      'Sol, la nouvelle maison',
    ]);
    const far = routeTo(journeyOf(0, [M(0)]), 9)!;
    expect(recipeText(far.recipe[far.recipe.length - 1]!, 0, far.hop, 0, 9)).toBe('Sol, une étape vers La');
    const back = routeTo(journeyOf(7, [M(7)]), 0)!;
    expect(recipeText(back.recipe[back.recipe.length - 1]!, 7, 0, 0)).toBe('Do, la maison');
  });

  it('l’arrivée', () => {
    expect(arrivalText(7)).toBe('Te voilà en Sol majeur.');
  });

  it('la fiche d’un accord', () => {
    const j = journeyOf(0, [M(0), m(9), M(2), M(7), m(11)]);
    expect(stepCard(j, 2)).toEqual({
      name: 'Ré',
      key: 'Do majeur, puis Sol majeur',
      degree: 'V/V en Do, V en Sol',
      role: roleText(M(2), 7),
      did: 'il a fait pencher vers Sol majeur ; il est devenu le pivot (V en Sol).',
    });
    expect(stepCard(j, 4)).toMatchObject({ key: 'Sol majeur', degree: 'iii', did: 'il a confirmé le passage en Sol majeur.' });
    expect(stepCard(j, 0).did).toBe('il ouvre le chemin.');
    expect(stepCard(j, 1).did).toBe('il reste dans la tonalité.');
    expect(stepCard(journeyOf(0, [M(0), m(5)]), 1).did).toBe('une couleur empruntée à Do mineur, sans quitter la tonalité.');
    expect(stepCard(journeyOf(0, [M(0), M(2), M(5)]), 2).did).toBe('il a ramené en Do majeur : Ré n’était qu’un détour.');
    expect(stepCard(journeyOf(0, [M(0), M(10), M(0), M(10)]), 3).did).toBe('un aller-retour autour de la tonique : une couleur, pas une destination.');
  });
});
