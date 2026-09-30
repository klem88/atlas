/**
 * Contrat des données de « Le fleuve des enchaînements » (`public/data/fleuve-des-accords/transitions.json`).
 * Un agrégat par « style » : tout Chordonomicon, chacun de ses douze genres, chaque décennie, l'iRb (jazz annoté)
 * et le Billboard. Chaque agrégat compte les transitions d'un degré au suivant (jetons < 72), à l'intérieur
 * d'une section, sans répétition immédiate.
 */

export const SCHEMA_VERSION = 1;
/** Une transition est gardée si elle est vue au moins ce nombre de fois dans l'agrégat. */
export const MIN_TRANSITIONS = 5;

export type StyleKind = 'all' | 'genre' | 'decade' | 'corpus';

export interface StyleAgg {
  /** « all », « pop », « d1960 », « irb », « billboard »… */
  key: string;
  label: string;
  kind: StyleKind;
  songs: number;
  /** Total des transitions comptées (avant seuil). */
  transitions: number;
  /** [jeton de départ, jeton d'arrivée, nombre] */
  rows: [number, number, number][];
}

export interface TransitionsFile {
  version: number;
  generatedAt: string;
  styles: StyleAgg[];
}
