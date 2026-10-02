# Le chemin des accords — plan d'implémentation

> **Pour les agents :** sous-compétence requise : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans, tâche par tâche. Les étapes sont des cases à cocher (`- [ ]`).

**Objectif :** une page où l'on compose une progression sur le cercle d'une tonalité, en voyant à chaque pas où l'on est (tonalité, accord), où l'on peut aller (halos pondérés par le corpus) et où l'on était (traînée, ruban), modulations comprises.

**Architecture :** tout le savoir est dans des fonctions pures de `viz/chemin-des-accords/domain/` : le parcours (`journey.ts`) se recalcule de zéro depuis `(maison, accords)` à chaque geste ; les halos (`halos.ts`) lisent la part `p2` de progression-jouee ; la géométrie (`geometry.ts`) place accords, satellites et anneau ; les légendes (`notes.ts`) disent ce qui vient de se passer. L'interface (`ui/map.ts`, `ui/ribbon.ts`, `ui/tip.ts`, `main.ts`) dessine ces résultats en SVG et HTML, sans logique musicale.

**Pile :** Vite + TypeScript strict, sans framework ; SVG à la main ; Vitest ; son par `@shell/music/synth`.

**Spécification :** [docs/chantiers/chemin-des-accords.md](../../chantiers/chemin-des-accords.md) (la fiche du chantier). La lire avant toute tâche.

## Contraintes globales

- Langue : interface, textes, commentaires et messages de commit **en français** ; tutoiement dans l'interface ; apostrophe typographique `’` dans les textes affichés.
- Stack : Vite + TypeScript strict, **sans framework**, aucune dépendance nouvelle.
- `viz/suis-les-fleches/` **ne doit pas être modifié** : on importe depuis ses fichiers (`../../suis-les-fleches/domain/...` depuis `domain/` ou `ui/`, `../suis-les-fleches/...` depuis la racine de la viz).
- Données : uniquement `public/data/progression-jouee/p2.json`, par `loadShard(2)` de `viz/progression-jouee/data/load.ts`. Colonne lue : `ROW.total` (= 0).
- Chemins publics par `assetUrl()` / `vizUrl()` ou `%BASE_URL%`.
- Une seule teinte vive : `var(--accent)` (accord du moment, halos, tonalité du moment, dernier pas, flèche maison → ici). Le reste en encres et rampe ardoise (`--ink*`, `--seq-*`, `--rule*`). Clair et sombre par les jetons de `src/shell/tokens.css`, jamais de couleur en dur.
- Disques des sept accords ≥ 44 px de diamètre à 375 px de large.
- `prefers-reduced-motion: reduce` : aucune transition ni animation.
- Son seulement sur geste.
- `npm test` et `npm run typecheck` au vert avant chaque commit. Messages de commit terminés par la ligne `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Branche : `feat/chemin-des-accords`. Ne rien pousser, ne rien publier (`status` reste `draft`).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `viz/chemin-des-accords/domain/journey.ts` | Le parcours : tonalité de chaque pas, frôlement, suspens, confirmation, pivot, bandes. |
| `viz/chemin-des-accords/domain/halos.ts` | Les candidats après un accord et leurs parts dans le corpus. |
| `viz/chemin-des-accords/domain/geometry.ts` | Positions (cercle, satellites), anneau des tonalités, arcs. (Remplace le `ring.ts` de la fiche : satellites et anneau partagent la même géométrie.) |
| `viz/chemin-des-accords/domain/notes.ts` | Légende d'un pas, phrase « où je suis », textes des bulles. |
| `viz/chemin-des-accords/state.ts` | URL `?t=C&p=C,Am,D,G,Bm`. |
| `viz/chemin-des-accords/ui/map.ts` | Carte SVG : secteurs, anneau, halos, traînée, disques, aperçu au survol. |
| `viz/chemin-des-accords/ui/ribbon.ts` | Ruban d'historique en bandes de tonalité. |
| `viz/chemin-des-accords/ui/tip.ts` | Petites bulles (survol, toucher long, bouton « ? »). |
| `viz/chemin-des-accords/main.ts`, `index.html`, `viz.css` | Page, panneau, câblage, son, écoute. |
| `viz/chemin-des-accords/og/build-og.ts` | Image d'aperçu. |

## Rappels sur le code importé (ne pas réécrire)

Depuis `viz/suis-les-fleches/domain/harmony.ts` :
- `type Chord = { root: number; cls: 'maj' | 'min' | 'dim' }` ; `type Cls`.
- `mod12(n)`, `chordId(c)` (« 7maj »), `sameChord(a, b)`, `chordAt(tonic, degree)`, `degreeIn(c, tonic)`.
- `nameOf(c)` (« Sol », « La m », « Si ° »), `keyName(tonic)` (« Sol majeur »), `noteName(pc)`.
- `roleOf(c, tonic): { label, kind: 'diatonique' | 'dominante' | 'emprunt' | 'ailleurs', fn, anchor }` : Ré en Do → `{ label: 'V/V', kind: 'dominante', anchor: 'V' }` ; Fa m en Do → `{ label: 'iv', kind: 'emprunt', anchor: 'IV' }` ; Mi en Do → `V/vi`, ancre `vi`.
- `keysContaining(c, from)` : tonalités majeures qui contiennent `c`, les plus proches de `from` d'abord.
- `fifthsIndex(pc)`, `fifthsOffset(from, to)` (−5 à +6, positif vers les dièses).

Depuis `viz/suis-les-fleches/domain/layout.ts` : `DIATONIC` (sept `{ label, degree, fn }` dans l'ordre de la gamme), `chordByLabel(label)`, `layoutOf('cercle')` (positions normalisées, centre 0,5 ; `sectors` ; `sectorRadii`), `CIRCLE_RING` (0,31), `arrowPath(a, b, ra, bend, minHop, rb)`, `FN_LABELS`, `type Fn`, `type Point`.

Depuis `viz/suis-les-fleches/domain/moves.ts` : `moveSentence(a, b, tonic)`, `roleText(c, tonic)`.

Depuis le socle : `degreeLabel(d)` (`@shell/music/degrees`, donne « bVII », « V », « iii ») ; `parseDegreeLabel` ; `parseChord(symbol)` et `triadClass(quality)` (`@shell/music/chords`) ; `KEY_NAMES` (`viz/compose-ta-progression/state.ts` : `['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B']`) ; `Synth` (`synth.play(freqs, seconds)`), `voice(degree, tonic, previous)`, `equalFrequency(midi)` ; `mountShell`, `createStore`, `escapeHtml`.

Les clés de `p2.json` sont `degreeLabel(a) + ',' + degreeLabel(b)` (« V,vi », « I,bVII »), la ligne commence par le total de morceaux.

---

### Tâche 1 : le parcours (`journey.ts`)

**Fichiers :**
- Créer : `viz/chemin-des-accords/domain/journey.ts`
- Tester : `viz/chemin-des-accords/domain/journey.test.ts`
- Modifier : `docs/chantiers/chemin-des-accords.md` (section Décisions)

Le dossier `viz/chemin-des-accords/` est créé par `npm run new:viz` à l'étape 1 (gabarit + inscription en brouillon dans `src/shell/site.ts`) ; on y ajoute `domain/`. La page reste un brouillon vide jusqu'à la tâche 6.

**Interfaces :**
- Consomme : `roleOf`, `keysContaining`, `chordAt`, `sameChord`, `type Chord` (harmony.ts) ; `chordByLabel` (layout.ts).
- Produit :

```ts
export type StepEvent =
  | { kind: 'gamme' }
  | { kind: 'repete' }
  | { kind: 'couleur'; cause: 'emprunt' | 'dominante'; anchor: string }
  | { kind: 'frole'; target: number }
  | { kind: 'suspens'; target: number }
  | { kind: 'confirme'; from: number; to: number; pivot: number }
  | { kind: 'eteint'; target: number; frole: number };
export interface JourneyStep { chord: Chord; key: number; label: string; event: StepEvent; pivot: { before: string; after: string } | null }
export interface Journey { home: number; steps: JourneyStep[]; key: number; leaning: number | null; pending: number | null }
export function leanOf(c: Chord, key: number): number | null;
export function journeyOf(home: number, chords: readonly Chord[]): Journey;
export interface Band { key: number; from: number; to: number }
export function bandsOf(j: Journey): Band[];
```

**Règle (précision de la fiche, à reporter dans ses Décisions) :** une dominante secondaire dont la cible est **mineure** (V/ii, V/iii, V/vi) ne frôle rien : avec seulement des tonalités majeures, elle éclaire un accord de la tonalité sans en sortir ; elle est traitée comme une couleur, comme les emprunts. Seule V/V (cible majeure) et les accords d'ailleurs frôlent. Un accord répété ne change rien.

- [ ] **Étape 1 : créer la page brouillon et écrire les tests qui échouent**

```bash
npm run new:viz -- chemin-des-accords --title "Le chemin des accords" --summary "Compose une progression sur la carte d’une tonalité : à chaque accord, vois où tu es, où tu peux aller, et d’où tu viens." --tags "Musique,Harmonie,Apprendre"
```

`viz/chemin-des-accords/domain/journey.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import type { Chord } from '../../suis-les-fleches/domain/harmony';
import { bandsOf, journeyOf, leanOf } from './journey';

const M = (root: number): Chord => ({ root, cls: 'maj' });
const m = (root: number): Chord => ({ root, cls: 'min' });
const dim = (root: number): Chord => ({ root, cls: 'dim' });
const [C, D, E, F, G, A, B] = [0, 2, 4, 5, 7, 9, 11];

