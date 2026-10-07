/**
 * Les onze progressions, écrites en degrés pour être jouées dans n'importe quelle tonalité.
 * Chaque accord porte son mode ; chaque progression porte les motifs qui servent à la compter dans l'iRb
 * (intervalles depuis le premier accord, qualités admises), indépendamment de la tonalité du morceau.
 */
import type { Quality } from '@shell/music/chords';
import { doublesAlterations, type ModeId } from './modes';
import { enharmonique, pitchOfName, spellDegree, tonicName, type Mode } from './spelling';

export type Qualite = 'm7' | '7' | '7alt' | '7M' | '6' | 'ø' | 'm6' | '°7';

export interface QualiteInfo {
  /** Suffixe du nom d'accord (« Ré m7 », « Sol 7 »). */
  suffixe: string;
  /** Notes de l'accord, en demi-tons depuis la fondamentale. */
  notes: readonly number[];
  /** Notes guides : la 3ce et la 7e (la 6te pour les accords de sixte et le diminué). */
  guides: readonly [number, number];
  /** Voicing à quatre sons, sans fondamentale quand c'est possible (Bill Evans, Mark Levine). */
  voicing: readonly number[];
}

export const QUALITES: Readonly<Record<Qualite, QualiteInfo>> = {
  m7: { suffixe: 'm7', notes: [0, 3, 7, 10], guides: [3, 10], voicing: [3, 7, 10, 2] },
  '7': { suffixe: '7', notes: [0, 4, 7, 10], guides: [4, 10], voicing: [4, 9, 10, 2] },
  '7alt': { suffixe: '7alt', notes: [0, 4, 10, 1, 8], guides: [4, 10], voicing: [4, 8, 10, 1] },
  '7M': { suffixe: '7M', notes: [0, 4, 7, 11], guides: [4, 11], voicing: [4, 7, 11, 2] },
  '6': { suffixe: '6', notes: [0, 4, 7, 9], guides: [4, 9], voicing: [4, 7, 9, 2] },
  ø: { suffixe: 'ø', notes: [0, 3, 6, 10], guides: [3, 10], voicing: [3, 6, 10, 0] },
  m6: { suffixe: 'm6', notes: [0, 3, 7, 9], guides: [3, 9], voicing: [3, 7, 9, 2] },
  '°7': { suffixe: '°7', notes: [0, 3, 6, 9], guides: [3, 9], voicing: [0, 3, 6, 9] },
};

export interface AccordGrille {
  /** Degré depuis la tonique de la progression, compté sur la gamme majeure (« 2 », « b2 », « #1 »). */
  degre: string;
  qualite: Qualite;
  /** Durée en temps (4 = une mesure). */
  temps: number;
  /** Chiffrage affiché sous le nom (« ii m7 », « V7alt »). */
  chiffrage: string;
  mode: ModeId;
}

/** Un motif à chercher dans l'iRb : intervalle depuis le premier accord, et qualités admises. */
export interface Motif {
  intervalle: number;
  qualites: readonly Quality[];
}

export interface Progression {
  id: string;
  titre: string;
  /** Les degrés, en une ligne. */
  court: string;
  mode: Mode;
  /** Où on l'entend. */
  ou: string;
  /** Deux ou trois phrases : ce qui se passe dans cette progression. */
  explication: string;
  accords: readonly AccordGrille[];
  /** Variantes comptées dans l'iRb : un morceau compte s'il contient l'une d'elles. */
  motifs: readonly (readonly Motif[])[];
  /** Tonique par défaut (classe de hauteur). */
  tonique: number;
}

const MAJ: Quality[] = ['maj', 'maj7'];
const M7: Quality[] = ['min7'];
const MIN: Quality[] = ['min', 'min7'];
const DOM: Quality[] = ['dom7'];
const m = (intervalle: number, qualites: readonly Quality[]): Motif => ({ intervalle, qualites });
const a = (degre: string, qualite: Qualite, temps: number, chiffrage: string, mode: ModeId): AccordGrille => ({ degre, qualite, temps, chiffrage, mode });

