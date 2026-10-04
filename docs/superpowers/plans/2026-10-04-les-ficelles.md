# Les ficelles — plan d'implémentation

> **Pour les agents :** sous-compétence requise : superpowers:subagent-driven-development (recommandée) ou superpowers:executing-plans. Les étapes sont des cases à cocher (`- [ ]`).

**Objectif :** une page où l'on part d'une progression simple et où l'on applique, endroit par endroit, six procédés harmoniques de la chanson française des années 70 (les « ficelles »), en les voyant sur une portée à deux clés et en les entendant.

**Architecture :** tout le savoir est en calcul pur et testé. `viz/les-ficelles/domain/` contient la grille (accords symboliques), l'orthographe des notes, les six ficelles (un module chacune, même contrat), la pile des ficelles gardées et la géométrie de la portée. La réalisation à quatre voix va dans le socle (`src/shell/music/realisation.ts`). L'interface (`main.ts`, `ui/portee.ts`, `index.html`, `viz.css`) ne fait que dessiner ces résultats et brancher les gestes.

**Pile :** Vite + TypeScript strict, sans framework ; SVG écrit à la main ; Web Audio par le synthé du socle ; Vitest.

**Spécification :** [docs/chantiers/les-ficelles.md](../../chantiers/les-ficelles.md). La lire avant toute tâche.

## Contraintes globales

- Langue : interface, textes, commentaires et messages de commit **en français** ; tutoiement ; apostrophe typographique `’` dans les textes affichés.
- Vite + TypeScript strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), **sans framework**, **aucune dépendance nouvelle**.
- `src/shell/music/voicing.ts` et les autres visualisations **ne doivent pas être modifiés**.
- Une seule teinte vive : `var(--accent)` (et `var(--accent-soft)`) ; jetons de `src/shell/tokens.css` uniquement ; clair et sombre ; `prefers-reduced-motion` respecté.
- Mobile d'abord : à 375 px, cibles tactiles ≥ 44 px, aucun défilement horizontal de la page ; la portée passe à deux mesures par ligne sous 520 px.
- Rien ne joue sans geste de l'utilisateur.
- La ficelle choisie et l'aperçu n'entrent pas dans l'URL ; seuls `t` (tonalité), `p` (départ) et `f` (pile) y sont.
- Chemins publics via `assetUrl()` / `%BASE_URL%` (le site est servi sous `/atlas/`).
- `npm test` et `npm run typecheck` au vert avant chaque commit. Messages de commit terminés exactement par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Branche `feat/les-ficelles`. Ne rien pousser. La page reste en brouillon (`status: 'draft'`).
- Cocher la tâche dans la fiche `docs/chantiers/les-ficelles.md` dans le même commit que la tâche.

## Rappels sur le code existant