describe('leanOf : vers où un accord fait pencher', () => {
  it('rien pour la gamme, les emprunts et les dominantes de cibles mineures', () => {
    expect(leanOf(M(G), C)).toBeNull();
    expect(leanOf(m(F), C)).toBeNull(); // iv emprunté
    expect(leanOf(M(10), C)).toBeNull(); // ♭VII emprunté
    expect(leanOf(M(E), C)).toBeNull(); // V/vi
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
```

- [ ] **Étape 2 : vérifier l'échec**

Lancer : `npx vitest run viz/chemin-des-accords/domain/journey.test.ts`
Attendu : échec, « Cannot find module './journey' » (ou équivalent).

- [ ] **Étape 3 : écrire `journey.ts`**

```ts
/**
 * Le parcours : à partir de la maison et des accords posés, la tonalité de chaque pas.
 * Un accord hors de la tonalité « frôle » une autre tonalité ; le premier accord qui n'appartient qu'à l'une des deux
 * tranche (confirmation : on a modulé ; sinon le frôlement s'éteint, c'était un détour). Les emprunts au mineur et les
 * dominantes secondaires de cibles mineures sont des couleurs : elles ne frôlent rien.
 * Tout se recalcule de zéro à chaque geste ; annuler, c'est recalculer sans le dernier accord.
 */
import { chordAt, keysContaining, roleOf, sameChord, type Chord } from '../../suis-les-fleches/domain/harmony';
import { chordByLabel } from '../../suis-les-fleches/domain/layout';

export type StepEvent =
  | { kind: 'gamme' }
  | { kind: 'repete' }
  | { kind: 'couleur'; cause: 'emprunt' | 'dominante'; anchor: string }
  | { kind: 'frole'; target: number }
  | { kind: 'suspens'; target: number }
  | { kind: 'confirme'; from: number; to: number; pivot: number }
  | { kind: 'eteint'; target: number; frole: number };

export interface JourneyStep {
  chord: Chord;
  /** La tonalité où ce pas se lit (sa bande dans le ruban). */
  key: number;
  /** Son degré dans cette tonalité (« V », « V/V », « ♭VII »). */
  label: string;
  event: StepEvent;
  /** Pour l'accord pivot d'une modulation : son degré avant et après. */
  pivot: { before: string; after: string } | null;
}

export interface Journey {
  home: number;
  steps: JourneyStep[];
  /** La tonalité du moment. */
  key: number;
  /** La tonalité frôlée, tant que rien n'a tranché. */
  leaning: number | null;
  /** L'indice de l'accord qui a frôlé (en suspens). */
  pending: number | null;
}

const inKey = (c: Chord, key: number) => roleOf(c, key).kind === 'diatonique';

/** La tonalité vers laquelle un accord fait pencher, ou `null` (dans la gamme, ou simple couleur). */
export function leanOf(c: Chord, key: number): number | null {
  const r = roleOf(c, key);
  if (r.kind === 'diatonique' || r.kind === 'emprunt') return null;
  if (r.kind === 'dominante') {
    const target = chordAt(key, chordByLabel(r.anchor!)!.degree);
    return target.cls === 'maj' ? target.root : null;
  }
  return keysContaining(c, key)[0]?.tonic ?? null;
}

/** L'événement d'un accord quand rien n'est en suspens. */
function freshEvent(c: Chord, key: number): StepEvent {
  const r = roleOf(c, key);
  if (r.kind === 'diatonique') return { kind: 'gamme' };
  const target = leanOf(c, key);
  if (target !== null) return { kind: 'frole', target };
  return { kind: 'couleur', cause: r.kind === 'emprunt' ? 'emprunt' : 'dominante', anchor: r.anchor ?? 'I' };
}

export function journeyOf(home: number, chords: readonly Chord[]): Journey {
  type Draft = Omit<JourneyStep, 'label'>;
  const steps: Draft[] = [];
  let key = home;
  let leaning: number | null = null;
  let pending: number | null = null;

  chords.forEach((c, i) => {
    const previous = steps[i - 1];
    if (previous && sameChord(previous.chord, c)) {
      steps.push({ chord: c, key, event: { kind: 'repete' }, pivot: null });
      return;
    }
    if (leaning === null) {
      const event = freshEvent(c, key);
      if (event.kind === 'frole') {
        leaning = event.target;
        pending = i;
      }
      steps.push({ chord: c, key, event, pivot: null });
      return;
    }
    const inOld = inKey(c, key);
    const inNew = inKey(c, leaning);
    if (inNew && !inOld) {
      const from = key;
      const to: number = leaning;
      const p = pending!;
      for (let k = p; k < i; k++) steps[k]!.key = to;
      steps[p]!.pivot = { before: roleOf(steps[p]!.chord, from).label, after: roleOf(steps[p]!.chord, to).label };
      key = to;
      leaning = null;
      pending = null;
      steps.push({ chord: c, key, event: { kind: 'confirme', from, to, pivot: p }, pivot: null });
    } else if (inOld && inNew) {
      steps.push({ chord: c, key, event: { kind: 'suspens', target: leaning }, pivot: null });
    } else if (inOld) {
      steps.push({ chord: c, key, event: { kind: 'eteint', target: leaning, frole: pending! }, pivot: null });
      leaning = null;
      pending = null;
    } else {
      const target = leanOf(c, key);
      if (target === null) {
        steps.push({ chord: c, key, event: { kind: 'eteint', target: leaning, frole: pending! }, pivot: null });
        leaning = null;
        pending = null;
      } else if (target === leaning) {
        steps.push({ chord: c, key, event: { kind: 'suspens', target }, pivot: null });
      } else {
        leaning = target;
        pending = i;
        steps.push({ chord: c, key, event: { kind: 'frole', target }, pivot: null });
      }
    }
  });

  return { home, key, leaning, pending, steps: steps.map((s) => ({ ...s, label: roleOf(s.chord, s.key).label })) };
}

export interface Band {
  key: number;
  from: number;
  to: number;
}

/** Les bandes du ruban : les pas consécutifs lus dans la même tonalité. */
export function bandsOf(j: Journey): Band[] {
  const out: Band[] = [];
  j.steps.forEach((s, i) => {
    const last = out[out.length - 1];
    if (last && last.key === s.key) last.to = i;
    else out.push({ key: s.key, from: i, to: i });
  });
  return out;
}
```

- [ ] **Étape 4 : vérifier le succès**

Lancer : `npx vitest run viz/chemin-des-accords/domain/journey.test.ts`
Attendu : tous les tests passent. Si `leanOf(m(6), C)` ne donne pas `D`, afficher `keysContaining(m(6), 0)` et corriger **le test** seulement si l'ordre renvoyé est musicalement défendable ; sinon corriger `leanOf`.

- [ ] **Étape 5 : reporter la règle dans la fiche**

Dans `docs/chantiers/chemin-des-accords.md`, section « Décisions », ajouter :

```markdown
- Une dominante secondaire de cible mineure (V/ii, V/iii, V/vi) est une couleur, comme un emprunt : elle éclaire un accord sans quitter la tonalité (pas de tonalités mineures dans cette page). Seuls V/V et les accords d'ailleurs frôlent. Un accord répété ne change rien. (Construction, 2 octobre 2026.)
- `ring.ts` devient `geometry.ts` : satellites et anneau partagent la même géométrie.
```

Et cocher « Domaine » partiellement : remplacer la ligne de tâche par `- [ ] Domaine : \`journey.ts\` ✓, \`halos.ts\`, \`geometry.ts\`, \`notes.ts\` ; tests`.

- [ ] **Étape 6 : vérifier et committer**

```bash
npm test && npm run typecheck
git add viz/chemin-des-accords docs/chantiers/chemin-des-accords.md src/shell/site.ts
git commit -m "feat(chemin-des-accords): le parcours (frôler, confirmer, pivot), testé

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`new:viz` inscrit la page dans `src/shell/site.ts` : l'inclure dans ce commit, et le reste de ce qu'il a créé.)

---

### Tâche 2 : les halos (`halos.ts`)

**Fichiers :**
- Créer : `viz/chemin-des-accords/domain/halos.ts`
- Tester : `viz/chemin-des-accords/domain/halos.test.ts`

**Interfaces :**
- Consomme : `degreeLabel`, `parseDegreeLabel` (`@shell/music/degrees`) ; `degreeIn`, `mod12`, `roleOf`, `sameChord`, `diatonicChords`, `type Chord`, `type Cls` (harmony.ts).
- Produit :

```ts
export type Rows = Readonly<Record<string, readonly number[]>>;
export interface Candidate { chord: Chord; label: string; share: number | null; count: number; satellite: boolean; anchor: string | null }
export function candidates(from: Chord | null, key: number, rows: Rows, maxSatellites?: number): Candidate[];
```

`share` est `null` au départ (rien n'est joué) ; sinon la part des morceaux, sur **toutes** les suites de `from` présentes dans `rows`. Les sept accords de la gamme sont toujours là (sauf `from` lui-même), dans l'ordre de `DIATONIC` ; puis au plus `maxSatellites` (3 par défaut) accords hors gamme de rôle `dominante` ou `emprunt`, de part ≥ 1 %, par part décroissante.

- [ ] **Étape 1 : tests qui échouent** — `halos.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { candidates, type Rows } from './halos';

const rows: Rows = {
  'V,I': [50],
  'V,vi': [30],
  'V,IV': [10],
  'V,bVII': [5],
  'V,II': [3],
  'V,III': [1.5],
  'V,bII': [0.5],
  'IV,I': [99],
};

describe('candidates', () => {
  it('au départ : les sept accords, sans part', () => {
    const c = candidates(null, 0, rows);
    expect(c.map((x) => x.label)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    expect(c.every((x) => x.share === null && !x.satellite)).toBe(true);
  });

  it('après Sol en Do : la gamme toujours, les parts sur toutes les suites, trois satellites au plus', () => {
    const c = candidates({ root: 7, cls: 'maj' }, 0, rows);
    const byLabel = Object.fromEntries(c.map((x) => [x.label, x]));
    expect(c.filter((x) => !x.satellite).map((x) => x.label)).toEqual(['I', 'ii', 'iii', 'IV', 'vi', 'vii°']);
    expect(byLabel.I!.share).toBeCloseTo(0.5);
    expect(byLabel.vi!.share).toBeCloseTo(0.3);
    expect(byLabel.ii!.share).toBe(0);
    expect(c.filter((x) => x.satellite).map((x) => x.label)).toEqual(['♭VII', 'V/V', 'V/vi']);
    expect(byLabel['♭VII']!.anchor).toBe('vii°');
    const sum = c.reduce((s, x) => s + (x.share ?? 0), 0);
    expect(sum).toBeLessThanOrEqual(1);
  });

  it('respecte le nombre de satellites et le seuil de 1 %', () => {
    const c = candidates({ root: 7, cls: 'maj' }, 0, rows, 1);
    expect(c.filter((x) => x.satellite).map((x) => x.label)).toEqual(['♭VII']);
    expect(candidates({ root: 7, cls: 'maj' }, 0, rows).some((x) => x.label === '♭II')).toBe(false);
  });

  it('lit l’accord en degré de la tonalité du moment', () => {
    const c = candidates({ root: 11, cls: 'min' }, 7, { 'iii,vi': [8], 'iii,IV': [2] });
    expect(c.find((x) => x.label === 'vi')!.chord).toEqual({ root: 4, cls: 'min' });
    expect(c.find((x) => x.label === 'vi')!.share).toBeCloseTo(0.8);
  });

  it('sans données pour cet accord : des parts nulles, pas de satellites', () => {
    const c = candidates({ root: 7, cls: 'maj' }, 0, {});
    expect(c.every((x) => x.share === 0)).toBe(true);
    expect(c.some((x) => x.satellite)).toBe(false);
  });
});
```

- [ ] **Étape 2 : vérifier l'échec** — `npx vitest run viz/chemin-des-accords/domain/halos.test.ts` → module introuvable.

- [ ] **Étape 3 : écrire `halos.ts`**

```ts
/**
 * Les possibilités après un accord, dans la tonalité du moment : les sept accords de la gamme (toujours, tout reste
 * jouable), plus quelques voisins hors gamme (dominantes secondaires, emprunts) que les chansons jouent souvent ici.
 * Le poids vient du corpus : la part des morceaux qui, après cet accord, font ce pas (`p2.json` de progression-jouee).
 */
import { degreeLabel, parseDegreeLabel } from '@shell/music/degrees';
import { degreeIn, diatonicChords, mod12, roleOf, sameChord, type Chord, type Cls } from '../../suis-les-fleches/domain/harmony';

export type Rows = Readonly<Record<string, readonly number[]>>;

export interface Candidate {
  chord: Chord;
  /** Son degré dans la tonalité du moment (« vi », « V/V », « ♭VII »). */
  label: string;
  /** Part des morceaux qui font ce pas (0 à 1), ou `null` au départ. */
  share: number | null;
  count: number;
  satellite: boolean;
  /** L'accord de la gamme auquel un satellite se rattache. */
  anchor: string | null;
}

const CLASSES: readonly string[] = ['maj', 'min', 'dim'];
export const MIN_SATELLITE_SHARE = 0.01;

export function candidates(from: Chord | null, key: number, rows: Rows, maxSatellites = 3): Candidate[] {
  const diatonic = diatonicChords(key);
  if (!from) return diatonic.map(({ chord, role }) => ({ chord, label: role.label, share: null, count: 0, satellite: false, anchor: null }));

  const prefix = `${degreeLabel(degreeIn(from, key))},`;
  const counts = new Map<string, { chord: Chord; count: number }>();
  let total = 0;
  for (const [k, row] of Object.entries(rows)) {
    if (!k.startsWith(prefix)) continue;
    const n = row[0] ?? 0;
    total += n;
    const d = parseDegreeLabel(k.slice(prefix.length));
    if (!d || !CLASSES.includes(d.cls)) continue;
    const chord: Chord = { root: mod12(key + d.step), cls: d.cls as Cls };
    counts.set(`${chord.root}${chord.cls}`, { chord, count: n });
  }
  const shareOf = (c: Chord) => {
    const n = counts.get(`${c.root}${c.cls}`)?.count ?? 0;
    return { count: n, share: total > 0 ? n / total : 0 };
  };

  const inScale: Candidate[] = diatonic
    .filter(({ chord }) => !sameChord(chord, from))
    .map(({ chord, role }) => ({ chord, label: role.label, ...shareOf(chord), satellite: false, anchor: null }));

  const satellites: Candidate[] = [...counts.values()]
    .map(({ chord }) => ({ chord, role: roleOf(chord, key) }))
    .filter(({ chord, role }) => (role.kind === 'dominante' || role.kind === 'emprunt') && !sameChord(chord, from))
    .map(({ chord, role }) => ({ chord, label: role.label, ...shareOf(chord), satellite: true, anchor: role.anchor }))
    .filter((c) => c.share! >= MIN_SATELLITE_SHARE)
    .sort((a, b) => b.share! - a.share!)
    .slice(0, maxSatellites);

  return [...inScale, ...satellites];
}
```

- [ ] **Étape 4 : vérifier le succès** — même commande, tout passe.

- [ ] **Étape 5 : committer**

```bash
npm test && npm run typecheck
git add viz/chemin-des-accords/domain/halos.ts viz/chemin-des-accords/domain/halos.test.ts
git commit -m "feat(chemin-des-accords): les halos, parts du corpus après un accord

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 3 : la géométrie (`geometry.ts`)

**Fichiers :**
- Créer : `viz/chemin-des-accords/domain/geometry.ts`
- Tester : `viz/chemin-des-accords/domain/geometry.test.ts`

**Interfaces :**
- Consomme : `layoutOf`, `CIRCLE_RING`, `type Point` (layout.ts) ; `fifthsIndex`, `fifthsOffset` (harmony.ts).
- Produit (unités du cadre SVG : 1000 × 1000, centre 500,500 ; la page utilise `viewBox="-20 -20 1040 1040"`) :

```ts
export const FRAME = 1000, CENTER = 500, CHORD_RING = 250, DISK = 68, TONIC_DISK = 78, SAT_DISK = 46, SAT_DIST = 130, KEY_RING = 468, HOME_ARC = 498;
export function polar(r: number, deg: number): Point;
export function diatonicPoint(label: string): Point;
export function satellitePoints(items: readonly { id: string; anchor: string | null }[]): Map<string, Point>;
export function keyAngle(tonic: number): number;
export function ringRotation(previous: number, fromKey: number, toKey: number): number;
export function homeArc(home: number, key: number): { from: number; to: number } | null;
export function arcPath(r: number, from: number, to: number): string;
```

- [ ] **Étape 1 : tests qui échouent** — `geometry.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { DIATONIC } from '../../suis-les-fleches/domain/layout';
import { arcPath, CENTER, DISK, diatonicPoint, homeArc, KEY_RING, keyAngle, polar, ringRotation, SAT_DISK, satellitePoints, TONIC_DISK } from './geometry';

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('cercle', () => {
  it('I au centre, les sept disques séparés et dans le cadre', () => {
    expect(diatonicPoint('I')).toEqual({ x: CENTER, y: CENTER });
    const pts = DIATONIC.map((c) => diatonicPoint(c.label));
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) expect(dist(pts[i]!, pts[j]!)).toBeGreaterThan(DISK + TONIC_DISK);
    for (const p of pts) expect(Math.hypot(p.x - CENTER, p.y - CENTER) + DISK).toBeLessThan(KEY_RING - 20);
  });

  it('les satellites ne touchent ni la gamme, ni l’anneau, ni leurs voisins', () => {
    const items = [
      { id: 'a', anchor: 'V' },
      { id: 'b', anchor: 'V' },
      { id: 'c', anchor: 'vii°' },
      { id: 'd', anchor: 'I' },
      { id: 'e', anchor: null },
    ];
    const sat = satellitePoints(items);
    const all = [...sat.values()];
    for (const p of all) {
      for (const c of DIATONIC) expect(dist(p, diatonicPoint(c.label))).toBeGreaterThan(SAT_DISK + DISK);
      expect(Math.hypot(p.x - CENTER, p.y - CENTER) + SAT_DISK).toBeLessThan(KEY_RING - 15);
    }
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(dist(all[i]!, all[j]!)).toBeGreaterThan(2 * SAT_DISK);
  });
});

describe('anneau des tonalités', () => {
  it('Do en haut, rangé par quintes', () => {
    expect(keyAngle(0)).toBe(-90);
    expect(keyAngle(7)).toBe(-60);
    expect(keyAngle(5)).toBe(240);
  });

  it('tourne par le plus court chemin', () => {
    expect(ringRotation(0, 0, 7)).toBe(-30);
    expect(ringRotation(-30, 7, 0)).toBe(0);
    expect(ringRotation(0, 0, 5)).toBe(30);
  });

  it('l’arc de la maison à la tonalité du moment', () => {
    expect(homeArc(0, 0)).toBeNull();
    expect(homeArc(0, 7)).toEqual({ from: -90, to: -60 });
    expect(homeArc(0, 5)).toEqual({ from: -90, to: -120 });
  });

  it('trace un arc dans le bon sens', () => {
    const [x0, y0] = [polar(100, -90).x, polar(100, -90).y];
    expect(arcPath(100, -90, -60)).toBe(`M${x0.toFixed(1)},${y0.toFixed(1)} A100,100 0 0 1 ${polar(100, -60).x.toFixed(1)},${polar(100, -60).y.toFixed(1)}`);
    expect(arcPath(100, -90, -120)).toContain(' 0 0 0 ');
  });
});
```

- [ ] **Étape 2 : vérifier l'échec** — `npx vitest run viz/chemin-des-accords/domain/geometry.test.ts`.

- [ ] **Étape 3 : écrire `geometry.ts`**

```ts
/**
 * Géométrie de la carte, en unités du cadre (1000 × 1000, centre 500,500) : le cercle de la tonalité (repris de
 * « Suis les flèches », mis à l'échelle), les satellites hors gamme (au-delà de l'accord auquel ils se rattachent),
 * et l'anneau des douze tonalités rangées par quintes (Do en haut ; l'anneau tourne pour garder la tonalité du moment en haut).
 */
import { CIRCLE_RING, layoutOf, type Point } from '../../suis-les-fleches/domain/layout';
import { fifthsIndex, fifthsOffset } from '../../suis-les-fleches/domain/harmony';

export const FRAME = 1000;
export const CENTER = 500;
/** Rayon du cercle des six accords autour de la tonique. */
export const CHORD_RING = 250;
/** Rayons des disques : 68 donne 45 px de diamètre à 375 px de large (cadre de 1040 unités). */
export const DISK = 68;
export const TONIC_DISK = 78;
export const SAT_DISK = 46;
/** Distance d'un satellite au cercle des accords, vers l'extérieur. */
export const SAT_DIST = 130;
/** Écart angulaire entre deux satellites d'une même ancre. */
const SAT_SPREAD = 17;
export const KEY_RING = 468;
export const HOME_ARC = 498;

const SCALE = CHORD_RING / (CIRCLE_RING * FRAME);
const CIRCLE = layoutOf('cercle');

export const polar = (r: number, deg: number): Point => ({ x: CENTER + r * Math.cos((deg * Math.PI) / 180), y: CENTER + r * Math.sin((deg * Math.PI) / 180) });

export function diatonicPoint(label: string): Point {
  const p = CIRCLE.positions[label]!;
  return { x: CENTER + (p.x - 0.5) * FRAME * SCALE, y: CENTER + (p.y - 0.5) * FRAME * SCALE };
}

/** L'angle (degrés, sens horaire depuis 3 h) d'un accord de la gamme vu du centre ; la tonique et l'absence d'ancre : en bas. */
function anchorAngle(anchor: string | null): number {
  if (!anchor || anchor === 'I') return 90;
  const p = diatonicPoint(anchor);
  return (Math.atan2(p.y - CENTER, p.x - CENTER) * 180) / Math.PI;
}

/** Les satellites, groupés par ancre, s'écartent en éventail au-delà de leur ancre. */
export function satellitePoints(items: readonly { id: string; anchor: string | null }[]): Map<string, Point> {
  const groups = new Map<number, string[]>();
  for (const it of items) {
    const a = anchorAngle(it.anchor);
    groups.set(a, [...(groups.get(a) ?? []), it.id]);
  }
  const out = new Map<string, Point>();
  for (const [a, ids] of groups) ids.forEach((id, k) => out.set(id, polar(CHORD_RING + SAT_DIST, a + (k - (ids.length - 1) / 2) * SAT_SPREAD)));
  return out;
}

/** Angle d'une tonalité sur l'anneau fixe (Do en haut, Sol un cran à droite…). */
export const keyAngle = (tonic: number): number => -90 + 30 * fifthsIndex(tonic);

/** Nouvelle rotation de l'anneau (en degrés), par le plus court chemin, pour amener `toKey` en haut. */
export const ringRotation = (previous: number, fromKey: number, toKey: number): number => previous - 30 * fifthsOffset(fromKey, toKey);

/** L'arc de la maison à la tonalité du moment, dans le repère fixe de l'anneau. */
export function homeArc(home: number, key: number): { from: number; to: number } | null {
  const off = fifthsOffset(home, key);
  if (off === 0) return null;
  const from = keyAngle(home);
  return { from, to: from + 30 * off };
}

export function arcPath(r: number, from: number, to: number): string {
  const a = polar(r, from);
  const b = polar(r, to);
  const sweep = to > from ? 1 : 0;
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} A${r},${r} 0 ${large} ${sweep} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}
```

- [ ] **Étape 4 : vérifier le succès.** Si le test « satellites » échoue sur une distance, ajuster `SAT_DIST` / `SAT_SPREAD` (pas les tests) en gardant `CHORD_RING + SAT_DIST + SAT_DISK < KEY_RING - 15`.

- [ ] **Étape 5 : committer**

```bash
npm test && npm run typecheck
git add viz/chemin-des-accords/domain/geometry.ts viz/chemin-des-accords/domain/geometry.test.ts
git commit -m "feat(chemin-des-accords): géométrie du cercle, des satellites et de l'anneau

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 4 : les légendes et les bulles (`notes.ts`)

**Fichiers :**
- Créer : `viz/chemin-des-accords/domain/notes.ts`
- Tester : `viz/chemin-des-accords/domain/notes.test.ts`

**Interfaces :**
- Consomme : `Journey`, `journeyOf` (tâche 1) ; `Candidate` (tâche 2) ; `nameOf`, `keyName`, `fifthsOffset`, `chordAt`, `type Chord` (harmony.ts) ; `chordByLabel` (layout.ts).
- Produit :

```ts
export type NoteKind = 'retour' | 'confirme' | 'eteint' | 'frole' | 'suspens' | 'boucle' | 'emprunt' | 'couleur' | 'rare' | 'satellite' | 'halos' | 'depart';
export interface Note { kind: NoteKind; text: string; once: boolean }
export interface NoteContext { share: number | null; satellites: number; seen: ReadonlySet<NoteKind> }
export function noteFor(j: Journey, ctx: NoteContext): Note | null;
export function whereText(j: Journey): string;
export function pct(share: number): string;
export function haloTip(from: Chord, c: Candidate): string;
export function pivotTip(chord: Chord, before: string, after: string): string;
export const RING_TIP: string;
export const RIBBON_TIP: string;
```

- [ ] **Étape 1 : tests qui échouent** — `notes.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import type { Chord } from '../../suis-les-fleches/domain/harmony';
import { journeyOf } from './journey';
import { haloTip, noteFor, pct, pivotTip, whereText, type NoteContext, type NoteKind } from './notes';

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
    expect(note([M(0), M(2)])!.text).toBe('Ré n’est pas dans Do majeur : il tire vers Sol majeur. Si un accord propre à Sol suit, on aura modulé.');
    expect(note([M(0), M(2), m(4)])!.text).toBe('Mi m est en Do comme en Sol : on ne sait pas encore.');
    expect(note([M(0), M(2), M(5)])!.text).toBe('Fa n’existe qu’en Do majeur : Ré n’était qu’un détour vers Sol majeur (on dit une tonicisation).');
    expect(note([M(0), M(2), m(5)])!.text).toMatch(/^Fa m ramène en Do majeur/);
  });

  it('confirmation avec pivot, puis retour à la maison', () => {
    expect(note([M(0), m(9), M(2), M(7), m(11)])!.text).toBe('Si m n’existe qu’en Sol majeur : on y est. Ré a servi de pivot : V/V en Do, V en Sol.');
    expect(note([M(0), M(2), M(7), m(11), dim(11), M(0), M(5)])!.kind).toBe('retour');
  });

  it('emprunt, emprunt en boucle, dominante vers un accord mineur', () => {
    expect(note([M(0), M(10)])!.text).toBe('Si♭ vient de Do mineur : une ombre passagère, on reste en Do.');
    expect(note([M(0), M(10), M(0), M(10)])!.text).toBe('Do – Si♭ en boucle : le son du rock (mode mixolydien). On reste en Do : Si♭ est une couleur, pas une destination.');
    expect(note([M(0), M(4)])!.text).toBe('Mi pointe vers La m : il l’éclaire sans quitter Do majeur (une dominante secondaire).');
  });

  it('pas rare et premier satellite, par priorité', () => {
    expect(note([M(0), M(7)], { share: 0.004 })!.kind).toBe('rare');
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
```

- [ ] **Étape 2 : vérifier l'échec** — `npx vitest run viz/chemin-des-accords/domain/notes.test.ts`.

- [ ] **Étape 3 : écrire `notes.ts`**

```ts
/**
 * Les mots de la page : la légende d'un pas (une seule à la fois, par priorité), la phrase « où je suis », les bulles.
 * Les légendes d'apprentissage (`once`) ne paraissent qu'une fois par visite : la page tient la liste de celles déjà vues.
 */
import { chordAt, fifthsOffset, keyName, nameOf, roleOf, sameChord, type Chord } from '../../suis-les-fleches/domain/harmony';
import { chordByLabel } from '../../suis-les-fleches/domain/layout';
import type { Candidate } from './halos';
import type { Journey } from './journey';

export type NoteKind = 'retour' | 'confirme' | 'eteint' | 'frole' | 'suspens' | 'boucle' | 'emprunt' | 'couleur' | 'rare' | 'satellite' | 'halos' | 'depart';

export interface Note {
  kind: NoteKind;
  text: string;
  once: boolean;
}

export interface NoteContext {
  /** Part du corpus du pas qu'on vient de faire (`null` : premier accord, ou pas inconnu). */
  share: number | null;
  /** Nombre de satellites affichés maintenant. */
  satellites: number;
  seen: ReadonlySet<NoteKind>;
}

/** « Sol », pour une tonalité dite en court. */
const short = (tonic: number) => nameOf({ root: tonic, cls: 'maj' });

export const pct = (share: number) => (share < 0.01 ? '< 1 %' : `${Math.round(share * 100)} %`);

export function noteFor(j: Journey, ctx: NoteContext): Note | null {
  const n = j.steps.length;
  if (n === 0) return { kind: 'depart', text: 'Touche un accord pour commencer. Depuis la maison, tout est possible.', once: false };
  const last = j.steps[n - 1]!;
  const c = last.chord;
  const e = last.event;
  const ev = (kind: NoteKind, text: string): Note => ({ kind, text, once: false });

  switch (e.kind) {
    case 'confirme': {
      if (e.to === j.home) return ev('retour', `De retour en ${keyName(j.home)}, la maison.`);
      const p = j.steps[e.pivot]!;
      return ev(
        'confirme',
        `${nameOf(c)} n’existe qu’en ${keyName(e.to)} : on y est. ${nameOf(p.chord)} a servi de pivot : ${p.pivot!.before} en ${short(e.from)}, ${p.pivot!.after} en ${short(e.to)}.`,
      );
    }
    case 'eteint': {
      const frolant = nameOf(j.steps[e.frole]!.chord);
      const head = roleOf(c, j.key).kind === 'diatonique' ? `${nameOf(c)} n’existe qu’en ${keyName(j.key)}` : `${nameOf(c)} ramène en ${keyName(j.key)}`;
      return ev('eteint', `${head} : ${frolant} n’était qu’un détour vers ${keyName(e.target)} (on dit une tonicisation).`);
    }
    case 'frole':
      return ev('frole', `${nameOf(c)} n’est pas dans ${keyName(last.key)} : il tire vers ${keyName(e.target)}. Si un accord propre à ${short(e.target)} suit, on aura modulé.`);
    case 'suspens':
      return ev('suspens', `${nameOf(c)} est en ${short(last.key)} comme en ${short(e.target)} : on ne sait pas encore.`);
    case 'couleur': {
      if (e.cause === 'dominante') {
        const target = chordAt(j.key, chordByLabel(e.anchor)!.degree);
        return ev('couleur', `${nameOf(c)} pointe vers ${nameOf(target)} : il l’éclaire sans quitter ${keyName(j.key)} (une dominante secondaire).`);
      }
      const before = j.steps[n - 2];
      const twoBefore = j.steps[n - 3];
      if (before && twoBefore && before.label === 'I' && sameChord(twoBefore.chord, c)) {
        const loop = `${nameOf(before.chord)} – ${nameOf(c)} en boucle`;
        const why = last.label === '♭VII' ? 'le son du rock (mode mixolydien)' : `une couleur qui revient`;
        return ev('boucle', `${loop} : ${why}. On reste en ${short(j.key)} : ${nameOf(c)} est une couleur, pas une destination.`);
      }
      return ev('emprunt', `${nameOf(c)} vient de ${short(j.key)} mineur : une ombre passagère, on reste en ${short(j.key)}.`);
    }
    default:
      break;
  }
  if (ctx.share !== null && ctx.share < 0.01 && n > 1) return ev('rare', 'Peu de chansons font ce pas. Rien n’est interdit : à toi de juger à l’oreille.');
  if (ctx.satellites > 0 && !ctx.seen.has('satellite'))
    return { kind: 'satellite', text: 'En pointillés : un accord hors de la gamme, que les chansons jouent souvent ici.', once: true };
  if (n === 1 && !ctx.seen.has('halos'))
    return { kind: 'halos', text: `Les halos montrent où vont les chansons après ${nameOf(c)} : plus il est grand, plus le pas est courant.`, once: true };
  return null;
}

/** Sous « Tu es en Sol majeur » : d'où l'on vient, ou ce qui est en suspens. */
export function whereText(j: Journey): string {
  if (j.leaning !== null) return `on penche vers ${keyName(j.leaning)}`;
  const off = fifthsOffset(j.home, j.key);
  if (off === 0) return 'la maison';
  if (Math.abs(off) === 6) return `parti de ${keyName(j.home)}, à l’autre bout du cycle des quintes`;
  const crans = Math.abs(off) === 1 ? 'un cran' : `${Math.abs(off)} crans`;
  return `parti de ${keyName(j.home)}, ${crans} vers les ${off > 0 ? 'dièses' : 'bémols'}`;
}

export const haloTip = (from: Chord, c: Candidate) =>
  c.share === null ? `${nameOf(c.chord)} : ${c.label}.` : `${pct(c.share)} des chansons qui jouent ${nameOf(from)} font ensuite ${nameOf(c.chord)}.`;

export const pivotTip = (chord: Chord, before: string, after: string) => `${nameOf(chord)} appartient aux deux tonalités : ${before} avant, ${after} après.`;

export const RING_TIP = 'Les douze tonalités majeures, rangées par quintes : deux voisines partagent presque tous leurs accords. En pointillés, la maison ; en couleur, où tu es.';
export const RIBBON_TIP = 'Ta progression, accord par accord. Chaque bande est une tonalité ; un accord pivot est à cheval sur deux bandes.';
```

- [ ] **Étape 4 : vérifier le succès** — même commande, tout passe. (Fa est diatonique en Do : « n’existe qu’en » ; Fa m est un emprunt : « ramène en ».)

- [ ] **Étape 5 : committer**

```bash
npm test && npm run typecheck
git add viz/chemin-des-accords/domain/notes.ts viz/chemin-des-accords/domain/notes.test.ts
git commit -m "feat(chemin-des-accords): légendes au fil du jeu et textes des bulles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 5 : l'état dans l'URL (`state.ts`)

**Fichiers :**
- Créer : `viz/chemin-des-accords/state.ts`
- Tester : `viz/chemin-des-accords/state.test.ts`

**Interfaces :**
- Consomme : `parseChord`, `parsePitch`, `triadClass` (`@shell/music/chords`) ; `KEY_NAMES` (`../compose-ta-progression/state`) ; `type Chord` (harmony.ts).
- Produit :

```ts
export interface VizState { home: number; path: Chord[] }
export const MAX_PATH = 32;
export function chordSymbol(c: Chord): string;          // « C », « Am », « F#m », « Bdim »
export function parseSymbol(s: string): Chord | null;
export function readStateFromUrl(search: string): VizState;
export function stateToSearch(s: VizState): string;    // '' par défaut ; sinon « ?t=G&p=C,Am,D »
```

- [ ] **Étape 1 : tests qui échouent** — `state.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { chordSymbol, MAX_PATH, parseSymbol, readStateFromUrl, stateToSearch } from './state';

describe('état dans l’URL', () => {
  it('valeurs par défaut', () => {
    expect(readStateFromUrl('')).toEqual({ home: 0, path: [] });
    expect(stateToSearch({ home: 0, path: [] })).toBe('');
  });

  it('symboles', () => {
    expect(chordSymbol({ root: 6, cls: 'min' })).toBe('F#m');
    expect(chordSymbol({ root: 11, cls: 'dim' })).toBe('Bdim');
    expect(parseSymbol('Bdim')).toEqual({ root: 11, cls: 'dim' });
    expect(parseSymbol('Bbm')).toEqual({ root: 10, cls: 'min' });
    expect(parseSymbol('Caug')).toBeNull();
    expect(parseSymbol('zz')).toBeNull();
  });

  it('aller-retour', () => {
    const s = readStateFromUrl('?t=G&p=C,Am,D,G,Bm');
    expect(s.home).toBe(7);
    expect(s.path.map(chordSymbol)).toEqual(['C', 'Am', 'D', 'G', 'Bm']);
    expect(readStateFromUrl(stateToSearch(s))).toEqual(s);
    const sharp = { home: 6, path: [{ root: 6, cls: 'min' as const }] };
    expect(readStateFromUrl(stateToSearch(sharp))).toEqual(sharp);
  });

  it('ignore l’illisible et coupe les chemins trop longs', () => {
    expect(readStateFromUrl('?t=H&p=C,zz,G').path.map(chordSymbol)).toEqual(['C', 'G']);
    expect(readStateFromUrl('?t=H').home).toBe(0);
    expect(readStateFromUrl(`?p=${Array(40).fill('C').join(',')}`).path).toHaveLength(MAX_PATH);
  });
});
```

- [ ] **Étape 2 : vérifier l'échec** — `npx vitest run viz/chemin-des-accords/state.test.ts`.

- [ ] **Étape 3 : écrire `state.ts`**

```ts
/** État dans l'URL : `?t=G&p=C,Am,D,G,Bm` (la maison, puis le chemin en accords réels ; valeurs par défaut omises). */
import { parseChord, parsePitch, triadClass } from '@shell/music/chords';
import { KEY_NAMES } from '../compose-ta-progression/state';
import type { Chord } from '../suis-les-fleches/domain/harmony';

export interface VizState {
  home: number;
  path: Chord[];
}

export const MAX_PATH = 32;
const SUFFIX: Record<Chord['cls'], string> = { maj: '', min: 'm', dim: 'dim' };

export const chordSymbol = (c: Chord) => `${KEY_NAMES[c.root]}${SUFFIX[c.cls]}`;

export function parseSymbol(s: string): Chord | null {
  const c = parseChord(s);
  if (!c) return null;
  const cls = triadClass(c.quality);
  return cls === 'maj' || cls === 'min' || cls === 'dim' ? { root: c.root, cls } : null;
}

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const path = (q.get('p') ?? '')
    .split(',')
    .filter(Boolean)
    .map(parseSymbol)
    .filter((c): c is Chord => c !== null)
    .slice(0, MAX_PATH);
  return { home: parsePitch(q.get('t') ?? 'C') ?? 0, path };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.home !== 0) q.set('t', KEY_NAMES[s.home]!);
  if (s.path.length) q.set('p', s.path.map(chordSymbol).join(','));
  // Virgules lisibles ; le dièse reste encodé (%23), sinon il ouvrirait un fragment.
  const str = q.toString().replace(/%2C/g, ',');
  return str ? `?${str}` : '';
}
```

- [ ] **Étape 4 : vérifier le succès.** Si `parsePitch('H')` ne renvoie pas `null`, le test « illisible » le dira : adapter le test à ce que fait `parsePitch` (socle, ne pas le modifier).

- [ ] **Étape 5 : committer**

```bash
npm test && npm run typecheck
git add viz/chemin-des-accords/state.ts viz/chemin-des-accords/state.test.ts
git commit -m "feat(chemin-des-accords): la maison et le chemin dans l'URL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 6 : la carte jouable (squelette, cercle, anneau, halos, toucher-poser, son)

**Fichiers :**
- Modifier : `viz/chemin-des-accords/index.html` (créé par `new:viz` à la tâche 1)
- Remplacer : `viz/chemin-des-accords/main.ts`, `viz/chemin-des-accords/viz.css`
- Créer : `viz/chemin-des-accords/ui/map.ts`

**Interfaces :**
- Consomme : tâches 1 à 5 ; `loadShard` (`../progression-jouee/data/load`) ; `arrowPath`, `layoutOf`, `FN_LABELS` (layout.ts) ; `diatonicChords`, `chordId`, `nameOf`, `roleOf`, `keyName` (harmony.ts).
- Produit (pour les tâches 7 à 9) :

```ts
// ui/map.ts
export interface MapView { key: number; home: number; leaning: number | null; rotation: number; current: Chord | null; candidates: Candidate[]; trail: Chord[] }
export interface MapOptions { onPick: (c: Chord) => void; onHover: (c: Chord | null) => void; reducedMotion: boolean }
export class ChordMap { constructor(svg: SVGSVGElement, opts: MapOptions); render(v: MapView): void; preview(c: Chord | null): void }
// main.ts (interne) : render(), pick(c), sound(c)
```

- [ ] **Étape 1 : la page** — dans `index.html`, garder l'en-tête et les notes générés ; remplacer le bloc `<section class="viz-workspace">` par :

```html
      <section class="viz-workspace" aria-label="Visualisation">
        <div class="viz-panel" id="panel">
          <label class="home-field">Tonalité de départ <select id="home"></select></label>
          <div class="where">
            <p class="where-kicker">Tu es en</p>
            <p class="where-key" id="where-key">Do majeur</p>
            <p class="where-sub" id="where-sub">la maison</p>
          </div>
          <div class="panel-block">
            <p class="panel-label">Dernier pas</p>
            <p class="step-text" id="step"></p>
          </div>
          <div class="panel-block">
            <p class="panel-label">Où aller <span class="panel-hint">part des chansons</span></p>
            <p class="next-text" id="next"></p>
          </div>
          <div class="actions">
            <button type="button" id="undo">↶ Annuler</button>
            <button type="button" id="listen">▶ Écouter</button>
            <button type="button" id="restart">Recommencer</button>
          </div>
        </div>

        <div class="viz-stage">
          <div class="stage-frame" id="stage">
            <svg id="map" class="map" viewBox="-20 -20 1040 1040" role="group" aria-label="Carte de la tonalité : touche un accord pour le jouer"></svg>
            <p class="note" id="note" aria-live="polite"></p>
          </div>
          <div class="ribbon" id="ribbon" aria-label="Ta progression"></div>
        </div>
      </section>
```

(Les notes « Comment lire… » restent celles du gabarit jusqu'à la tâche 10.)

- [ ] **Étape 2 : `ui/map.ts`**

```ts
/**
 * La carte SVG : secteurs de fonction, anneau des tonalités, halos (les possibilités), traînée (le chemin), disques.
 * Les disques sont identifiés par l'accord réel : à une modulation, un accord commun glisse à sa nouvelle place
 * (transition CSS sur `transform`), et son degré se réécrit.
 */
import { chordId, diatonicChords, keyName, nameOf, roleOf, type Chord } from '../../suis-les-fleches/domain/harmony';
import { arrowPath, FN_LABELS, layoutOf, type Point } from '../../suis-les-fleches/domain/layout';
import { roleText } from '../../suis-les-fleches/domain/moves';
import { arcPath, CHORD_RING, DISK, diatonicPoint, HOME_ARC, homeArc, KEY_RING, keyAngle, polar, SAT_DISK, satellitePoints, TONIC_DISK } from '../domain/geometry';
import type { Candidate } from '../domain/halos';
import { haloTip, pct, RING_TIP } from '../domain/notes';

const NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.appendChild(e);
  return e;
}

export interface MapView {
  key: number;
  home: number;
  leaning: number | null;
  /** Rotation de l'anneau (degrés), cumulée par la page pour tourner par le plus court chemin. */
  rotation: number;
  current: Chord | null;
  candidates: Candidate[];
  /** Les derniers accords joués dans la tonalité du moment, du plus ancien au plus récent. */
  trail: Chord[];
}

export interface MapOptions {
  onPick: (c: Chord) => void;
  onHover: (c: Chord | null) => void;
  reducedMotion: boolean;
}

interface Spot {
  chord: Chord;
  p: Point;
  r: number;
  label: string;
  kind: string;
}

const KEYS = Array.from({ length: 12 }, (_, i) => (i * 7) % 12);
const SECTOR_SCALE = CHORD_RING / 310;

export class ChordMap {
  private ring: SVGGElement;
  private ringLabels = new Map<number, SVGGElement>();
  private arc: SVGPathElement;
  private halos: SVGGElement;
  private trail: SVGGElement;
  private previewLayer: SVGGElement;
  private nodeLayer: SVGGElement;
  private pcts: SVGGElement;
  private nodes = new Map<string, SVGGElement>();
  private spots = new Map<string, Spot>();
  private view: MapView | null = null;

  constructor(
    private svg: SVGSVGElement,
    private opts: MapOptions,
  ) {
    // Deux têtes de flèche : ardoise pour le chemin ancien, accent pour le dernier pas, l'aperçu et l'arc de la maison.
    const defs = el('defs', {}, svg);
    for (const [id, cls] of [
      ['map-head', 'map-head'],
      ['map-head-accent', 'map-head map-head--accent'],
    ] as const) {
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto', markerUnits: 'strokeWidth' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', class: cls }, m);
    }
    this.drawSectors(el('g', { class: 'map-sectors' }, svg));
    this.ring = el('g', { class: 'map-ring', 'data-tip': RING_TIP }, svg);
    this.arc = el('path', { class: 'map-home-arc' }, this.ring);
    for (const t of KEYS) {
      const a = polar(KEY_RING, keyAngle(t));
      const g = el('g', { class: 'ring-key', transform: `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})` }, this.ring);
      el('circle', { class: 'ring-key-mark', r: 30 }, g);
      el('text', { class: 'ring-key-name', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g).textContent = nameOf({ root: t, cls: 'maj' });
      this.ringLabels.set(t, g);
    }
    this.halos = el('g', { class: 'map-halos' }, svg);
    this.trail = el('g', { class: 'map-trail' }, svg);
    this.previewLayer = el('g', { class: 'map-preview' }, svg);
    this.nodeLayer = el('g', { class: 'map-nodes' }, svg);
    this.pcts = el('g', { class: 'map-pcts' }, svg);
  }

  private drawSectors(g: SVGGElement) {
    const l = layoutOf('cercle');
    const [r0, r1] = l.sectorRadii.map((r) => r * 1000 * SECTOR_SCALE) as [number, number];
    for (const s of l.sectors) {
      const a = polar(r1, s.from + 2);
      const b = polar(r1, s.to - 2);
      const c = polar(r0, s.to - 2);
      const d = polar(r0, s.from + 2);
      el('path', { class: `map-sector map-sector--${s.fn}`, d: `M${a.x},${a.y} A${r1},${r1} 0 0 1 ${b.x},${b.y} L${c.x},${c.y} A${r0},${r0} 0 0 0 ${d.x},${d.y} Z` }, g);
      const mid = polar(r1 + 18, (s.from + s.to) / 2);
      el('text', { class: 'map-sector-name', x: mid.x, y: mid.y, 'text-anchor': 'middle' }, g).textContent = FN_LABELS[s.fn].name;
    }
  }

  /** Où chaque accord se trouve dans la tonalité du moment. */
  private layout(v: MapView): Map<string, Spot> {
    const out = new Map<string, Spot>();
    for (const { chord, role } of diatonicChords(v.key))
      out.set(chordId(chord), { chord, p: diatonicPoint(role.label), r: role.label === 'I' ? TONIC_DISK : DISK, label: role.label, kind: `diatonique map-node--${role.fn}` });
    const outside = v.candidates.filter((c) => c.satellite).map((c) => ({ chord: c.chord, label: c.label, anchor: c.anchor }));
    if (v.current && !out.has(chordId(v.current)) && !outside.some((o) => chordId(o.chord) === chordId(v.current!))) {
      const r = roleOf(v.current, v.key);
      outside.push({ chord: v.current, label: r.label, anchor: r.anchor });
    }
    const pts = satellitePoints(outside.map((o) => ({ id: chordId(o.chord), anchor: o.anchor })));
    for (const o of outside) out.set(chordId(o.chord), { chord: o.chord, p: pts.get(chordId(o.chord))!, r: SAT_DISK, label: o.label, kind: 'satellite' });
    return out;
  }

  render(v: MapView) {
    this.view = v;
    this.spots = this.layout(v);
    this.drawRing(v);
    this.drawNodes(v);
    this.drawHalos(v);
    this.drawTrail(v);
    this.preview(null);
  }

  private drawRing(v: MapView) {
    this.ring.style.transform = `rotate(${v.rotation}deg)`;
    for (const [t, g] of this.ringLabels) {
      g.classList.toggle('is-current', t === v.key);
      g.classList.toggle('is-home', t === v.home);
      g.classList.toggle('is-leaning', t === v.leaning);
      g.querySelector('text')!.style.transform = `rotate(${-v.rotation}deg)`;
    }
    const arc = homeArc(v.home, v.key);
    this.arc.setAttribute('d', arc ? arcPath(HOME_ARC, arc.from, arc.to) : '');
    this.ring.setAttribute('aria-label', `Tonalité du moment : ${keyName(v.key)}`);
  }

  private drawNodes(v: MapView) {
    const current = v.current ? chordId(v.current) : null;
    for (const [id, g] of this.nodes) {
      if (this.spots.has(id)) continue;
      this.nodes.delete(id);
      g.classList.add('is-leaving');
      setTimeout(() => g.remove(), this.opts.reducedMotion ? 0 : 350);
    }
    for (const [id, s] of this.spots) {
      let g = this.nodes.get(id);
      if (!g) {
        g = el('g', { tabindex: 0, role: 'button' }, this.nodeLayer);
        el('circle', { class: 'map-node-disc' }, g);
        el('text', { class: 'map-node-name', 'text-anchor': 'middle' }, g);
        el('text', { class: 'map-node-sub', 'text-anchor': 'middle' }, g);
        const pick = () => this.opts.onPick(this.spots.get(id)!.chord);
        g.addEventListener('click', pick);
        g.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pick();
          }
        });
        g.addEventListener('pointerenter', (e) => {
          if (e.pointerType === 'mouse') this.opts.onHover(this.spots.get(id)!.chord);
        });
        g.addEventListener('pointerleave', (e) => {
          if (e.pointerType === 'mouse') this.opts.onHover(null);
        });
        g.classList.add('is-entering');
        requestAnimationFrame(() => g!.classList.remove('is-entering'));
        this.nodes.set(id, g);
      }
      g.setAttribute('class', `map-node map-node--${s.kind}${id === current ? ' is-current' : ''}`);
      g.style.transform = `translate(${s.p.x.toFixed(1)}px, ${s.p.y.toFixed(1)}px)`;
      const [disc, name, sub] = [g.children[0]!, g.children[1]!, g.children[2]!];
      disc.setAttribute('r', String(s.r));
      name.setAttribute('y', String(s.kind === 'satellite' ? -2 : -6));
      name.textContent = nameOf(s.chord);
      sub.setAttribute('y', String(s.kind === 'satellite' ? 22 : 26));
      sub.textContent = s.label;
      const cand = v.candidates.find((c) => chordId(c.chord) === id);
      const base = cand && v.current ? haloTip(v.current, cand) : `${nameOf(s.chord)} : ${s.label} en ${keyName(v.key)}.`;
      g.dataset.tip = s.kind === 'satellite' ? `${base} ${nameOf(s.chord)} : ${roleText(s.chord, v.key)}.` : base;
      g.setAttribute('aria-label', `${nameOf(s.chord)}, ${s.label}${cand?.share != null ? `, ${pct(cand.share)} des chansons` : ''}`);
    }
  }

  private drawHalos(v: MapView) {
    this.halos.replaceChildren();
    this.pcts.replaceChildren();
    for (const c of v.candidates) {
      if (c.share === null) continue;
      const s = this.spots.get(chordId(c.chord));
      if (!s) continue;
      const r = s.r + 6 + 54 * Math.sqrt(c.share);
      el('circle', { class: 'map-halo', cx: s.p.x, cy: s.p.y, r, style: `--share:${c.share.toFixed(3)}` }, this.halos);
      el('text', { class: 'map-pct', x: s.p.x, y: s.p.y + r + 26, 'text-anchor': 'middle' }, this.pcts).textContent = pct(c.share);
    }
  }

  private arrow(a: Chord, b: Chord, cls: string, parent: SVGGElement, accent: boolean) {
    const sa = this.spots.get(chordId(a));
    const sb = this.spots.get(chordId(b));
    if (!sa || !sb || chordId(a) === chordId(b)) return;
    const { d } = arrowPath(sa.p, sb.p, sa.r, 0.18, 0, sb.r);
    el('path', { class: cls, d, 'marker-end': `url(#${accent ? 'map-head-accent' : 'map-head'})` }, parent);
  }

  private drawTrail(v: MapView) {
    this.trail.replaceChildren();
    const t = v.trail;
    for (let i = 1; i < t.length; i++) {
      const age = t.length - 1 - i;
      this.arrow(t[i - 1]!, t[i]!, `map-step map-step--age${Math.min(age, 3)}`, this.trail, age === 0);
    }
  }

  /** La flèche du pas à venir (survol d'un candidat), ou rien. */
  preview(c: Chord | null) {
    this.previewLayer.replaceChildren();
    if (c && this.view?.current) this.arrow(this.view.current, c, 'map-step map-step--preview', this.previewLayer, true);
  }
}
```

- [ ] **Étape 3 : `main.ts` (première version : carte, panneau, toucher-poser, son, URL)**

```ts
import { escapeHtml } from '@shell/html';
import { equalFrequency } from '@shell/music/pitch';
import { Synth } from '@shell/music/synth';
import { voice } from '@shell/music/voicing';
import { mountShell } from '@shell/shell';
import { createStore } from '@shell/store';
import { loadShard } from '../progression-jouee/data/load';
import { chordId, keyName, nameOf, type Chord } from '../suis-les-fleches/domain/harmony';
import { moveSentence, roleText } from '../suis-les-fleches/domain/moves';
import { ringRotation } from './domain/geometry';
import { candidates, type Candidate, type Rows } from './domain/halos';
import { journeyOf, type Journey } from './domain/journey';
import { pct, whereText } from './domain/notes';
import { KEY_NAMES, readStateFromUrl, stateToSearch, type VizState } from './state';
import { ChordMap } from './ui/map';
import './viz.css';

