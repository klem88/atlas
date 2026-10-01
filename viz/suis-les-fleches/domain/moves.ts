/** Ce qui se passe entre deux accords : le mouvement de la fondamentale, les notes communes, et une phrase pour le dire. */
import type { TriadClass } from '@shell/music/chords';
import type { Degree } from '@shell/music/degrees';
import { chordName } from '../../compose-ta-progression/domain/next';
import { chordOfDegree, FN_LABELS, type Fn } from './layout';

export type MoveKind = 'meme' | 'quinte-desc' | 'quinte-asc' | 'seconde-asc' | 'seconde-desc' | 'tierce-asc' | 'tierce-desc' | 'triton';

/** Demi-tons montés par la fondamentale (0 à 11). */
export const rootMotion = (a: Degree, b: Degree) => (((b.step - a.step) % 12) + 12) % 12;

export function moveKind(a: Degree, b: Degree): MoveKind {
  const d = rootMotion(a, b);
  if (d === 0) return 'meme';
  if (d === 5) return 'quinte-desc'; // monter d'une quarte = descendre d'une quinte
  if (d === 7) return 'quinte-asc';
  if (d === 1 || d === 2) return 'seconde-asc';
  if (d === 10 || d === 11) return 'seconde-desc';
  if (d === 3 || d === 4) return 'tierce-asc';
  if (d === 8 || d === 9) return 'tierce-desc';
  return 'triton';
}

const INTERVALS: Record<TriadClass, number[]> = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], sus: [0, 5, 7], other: [0, 7] };

/** Classes de hauteur d'un degré (0 = tonique). */
export const pitchClasses = (d: Degree): number[] => INTERVALS[d.cls].map((i) => (d.step + i) % 12);

/** Notes communes à deux accords, en classes de hauteur relatives à la tonique, dans l'ordre du premier accord. */
export function commonTones(a: Degree, b: Degree): number[] {
  const other = new Set(pitchClasses(b));
  return pitchClasses(a).filter((pc) => other.has(pc));
}

const KIND_TEXT: Record<MoveKind, string> = {
  meme: 'on reste',
  'quinte-desc': 'quinte descendante, le pas le plus naturel',
  'quinte-asc': 'quinte montante, le cycle des quintes à rebours',
  'seconde-asc': 'un pas vers le haut, un élan',
  'seconde-desc': 'un pas vers le bas',
  'tierce-asc': 'une tierce, un glissement doux',
  'tierce-desc': 'une tierce, un glissement doux',
  triton: 'un saut de triton, le plus lointain',
};

/** Le nom d'une note (classe de hauteur relative) dans la tonalité, en minuscules : « sol », « si♭ ». */
export const noteName = (pc: number, tonic: number) => chordName({ step: pc, cls: 'maj' }, tonic).toLowerCase();

const FROM: Record<Fn, string> = { repos: 'du repos', depart: 'du départ', tension: 'de la tension' };
const TO: Record<Fn, string> = { repos: 'au repos', depart: 'au départ', tension: 'à la tension' };

/** Pourquoi ce pas « marche », en une phrase courte. */
function functionText(a: Degree, b: Degree): string | null {
  const fa = chordOfDegree(a)?.fn;
  const fb = chordOfDegree(b)?.fn;
  if (!fa || !fb) return null;
  if (b.step === 0 && b.cls === 'maj' && fa === 'tension') return 'la tension se résout : retour à la maison';
  if (b.step === 0 && b.cls === 'maj' && a.step === 5 && a.cls === 'maj') return 'retour à la maison en douceur, sans passer par la tension (la cadence « amen »)';
  if (b.step === 0 && b.cls === 'maj') return 'retour à la maison';
  if (a.step === 0 && a.cls === 'maj') return `on quitte la maison vers ${fb === 'tension' ? 'la tension' : fb === 'depart' ? 'le départ' : 'un autre repos'}`;
  if (fa === fb) return `on reste dans la zone « ${FN_LABELS[fa].name} »`;
  return `${FROM[fa]} ${TO[fb]}`;
}

/** « Sol → Do : quinte descendante, le pas le plus naturel ; la tension se résout : retour à la maison. 1 note en commun : sol. » */
export function moveSentence(a: Degree, b: Degree, tonic: number): string {
  const head = `${chordName(a, tonic)} → ${chordName(b, tonic)}`;
  const kind = moveKind(a, b);
  if (kind === 'meme') return `${head} : on reste sur le même accord.`;
  const fn = functionText(a, b);
  const common = commonTones(a, b);
  const tones = common.length === 0 ? 'Aucune note en commun.' : `${common.length} note${common.length > 1 ? 's' : ''} en commun : ${common.map((pc) => noteName(pc, tonic)).join(', ')}.`;
  return `${head} : ${KIND_TEXT[kind]}${fn ? ` ; ${fn}` : ''}. ${tones}`;
}
