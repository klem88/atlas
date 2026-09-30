/**
 * Contrat des données statiques de « Ta progression a déjà été jouée 40 000 fois »
 * (`public/data/progression-jouee/`), produites par `npm run data -- progression-jouee`.
 *
 * - `meta.json` : effectifs du corpus, genres, décennies, précision de l'estimation de tonalité.
 * - `p2.json` … `p8.json` : une part par longueur de suite ; chaque suite (« I,V,vi,IV ») → une ligne de nombres.
 * - `songs.json` : les morceaux nommés (iRb, Billboard) avec leurs grilles et leurs jetons, pour les exemples.
 */

export const SCHEMA_VERSION = 1;
/** Seuil de rétention d'une suite (morceaux qui la contiennent), par longueur : plus haut pour les longues, qui sont
 *  bien plus nombreuses (rotations et extensions des boucles) et pèseraient trop lourd à charger. */
export const MIN_SONGS_BY_LENGTH: Readonly<Record<number, number>> = { 2: 20, 3: 20, 4: 20, 5: 30, 6: 40, 7: 50, 8: 50 };

/** Colonnes fixes d'une ligne de suite, avant les genres puis les décennies. */
export const ROW = { total: 0, minor: 1, firstYear: 2, fixed: 3 } as const;

/** [total, dont mineur, première année (0 si inconnue), …par genre, …par décennie] */
export type ProgressionRow = number[];

export interface Meta {
  version: number;
  generatedAt: string;
  lengths: number[];
  /** Seuil de rétention, aligné sur `lengths`. */
  minSongs: number[];
  genres: string[];
  decades: number[];
  corpus: {
    /** Morceaux de Chordonomicon retenus (au moins deux degrés). */
    songs: number;
    withGenre: number;
    withYear: number;
    minor: number;
    byGenre: number[];
    byDecade: number[];
  };
  keyAccuracy: {
    /** iRb : armure (relatif majeur) juste, sur `irb.n` standards. */
    irb: { n: number; signature: number; exact: number };
    /** Billboard : tonique juste (au sens strict : la tonique du mode estimé). */
    billboard: { n: number; tonic: number; signature: number };
  };
  named: { irb: number; billboard: number };
}

export interface Shard {
  n: number;
  rows: Record<string, ProgressionRow>;
}

import type { NamedSection, NamedSongRecord } from '@tools/lib/named-songs';

export type { NamedSection };
export type NamedSong = NamedSongRecord;

/** Section enrichie dans le navigateur : les jetons de degrés (sans répétition immédiate) relatifs au relatif majeur. */
export interface TokenizedSection extends NamedSection {
  tokens: number[];
}

export interface TokenizedSong extends Omit<NamedSong, 'sections'> {
  sections: TokenizedSection[];
}


export interface SongsFile {
  version: number;
  songs: NamedSong[];
}