- `src/shell/music/chords.ts` : `parseChord(symbol): { root, quality, bass? } | null` (lit « Am », « Fmaj7 », « C/B », « B♭ », « F#m » ; `quality` parmi `maj`, `min`, `dom7`, `maj7`, `min7`, `dim`, `hdim`, `sus`, `aug`, `other`) ; `parsePitch(name)`.
- `src/shell/music/synth.ts` : `new Synth()`, `play(freqs, seconds)`, `stop()`.
- `src/shell/music/player.ts` : `new Player(synth, onStep: (step: Step | null, index: number) => void)` ; `play(steps: Step[])`, `stop()`, `playing` ; `Step = { midis: number[]; seconds: number; tag?: unknown }`. `onStep(null, -1)` est appelé à la fin et à l'arrêt.
- `src/shell/store.ts` : `createStore<S>(initial)` → `get()`, `set(patch)`, `subscribe(listener)`.
- `src/shell/html.ts` : `escapeHtml(s)`.
- `src/shell/shell.ts` : `mountShell({ currentSlug })`.
- `viz/compose-ta-progression/state.ts` : `KEY_NAMES` (`['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']`), déjà importé par d'autres pages.
- `tools/og.ts` : `OG_FONTS`, `OG_WIDTH`, `OG_HEIGHT`, `createOgCanvas`, `readLightTokens`, `registerSiteFonts`, `writeOgImage` (voir `viz/_template/og/build-og.ts`).
- Classes CSS du socle : `.button`, `.button--primary`, `.field`, `.note`, `.viz-panel`, `.viz-stage`, `.prose`.
- Les tests sont dans le même dossier que le code (`*.test.ts`), avec `import { describe, expect, it } from 'vitest'`.

## Carte des fichiers

| Fichier | Rôle |
| --- | --- |
| `viz/les-ficelles/domain/grille.ts` | Accords symboliques : types, degrés, lecture des saisies, symboles d'URL, cliché |
| `viz/les-ficelles/domain/orthographe.ts` | Écriture des notes (lettre + altération), octave, rang sur la portée, noms français |
| `src/shell/music/realisation.ts` | Grille → quatre voix MIDI (enchaînement le plus court, sans parallèles) |
| `viz/les-ficelles/domain/ficelles/type.ts` | Contrat commun des ficelles |
| `viz/les-ficelles/domain/ficelles/{descend,emprunt,dominante,suspendu,enrichis,montee}.ts` | Une ficelle chacun |
| `viz/les-ficelles/domain/ficelles/index.ts` | Le registre des six |
| `viz/les-ficelles/domain/pile.ts` | Rejouer et retirer les ficelles gardées |
| `viz/les-ficelles/state.ts` | État ↔ URL |
| `viz/les-ficelles/domain/portee.ts` | Géométrie pure de la portée |
| `viz/les-ficelles/ui/portee.ts` | Dessin SVG de la portée |
| `viz/les-ficelles/data/signatures.ts` | Titres signés (vérifiés à l'oreille par l'auteur) |
| `viz/les-ficelles/main.ts`, `index.html`, `viz.css` | La page |
| `viz/les-ficelles/og/build-og.ts` | Image d'aperçu |

---

### Tâche 1 : la visualisation en brouillon et la grille

**Fichiers :**
- Créer (par la commande) : `viz/les-ficelles/` et l'entrée de catalogue dans `src/shell/site.ts`
- Créer : `viz/les-ficelles/domain/grille.ts`, `viz/les-ficelles/domain/grille.test.ts`
- Modifier : `docs/chantiers/les-ficelles.md` (cocher)

**Interfaces produites :**
- `type Couleur = 'maj' | 'min' | 'dim' | '7' | '7M' | 'm7'`
- `interface Accord { root: number; couleur: Couleur; bass?: number; key: number }`, `type Grille = readonly Accord[]`
- `mod12(n)`, `INTERVALLES`, `notesDe(a): number[]`, `basseDe(a): number`, `pas(a): number`, `avecBasse(a, pc): Accord`, `transposer(a, n): Accord`, `degre(a): string | null`, `accordDuDegre(label, key): Accord`, `LABELS`, `egaux(a, b)`, `cliche(key): Accord[]`, `MIN_DEPART = 2`, `MAX_DEPART = 8`, `lireAccord(s, key): Accord | null`, `symbole(a): string`, `decouper(texte): string[]`

- [ ] **Étape 1 : créer la visualisation.**

```bash
npm run new:viz -- les-ficelles --title "Les ficelles" --summary "Six procédés de la chanson française des années 70 pour transformer une progression simple : à voir sur la portée, à écouter, à garder ou non." --tags "Musique,Harmonie,Apprendre"
```

Attendu : `viz/les-ficelles/` créé, entrée `status: 'draft'` ajoutée dans `src/shell/site.ts`.

- [ ] **Étape 2 : écrire les tests qui échouent** dans `viz/les-ficelles/domain/grille.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { accordDuDegre, avecBasse, basseDe, cliche, decouper, degre, egaux, lireAccord, notesDe, symbole, transposer } from './grille';

const C = 0;
const lu = (s: string, key = C) => lireAccord(s, key)!;

describe('lireAccord', () => {
  it('lit les noms français', () => {
    expect(lireAccord('Lam', C)).toEqual({ root: 9, couleur: 'min', key: 0 });
    expect(lireAccord('La m', C)).toEqual({ root: 9, couleur: 'min', key: 0 });
    expect(lireAccord('Fa7M', C)).toEqual({ root: 5, couleur: '7M', key: 0 });
    expect(lireAccord('Sol7', C)).toEqual({ root: 7, couleur: '7', key: 0 });
    expect(lireAccord('Si♭', C)).toEqual({ root: 10, couleur: 'maj', key: 0 });
    expect(lireAccord('Sib', C)).toEqual({ root: 10, couleur: 'maj', key: 0 });
    expect(lireAccord('Si°', C)).toEqual({ root: 11, couleur: 'dim', key: 0 });
    expect(lireAccord('Do/Si', C)).toEqual({ root: 0, couleur: 'maj', key: 0, bass: 11 });
    expect(lireAccord('ré m7', 2)).toEqual({ root: 2, couleur: 'm7', key: 2 });
  });

  it('lit l’écriture anglaise', () => {
    expect(lireAccord('Am', C)).toEqual({ root: 9, couleur: 'min', key: 0 });
    expect(lireAccord('Fmaj7', C)).toEqual({ root: 5, couleur: '7M', key: 0 });
    expect(lireAccord('C/B', C)).toEqual({ root: 0, couleur: 'maj', key: 0, bass: 11 });
    expect(lireAccord('F#m', C)).toEqual({ root: 6, couleur: 'min', key: 0 });
  });

  it('refuse ce que la page ne sait pas jouer', () => {
    for (const s of ['Csus4', 'Caug', 'Bm7b5', 'Xyz', '']) expect(lireAccord(s, C)).toBeNull();
  });
});

describe('symbole', () => {
  it('fait l’aller-retour avec lireAccord', () => {
    for (const s of ['C', 'Am', 'Fmaj7', 'G7', 'Bdim', 'C/B', 'Am7', 'F#m', 'Bb', 'Am/G']) expect(symbole(lu(s))).toBe(s);
  });
});

describe('decouper', () => {
  it('recolle les suffixes isolés', () => {
    expect(decouper('Do La m Fa7M, Sol')).toEqual(['Do', 'Lam', 'Fa7M', 'Sol']);
    expect(decouper('Do – Lam – Fa – Sol')).toEqual(['Do', 'Lam', 'Fa', 'Sol']);
    expect(decouper('  ')).toEqual([]);
  });
});

describe('degré', () => {
  it('lit le degré dans la tonalité de l’accord, septièmes comprises', () => {
    expect(degre(lu('Sol7'))).toBe('V');
    expect(degre(lu('Fa7M'))).toBe('IV');
    expect(degre(lu('La m7'))).toBe('vi');
    expect(degre(lu('Si°'))).toBe('vii°');
    expect(degre(lu('Mi'))).toBeNull(); // V/vi : hors de la gamme
    expect(degre(lu('Fa m'))).toBeNull(); // emprunt
  });

  it('donne l’accord d’un degré et le cliché dans toute tonalité', () => {
    expect(accordDuDegre('vi', C)).toEqual({ root: 9, couleur: 'min', key: 0 });
    expect(cliche(7).map((a) => a.root)).toEqual([7, 4, 0, 2]);
    expect(cliche(7).every((a) => a.key === 7)).toBe(true);
  });
});

describe('basse et transposition', () => {
  it('n’écrit pas de basse quand c’est la fondamentale', () => {
    const doSi = lu('Do/Si');
    expect(basseDe(doSi)).toBe(11);
    expect('bass' in avecBasse(doSi, 0)).toBe(false);
    expect(avecBasse(lu('Do'), 11)).toEqual(doSi);
  });

  it('transpose fondamentale, basse et tonalité', () => {
    expect(transposer(lu('Do/Si'), 2)).toEqual({ root: 2, couleur: 'maj', key: 2, bass: 1 });
  });

  it('donne les notes, fondamentale d’abord', () => {
    expect(notesDe(lu('Mi7'))).toEqual([4, 8, 11, 2]);
    expect(notesDe(lu('Fa m'))).toEqual([5, 8, 0]);
  });

  it('compare deux accords', () => {
    expect(egaux(lu('Do/Si'), lu('C/B'))).toBe(true);
    expect(egaux(lu('Do'), lu('Do/Si'))).toBe(false);
  });
});
```

- [ ] **Étape 3 : lancer les tests pour les voir échouer.**

Commande : `npx vitest run viz/les-ficelles/domain/grille.test.ts`
Attendu : échec (« Failed to resolve import "./grille" »).

- [ ] **Étape 4 : écrire `viz/les-ficelles/domain/grille.ts`.**

```ts
/**
 * La grille : la progression en accords symboliques (fondamentale, couleur, basse), chacun lu dans sa tonalité.
 * C'est la source de vérité de la page : les ficelles la transforment, la réalisation en tire les voix. Tout est pur.
 */
import { parseChord, type Quality } from '@shell/music/chords';
import { KEY_NAMES } from '../../compose-ta-progression/state';

export type Couleur = 'maj' | 'min' | 'dim' | '7' | '7M' | 'm7';

export interface Accord {
  /** Classe de hauteur de la fondamentale (0 = do). */
  root: number;
  couleur: Couleur;
  /** La basse quand ce n'est pas la fondamentale (« Do/Si », « Fa/Sol »). */
  bass?: number;
  /** La tonique (majeure) dans laquelle l'accord se lit. */
  key: number;
}

export type Grille = readonly Accord[];

export const mod12 = (n: number) => ((n % 12) + 12) % 12;

export const INTERVALLES: Readonly<Record<Couleur, readonly number[]>> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  '7': [0, 4, 7, 10],
  '7M': [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
};

/** Les classes de hauteur de l'accord : fondamentale, tierce, quinte (et septième). */
export const notesDe = (a: Accord): number[] => INTERVALLES[a.couleur].map((i) => mod12(a.root + i));
export const basseDe = (a: Accord): number => a.bass ?? a.root;
/** Écart de la fondamentale à la tonique, de 0 à 11. */
export const pas = (a: Accord): number => mod12(a.root - a.key);

/** Le même accord sur une autre basse (sans basse écrite si c'est la fondamentale). */
export function avecBasse(a: Accord, basse: number): Accord {
  const b = mod12(basse);
  const sans: Accord = { root: a.root, couleur: a.couleur, key: a.key };
  return b === a.root ? sans : { ...sans, bass: b };
}

export function transposer(a: Accord, n: number): Accord {
  const t: Accord = { root: mod12(a.root + n), couleur: a.couleur, key: mod12(a.key + n) };
  return a.bass === undefined ? t : { ...t, bass: mod12(a.bass + n) };
}

type Triade = 'maj' | 'min' | 'dim';
const DEGRES: ReadonlyMap<number, { label: string; triade: Triade }> = new Map([
  [0, { label: 'I', triade: 'maj' }],
  [2, { label: 'ii', triade: 'min' }],
  [4, { label: 'iii', triade: 'min' }],
  [5, { label: 'IV', triade: 'maj' }],
  [7, { label: 'V', triade: 'maj' }],
  [9, { label: 'vi', triade: 'min' }],
  [11, { label: 'vii°', triade: 'dim' }],
]);
export const LABELS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const;
const triadeDe = (c: Couleur): Triade => (c === 'min' || c === 'm7' ? 'min' : c === 'dim' ? 'dim' : 'maj');

/** Le degré de l'accord dans sa tonalité (« IV », « vi »), ou `null` hors de la gamme. Une septième compte avec sa triade (Sol7 est V). */
export function degre(a: Accord): string | null {
  const d = DEGRES.get(pas(a));
  return d && d.triade === triadeDe(a.couleur) ? d.label : null;
}

/** L'accord d'un degré de la gamme (« vi » en Do : La m). */
export function accordDuDegre(label: string, key: number): Accord {
  for (const [p, d] of DEGRES) if (d.label === label) return { root: mod12(key + p), couleur: d.triade, key: mod12(key) };
  throw new Error(`Degré inconnu : ${label}`);
}

export const egaux = (a: Accord, b: Accord) => a.root === b.root && a.couleur === b.couleur && basseDe(a) === basseDe(b);

/** Le cliché de départ, dans n'importe quelle tonalité : I – vi – IV – V. */
export const cliche = (key: number): Accord[] => ['I', 'vi', 'IV', 'V'].map((l) => accordDuDegre(l, key));

export const MIN_DEPART = 2;
export const MAX_DEPART = 8;

const FR_EN: Readonly<Record<string, string>> = { do: 'C', ré: 'D', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };
const NOM_FR = /(^|\/)(do|ré|re|mi|fa|sol|la|si)/gi;
const COULEUR_DE: Partial<Record<Quality, Couleur>> = { maj: 'maj', min: 'min', dim: 'dim', dom7: '7', maj7: '7M', min7: 'm7' };

/** Lit « Lam », « La m », « Fa7M », « Do/Si », « Si♭ », ou l'écriture anglaise (« Am », « Fmaj7 », « C/B »). */
export function lireAccord(s: string, key: number): Accord | null {
  const t = s
    .trim()
    .replace(/\s+/g, '')
    .replace(NOM_FR, (_m: string, avant: string, nom: string) => avant + FR_EN[nom.toLowerCase()]!)
    .replace('7M', 'maj7');
  const c = parseChord(t);
  if (!c) return null;
  const couleur = COULEUR_DE[c.quality];
  if (!couleur) return null;
  const a: Accord = { root: c.root, couleur, key: mod12(key) };
  return c.bass === undefined ? a : avecBasse(a, c.bass);
}

const SUFFIXE_EN: Readonly<Record<Couleur, string>> = { maj: '', min: 'm', dim: 'dim', '7': '7', '7M': 'maj7', m7: 'm7' };

/** Le symbole anglais, pour l'URL : « Am », « Fmaj7 », « C/B ». */
export const symbole = (a: Accord): string =>
  `${KEY_NAMES[a.root]}${SUFFIXE_EN[a.couleur]}${a.bass === undefined ? '' : `/${KEY_NAMES[a.bass]}`}`;

/** Découpe une saisie (« Do La m Fa7M, Sol ») en accords : un suffixe isolé (« m », « m7 », « ° ») se recolle au nom d'avant. */
export function decouper(texte: string): string[] {
  const out: string[] = [];
  for (const t of texte.split(/[\s,;–—]+/)) {
    if (!t || t === '-') continue;
    if (out.length && /^(m|m7|7|7M|maj7|°|dim)$/.test(t)) out[out.length - 1] += t;
    else out.push(t);
  }
  return out;
}
```

- [ ] **Étape 5 : lancer les tests.**

Commande : `npx vitest run viz/les-ficelles/domain/grille.test.ts`
Attendu : tous verts. Si `lireAccord('Si°')` échoue, vérifier que `parseChord('B°')` rend `dim` ; si `Bb` revient en `A#`, vérifier `KEY_NAMES`.

- [ ] **Étape 6 : vérifier l'ensemble et commiter.**

Commandes : `npm run typecheck` puis `npm test` (verts). Cocher « `npm run new:viz -- les-ficelles` (brouillon) » et « Grille… » (partie grille) dans la fiche.

```bash
git add viz/les-ficelles src/shell/site.ts docs/chantiers/les-ficelles.md
git commit -m "feat(les-ficelles): brouillon et grille d’accords

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 2 : l'orthographe des notes

**Fichiers :**
- Créer : `viz/les-ficelles/domain/orthographe.ts`, `viz/les-ficelles/domain/orthographe.test.ts`

**Interfaces :**
- Consomme : `Accord`, `mod12`, `notesDe` (tâche 1).
- Produit : `interface NoteEcrite { lettre: number; alteration: number }` (lettre 0 = do … 6 = si ; altération −2 à 2) ; `interface NotePlacee extends NoteEcrite { octave: number }` ; `surLettre(pc, lettre)`, `dansLaTonalite(pc, key)`, `ecrireAccord(a): NoteEcrite[]`, `ecrireDans(pc, a): NoteEcrite`, `placer(midi, e): NotePlacee`, `rang(n): number`, `nomNote(e): string` (« la♭ »), `nomAccord(a): string` (« La m », « Do/Si »).

- [ ] **Étape 1 : tests qui échouent** dans `viz/les-ficelles/domain/orthographe.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { lireAccord } from './grille';
import { dansLaTonalite, ecrireAccord, ecrireDans, nomAccord, nomNote, placer, rang } from './orthographe';

const lu = (s: string, key = 0) => lireAccord(s, key)!;
const noms = (s: string, key = 0) => ecrireAccord(lu(s, key)).map(nomNote);

describe('écrire un accord', () => {
  it('suit les lettres de l’accord', () => {
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

  it('écrit une basse étrangère à l’accord dans la tonalité', () => {
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
  it('calcule l’octave d’après la lettre', () => {
    expect(placer(60, { lettre: 0, alteration: 0 })).toEqual({ lettre: 0, alteration: 0, octave: 4 });
    expect(placer(59, { lettre: 0, alteration: -1 }).octave).toBe(4); // do♭4 sonne si3
    expect(rang(placer(60, { lettre: 0, alteration: 0 }))).toBe(28);
    expect(rang(placer(68, { lettre: 5, alteration: -1 }))).toBe(33); // la♭4
  });
});
```

- [ ] **Étape 2 : lancer et voir échouer.** `npx vitest run viz/les-ficelles/domain/orthographe.test.ts` → échec (module introuvable).

- [ ] **Étape 3 : écrire `viz/les-ficelles/domain/orthographe.ts`.**

```ts
/**
 * L'orthographe : chaque note s'écrit sur une lettre (do, ré…) avec une altération, d'après la tonalité et l'accord.
 * Fa m s'écrit avec un la♭ (la tierce de fa est une sorte de la), Mi7 avec un sol♯. Indispensable pour lire la portée.
 */
import { mod12, notesDe, type Accord } from './grille';

export interface NoteEcrite {
  /** 0 = do, 1 = ré … 6 = si. */
  lettre: number;
  /** −2 (double bémol) à 2 (double dièse). */
  alteration: number;
}

export interface NotePlacee extends NoteEcrite {
  /** Octave scientifique : do4 est le do du milieu. */
  octave: number;
}

const NATURELS = [0, 2, 4, 5, 7, 9, 11];
const NOMS = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'];
const ALTERATIONS = ['♭♭', '♭', '', '♯', '♯♯'];
/**
 * Écart (0 à 11) → degré de la gamme et altération. Sert pour la tonique d'une tonalité (lue depuis do : ré♭, mi♭, fa♯,
 * la♭, si♭ comme les noms de tonalité du site) et pour un accord dans une tonalité (♭II, ♭III, ♯IV, ♭VI, ♭VII).
 */
const ECRITURE: readonly (readonly [number, number])[] = [
  [0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0],
];

const centre = (n: number) => {
  const m = mod12(n);
  return m > 6 ? m - 12 : m;
};

/** Écrit une classe de hauteur sur une lettre donnée (sol♯ plutôt que la♭ si la lettre est sol). */
export const surLettre = (pc: number, lettre: number): NoteEcrite => ({ lettre, alteration: centre(pc - NATURELS[lettre]!) });

/** Une classe de hauteur lue dans une tonalité majeure (♭ pour les degrés abaissés, ♯ pour le IV haussé). */
export function dansLaTonalite(pc: number, key: number): NoteEcrite {
  const [tonique] = ECRITURE[mod12(key)]!;
  const [degre] = ECRITURE[mod12(pc - key)]!;
  return surLettre(pc, (tonique + degre) % 7);
}

/** Les notes de l'accord : la fondamentale lue dans la tonalité, puis tierce, quinte, septième sur les lettres suivantes. */
export function ecrireAccord(a: Accord): NoteEcrite[] {
  const f = dansLaTonalite(a.root, a.key);
  return notesDe(a).map((pc, k) => surLettre(pc, (f.lettre + 2 * k) % 7));
}

/** Une hauteur (classe ou MIDI) dans un accord : comme note de l'accord si elle en est, sinon dans la tonalité (la basse de Fa/Sol). */
export function ecrireDans(pc: number, a: Accord): NoteEcrite {
  const k = notesDe(a).indexOf(mod12(pc));
  return k >= 0 ? ecrireAccord(a)[k]! : dansLaTonalite(mod12(pc), a.key);
}

/** L'octave d'une note MIDI écrite : celle de sa lettre (do♭4 sonne comme si3 mais s'écrit à l'octave 4). */
export function placer(midi: number, e: NoteEcrite): NotePlacee {
  return { ...e, octave: Math.floor((midi - e.alteration) / 12) - 1 };
}

/** Position diatonique (octave × 7 + lettre ; do4 = 28) : la hauteur sur la portée. */
export const rang = (n: NotePlacee): number => n.octave * 7 + n.lettre;

export const nomNote = (e: NoteEcrite): string => `${NOMS[e.lettre]}${ALTERATIONS[e.alteration + 2]}`;

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SUFFIXE: Readonly<Record<Accord['couleur'], string>> = { maj: '', min: ' m', dim: ' °', '7': '7', '7M': '7M', m7: ' m7' };

/** « Do », « La m », « Mi7 », « Fa7M », « La m7 », « Si ° », « Do/Si ». */
export function nomAccord(a: Accord): string {
  const basse = a.bass === undefined ? '' : `/${majuscule(nomNote(ecrireDans(a.bass, a)))}`;
  return `${majuscule(nomNote(dansLaTonalite(a.root, a.key)))}${SUFFIXE[a.couleur]}${basse}`;
}
```

- [ ] **Étape 4 : lancer les tests.** `npx vitest run viz/les-ficelles/domain/orthographe.test.ts` → verts.

- [ ] **Étape 5 : `npm run typecheck`, `npm test`, cocher « Grille, orthographe… » dans la fiche (la partie URL viendra en tâche 7 : écrire « (URL en tâche 7) » à côté), commiter.**

```bash
git add viz/les-ficelles/domain/orthographe.ts viz/les-ficelles/domain/orthographe.test.ts docs/chantiers/les-ficelles.md
git commit -m "feat(les-ficelles): orthographe des notes et noms d’accords

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 3 : la réalisation à quatre voix (socle)

**Fichiers :**
- Créer : `src/shell/music/realisation.ts`, `src/shell/music/realisation.test.ts`
- Modifier : `docs/chantiers/les-ficelles.md` (cocher ; noter dans « Décisions » que le socle gagne `realisation.ts`)

**Interfaces produites :**
- `interface AccordARealiser { notes: readonly number[]; basse: number }` (classes de hauteur, fondamentale d'abord)
- `type Voix = readonly [number, number, number, number]` (basse, ténor, alto, soprano, en MIDI)
- `BASSE_MIN = 36`, `BASSE_MAX = 55`, `HAUT_MIN = 53`, `HAUT_MAX = 79`, `ECART_MAIN = 12`, `DEPART: Voix = [48, 60, 64, 67]`
- `paralleles(avant: Voix, apres: Voix): [number, number][]`
- `realiser(accords: readonly AccordARealiser[], depart?: Voix): Voix[]`
- `bougent(avant: Voix, apres: Voix): boolean[]`

- [ ] **Étape 1 : tests qui échouent** dans `src/shell/music/realisation.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { BASSE_MAX, BASSE_MIN, ECART_MAIN, HAUT_MAX, HAUT_MIN, bougent, paralleles, realiser, type AccordARealiser, type Voix } from './realisation';

const M = (r: number, basse = r): AccordARealiser => ({ notes: [r, (r + 4) % 12, (r + 7) % 12], basse });
const m = (r: number, basse = r): AccordARealiser => ({ notes: [r, (r + 3) % 12, (r + 7) % 12], basse });
const D7 = (r: number): AccordARealiser => ({ notes: [r, (r + 4) % 12, (r + 7) % 12, (r + 10) % 12], basse: r });
const pc = (n: number) => ((n % 12) + 12) % 12;

const PROGRESSIONS: AccordARealiser[][] = [
  [M(0), m(9), M(5), M(7), M(0)],
  [M(0), M(0, 11), m(9), m(9, 7), M(5), m(5), M(5, 7), M(0)],
  [M(0), D7(4), m(9), D7(0), M(5), D7(2), M(7), M(0)],
  [M(0), M(5), M(7), D7(9), M(2), m(11), M(7), M(9)],
];

describe('realiser', () => {
  it('part de la position de do quand l’accord est do', () => {
    expect(realiser([M(0)])).toEqual([[48, 60, 64, 67]]);
  });

  it('tient les notes communes et bouge le moins possible', () => {
    const [, am] = realiser([M(0), m(9)]);
    expect(am).toEqual([45, 60, 64, 69]);
  });

  it('impose la basse, même étrangère à l’accord', () => {
    const v = realiser([M(0), M(5, 7)]); // Do, Fa/Sol
    expect(pc(v[1]![0])).toBe(7);
    expect(v[1]!.slice(1).map(pc).sort((a, b) => a - b)).toEqual([0, 5, 9]);
  });

  it('garde tierce et septième d’un accord de septième', () => {
    const [, g7] = realiser([M(0), D7(7)]);
    const haut = g7!.slice(1).map(pc);
    expect(haut).toContain(11);
    expect(haut).toContain(5);
  });

  it('respecte tessitures, ordre des voix et main', () => {
    for (const p of PROGRESSIONS)
      for (const v of realiser(p)) {
        expect(v[0]).toBeGreaterThanOrEqual(BASSE_MIN);
        expect(v[0]).toBeLessThanOrEqual(BASSE_MAX);
        expect(v[1]).toBeGreaterThanOrEqual(HAUT_MIN);
        expect(v[3]).toBeLessThanOrEqual(HAUT_MAX);
        expect(v[0] < v[1] && v[1] < v[2] && v[2] < v[3]).toBe(true);
        expect(v[3] - v[1]).toBeLessThanOrEqual(ECART_MAIN);
      }
  });

  it('évite les quintes et octaves parallèles', () => {
    for (const p of PROGRESSIONS) {
      const v = realiser(p);
      for (let i = 1; i < v.length; i++) expect(paralleles(v[i - 1]!, v[i]!)).toEqual([]);
    }
  });

  it('est déterministe', () => {
    expect(realiser(PROGRESSIONS[2]!)).toEqual(realiser(PROGRESSIONS[2]!));
  });
});

describe('paralleles', () => {
  it('voit les quintes parallèles et pas les mouvements contraires', () => {
    const a: Voix = [41, 60, 65, 69];
    expect(paralleles(a, [43, 62, 67, 71])).toEqual([[0, 1], [0, 2]]);
    expect(paralleles(a, [43, 59, 62, 67])).toEqual([]);
  });
});

describe('bougent', () => {
  it('dit quelles voix changent de note', () => {
    expect(bougent([48, 60, 64, 67], [47, 60, 64, 67])).toEqual([true, false, false, false]);
  });
});
```

- [ ] **Étape 2 : lancer et voir échouer.** `npx vitest run src/shell/music/realisation.test.ts` → échec (module introuvable).

- [ ] **Étape 3 : écrire `src/shell/music/realisation.ts`.**

```ts
/**
 * Réalisation à quatre voix (socle) : une basse imposée et trois voix au-dessus, jouables d'une main (dans une octave).
 * Pour chaque accord, on essaie toutes les dispositions possibles et on garde celle qui bouge le moins depuis la
 * précédente, sans quintes ni octaves parallèles (règles d'enchaînement classiques) : les notes communes restent en
 * place. Une légère attirance vers le milieu du clavier empêche les voix de dériver. Pur et déterministe.
 * (`voicing.ts` reste la version simple, en triades, des autres pages.)
 */
export interface AccordARealiser {
  /** Classes de hauteur, fondamentale d'abord : [f, tierce, quinte] ou [f, tierce, quinte, septième]. */
  notes: readonly number[];
  /** Classe de hauteur de la basse (pas forcément dans l'accord : Fa/Sol). */
  basse: number;
}

/** Basse, ténor, alto, soprano, en MIDI (60 = do4), du grave à l'aigu. */
export type Voix = readonly [number, number, number, number];

export const BASSE_MIN = 36; // do2
export const BASSE_MAX = 55; // sol3
export const HAUT_MIN = 53; // fa3
export const HAUT_MAX = 79; // sol5
/** Une main : les trois voix du haut tiennent dans une octave. */
export const ECART_MAIN = 12;
export const DEPART: Voix = [48, 60, 64, 67];
const PENALITE_PARALLELE = 100;
const CENTRE_SOPRANO = 72;
const ATTIRANCE = 0.1;

const pc = (n: number) => ((n % 12) + 12) % 12;

/** La basse la plus proche de la précédente, dans sa tessiture (à égalité, la plus grave). */
function placerBasse(classe: number, precedente: number): number {
  let best = -1;
  for (let m = BASSE_MIN; m <= BASSE_MAX; m++) {
    if (pc(m) !== pc(classe)) continue;
    if (best < 0 || Math.abs(m - precedente) < Math.abs(best - precedente)) best = m;
  }
  return best;
}

/** Les trois voix du haut couvrent l'accord : toutes ses notes (triade), ou tierce et septième plus la fondamentale ou la quinte. */
function couvre(notes: readonly number[], haut: readonly number[]): boolean {
  const classes = haut.map(pc);
  if (new Set(classes).size !== 3 || !classes.every((c) => notes.includes(c))) return false;
  return notes.length === 3 || (classes.includes(notes[1]!) && classes.includes(notes[3]!));
}

/** Les paires de voix (indices) qui font des quintes ou des octaves parallèles entre deux accords. */
export function paralleles(avant: Voix, apres: Voix): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++) {
      const di = apres[i]! - avant[i]!;
      const dj = apres[j]! - avant[j]!;
      if (di === 0 || di * dj <= 0) continue;
      const a = pc(avant[j]! - avant[i]!);
      const b = pc(apres[j]! - apres[i]!);
      if ((a === 7 && b === 7) || (a === 0 && b === 0)) out.push([i, j]);
    }
  return out;
}

function cout(avant: Voix, apres: Voix): number {
  const mouvement = Math.abs(apres[1] - avant[1]) + Math.abs(apres[2] - avant[2]) + Math.abs(apres[3] - avant[3]);
  return mouvement + PENALITE_PARALLELE * paralleles(avant, apres).length + ATTIRANCE * Math.abs(apres[3] - CENTRE_SOPRANO);
}

function disposer(a: AccordARealiser, avant: Voix): Voix {
  const basse = placerBasse(a.basse, avant[0]);
  let best: Voix | null = null;
  let bestCout = Infinity;
  for (let t = Math.max(HAUT_MIN, basse + 1); t <= HAUT_MAX; t++)
    for (let al = t + 1; al <= Math.min(HAUT_MAX, t + ECART_MAIN); al++)
      for (let s = al + 1; s <= Math.min(HAUT_MAX, t + ECART_MAIN); s++) {
        if (!couvre(a.notes, [t, al, s])) continue;
        const v: Voix = [basse, t, al, s];
        const c = cout(avant, v);
        if (c < bestCout) {
          best = v;
          bestCout = c;
        }
      }
  if (!best) throw new Error(`Aucune disposition pour [${a.notes.join(', ')}] sur ${a.basse}`);
  return best;
}

/** Les voix de toute la suite, chaque accord enchaîné au précédent (le premier à `depart`). */
export function realiser(accords: readonly AccordARealiser[], depart: Voix = DEPART): Voix[] {
  const out: Voix[] = [];
  let avant = depart;
  for (const a of accords) {
    avant = disposer(a, avant);
    out.push(avant);
  }
  return out;
}

/** Les voix qui changent de note entre deux accords (pour allumer ce qui bouge). */
export const bougent = (avant: Voix, apres: Voix): boolean[] => apres.map((n, k) => n !== avant[k]);
```

- [ ] **Étape 4 : lancer les tests.** `npx vitest run src/shell/music/realisation.test.ts` → verts. Si « évite les parallèles » échoue sur une progression, regarder les deux accords fautifs : une pénalité ne suffit que si une autre disposition existe ; ne pas affaiblir le test, corriger `cout` ou les bornes.

- [ ] **Étape 5 : `npm run typecheck`, `npm test`, cocher « Réalisation des voix dans le socle » et ajouter dans « Décisions » de la fiche : « Le socle gagne `src/shell/music/realisation.ts` (quatre voix, enchaînement le plus court, sans parallèles) ; `voicing.ts` n’est pas touché. » Commiter.**

```bash
git add src/shell/music/realisation.ts src/shell/music/realisation.test.ts docs/chantiers/les-ficelles.md
git commit -m "feat(socle): réalisation à quatre voix sans parallèles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 4 : le contrat des ficelles, la basse qui descend et l'emprunt mineur

**Fichiers :**
- Créer : `viz/les-ficelles/domain/ficelles/type.ts`, `descend.ts`, `descend.test.ts`, `emprunt.ts`, `emprunt.test.ts`

**Interfaces :**
- Consomme : `Accord`, `Grille`, `mod12`, `basseDe`, `avecBasse`, `degre`, `accordDuDegre`, `lireAccord`, `cliche` (tâche 1) ; `nomAccord`, `nomNote`, `ecrireDans`, `ecrireAccord` (tâche 2).
- Produit (`type.ts`) :

```ts
export type FicelleId = 'descend' | 'emprunt' | 'dominante' | 'suspendu' | 'enrichis' | 'montee';
export interface Application { grille: Accord[]; touches: number[] }
export interface Ficelle {
  id: FicelleId; nom: string; resume: string;
  endroits(g: Grille): number[];
  zone(g: Grille, i: number): number[];
  appliquer(g: Grille, i: number): Application;
  explique(g: Grille, i: number): string;
  pourquoiPas(g: Grille): string;
}
export const MAX_GRILLE = 24;
```

- Produit : `descend: Ficelle`, `passages(haut, bas, key): number[]` ; `emprunt: Ficelle`.

- [ ] **Étape 1 : écrire `viz/les-ficelles/domain/ficelles/type.ts`** (pas de test propre : c'est un contrat).

```ts
/**
 * Le contrat d'une ficelle : où elle s'applique, ce qu'elle fait, et comment elle s'explique.
 * Un « endroit » est un indice dans la grille, propre à chaque ficelle (le premier accord d'une paire, ou l'accord visé).
 */
import type { Accord, Grille } from '../grille';

export type FicelleId = 'descend' | 'emprunt' | 'dominante' | 'suspendu' | 'enrichis' | 'montee';

export interface Application {
  grille: Accord[];
  /** Les indices, dans la nouvelle grille, des accords ajoutés ou changés (allumés sur la portée). */
  touches: number[];
}

export interface Ficelle {
  id: FicelleId;
  nom: string;
  /** Une phrase pour la carte. */
  resume: string;
  /** Les endroits où elle s'applique. */
  endroits(g: Grille): number[];
  /** Les accords concernés par un endroit (à allumer, et à toucher pour le choisir). */
  zone(g: Grille, i: number): number[];
  appliquer(g: Grille, i: number): Application;
  /** La phrase de l'avant / après. */
  explique(g: Grille, i: number): string;
  /** Pourquoi elle ne s'applique nulle part, avec un exemple dans la tonalité. */
  pourquoiPas(g: Grille): string;
}

/** Longueur maximale d'une grille après ficelles (huit accords au départ, et de la place pour broder). */
export const MAX_GRILLE = 24;
```

- [ ] **Étape 2 : tests qui échouent** dans `descend.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { cliche, lireAccord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { descend, passages } from './descend';

const grille = (s: string, key = 0): Grille => s.split(' ').map((x) => lireAccord(x, key)!);
const noms = (g: Grille) => g.map(nomAccord);

describe('passages', () => {
  it('donne les notes de la gamme entre deux basses, en descendant', () => {
    expect(passages(0, 9, 0)).toEqual([11]);
    expect(passages(0, 7, 0)).toEqual([11, 9]);
    expect(passages(9, 5, 0)).toEqual([7]);
  });
});

describe('la basse qui descend', () => {
  it('trouve les tierces et les quartes descendantes', () => {
    expect(descend.endroits(cliche(0))).toEqual([0, 1]); // Do → La m, La m → Fa
    expect(descend.endroits(grille('Do Sol'))).toEqual([0]); // quarte descendante (do, si, la, sol)
  });

  it('refuse les basses qui montent ou descendent d’un pas', () => {
    expect(descend.endroits(grille('Fa Sol'))).toEqual([]);
    expect(descend.endroits(grille('Do Si°'))).toEqual([]);
  });

  it('garde l’accord et fait passer la basse', () => {
    const r = descend.appliquer(cliche(0), 0);
    expect(noms(r.grille)).toEqual(['Do', 'Do/Si', 'La m', 'Fa', 'Sol']);
    expect(r.touches).toEqual([1]);
    expect(noms(descend.appliquer(grille('Do Sol'), 0).grille)).toEqual(['Do', 'Do/Si', 'Do/La', 'Sol']);
    expect(noms(descend.appliquer(cliche(0), 1).grille)).toEqual(['Do', 'La m', 'La m/Sol', 'Fa', 'Sol']);
  });

  it('allume la paire et s’explique', () => {
    expect(descend.zone(cliche(0), 0)).toEqual([0, 1]);
    expect(descend.explique(cliche(0), 0)).toContain('do, si, la');
    expect(descend.pourquoiPas(grille('Fa Sol'))).toContain('Do puis La m');
  });
});
```

- [ ] **Étape 3 : tests qui échouent** dans `emprunt.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { cliche, lireAccord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { emprunt } from './emprunt';

const grille = (s: string, key = 0): Grille => s.split(' ').map((x) => lireAccord(x, key)!);
const noms = (g: Grille) => g.map(nomAccord);

describe('l’emprunt mineur', () => {
  it('se place après un IV suivi du I ou du V', () => {
    expect(emprunt.endroits(cliche(0))).toEqual([2]); // Fa → Sol
    expect(emprunt.endroits(grille('Fa Do'))).toEqual([0]);
    expect(emprunt.endroits(grille('Fa7M Do'))).toEqual([0]);
    expect(emprunt.endroits(grille('Fa La m'))).toEqual([]);
    expect(emprunt.endroits(grille('Do Sol'))).toEqual([]);
  });

  it('insère le iv', () => {
    const r = emprunt.appliquer(cliche(0), 2);
    expect(noms(r.grille)).toEqual(['Do', 'La m', 'Fa', 'Fa m', 'Sol']);
    expect(r.touches).toEqual([3]);
  });

  it('dit quelle note descend', () => {
    expect(emprunt.explique(grille('Fa Do'), 0)).toContain('la descend au la♭');
    expect(emprunt.pourquoiPas(grille('Do Sol'))).toContain('Fa puis Do');
  });
});
```

- [ ] **Étape 4 : lancer et voir échouer.** `npx vitest run viz/les-ficelles/domain/ficelles` → échec (modules introuvables).

- [ ] **Étape 5 : écrire `descend.ts`.**

```ts
/**
 * La basse qui descend : entre deux accords dont la basse descend d'une tierce (ou d'une quarte), l'accord reste et la
 * basse passe par les notes de la gamme (Do – Do/Si – La m). La basse devient une mélodie.
 */
import { accordDuDegre, avecBasse, basseDe, mod12, type Grille } from '../grille';
import { ecrireDans, nomAccord, nomNote } from '../orthographe';
import { MAX_GRILLE, type Ficelle } from './type';

const GAMME = [0, 2, 4, 5, 7, 9, 11];

/** Les notes de la gamme strictement entre deux basses, en descendant (do → la : si). */
export function passages(haut: number, bas: number, key: number): number[] {
  const out: number[] = [];
  for (let d = 1; d < mod12(haut - bas); d++) {
    const n = mod12(haut - d);
    if (GAMME.includes(mod12(n - key))) out.push(n);
  }
  return out;
}

/** Les notes de passage d'un endroit, ou `null` s'il n'en est pas un. */
function chemin(g: Grille, i: number): number[] | null {
  const a = g[i];
  const b = g[i + 1];
  if (!a || !b || a.key !== b.key) return null;
  const ecart = mod12(basseDe(a) - basseDe(b));
  if (ecart < 3 || ecart > 5) return null;
  const p = passages(basseDe(a), basseDe(b), a.key);
  return p.length === (ecart === 5 ? 2 : 1) && g.length + p.length <= MAX_GRILLE ? p : null;
}

export const descend: Ficelle = {
  id: 'descend',
  nom: 'La basse qui descend',
  resume: 'L’accord reste, la basse descend note à note jusqu’au suivant.',
  endroits: (g) => g.flatMap((_, i) => (chemin(g, i) ? [i] : [])),
  zone: (_g, i) => [i, i + 1],
  appliquer(g, i) {
    const a = g[i]!;
    const ajout = chemin(g, i)!.map((n) => avecBasse(a, n));
    return { grille: [...g.slice(0, i + 1), ...ajout, ...g.slice(i + 1)], touches: ajout.map((_, k) => i + 1 + k) };
  },
  explique(g, i) {
    const a = g[i]!;
    const b = g[i + 1]!;
    const notes = [...[basseDe(a), ...chemin(g, i)!].map((n) => ecrireDans(n, a)), ecrireDans(basseDe(b), b)].map(nomNote);
    return `${nomAccord(a)} reste, la basse descend note à note : ${notes.join(', ')}, jusqu’à ${nomAccord(b)}. La basse devient une mélodie.`;
  },
  pourquoiPas(g) {
    const k = g[0]?.key ?? 0;
    return `Il faut deux accords dont la basse descend d’une tierce ou d’une quarte (par exemple ${nomAccord(accordDuDegre('I', k))} puis ${nomAccord(accordDuDegre('vi', k))}).`;
  },
};
```

- [ ] **Étape 6 : écrire `emprunt.ts`.**

```ts
/**
 * L'emprunt mineur : après un IV qui va vers le I ou le V, on glisse le iv (Fa – Fa m – Do). Sa tierce descend d'un
 * demi-ton : une note prise au mode mineur, la lumière baisse un instant.
 */
import { accordDuDegre, degre, type Accord, type Grille } from '../grille';
import { ecrireAccord, nomAccord, nomNote } from '../orthographe';
import { MAX_GRILLE, type Ficelle } from './type';

const ivDe = (a: Accord): Accord => ({ root: a.root, couleur: 'min', key: a.key });

function estEndroit(g: Grille, i: number): boolean {
  const a = g[i];
  const b = g[i + 1];
  return !!a && !!b && degre(a) === 'IV' && a.bass === undefined && b.key === a.key && (degre(b) === 'I' || degre(b) === 'V') && g.length < MAX_GRILLE;
}

export const emprunt: Ficelle = {
  id: 'emprunt',
  nom: 'L’emprunt mineur',
  resume: 'Le IV devient mineur un instant : une note descend d’un demi-ton, la lumière baisse.',
  endroits: (g) => g.flatMap((_, i) => (estEndroit(g, i) ? [i] : [])),
  zone: (_g, i) => [i, i + 1],
  appliquer(g, i) {
    return { grille: [...g.slice(0, i + 1), ivDe(g[i]!), ...g.slice(i + 1)], touches: [i + 1] };
  },
  explique(g, i) {
    const a = g[i]!;
    const iv = ivDe(a);
    const tierce = ecrireAccord({ root: a.root, couleur: 'maj', key: a.key })[1]!;
    const tierceMineure = ecrireAccord(iv)[1]!;
    return `Entre ${nomAccord(a)} et ${nomAccord(g[i + 1]!)}, ${nomAccord(iv)} : le ${nomNote(tierce)} descend au ${nomNote(tierceMineure)}, une note empruntée au mode mineur. La lumière baisse un instant.`;
  },
  pourquoiPas(g) {
    const k = g[0]?.key ?? 0;
    const [iv, i, v] = (['IV', 'I', 'V'] as const).map((l) => nomAccord(accordDuDegre(l, k)));
    return `Il faut un IV suivi du I ou du V (par exemple ${iv} puis ${i}, ou ${iv} puis ${v}).`;
  },
};
```

> Écart assumé par rapport à la fiche (« IV suivi de I ») : on accepte aussi « IV suivi de V » (Fa – Fa m – Sol, aussi courant), sinon le cliché de départ n'offrirait aucun endroit. Le noter dans « Décisions » de la fiche.

- [ ] **Étape 7 : lancer les tests.** `npx vitest run viz/les-ficelles/domain/ficelles` → verts.

- [ ] **Étape 8 : `npm run typecheck`, `npm test`, cocher « Ficelles 1 et 2 », ajouter la décision sur l'emprunt, commiter.**

```bash
git add viz/les-ficelles/domain/ficelles docs/chantiers/les-ficelles.md
git commit -m "feat(les-ficelles): la basse qui descend et l’emprunt mineur

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 5 : la dominante qui annonce et le Sol suspendu

**Fichiers :**
- Créer : `viz/les-ficelles/domain/ficelles/dominante.ts`, `dominante.test.ts`, `suspendu.ts`, `suspendu.test.ts`

**Interfaces :**
- Consomme : `Ficelle`, `MAX_GRILLE` (tâche 4) ; `Accord`, `Grille`, `mod12`, `degre`, `accordDuDegre`, `lireAccord`, `cliche` (tâche 1) ; `ecrireAccord`, `nomAccord`, `nomNote` (tâche 2).
- Produit : `dominante: Ficelle`, `suspendu: Ficelle`.

- [ ] **Étape 1 : tests qui échouent** dans `dominante.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { cliche, lireAccord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { dominante } from './dominante';

const grille = (s: string, key = 0): Grille => s.split(' ').map((x) => lireAccord(x, key)!);
const noms = (g: Grille) => g.map(nomAccord);

describe('la dominante qui annonce', () => {
  it('vise tout accord majeur ou mineur après le premier', () => {
    expect(dominante.endroits(cliche(0))).toEqual([1, 2, 3]);
  });

  it('ne double pas une dominante déjà là, et laisse les diminués', () => {
    expect(dominante.endroits(grille('Sol Do'))).toEqual([]);
    expect(dominante.endroits(grille('Sol7 Do'))).toEqual([]);
    expect(dominante.endroits(grille('Do Si°'))).toEqual([]);
  });

  it('insère la septième de dominante juste avant', () => {
    const r = dominante.appliquer(cliche(0), 1);
    expect(noms(r.grille)).toEqual(['Do', 'Mi7', 'La m', 'Fa', 'Sol']);
    expect(r.touches).toEqual([1]);
    expect(dominante.zone(cliche(0), 1)).toEqual([0, 1]);
  });

  it('dit quelle note tire vers la cible', () => {
    expect(dominante.explique(cliche(0), 1)).toContain('sol♯ monte d’un demi-ton vers le la');
  });
});
```

- [ ] **Étape 2 : tests qui échouent** dans `suspendu.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { cliche, lireAccord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { suspendu } from './suspendu';

const grille = (s: string, key = 0): Grille => s.split(' ').map((x) => lireAccord(x, key)!);
const noms = (g: Grille) => g.map(nomAccord);

describe('le Sol suspendu', () => {
  it('vise le V, avec ou sans septième', () => {
    expect(suspendu.endroits(cliche(0))).toEqual([3]);
    expect(suspendu.endroits(grille('Do Sol7'))).toEqual([1]);
    expect(suspendu.endroits(grille('Do Fa'))).toEqual([]);
  });

  it('remplace V par IV/V', () => {
    const r = suspendu.appliquer(cliche(0), 3);
    expect(noms(r.grille)).toEqual(['Do', 'La m', 'Fa', 'Fa/Sol']);
    expect(r.touches).toEqual([3]);
    expect(noms(suspendu.appliquer(cliche(7), 3).grille)[3]).toBe('Do/Ré');
  });

  it('dit ce qui disparaît', () => {
    expect(suspendu.explique(cliche(0), 3)).toContain('plus de si');
    expect(suspendu.pourquoiPas(grille('Do Fa'))).toContain('Sol');
  });
});
```

- [ ] **Étape 3 : lancer et voir échouer.** `npx vitest run viz/les-ficelles/domain/ficelles` → échec sur les deux nouveaux fichiers.

- [ ] **Étape 4 : écrire `dominante.ts`.**

```ts
/**
 * La dominante qui annonce : juste avant un accord, sa septième de dominante (Do – Mi7 – La m). Sa tierce est la
 * sensible de l'accord visé : elle monte d'un demi-ton vers lui, on le sent arriver.
 */
import { mod12, type Accord, type Grille } from '../grille';
import { ecrireAccord, nomAccord, nomNote } from '../orthographe';
import { MAX_GRILLE, type Ficelle } from './type';

const dominanteDe = (a: Accord): Accord => ({ root: mod12(a.root + 7), couleur: '7', key: a.key });
const annonceDeja = (avant: Accord, a: Accord) => avant.root === mod12(a.root + 7) && (avant.couleur === 'maj' || avant.couleur === '7');

function estEndroit(g: Grille, i: number): boolean {
  const a = g[i];
  const avant = g[i - 1];
  return !!a && !!avant && a.couleur !== 'dim' && a.bass === undefined && !annonceDeja(avant, a) && g.length < MAX_GRILLE;
}

export const dominante: Ficelle = {
  id: 'dominante',
  nom: 'La dominante qui annonce',
  resume: 'Juste avant un accord, sa dominante : une note monte d’un demi-ton vers lui.',
  endroits: (g) => g.flatMap((_, i) => (estEndroit(g, i) ? [i] : [])),
  zone: (_g, i) => [i - 1, i],
  appliquer(g, i) {
    return { grille: [...g.slice(0, i), dominanteDe(g[i]!), ...g.slice(i)], touches: [i] };
  },
  explique(g, i) {
    const a = g[i]!;
    const d = dominanteDe(a);
    const sensible = ecrireAccord(d)[1]!;
    const cible = ecrireAccord(a)[0]!;
    return `${nomAccord(d)} annonce ${nomAccord(a)} : son ${nomNote(sensible)} monte d’un demi-ton vers le ${nomNote(cible)}. On sent ${nomAccord(a)} arriver avant qu’il sonne.`;
  },
  pourquoiPas: () => 'Il faut un accord majeur ou mineur, après le premier, qui ne soit pas déjà précédé de sa dominante.',
};
```

- [ ] **Étape 5 : écrire `suspendu.ts`.**

```ts
/**
 * Le Sol suspendu : le V devient IV/V (Sol → Fa/Sol). La basse de dominante reste, mais la sensible disparaît :
 * la tension demeure, sans le tiraillement. Un geste très « chanson » des années 70.
 */
import { accordDuDegre, degre, mod12, type Accord } from '../grille';
import { ecrireAccord, nomAccord, nomNote } from '../orthographe';
import type { Ficelle } from './type';

const suspenduDe = (a: Accord): Accord => ({ root: mod12(a.key + 5), couleur: 'maj', key: a.key, bass: a.root });

export const suspendu: Ficelle = {
  id: 'suspendu',
  nom: 'Le Sol suspendu',
  resume: 'Le V devient IV sur la basse du V : la tension sans le tiraillement.',
  endroits: (g) => g.flatMap((a, i) => (degre(a) === 'V' && a.bass === undefined ? [i] : [])),
  zone: (_g, i) => [i],
  appliquer(g, i) {
    return { grille: g.map((a, k) => (k === i ? suspenduDe(a) : a)), touches: [i] };
  },
  explique(g, i) {
    const a = g[i]!;
    const s = suspenduDe(a);
    const [basse, sensible] = ecrireAccord(a);
    const iv = nomAccord(accordDuDegre('IV', a.key));
    return `${nomAccord(s)} garde la basse ${nomNote(basse!)} mais pose dessus l’accord de ${iv} : plus de ${nomNote(sensible!)}, la sensible. La tension reste, en plus doux.`;
  },
  pourquoiPas: (g) => `Il faut un accord de dominante, le V (par exemple ${nomAccord(accordDuDegre('V', g[0]?.key ?? 0))}).`,
};
```

- [ ] **Étape 6 : lancer les tests.** `npx vitest run viz/les-ficelles/domain/ficelles` → verts.

- [ ] **Étape 7 : `npm run typecheck`, `npm test`, cocher « Ficelles 3 et 4 », commiter.**

```bash
git add viz/les-ficelles/domain/ficelles docs/chantiers/les-ficelles.md
git commit -m "feat(les-ficelles): la dominante qui annonce et le Sol suspendu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 6 : les accords enrichis, la montée finale et le registre

**Fichiers :**
- Créer : `viz/les-ficelles/domain/ficelles/enrichis.ts`, `enrichis.test.ts`, `montee.ts`, `montee.test.ts`, `index.ts`, `index.test.ts`

**Interfaces :**
- Consomme : tout ce qui précède, plus `realiser` (tâche 3) dans le test du registre.
- Produit : `enrichis: Ficelle`, `montee: Ficelle` ; `FICELLES: readonly Ficelle[]` (dans l'ordre descend, emprunt, dominante, suspendu, enrichis, montee), `ficelle(id: FicelleId): Ficelle`, `IDS: readonly FicelleId[]`.

- [ ] **Étape 1 : tests qui échouent** dans `enrichis.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { cliche, lireAccord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { enrichis } from './enrichis';

const grille = (s: string, key = 0): Grille => s.split(' ').map((x) => lireAccord(x, key)!);
const nomApres = (g: Grille, i: number) => nomAccord(enrichis.appliquer(g, i).grille[i]!);

describe('les accords enrichis', () => {
  it('vise les triades de la gamme sans basse écrite', () => {
    expect(enrichis.endroits(cliche(0))).toEqual([0, 1, 2, 3]);
    expect(enrichis.endroits(grille('Si° Do/Si Mi Fa7M'))).toEqual([]);
  });

  it('choisit la septième selon le degré', () => {
    expect(nomApres(cliche(0), 0)).toBe('Do7M');
    expect(nomApres(cliche(0), 1)).toBe('La m7');
    expect(nomApres(cliche(0), 2)).toBe('Fa7M');
    expect(nomApres(cliche(0), 3)).toBe('Sol7');
    expect(enrichis.appliquer(cliche(0), 2).touches).toEqual([2]);
  });

  it('nomme la note ajoutée', () => {
    expect(enrichis.explique(cliche(0), 2)).toContain('on ajoute mi');
    expect(enrichis.explique(cliche(0), 3)).toContain('on ajoute fa');
  });
});
```

- [ ] **Étape 2 : tests qui échouent** dans `montee.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { cliche } from '../grille';
import { nomAccord } from '../orthographe';
import { montee } from './montee';

describe('la montée finale', () => {
  it('s’applique une fois, à la fin', () => {
    expect(montee.endroits(cliche(0))).toEqual([3]);
    const r = montee.appliquer(cliche(0), 3);
    expect(montee.endroits(r.grille)).toEqual([]);
  });

  it('rejoue la progression un ton plus haut, amenée par la dominante', () => {
    const r = montee.appliquer(cliche(0), 3);
    expect(r.grille.map(nomAccord)).toEqual(['Do', 'La m', 'Fa', 'Sol', 'La7', 'Ré', 'Si m', 'Sol', 'La']);
    expect(r.touches).toEqual([4, 5, 6, 7, 8]);
    expect(r.grille[5]!.key).toBe(2);
  });

  it('nomme la dominante et la nouvelle tonique', () => {
    expect(montee.explique(cliche(0), 3)).toContain('La7, la dominante de Ré');
  });
});
```

- [ ] **Étape 3 : tests qui échouent** dans `index.test.ts` (le contrat, sur beaucoup de grilles) :

```ts
import { describe, expect, it } from 'vitest';
import { realiser } from '@shell/music/realisation';
import { accordDuDegre, basseDe, cliche, LABELS, notesDe, type Accord, type Grille } from '../grille';
import { FICELLES, ficelle, IDS } from './index';
import { MAX_GRILLE } from './type';

const deg = (l: string): Accord => accordDuDegre(l, 0);
const PAIRES: Grille[] = LABELS.flatMap((a) => LABELS.map((b) => [deg(a), deg(b)]));
const TRIPLES: Grille[] = LABELS.flatMap((a) => LABELS.flatMap((b) => LABELS.map((c) => [deg(a), deg(b), deg(c)])));
const LONGUES: Grille[] = [cliche(0), cliche(7), cliche(3), ['I', 'iii', 'vi', 'IV', 'ii', 'V', 'I', 'V'].map(deg)];

describe('le registre', () => {
  it('a six ficelles, dans l’ordre de la page', () => {
    expect(IDS).toEqual(['descend', 'emprunt', 'dominante', 'suspendu', 'enrichis', 'montee']);
    expect(ficelle('montee').id).toBe('montee');
  });
});

describe('le contrat, sur toutes les paires et triples de la gamme', () => {
  it('chaque endroit s’applique, reste dans les bornes et s’explique', () => {
    for (const g of [...PAIRES, ...TRIPLES, ...LONGUES])
      for (const f of FICELLES)
        for (const e of f.endroits(g)) {
          const r = f.appliquer(g, e);
          expect(r.grille.length).toBeLessThanOrEqual(MAX_GRILLE);
          expect(r.touches.length).toBeGreaterThan(0);
          for (const t of r.touches) expect(t >= 0 && t < r.grille.length).toBe(true);
          for (const z of f.zone(g, e)) expect(z >= 0 && z < g.length).toBe(true);
          expect(f.explique(g, e).length).toBeGreaterThan(20);
        }
  });

  it('toute grille transformée se joue à quatre voix', () => {
    for (const g of [...PAIRES, ...LONGUES])
      for (const f of FICELLES)
        for (const e of f.endroits(g)) {
          const r = f.appliquer(g, e);
          expect(() => realiser(r.grille.map((a) => ({ notes: notesDe(a), basse: basseDe(a) })))).not.toThrow();
        }
  });

  it('une ficelle sans endroit dit pourquoi', () => {
    for (const f of FICELLES) expect(f.pourquoiPas([deg('I'), deg('I')]).length).toBeGreaterThan(20);
  });
});
```

- [ ] **Étape 4 : lancer et voir échouer.** `npx vitest run viz/les-ficelles/domain/ficelles` → échec (modules introuvables).

- [ ] **Étape 5 : écrire `enrichis.ts`.**

```ts
/**
 * Les accords enrichis : une septième sur les accords de la gamme. 7M sur I et IV, m7 sur ii, iii et vi (des notes de
 * la gamme : l'accord s'adoucit sans changer de rôle), 7 sur V (la septième veut descendre : la dominante tire plus fort).
 */
import { accordDuDegre, degre, type Accord, type Couleur } from '../grille';
import { ecrireAccord, nomAccord, nomNote } from '../orthographe';
import type { Ficelle } from './type';

const SEPTIEME: Readonly<Record<string, Couleur>> = { I: '7M', IV: '7M', ii: 'm7', iii: 'm7', vi: 'm7', V: '7' };

function cible(a: Accord): Couleur | null {
  if ((a.couleur !== 'maj' && a.couleur !== 'min') || a.bass !== undefined) return null;
  return SEPTIEME[degre(a) ?? ''] ?? null;
}

export const enrichis: Ficelle = {
  id: 'enrichis',
  nom: 'Les accords enrichis',
  resume: 'Une septième sur un accord de la gamme : il s’arrondit sans changer de rôle.',
  endroits: (g) => g.flatMap((a, i) => (cible(a) ? [i] : [])),
  zone: (_g, i) => [i],
  appliquer(g, i) {
    return { grille: g.map((a, k) => (k === i ? { ...a, couleur: cible(a)! } : a)), touches: [i] };
  },
  explique(g, i) {
    const a = g[i]!;
    const b: Accord = { ...a, couleur: cible(a)! };
    const septieme = nomNote(ecrireAccord(b)[3]!);
    if (degre(a) === 'V')
      return `${nomAccord(a)} devient ${nomAccord(b)} : on ajoute ${septieme}, la septième. Elle veut descendre d’un demi-ton : la dominante tire plus fort vers ${nomAccord(accordDuDegre('I', a.key))}.`;
    return `${nomAccord(a)} devient ${nomAccord(b)} : on ajoute ${septieme}, la septième, une note de la gamme. L’accord garde son rôle, il devient plus doux, plus rond.`;
  },
  pourquoiPas: () => 'Tous les accords de la gamme sont déjà enrichis, ou renversés (un accord sur une autre basse reste tel quel).',
};
```

- [ ] **Étape 6 : écrire `montee.ts`.**

```ts
/**
 * La montée finale : la progression rejouée un ton plus haut, amenée par la dominante de la nouvelle tonalité
 * (… Sol – La7 – Ré …). Le geste des derniers refrains. Une seule fois : ensuite, la grille n'a plus une seule tonalité.
 */
import { accordDuDegre, mod12, transposer, type Accord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { MAX_GRILLE, type Ficelle } from './type';

const MONTEE = 2;
const nouvelle = (g: Grille) => mod12(g[0]!.key + MONTEE);
const dominanteDe = (k: number): Accord => ({ root: mod12(k + 7), couleur: '7', key: k });

export const montee: Ficelle = {
  id: 'montee',
  nom: 'La montée finale',
  resume: 'Toute la progression, rejouée un ton plus haut : le geste des derniers refrains.',
  endroits: (g) => (g.length >= 2 && g.every((a) => a.key === g[0]!.key) && 2 * g.length + 1 <= MAX_GRILLE ? [g.length - 1] : []),
  zone: (_g, i) => [i],
  appliquer(g) {
    const haut = g.map((a) => transposer(a, MONTEE));
    return {
      grille: [...g, dominanteDe(nouvelle(g)), ...haut],
      touches: [g.length, ...haut.map((_, j) => g.length + 1 + j)],
    };
  },
  explique(g) {
    const k = nouvelle(g);
    return `${nomAccord(dominanteDe(k))}, la dominante de ${nomAccord(accordDuDegre('I', k))}, fait monter toute la progression d’un ton : le même chemin, plus haut, plus lumineux. C’est le geste des derniers refrains.`;
  },
  pourquoiPas: () => 'La progression est déjà montée une fois, ou elle est trop longue pour être rejouée plus haut.',
};
```

- [ ] **Étape 7 : écrire `index.ts`.**

```ts
/** Les six ficelles, dans l'ordre de la page. */
import { descend } from './descend';
import { dominante } from './dominante';
import { emprunt } from './emprunt';
import { enrichis } from './enrichis';
import { montee } from './montee';
import { suspendu } from './suspendu';
import type { Ficelle, FicelleId } from './type';

export type { Application, Ficelle, FicelleId } from './type';

export const FICELLES: readonly Ficelle[] = [descend, emprunt, dominante, suspendu, enrichis, montee];
export const IDS: readonly FicelleId[] = FICELLES.map((f) => f.id);

export function ficelle(id: FicelleId): Ficelle {
  const f = FICELLES.find((x) => x.id === id);
  if (!f) throw new Error(`Ficelle inconnue : ${id}`);
  return f;
}
```

- [ ] **Étape 8 : lancer les tests.** `npx vitest run viz/les-ficelles/domain/ficelles` → verts (le test du contrat peut prendre quelques secondes). Si une grille fait échouer `realiser`, corriger la ficelle ou la réalisation, pas le test.

- [ ] **Étape 9 : `npm run typecheck`, `npm test`, cocher « Ficelles 5 et 6 », commiter.**

```bash
git add viz/les-ficelles/domain/ficelles docs/chantiers/les-ficelles.md
git commit -m "feat(les-ficelles): accords enrichis, montée finale et registre

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 7 : la pile des ficelles gardées et l'URL

**Fichiers :**
- Créer : `viz/les-ficelles/domain/pile.ts`, `pile.test.ts`, `viz/les-ficelles/state.ts`, `viz/les-ficelles/state.test.ts`

**Interfaces :**
- Consomme : `ficelle`, `IDS`, `FicelleId` (tâche 6) ; `Accord`, `Grille`, `cliche`, `egaux`, `lireAccord`, `symbole`, `MIN_DEPART`, `MAX_DEPART` (tâche 1).
- Produit : `interface Geste { id: FicelleId; index: number }` ; `interface Rejeu { grille: Accord[]; gardes: Geste[]; tombes: Geste[] }` ; `rejouer(depart, pile): Rejeu` ; `retirer(pile, k): Geste[]` ; `EXEMPLE: readonly Geste[]` ; `interface VizState { home: number; depart: Accord[]; pile: Geste[] }` ; `readStateFromUrl(search)`, `stateToSearch(s)`.

- [ ] **Étape 1 : tests qui échouent** dans `pile.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { cliche } from './grille';
import { nomAccord } from './orthographe';
import { EXEMPLE, rejouer, retirer } from './pile';

describe('la pile', () => {
  it('rejoue les ficelles dans l’ordre (la phrase de la page)', () => {
    const r = rejouer(cliche(0), EXEMPLE);
    expect(r.grille.map(nomAccord)).toEqual(['Do', 'Do/Si', 'La m', 'Fa', 'Fa m', 'Fa/Sol']);
    expect(r.gardes).toEqual(EXEMPLE);
    expect(r.tombes).toEqual([]);
  });

  it('fait tomber une ficelle qui n’a plus son endroit', () => {
    const r = rejouer(cliche(0), retirer(EXEMPLE, 0));
    // Sans la basse qui descend, l'emprunt (3) et le Sol suspendu (5) visaient des accords qui n'existent plus.
    expect(r.grille.map(nomAccord)).toEqual(['Do', 'La m', 'Fa', 'Sol']);
    expect(r.tombes.map((g) => g.id)).toEqual(['emprunt', 'suspendu']);
  });

  it('retire par position', () => {
    expect(retirer(EXEMPLE, 1).map((g) => g.id)).toEqual(['descend', 'suspendu']);
  });
});
```

- [ ] **Étape 2 : tests qui échouent** dans `viz/les-ficelles/state.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { cliche, lireAccord } from './domain/grille';
import { readStateFromUrl, stateToSearch } from './state';

describe('état dans l’URL', () => {
  it('part du cliché en Do, sans paramètre', () => {
    expect(readStateFromUrl('')).toEqual({ home: 0, depart: cliche(0), pile: [] });
    expect(stateToSearch({ home: 0, depart: cliche(0), pile: [] })).toBe('');
  });

  it('fait l’aller-retour', () => {
    const s = {
      home: 7,
      depart: ['G', 'G/F#', 'Em', 'Cmaj7', 'D7'].map((x) => lireAccord(x, 7)!),
      pile: [{ id: 'enrichis' as const, index: 2 }, { id: 'montee' as const, index: 4 }],
    };
    const q = stateToSearch(s);
    expect(q).toBe('?t=G&p=G,G/F%23,Em,Cmaj7,D7&f=enrichis.2,montee.4');
    expect(readStateFromUrl(q)).toEqual(s);
  });

  it('retombe sur le cliché si le départ est illisible ou trop court', () => {
    expect(readStateFromUrl('?t=D&p=D').depart).toEqual(cliche(2));
    expect(readStateFromUrl('?p=C,Xyz,G').depart).toEqual(cliche(0));
  });

  it('ignore les ficelles inconnues', () => {
    expect(readStateFromUrl('?f=descend.0,magie.2,emprunt.x').pile).toEqual([{ id: 'descend', index: 0 }]);
  });
});
```

- [ ] **Étape 3 : lancer et voir échouer.** `npx vitest run viz/les-ficelles/domain/pile.test.ts viz/les-ficelles/state.test.ts` → échec.

- [ ] **Étape 4 : écrire `viz/les-ficelles/domain/pile.ts`.**

```ts
/**
 * La pile : les ficelles gardées, dans l'ordre où on les a posées. Le résultat se recalcule toujours en les rejouant
 * depuis la grille de départ ; une ficelle dont l'endroit n'existe plus (parce qu'on en a retiré une avant elle) tombe.
 */
import { ficelle, type FicelleId } from './ficelles';
import type { Accord, Grille } from './grille';

export interface Geste {
  id: FicelleId;
  index: number;
}

export interface Rejeu {
  grille: Accord[];
  gardes: Geste[];
  tombes: Geste[];
}

export function rejouer(depart: Grille, pile: readonly Geste[]): Rejeu {
  let grille = [...depart];
  const gardes: Geste[] = [];
  const tombes: Geste[] = [];
  for (const g of pile) {
    const f = ficelle(g.id);
    if (f.endroits(grille).includes(g.index)) {
      grille = f.appliquer(grille, g.index).grille;
      gardes.push(g);
    } else tombes.push(g);
  }
  return { grille, gardes, tombes };
}

export const retirer = (pile: readonly Geste[], k: number): Geste[] => pile.filter((_, j) => j !== k);

/** La phrase de la page : Do – La m – Fa – Sol devient Do – Do/Si – La m – Fa – Fa m – Fa/Sol. */
export const EXEMPLE: readonly Geste[] = [
  { id: 'descend', index: 0 },
  { id: 'emprunt', index: 3 },
  { id: 'suspendu', index: 5 },
];
```

- [ ] **Étape 5 : écrire `viz/les-ficelles/state.ts`.**

```ts
/** État dans l'URL : `?t=G&p=G,Em,C,D&f=descend.0,emprunt.3` (la tonalité, le départ, la pile ; valeurs par défaut omises). */
import { parsePitch } from '@shell/music/chords';
import { KEY_NAMES } from '../compose-ta-progression/state';
import { IDS, type FicelleId } from './domain/ficelles';
import { cliche, egaux, lireAccord, MAX_DEPART, MIN_DEPART, symbole, type Accord } from './domain/grille';
import type { Geste } from './domain/pile';

export interface VizState {
  home: number;
  depart: Accord[];
  pile: Geste[];
}

const GESTE = /^([a-z]+)\.(\d+)$/;

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const home = parsePitch(q.get('t') ?? 'C') ?? 0;
  const lus = (q.get('p') ?? '').split(',').filter(Boolean).map((s) => lireAccord(s, home));
  const valides = lus.filter((a): a is Accord => a !== null);
  const depart = valides.length === lus.length && lus.length >= MIN_DEPART && lus.length <= MAX_DEPART ? valides : cliche(home);
  const pile = (q.get('f') ?? '').split(',').flatMap((s): Geste[] => {
    const m = GESTE.exec(s);
    return m && (IDS as readonly string[]).includes(m[1]!) ? [{ id: m[1] as FicelleId, index: Number(m[2]) }] : [];
  });
  return { home, depart, pile };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.home !== 0) q.set('t', KEY_NAMES[s.home]!);
  const c = cliche(s.home);
  if (s.depart.length !== c.length || s.depart.some((a, i) => !egaux(a, c[i]!))) q.set('p', s.depart.map(symbole).join(','));
  if (s.pile.length) q.set('f', s.pile.map((g) => `${g.id}.${g.index}`).join(','));
  // Virgules lisibles ; le dièse reste encodé (%23), sinon il ouvrirait un fragment.
  const str = q.toString().replace(/%2C/g, ',');
  return str ? `?${str}` : '';
}
```

- [ ] **Étape 6 : lancer les tests.** `npx vitest run viz/les-ficelles/domain/pile.test.ts viz/les-ficelles/state.test.ts` → verts.

- [ ] **Étape 7 : `npm run typecheck`, `npm test`, compléter la coche « Grille, orthographe, état dans l’URL », ajouter dans « Décisions » : « Retirer une ficelle rejoue les suivantes à leur indice d’origine ; celles dont l’endroit a disparu tombent (message), une ficelle dont l’indice reste valide peut s’appliquer à un autre accord : accepté en v1. » Commiter.**

```bash
git add viz/les-ficelles/domain/pile.ts viz/les-ficelles/domain/pile.test.ts viz/les-ficelles/state.ts viz/les-ficelles/state.test.ts docs/chantiers/les-ficelles.md
git commit -m "feat(les-ficelles): pile des ficelles gardées et état dans l’URL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 8 : la portée (géométrie pure et dessin SVG)

**Fichiers :**
- Créer : `viz/les-ficelles/domain/portee.ts`, `portee.test.ts`, `viz/les-ficelles/ui/portee.ts`

**Interfaces :**
- Consomme : `Voix` (tâche 3) ; `Accord`, `Grille` (tâche 1) ; `ecrireDans`, `placer`, `rang`, `NotePlacee` (tâche 2).
- Produit (`domain/portee.ts`) : `INTERLIGNE = 10`, `SOL = { bas: 30, haut: 38 }`, `FA = { bas: 18, haut: 26 }`, `HAUTEUR_SYSTEME`, `Y_SOL`, `Y_FA`, `yDe(r, cle)`, `interface NoteDessinee`, `placerAccord(v, a): NoteDessinee[]`.
- Produit (`ui/portee.ts`) : `interface VuePortee { grille; voix; noms; largeur; allumes; touches; curseur }`, `mesuresParLigne(largeur)`, `dessinerPortee(v): string` (balisage SVG ; chaque mesure est un `rect.mesure[data-i]`).

- [ ] **Étape 1 : tests qui échouent** dans `viz/les-ficelles/domain/portee.test.ts` :

```ts
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
```

- [ ] **Étape 2 : lancer et voir échouer.** `npx vitest run viz/les-ficelles/domain/portee.test.ts` → échec.

- [ ] **Étape 3 : écrire `viz/les-ficelles/domain/portee.ts`.**

```ts
/**
 * Géométrie de la portée (pure) : où tombe chaque note d'un accord, dans un « système » (clé de sol au-dessus, clé de fa
 * au-dessous). Le rang d'une note (octave × 7 + lettre) donne sa hauteur : un rang = un demi-interligne.
 * Pas d'armure : toutes les altérations sont écrites devant les notes.
 */
import type { Voix } from '@shell/music/realisation';
import type { Accord } from './grille';
import { ecrireDans, placer, rang, type NotePlacee } from './orthographe';

export const INTERLIGNE = 10;
const DEMI = INTERLIGNE / 2;
/** Rangs des lignes extrêmes : clé de sol de mi4 (30) à fa5 (38), clé de fa de sol2 (18) à la3 (26). */
export const SOL = { bas: 30, haut: 38 } as const;
export const FA = { bas: 18, haut: 26 } as const;
/** Marge du haut (noms d'accords, lignes supplémentaires), écart entre les deux portées, marge du bas. */
export const MARGE_HAUT = 46;
export const ECART_PORTEES = 64;
export const MARGE_BAS = 36;
export const Y_SOL = MARGE_HAUT;
export const Y_FA = MARGE_HAUT + 4 * INTERLIGNE + ECART_PORTEES;
export const HAUTEUR_SYSTEME = Y_FA + 4 * INTERLIGNE + MARGE_BAS;

export type Cle = 'sol' | 'fa';

export interface NoteDessinee extends NotePlacee {
  /** 0 basse, 1 ténor, 2 alto, 3 soprano. */
  voix: number;
  midi: number;
  cle: Cle;
  y: number;
  /** Les y des lignes supplémentaires. */
  lignes: number[];
  /** Décalée à droite (seconde avec la note du dessous). */
  decale: boolean;
}

export const yDe = (r: number, cle: Cle): number => (cle === 'sol' ? Y_SOL + (SOL.haut - r) * DEMI : Y_FA + (FA.haut - r) * DEMI);

function supplementaires(r: number, cle: Cle): number[] {
  const { bas, haut } = cle === 'sol' ? SOL : FA;
  const out: number[] = [];
  for (let l = haut + 2; l <= r; l += 2) out.push(yDe(l, cle));
  for (let l = bas - 2; l >= r; l -= 2) out.push(yDe(l, cle));
  return out;
}

/** Les quatre notes d'un accord : la clé suit la hauteur (sous do4 en clé de fa), l'écriture suit l'accord. */
export function placerAccord(v: Voix, a: Accord): NoteDessinee[] {
  const notes: NoteDessinee[] = v.map((midi, voix) => {
    const n = placer(midi, ecrireDans(midi, a));
    const cle: Cle = midi >= 60 ? 'sol' : 'fa';
    const r = rang(n);
    return { ...n, voix, midi, cle, y: yDe(r, cle), lignes: supplementaires(r, cle), decale: false };
  });
  // Seconde sur une même portée : la note du dessus passe à droite (sauf si celle du dessous l'est déjà).
  for (let k = 1; k < notes.length; k++) {
    const dessous = notes[k - 1]!;
    const n = notes[k]!;
    if (dessous.cle === n.cle && rang(n) - rang(dessous) === 1 && !dessous.decale) n.decale = true;
  }
  return notes;
}
```

- [ ] **Étape 4 : lancer les tests.** `npx vitest run viz/les-ficelles/domain/portee.test.ts` → verts.

- [ ] **Étape 5 : écrire `viz/les-ficelles/ui/portee.ts`** (dessin ; vérifié à l'œil en tâche 9).

```ts
/**
 * Dessin de la portée en SVG : un accord par mesure, en rondes ; des fils relient les notes d'une même voix d'un accord
 * à l'autre (celui de la basse plus marqué). Les mesures allumées (endroits possibles) se touchent ; les notes qui
 * bougent dans les accords changés prennent l'accent.
 */
import { escapeHtml } from '@shell/html';
import type { Voix } from '@shell/music/realisation';
import type { Grille } from '../domain/grille';
import { HAUTEUR_SYSTEME, INTERLIGNE, Y_FA, Y_SOL, placerAccord } from '../domain/portee';

export interface VuePortee {
  grille: Grille;
  voix: readonly Voix[];
  noms: readonly string[];
  /** Largeur disponible, en pixels CSS. */
  largeur: number;
  /** Mesures allumées : les endroits possibles de la ficelle choisie. */
  allumes: ReadonlySet<number>;
  /** Accords ajoutés ou changés par la ficelle en aperçu. */
  touches: ReadonlySet<number>;
  /** La mesure qui sonne. */
  curseur: number | null;
}

const MARGE_CLE = 46;
const ALTERATION = ['𝄫', '♭', '', '♯', '𝄪'];
/** Une ronde : ovale plein, trou incliné (règle de remplissage pair-impair). */
const RONDE = 'M-7 0a7 5 0 1 0 14 0a7 5 0 1 0-14 0ZM-4 0a4 2.4 -35 1 1 8 0a4 2.4 -35 1 1-8 0Z';

export const mesuresParLigne = (largeur: number) => (largeur < 520 ? 2 : 4);

export function dessinerPortee(v: VuePortee): string {
  const n = mesuresParLigne(v.largeur);
  const systemes = Math.max(1, Math.ceil(v.grille.length / n));
  const w = (v.largeur - MARGE_CLE) / n;
  const ligneDe = (i: number) => Math.floor(i / n);
  const cx = (i: number) => MARGE_CLE + (i % n) * w + w / 2;
  const placees = v.voix.map((vx, i) => placerAccord(vx, v.grille[i]!));
  const fonds: string[] = [];
  const traits: string[] = [];
  const fils: string[] = [];
  const notes: string[] = [];

  for (let s = 0; s < systemes; s++) {
    const y0 = s * HAUTEUR_SYSTEME;
    const nb = Math.min(n, v.grille.length - s * n);
    const fin = MARGE_CLE + nb * w;
    for (const haut of [Y_SOL, Y_FA])
      for (let k = 0; k < 5; k++) {
        const y = y0 + haut + k * INTERLIGNE;
        traits.push(`<line class="ligne" x1="4" x2="${fin}" y1="${y}" y2="${y}"/>`);
      }
    traits.push(`<line class="barre" x1="4" x2="4" y1="${y0 + Y_SOL}" y2="${y0 + Y_FA + 4 * INTERLIGNE}"/>`);
    for (let m = 1; m <= nb; m++) {
      const x = MARGE_CLE + m * w;
      traits.push(`<line class="barre" x1="${x}" x2="${x}" y1="${y0 + Y_SOL}" y2="${y0 + Y_FA + 4 * INTERLIGNE}"/>`);
    }
    traits.push(`<text class="cle" x="8" y="${y0 + Y_SOL + 3 * INTERLIGNE}">𝄞</text>`);
    traits.push(`<text class="cle" x="8" y="${y0 + Y_FA + INTERLIGNE}">𝄢</text>`);
  }

  v.grille.forEach((_, i) => {
    const y0 = ligneDe(i) * HAUTEUR_SYSTEME;
    const gauche = MARGE_CLE + (i % n) * w;
    const allumee = v.allumes.has(i);
    const cls = ['mesure', allumee && 'allumee', v.curseur === i && 'joue', v.touches.has(i) && 'touchee'].filter(Boolean).join(' ');
    const geste = allumee ? ` tabindex="0" role="button" aria-label="Endroit : ${escapeHtml(v.noms[i]!)}"` : '';
    fonds.push(`<rect class="${cls}" data-i="${i}" x="${gauche + 2}" y="${y0 + 4}" width="${w - 4}" height="${HAUTEUR_SYSTEME - 8}" rx="6"${geste}/>`);
    notes.push(`<text class="nom${v.touches.has(i) ? ' touche' : ''}" x="${cx(i)}" y="${y0 + 22}" text-anchor="middle">${escapeHtml(v.noms[i]!)}</text>`);
  });

  placees.forEach((accord, i) => {
    const y0 = ligneDe(i) * HAUTEUR_SYSTEME;
    for (const note of accord) {
      const x = cx(i) + (note.decale ? 13 : 0);
      const bouge = v.touches.has(i) && (i === 0 || v.voix[i]![note.voix] !== v.voix[i - 1]![note.voix]);
      for (const l of note.lignes) notes.push(`<line class="ligne" x1="${x - 11}" x2="${x + 11}" y1="${y0 + l}" y2="${y0 + l}"/>`);
      if (note.alteration !== 0)
        notes.push(`<text class="alt${bouge ? ' bouge' : ''}" x="${x - 17}" y="${y0 + note.y + 5}" text-anchor="middle">${ALTERATION[note.alteration + 2]}</text>`);
      notes.push(`<path class="ronde${bouge ? ' bouge' : ''}" d="${RONDE}" transform="translate(${x} ${y0 + note.y})"/>`);
      const avant = placees[i - 1]?.[note.voix];
      if (avant && ligneDe(i - 1) === ligneDe(i))
        fils.push(`<line class="fil${note.voix === 0 ? ' fil-basse' : ''}" x1="${cx(i - 1) + 9}" y1="${y0 + avant.y}" x2="${cx(i) - 9}" y2="${y0 + note.y}"/>`);
    }
  });

  const hauteur = systemes * HAUTEUR_SYSTEME;
  const label = `Portée : ${v.noms.join(', ')}`;
  return `<svg viewBox="0 0 ${v.largeur} ${hauteur}" width="${v.largeur}" height="${hauteur}" role="img" aria-label="${escapeHtml(label)}">${fonds.join('')}${traits.join('')}${fils.join('')}${notes.join('')}</svg>`;
}
```

- [ ] **Étape 6 : `npm run typecheck`, `npm test`, cocher « La portée en SVG », commiter.**

```bash
git add viz/les-ficelles/domain/portee.ts viz/les-ficelles/domain/portee.test.ts viz/les-ficelles/ui/portee.ts docs/chantiers/les-ficelles.md
git commit -m "feat(les-ficelles): portée à deux clés et fils de voix

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 9 : la page (départ, cartes, endroits, aperçu, pile, résultat)

**Fichiers :**
- Remplacer : `viz/les-ficelles/index.html`, `viz/les-ficelles/main.ts`, `viz/les-ficelles/viz.css`
- Modifier : `docs/chantiers/les-ficelles.md`

**Interfaces :**
- Consomme : tout le domaine ; `dessinerPortee`, `VuePortee` (tâche 8) ; `realiser`, `Voix` (tâche 3) ; `readStateFromUrl`, `stateToSearch`, `VizState` (tâche 7).
- Produit : la page jouable sans son. `main.ts` expose en interne `vue()`, `dessiner()`, `render()` et la variable `curseur` que la tâche 10 branchera.

- [ ] **Étape 1 : remplacer le corps de `viz/les-ficelles/index.html`.** Garder la tête générée par `new:viz` (titre, métadonnées, `og:*`), ajouter la police de musique au lien Google Fonts existant (`&family=Noto+Music`), puis remplacer tout le `<main>` par :

```html
    <main class="viz">
      <header class="viz-intro">
        <p class="viz-kicker">Musique · Harmonie · Apprendre</p>
        <h1>Les ficelles</h1>
        <p class="viz-lede">Six procédés de la chanson française des années 70 pour transformer une progression simple : à voir sur la portée, à écouter, à garder ou non.</p>
      </header>

      <section class="viz-workspace" aria-label="Visualisation">
        <div class="viz-panel" id="panel">
          <div class="panel-block">
            <p class="panel-label">Ta progression de départ</p>
            <label class="field">
              <span class="field-label">Tonalité</span>
              <select id="home"></select>
            </label>
            <div class="degres" id="degres" aria-label="Ajouter un accord de la gamme"></div>
            <form class="saisie" id="saisie">
              <input id="saisie-texte" type="text" placeholder="Do Lam Fa Sol" aria-label="Écrire une progression" autocomplete="off" />
              <button class="button" type="submit">Poser</button>
            </form>
            <p class="hint" id="saisie-erreur" hidden></p>
            <div class="actions">
              <button class="button" type="button" id="cliche">Le cliché</button>
              <button class="button" type="button" id="effacer">Effacer</button>
            </div>
          </div>
          <div class="panel-block">
            <p class="panel-label">Le résultat</p>
            <p class="resultat" id="resultat"></p>
            <button class="button" type="button" id="copier">Copier la grille</button>
          </div>
        </div>

        <div class="viz-stage">
          <div class="stage-head">
            <p class="hint" id="consigne"></p>
          </div>
          <div class="portee" id="portee"></div>
          <div class="apercu" id="apercu" hidden>
            <p id="apercu-texte"></p>
            <div class="actions">
              <button class="button button--primary" type="button" id="garder">Garder</button>
              <button class="button" type="button" id="annuler">Annuler</button>
            </div>
          </div>
          <ol class="pile" id="pile" aria-label="Ficelles gardées"></ol>
          <p class="hint" id="message" hidden></p>
          <div class="cartes" id="cartes"></div>
        </div>
      </section>

      <section class="viz-notes">
        <nav class="viz-notes-toc" aria-label="Sommaire des explications">
          <ol>
            <li><a href="#lire">Comment lire</a></li>
            <li><a href="#methode">La méthode</a></li>
            <li><a href="#sources">D’où viennent les exemples</a></li>
            <li><a href="#limites">Ce que ça ne dit pas</a></li>
          </ol>
        </nav>
        <div class="prose">
          <section id="lire">
            <h2>Comment lire</h2>
            <p>La portée montre un accord par mesure, en rondes : la clé de sol pour la main droite, la clé de fa pour la basse. Les fils relient les notes d’une même voix d’un accord à l’autre. Un fil à plat, c’est une note tenue ; un fil qui penche, une note qui bouge. Le fil de la basse est plus marqué, parce que ces auteurs la font chanter.</p>
            <p>Touche une ficelle : les endroits où elle peut s’appliquer s’allument sur la portée. Touche un endroit pour voir l’après ; les notes qui bougent prennent la couleur. Garde-la si elle te plaît, retire-la plus tard si tu changes d’avis.</p>
          </section>
          <section id="methode">
            <h2>La méthode</h2>
            <p>Chaque ficelle est une règle écrite à la main, pas une statistique. La basse qui descend glisse un accord renversé sur la note de passage. L’emprunt mineur place le iv entre le IV et le I (ou le V). La dominante qui annonce ajoute la septième de dominante d’un accord juste avant lui. Le Sol suspendu remplace le V par IV/V. Les accords enrichis ajoutent une septième : majeure sur I et IV, mineure sur ii, iii et vi, de dominante sur V. La montée finale rejoue la progression un ton plus haut, amenée par la dominante de la nouvelle tonalité.</p>
            <p>Les voix sont disposées par un calcul simple : pour chaque accord, parmi toutes les façons de le jouer (une basse, trois notes au-dessus dans une octave), on garde celle qui bouge le moins depuis la précédente, sans quintes ni octaves parallèles. C’est la règle de l’enchaînement le plus court, celle des pianistes et des choristes. Chaque note est écrite d’après l’accord : Fa m prend un la♭, Mi7 un sol♯.</p>
          </section>
          <section id="sources">
            <h2>D’où viennent les exemples</h2>
            <p>Les titres cités sous les ficelles ont été cherchés dans des sources publiées, puis vérifiés à l’oreille au piano. On ne reproduit pas leurs grilles : on nomme le geste et on renvoie vers l’enregistrement. Une ficelle sans titre vérifié n’en affiche pas.</p>
          </section>
          <section id="limites">
            <h2>Ce que ça ne dit pas</h2>
            <p>Six ficelles ne font pas une chanson de Michel Berger : il manque la mélodie, le rythme, l’arrangement, et surtout le goût de savoir quand ne pas s’en servir. Les règles sont simplifiées : une seule façon de faire descendre la basse, une seule couleur de septième par degré. Les accords sont tenus en rondes, sans rythme. Pas d’armure à la clé : toutes les altérations sont écrites devant les notes.</p>
          </section>
        </div>
      </section>
    </main>
```

- [ ] **Étape 2 : remplacer `viz/les-ficelles/viz.css`.**

```css
/* Styles propres à « Les ficelles ». Toujours dériver des jetons de src/shell/tokens.css. */

.panel-block {
  display: grid;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
}

.panel-label {
  margin: 0;
  font-size: var(--text-xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--ink-3);
}

.actions,
.degres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.degres .button,
.actions .button {
  min-height: 44px;
}

.saisie {
  display: flex;
  gap: 0.5rem;
}

.saisie input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0 0.75rem;
  border: 1px solid var(--rule-strong);
  border-radius: 6px;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
}

.resultat {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  color: var(--ink);
}

.stage-head {
  min-height: 1.5rem;
}

.portee {
  width: 100%;
  overflow: hidden;
}

.portee svg {
  display: block;
  max-width: 100%;
  height: auto;
}

.portee .ligne {
  stroke: var(--ink-3);
  stroke-width: 1;
}

.portee .barre {
  stroke: var(--rule-strong);
  stroke-width: 1;
}

.portee .cle {
  font-family: 'Noto Music', serif;
  font-size: 40px;
  fill: var(--ink-2);
}

.portee .nom {
  font-family: var(--font-ui);
  font-size: 13px;
  fill: var(--ink-2);
}

.portee .nom.touche {
  fill: var(--accent);
  font-weight: 600;
}

.portee .mesure {
  fill: transparent;
}

.portee .mesure.touchee {
  fill: var(--surface-sunk);
}

.portee .mesure.allumee {
  fill: var(--accent-soft);
  cursor: pointer;
}

.portee .mesure.allumee:hover,
.portee .mesure.allumee:focus-visible {
  stroke: var(--accent);
  stroke-width: 1.5;
  outline: none;
}

.portee .mesure.joue {
  stroke: var(--ink-3);
  stroke-width: 1;
}

.portee .fil {
  stroke: var(--ink-3);
  stroke-width: 1.5;
  opacity: 0.45;
}

.portee .fil-basse {
  stroke: var(--ink-2);
  stroke-width: 3;
  opacity: 0.6;
}

.portee .ronde {
  fill: var(--ink);
  fill-rule: evenodd;
}

.portee .alt {
  font-family: 'Noto Music', var(--font-ui);
  font-size: 17px;
  fill: var(--ink);
}

.portee .ronde.bouge,
.portee .alt.bouge {
  fill: var(--accent);
}

.apercu {
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--surface);
}

.apercu p {
  margin: 0 0 0.75rem;
}

.pile {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0.75rem 0;
  padding: 0;
  list-style: none;
}

.pile li {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.25rem 0 0.75rem;
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  font-size: var(--text-sm);
}

.pile button {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  background: none;
  color: var(--ink-3);
  cursor: pointer;
}

.cartes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.carte {
  display: grid;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--surface);
}

.carte-choisir {
  display: grid;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  border: 0;
  background: none;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.carte:has([aria-pressed='true']) {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.carte.vide .carte-choisir {
  color: var(--ink-3);
  cursor: default;
}

.carte-nom {
  font-family: var(--font-display);
  font-size: var(--text-md);
}

.carte-resume,
.carte-compte {
  font-size: var(--text-sm);
  color: var(--ink-2);
}

.carte-signature {
  margin: 0;
  padding: 0 1rem 0.75rem;
  font-size: var(--text-xs);
  color: var(--ink-3);
}

@media (prefers-reduced-motion: reduce) {
  .portee *,
  .carte {
    transition: none !important;
  }
}
```

- [ ] **Étape 3 : remplacer `viz/les-ficelles/main.ts`.**

```ts
import { escapeHtml } from '@shell/html';
import { realiser, type Voix } from '@shell/music/realisation';
import { mountShell } from '@shell/shell';
import { createStore } from '@shell/store';
import { FICELLES, ficelle, type FicelleId } from './domain/ficelles';
import { accordDuDegre, basseDe, cliche, decouper, LABELS, lireAccord, MAX_DEPART, MIN_DEPART, notesDe, transposer, type Accord, type Grille } from './domain/grille';
import { nomAccord } from './domain/orthographe';
import { rejouer, retirer } from './domain/pile';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { dessinerPortee } from './ui/portee';
import './viz.css';

mountShell({ currentSlug: 'les-ficelles' });

const $ = <T extends HTMLElement>(id: string): T => {
  const e = document.getElementById(id);
  if (!e) throw new Error(`#${id} introuvable`);
  return e as T;
};
const els = {
  home: $<HTMLSelectElement>('home'),
  degres: $('degres'),
  saisie: $<HTMLFormElement>('saisie'),
  saisieTexte: $<HTMLInputElement>('saisie-texte'),
  saisieErreur: $('saisie-erreur'),
  cliche: $<HTMLButtonElement>('cliche'),
  effacer: $<HTMLButtonElement>('effacer'),
  resultat: $('resultat'),
  copier: $<HTMLButtonElement>('copier'),
  consigne: $('consigne'),
  portee: $('portee'),
  apercu: $('apercu'),
  apercuTexte: $('apercu-texte'),
  garder: $<HTMLButtonElement>('garder'),
  annuler: $<HTMLButtonElement>('annuler'),
  pile: $('pile'),
  message: $('message'),
  cartes: $('cartes'),
};

const store = createStore<VizState>(readStateFromUrl(location.search));
/** La ficelle choisie et, si on a touché un endroit, cet endroit (rien de tout ça n'entre dans l'URL). */
let choix: { id: FicelleId; index: number | null } | null = null;
/** Un message ponctuel (ficelles tombées, limite atteinte). */
let message = '';
/** La mesure qui sonne (suivra l'écoute). */
let curseur: number | null = null;

const voixDe = (g: Grille): Voix[] => realiser(g.map((a) => ({ notes: notesDe(a), basse: basseDe(a) })));
const tonique = (k: number) => nomAccord(accordDuDegre('I', k));

/** La grille du moment (la pile rejouée), la ficelle choisie, et l'aperçu de l'endroit choisi. */
function vue() {
  const s = store.get();
  const grille = rejouer(s.depart, s.pile).grille;
  const c = choix;
  const f = c ? ficelle(c.id) : null;
  const apercu = f && c && c.index !== null ? { ...f.appliquer(grille, c.index), index: c.index } : null;
  return { grille, f, apercu };
}

function dessiner() {
  const { grille, f, apercu } = vue();
  const g = apercu ? apercu.grille : grille;
  if (g.length === 0) {
    els.portee.innerHTML = '<p class="hint">Pose des accords pour les voir sur la portée.</p>';
    return;
  }
  const allumes = new Set<number>();
  if (f && !apercu) for (const e of f.endroits(grille)) for (const i of f.zone(grille, e)) allumes.add(i);
  els.portee.innerHTML = dessinerPortee({
    grille: g,
    voix: voixDe(g),
    noms: g.map(nomAccord),
    largeur: Math.max(300, Math.floor(els.portee.clientWidth)),
    allumes,
    touches: new Set(apercu?.touches ?? []),
    curseur,
  });
}

function render() {
  const s = store.get();
  const { grille, f, apercu } = vue();
  els.home.value = String(s.home);
  els.degres.innerHTML = LABELS.map(
    (l) => `<button type="button" class="button" data-degre="${l}">${escapeHtml(nomAccord(accordDuDegre(l, s.home)))}</button>`,
  ).join('');
  els.resultat.textContent = grille.length ? grille.map(nomAccord).join(' – ') : '—';

  const assez = grille.length >= MIN_DEPART;
  els.cartes.innerHTML = FICELLES.map((x) => {
    const n = assez ? x.endroits(grille).length : 0;
    const compte = !assez ? 'Pose au moins deux accords.' : n === 0 ? x.pourquoiPas(grille) : `${n} endroit${n > 1 ? 's' : ''}`;
    return `<article class="carte${n === 0 ? ' vide' : ''}">
      <button type="button" class="carte-choisir" data-ficelle="${x.id}" aria-pressed="${choix?.id === x.id}"${n === 0 ? ' aria-disabled="true"' : ''}>
        <span class="carte-nom">${escapeHtml(x.nom)}</span>
        <span class="carte-resume">${escapeHtml(x.resume)}</span>
        <span class="carte-compte">${escapeHtml(compte)}</span>
      </button>
    </article>`;
  }).join('');

  els.pile.innerHTML = s.pile
    .map((g, k) => {
      const nom = escapeHtml(ficelle(g.id).nom);
      return `<li>${nom} <button type="button" data-retirer="${k}" aria-label="Retirer ${nom}">✕</button></li>`;
    })
    .join('');
  els.message.hidden = !message;
  els.message.textContent = message;

  els.apercu.hidden = !apercu;
  if (f && apercu) els.apercuTexte.textContent = f.explique(grille, apercu.index);
  els.consigne.textContent = f && !apercu ? 'Touche un endroit allumé sur la portée.' : '';
  dessiner();
}

store.subscribe(() => {
  history.replaceState(null, '', `${location.pathname}${stateToSearch(store.get())}${location.hash}`);
  render();
});

/** Changer de départ vide la pile : ses endroits ne voudraient plus rien dire. */
function changerDepart(depart: Accord[]) {
  choix = null;
  message = '';
  store.set({ depart, pile: [] });
}

function erreur(t: string) {
  els.saisieErreur.textContent = t;
  els.saisieErreur.hidden = false;
}

els.home.innerHTML = Array.from({ length: 12 }, (_, k) => `<option value="${k}">${escapeHtml(tonique(k))} majeur</option>`).join('');
els.home.addEventListener('change', () => {
  const s = store.get();
  const k = Number(els.home.value);
  choix = null;
  // Transposer garde les endroits de la pile : tout bouge ensemble.
  store.set({ home: k, depart: s.depart.map((a) => transposer(a, k - s.home)) });
});

els.degres.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-degre]');
  if (!b) return;
  const s = store.get();
  if (s.depart.length >= MAX_DEPART) {
    message = `${MAX_DEPART} accords au plus au départ.`;
    render();
    return;
  }
  changerDepart([...s.depart, accordDuDegre(b.dataset.degre!, s.home)]);
});

els.saisie.addEventListener('submit', (e) => {
  e.preventDefault();
  const s = store.get();
  const mots = decouper(els.saisieTexte.value);
  const lus = mots.map((m) => lireAccord(m, s.home));
  const k = lus.findIndex((a) => a === null);
  if (k >= 0) return erreur(`Je ne sais pas lire « ${mots[k]} ».`);
  if (lus.length < MIN_DEPART || lus.length > MAX_DEPART) return erreur(`Il faut entre ${MIN_DEPART} et ${MAX_DEPART} accords.`);
  els.saisieErreur.hidden = true;
  changerDepart(lus.filter((a): a is Accord => a !== null));
});

els.cliche.addEventListener('click', () => changerDepart(cliche(store.get().home)));
els.effacer.addEventListener('click', () => changerDepart([]));

els.cartes.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-ficelle]');
  if (!b || b.getAttribute('aria-disabled') === 'true') return;
  const id = b.dataset.ficelle as FicelleId;
  choix = choix?.id === id ? null : { id, index: null };
  render();
});

function choisirEndroit(cible: EventTarget | null) {
  const m = (cible as Element | null)?.closest<SVGElement>('[data-i]');
  if (!m || !choix || choix.index !== null) return;
  const i = Number(m.dataset.i);
  const { grille } = vue();
  const f = ficelle(choix.id);
  const e = f.endroits(grille).find((x) => f.zone(grille, x).includes(i));
  if (e === undefined) return;
  choix = { id: choix.id, index: e };
  render();
}
els.portee.addEventListener('click', (e) => choisirEndroit(e.target));
els.portee.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  choisirEndroit(e.target);
});

els.garder.addEventListener('click', () => {
  if (!choix || choix.index === null) return;
  const geste = { id: choix.id, index: choix.index };
  choix = null;
  message = '';
  store.set({ pile: [...store.get().pile, geste] });
});
els.annuler.addEventListener('click', () => {
  choix = choix ? { id: choix.id, index: null } : null;
  render();
});

els.pile.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-retirer]');
  if (!b) return;
  const s = store.get();
  const r = rejouer(s.depart, retirer(s.pile, Number(b.dataset.retirer)));
  message = r.tombes.length ? `Retirée${r.tombes.length > 1 ? 's' : ''} aussi, faute de place : ${r.tombes.map((t) => ficelle(t.id).nom).join(', ')}.` : '';
  choix = null;
  store.set({ pile: r.gardes });
});

