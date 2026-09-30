/**
 * Contrat des fichiers produits par `pipeline/` et consommés par le front.
 * Toute modification de forme doit incrémenter SCHEMA_VERSION.
 */

export const SCHEMA_VERSION = 1;

export const PROPERTY_TYPES = ['maison', 'appartement'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

/**
 * Provenance d'un prix, du plus fiable au moins fiable.
 * Le front s'en sert pour signaler les estimations.
 */
export const PriceSource = {
  None: 0,
  CommuneAnnual: 1,
  CommuneTriennial: 2,
  EpciAnnual: 3,
  EpciTriennial: 4,
} as const;
export type PriceSource = (typeof PriceSource)[keyof typeof PriceSource];

export interface PriceSeries {
  /** Prix médian au m² (€, arrondi), null si aucune source fiable. */
  pxm2: (number | null)[];
  /** Nombre de ventes dans la commune cette année-là (indépendant de la source retenue). */
  n: number[];
  /** Provenance du prix, cf. PriceSource. */
  src: PriceSource[];
}

/**
 * Tableaux à plat : l'index d'une valeur est `communeIndex * years.length + yearIndex`.
 * Format choisi pour sa compacité (pas de clés répétées ~33 000 × 16 fois).
 */
export interface PricesFile {
  schemaVersion: typeof SCHEMA_VERSION;
  generatedAt: string;
  years: number[];
  /** Codes INSEE (COG 2025), arrondissements de Paris/Lyon/Marseille inclus. */
  codes: string[];
  /**
   * Départements absents de DVF (Alsace-Moselle, Mayotte) : à afficher « sans données »,
   * à distinguer d'une commune simplement trop peu active.
   */
  uncoveredDepartements: string[];
  series: Record<PropertyType, PriceSeries>;
}

export interface RatesFile {
  schemaVersion: typeof SCHEMA_VERSION;
  generatedAt: string;
  source: string;
  /** Taux moyen annuel (%), clé = année. */
  annual: Record<string, number>;
  /** Série mensuelle brute (%), période au format YYYY-MM. */
  monthly: { period: string; rate: number }[];
}

export function priceIndex(file: Pick<PricesFile, 'years'>, communeIndex: number, yearIndex: number): number {
  return communeIndex * file.years.length + yearIndex;
}