mountShell({ currentSlug: 'chemin-des-accords' });

const $ = <T extends HTMLElement>(id: string) => {
  const e = document.getElementById(id);
  if (!e) throw new Error(`#${id} introuvable`);
  return e as T;
};
const els = {
  home: $<HTMLSelectElement>('home'),
  whereKey: $('where-key'),
  whereSub: $('where-sub'),
  step: $('step'),
  next: $('next'),
  note: $('note'),
  undo: $<HTMLButtonElement>('undo'),
  listen: $<HTMLButtonElement>('listen'),
  restart: $<HTMLButtonElement>('restart'),
  ribbon: $('ribbon'),
  map: document.getElementById('map') as unknown as SVGSVGElement,
};

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let rows: Rows = {};
let lastVoicing: number[] | null = null;
let rotation = 0;
let rotationKey = store.get().home;
/** Part du corpus du dernier pas posé (pour la légende « pas rare »). */
let lastShare: number | null = null;

const map = new ChordMap(els.map, {
  onPick: (c) => pick(c),
  onHover: (c) => hover(c),
  reducedMotion,
});

/** Survol d'un candidat (souris) : sa flèche se dessine et le panneau raconte le pas à venir. */
function hover(c: Chord | null) {
  map.preview(c);
  const { home, path } = store.get();
  const j = journeyOf(home, path);
  const last = j.steps[j.steps.length - 1];
  if (c && last && chordId(c) !== chordId(last.chord)) els.step.textContent = `Si tu joues ${nameOf(c)} — ${moveSentence(last.chord, c, j.key)}`;
  else render();
}