els.copier.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(els.resultat.textContent ?? '');
    els.copier.textContent = 'Grille copiée';
  } catch {
    els.copier.textContent = 'Copie impossible';
  }
  setTimeout(() => (els.copier.textContent = 'Copier la grille'), 1500);
});

new ResizeObserver(() => dessiner()).observe(els.portee);

// Une URL peut contenir des ficelles qui ne s'appliquent pas : on ne garde que celles qui tiennent.
const init = store.get();
const r0 = rejouer(init.depart, init.pile);
if (r0.tombes.length) store.set({ pile: r0.gardes });
render();
```

- [ ] **Étape 4 : `npm run typecheck` et `npm test`** → verts. Corriger tout écart de nom avec les tâches précédentes plutôt que de les renommer.

- [ ] **Étape 5 : vérifier dans le navigateur.** `preview_start` avec la configuration `atlas-dev`, ouvrir `/viz/les-ficelles/`. Contrôler :
  1. Le cliché s'affiche : Do – La m – Fa – Sol, quatre mesures, clés lisibles (ajuster `x`/`y` et `font-size` des `.cle` à l'œil si le 𝄞 n'est pas centré sur la ligne de sol), rondes avec un trou, do4 du ténor sur une ligne supplémentaire.
  2. Les six cartes : descend (2 endroits), emprunt (1), dominante (3), suspendu (1), enrichis (4), montée (1).
  3. Toucher « La basse qui descend » allume les mesures ; toucher Do → aperçu Do – Do/Si – La m, la basse si en accent, phrase « Do reste, la basse descend note à note : do, si, la… » ; *Garder* l'ajoute à la pile et à l'URL (`?f=descend.0`).
  4. Garder ensuite l'emprunt puis le Sol suspendu : résultat « Do – Do/Si – La m – Fa – Fa m – Fa/Sol », la♭ écrit avec un bémol.
  5. Retirer la première ficelle de la pile : message « Retirées aussi, faute de place : L’emprunt mineur, Le Sol suspendu. ».
  6. Saisie « Do La m Fa7M Sol7 » puis *Poser* ; saisie « Do Xyz » : message d'erreur.
  7. Tonalité Sol majeur : tout transposé, URL `?t=G…`.
  8. `read_console_messages` : aucune erreur.
  9. `resize_window` mobile (375 px) : deux mesures par ligne, pas de défilement horizontal (`document.documentElement.scrollWidth <= 375`), cartes sur une colonne ; puis `colorScheme: 'dark'` : lignes et notes lisibles. Revenir au preset `desktop`.
  Faire une capture d'écran de l'étape 4 pour l'auteur.

- [ ] **Étape 6 : cocher « L’interaction », commiter.**

```bash
git add viz/les-ficelles/index.html viz/les-ficelles/main.ts viz/les-ficelles/viz.css docs/chantiers/les-ficelles.md
git commit -m "feat(les-ficelles): la page, ses cartes, ses endroits et sa pile

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 10 : le son (écoute, curseur, avant / après)

