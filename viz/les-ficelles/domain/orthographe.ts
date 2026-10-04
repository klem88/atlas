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