els.home.innerHTML = KEY_NAMES.map((_, t) => `<option value="${t}">${escapeHtml(keyName(t))}</option>`).join('');

function sound(c: Chord) {
  lastVoicing = voice({ step: c.root, cls: c.cls }, 0, lastVoicing);
  synth.play(lastVoicing.map((m) => equalFrequency(m)), 1.2);
}

/** Les derniers accords joués dans la tonalité du moment (au plus cinq). */
function trailOf(j: Journey): Chord[] {
  const out: Chord[] = [];
  for (let i = j.steps.length - 1; i >= 0 && out.length < 5 && j.steps[i]!.key === j.key; i--) out.unshift(j.steps[i]!.chord);
  return out;
}

/** Dessine le chemin jusqu'au pas `n` (tout le chemin par défaut ; l'écoute rejoue pas à pas). */
function render(n = store.get().path.length) {
  const { home, path } = store.get();
  const j = journeyOf(home, path.slice(0, n));
  const last = j.steps[j.steps.length - 1]?.chord ?? null;
  const cands = candidates(last, j.key, rows);
  rotation = ringRotation(rotation, rotationKey, j.key);
  rotationKey = j.key;
  map.render({ key: j.key, home, leaning: j.leaning, rotation, current: last, candidates: cands, trail: trailOf(j) });
  renderPanel(j, cands);
}

