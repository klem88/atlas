# Le chemin des accords, piste B (guidage) — plan d'implémentation

> **Pour les agents :** sous-compétence requise : superpowers:subagent-driven-development. Les étapes sont des cases à cocher (`- [ ]`).

**Objectif :** qu'on comprenne comment moduler. Règle symétrique (Si♭ mène vers Fa comme Ré mène vers Sol), guidage vers une destination (touchée sur l'anneau, ou implicite quand la page penche), et fiche explicative de chaque accord du ruban.

**Architecture :** le savoir reste dans `viz/chemin-des-accords/domain/` : `journey.ts` (règle), nouveau `route.ts` (route, recette, portes, guide d'un accord), `notes.ts` (textes). L'interface (`ui/map.ts`, `ui/ribbon.ts`, `main.ts`, `index.html`, `viz.css`) dessine ces résultats.

**Pile :** Vite + TypeScript strict, sans framework ; SVG ; Vitest.

**Spécification :** [docs/chantiers/chemin-des-accords.md](../../chantiers/chemin-des-accords.md), section « Piste B : guidage ». La lire avant toute tâche.

## Contraintes globales

- Langue : interface, textes, commentaires et messages de commit **en français** ; tutoiement ; apostrophe typographique `’` dans les textes affichés ; pas de genre supposé pour l'utilisateur (« Te voilà en… », pas « Tu es arrivé »).
- Vite + TypeScript strict, **sans framework**, aucune dépendance nouvelle. `viz/suis-les-fleches/` **ne doit pas être modifié**.
- Une seule teinte vive : `var(--accent)` ; jetons de `src/shell/tokens.css` uniquement ; clair et sombre ; `prefers-reduced-motion` sans transitions.
- Disques des sept accords ≥ 44 px à 375 px ; aucun défilement horizontal de la page.
- La destination n'entre pas dans l'URL.
- `npm test` et `npm run typecheck` au vert avant chaque commit. Messages de commit terminés exactement par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Branche `feat/chemin-guidage`. Ne rien pousser.

## Rappels sur le code existant

- `domain/journey.ts` : `journeyOf(home, chords): Journey` (`{ home, steps, key, leaning, pending }`), `JourneyStep` (`{ chord, key, label, event, pivot }`), `StepEvent` (`gamme`, `repete`, `couleur`, `frole`, `suspens`, `confirme`, `eteint`), `leanOf(c, key)`, `bandsOf(j)`.
- `domain/notes.ts` : `noteFor(j, ctx)`, `NoteKind` (contient déjà `'boucle'`), `whereText`, `pct`, `haloTip`, `pivotTip`, `RING_TIP`, `RIBBON_TIP` ; helper interne `short(tonic)` (« Sol »).
- Depuis `viz/suis-les-fleches/domain/harmony.ts` : `Chord`, `mod12`, `chordId`, `sameChord`, `chordAt`, `nameOf` (« Si m », « Fa♯ ° »), `keyName` (« Sol majeur »), `roleOf(c, tonic)` (`label` : « V/V », « ♭VII », « v », « iv »… ; `kind` ; `anchor`), `diatonicChords(tonic)` (`{ chord, role }[]` dans l'ordre I, ii, iii, IV, V, vi, vii°), `keysContaining`, `fifthsOffset`, `fifthsIndex`. Depuis `layout.ts` : `chordByLabel`. Depuis `moves.ts` : `roleText(c, tonic)`.
- `ui/map.ts` : `ChordMap` (`render(v: MapView)`, `preview(c)`), `layout()` place au plus quatre satellites (accord du moment, précédent, candidats) ; `MapOptions { onPick, onHover, reducedMotion }`.
- `main.ts` : `render(n = path.length)`, `renderPanel`, `pick`, `listen`/`stopListening` (`playing`), état de chargement `shardState`, légende mémorisée (`noteKey`, `noteText`, `noteOnce`, `seen`).

---

### Tâche 1 : la règle symétrique et la boucle (`journey.ts`)

**Fichiers :** modifier `viz/chemin-des-accords/domain/journey.ts`, `viz/chemin-des-accords/domain/journey.test.ts`, `viz/chemin-des-accords/domain/notes.ts` (seulement pour que `noteFor` traite le nouvel événement), `viz/chemin-des-accords/domain/notes.test.ts`.

**Interfaces produites :** `StepEvent` gagne `{ kind: 'boucle'; target: number; frole: number }` ; `leanOf` renvoie la sous-dominante pour ♭VII et v.

- [ ] **Étape 1 : tests qui échouent.** Dans `journey.test.ts`, remplacer le premier `it` du `describe('leanOf…')` (« rien pour la gamme, les emprunts et les dominantes de cibles mineures ») par :

```ts
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
```

et ajouter à la fin du fichier :

```ts
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
});
```

- [ ] **Étape 2 : vérifier l'échec** — `npx vitest run viz/chemin-des-accords/domain/journey.test.ts`.

- [ ] **Étape 3 : code.** Dans `journey.ts` :
  1. Importer `chordId` et `mod12` depuis `../../suis-les-fleches/domain/harmony` (avec les imports existants).
  2. Ajouter à `StepEvent` : `| { kind: 'boucle'; target: number; frole: number }`.
  3. Remplacer `leanOf` par :

```ts
/** La tonalité vers laquelle un accord fait pencher, ou `null` (dans la gamme, ou simple couleur).
 *  Vers les dièses : V/V penche vers la dominante. Vers les bémols : ♭VII et v (empruntés) penchent vers la sous-dominante. */
export function leanOf(c: Chord, key: number): number | null {
  const r = roleOf(c, key);
  if (r.kind === 'diatonique') return null;
  if (r.kind === 'emprunt') return r.label === '♭VII' || r.label === 'v' ? mod12(key + 5) : null;
  if (r.kind === 'dominante') {
    const target = chordAt(key, chordByLabel(r.anchor!)!.degree);
    return target.cls === 'maj' ? target.root : null;
  }
  return keysContaining(c, key)[0]?.tonic ?? null;
}
```

  4. `freshEvent` prend un troisième paramètre `loops: ReadonlySet<string>` ; en tête, après le cas diatonique : `if (loops.has(chordId(c))) return { kind: 'couleur', cause: r.kind === 'emprunt' ? 'emprunt' : 'dominante', anchor: r.anchor ?? 'I' };`.
  5. Dans `journeyOf` : `let loops = new Set<string>();` ; appeler `freshEvent(c, key, loops)` ; dans la branche `inNew && !inOld`, **avant** la confirmation :

```ts
      const frolant = steps[pending!]!.chord;
      const before = steps[i - 1];
      // Aller-retour autour de la tonique (Do – Si♭ – Do – Si♭) : une couleur, pas une destination.
      if (sameChord(c, frolant) && before && before.chord.cls === 'maj' && before.chord.root === key) {
        steps.push({ chord: c, key, event: { kind: 'boucle', target: leaning, frole: pending! }, pivot: null });
        loops.add(chordId(c));
        leaning = null;
        pending = null;
        return;
      }
```

  et, dans la confirmation, après `key = to;` : `loops = new Set();`.
  6. Commentaire d'en-tête du fichier : ajouter une phrase sur la règle symétrique et la boucle.

- [ ] **Étape 4 : `noteFor` traite `boucle`.** Dans `notes.ts`, ajouter dans le `switch` de `noteFor`, avant `case 'couleur'` :

```ts
    case 'boucle':
      return ev('boucle', loopText(j.steps[n - 2]!.chord, c, last.label, j.key));
```

et extraire le texte de boucle déjà présent dans le cas `couleur` en une fonction réutilisée par les deux cas :

```ts
/** « Do – Si♭ en boucle : le son du rock (mode mixolydien). On reste en Do : Si♭ est une couleur, pas une destination. » */
function loopText(tonic: Chord, c: Chord, label: string, key: number): string {
  const why = label === '♭VII' ? 'le son du rock (mode mixolydien)' : 'une couleur qui revient';
  return `${nameOf(tonic)} – ${nameOf(c)} en boucle : ${why}. On reste en ${short(key)} : ${nameOf(c)} est une couleur, pas une destination.`;
}
```

(le cas `couleur` appelle alors `loopText(before.chord, c, last.label, j.key)`).

- [ ] **Étape 5 : tests de `notes.test.ts`.** Le test « emprunt, emprunt en boucle, dominante vers un accord mineur » attend que `[C, Si♭]` soit un emprunt : ce n'est plus vrai. Remplacer sa première assertion par l'emprunt de Fa m :

```ts
    expect(note([M(0), m(5)])!.text).toBe('Fa m vient de Do mineur : une ombre passagère, on reste en Do.');
```

Garder l'assertion de boucle `[C, Si♭, C, Si♭]` (même texte, désormais produit par l'événement `boucle`), et ajouter `expect(note([M(0), M(10), M(0), M(10)])!.kind).toBe('boucle');`. Les autres tests de `notes.test.ts` ne changent pas dans cette tâche.

- [ ] **Étape 6 : vérifier** — test ciblé de `journey` et `notes`, puis `npm test`, `npm run typecheck`.

- [ ] **Étape 7 : commit** — `feat(chemin-des-accords): règle symétrique (Si♭ mène vers Fa) et boucle autour de la tonique` + ligne Co-Authored-By.

---

### Tâche 2 : la route (`route.ts`)

**Fichiers :** créer `viz/chemin-des-accords/domain/route.ts`, `viz/chemin-des-accords/domain/route.test.ts`.

**Interfaces produites :**

```ts
export type Guide = 'mene' | 'commun' | 'ramene' | 'neutre';
export type RecipeWhy = 'pivot' | 'frole' | 'confirme' | 'arrivee';
export interface RecipeStep { chord: Chord; why: RecipeWhy; here: string; there: string }
export interface Route { target: number; hop: number; hops: number[]; recipe: RecipeStep[]; pass: Chord[]; back: Chord[] }
export function nextHop(from: number, target: number): number;
export function hopsTo(from: number, target: number): number[];
export function doors(from: number, to: number): { pass: Chord[]; back: Chord[] };
export function routeTo(j: Journey, target: number): Route | null;
export function guideOf(c: Chord, r: Route, key: number): Guide;
```

- [ ] **Étape 1 : tests qui échouent** — `route.test.ts` :

```ts
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
```

- [ ] **Étape 2 : vérifier l'échec** — `npx vitest run viz/chemin-des-accords/domain/route.test.ts`.

- [ ] **Étape 3 : `route.ts`**

```ts
/**
 * La route vers une tonalité : de voisine en voisine sur le cycle des quintes, et pour la prochaine voisine (« l'étape »),
 * une recette de trois ou quatre accords (un commun, celui qui fait pencher, celui qui confirme, la nouvelle tonique),
 * les portes (ce qui mène, ce qui ramène) et le guide de chaque accord de la carte.
 */
import { diatonicChords, fifthsOffset, mod12, roleOf, sameChord, type Chord } from '../../suis-les-fleches/domain/harmony';
import type { Journey } from './journey';

export type Guide = 'mene' | 'commun' | 'ramene' | 'neutre';
export type RecipeWhy = 'pivot' | 'frole' | 'confirme' | 'arrivee';

export interface RecipeStep {
  chord: Chord;
  why: RecipeWhy;
  /** Son degré dans la tonalité du moment, et dans l'étape. */
  here: string;
  there: string;
}

export interface Route {
  /** La destination, l'étape (prochaine voisine), et toutes les tonalités traversées jusqu'à la destination. */
  target: number;
  hop: number;
  hops: number[];
  recipe: RecipeStep[];
  /** Les accords qui n'existent que dans l'étape (ils y mènent), et ceux qui n'existent que dans la tonalité du moment (ils ramènent). */
  pass: Chord[];
  back: Chord[];
}

const inKey = (c: Chord, key: number) => roleOf(c, key).kind === 'diatonique';
const M = (root: number): Chord => ({ root: mod12(root), cls: 'maj' });
const m = (root: number): Chord => ({ root: mod12(root), cls: 'min' });

/** La voisine sur le cycle des quintes en direction de `target` (à six crans : côté dièses). */
export function nextHop(from: number, target: number): number {
  const off = fifthsOffset(from, target);
  return off === 0 ? mod12(from) : mod12(from + (off > 0 ? 7 : 5));
}

export function hopsTo(from: number, target: number): number[] {
  const out: number[] = [];
  let k = mod12(from);
  while (k !== mod12(target)) {
    k = nextHop(k, target);
    out.push(k);
  }
  return out;
}

export function doors(from: number, to: number): { pass: Chord[]; back: Chord[] } {
  return {
    pass: diatonicChords(to).map((d) => d.chord).filter((c) => !inKey(c, from)),
    back: diatonicChords(from).map((d) => d.chord).filter((c) => !inKey(c, to)),
  };
}

export function routeTo(j: Journey, target: number): Route | null {
  const t = mod12(target);
  if (j.key === t) return null;
  const hops = hopsTo(j.key, t);
  const hop = hops[0]!;
  const sharp = mod12(hop - j.key) === 7;
  // Vers les dièses : vi (= ii de l'étape), V/V, iii de l'étape. Vers les bémols : ii (= vi de l'étape), ♭VII, ii de l'étape.
  const pivot = sharp ? m(j.key + 9) : m(j.key + 2);
  const frolant = sharp ? M(j.key + 2) : M(j.key + 10);
  const confirm = sharp ? m(hop + 4) : m(hop + 2);
  const last = j.steps[j.steps.length - 1]?.chord ?? null;
  const plan: [Chord, RecipeWhy][] =
    j.leaning === hop
      ? [
          [confirm, 'confirme'],
          [M(hop), 'arrivee'],
        ]
      : [...(last && sameChord(last, pivot) ? [] : [[pivot, 'pivot'] as [Chord, RecipeWhy]]), [frolant, 'frole'], [confirm, 'confirme'], [M(hop), 'arrivee']];
  const recipe = plan.map(([chord, why]) => ({ chord, why, here: roleOf(chord, j.key).label, there: roleOf(chord, hop).label }));
  return { target: t, hop, hops, recipe, ...doors(j.key, hop) };
}

export function guideOf(c: Chord, r: Route, key: number): Guide {
  if (r.pass.some((x) => sameChord(x, c))) return 'mene';
  const here = inKey(c, key);
  const there = inKey(c, r.hop);
  if (here && there) return 'commun';
  if (here) return 'ramene';
  return 'neutre';
}
```

- [ ] **Étape 4 : vérifier le succès.** Si une étiquette `here` diffère (par exemple celle de Si m en Do, accord « d'ailleurs »), afficher `roleOf(m(11), 0).label` et aligner **le test** sur la valeur réelle de `roleOf` (socle de la page sœur, à ne pas modifier) ; le dire dans le rapport.

- [ ] **Étape 5 : commit** — `feat(chemin-des-accords): la route vers une tonalité (recette, portes, guide)` + Co-Authored-By.

---

### Tâche 3 : les textes du guidage et de la fiche (`notes.ts`)

**Fichiers :** modifier `viz/chemin-des-accords/domain/notes.ts`, `viz/chemin-des-accords/domain/notes.test.ts`.

**Interfaces produites :**

```ts
export function recipeText(s: RecipeStep, key: number, hop: number, home: number): string;
export function arrivalText(t: number): string;
export const DEST_HINT: string;
export interface StepCard { name: string; key: string; degree: string; role: string; did: string }
export function stepCard(j: Journey, i: number): StepCard;
```

et les légendes `frole` et `suspens` nomment les portes.

- [ ] **Étape 1 : tests.** Dans `notes.test.ts` : remplacer les deux attentes de texte existantes du frôlement (`[M(0), M(2)]`) et du suspens (`[M(0), M(2), m(4)]`) par :

```ts
    expect(note([M(0), M(2)])!.text).toBe('Ré n’est pas dans Do majeur : il tire vers Sol majeur. Pour y passer, joue Si m ou Fa♯ ° (ils n’existent qu’en Sol) ; pour rester en Do, joue Ré m, Fa ou Si °.');
    expect(note([M(0), M(2), m(4)])!.text).toBe('Mi m est en Do comme en Sol : on ne sait pas encore. Si m ou Fa♯ ° passeraient en Sol ; Ré m, Fa ou Si ° ramèneraient en Do.');
    expect(note([M(0), M(10)])!.text).toBe('Si♭ n’est pas dans Do majeur : il tire vers Fa majeur. Pour y passer, joue Sol m ou Mi ° (ils n’existent qu’en Fa) ; pour rester en Do, joue Mi m, Sol ou Si °.');
```

et ajouter (imports : `routeTo` depuis `./route`, `roleText` depuis `../../suis-les-fleches/domain/moves`, `recipeText`, `arrivalText`, `stepCard` depuis `./notes`) :

```ts
describe('guidage et fiche', () => {
  it('les pas de la recette', () => {
    const r = routeTo(journeyOf(0, [M(0), M(7)]), 7)!;
    expect(r.recipe.map((s) => recipeText(s, 0, 7, 0))).toEqual([
      'commun : vi en Do, ii en Sol',
      'tire vers Sol (V/V)',
      'n’existe qu’en Sol : confirmé',
      'Sol, la nouvelle maison',
    ]);
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
```

- [ ] **Étape 2 : vérifier l'échec.**

- [ ] **Étape 3 : code** dans `notes.ts` (imports : `doors`, `type RecipeStep` depuis `./route` ; `roleText` depuis `../../suis-les-fleches/domain/moves`) :

```ts
/** « A », « A ou B », « A, B ou C ». */
function either(chords: readonly Chord[]): string {
  const names = chords.map(nameOf);
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} ou ${names[names.length - 1]}`;
}

/** Les accords qui feraient passer vers `target` (sauf celui qui a frôlé) et ceux qui ramènent dans `key`. */
function doorsOf(key: number, target: number, frolant: Chord) {
  const d = doors(key, target);
  return { pass: d.pass.filter((c) => !sameChord(c, frolant)), back: d.back };
}
```

Cas `frole` de `noteFor` :

```ts
    case 'frole': {
      const { pass, back } = doorsOf(last.key, e.target, c);
      const go = pass.length ? ` Pour y passer, joue ${either(pass)} (${pass.length > 1 ? 'ils n’existent' : 'il n’existe'} qu’en ${short(e.target)})` : '';
      const stay = back.length ? `${go ? ' ;' : ''} pour rester en ${short(last.key)}, joue ${either(back)}` : '';
      return ev('frole', `${nameOf(c)} n’est pas dans ${keyName(last.key)} : il tire vers ${keyName(e.target)}.${go}${stay}.`);
    }
```

Cas `suspens` :

```ts
    case 'suspens': {
      const { pass, back } = doorsOf(last.key, e.target, j.steps[j.pending ?? n - 1]!.chord);
      const go = pass.length ? ` ${either(pass)} passerai${pass.length > 1 ? 'ent' : 't'} en ${short(e.target)}` : '';
      const stay = back.length ? `${go ? ' ;' : ''} ${either(back)} ramènerai${back.length > 1 ? 'ent' : 't'} en ${short(last.key)}` : '';
      return ev('suspens', `${nameOf(c)} est en ${short(last.key)} comme en ${short(e.target)} : on ne sait pas encore.${go}${stay}.`);
    }
```

(Vérifier que « pour rester » commence en minuscule après « ; » et que la phrase se termine par un seul point, comme dans les tests.)

Ajouter :

```ts
const WHY: Record<RecipeStep['why'], (s: RecipeStep, key: number, hop: number, home: number) => string> = {
  pivot: (s, key, hop) => `commun : ${s.here} en ${short(key)}, ${s.there} en ${short(hop)}`,
  frole: (s, _key, hop) => `tire vers ${short(hop)} (${s.here})`,
  confirme: (_s, _key, hop) => `n’existe qu’en ${short(hop)} : confirmé`,
  arrivee: (_s, _key, hop, home) => `${short(hop)}, ${hop === home ? 'la maison' : 'la nouvelle maison'}`,
};

export const recipeText = (s: RecipeStep, key: number, hop: number, home: number) => WHY[s.why](s, key, hop, home);

export const arrivalText = (t: number) => `Te voilà en ${keyName(t)}.`;

export const DEST_HINT = 'Touche une tonalité de l’anneau pour t’y rendre : la carte te montrera le chemin.';

export interface StepCard {
  name: string;
  key: string;
  degree: string;
  role: string;
  did: string;
}

/** La fiche d'un accord du chemin : où il est, ce qu'il est, ce qu'il a fait. */
export function stepCard(j: Journey, i: number): StepCard {
  const s = j.steps[i]!;
  const e = s.event;
  const confirm = s.pivot ? j.steps.find((x) => x.event.kind === 'confirme' && x.event.pivot === i) : undefined;
  const from = confirm && confirm.event.kind === 'confirme' ? confirm.event.from : s.key;
  let did: string;
  switch (e.kind) {
    case 'gamme':
      did = i === 0 ? 'il ouvre le chemin' : 'il reste dans la tonalité';
      break;
    case 'repete':
      did = 'il se répète';
      break;
    case 'couleur':
      did =
        e.cause === 'emprunt'
          ? `une couleur empruntée à ${short(s.key)} mineur, sans quitter la tonalité`
          : `il éclaire ${nameOf(chordAt(s.key, chordByLabel(e.anchor)!.degree))} sans quitter la tonalité`;
      break;
    case 'frole':
      did = `il a fait pencher vers ${keyName(e.target)}`;
      break;
    case 'suspens':
      did = 'commun aux deux tonalités, il a laissé la question ouverte';
      break;
    case 'confirme':
      did = `il a confirmé le passage en ${keyName(e.to)}`;
      break;
    case 'eteint':
      did = `il a ramené en ${keyName(s.key)} : ${nameOf(j.steps[e.frole]!.chord)} n’était qu’un détour`;
      break;
    case 'boucle':
      did = 'un aller-retour autour de la tonique : une couleur, pas une destination';
      break;
  }
  // (Si TypeScript juge `did` possiblement non assigné, l'initialiser à '' : le switch couvre tous les cas.)
  if (s.pivot) did += ` ; il est devenu le pivot (${s.pivot.after} en ${short(s.key)})`;
  return {
    name: nameOf(s.chord),
    key: s.pivot ? `${keyName(from)}, puis ${keyName(s.key)}` : keyName(s.key),
    degree: s.pivot ? `${s.pivot.before} en ${short(from)}, ${s.pivot.after} en ${short(s.key)}` : s.label,
    role: roleText(s.chord, s.key),
    did: `${did}.`,
  };
}
```

(Le pivot porte, dans `journeyOf`, la tonalité d'arrivée : `s.key` vaut la nouvelle tonalité, `from` se lit dans l'événement `confirme` qui le désigne.)

- [ ] **Étape 4 : vérifier le succès** (`notes.test.ts`, puis `npm test`, `npm run typecheck`). Attention aux apostrophes typographiques dans les chaînes ; vérifier par une recherche qu'aucune apostrophe droite n'est entrée dans un texte affiché.

- [ ] **Étape 5 : commit** — `feat(chemin-des-accords): légendes qui nomment les portes, recette, fiche d’un accord` + Co-Authored-By.

---

### Tâche 4 : la destination sur la carte et dans le panneau

**Fichiers :** modifier `viz/chemin-des-accords/ui/map.ts`, `viz/chemin-des-accords/main.ts`, `viz/chemin-des-accords/index.html`, `viz/chemin-des-accords/viz.css`.

**Interfaces :** consomme `routeTo`, `guideOf`, `type Route` (tâche 2), `recipeText`, `arrivalText`, `DEST_HINT` (tâche 3). `MapView` gagne `route: Route | null` ; `MapOptions` gagne `onKey: (tonic: number) => void`.

Lire d'abord `ui/map.ts` et `main.ts` en entier.

- [ ] **Étape 1 : la carte (`ui/map.ts`).**
  1. **Anneau touchable.** Chaque `g.ring-key` reçoit `tabindex="0"`, `role="button"`, `aria-label="Aller vers <keyName(t)>"`, un `click` et `keydown` (Entrée, Espace) qui appellent `this.opts.onKey(t)`. Le `data-tip` de l'anneau reste (bulle).
  2. **Destination.** Dans `drawRing`, classe `is-destination` sur la tonalité `v.route?.target`, et un second arc `this.routeArc` (créé dans le constructeur dans `this.ring`, classe `map-route-arc`) : `arcPath(HOME_ARC, keyAngle(v.key), keyAngle(v.key) + 30 * fifthsOffset(v.key, v.route.target))` quand une route existe, vide sinon.
  3. **Satellites de la route.** Dans `layout()`, après l'accord du moment et le précédent et **avant** les candidats, ajouter les accords de `v.route.pass` qui ne sont pas dans la gamme du moment, avec `label = '→ ' + nameOf({ root: v.route.hop, cls: 'maj' })` et `anchor = roleOf(chord, v.route.hop).label` (ils se posent près de la place qu'ils prendront). Le plafond de quatre satellites ne change pas.
  4. **Guide.** Dans `drawNodes`, quand `v.route` existe, ajouter la classe `map-node--guide-<guideOf(chord, v.route, v.key)>` à chaque disque, et `is-next` au disque de `v.route.recipe[0].chord`. Ajouter à chaque disque créé un cercle `map-node-ring` (rayon = rayon du disque + 10) avant le disque, invisible par défaut (CSS).
  5. **Halos discrets.** Dans `drawHalos`, quand `v.route` existe, un halo dont l'accord n'est ni `mene` ni `recipe[0]` reçoit la classe `map-halo--muted` (son pourcentage reste).
  6. Bulles : le `data-tip` d'un satellite de la route dit `<nom> : <degré dans l'étape> en <étape> ; il n’existe pas en <tonalité du moment>.` (ex. « Si m : iii en Sol ; il n’existe pas en Do. »).

- [ ] **Étape 2 : styles (`viz.css`).**

```css
.ring-key {
  cursor: pointer;
}
.ring-key:focus-visible .ring-key-mark {
  stroke: var(--focus);
}
.ring-key.is-destination .ring-key-mark {
  stroke: var(--accent);
  stroke-width: 4;
  stroke-dasharray: 6 5;
}
.map-route-arc {
  fill: none;
  stroke: var(--accent);
  stroke-width: 3;
  stroke-dasharray: 10 8;
  marker-end: url(#map-head-accent);
}
.map-node-ring {
  fill: none;
  stroke: transparent;
  stroke-width: 3;
}
.map-node--guide-commun .map-node-ring {
  stroke: var(--ink-3);
  stroke-dasharray: 4 6;
}
.map-node--guide-mene .map-node-disc {
  stroke: var(--accent);
  stroke-width: 5;
}
.map-node--guide-ramene {
  opacity: 0.35;
}
.map-node.is-next .map-node-ring {
  stroke: var(--accent);
  stroke-width: 6;
  stroke-dasharray: none;
}
.map-halo--muted {
  fill: var(--ink-3);
  fill-opacity: 0.1;
}
```

- [ ] **Étape 3 : le panneau (`index.html`).** Après le bloc « Où aller », ajouter :

```html
          <div class="panel-block route-block" id="route-block">
            <p class="panel-label"><span id="route-title">Destination</span> <button type="button" class="route-clear" id="route-clear" aria-label="Abandonner la destination">✕</button></p>
            <ol class="recipe" id="recipe"></ol>
            <p class="route-hint" id="route-hint"></p>
          </div>
```

Styles : `.recipe` liste sans puces, chaque pas est un `<button class="recipe-step">` en grille (numéro, nom de l'accord en gras, texte en `--ink-2`), le premier (`.is-next`) bordé à l'accent ; `.route-clear` petit bouton rond discret ; `.route-hint` en `--ink-3`, `--text-sm`.

- [ ] **Étape 4 : `main.ts`.**
  1. État : `let destination: number | null = null;` et `let arrived: number | null = null;`.
  2. Dans `render(n)`, seulement quand `n === path.length` (ni écoute, ni consultation) : `const dest = destination ?? j.leaning;` puis `const route = dest !== null ? routeTo(j, dest) : null;`. Si `destination !== null && j.key === destination && j.leaning === null` : `arrived = destination; destination = null;`. Passer `route` à `map.render({ …, route })` (et `route: null` pendant l'écoute).
  3. Légende : si `arrived !== null`, elle affiche `arrivalText(arrived)` à la place de `noteFor` pour ce rendu, puis `arrived = null` (à intégrer à la mémoïsation existante sans casser les légendes « une fois » : la clé de mémoïsation inclut l'arrivée).
  4. Panneau `renderRoute(route, j, explicit)` : bloc masqué si ni route ni indice ; titre « Vers <keyName(target)> » (destination choisie) ou « On penche vers <keyName(hop)> » (implicite) ; si `route.hops.length > 1`, ajouter « (par <noms des étapes>) » ; liste des pas `recipeText(step, j.key, route.hop, j.home)` précédés du nom de l'accord ; bouton « ✕ » visible seulement pour une destination choisie. Sans route : afficher `DEST_HINT` dans `#route-hint` et masquer liste et titre.
  5. Toucher un pas de la recette = `pick(step.chord)`.
  6. `onKey(t)` (option de la carte) : si `t === destination`, `destination = null` ; sinon si `t === j.key`, `destination = null` (rien à faire : on y est) ; sinon `destination = t` ; puis `render()`. Pendant l'écoute, ne rien faire.
  7. « ✕ » : `destination = null; render();`. *Recommencer* et le changement de maison remettent `destination = null`.

- [ ] **Étape 5 : vérifier dans le navigateur** (serveur de dev du contrôleur, outils `mcp__Claude_Browser__*`) : `?p=C,G`, toucher Sol sur l'anneau → Sol cerclé en pointillés, arc vers Sol, recette « La m / Ré / Si m / Sol », Ré, Si m, Fa♯° en satellites marqués « → Sol », Fa, Ré m, Si° estompés, cercles pointillés sur Do, Sol, Mi m, La m, halos gris sauf ceux qui mènent ; jouer La m, Ré, Si m → arrivée, « Te voilà en Sol majeur. », destination éteinte. `?p=C` puis toucher Fa → recette Ré m, Si♭, Sol m, Fa. `?p=C,D` sans destination → guidage implicite vers Sol (titre « On penche vers Sol majeur »). Toucher La sur l'anneau depuis Do → « Vers La majeur (par Sol, Ré) ». 375 px (preset `mobile`) clair et sombre : rien ne déborde ; remettre `desktop`. Console sans erreur.

- [ ] **Étape 6 : commit** — `feat(chemin-des-accords): destination sur l'anneau, route et recette` + Co-Authored-By.

---

### Tâche 5 : la fiche d'un accord du ruban

**Fichiers :** modifier `viz/chemin-des-accords/ui/ribbon.ts`, `viz/chemin-des-accords/main.ts`, `viz/chemin-des-accords/index.html`, `viz/chemin-des-accords/viz.css`.

**Interfaces :** consomme `stepCard` (tâche 3). `renderRibbon(root, j, selected: number | null)`.

- [ ] **Étape 1 : ruban.** Chaque jeton devient un `<button type="button" class="token …" data-index="i">` (dans son `<li>`), avec `aria-pressed` et la classe `is-selected` quand `i === selected`. Le recalage à droite ne se fait pas quand un jeton est sélectionné.
- [ ] **Étape 2 : la fiche (`index.html`).** Sous le ruban :

```html
          <div class="step-card" id="step-card" hidden>
            <p class="step-card-name" id="card-name"></p>
            <dl class="step-card-facts">
              <dt>Tonalité</dt><dd id="card-key"></dd>
              <dt>Degré</dt><dd id="card-degree"></dd>
              <dt>Rôle</dt><dd id="card-role"></dd>
              <dt>Ce qu’il a fait</dt><dd id="card-did"></dd>
            </dl>
            <div class="actions">
              <button type="button" id="card-present">Revenir au présent</button>
              <button type="button" id="card-resume">Reprendre d’ici</button>
            </div>
          </div>
```

Styles : carte sobre (`--surface`, bord `--rule`, rayon `--radius`), `dl` en grille deux colonnes (`dt` en `--ink-3`, `--text-xs`), pas de teinte vive sauf le bord gauche à l'accent.
- [ ] **Étape 3 : `main.ts`.**
  1. `let inspecting: number | null = null;`. Le paramètre par défaut de `render` devient `n = inspecting !== null ? inspecting + 1 : store.get().path.length`.
  2. Clic délégué sur `#ribbon` : `const b = (e.target as Element).closest('[data-index]')` → si l'écoute tourne, l'arrêter ; `inspecting = Number(b.dataset.index) === inspecting ? null : Number(b.dataset.index)` ; `render()`.
  3. Fiche : remplie depuis `stepCard(journeyOf(home, path), inspecting)` (le chemin **complet**, pour connaître le pivot), visible seulement si `inspecting !== null`. `renderRibbon(els.ribbon, j, inspecting)` — attention, le ruban doit toujours montrer le chemin complet : appeler `renderRibbon` avec le journey complet, et la carte avec le journey du préfixe.
  4. « Revenir au présent » : `inspecting = null; render();`. « Reprendre d’ici » : `const keep = path.slice(0, inspecting + 1); inspecting = null; store.set({ path: keep });`.
  5. Pendant la consultation : la légende est vide, la route n'est pas calculée, et toucher un accord de la carte quitte la consultation **sans ajouter** l'accord (`pick` : si `inspecting !== null`, `inspecting = null; render(); return;`). *Annuler*, *Recommencer*, *Écouter*, le changement de maison et la destination remettent `inspecting = null`.
- [ ] **Étape 4 : vérifier dans le navigateur** : `?p=C,Am,D,G,Bm`, toucher Ré dans le ruban → carte revenue en Do avec Ré courant, fiche « Ré · Do majeur, puis Sol majeur · V/V en Do, V en Sol · … · il a fait pencher vers Sol majeur ; il est devenu le pivot (V en Sol). » ; « Revenir au présent » → Si m ; toucher La m → « Reprendre d’ici » → chemin `C,Am`. Toucher un accord de la carte pendant la consultation → retour au présent sans ajout. 375 px clair et sombre ; remettre `desktop`.
- [ ] **Étape 5 : commit** — `feat(chemin-des-accords): la fiche d’un accord du ruban` + Co-Authored-By.

---

### Tâche 6 : textes, fiche du chantier, vérification complète

**Fichiers :** `viz/chemin-des-accords/index.html` (sections « Comment lire », « La méthode », « Ce que ça ne dit pas »), `viz/chemin-des-accords/README.md`, `docs/chantiers/chemin-des-accords.md`, `docs/chantiers/README.md`.

- [ ] **Étape 1 : textes de la page.** « Comment lire » : toucher une tonalité de l'anneau pour s'y rendre (route, recette, accords qui mènent, communs, qui ramènent ; halos gris sauf ceux qui mènent) ; quand la page penche, le guidage s'affiche tout seul ; toucher un accord du ruban ouvre sa fiche (revenir au présent, reprendre d'ici). « La méthode » : la règle symétrique (Ré, la dominante de Sol, tire vers Sol ; Si♭ et Sol m tirent vers Fa) ; la boucle Do – Si♭ – Do – Si♭ reste une couleur ; la recette (un accord commun, celui qui fait pencher, celui qui confirme, la nouvelle tonique) ; une tonalité lointaine se rejoint de voisine en voisine. « Ce que ça ne dit pas » : la route passe toujours de voisine en voisine, alors qu'un musicien peut sauter plus loin (modulation directe, accord commun lointain). Tutoiement, phrases courtes, apostrophes ’, pas de genre supposé.
- [ ] **Étape 2 : fiche du chantier.** Cocher la piste B ; ajouter ses décisions de construction (datées du 2 octobre 2026) ; « Prochaine action : relecture de l'auteur (guidage) » ; ligne 3i de `docs/chantiers/README.md` : « publiée ; piste B (guidage) sur `feat/chemin-guidage`, en attente de relecture ». README de la viz : `domain/route.ts` dans la structure.
- [ ] **Étape 3 : vérification complète** (bureau et 375 px, clair et sombre) des parcours des tâches 4 et 5, plus : `?p=C,Bb,C,Bb` → légende du rock, aucune bascule ; `?p=C,Bb,F,Gm` → Fa majeur, pivot Si♭ « ♭VII → IV » ; console sans erreur ; `npm run build`.
- [ ] **Étape 4 : commit** — `docs(chemin-des-accords): textes et fiche du guidage` + Co-Authored-By.
