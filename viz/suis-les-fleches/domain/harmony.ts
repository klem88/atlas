/**
 * Les accords « réels » (une fondamentale et une couleur) et leur rôle dans une tonalité majeure :
 * dans la gamme (I, ii…), dominante secondaire (V/V : la dominante d'un accord de la gamme), emprunt au mineur
 * (♭VII : le même degré pris dans la gamme mineure de même tonique), ou ailleurs.
 * Une modulation, c'est changer de tonalité ; les « portes » d'un accord sont les autres tonalités qui le contiennent.
 */
import type { Degree } from '@shell/music/degrees';
import { parseDegreeLabel } from '@shell/music/degrees';
import { chordName } from '../../compose-ta-progression/domain/next';
import { chordByLabel, chordOfDegree, DIATONIC, type Fn, type MapChord } from './layout';

export type Cls = 'maj' | 'min' | 'dim';

export interface Chord {
  /** Classe de hauteur de la fondamentale (0 = do). */
  root: number;
  cls: Cls;
}

export const mod12 = (n: number) => ((n % 12) + 12) % 12;
export const chordId = (c: Chord) => `${c.root}${c.cls}`;
export const sameChord = (a: Chord, b: Chord) => a.root === b.root && a.cls === b.cls;

/** L'accord d'un degré dans une tonalité. */
export const chordAt = (tonic: number, d: Degree): Chord => ({ root: mod12(tonic + d.step), cls: d.cls as Cls });
/** Le degré (relatif) d'un accord dans une tonalité, pour la voix et les comptes. */
export const degreeIn = (c: Chord, tonic: number): Degree => ({ step: mod12(c.root - tonic), cls: c.cls });

/** « Sol », « La m », « Si ° ». */
export const nameOf = (c: Chord) => chordName({ step: c.root, cls: c.cls }, 0);
/** « do », « fa♯ » : le nom d'une note. */
export const noteName = (pc: number) => chordName({ step: mod12(pc), cls: 'maj' }, 0).toLowerCase();
/** « Sol majeur ». */
export const keyName = (tonic: number) => `${chordName({ step: mod12(tonic), cls: 'maj' }, 0)} majeur`;

const INTERVALS: Record<Cls, number[]> = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6] };
export const pitchClassesOf = (c: Chord): number[] => INTERVALS[c.cls].map((i) => mod12(c.root + i));

/** Le même degré dans la gamme mineure de même tonique (« l'ombre » d'un accord). */
export const MINOR_SHADOW: Readonly<Record<string, string>> = { I: 'i', ii: 'ii°', iii: '♭III', IV: 'iv', V: 'v', vi: '♭VI', 'vii°': '♭VII' };

/** Lit « I », « ♭VII », « ii° », et « V/V » (la dominante d'un accord de la gamme) en degré relatif. */
export function parseRoleLabel(label: string): Degree | null {
  const slash = /^V\/(.+)$/.exec(label);
  if (slash) {
    const target = parseDegreeLabel(slash[1]!.replace('♭', 'b'));
    return target ? { step: mod12(target.step + 7), cls: 'maj' } : null;
  }
  return parseDegreeLabel(label.replace('♭', 'b'));
}

export type RoleKind = 'diatonique' | 'dominante' | 'emprunt' | 'ailleurs';

export interface Role {
  label: string;
  kind: RoleKind;
  /** La fonction (les dominantes secondaires sont des tensions, les emprunts gardent celle du degré d'origine). */
  fn: Fn | null;
  /** L'accord de la gamme auquel il se rattache (sa cible pour une dominante, son modèle pour un emprunt). */
  anchor: string | null;
}

/** La dominante secondaire d'un accord de la gamme : un accord majeur une quinte au-dessus, s'il n'est pas déjà dans la gamme. */
export function secondaryDominant(label: string, tonic: number): Chord | null {
  if (label === 'I' || label === 'vii°') return null;
  const target = chordAt(tonic, chordByLabel(label)!.degree);
  const dom: Chord = { root: mod12(target.root + 7), cls: 'maj' };
  return roleOf(dom, tonic).kind === 'diatonique' ? null : dom;
}

export const shadowOf = (label: string, tonic: number): Chord => chordAt(tonic, parseRoleLabel(MINOR_SHADOW[label]!)!);