export const PROGRESSIONS: readonly Progression[] = [
  {
    id: 'ii-v-i',
    titre: 'ii–V–I majeur',
    court: 'ii–V–I',
    mode: 'majeur',
    tonique: 0,
    ou: 'Partout : c’est la cellule de base du jazz.',
    explication: 'Trois accords qui descendent par quintes. La 7e du ii devient la 3ce du V, la 7e du V devient la 3ce du I : deux voix qui descendent d’un demi-ton, et c’est tout le mouvement.',
    accords: [a('2', 'm7', 4, 'ii m7', 'dorien'), a('5', '7', 4, 'V7', 'mixolydien'), a('1', '7M', 8, 'I 7M', 'ionien')],
    motifs: [[m(0, M7), m(5, DOM), m(10, MAJ)]],
  },
  {
    id: 'ii-v-i-mineur',
    titre: 'ii–V–i mineur',
    court: 'iiø–V7alt–i',
    mode: 'mineur',
    tonique: 9,
    ou: '*Blue Bossa*, *Autumn Leaves*, *Alone Together*, *Softly as in a Morning Sunrise*.',
    explication: 'La même cellule en mineur : le ii devient demi-diminué, le V prend toutes ses tensions altérées, et le i se pose en m6. Plus sombre, plus tendu, et la résolution n’en est que plus douce.',
    accords: [a('2', 'ø', 4, 'iiø', 'locrien'), a('5', '7alt', 4, 'V7alt', 'altere'), a('1', 'm6', 8, 'i m6', 'melodique')],
    motifs: [[m(0, ['hdim']), m(5, DOM), m(10, MIN)]],
  },
  {
    id: 'autumn-leaves',
    titre: 'Majeur puis relatif mineur',
    court: 'ii–V–I–IV–viiø–III7–vi',
    mode: 'majeur',
    tonique: 10,
    ou: '*Autumn Leaves* (*Les Feuilles mortes*), *I Will Survive*, *Fly Me to the Moon*.',
    explication: 'Un ii–V–I majeur, puis un ii–V–i dans le relatif mineur, reliés par le IV. Les fondamentales descendent par quintes sur toute la grille : sept accords, et la boucle revient d’elle-même.',
    accords: [
      a('2', 'm7', 4, 'ii m7', 'dorien'),
      a('5', '7', 4, 'V7', 'mixolydien'),
      a('1', '7M', 4, 'I 7M', 'ionien'),
      a('4', '7M', 4, 'IV 7M', 'lydien'),
      a('7', 'ø', 4, 'viiø', 'locrien'),
      a('3', '7alt', 4, 'III7alt', 'altere'),
      a('6', 'm6', 8, 'vi m6', 'melodique'),
    ],
    motifs: [[m(0, MAJ), m(5, MAJ), m(11, ['hdim']), m(4, DOM), m(9, MIN)]],
  },
  {
    id: 'turnaround',
    titre: 'Turnaround I–vi–ii–V',
    court: 'I–VI7–ii–V',
    mode: 'majeur',
    tonique: 0,
    ou: '*I Got Rhythm*, *Blue Moon*, et la fin de presque toutes les grilles.',
    explication: 'Le tour qui ramène au début. En jazz, le vi devient souvent VI7 : une dominante qui pousse vers le ii, avec une ♭9 qui annonce le mineur.',
    accords: [a('1', '7M', 2, 'I 7M', 'ionien'), a('6', '7', 2, 'VI7', 'phrygienDominant'), a('2', 'm7', 2, 'ii m7', 'dorien'), a('5', '7', 2, 'V7', 'mixolydien')],
    motifs: [[m(0, MAJ), m(9, ['min7', 'dom7']), m(2, ['min7', 'dom7']), m(7, DOM)]],
  },
  {
    id: 'iii-vi-ii-v',
    titre: 'iii–VI–ii–V',
    court: 'iii–VI7–ii–V–I',
    mode: 'majeur',
    tonique: 0,
    ou: '*I Got Rhythm* et tous les morceaux sur ses accords, la fin de *Fly Me to the Moon*.',
    explication: 'Le turnaround qui commence sur le iii au lieu du I : quatre accords qui descendent par quintes avant de se poser. Le iii est un I déguisé, avec la même couleur et une note de basse en plus.',
    accords: [
      a('3', 'm7', 2, 'iii m7', 'phrygien'),
      a('6', '7', 2, 'VI7', 'phrygienDominant'),
      a('2', 'm7', 2, 'ii m7', 'dorien'),
      a('5', '7', 2, 'V7', 'mixolydien'),
      a('1', '7M', 8, 'I 7M', 'ionien'),
    ],
    motifs: [[m(0, M7), m(5, DOM), m(10, M7), m(3, DOM)]],
  },
  {
    id: 'dominantes',
    titre: 'Dominantes en chaîne',
    court: 'III7–VI7–II7–V7–I',
    mode: 'majeur',
    tonique: 10,
    ou: 'Le pont des *Rhythm changes* (*Oleo*, *Anthropology*), *Sweet Georgia Brown*.',
    explication: 'Quatre dominantes qui se résolvent chacune sur la suivante, une quinte plus bas. À chaque accord, la 7e descend d’un demi-ton sur la 3ce du suivant : avec deux notes, on entend toute la chaîne.',
    accords: [
      a('3', '7', 4, 'III7', 'mixolydien'),
      a('6', '7', 4, 'VI7', 'mixolydien'),
      a('2', '7', 4, 'II7', 'mixolydien'),
      a('5', '7', 4, 'V7', 'mixolydien'),
      a('1', '7M', 8, 'I 7M', 'ionien'),
    ],
    motifs: [[m(0, DOM), m(5, DOM), m(10, DOM)]],
  },
  {
    id: 'vers-le-iv',
    titre: 'ii–V vers le IV, puis IV–iv',
    court: 'I–v–I7–IV–iv–I',
    mode: 'majeur',
    tonique: 0,
    ou: '*All of Me*, *Misty*, *Just Friends*, *There Will Never Be Another You*.',
    explication: 'Le I devient I7 : c’est la dominante du IV, et le v m7 qui le précède en fait un ii–V. Puis le IV passe au mineur (iv m6) : une couleur empruntée au mineur, la plus nostalgique du jazz, avant de rentrer au I.',
    accords: [
      a('1', '7M', 4, 'I 7M', 'ionien'),
      a('5', 'm7', 2, 'v m7', 'dorien'),
      a('1', '7', 2, 'I7', 'mixolydien'),
      a('4', '7M', 4, 'IV 7M', 'lydien'),
      a('4', 'm6', 4, 'iv m6', 'melodique'),
      a('1', '7M', 8, 'I 7M', 'ionien'),
    ],
    motifs: [
      [m(0, MAJ), m(0, DOM), m(5, MAJ)],
      [m(0, MAJ), m(7, M7), m(0, DOM), m(5, MAJ)],
      [m(0, MAJ), m(0, MIN), m(7, MAJ)],
    ],
  },
  {
    id: 'tritonique',
    titre: 'Substitution tritonique',
    court: 'ii–♭II7–I',
    mode: 'majeur',
    tonique: 0,
    ou: '*The Girl from Ipanema* (section A), et d’innombrables fins de morceaux bebop.',
    explication: 'On remplace le V7 par la dominante située un triton plus loin : mêmes notes guides (la 3ce et la 7e s’échangent), mais la basse descend par demi-tons, ii, ♭II, I.',
    accords: [a('2', 'm7', 4, 'ii m7', 'dorien'), a('b2', '7', 4, 'subV7', 'lydienB7'), a('1', '7M', 8, 'I 7M', 'ionien')],
    motifs: [[m(0, M7), m(11, DOM), m(10, MAJ)]],
  },
  {
    id: 'backdoor',
    titre: 'Backdoor',
    court: 'iv–♭VII7–I',
    mode: 'majeur',
    tonique: 0,
    ou: '*Lady Bird*, *There Will Never Be Another You*, *Stella by Starlight*, *Misty*.',
    explication: 'On entre dans le I « par la porte de derrière » : au lieu du V7, une dominante un ton en dessous, préparée par le iv mineur. La résolution est plus douce, comme un soupir.',
    accords: [a('4', 'm7', 4, 'iv m7', 'dorien'), a('b7', '7', 4, '♭VII7', 'mixolydien'), a('1', '7M', 8, 'I 7M', 'ionien')],
    motifs: [
      [m(0, MIN), m(5, DOM), m(7, MAJ)],
      [m(0, DOM), m(2, MAJ)],
    ],
  },
  {
    id: 'ii-v-chromatiques',
    titre: 'ii–V en chaîne qui descendent',
    court: 'ii–V / ii–V un demi-ton plus bas',
    mode: 'majeur',
    tonique: 0,
    ou: '*Satin Doll*, *Blues for Alice*.',
    explication: 'Un ii–V, puis le même un demi-ton plus bas, puis encore : chaque paire est un petit ii–V dans sa propre tonalité, qui ne se résout pas et glisse vers le suivant. On joue dorien puis mixolydien, chaque fois depuis une nouvelle fondamentale.',
    accords: [
      a('3', 'm7', 2, 'ii/ii', 'dorien'),
      a('6', '7', 2, 'V/ii', 'mixolydien'),
      a('b3', 'm7', 2, '♭iii m7', 'dorien'),
      a('b6', '7', 2, '♭VI7', 'mixolydien'),
      a('2', 'm7', 2, 'ii m7', 'dorien'),
      a('5', '7', 2, 'V7', 'mixolydien'),
      a('1', '7M', 4, 'I 7M', 'ionien'),
    ],
    motifs: [[m(0, M7), m(5, DOM), m(11, M7), m(4, DOM)]],
  },
  {
    id: 'diminue',
    titre: 'Diminué de passage',
    court: 'I–♯I°7–ii–V',
    mode: 'majeur',
    tonique: 0,
    ou: '*Ain’t Misbehavin’*, *Have You Met Miss Jones*.',
    explication: 'Entre le I et le ii, un accord diminué sur le demi-ton qui les sépare : la basse monte chromatiquement, et l’accord diminué agit comme une dominante sans fondamentale (un VI7♭9) qui tire vers le ii.',
    accords: [a('1', '7M', 2, 'I 7M', 'ionien'), a('#1', '°7', 2, '♯i°7', 'tonDemiTon'), a('2', 'm7', 2, 'ii m7', 'dorien'), a('5', '7', 2, 'V7', 'mixolydien')],
    motifs: [[m(0, MAJ), m(1, ['dim']), m(2, MIN)]],
  },
];

