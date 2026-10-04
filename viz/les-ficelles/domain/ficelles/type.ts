/**
 * Le contrat d’une ficelle : où elle s’applique, ce qu’elle fait, et comment elle s’explique.
 * Un « endroit » est un indice dans la grille, propre à chaque ficelle (le premier accord d’une paire, ou l’accord visé).
 */
import type { Accord, Grille } from '../grille';

export type FicelleId = 'descend' | 'emprunt' | 'dominante' | 'suspendu' | 'enrichis' | 'montee';

export interface Application {
  grille: Accord[];
  /** Les indices, dans la nouvelle grille, des accords ajoutés ou changés (allumés sur la portée). */
  touches: number[];
}

export interface Ficelle {
  id: FicelleId;
  nom: string;
  /** Une phrase pour la carte. */
  resume: string;
  /** Les endroits où elle s’applique. */
  endroits(g: Grille): number[];
  /** Les accords concernés par un endroit (à allumer, et à toucher pour le choisir). */
  zone(g: Grille, i: number): number[];
  appliquer(g: Grille, i: number): Application;
  /** La phrase de l’avant / après. */
  explique(g: Grille, i: number): string;
  /** Pourquoi elle ne s’applique nulle part, avec un exemple dans la tonalité. */
  pourquoiPas(g: Grille): string;
}

/** Longueur maximale d’une grille après ficelles (huit accords au départ, et de la place pour broder). */
export const MAX_GRILLE = 24;
