/**
 * Le chœur de l'aube : les espèces les plus présentes entrent l'une après l'autre,
 * comme les voix d'un canon, et chantent ensemble.
 */

export interface ChorusVoice {
  /** Indice de l'espèce dans la liste locale. */
  index: number;
  /** Entrée de la voix (s après le début du chœur). */
  start: number;
  duration: number;
  /** Volume de 0 à 1 : les espèces les plus présentes chantent plus fort. */
  gain: number;
}

export interface ChorusPlan {
  voices: ChorusVoice[];
  duration: number;
}

export const CHORUS_VOICES = 6;
/** Écart entre deux entrées (s). */
export const CHORUS_STAGGER = 2.5;
const MIN_GAIN = 0.35;

/**
 * Choisit les voix parmi les espèces locales (déjà triées par présence) qui ont un chant.
 * `local` donne, pour chaque espèce locale, son nombre d'observations et la durée de son chant (null sans chant).
 */
export function planChorus(local: readonly { count: number; duration: number | null }[], voices = CHORUS_VOICES): ChorusPlan {
  const chosen = local
    .map((s, index) => ({ ...s, index }))
    .filter((s): s is { count: number; duration: number; index: number } => s.duration !== null && s.duration > 0)
    .slice(0, voices);
  const maxCount = Math.max(1, ...chosen.map((s) => s.count));
  const planned = chosen.map((s, i) => ({
    index: s.index,
    start: i * CHORUS_STAGGER,
    duration: s.duration,
    gain: MIN_GAIN + (1 - MIN_GAIN) * Math.sqrt(s.count / maxCount),
  }));
  return { voices: planned, duration: Math.max(0, ...planned.map((v) => v.start + v.duration)) };
}
