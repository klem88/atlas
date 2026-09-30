/**
 * Toutes les sources externes du pipeline, en un seul endroit.
 * Changer de millésime ou de source = modifier ce fichier uniquement.
 */

/** Années couvertes par la visualisation (bornes incluses). */
export const FIRST_YEAR = 2010;
export const LAST_YEAR = 2025;

export const YEARS: readonly number[] = Array.from(
  { length: LAST_YEAR - FIRST_YEAR + 1 },
  (_, i) => FIRST_YEAR + i,
);

/**
 * Indicateurs de prix DV3F du Cerema (Licence Ouverte 2.0).
 * Hébergés sur un partage Box public ; les identifiants de fichiers sont résolus
 * à l'exécution par leur nom, pour survivre aux republications du Cerema.
 * Doc : https://doc-datafoncier.cerema.fr/doc/guide/dv3f/volume-et-prix
 */
export const CEREMA = {
  pageUrl: 'https://datafoncier.cerema.fr/donnees/autres-donnees-foncieres/indicateurs-prix',
  boxVanity: 'dv3f-indicateurs',
  /** Dossier « prix_volumes » du partage. */
  boxFolderId: '387040082118',
  /** Seuil de ventes en dessous duquel le Cerema masque les prix (secret statistique). */
  minTransactions: 11,
  sheets: {
    maison: { name: 'Ensemble des maisons', pxm2: 'pxm2_median_cod111', n: 'nbtrans_cod111' },
    appartement: { name: 'Ensemble des appartements', pxm2: 'pxm2_median_cod121', n: 'nbtrans_cod121' },
  },
  fileName: (level: 'communes' | 'epci', period: YearWindow) =>
    period.from === period.to
      ? `dv3f_prix_volumes_${level}_${period.from}.xlsx`
      : `dv3f_prix_volumes_${level}_${period.from}_${period.to}.xlsx`,
} as const;

export interface YearWindow {
  from: number;
  to: number;
}

/**
 * Fenêtre triennale utilisée comme repli pour une année donnée :
 * centrée sur l'année, décalée aux extrémités de la période publiée.
 */
export function triennialWindow(year: number, first = FIRST_YEAR, last = LAST_YEAR): YearWindow {
  const from = Math.min(Math.max(year - 1, first), last - 2);
  return { from, to: from + 2 };
}

/** Contours des communes, COG 2025, généralisés à 100 m (Etalab, Licence Ouverte 2.0). */
export const CONTOURS = {
  url: 'https://object.data.gouv.fr/contours-administratifs/2025/geojson/communes-100m.geojson.gz',
  /** Communes « parents » remplacées par leurs arrondissements (évite les superpositions). */
  plmParents: ['75056', '69123', '13055'],
  /** Collectivités hors périmètre DVF et hors carte (Pacifique, St-Pierre, St-Barth, St-Martin). */
  excludedPrefixes: ['975', '977', '978', '98'],
  /** Territoires dans le périmètre mais absents de DVF : affichés « sans données ». */
  noDataDepartements: ['57', '67', '68', '976'],
  /**
   * Allègement pour le web : 15 % des sommets conservés (formes préservées) et
   * quantification à 20 000 pas (≈50 m sur la métropole). ≈1,5 Mo gzip au lieu de 2,8.
   */
  simplify: '15%',
  quantization: 20_000,
} as const;

/**
 * Taux des crédits nouveaux à l'habitat des ménages, France (BCE, série MIR).
 * Même statistique que la Banque de France (collecte MIR), mais via une API publique sans clé.
 * Note : inclut les renégociations, ce qui tire le taux légèrement vers le bas en 2015-2017 et 2019-2020.
 */
export const RATES = {
  seriesKey: 'MIR.M.FR.B.A2C.A.R.A.2250.EUR.N',
  url: `https://data-api.ecb.europa.eu/service/data/MIR/M.FR.B.A2C.A.R.A.2250.EUR.N?format=csvdata&startPeriod=${FIRST_YEAR}-01`,
  attribution: 'BCE / Banque de France — taux des crédits nouveaux à l’habitat des ménages (MIR)',
} as const;
