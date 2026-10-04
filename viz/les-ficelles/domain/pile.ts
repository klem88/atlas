/**
 * La pile : les ficelles gardées, dans l'ordre où on les a posées. Le résultat se recalcule toujours en les rejouant
 * depuis la grille de départ ; une ficelle dont l'endroit n'existe plus (parce qu'on en a retiré une avant elle) tombe.
 */
import { ficelle, type FicelleId } from './ficelles';
import type { Accord, Grille } from './grille';

export interface Geste {
  id: FicelleId;
  index: number;
}

export interface Rejeu {
  grille: Accord[];
  gardes: Geste[];
  tombes: Geste[];
}

export function rejouer(depart: Grille, pile: readonly Geste[]): Rejeu {
  let grille = [...depart];
  const gardes: Geste[] = [];
  const tombes: Geste[] = [];
  for (const g of pile) {
    const f = ficelle(g.id);
    if (f.endroits(grille).includes(g.index)) {
      grille = f.appliquer(grille, g.index).grille;
      gardes.push(g);
    } else tombes.push(g);
  }
  return { grille, gardes, tombes };
}

export const retirer = (pile: readonly Geste[], k: number): Geste[] => pile.filter((_, j) => j !== k);

/** La phrase de la page : Do – La m – Fa – Sol devient Do – Do/Si – La m – Fa – Fa m – Fa/Sol. */
export const EXEMPLE: readonly Geste[] = [
  { id: 'descend', index: 0 },
  { id: 'emprunt', index: 3 },
  { id: 'suspendu', index: 5 },
];