**Fichiers :**
- Modifier : `viz/les-ficelles/index.html`, `viz/les-ficelles/main.ts`, `docs/chantiers/les-ficelles.md`

**Interfaces :**
- Consomme : `Synth`, `Player`, `Step` (socle) ; `vue()`, `dessiner()`, `render()`, `curseur`, `voixDe` (tâche 9).

- [ ] **Étape 1 : ajouter les boutons dans `index.html`.** Dans `.stage-head`, avant `<p class="hint" id="consigne">` :

```html
            <button class="button" type="button" id="ecouter">Écouter</button>
```

Dans `.apercu .actions`, avant le bouton *Garder* :

```html
              <button class="button" type="button" id="avant">Écouter avant</button>
              <button class="button" type="button" id="apres">Écouter après</button>
```

et ajouter à `viz.css` :

```css
.stage-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
```

(remplace la règle `.stage-head` existante).

- [ ] **Étape 2 : brancher le son dans `main.ts`.** Ajouter aux imports :

```ts
import { Player, type Step } from '@shell/music/player';
import { Synth } from '@shell/music/synth';
```

ajouter à `els` :

```ts
  ecouter: $<HTMLButtonElement>('ecouter'),
  avant: $<HTMLButtonElement>('avant'),
  apres: $<HTMLButtonElement>('apres'),
```

