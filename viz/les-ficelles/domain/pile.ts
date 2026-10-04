/**
 * La pile : les ficelles gardées, dans l'ordre où on les a posées. Le résultat se recalcule toujours en les rejouant
 * depuis la grille de départ ; une ficelle dont l'endroit n'existe plus (parce qu'on en a retiré une avant elle) tombe.
 */
import { ficelle, type FicelleId } from './ficelles';
import type { Accord, Grille } from './grille';
import { nomAccord } from './orthographe';

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

/** Où agit une ficelle, en mots : « entre Do et La m », « avant La m », « sur Sol », « après Sol ». */
function lieu(g: Grille, geste: Geste): string {
  const nom = (i: number) => nomAccord(g[i]!);
  const i = geste.index;
  switch (geste.id) {
    case 'descend':
    case 'emprunt':
      return `entre ${nom(i)} et ${nom(i + 1)}`;
    case 'dominante':
      return `avant ${nom(i)}`;
    case 'montee':
      return `après ${nom(i)}`;
    default:
      return `sur ${nom(i)}`;
  }
}

/** Pour chaque ficelle gardée, l’accord visé, lu sur la grille telle qu’elle était juste avant elle (vide si elle tombe). */
export function lieux(depart: Grille, pile: readonly Geste[]): string[] {
  let grille: Grille = depart;
  return pile.map((g) => {
    const f = ficelle(g.id);
    if (!f.endroits(grille).includes(g.index)) return '';
    const ici = lieu(grille, g);
    grille = f.appliquer(grille, g.index).grille;
    return ici;
  });
}

export const retirer = (pile: readonly Geste[], k: number): Geste[] => pile.filter((_, j) => j !== k);

/** La phrase de la page : Do – La m – Fa – Sol devient Do – Do/Si – La m – Fa – Fa m – Fa/Sol. */
export const EXEMPLE: readonly Geste[] = [
  { id: 'descend', index: 0 },
  { id: 'emprunt', index: 3 },
  { id: 'suspendu', index: 5 },
];
