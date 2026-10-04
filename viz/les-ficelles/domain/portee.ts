/**
 * Géométrie de la portée (pure) : où tombe chaque note d'un accord, dans un « système » (clé de sol au-dessus, clé de fa
 * au-dessous). Le rang d'une note (octave × 7 + lettre) donne sa hauteur : un rang = un demi-interligne.
 * Pas d'armure : toutes les altérations sont écrites devant les notes.
 */
import type { Voix } from '@shell/music/realisation';
import type { Accord } from './grille';
import { ecrireDans, placer, rang, type NotePlacee } from './orthographe';

export const INTERLIGNE = 10;
const DEMI = INTERLIGNE / 2;
/** Rangs des lignes extrêmes : clé de sol de mi4 (30) à fa5 (38), clé de fa de sol2 (18) à la3 (26). */
export const SOL = { bas: 30, haut: 38 } as const;
export const FA = { bas: 18, haut: 26 } as const;
/** Marge du haut (noms d'accords, lignes supplémentaires), écart entre les deux portées, marge du bas. */
export const MARGE_HAUT = 46;
export const ECART_PORTEES = 64;
export const MARGE_BAS = 36;
export const Y_SOL = MARGE_HAUT;
export const Y_FA = MARGE_HAUT + 4 * INTERLIGNE + ECART_PORTEES;
export const HAUTEUR_SYSTEME = Y_FA + 4 * INTERLIGNE + MARGE_BAS;

export type Cle = 'sol' | 'fa';

export interface NoteDessinee extends NotePlacee {
  /** 0 basse, 1 ténor, 2 alto, 3 soprano. */
  voix: number;
  midi: number;
  cle: Cle;
  y: number;
  /** Les y des lignes supplémentaires. */
  lignes: number[];
  /** Décalée à droite (seconde avec la note du dessous). */
  decale: boolean;
}

export const yDe = (r: number, cle: Cle): number => (cle === 'sol' ? Y_SOL + (SOL.haut - r) * DEMI : Y_FA + (FA.haut - r) * DEMI);

function supplementaires(r: number, cle: Cle): number[] {
  const { bas, haut } = cle === 'sol' ? SOL : FA;
  const out: number[] = [];
  for (let l = haut + 2; l <= r; l += 2) out.push(yDe(l, cle));
  for (let l = bas - 2; l >= r; l -= 2) out.push(yDe(l, cle));
  return out;
}

/** Les quatre notes d'un accord : la clé suit la hauteur (sous do4 en clé de fa), l'écriture suit l'accord. */
export function placerAccord(v: Voix, a: Accord): NoteDessinee[] {
  const notes: NoteDessinee[] = v.map((midi, voix) => {
    const n = placer(midi, ecrireDans(midi, a));
    const cle: Cle = midi >= 60 ? 'sol' : 'fa';
    const r = rang(n);
    return { ...n, voix, midi, cle, y: yDe(r, cle), lignes: supplementaires(r, cle), decale: false };
  });
  // Seconde sur une même portée : la note du dessus passe à droite (sauf si celle du dessous l'est déjà).
  for (let k = 1; k < notes.length; k++) {
    const dessous = notes[k - 1]!;
    const n = notes[k]!;
    if (dessous.cle === n.cle && rang(n) - rang(dessous) === 1 && !dessous.decale) n.decale = true;
  }
  return notes;
}
