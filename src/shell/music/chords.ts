/**
 * Symboles d'accords : lecture d'un symbole en fondamentale, qualité et basse, dans les trois écritures
 * rencontrées dans les corpus (tablatures « libres » de Chordonomicon, notation Harte du Billboard de McGill,
 * abréviations iRealPro de l'iRb), puis réduction à quelques qualités. Tout est pur.
 */

/** Dix qualités : assez pour distinguer ce qui s'entend, assez peu pour compter. */
export type Quality = 'maj' | 'min' | 'dom7' | 'maj7' | 'min7' | 'dim' | 'hdim' | 'sus' | 'aug' | 'other';
export const QUALITIES: readonly Quality[] = ['maj', 'min', 'dom7', 'maj7', 'min7', 'dim', 'hdim', 'sus', 'aug', 'other'];

/** Six classes de triade : les septièmes repliées sur leur triade (G7 compte avec G, Dm7 avec Dm). */
export type TriadClass = 'maj' | 'min' | 'dim' | 'aug' | 'sus' | 'other';
export const TRIAD_CLASSES: readonly TriadClass[] = ['maj', 'min', 'dim', 'aug', 'sus', 'other'];

export interface Chord {
  /** Classe de hauteur de la fondamentale (0 = do … 11 = si). */
  root: number;
  quality: Quality;
  /** Classe de hauteur de la basse quand elle diffère de la fondamentale (renversement). */
  bass?: number;
}