/**
 * Voicing de l'accord, accordé à son mode : une dominante vers un mineur prend ♭9 et ♭13 comme la dominante
 * altérée ; un m7 phrygien n'a pas de 9e juste, il garde sa fondamentale.
 */
export function voicingDe(acc: Pick<AccordGrille, 'qualite' | 'mode'>): readonly number[] {
  if (acc.qualite === 'm7' && acc.mode === 'phrygien') return [3, 7, 10, 0];
  if (acc.qualite === '7' && acc.mode === 'phrygienDominant') return QUALITES['7alt'].voicing;
  return QUALITES[acc.qualite].voicing;
}

export function progression(id: string): Progression {
  return PROGRESSIONS.find((p) => p.id === id) ?? PROGRESSIONS[0]!;
}

/** Un accord de la grille dans une tonalité donnée. */
export interface AccordJoue extends AccordGrille {
  /** Classe de hauteur de la fondamentale. */
  racine: number;
  /** Nom de la fondamentale (« Ré♭ »). */
  note: string;
  /** Nom complet (« Ré♭ 7 »). */
  nom: string;
  /** Début, en temps depuis le début de la grille. */
  debut: number;
}

/**
 * Do♭, Fa♭, Mi♯ et Si♯ sont justes en théorie (le ♭II de si♭ est do♭) mais les grilles de jazz écrivent Si 7 :
 * on les remplace par la note naturelle, dont les notes de mode restent lisibles.
 */
