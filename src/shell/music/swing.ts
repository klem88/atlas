/**
 * Section rythmique de jazz, en calcul pur : une contrebasse qui marche sur la grille, une ride et un charleston.
 * Tout est en temps « droits » (croche = 0,5) ; le swing s'applique au moment de jouer (`swungBeat`), parce qu'il
 * dépend du tempo : plus c'est rapide, plus les croches se redressent.
 */

export type HitKind = 'basse' | 'ride' | 'charleston' | 'piano';

export interface Hit {
  /** Position en temps depuis le début de la boucle (croches à n + 0,5, avant swing). */
  beat: number;
  kind: HitKind;
  midi?: number;
  /** Durée en temps. */
  dur: number;
  /** Nuance, de 0 à 1. */
  vel: number;
}

export interface ChordSpan {
  /** Classe de hauteur de la fondamentale. */
  root: number;
  /** Début, en temps depuis le début de la boucle. */
  start: number;
  beats: number;
  /** Notes de l'accord, en demi-tons depuis la fondamentale (0, 3ce, 5te, 7e). */
  tones: readonly number[];
}

/** Zone de la contrebasse, en MIDI (do2 à sol3 : une octave plus haut que la vraie, pour les haut-parleurs). */
export const BASSE_BAS = 36;
export const BASSE_HAUT = 55;
const BASSE_CENTRE = 43;

const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** La note de classe `pc` la plus proche de `pres`, dans la zone de la basse. */
function proche(pc: number, pres: number): number {
  let best = BASSE_BAS + mod12(pc - BASSE_BAS);
  for (let n = best; n <= BASSE_HAUT; n += 12) if (Math.abs(n - pres) < Math.abs(best - pres)) best = n;
  return best;
}

/** Une note de la zone, au-dessus (dir = 1) ou en dessous (dir = -1) de `depuis` si possible. */
function versLe(pc: number, depuis: number, dir: 1 | -1): number {
  const n = proche(pc, depuis + dir * 4);
  if (dir === 1 && n < depuis && n + 12 <= BASSE_HAUT) return n + 12;
  if (dir === -1 && n > depuis && n - 12 >= BASSE_BAS) return n - 12;
  return n;
}

/**
 * Une note par temps. Sur chaque accord : la fondamentale au premier temps, puis des notes de l'accord dans la
 * direction de l'accord suivant, et au dernier temps une approche chromatique (un demi-ton au-dessus ou en dessous
 * de la fondamentale suivante). Un accord de deux mesures repart de sa fondamentale, approchée de même, à la deuxième.
 */
export function walkingBass(chords: readonly ChordSpan[], loopBeats: number): Hit[] {
  const hits: Hit[] = [];
  let derniere = BASSE_CENTRE;
  chords.forEach((c, i) => {
    const suivant = chords[(i + 1) % chords.length]!;
    const tierce = c.tones[1] ?? 4;
    const quinte = c.tones[2] ?? 7;
    const septieme = c.tones[3] ?? 10;
    for (let seg = 0; seg < c.beats; seg += 4) {
      const n = Math.min(4, c.beats - seg);
      const dernierSegment = seg + 4 >= c.beats;
      const debut = c.start + seg;
      const fond = proche(c.root, derniere);
      const notes: number[] = [fond];
      if (n >= 2) {
        // Cible : la fondamentale suivante (ou la nôtre, si l'accord dure encore une mesure).
        const ciblePc = dernierSegment ? suivant.root : c.root;
        const cible = proche(ciblePc, fond);
        const dir: 1 | -1 = cible > fond || (cible === fond && fond < BASSE_CENTRE) ? 1 : -1;
        const milieu = dir === 1 ? [tierce, quinte] : [septieme - 12, quinte - 12];
        for (let k = 0; k < n - 2; k++) {
          const pc = mod12(c.root + milieu[k % 2]!);
          notes.push(versLe(pc, notes[notes.length - 1]!, dir));
        }
        // Approche chromatique de la cible, par le demi-ton d'où l'on vient.
        const approche = cible - dir;
        notes.push(approche < BASSE_BAS ? approche + 12 : approche > BASSE_HAUT ? approche - 12 : approche);
      }
      notes.forEach((midi, k) => hits.push({ beat: (debut + k) % loopBeats, kind: 'basse', midi, dur: 0.9, vel: k === 0 ? 0.95 : 0.8 }));
      derniere = notes[notes.length - 1]!;
    }
  });
  return hits.sort((a, b) => a.beat - b.beat);
}

/** Ride « ding, ding-ga ding, ding-ga » et charleston fermé au pied sur 2 et 4. */
export function drumPattern(loopBeats: number): Hit[] {
  const hits: Hit[] = [];
  for (let b = 0; b < loopBeats; b++) {
    const surDeuxEtQuatre = b % 2 === 1;
    hits.push({ beat: b, kind: 'ride', dur: 1, vel: surDeuxEtQuatre ? 0.85 : 0.7 });
    if (surDeuxEtQuatre) {
      hits.push({ beat: b + 0.5, kind: 'ride', dur: 0.5, vel: 0.5 });
      hits.push({ beat: b, kind: 'charleston', dur: 0.25, vel: 0.8 });
    }
  }
  return hits;
}

/**
 * Place de la croche du « et », en fraction du temps : 2/3 (rapport 2:1) jusqu'à 160 à la noire,
 * puis de plus en plus droite, jusqu'à 0,58 à 260.
 */
export function swingFraction(bpm: number): number {
  if (bpm <= 160) return 2 / 3;
  if (bpm >= 260) return 0.58;
  return 2 / 3 + ((0.58 - 2 / 3) * (bpm - 160)) / 100;
}

/** Position jouée d'un temps : la croche du « et » (n + 0,5) est retardée selon le swing. */
export function swungBeat(beat: number, frac: number): number {
  const entier = Math.floor(beat);
  return Math.abs(beat - entier - 0.5) < 1e-6 ? entier + frac : beat;
}
