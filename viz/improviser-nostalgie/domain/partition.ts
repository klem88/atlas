/**
 * Partitions de « Improviser sur trois grilles nostalgiques », en notation ABC (voir src/shell/music/score.ts pour les conventions).
 * Avec L:1/8 : un « 8 » est une ronde, un « 4 » une blanche, un « 2 » une noire. C = do4 (do central), C, = do3, c = do5.
 * Une altération vaut pour le reste de la mesure.
 *
 * Trois grilles de huit mesures, une même méthode en six étapes. La main gauche ne change pas d'une
 * étape à l'autre : la basse sur le premier temps, puis deux notes de l'accord tenues (le plus souvent
 * la 3ce et la 7e), choisies pour bouger le moins possible d'un accord au suivant.
 * Chaque étape de main droite est écrite accord par accord : un segment par accord, dans l'ordre de la grille.
 */
import { pianoTune } from '@shell/music/score';

export type GrilleId = 'feuilles' | 'chromatique' | 'douce-amere';

export const ETAPES = ['etape-1', 'etape-2', 'etape-3', 'etape-4', 'etape-5', 'etape-6'] as const;
export type EtapeId = (typeof ETAPES)[number];

export interface Accord {
  nom: string;
  /** Degré en chiffres romains (voir « Comment lire » sur la page). */
  degre: string;
  /** Main gauche pendant l'accord : la basse en noire, puis les deux notes tenues. */
  lh: string;
}

export interface Grille {
  id: GrilleId;
  titre: string;
  /** Mesures de la grille ; une mesure à deux accords donne deux temps à chacun. */
  mesures: Accord[][];
  /** Main droite des étapes 2 à 6 : un segment par accord. L'étape 1 est la main gauche seule. */
  rh: Record<Exclude<EtapeId, 'etape-1'>, string[]>;
}

const plein = (nom: string, degre: string, basse: string, haut: string): Accord => ({ nom, degre, lh: `${basse}2 ${haut}6` });
const demi = (nom: string, degre: string, basse: string, haut: string): Accord => ({ nom, degre, lh: `${basse}2 ${haut}2` });

/**
 * Le cycle des quintes, la grille des « Feuilles mortes » (Kosma, 1945), en La mineur.
 * Un ii–V–I en Do (Ré m7, Sol7, Do7M), un pas de côté sur Fa7M, puis le même chemin vers La mineur
 * (Si m7♭5, Mi7, La m7). Analysée en Do.
 */
const FEUILLES: Grille = {
  id: 'feuilles',
  titre: 'Le cycle des quintes',
  mesures: [
    [plein('Ré m7', 'ii7', 'D,,', '[F,C]')],
    [plein('Sol7', 'V7', 'G,,', '[F,B,]')],
    [plein('Do7M', 'I7M', 'C,', '[E,B,]')],
    [plein('Fa7M', 'IV7M', 'F,,', '[E,A,]')],
    [plein('Si m7♭5', 'viiø7', 'B,,', '[D,A,]')],
    [plein('Mi7', 'V7/vi', 'E,,', '[D,^G,]')],
    [plein('La m7', 'vi7', 'A,,', '[C,G,]')],
    [plein('La m7', 'vi7', 'A,,', '[C,G,]')],
  ],
  rh: {
    // La ligne guide : la 3ce ou la 7e de chaque accord, qui descend par petits pas.
    'etape-2': ['"_7"c8', '"_3"B8', '"_7M"B8', '"_3"A8', '"_7"A8', '"_3"^G8', '"_1"A8', '"_3"c8'],
    // Une seule gamme, les touches blanches, sauf le sol♯ de Mi7.
    'etape-3': ['A B c d e2 d2', 'c B A G F4', 'E F G A B4', 'c B A G A4', 'd B A G F4', 'B, D E ^G B4', 'e d c B c4', 'A8'],
    // Notes cibles : la ligne guide sur le premier temps, puis une promenade dans la gamme.
    'etape-4': ['"_7"c2 d2 c A F2', '"_3"B2 c d B G F2', '"_7M"B4 A G E2', '"_3"A2 G A c4', '"_7"A2 B d B A F2', '"_3"^G4 B A ^G E', '"_3"c4 B c e2', '"_1"A8'],
    // Un motif (noire, deux croches, blanche) qui descend d'une marche à chaque accord.
    'etape-5': ['e2 d c A4', 'd2 c B G4', 'c2 B A E4', 'B2 A G E4', 'A2 G F D4', '^G2 F E D4', 'c2 B A E4', 'A8'],
    // Question (deux mesures qui restent en l'air), réponse (deux mesures qui se posent).
    'etape-6': ['z2 A B c2 e2', 'd6 z2', 'z2 e d c2 B2', 'A6 z2', 'z2 F A c2 B2', '^G6 z2', 'z2 B c e2 c2', 'A6 z2'],
  },
};