export function roleOf(c: Chord, tonic: number): Role {
  const d = degreeIn(c, tonic);
  const diatonic = chordOfDegree(d);
  if (diatonic) return { label: diatonic.label, kind: 'diatonique', fn: diatonic.fn, anchor: diatonic.label };
  if (c.cls === 'maj') {
    const target = chordOfDegree(degreeIn({ root: mod12(c.root - 7), cls: 'maj' }, tonic)) ?? chordOfDegree(degreeIn({ root: mod12(c.root - 7), cls: 'min' }, tonic));
    if (target && target.label !== 'I' && target.label !== 'vii°') return { label: `V/${target.label}`, kind: 'dominante', fn: 'tension', anchor: target.label };
  }
  for (const m of DIATONIC) {
    if (sameChord(shadowOf(m.label, tonic), c)) return { label: MINOR_SHADOW[m.label]!, kind: 'emprunt', fn: m.fn, anchor: m.label };
  }
  const base = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'][d.step]!;
  const label = c.cls === 'maj' ? base : `${base.replace(/[IV]+/, (r) => r.toLowerCase())}${c.cls === 'dim' ? '°' : ''}`;
  return { label, kind: 'ailleurs', fn: null, anchor: null };
}

/** Les sept accords d'une tonalité. */
export const diatonicChords = (tonic: number): { chord: Chord; role: MapChord }[] => DIATONIC.map((m) => ({ chord: chordAt(tonic, m.degree), role: m }));

/** Les voisins d'un accord de la gamme : sa dominante secondaire et son ombre mineure. */
export function neighborsOf(label: string, tonic: number): Chord[] {
  const out: Chord[] = [];
  const dom = secondaryDominant(label, tonic);
  if (dom) out.push(dom);
  out.push(shadowOf(label, tonic));
  return out;
}

/** Position d'une tonique sur le cycle des quintes (do = 0, sol = 1, ré = 2… fa = −1 ≡ 11). */
export const fifthsIndex = (pc: number) => mod12(pc * 7);
/** Écart signé sur le cycle des quintes, de −5 à +6 (positif : vers les dièses). */
export function fifthsOffset(from: number, to: number): number {
  const d = mod12(fifthsIndex(to) - fifthsIndex(from));
  return d > 6 ? d - 12 : d;
}

/** Les tonalités majeures qui contiennent un accord, avec son rôle dans chacune, les plus proches d'abord. */
export function keysContaining(c: Chord, from: number): { tonic: number; role: MapChord }[] {
  const out: { tonic: number; role: MapChord }[] = [];
  for (let t = 0; t < 12; t++) {
    const role = chordOfDegree(degreeIn(c, t));
    if (role) out.push({ tonic: t, role });
  }
  return out.sort((a, b) => Math.abs(fifthsOffset(from, a.tonic)) - Math.abs(fifthsOffset(from, b.tonic)) || fifthsOffset(from, a.tonic) - fifthsOffset(from, b.tonic));
}

/** Les portes d'un accord : les autres tonalités qui le contiennent, les plus proches d'abord. */
export const doorsOf = (c: Chord, tonic: number, max = 2) => keysContaining(c, tonic).filter((k) => k.tonic !== mod12(tonic)).slice(0, max);

export interface Modulation {
  /** Les accords communs, avec leur rôle avant et après. */
  stay: { chord: Chord; before: string; after: string }[];
  leave: Chord[];
  arrive: Chord[];
}

export function modulation(from: number, to: number): Modulation {
  const a = diatonicChords(from);
  const b = diatonicChords(to);
  const stay: Modulation['stay'] = [];
  for (const x of a) {
    const y = b.find((z) => sameChord(z.chord, x.chord));
    if (y) stay.push({ chord: x.chord, before: x.role.label, after: y.role.label });
  }
  return {
    stay,
    leave: a.filter((x) => !b.some((z) => sameChord(z.chord, x.chord))).map((x) => x.chord),
    arrive: b.filter((x) => !a.some((z) => sameChord(z.chord, x.chord))).map((x) => x.chord),
  };
}

/** « On passe en Sol majeur. La m, qui était vi, devient ii. 4 accords sur 7 restent ; Ré m, Fa, Si ° s'en vont, Si m, Ré, Fa♯ ° arrivent. » */
export function modulationSentence(from: number, to: number, pivot: Chord | null): string {
  const m = modulation(from, to);
  const head = `On passe en ${keyName(to)}.`;
  const p = pivot ? m.stay.find((s) => sameChord(s.chord, pivot)) : null;
  const pivotText = p
    ? ` ${nameOf(p.chord)}, qui était ${p.before}, devient ${p.after}.`
    : pivot
      ? ` ${nameOf(pivot)}, qui était ${roleOf(pivot, from).label}, devient ${roleOf(pivot, to).label}.`
      : '';
  const count = m.stay.length === 0 ? ' Aucun accord en commun : un saut franc.' : m.stay.length === 7 ? '' : ` ${m.stay.length} accord${m.stay.length > 1 ? 's' : ''} sur 7 reste${m.stay.length > 1 ? 'nt' : ''}${m.leave.length <= 3 && m.stay.length > 0 ? ` ; ${m.leave.map(nameOf).join(', ')} s’en ${m.leave.length > 1 ? 'vont' : 'va'}, ${m.arrive.map(nameOf).join(', ')} arrive${m.arrive.length > 1 ? 'nt' : ''}` : ''}.`;
  return `${head}${pivotText}${count}`;
}