const ENHARMONIQUES: Readonly<Record<string, string>> = { 'Do♭': 'Si', 'Fa♭': 'Mi', 'Mi♯': 'Fa', 'Si♯': 'Do' };
const respeller = (note: string) => ENHARMONIQUES[note] ?? note;

export function transpose(p: Progression, tonique: number): AccordJoue[] {
  const t = tonicName(tonique, p.mode);
  let debut = 0;
  return p.accords.map((acc) => {
    let note = respeller(spellDegree(t, acc.degre));
    // Sol♭ m7 en mi♭ demanderait si𝄫 : on l'écrit Fa♯ m7, comme les grilles (c'est le ii de Si 7). Un accord altéré
    // en demande parfois sous ses deux noms : on garde celui qui en demande le moins.
    const autre = enharmonique(note);
    if (doublesAlterations(autre, acc.mode) < doublesAlterations(note, acc.mode)) note = autre;
    const joue: AccordJoue = { ...acc, racine: pitchOfName(note), note, nom: `${note} ${QUALITES[acc.qualite].suffixe}`, debut };
    debut += acc.temps;
    return joue;
  });
}

export const dureeGrille = (p: Progression) => p.accords.reduce((s, x) => s + x.temps, 0);

/** Durée d'une grille déjà transposée, en temps. */
export const dureeGrilleJouee = (accords: readonly AccordJoue[]) => accords.reduce((s, x) => s + x.temps, 0);

/** Nom de la tonalité affichée (« Si♭ majeur », « La mineur »). */
export function nomTonalite(p: Progression, tonique: number): string {
  return `${tonicName(tonique, p.mode)} ${p.mode}`;
}