function renderPanel(j: Journey, cands: Candidate[]) {
  els.home.value = String(j.home);
  els.whereKey.textContent = keyName(j.key);
  els.whereSub.textContent = whereText(j);
  const n = j.steps.length;
  const last = j.steps[n - 1];
  const before = j.steps[n - 2];
  els.step.textContent = !last ? 'Rien encore : choisis un premier accord.' : before ? moveSentence(before.chord, last.chord, last.key) : `${nameOf(last.chord)} : ${roleText(last.chord, last.key)}.`;
  const top = cands.filter((c) => c.share !== null && c.share > 0).sort((a, b) => b.share! - a.share!).slice(0, 4);
  els.next.textContent = !last ? 'Partout : depuis la maison, tout est possible.' : top.length ? top.map((c) => `${nameOf(c.chord)} ${pct(c.share!)}`).join(' · ') : 'Trop peu de chansons pour le dire.';
  els.undo.disabled = n === 0;
  els.restart.disabled = n === 0;
}

function pick(c: Chord) {
  const { home, path } = store.get();
  const j = journeyOf(home, path);
  const last = j.steps[j.steps.length - 1]?.chord ?? null;
  lastShare = last ? (candidates(last, j.key, rows).find((x) => chordId(x.chord) === chordId(c))?.share ?? 0) : null;
  sound(c);
  store.set({ path: [...path, c] });
}