puis, juste après la définition de `render()` :

```ts
const SECONDES = 1.5;
type Ecoute = 'tout' | 'avant' | 'apres';
let ecoute: Ecoute | null = null;

const synth = new Synth();
const player = new Player(synth, (step) => {
  curseur = typeof step?.tag === 'number' ? step.tag : null;
  if (!step) ecoute = null;
  dessiner();
  majBoutons();
});

/** Les accords de `de` à `a` ; `suit` : le curseur avance sur la portée (seulement si c'est la grille affichée). */
function etapes(voix: readonly Voix[], de: number, a: number, suit: boolean): Step[] {
  const out: Step[] = [];
  for (let i = Math.max(0, de); i <= Math.min(voix.length - 1, a); i++) {
    const midis = [...voix[i]!];
    out.push(suit ? { midis, seconds: SECONDES, tag: i } : { midis, seconds: SECONDES });
  }
  return out;
}

function ecouter(quoi: Ecoute) {
  if (player.playing && ecoute === quoi) {
    player.stop();
    return;
  }
  const { grille, f, apercu } = vue();
  let steps: Step[] = [];
  if (quoi === 'tout') {
    const g = apercu ? apercu.grille : grille;
    steps = etapes(voixDe(g), 0, g.length - 1, true);
  } else if (f && apercu && quoi === 'avant') {
    const z = f.zone(grille, apercu.index);
    steps = etapes(voixDe(grille), Math.min(...z) - 1, Math.max(...z) + 1, false);
  } else if (apercu && quoi === 'apres') {
    steps = etapes(voixDe(apercu.grille), Math.min(...apercu.touches) - 1, Math.max(...apercu.touches) + 1, true);
  }
  if (!steps.length) return;
  player.play(steps);
  ecoute = quoi;
  majBoutons();
}

function majBoutons() {
  const en = (q: Ecoute) => player.playing && ecoute === q;
  els.ecouter.textContent = en('tout') ? 'Arrêter' : 'Écouter';
  els.avant.textContent = en('avant') ? 'Arrêter' : 'Écouter avant';
  els.apres.textContent = en('apres') ? 'Arrêter' : 'Écouter après';
  els.ecouter.disabled = vue().grille.length === 0;
}

els.ecouter.addEventListener('click', () => ecouter('tout'));
els.avant.addEventListener('click', () => ecouter('avant'));
els.apres.addEventListener('click', () => ecouter('apres'));
```

