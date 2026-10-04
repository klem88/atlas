/**
 * Réalisation à quatre voix (socle) : une basse imposée et trois voix au-dessus, jouables d'une main (dans une octave).
 * Pour chaque accord, on essaie toutes les dispositions possibles et on garde celle qui bouge le moins depuis la
 * précédente, sans quintes ni octaves parallèles (règles d'enchaînement classiques) : les notes communes restent en
 * place. Une légère attirance vers le milieu du clavier empêche les voix de dériver. Pur et déterministe.
 * (`voicing.ts` reste la version simple, en triades, des autres pages.)
 */
export interface AccordARealiser {
  /** Classes de hauteur, fondamentale d'abord : [f, tierce, quinte] ou [f, tierce, quinte, septième]. */
  notes: readonly number[];
  /** Classe de hauteur de la basse (pas forcément dans l'accord : Fa/Sol). */
  basse: number;
}

/** Basse, ténor, alto, soprano, en MIDI (60 = do4), du grave à l'aigu. */
export type Voix = readonly [number, number, number, number];

export const BASSE_MIN = 36; // do2
export const BASSE_MAX = 55; // sol3
export const HAUT_MIN = 53; // fa3
export const HAUT_MAX = 79; // sol5
/** Une main : les trois voix du haut tiennent dans une octave. */
export const ECART_MAIN = 12;
export const DEPART: Voix = [48, 60, 64, 67];
const PENALITE_PARALLELE = 100;
const CENTRE_SOPRANO = 72;
const ATTIRANCE = 0.1;

const pc = (n: number) => ((n % 12) + 12) % 12;

/** La basse la plus proche de la précédente, dans sa tessiture (à égalité, la plus grave). */
function placerBasse(classe: number, precedente: number): number {
  let best = -1;
  for (let m = BASSE_MIN; m <= BASSE_MAX; m++) {
    if (pc(m) !== pc(classe)) continue;
    if (best < 0 || Math.abs(m - precedente) < Math.abs(best - precedente)) best = m;
  }
  return best;
}

/** Les trois voix du haut couvrent l'accord : toutes ses notes (triade), ou tierce et septième plus la fondamentale ou la quinte. */
function couvre(notes: readonly number[], haut: readonly number[]): boolean {
  const classes = haut.map(pc);
  if (new Set(classes).size !== 3 || !classes.every((c) => notes.includes(c))) return false;
  return notes.length === 3 || (classes.includes(notes[1]!) && classes.includes(notes[3]!));
}

/** Les paires de voix (indices) qui font des quintes ou des octaves parallèles entre deux accords. */
export function paralleles(avant: Voix, apres: Voix): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++) {
      const di = apres[i]! - avant[i]!;
      const dj = apres[j]! - avant[j]!;
      if (di === 0 || di * dj <= 0) continue;
      const a = pc(avant[j]! - avant[i]!);
      const b = pc(apres[j]! - apres[i]!);
      if ((a === 7 && b === 7) || (a === 0 && b === 0)) out.push([i, j]);
    }
  return out;
}

function cout(avant: Voix, apres: Voix): number {
  const mouvement = Math.abs(apres[1] - avant[1]) + Math.abs(apres[2] - avant[2]) + Math.abs(apres[3] - avant[3]);
  return mouvement + PENALITE_PARALLELE * paralleles(avant, apres).length + ATTIRANCE * Math.abs(apres[3] - CENTRE_SOPRANO);
}

function disposer(a: AccordARealiser, avant: Voix): Voix {
  const basse = placerBasse(a.basse, avant[0]);
  let best: Voix | null = null;
  let bestCout = Infinity;
  for (let t = Math.max(HAUT_MIN, basse + 1); t <= HAUT_MAX; t++)
    for (let al = t + 1; al <= Math.min(HAUT_MAX, t + ECART_MAIN); al++)
      for (let s = al + 1; s <= Math.min(HAUT_MAX, t + ECART_MAIN); s++) {
        if (!couvre(a.notes, [t, al, s])) continue;
        const v: Voix = [basse, t, al, s];
        const c = cout(avant, v);
        if (c < bestCout) {
          best = v;
          bestCout = c;
        }
      }
  if (!best) throw new Error(`Aucune disposition pour [${a.notes.join(', ')}] sur ${a.basse}`);
  return best;
}

/** Les voix de toute la suite, chaque accord enchaîné au précédent (le premier à `depart`). */
export function realiser(accords: readonly AccordARealiser[], depart: Voix = DEPART): Voix[] {
  const out: Voix[] = [];
  let avant = depart;
  for (const a of accords) {
    avant = disposer(a, avant);
    out.push(avant);
  }
  return out;
}

/** Les voix qui changent de note entre deux accords (pour allumer ce qui bouge). */
export const bougent = (avant: Voix, apres: Voix): boolean[] => apres.map((n, k) => n !== avant[k]);
