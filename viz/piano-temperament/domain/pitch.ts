/**
 * Hauteurs : numéros MIDI (60 = do4, 69 = la4), fréquences du tempérament égal, noms français.
 * Tout est pur et sans état.
 */

export const A4_MIDI = 69;
export const A4_HZ = 440;

/** Fréquence d'une note au tempérament égal à 12 notes. */
export function equalFrequency(midi: number, a4 = A4_HZ): number {
  return a4 * 2 ** ((midi - A4_MIDI) / 12);
}

/** Classe de hauteur (0 = do … 11 = si). */
export const pitchClass = (midi: number) => ((midi % 12) + 12) % 12;

/** Noms français des douze classes de hauteur (bémols pour mi♭, la♭, si♭ : les plus lus). */
export const PITCH_NAMES = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'] as const;

/** « do4 », « la♭3 »… L'octave suit la convention scientifique (do4 = do du milieu). */
export function noteName(midi: number): string {
  return `${PITCH_NAMES[pitchClass(midi)]}${Math.floor(midi / 12) - 1}`;
}

/** Nom sans octave. */
export const pitchName = (midi: number) => PITCH_NAMES[pitchClass(midi)]!;

/** Distance en demi-tons, toujours positive. */
export const semitones = (a: number, b: number) => Math.abs(b - a);

const SIMPLE_INTERVALS = [
  'unisson',
  'seconde mineure',
  'seconde majeure',
  'tierce mineure',
  'tierce majeure',
  'quarte',
  'triton',
  'quinte',
  'sixte mineure',
  'sixte majeure',
  'septième mineure',
  'septième majeure',
] as const;

/** Nom français d'un intervalle en demi-tons ; au-delà de l'octave, on redescend (« quinte + octave »). */
export function intervalName(st: number): string {
  const octaves = Math.floor(st / 12);
  const cls = st % 12;
  if (cls === 0) {
    if (octaves === 0) return 'unisson';
    if (octaves === 1) return 'octave';
    return `${['', '', 'deux', 'trois', 'quatre'][octaves] ?? octaves} octaves`;
  }
  const base = SIMPLE_INTERVALS[cls]!;
  return octaves === 0 ? base : `${base} + ${octaves === 1 ? 'octave' : `${octaves} octaves`}`;
}