Enfin, au début de `render()` (première ligne du corps), arrêter ce qui joue — la grille va changer :

```ts
  if (player.playing) player.stop();
```

et à la fin de `render()`, après `dessiner();`, ajouter `majBoutons();`.

> `render()` utilise `player` défini plus bas : c'est sans danger car `render()` n'est appelé qu'après le chargement du module (dernière ligne). Si le typecheck signale une utilisation avant définition, déplacer le bloc son juste avant `function vue()`.

- [ ] **Étape 3 : `npm run typecheck`, `npm test`** → verts.

- [ ] **Étape 4 : vérifier dans le navigateur.** Recharger la page : *Écouter* joue quatre accords (environ 6 s), la mesure qui sonne est entourée, le bouton devient *Arrêter* puis revient. Dans un aperçu, *Écouter avant* joue trois accords sans curseur, *Écouter après* joue les accords changés avec curseur. Poser une ficelle pendant l'écoute l'arrête. Aucune erreur dans la console. (Le son lui-même ne peut pas être entendu par l'agent : le dire à l'auteur.)

- [ ] **Étape 5 : cocher « Le son », commiter.**

```bash
git add viz/les-ficelles/index.html viz/les-ficelles/main.ts viz/les-ficelles/viz.css docs/chantiers/les-ficelles.md
git commit -m "feat(les-ficelles): écoute, curseur et avant / après

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Tâche 11 : les titres signés

**Fichiers :**
- Créer : `viz/les-ficelles/data/signatures.ts`, `viz/les-ficelles/data/signatures.test.ts`
- Modifier : `viz/les-ficelles/main.ts`, `docs/chantiers/les-ficelles.md`

**Interfaces :**
- Consomme : `FicelleId` (tâche 6).
- Produit : `interface Signature { ficelle: FicelleId; auteur: Auteur; titre: string; passage: string; source: string; etat: 'a-verifier' | 'valide' }`, `type Auteur = 'Michel Berger' | 'Julien Clerc' | 'Michel Polnareff'`, `SIGNATURES: readonly Signature[]`, `signaturesDe(id): Signature[]` (seulement les `valide`), `ecouteUrl(s): string`.

- [ ] **Étape 1 : tests qui échouent** dans `signatures.test.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { IDS } from '../domain/ficelles';
import { ecouteUrl, SIGNATURES, signaturesDe, type Signature } from './signatures';