els.undo.addEventListener('click', () => {
  lastShare = null;
  store.set({ path: store.get().path.slice(0, -1) });
});
els.restart.addEventListener('click', () => {
  lastShare = null;
  lastVoicing = null;
  store.set({ path: [] });
});
els.home.addEventListener('change', () => {
  lastShare = null;
  store.set({ home: Number(els.home.value), path: [] });
});

store.subscribe(() => {
  history.replaceState(null, '', `${location.pathname}${stateToSearch(store.get())}${location.hash}`);
  render();
});

render();
loadShard(2)
  .then((s) => {
    rows = s.rows;
    render();
  })
  .catch(() => {
    els.next.textContent = 'Les parts des chansons n’ont pas pu être chargées ; la carte reste jouable.';
  });
```

(`lastShare` sert à la tâche 9 ; TypeScript strict refusera une variable écrite jamais lue si `noUnusedLocals` est actif : dans ce cas, l'exporter temporairement par `void lastShare;` à la fin du fichier, retiré en tâche 9.)

- [ ] **Étape 4 : `viz.css`**

```css
/* Styles propres à « Le chemin des accords ». Toujours dériver des jetons de src/shell/tokens.css. */

.stage-frame {
  position: relative;
  display: grid;
  gap: var(--space-3);
  justify-items: center;
}

