/**
 * Contrat des données statiques de « Ta progression a déjà été jouée 40 000 fois »
 * (`public/data/progression-jouee/`), produites par `npm run data -- progression-jouee`.
 *
 * - `meta.json` : effectifs du corpus, genres, décennies, précision de l'estimation de tonalité.
 * - `p2.json` … `p8.json` : une part par longueur de suite ; chaque suite (« I,V,vi,IV ») → une ligne de nombres.
 * - `songs.json` : les morceaux nommés (iRb, Billboard) avec leurs grilles et leurs jetons, pour les exemples.
 */

export const SCHEMA_VERSION = 1;
export const MIN_SONGS = 20;

/** Colonnes fixes d'une ligne de suite, avant les genres puis les décennies. */
export const ROW = { total: 0, minor: 1, firstYear: 2, fixed: 3 } as const;

/** [total, dont mineur, première année (0 si inconnue), …par genre, …par décennie] */
export type ProgressionRow = number[];

export interface Meta {
  version: number;
  generatedAt: string;
  minSongs: number;
  lengths: number[];
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

export interface NamedSection {
  name: string;
  /** [symbole, temps] */
  chords: [string, number][];
  /** Degrés (jetons) de la section, sans répétition immédiate, relatifs au relatif majeur. */
  tokens: number[];
}

export interface NamedSong {
  id: string;
  corpus: 'irb' | 'billboard';
  title: string;
  artist: string;
  year: number | null;
  /** Tonique du relatif majeur (celle des jetons). */
  tonic: number;
  mode: 'major' | 'minor';
  sections: NamedSection[];
}

export interface SongsFile {
  version: number;
  songs: NamedSong[];
}
