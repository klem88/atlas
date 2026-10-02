/** Ce qui se passe entre deux accords : le mouvement de la fondamentale, les notes communes, et une phrase pour le dire. */
import { FN_LABELS, type Fn } from './layout';
import { mod12, nameOf, noteName, pitchClassesOf, roleOf, sameChord, type Chord, type Role } from './harmony';

export type MoveKind = 'meme' | 'quinte-desc' | 'quinte-asc' | 'seconde-asc' | 'seconde-desc' | 'tierce-asc' | 'tierce-desc' | 'triton';

/** Demi-tons montés par la fondamentale (0 à 11). */
export const rootMotion = (a: Chord, b: Chord) => mod12(b.root - a.root);

export function moveKind(a: Chord, b: Chord): MoveKind {
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

/** Notes communes à deux accords (classes de hauteur), dans l'ordre du premier accord. */
export function commonTones(a: Chord, b: Chord): number[] {
  const other = new Set(pitchClassesOf(b));
  return pitchClassesOf(a).filter((pc) => other.has(pc));
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

const COLOR: Record<Chord['cls'], string> = { maj: 'majeur', min: 'mineur', dim: 'diminué' };
const FROM: Record<Fn, string> = { repos: 'du repos', depart: 'du départ', tension: 'de la tension' };
const TO: Record<Fn, string> = { repos: 'au repos', depart: 'au départ', tension: 'à la tension' };

/** Ce que l'accord est dans la tonalité, en une proposition : « le V, zone tension (dominante) ». */
export function roleText(c: Chord, tonic: number): string {
  const r = roleOf(c, tonic);
  if (r.kind === 'diatonique') return `le ${r.label}, ${r.label === 'I' ? 'la maison, ' : ''}zone « ${FN_LABELS[r.fn!].name} » (${FN_LABELS[r.fn!].learned})`;
  if (r.kind === 'dominante') return `${r.label}, une dominante secondaire : hors de la gamme, il tire vers ${r.anchor}`;
  if (r.kind === 'emprunt') return `${r.label}, emprunté au mineur : la couleur sombre de ${r.anchor}`;
  return `${r.label}, hors de la tonalité et de ses voisins`;
}

/** Pourquoi ce pas « marche », en une phrase courte. */
function functionText(ra: Role, rb: Role, b: Chord, tonic: number): string | null {
  if (ra.kind === 'dominante' && rb.label === ra.anchor) return `la dominante secondaire se résout sur ${ra.anchor}`;
  if (ra.kind === 'dominante') return `la dominante secondaire ne va pas où elle pointait (${ra.anchor}) : une surprise`;
  if (rb.kind === 'dominante') return `on sort de la gamme : ${rb.label}, qui pointe vers ${nameOf(roleTarget(rb, tonic) ?? b)}`;
  if (rb.kind === 'emprunt') return `on emprunte ${rb.label} au mineur, une ombre sur ${rb.anchor}`;
  if (rb.kind === 'ailleurs') return 'on quitte la tonalité';
  if (ra.kind === 'emprunt' && rb.label === 'I') return 'l’emprunt rentre à la maison';
  const fa = ra.fn;
  const fb = rb.fn;
  if (!fa || !fb) return null;
  if (rb.label === 'I' && fa === 'tension') return 'la tension se résout : retour à la maison';
  if (rb.label === 'I' && ra.label === 'IV') return 'retour à la maison en douceur, sans passer par la tension (la cadence « amen »)';
  if (rb.label === 'I') return 'retour à la maison';
  if (ra.label === 'I') return `on quitte la maison vers ${fb === 'tension' ? 'la tension' : fb === 'depart' ? 'le départ' : 'un autre repos'}`;
  if (fa === fb) return `on reste dans la zone « ${FN_LABELS[fa].name} »`;
  return `${FROM[fa]} ${TO[fb]}`;
}

/** L'accord de la gamme visé par une dominante secondaire. */
function roleTarget(r: Role, tonic: number): Chord | null {
  if (r.kind !== 'dominante' || !r.anchor) return null;
  const steps: Record<string, [number, Chord['cls']]> = { ii: [2, 'min'], iii: [4, 'min'], IV: [5, 'maj'], V: [7, 'maj'], vi: [9, 'min'] };
  const s = steps[r.anchor];
  return s ? { root: mod12(tonic + s[0]), cls: s[1] } : null;
}

/** « Sol → Do : quinte descendante, le pas le plus naturel ; la tension se résout : retour à la maison. 1 note en commun : sol. » */
export function moveSentence(a: Chord, b: Chord, tonic: number): string {
  const head = `${nameOf(a)} → ${nameOf(b)}`;
  if (sameChord(a, b)) return `${head} : on reste sur le même accord.`;
  const kind = moveKind(a, b);
  const fn = functionText(roleOf(a, tonic), roleOf(b, tonic), b, tonic);
  const motion = kind === 'meme' ? `même basse, seule la tierce bouge (${COLOR[a.cls]} → ${COLOR[b.cls]})` : KIND_TEXT[kind];
  const common = commonTones(a, b);
  const tones = common.length === 0 ? 'Aucune note en commun.' : `${common.length} note${common.length > 1 ? 's' : ''} en commun : ${common.map(noteName).join(', ')}.`;
  return `${head} : ${motion}${fn ? ` ; ${fn}` : ''}. ${tones}`;
}