.map {
  width: 100%;
  max-width: 680px;
  height: auto;
  overflow: visible;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

/* Secteurs (rampe ardoise : repos clair, départ moyen, tension foncé) */
.map-sector {
  stroke: none;
}
.map-sector--repos {
  fill: var(--seq-0);
}
.map-sector--depart {
  fill: color-mix(in srgb, var(--seq-1) 70%, transparent);
}
.map-sector--tension {
  fill: color-mix(in srgb, var(--seq-2) 60%, transparent);
}
.map-sector-name {
  font: 600 22px var(--font-ui);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  fill: var(--ink-3);
}

/* Anneau des tonalités */
.map-ring {
  transform-origin: 500px 500px;
  transition: transform 0.9s var(--ease);
}
.ring-key-name {
  font: 400 26px var(--font-ui);
  fill: var(--ink-3);
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.9s var(--ease);
}
.ring-key-mark {
  fill: transparent;
  stroke: transparent;
  stroke-width: 2.5;
}
.ring-key.is-home .ring-key-mark {
  stroke: var(--ink-3);
  stroke-dasharray: 5 5;
}
.ring-key.is-leaning .ring-key-mark {
  stroke: var(--accent);
  stroke-dasharray: 5 5;
}
.ring-key.is-current .ring-key-mark {
  fill: var(--accent-soft);
  stroke: var(--accent);
  stroke-dasharray: none;
}
.ring-key.is-current .ring-key-name {
  font-weight: 700;
  fill: var(--ink);
}
.map-home-arc {
  fill: none;
  stroke: var(--accent);
  stroke-width: 3;
  marker-end: url(#map-head-accent);
}

/* Halos : les possibilités */
.map-halo {
  fill: var(--accent);
  fill-opacity: calc(0.08 + var(--share) * 0.5);
  stroke: none;
  transition: r 0.4s var(--ease);
}
.map-pct {
  font: 400 22px var(--font-ui);
  fill: var(--ink-2);
  pointer-events: none;
}

/* Le chemin */
.map-step {
  fill: none;
  stroke: var(--ink-3);
  stroke-width: 5;
  stroke-linecap: round;
}
.map-step--age0 {
  stroke: var(--accent);
  stroke-width: 6;
}
.map-step--age1 {
  opacity: 0.7;
}
.map-step--age2 {
  opacity: 0.45;
}
.map-step--age3 {
  opacity: 0.25;
}
.map-step--preview {
  stroke: var(--accent);
  stroke-dasharray: 10 10;
  opacity: 0.8;
}
.map-head {
  fill: var(--ink-3);
}
.map-head--accent {
  fill: var(--accent);
}

/* Disques */
.map-node {
  cursor: pointer;
  outline: none;
  transition:
    transform 0.8s var(--ease),
    opacity 0.35s;
}
.map-node.is-entering,
.map-node.is-leaving {
  opacity: 0;
}
.map-node-disc {
  stroke: var(--surface);
  stroke-width: 4;
}
.map-node--repos .map-node-disc {
  fill: var(--seq-1);
}
.map-node--depart .map-node-disc {
  fill: var(--seq-3);
}
.map-node--tension .map-node-disc {
  fill: var(--seq-5);
}
.map-node--satellite .map-node-disc {
  fill: var(--surface);
  stroke: var(--seq-4);
  stroke-width: 3;
  stroke-dasharray: 7 5;
}
.map-node.is-current .map-node-disc {
  stroke: var(--accent);
  stroke-width: 7;
}
.map-node:focus-visible .map-node-disc {
  stroke: var(--focus);
  stroke-width: 6;
}
.map-node-name {
  font: 700 30px var(--font-ui);
  fill: var(--ink);
  pointer-events: none;
}
.map-node-sub {
  font: 400 22px var(--font-ui);
  fill: var(--ink-2);
  pointer-events: none;
}
.map-node--tension .map-node-name,
.map-node--tension .map-node-sub {
  fill: var(--surface);
}

/* Panneau */
.home-field {
  display: grid;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--ink-2);
}
.where-kicker,
.panel-label {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.panel-hint {
  text-transform: none;
  letter-spacing: 0;
}
.where-key {
  margin: 0;
  font: 400 var(--text-xl) var(--font-display);
  color: var(--ink);
}
.where-sub,
.step-text,
.next-text {
  margin: 0;
  color: var(--ink-2);
}
.where,
.panel-block {
  display: grid;
  gap: var(--space-1);
  padding-top: var(--space-3);
  border-top: 1px solid var(--rule);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.note {
  margin: 0;
  max-width: 40rem;
  min-height: 1.5em;
  font-style: italic;
  color: var(--ink-2);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .map-ring,
  .ring-key-name,
  .map-node,
  .map-halo {
    transition: none;
  }
}

/* Mobile : la carte avant le panneau */
@media (max-width: 999px) {
  .viz-panel {
    order: 2;
  }
}
```

- [ ] **Étape 5 : vérifier dans le navigateur**

`preview_start` avec `atlas-dev` (ou `atlas-dev-auto` si le port est pris), ouvrir `/viz/chemin-des-accords/`. Vérifier : la carte s'affiche (cercle, secteurs, anneau avec Do en haut cerclé), toucher Do joue un son, les halos apparaissent avec des pourcentages, le panneau dit « Do : le I, la maison… » ; toucher Ré (satellite pointillé après Sol ou Do si présent) → anneau : Sol en pointillés ; jouer Do, La m, Ré, Sol, Si m → l'anneau tourne, Sol en haut, l'arc va de Do à Sol, les disques glissent. `read_console_messages` sans erreur. Corriger ce qui cloche (ne pas toucher au domaine sans test).

- [ ] **Étape 6 : committer**

```bash
npm test && npm run typecheck
git add viz/chemin-des-accords
git commit -m "feat(chemin-des-accords): la carte jouable (cercle, anneau, halos, son)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 7 : le ruban

**Fichiers :**
- Créer : `viz/chemin-des-accords/ui/ribbon.ts`
- Modifier : `viz/chemin-des-accords/main.ts` (appel au ruban dans `render`), `viz/chemin-des-accords/viz.css` (styles du ruban)

**Interfaces :**
- Consomme : `Journey`, `bandsOf` (tâche 1) ; `pivotTip`, `RIBBON_TIP` (tâche 4) ; `keyName`, `nameOf` (harmony.ts).
- Produit : `export function renderRibbon(root: HTMLElement, j: Journey): void`.

- [ ] **Étape 1 : `ui/ribbon.ts`**

```ts
/** Le ruban : les accords joués, en jetons, sur des bandes nommées par tonalité ; le pivot chevauche deux bandes. */
import { escapeHtml } from '@shell/html';
import { keyName, nameOf } from '../../suis-les-fleches/domain/harmony';
import { bandsOf, type Journey } from '../domain/journey';
import { pivotTip, RIBBON_TIP } from '../domain/notes';

export function renderRibbon(root: HTMLElement, j: Journey) {
  root.dataset.tip = RIBBON_TIP;
  if (!j.steps.length) {
    root.innerHTML = `<p class="ribbon-empty">Ta progression s’écrira ici.</p>`;
    return;
  }
  const last = j.steps.length - 1;
  const bands = bandsOf(j)
    .map((b) => {
      const tokens = j.steps
        .slice(b.from, b.to + 1)
        .map((s, k) => {
          const i = b.from + k;
          const classes = ['token', i === last ? 'is-last' : '', s.pivot ? 'is-pivot' : '', j.pending !== null && i >= j.pending ? 'is-pending' : ''].filter(Boolean).join(' ');
          const sub = s.pivot ? `${s.pivot.before} → ${s.pivot.after}` : s.label;
          const tip = s.pivot ? ` data-tip="${escapeHtml(pivotTip(s.chord, s.pivot.before, s.pivot.after))}"` : '';
          return `<li class="${classes}"${tip}><span class="token-name">${escapeHtml(nameOf(s.chord))}</span><span class="token-sub">${escapeHtml(sub)}</span></li>`;
        })
        .join('');
      return `<li class="band${b.key === j.key ? ' is-current' : ''}"><span class="band-name">${escapeHtml(keyName(b.key))}</span><ol class="band-tokens">${tokens}</ol></li>`;
    })
    .join('');
  const leaning = j.leaning !== null ? `<li class="band band--leaning"><span class="band-name">vers ${escapeHtml(keyName(j.leaning))} ?</span></li>` : '';
  root.innerHTML = `<ol class="ribbon-bands">${bands}${leaning}</ol>`;
  root.scrollLeft = root.scrollWidth;
}
```

- [ ] **Étape 2 : brancher** — dans `main.ts`, importer `import { renderRibbon } from './ui/ribbon';` et, dans `render()`, après `map.render(...)` : `renderRibbon(els.ribbon, j);`.

- [ ] **Étape 3 : styles** — ajouter à `viz.css` :

```css
/* Ruban */
.ribbon {
  overflow-x: auto;
  padding: var(--space-2) 0 var(--space-3);
  scrollbar-width: thin;
}
.ribbon-empty {
  margin: 0;
  color: var(--ink-3);
  font-size: var(--text-sm);
  text-align: center;
}
.ribbon-bands,
.band-tokens {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.ribbon-bands {
  width: max-content;
  align-items: stretch;
}
.band {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2);
  border-radius: var(--radius);
  background: var(--surface-sunk);
}
.band.is-current {
  background: var(--accent-soft);
}
.band--leaning {
  background: none;
  border: 1px dashed var(--accent);
  align-content: center;
}
.band-name {
  font-size: var(--text-xs);
  color: var(--ink-2);
}
.token {
  display: grid;
  justify-items: center;
  min-width: 3.5rem;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  background: var(--surface);
}
.token-name {
  font-weight: 700;
  color: var(--ink);
}
.token-sub {
  font-size: var(--text-xs);
  color: var(--ink-3);
}
.token.is-last {
  border: 2px solid var(--accent);
}
.token.is-pending {
  border-style: dashed;
}
.token.is-pivot {
  margin-left: calc(-1 * var(--space-4));
  box-shadow: 0 0 0 3px var(--surface-sunk);
}
```

- [ ] **Étape 4 : vérifier dans le navigateur** — jouer Do, La m, Ré, Sol, Si m : deux bandes « Do majeur » | « Sol majeur », Ré en tête de la seconde, à cheval, sous-titre « V/V → V » ; pendant Do, Ré, Sol : jetons Ré et Sol en pointillés, bande « vers Sol majeur ? » à la fin. Annuler retire le dernier jeton. À 375 px (`resize_window` preset mobile), le ruban défile et montre le dernier accord.

- [ ] **Étape 5 : committer**

```bash
npm test && npm run typecheck
git add viz/chemin-des-accords
git commit -m "feat(chemin-des-accords): le ruban, en bandes de tonalité, avec le pivot

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 8 : écouter le chemin

**Fichiers :**
- Modifier : `viz/chemin-des-accords/main.ts`

**Interfaces :** consomme `render(n)`, `sound(c)` (tâche 6).

- [ ] **Étape 1 : la lecture** — ajouter dans `main.ts` :

```ts
/* Écouter : rejoue le chemin pas à pas ; la carte rebascule à chaque modulation. */
let playing: number | null = null;
const STEP_MS = 900;

function stopListening() {
  if (playing !== null) clearTimeout(playing);
  playing = null;
  els.listen.textContent = '▶ Écouter';
  render();
}

function listen() {
  const { path } = store.get();
  if (!path.length) return;
  lastVoicing = null;
  els.listen.textContent = '■ Arrêter';
  // La rotation de l'anneau n'est pas remise à zéro : `ringRotation` le ramène vers la maison par le plus court chemin.
  const step = (i: number) => {
    if (i > path.length) return stopListening();
    render(i);
    sound(path[i - 1]!);
    playing = window.setTimeout(() => step(i + 1), STEP_MS);
  };
  step(1);
}

els.listen.addEventListener('click', () => (playing !== null ? stopListening() : listen()));
```

Et au début de `pick()` comme des gestionnaires `undo`, `restart`, `home` : `if (playing !== null) stopListening();`. (Déclarer `playing` et `stopListening` avant `pick` dans le fichier, ou s'appuyer sur le hissage des fonctions : `let playing` doit être déclaré au-dessus de tout code exécuté au chargement qui le lit.)

- [ ] **Étape 2 : vérifier dans le navigateur** — chemin Do, La m, Ré, Sol, Si m, *Écouter* : on entend cinq accords, la carte revient en Do puis bascule en Sol au cinquième, le bouton redevient « ▶ Écouter » à la fin ; toucher un accord pendant l'écoute l'arrête.

- [ ] **Étape 3 : committer**

```bash
npm test && npm run typecheck
git add viz/chemin-des-accords/main.ts
git commit -m "feat(chemin-des-accords): écouter le chemin, la carte rebascule en route

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 9 : légendes et bulles

**Fichiers :**
- Créer : `viz/chemin-des-accords/ui/tip.ts`
- Modifier : `viz/chemin-des-accords/main.ts`, `viz/chemin-des-accords/index.html`, `viz/chemin-des-accords/viz.css`

**Interfaces :**
- Consomme : `noteFor`, `type NoteKind`, `RING_TIP` (tâche 4).
- Produit : `export function mountTips(root: HTMLElement): void` (toute balise `[data-tip]` sous `root` a sa bulle).

- [ ] **Étape 1 : `ui/tip.ts`**

```ts
/**
 * Petites bulles : au survol (souris), au toucher long (doigt), ou par un bouton « ? » (`.tip-q[data-tip]`).
 * Une seule à la fois, jamais bloquante ; un toucher long n'ajoute pas l'accord (le clic qui suit est avalé).
 */
const LONG_PRESS_MS = 500;

export function mountTips(root: HTMLElement) {
  const bubble = document.createElement('div');
  bubble.className = 'tip';
  bubble.setAttribute('role', 'tooltip');
  bubble.hidden = true;
  root.appendChild(bubble);
  let timer = 0;
  let swallowClick = false;

  const show = (target: Element) => {
    const text = (target as HTMLElement).dataset.tip;
    if (!text) return;
    bubble.textContent = text;
    bubble.hidden = false;
    const r = target.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2 - box.left, 120), box.width - 120);
    bubble.style.left = `${x}px`;
    bubble.style.top = `${Math.max(r.top - box.top - 8, 0)}px`;
  };
  const hide = () => {
    bubble.hidden = true;
  };
  const tipOf = (e: Event) => (e.target as Element).closest('[data-tip]');

  root.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const t = tipOf(e);
    if (t && !t.classList.contains('tip-q')) show(t);
  });
  root.addEventListener('pointerout', (e) => {
    if (e.pointerType === 'mouse') hide();
  });
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const t = tipOf(e);
    if (!t) return;
    timer = window.setTimeout(() => {
      show(t);
      swallowClick = true;
    }, LONG_PRESS_MS);
  });
  const cancel = () => clearTimeout(timer);
  root.addEventListener('pointerup', cancel);
  root.addEventListener('pointercancel', cancel);
  root.addEventListener('scroll', hide, true);
  root.addEventListener(
    'click',
    (e) => {
      const q = (e.target as Element).closest('.tip-q');
      if (q) {
        e.preventDefault();
        if (bubble.hidden || bubble.textContent !== (q as HTMLElement).dataset.tip) show(q);
        else hide();
        return;
      }
      if (swallowClick) {
        e.stopPropagation();
        e.preventDefault();
        swallowClick = false;
        return;
      }
      hide();
    },
    true,
  );
  root.addEventListener('contextmenu', (e) => {
    if (tipOf(e)) e.preventDefault();
  });
}
```

- [ ] **Étape 2 : les « ? » dans la page** — dans `index.html`, dans `#stage` juste après le `<svg>` : `<button class="tip-q tip-q--ring" type="button" aria-label="Que montre l’anneau ?" data-tip="">?</button>` ; et avant `<div class="ribbon"…>` : `<p class="ribbon-head">Ta progression <button class="tip-q" type="button" aria-label="Comment lire le ruban ?" data-tip="">?</button></p>`. Dans `main.ts`, remplir leurs `data-tip` au démarrage avec `RING_TIP` et `RIBBON_TIP`, puis `mountTips(document.querySelector('.viz-stage') as HTMLElement);`.

- [ ] **Étape 3 : les légendes** — dans `main.ts` :

```ts
import { noteFor, RIBBON_TIP, RING_TIP, type NoteKind } from './domain/notes';
import { mountTips } from './ui/tip';

/** Légendes d'apprentissage déjà vues pendant cette visite. */
const seen = new Set<NoteKind>();
```

Dans `render(n)`, après `renderPanel(...)` : seulement si `n === store.get().path.length` (pas pendant l'écoute) :

```ts
const note = noteFor(j, { share: lastShare, satellites: cands.filter((c) => c.satellite).length, seen });
els.note.textContent = note?.text ?? '';
if (note?.once) seen.add(note.kind);
```

Pendant l'écoute (`n < path.length`), vider `els.note`. Retirer le `void lastShare;` éventuel de la tâche 6.

- [ ] **Étape 4 : styles**

```css
.tip {
  position: absolute;
  z-index: 5;
  transform: translate(-50%, -100%);
  max-width: min(18rem, calc(100vw - 2rem));
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  background: var(--ink);
  color: var(--page);
  font-size: var(--text-xs);
  line-height: 1.4;
  box-shadow: var(--shadow-float);
  pointer-events: none;
}
.viz-stage {
  position: relative;
}
.tip-q {
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 1px solid var(--rule-strong);
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink-3);
  font: 700 var(--text-xs) var(--font-ui);
  cursor: help;
}
.tip-q--ring {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
}
.ribbon-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-xs);
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
```

- [ ] **Étape 5 : vérifier dans le navigateur** — au chargement : « Touche un accord pour commencer… » ; Do → légende des halos ; deuxième visite du même cas sans recharger : plus de légende des halos ; Do, Ré → légende du frôlement ; Do, Si♭, Do, Si♭ → légende du rock ; survol d'un halo → bulle « 35 % des chansons… » ; « ? » de l'anneau → bulle ; en mobile (preset), toucher long sur un accord → bulle, sans ajouter l'accord au ruban.

- [ ] **Étape 6 : committer**

```bash
npm test && npm run typecheck
git add viz/chemin-des-accords
git commit -m "feat(chemin-des-accords): légendes au fil du jeu et petites bulles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 10 : textes, image d'aperçu, vérification complète

**Fichiers :**
- Modifier : `viz/chemin-des-accords/index.html` (sections de notes), `viz/chemin-des-accords/README.md`, `docs/chantiers/chemin-des-accords.md`, `docs/chantiers/README.md`
- Remplacer : `viz/chemin-des-accords/og/build-og.ts`

- [ ] **Étape 1 : les quatre sections** de `index.html` (remplacer les « À écrire ») :

```html
          <section id="lire">
            <h2>Comment lire</h2>
            <p>Au centre, la maison : l’accord de la tonalité où tu es (I). Autour, les six autres accords de la gamme, rangés en trois zones : le <strong>repos</strong> (à droite), le <strong>départ</strong> (à gauche), la <strong>tension</strong> (en haut). Tout autour, l’anneau des douze tonalités, rangées par quintes ; celle où tu es est en haut, en couleur, et une flèche la relie à la maison.</p>
            <p>Touche un accord : tu l’entends, il s’ajoute à ta progression. Les <strong>halos</strong> montrent alors les suites possibles, plus ou moins grands selon la part des chansons qui font ce pas. Les <strong>flèches</strong>, elles, montrent le chemin déjà fait ; elles pâlissent avec le temps. En pointillés, des accords hors de la gamme : des couleurs empruntées, ou des portes vers une autre tonalité.</p>
          </section>
          <section id="methode">
            <h2>La méthode</h2>
            <p>Un accord hors de la tonalité la <strong>frôle</strong> : Ré, en Do majeur, tire vers Sol. On ne sait pas encore si l’on change de tonalité ; c’est le premier accord qui n’appartient qu’à l’une des deux qui tranche. Si m, qui n’existe qu’en Sol, confirme : on a modulé, et l’accord qui avait frôlé devient le pivot (V/V en Do, V en Sol). Fa, qui n’existe qu’en Do, ramène : c’était un détour. Les accords empruntés au mineur (Fa m, Si♭, La♭ en Do) sont des couleurs : ils ne font pas changer de tonalité, pas plus qu’une dominante qui pointe vers un accord mineur (Mi vers La m).</p>
            <p>Les parts des halos : parmi les morceaux qui jouent l’accord du moment, la part de ceux qui le font suivre de chaque accord, lu en degrés de la tonalité du moment.</p>
          </section>
          <section id="sources">
            <h2>D’où viennent les chiffres</h2>
            <p>Les comptes de « <a href="%BASE_URL%viz/progression-jouee/">Ta progression a déjà été jouée</a> » : 680 000 tablatures du corpus Chordonomicon, ramenées en degrés après estimation de leur tonalité. Le reste est de la théorie, expliquée ci-dessus.</p>
          </section>
          <section id="limites">
            <h2>Ce que ça ne dit pas</h2>
            <p>Seulement les tonalités majeures et les accords de trois notes : les morceaux mineurs sont comptés dans leur relatif majeur, les septièmes sont repliées. Les parts ne regardent que l’accord d’avant, pas toute la phrase. La règle « frôler puis confirmer » est une simplification de ce que fait l’oreille : un musicien entendra parfois une modulation là où la page voit un détour, et l’inverse.</p>
          </section>
```

- [ ] **Étape 2 : l'image d'aperçu** — remplacer `og/build-og.ts` :

```ts
/**
 * Image d'aperçu des liens (1200×630) : le cercle en Sol majeur, dans son anneau, après Do – La m – Ré – Sol – Si m.
 *
 *   npm run og -- chemin-des-accords
 */
import { Path2D } from '@napi-rs/canvas';
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { diatonicChords, fifthsIndex, nameOf } from '../../suis-les-fleches/domain/harmony';
import { arrowPath, type Fn } from '../../suis-les-fleches/domain/layout';
import { CENTER, DISK, diatonicPoint, KEY_RING, TONIC_DISK } from '../domain/geometry';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d');
  const pad = 72;

  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('MUSIQUE · HARMONIE · APPRENDRE', pad, 140);
  ctx.fillStyle = t.ink!;
  ctx.font = `300 68px ${OG_FONTS.display}`;
  ctx.fillText('Le chemin', pad, 220);
  ctx.fillText('des accords', pad, 292);
  ctx.fillStyle = t['ink-2']!;
  ctx.font = `300 30px ${OG_FONTS.display}`;
  ['Où tu es, où tu peux aller,', 'd’où tu viens.'].forEach((line, i) => ctx.fillText(line, pad, 360 + i * 42));
  ctx.fillStyle = t.accent!;
  ctx.font = `700 24px ${OG_FONTS.ui}`;
  ctx.fillText('Do – La m – Ré – Sol – Si m', pad, 480);
  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 22px ${OG_FONTS.ui}`;
  ctx.fillText('de Do majeur à Sol majeur', pad, 514);

  // La carte, à droite : cadre de 1000 unités ramené à 580 px.
  const k = 0.58;
  const ox = OG_WIDTH - 1000 * k - 30;
  const oy = (OG_HEIGHT - 1000 * k) / 2;
  const X = (p: { x: number; y: number }) => ({ x: ox + p.x * k, y: oy + p.y * k });
  const key = 7;
  const fill: Record<Fn, string> = { repos: t['seq-1']!, depart: t['seq-3']!, tension: t['seq-5']! };

  // L'anneau, tourné pour mettre Sol en haut.
  ctx.textAlign = 'center';
  ctx.font = `400 ${Math.round(26 * k)}px ${OG_FONTS.ui}`;
  for (let i = 0; i < 12; i++) {
    const tonic = (i * 7) % 12;
    const a = ((-90 + 30 * (fifthsIndex(tonic) - fifthsIndex(key))) * Math.PI) / 180;
    const p = X({ x: CENTER + KEY_RING * Math.cos(a), y: CENTER + KEY_RING * Math.sin(a) });
    if (tonic === key || tonic === 0) {
      ctx.strokeStyle = tonic === key ? t.accent! : t['ink-3']!;
      ctx.setLineDash(tonic === key ? [] : [4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 30 * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = tonic === key ? t.ink! : t['ink-3']!;
    ctx.fillText(nameOf({ root: tonic, cls: 'maj' }), p.x, p.y + 6);
  }

  // Le chemin Ré → Sol → Si m.
  const pos = (label: string) => X(diatonicPoint(label));
  const rad = (label: string) => (label === 'I' ? TONIC_DISK : DISK) * k;
  const trail = ['V', 'I', 'iii'];
  trail.slice(1).forEach((b, i) => {
    const a = trail[i]!;
    const path = arrowPath(pos(a), pos(b), rad(a), 0.18, 0, rad(b));
    ctx.strokeStyle = i === trail.length - 2 ? t.accent! : t['ink-3']!;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke(new Path2D(path.d));
  });

  for (const { chord, role } of diatonicChords(key)) {
    const p = pos(role.label);
    const r = rad(role.label);
    ctx.fillStyle = fill[role.fn];
    ctx.strokeStyle = role.label === 'iii' ? t.accent! : t.surface!;
    ctx.lineWidth = role.label === 'iii' ? 5 : 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = role.fn === 'tension' ? t.surface! : t.ink!;
    ctx.font = `700 ${Math.round(r * 0.48)}px ${OG_FONTS.ui}`;
    ctx.fillText(nameOf(chord).replace('♯', '#'), p.x, p.y + r * 0.08);
    ctx.font = `400 ${Math.round(r * 0.32)}px ${OG_FONTS.ui}`;
    ctx.fillText(role.label, p.x, p.y + r * 0.5);
  }

  console.log(`écrit ${await writeOgImage('chemin-des-accords', canvas)}`);
}
```

Lancer `npm run og -- chemin-des-accords`, puis ouvrir l'image écrite (le chemin est affiché par la commande) avec l'outil de lecture d'images pour la regarder ; corriger les chevauchements éventuels (taille de police, `k`).

- [ ] **Étape 3 : vérification complète** — dans le navigateur, en clair puis en sombre (`resize_window` `colorScheme`), à 1280 px puis 375 px (preset mobile) : les trois questions se lisent sans faire défiler à 375 px (carte + légende), disques ≥ 44 px (mesurer par `javascript_tool` : `document.querySelector('.map-node-disc').getBoundingClientRect().width`), pas de défilement horizontal de la page, console sans erreur ; `?t=G&p=G,Em,A,D` ouvre bien un chemin en Sol ; `prefers-reduced-motion` : vérifier par `javascript_tool` que `getComputedStyle(document.querySelector('.map-node')).transitionDuration` vaut `0s` quand la règle s'applique (ou relire la règle CSS). Capture d'écran en preuve.

- [ ] **Étape 4 : README et fiche** — `viz/chemin-des-accords/README.md` : intention en une phrase, structure (les fichiers du tableau en tête de ce plan), dépendances (suis-les-fleches, progression-jouee, compose-ta-progression), liste « Avant de publier » sur le modèle de celui de suis-les-fleches. Dans la fiche : cocher les tâches faites, « Prochaine action : relecture de l'auteur sur http://localhost:5173/viz/chemin-des-accords/ ». Dans `docs/chantiers/README.md`, ligne 3i : « brouillon construit sur `feat/chemin-des-accords`, en attente de relecture ».

- [ ] **Étape 5 : committer**

```bash
npm test && npm run typecheck && npm run build
git add viz/chemin-des-accords docs/chantiers public/og/chemin-des-accords.png
git commit -m "feat(chemin-des-accords): textes, image d'aperçu, vérifiée en clair, sombre et mobile

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Ne pas pousser, ne pas passer `status` à `published` : la relecture de l'auteur vient d'abord.
