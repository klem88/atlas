/**
 * Le son de Shepard : des sinusoïdes à l'octave les unes des autres, sous une enveloppe fixe en cloche
 * (cosinus surélevé sur l'axe log₂ des fréquences). Quand on monte, chaque composante glisse vers le haut,
 * s'éteint en arrivant en haut de l'enveloppe et renaît en bas : l'ensemble semble monter sans fin.
 *
 * La hauteur se déroule sur une hélice : un tour par octave (la classe de hauteur), la montée = la fréquence.
 */

/** Do1 : la composante la plus grave. */
export const BASE_HZ = 32.7032;
export const OCTAVES = 9;
export const PITCH_NAMES = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'] as const;

export interface Component {
  /** Rang (0 = la plus grave). */
  k: number;
  hz: number;
  /** Amplitude entre 0 et 1, donnée par l'enveloppe. */
  amp: number;
  /** Position en octaves au-dessus de BASE_HZ (0 à OCTAVES). */
  octaves: number;
}

/** Enveloppe en cosinus surélevé : 0 aux extrêmes (0 et OCTAVES), 1 au milieu. */
export function envelope(octaves: number): number {
  if (octaves <= 0 || octaves >= OCTAVES) return 0;
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * octaves) / OCTAVES);
}

/**
 * Les composantes pour une position `cents` sur l'octave (0 à 1200, modulo). `cents` = 0 : des do à chaque octave.
 * Il y a OCTAVES composantes ; celle du haut (à OCTAVES octaves) coïncide avec le bord et vaut 0.
 */
export function shepardComponents(cents: number): Component[] {
  const pos = (((cents % 1200) + 1200) % 1200) / 1200;
  const out: Component[] = [];
  for (let k = 0; k < OCTAVES; k++) {
    const octaves = k + pos;
    out.push({ k, octaves, hz: BASE_HZ * 2 ** octaves, amp: envelope(octaves) });
  }
  return out;
}

/** Nom de la classe de hauteur à `cents` de do (arrondi au demi-ton), et l'écart restant. */
export function pitchAt(cents: number): { name: string; offsetCents: number } {
  const c = ((cents % 1200) + 1200) % 1200;
  const semis = Math.round(c / 100) % 12;
  let offset = c - Math.round(c / 100) * 100;
  if (offset > 50) offset -= 100;
  return { name: PITCH_NAMES[semis]!, offsetCents: Math.round(offset) };
}

export interface HelixPoint {
  x: number;
  y: number;
  z: number;
}

/**
 * Position sur l'hélice d'un point à `octaves` au-dessus de la base : un tour par octave (angle horaire depuis le do,
 * en haut du cercle), montée de `pitch` par tour, rayon `radius`.
 */
export function helixPoint(octaves: number, radius: number, pitch: number): HelixPoint {
  const a = octaves * 2 * Math.PI;
  return { x: radius * Math.sin(a), y: octaves * pitch, z: radius * Math.cos(a) };
}

export interface Counter {
  /** Demi-tons parcourus depuis le départ (positif en montant). */
  semitones: number;
  /** Tours complets d'hélice (octaves) parcourus. */
  turns: number;
}

/** Ce que l'oreille croit avoir monté : `travelledCents` cumulés (jamais réduits à l'octave). */
export function counter(travelledCents: number): Counter {
  return { semitones: Math.floor(Math.abs(travelledCents) / 100) * Math.sign(travelledCents), turns: Math.floor(Math.abs(travelledCents) / 1200) };
}

/** Vitesses de montée, en cents par seconde. */
export const SPEEDS = { lente: 60, normale: 120, rapide: 240 } as const;
export type SpeedId = keyof typeof SPEEDS;
