/**
 * Toutes les sources externes du pipeline, en un seul endroit.
 */

/** Période des observations retenues (années complètes, bornes incluses). */
export const YEARS: [number, number] = [2015, 2025];

/** Seuil d'observations dans le voisinage 3 × 3 pour qu'une espèce soit retenue. */
export const MIN_COUNT = 5;

/**
 * Minimum d'observations en France pour retenir une espèce : en dessous, ce sont surtout
 * des erreurs d'identification ou des oiseaux échappés de captivité.
 */
export const NATIONAL_MIN = 20;

/**
 * Noms français corrigés à la main, quand TAXREF n'en donne pas pour la clé GBIF
 * et que les autres sources se contredisent. Référence : liste de la Commission de
 * l'avifaune française (CAF).
 */
export const FRENCH_NAMES: Record<string, string> = {
  'Cecropis daurica': 'Hirondelle rousseline',
  // Perroquets échappés de captivité, absents de TAXREF.
  'Aratinga mitrata': 'Conure mitrée',
  'Cacatua sulphurea': 'Cacatoès soufré',
};

/** Nombre d'espèces (les plus observées en France) pour lesquelles on publie un chant. */
export const SONG_SPECIES = 200;

/** Communes (API Découpage administratif, Etalab, Licence Ouverte 2.0). */
export const COMMUNES = {
  url: 'https://geo.api.gouv.fr/communes?fields=nom,code,centre,codeDepartement&format=json',
  /** Outre-mer hors périmètre (la grille ne couvre que la métropole et la Corse). */
  excludedPrefixes: ['97', '98'],
};

/**
 * Observations d'oiseaux (GBIF, occurrences de la classe Aves en France).
 * Licences des jeux de données : CC0, CC BY, CC BY-NC (toutes compatibles avec un site non commercial).
 * Doc : https://techdocs.gbif.org/en/openapi/v1/occurrence
 */
export const GBIF = {
  api: 'https://api.gbif.org/v1',
  avesKey: 212,
  /** Types d'enregistrements retenus : observations, pas de spécimens de musée ni de fossiles. */
  basisOfRecord: ['HUMAN_OBSERVATION', 'MACHINE_OBSERVATION', 'OBSERVATION', 'OCCURRENCE'],
  /** Jeu de données Xeno-canto « Bird sounds from around the world » republié sur GBIF. */
  xenoCantoDataset: 'b1047888-ae52-4179-9dd5-5448ea342a24',
  /** Plafond d'espèces renvoyées par maille (largement au-dessus du maximum observé, ~300). */
  facetLimit: 1000,
  concurrency: 4,
};

/** Paramètres communs à toutes les requêtes d'observations. */
export function occurrenceQuery(extra: Record<string, string>): string {
  const p = new URLSearchParams({
    country: 'FR',
    taxonKey: String(GBIF.avesKey),
    year: `${YEARS[0]},${YEARS[1]}`,
    occurrenceStatus: 'PRESENT',
    hasGeospatialIssue: 'false',
    limit: '0',
    ...extra,
  });
  for (const b of GBIF.basisOfRecord) p.append('basisOfRecord', b);
  return `${GBIF.api}/occurrence/search?${p}`;
}