describe('les titres signés', () => {
  it('ont chacun une source publiée et un passage', () => {
    for (const s of SIGNATURES) {
      expect(IDS).toContain(s.ficelle);
      expect(s.source).toMatch(/^https:\/\//);
      expect(s.titre.trim()).not.toBe('');
      expect(s.passage.trim()).not.toBe('');
    }
  });

  it('n’affichent que les titres validés à l’oreille', () => {
    for (const id of IDS) expect(signaturesDe(id).every((s) => s.etat === 'valide' && s.ficelle === id)).toBe(true);
  });

  it('écoutent par une recherche, sans lien vers un enregistrement précis', () => {
    const s: Signature = { ficelle: 'descend', auteur: 'Michel Berger', titre: 'Un titre', passage: 'le refrain', source: 'https://exemple.org', etat: 'valide' };
    expect(ecouteUrl(s)).toBe('https://www.youtube.com/results?search_query=Michel%20Berger%20Un%20titre');
  });
});
```

- [ ] **Étape 2 : lancer et voir échouer.** `npx vitest run viz/les-ficelles/data` → échec.

- [ ] **Étape 3 : écrire `viz/les-ficelles/data/signatures.ts`** (liste vide au départ).

```ts
/**
 * Les titres où l'on entend chaque ficelle. Chaque entrée vient d'une source publiée (analyse, partition éditée) et
 * reste « à vérifier » tant que l'auteur ne l'a pas validée à l'oreille au piano ; seules les entrées validées
 * s'affichent. On ne reproduit pas les grilles : on nomme le geste et on renvoie vers une recherche d'écoute.
 */
import type { FicelleId } from '../domain/ficelles';

export type Auteur = 'Michel Berger' | 'Julien Clerc' | 'Michel Polnareff';

export interface Signature {
  ficelle: FicelleId;
  auteur: Auteur;
  titre: string;
  /** Où l'entendre : « l’introduction », « le pont », « l’entrée du refrain ». */
  passage: string;
  /** La source publiée consultée. */
  source: string;
  etat: 'a-verifier' | 'valide';
}

export const SIGNATURES: readonly Signature[] = [];

export const signaturesDe = (id: FicelleId): Signature[] => SIGNATURES.filter((s) => s.ficelle === id && s.etat === 'valide');

export const ecouteUrl = (s: Signature): string => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.auteur} ${s.titre}`)}`;
```

- [ ] **Étape 4 : afficher les signatures dans les cartes (`main.ts`).** Ajouter l'import :

```ts
import { ecouteUrl, signaturesDe } from './data/signatures';
```

et, dans `render()`, remplacer le `return` de la carte par :

```ts
    const sig = signaturesDe(x.id);
    const signature = sig.length
      ? `<p class="carte-signature">On l’entend chez ${sig
          .map((s) => `${escapeHtml(s.auteur)}, <a href="${escapeHtml(ecouteUrl(s))}" target="_blank" rel="noopener">« ${escapeHtml(s.titre)} »</a> (${escapeHtml(s.passage)})`)
          .join(' ; ')}.</p>`
      : '';
    return `<article class="carte${n === 0 ? ' vide' : ''}">
      <button type="button" class="carte-choisir" data-ficelle="${x.id}" aria-pressed="${choix?.id === x.id}"${n === 0 ? ' aria-disabled="true"' : ''}>
        <span class="carte-nom">${escapeHtml(x.nom)}</span>
        <span class="carte-resume">${escapeHtml(x.resume)}</span>
        <span class="carte-compte">${escapeHtml(compte)}</span>
      </button>
      ${signature}
    </article>`;
