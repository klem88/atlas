/**
 * Contrat des fichiers produits par `pipeline/` et consommés par le front.
 * Toute modification de forme doit incrémenter SCHEMA_VERSION.
 *
 * Fichiers dans public/data/qui-chante/ :
 *   communes.json            index de recherche : nom, département, maille
 *   species.json             les espèces (noms, fréquence nationale, chant éventuel)
 *   cells/<bloc>.json        pour chaque maille d'un bloc, les espèces observées autour
 *   songs/<xcId>.mp3         extraits des chants
 *   spectrograms/<xcId>.bin  spectrogramme de chaque extrait (voir SpectrogramSpec)
 */

export const SCHEMA_VERSION = 1;

/**
 * Grille régulière en degrés couvrant la métropole et la Corse.
 * Une maille mesure 0,13° × 0,09°, soit environ 10 km × 10 km à la latitude de la France
 * (9 km de large au nord, 11 km au sud). Les blocs regroupent BLOCK × BLOCK mailles
 * pour limiter le nombre de fichiers et n'en charger qu'un par commune.
 */
export interface GridSpec {
  lon0: number;
  lat0: number;
  dLon: number;
  dLat: number;
  cols: number;
  rows: number;
  block: number;
}

export const GRID: GridSpec = {
  lon0: -5.3,
  lat0: 41.3,
  dLon: 0.13,
  dLat: 0.09,
  cols: 116,
  rows: 111,
  block: 8,
};

/**
 * Index des communes, en tableaux parallèles (pas de clés répétées 35 000 fois).
 * `cell` est l'identifiant de la maille qui contient le centre de la commune.
 */
export interface CommunesFile {
  schemaVersion: typeof SCHEMA_VERSION;
  generatedAt: string;
  codes: string[];
  names: string[];
  departements: string[];
  cell: number[];
}

export interface Song {
  /** Identifiant Xeno-canto (XC123456) : sert aussi de nom de fichier. */
  xcId: string;
  author: string;
  /** Libellé court de la licence (« CC BY-NC-SA 4.0 »). */
  licence: string;
  /** Page de l'enregistrement sur xeno-canto.org. */
  url: string;
  /** Pays (code ISO 3166, affiché en français par Intl.DisplayNames) et année de l'enregistrement. */
  countryCode: string;
  year: number | null;
  /** Durée de l'extrait publié (s). */
  duration: number;
  /** Nombre de colonnes de temps du spectrogramme. */
  frames: number;
}

export interface Species {
  /** Clé de l'espèce dans le référentiel taxonomique de GBIF. */
  key: number;
  scientific: string;
  /** Nom français (TAXREF), ou nom scientifique à défaut. */
  french: string;
  /** Nombre d'observations en France sur la période. */
  national: number;
  song: Song | null;
}

export interface SpeciesFile {
  schemaVersion: typeof SCHEMA_VERSION;
  generatedAt: string;
  /** Période des observations (années incluses). */
  years: [number, number];
  spectrogram: SpectrogramSpec;
  /** Triées par nombre d'observations en France, décroissant. */
  species: Species[];
}

/**
 * Un bloc de mailles. Pour chaque maille : les espèces observées dans la maille
 * et ses 8 voisines (« autour de chez toi »), déjà agrégées par le pipeline.
 */
export interface CellBlockFile {
  schemaVersion: typeof SCHEMA_VERSION;
  block: string;
  cells: Record<string, CellEntry>;
}

export interface CellEntry {
  /** Total d'observations d'oiseaux dans le voisinage : mesure l'effort d'observation. */
  total: number;
  /** Indices dans SpeciesFile.species, triés par nombre d'observations décroissant. */
  species: number[];
  /** Nombre d'observations de chaque espèce, dans le même ordre. */
  counts: number[];
}

/**
 * Forme des spectrogrammes : `bins` bandes de fréquence (de fMin à fMax, échelle
 * logarithmique) × `frames` colonnes de temps (voir Song.frames). Fichier binaire brut,
 * un octet d'intensité (0 à 255) par case, colonne par colonne, fréquences basses d'abord.
 */
export interface SpectrogramSpec {
  bins: number;
  fMin: number;
  fMax: number;
  /** Durée représentée par une colonne (s). */
  frameSeconds: number;
}