/** La basse chromatique : la main droite tient, la basse descend la, sol♯, sol, fa♯, fa. Analysée en La mineur. */
const CHROMATIQUE: Grille = {
  id: 'chromatique',
  titre: 'La basse qui descend',
  mesures: [
    [plein('La m', 'i', 'A,,', '[C,E,]')],
    [plein('La m/Sol♯', 'i/♯7', '^G,,', '[C,E,]')],
    [plein('La m/Sol', 'i/♭7', '=G,,', '[C,E,]')],
    [plein('La m/Fa♯', 'i/♯6', '^F,,', '[C,E,]')],
    [plein('Fa7M', 'VI7M', '=F,,', '[C,E,]')],
    [plein('Ré m7', 'iv7', 'D,,', '[C,F,]')],
    [demi('Mi7sus4', 'V7sus4', 'E,,', '[D,A,]'), demi('Mi7', 'V7', 'E,,', '[D,^G,]')],
    [plein('La m', 'i', 'A,,', '[C,A,]')],
  ],
  rh: {
    // Le mi du haut ne bouge pas pendant que la basse descend, puis la sensible sol♯ remonte au la.
    'etape-2': ['"_5"e8', '"_5"e8', '"_5"e8', '"_5"e8', '"_7M"e8', '"_3"f8', '"_4"a4', '"_3"^g4', '"_1"a8'],
    // Touches blanches, mais pas de sol sur la basse sol♯, ni de fa sur la basse fa♯.
    'etape-3': ['A B c d e4', 'd c B A c4', 'c B A G A4', 'e d c B A4', 'c d e f e4', 'd c A F A4', 'B2 A2', '^G2 E2', 'A8'],
    'etape-4': ['"_3"c2 B A E2 A2', '"_3"c2 B A E4', '"_3"c2 d c A4', '"_3"c2 e d A4', '"_7M"e2 d c A4', '"_3"f2 e d A4', '"_4"a2 e2', '"_3"^g2 e2', '"_1"a8'],
    // Le même motif cinq mesures de suite : c'est la basse qui le recolore.
    'etape-5': ['c2 B A e4', 'c2 B A e4', 'c2 B A e4', 'c2 B A e4', 'c2 B A e4', 'd2 c A f4', 'e2 d B', '^g4', 'a8'],
    // La réponse reprend la question et change seulement la fin.
    'etape-6': ['z2 E A c2 B2', 'B6 z2', 'z2 E A c2 B2', 'A6 z2', 'z2 A c e2 d2', 'f6 z2', 'z2 B c', 'B2 ^G2', 'A6 z2'],
  },
};

/** La douce-amère : une grille majeure, et le Fa m6 qui serre le cœur. Analysée en Do. */
const DOUCE_AMERE: Grille = {
  id: 'douce-amere',
  titre: 'La douce-amère',
  mesures: [
    [plein('Do7M', 'I7M', 'C,,', '[E,B,]')],
    [plein('Mi m7', 'iii7', 'E,,', '[D,G,]')],
    [plein('Fa7M', 'IV7M', 'F,,', '[E,A,]')],
    [plein('Fa m6', 'iv6', 'F,,', '[D,_A,]')],
    [plein('Do/Sol', 'I⁶₄', 'G,,', '[E,G,]')],
    [plein('La m7', 'vi7', 'A,,', '[E,G,]')],
    [demi('Ré m7', 'ii7', 'D,,', '[F,A,]'), demi('Sol7sus4', 'V7sus4', 'G,,', '[F,C]')],
    [plein('Do', 'I', 'C,,', '[E,C]')],
  ],
  rh: {
    'etape-2': ['"_3"e8', '"_7"d8', '"_7M"e8', '"_♭3"_a8', '"_5"g8', '"_7"g8', '"_3"f4', '"_7"f4', '"_3"e8'],
    // Touches blanches, sauf sur Fa m6 : le la devient la♭.
    'etape-3': ['G A B c e4', 'd c B A G4', 'A B c d e4', 'd c _A G F4', 'G c e d c4', 'B A G E A4', 'F A c2', 'd2 c2', 'c8'],
    'etape-4': ['"_3"e2 d c B4', '"_7"d2 e d B4', '"_7M"e2 f e c4', '"_♭3"_a2 g f d4', '"_5"g2 e c e4', '"_7"g2 e c A4', '"_3"f2 a2', '"_7"f2 d2', '"_3"e8'],
    // Un soupir : une note haute qui retombe. Le même dessin, ajusté à chaque accord.
    'etape-5': ['g2 e d B4', 'g2 e d B4', 'a2 f e c4', '_a2 f d c4', 'g2 e d c4', 'a2 e d c4', 'f2 d A', 'c4', 'e8'],
    'etape-6': ['z2 G A B2 c2', 'd6 z2', 'z2 c d e2 d2', 'c6 z2', 'z2 E G c2 e2', 'g6 z2', 'z2 f e', 'd2 c2', 'c6 z2'],
  },
};

export const GRILLES: readonly Grille[] = [FEUILLES, CHROMATIQUE, DOUCE_AMERE];

export const grille = (id: string): Grille => GRILLES.find((g) => g.id === id) ?? FEUILLES;

/** Accords de la grille dans l'ordre joué. */
export const accords = (g: Grille): Accord[] => g.mesures.flat();

/** Main droite d'une étape : chaque segment reçoit au-dessus le nom de son accord et son degré (`"^Ré m7|ii7"`). */
export function mainDroite(g: Grille, etape: EtapeId): string {
  const segments = etape === 'etape-1' ? g.mesures.flatMap((m) => m.map(() => (m.length === 1 ? 'z8' : 'z4'))) : g.rh[etape];
  const liste = accords(g);
  if (segments.length !== liste.length) throw new Error(`${g.id}, ${etape} : ${segments.length} segments pour ${liste.length} accords`);
  let i = 0;
  return `${g.mesures.map((m) => m.map(() => `"^${liste[i]!.nom}|${liste[i]!.degre}"${segments[i++]}`).join(' ')).join(' | ')} |]`;
}

/** Main gauche, la même à toutes les étapes. */
export const mainGauche = (g: Grille): string => `${g.mesures.map((m) => m.map((a) => a.lh).join(' ')).join(' | ')} |]`;

/** Les six partitions d'une grille, par identifiant d'étape. */
export function partitions(g: Grille): Record<EtapeId, string> {
  const lh = mainGauche(g);
  return Object.fromEntries(ETAPES.map((e) => [e, pianoTune({ rh: mainDroite(g, e), lh })])) as Record<EtapeId, string>;
}