```

- [ ] **Étape 5 : `npm run typecheck`, `npm test`** → verts. Commiter le mécanisme :

```bash
git add viz/les-ficelles/data viz/les-ficelles/main.ts
git commit -m "feat(les-ficelles): titres signés, affichés une fois validés

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Étape 6 : chercher les sources.** Avec la recherche web, pour chacune des six ficelles, chercher des titres de Michel Berger, Julien Clerc ou Michel Polnareff où une **source publiée** (article d'analyse musicale, ouvrage, partition éditée, cours en ligne reconnu) décrit le procédé. Règles :
  - aucun titre avancé de mémoire : chaque entrée cite l'URL de sa source dans `source` ;
  - au plus trois entrées par ficelle, `etat: 'a-verifier'` ;
  - ne recopier aucune grille complète ni paroles ; seulement le titre, l'auteur, le passage.
  Ajouter les entrées à `SIGNATURES`, relancer `npx vitest run viz/les-ficelles/data` (vert), puis lister ces entrées dans la section « À décider » de la fiche, sous le titre « Titres à vérifier à l’oreille », une ligne par entrée (ficelle, auteur, titre, passage, source). Si une ficelle n'a aucune source trouvée, l'écrire aussi.

- [ ] **Étape 7 : commiter la recherche.**

```bash
git add viz/les-ficelles/data/signatures.ts docs/chantiers/les-ficelles.md
git commit -m "docs(les-ficelles): titres à vérifier à l’oreille

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Étape 8 (auteur) : validation à l'oreille.** L'auteur écoute chaque titre au piano et dit lesquels garder. Pour chaque titre gardé, passer `etat` à `'valide'` ; supprimer les autres ; commiter (`docs(les-ficelles): titres validés par l’auteur`). Tant que ce n'est pas fait, la tâche reste ouverte dans la fiche ; elle ne bloque pas la tâche 12.

---

### Tâche 12 : vérifications finales, image d'aperçu et fiche

**Fichiers :**
- Remplacer : `viz/les-ficelles/og/build-og.ts`, `viz/les-ficelles/README.md`
- Créer (par la commande) : `public/og/les-ficelles.png`
- Modifier : `docs/chantiers/les-ficelles.md`, `docs/chantiers/README.md`

- [ ] **Étape 1 : écrire `viz/les-ficelles/og/build-og.ts`.**

```ts
/**
 * Image d'aperçu des liens (1200×630) pour « Les ficelles » : la progression banale, puis ce qu'en font trois ficelles.
 *
 *   npm run og -- les-ficelles
 */
import { OG_FONTS, OG_HEIGHT, OG_WIDTH, createOgCanvas, readLightTokens, registerSiteFonts, writeOgImage } from '@tools/og';
import { cliche } from '../domain/grille';
import { nomAccord } from '../domain/orthographe';
import { EXEMPLE, rejouer } from '../domain/pile';

export default async function buildOg(): Promise<void> {
  await registerSiteFonts();
  const t = await readLightTokens();
  const canvas = createOgCanvas();
  const ctx = canvas.getContext('2d');
  const pad = 72;
  const avant = cliche(0).map(nomAccord).join(' – ');
  const apres = rejouer(cliche(0), EXEMPLE).grille.map(nomAccord).join(' – ');

  ctx.fillStyle = t.page!;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  ctx.fillStyle = t['ink-3']!;
  ctx.font = `600 20px ${OG_FONTS.ui}`;
  ctx.fillText('MUSIQUE · HARMONIE · APPRENDRE', pad, 120);

  ctx.fillStyle = t.ink!;
  ctx.font = `300 84px ${OG_FONTS.display}`;
  ctx.fillText('Les ficelles', pad, 220, OG_WIDTH - pad * 2);

  ctx.fillStyle = t['ink-3']!;
  ctx.font = `400 34px ${OG_FONTS.ui}`;
  ctx.fillText(avant, pad, 330, OG_WIDTH - pad * 2);

  ctx.fillStyle = t.accent!;
  ctx.font = `500 34px ${OG_FONTS.ui}`;
  ctx.fillText('↓ trois ficelles', pad, 390);

  ctx.fillStyle = t.ink!;
  ctx.font = `400 40px ${OG_FONTS.ui}`;
  ctx.fillText(apres, pad, 460, OG_WIDTH - pad * 2);

  ctx.fillStyle = t['ink-2']!;
  ctx.font = `400 26px ${OG_FONTS.ui}`;
  ctx.fillText('Six procédés de la chanson française, à voir sur la portée et à écouter.', pad, 540, OG_WIDTH - pad * 2);

  console.log(`écrit ${await writeOgImage('les-ficelles', canvas)}`);
}
```

Commande : `npm run og -- les-ficelles` → « écrit public/og/les-ficelles.png ». Ouvrir l'image (outil Read) et vérifier qu'aucun texte ne déborde.

- [ ] **Étape 2 : remplacer `viz/les-ficelles/README.md`.**

```markdown
# Les ficelles

Six procédés de la chanson française des années 70 pour transformer une progression simple : à voir sur la portée, à écouter, à garder ou non.

- Fiche de chantier : `docs/chantiers/les-ficelles.md`.
- Pas de données : des règles écrites et testées (`domain/ficelles/`), une réalisation à quatre voix dans le socle (`src/shell/music/realisation.ts`).
- Titres signés : `data/signatures.ts`, affichés seulement une fois validés à l’oreille par l’auteur.
- Dépend de `viz/compose-ta-progression/state.ts` (`KEY_NAMES`).

## Avant de publier

- [ ] Au moins une ficelle sur deux porte un titre validé.
- [ ] L'affichage a été vérifié en clair, en sombre et sur mobile (375 px), et sur le téléphone de l'auteur.
- [ ] L'image d'aperçu est générée : `npm run og -- les-ficelles`.
- [ ] Dans `src/shell/site.ts`, le statut passe de `draft` à `published`, avec le mois de publication (décision de l'auteur).
```

- [ ] **Étape 3 : passe de vérification complète** (configuration `atlas-dev`, page `/viz/les-ficelles/`) : refaire les contrôles de la tâche 9 (étapes 5.1 à 5.9) et de la tâche 10 (étape 4), plus :
  - au clavier seul : tabulation jusqu'à une carte, Entrée, tabulation jusqu'à une mesure allumée, Entrée, *Garder* ;
  - `prefers-reduced-motion` : rien ne glisse (la page n'a pas d'animation ; vérifier qu'aucune n'a été ajoutée) ;
  - à 375 px en sombre : capture d'écran pour l'auteur ;
  - build de production : `npm run build` vert.

- [ ] **Étape 4 : mettre la fiche à jour.** Cocher « Vérifications clair / sombre / 375 px, image d’aperçu », mettre à jour la ligne 3j de `docs/chantiers/README.md` (« construite en brouillon sur `feat/les-ficelles`, en attente de relecture et des titres à valider »), et réécrire la « Prochaine action » : relecture de l'auteur (sur téléphone), validation des titres à l'oreille, choix du nom définitif, puis décision de publication.

- [ ] **Étape 5 : `npm test`, `npm run typecheck`, commiter.**

```bash
git add viz/les-ficelles public/og/les-ficelles.png docs/chantiers
git commit -m "feat(les-ficelles): image d’aperçu, vérifications et fiche à jour

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
