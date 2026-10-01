/**
 * Contrat des données de « Cinquante ans de refrains » (`public/data/cinquante-ans-de-refrains/years.json`).
 * Une série par corpus (tablatures, tubes du Billboard) et par genre des tablatures ; par année, les mesures
 * moyennes et la part de chaque degré. Aucune projection, aucun lissage : la page hachure les années trop peu peuplées.
 */

export const SCHEMA_VERSION = 1;
/** En dessous, une année est hachurée (estimation fragile) : 200 tablatures, 15 titres du Billboard (il y en a une vingtaine par an). */
export const MIN_SONGS_YEAR: Record<'chordonomicon' | 'billboard', number> = { chordonomicon: 200, billboard: 15 };
/** Degrés des rubans, par fondamentale : I, ii, iii, IV, V, vi, puis tout le reste. */
export const DEGREE_BINS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'autres'] as const;

export type Measure = 'distincts' | 'mineurs' | 'quatre' | 'septiemes' | 'emprunts';
export const MEASURES: readonly Measure[] = ['distincts', 'mineurs', 'quatre', 'septiemes', 'emprunts'];

export interface YearPoint {
  year: number;
  songs: number;
  /** Nombre moyen d'accords distincts (24 classes : degré × majeur/mineur). */
  distincts: number;
  /** Part des accords mineurs (0–1), sur les occurrences. */
  mineurs: number;
  /** Part des morceaux qui tiennent en quatre accords distincts ou moins (0–1). */
  quatre: number;
  /** Part des accords portant une septième (0–1) ; `null` quand le corpus ne le dit pas. */
  septiemes: number | null;
  /** Part des accords dont la fondamentale n'est pas dans la gamme (0–1). */
  emprunts: number;
  /** Parts des degrés, alignées sur DEGREE_BINS, somme 1. */
  degrees: number[];
  /** Repères (Billboard) : le morceau le plus riche et le plus sobre de l'année. */
  most?: { title: string; artist: string; distincts: number };
  least?: { title: string; artist: string; distincts: number };
}

export interface Series {
  /** « chordonomicon », « billboard », « cho:pop »… */
  key: string;
  label: string;
  corpus: 'chordonomicon' | 'billboard';
  genre?: string;
  /** Seuil de hachure de cette série. */
  minSongs: number;
  years: YearPoint[];
}

export interface YearsFile {
  version: number;
  generatedAt: string;
  series: Series[];
}