export const PITCH_CLASS_OF: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// « s » vaut dièse dans Chordonomicon (« Csmin »), sauf devant « us » (« Csus4 »).
const ROOT_RE = /^([A-G])((?:#|♯|♭|s(?!us)|b)*)/;
const NOT_A_CHORD = new Set(['', 'N', 'NC', 'X', '&pause', '*', 'W', 'pause', 'n.c.']);

/** Classe de hauteur d'un nom de note (« Bb », « F## » : les altérations tout de suite après la lettre). */
export function parsePitch(name: string): number | null {
  const m = ROOT_RE.exec(name);
  if (!m) return null;
  const base = PITCH_CLASS_OF[m[1]!]!;
  return (((base + accidentalOffset(m[2]!)) % 12) + 12) % 12;
}

function accidentalOffset(s: string): number {
  let n = 0;
  for (const c of s) n += c === '#' || c === '♯' || c === 's' ? 1 : c === 'b' || c === '♭' ? -1 : 0;
  return n;
}

/** Intervalle en demi-tons d'un degré Harte (« 3 », « b3 », « b7 », « #4 », « 9 »). */
const DEGREE_SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21];
export function parseHarteDegree(s: string): number | null {
  const m = /^([#b]*)(\d{1,2})$/.exec(s);
  if (!m) return null;
  const base = DEGREE_SEMITONES[Number(m[2]) - 1];
  if (base === undefined) return null;
  return (((base + accidentalOffset(m[1]!)) % 12) + 12) % 12;
}

/**
 * Lit un symbole ; `null` pour tout ce qui n'est pas un accord (silence, marqueur de section, bruit).
 * Les trois notations sont reconnues sur la même entrée : la lettre puis les altérations font la fondamentale,
 * un `/` introduit la basse, et le reste est la qualité, lue par motifs.
 */
export function parseChord(symbol: string): Chord | null {
  const s = symbol.trim();
  if (NOT_A_CHORD.has(s) || s.startsWith('<')) return null;
  const m = ROOT_RE.exec(s);
  if (!m) return null;
  const root = parsePitch(s)!;
  let rest = s.slice(m[0].length);

  let bass: number | undefined;
  const slash = rest.indexOf('/');
  if (slash >= 0) {
    const b = rest.slice(slash + 1);
    rest = rest.slice(0, slash);
    if (rest.includes(':') || /^[#b]*\d/.test(b)) {
      // Basse en degré (Harte : « /3 », « /b7 »). « C6/9 » n'est pas un renversement : degré 9 = seconde, ignoré.
      if (b !== '9') {
        const deg = parseHarteDegree(b);
        if (deg !== null) bass = (root + deg) % 12;
      }
    } else {
      const p = parsePitch(b);
      if (p !== null) bass = p;
    }
  }

  const quality = rest.startsWith(':') ? harteQuality(rest.slice(1)) : freeQuality(rest);
  const chord: Chord = { root, quality };
  if (bass !== undefined && bass !== root) chord.bass = bass;
  return chord;
}

/** Notation Harte : « maj », « min7 », « hdim7 », « maj(9) », « (1,5) »… */
function harteQuality(q: string): Quality {
  const base = q.replace(/\(.*\)$/, '');
  switch (base) {
    case 'maj':
    case 'maj6':
    case '6':
    case '1':
    case '5':
    case '':
      return 'maj';
    case 'min':
    case 'min6':
    case 'minmaj7':
      return 'min';
    case '7':
    case '9':
    case '11':
    case '13':
      return 'dom7';
    case 'maj7':
    case 'maj9':
    case 'maj11':
    case 'maj13':
      return 'maj7';
    case 'min7':
    case 'min9':
    case 'min11':
    case 'min13':
      return 'min7';
    case 'dim':
    case 'dim7':
      return 'dim';
    case 'hdim':
    case 'hdim7':
      return 'hdim';
    case 'aug':
    case 'aug7':
      return 'aug';
    default:
      if (base.startsWith('sus')) return 'sus';
      return 'other';
  }
}

/**
 * Écriture libre et iRealPro. L'ordre des motifs compte : d'abord les marques les plus spécifiques
 * (demi-diminué, diminué, suspendu, augmenté), puis les mineurs, les septièmes majeures, les triades, les dominantes.
 */
function freeQuality(raw: string): Quality {
  const q = raw.replace(/\s+/g, '').replace(/[()]/g, '');
  if (q === '') return 'maj';
  if (/^(ø|h)/.test(q) || /^(min|m|-)7(b5|♭5|-5)/.test(q)) return 'hdim';
  if (/^(dim|°|o)/.test(q)) return 'dim';
  if (q.includes('sus')) return 'sus';
  if (/^(aug|\+)/.test(q) || /^7?(#5|\+5|\+)/.test(q)) return 'aug';
  const minor = /^(min|m(?!aj)|-)/.exec(q);
  if (minor) {
    const tail = q.slice(minor[0].length);
    if (/^(M7|maj7|Maj7|\^7|\^|Δ7|Δ)/.test(tail)) return 'min';
    if (/^(6|69|add|2|4|5|b6|♭6)/.test(tail)) return 'min';
    if (/^(7|9|11|13)/.test(tail)) return 'min7';
    return 'min';
  }
  if (/^(maj|M)(7|9|11|13)/.test(q) || /^(\^|Δ)/.test(q)) return 'maj7';
  if (/^(maj|M|6|69|add|2|5|4|no3d)/.test(q)) return 'maj';
  if (/^(7|9|11|13|alt|dom)/.test(q)) return 'dom7';
  return 'other';
}

export function triadClass(q: Quality): TriadClass {
  switch (q) {
    case 'maj':
    case 'maj7':
    case 'dom7':
      return 'maj';
    case 'min':
    case 'min7':
      return 'min';
    case 'dim':
    case 'hdim':
      return 'dim';
    default:
      return q;
  }
}

/** Symbole lisible : « C:maj/3 » → « C/3 », « A:min7 » → « Am7 », « B:hdim7 » → « Bø7 », « Dmin7 » → « Dm7 ». */
export function prettySymbol(symbol: string): string {
  return symbol
    .replace(':', '')
    .replace(/^([A-G][#b]?)maj(?=$|\/|\()/, '$1')
    .replace(/^([A-G][#b]?)min/, '$1m')
    .replace('hdim7', 'ø7')
    .replace('hdim', 'ø')
    .replace(/^([A-G][#b]?)dim/, '$1°')
    .replace(/\(([^)]*)\)/, '$1');
}
