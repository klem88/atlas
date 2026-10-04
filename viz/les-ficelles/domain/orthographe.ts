/**
 * L'orthographe : chaque note s'écrit sur une lettre (do, ré…) avec une altération, d'après la tonalité et l'accord.
 * Fa m s'écrit avec un la♭ (la tierce de fa est une sorte de la), Mi7 avec un sol♯. Indispensable pour lire la portée.
 */
import { alterationSur, lettreDansLaTonalite, lettreDe, mod12, notesDe, type Accord } from './grille';

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

const NOMS = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'];
const ALTERATIONS = ['♭♭', '♭', '', '♯', '♯♯'];
/** Écrit une classe de hauteur sur une lettre donnée (sol♯ plutôt que la♭ si la lettre est sol). */
export const surLettre = (pc: number, lettre: number): NoteEcrite => ({ lettre, alteration: alterationSur(pc, lettre) });

/** Une classe de hauteur lue dans une tonalité majeure (♭ pour les degrés abaissés, ♯ pour le IV haussé). */
export const dansLaTonalite = (pc: number, key: number): NoteEcrite => surLettre(pc, lettreDansLaTonalite(pc, key));

/** La fondamentale de l'accord : sur sa lettre fixée (Do♯ tapé, Do♯7 avant Fa♯7), sinon lue dans la tonalité. */
export const fondamentale = (a: Accord): NoteEcrite => surLettre(a.root, lettreDe(a));

/** Les notes de l'accord : la fondamentale (sa lettre), puis tierce, quinte, septième sur les lettres suivantes. */
export function ecrireAccord(a: Accord): NoteEcrite[] {
  const f = fondamentale(a);
  return notesDe(a).map((pc, k) => surLettre(pc, (f.lettre + 2 * k) % 7));
}

/**
 * Une hauteur (classe ou MIDI) dans un accord : comme note de l'accord si elle en est, sinon dans la tonalité (la basse
 * de Fa/Sol). Quand la fondamentale a changé de lettre (une montée de Fa♯ à Sol♯ : Do♯ et non Ré♭), la basse suit le même
 * décalage (Do♯/Ré♯ et non Do♯/Mi♭), tant qu'elle garde un seul dièse ou bémol.
 */
export function ecrireDans(pc: number, a: Accord): NoteEcrite {
  const k = notesDe(a).indexOf(mod12(pc));
  if (k >= 0) return ecrireAccord(a)[k]!;
  const tonalite = dansLaTonalite(mod12(pc), a.key);
  const decalage = lettreDe(a) - lettreDansLaTonalite(a.root, a.key);
  if (decalage === 0) return tonalite;
  const suivie = surLettre(mod12(pc), (((tonalite.lettre + decalage) % 7) + 7) % 7);
  return Math.abs(suivie.alteration) <= 1 ? suivie : tonalite;
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
  return `${majuscule(nomNote(fondamentale(a)))}${SUFFIXE[a.couleur]}${basse}`;
}
