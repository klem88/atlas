import { readFile } from 'node:fs/promises';
import { downloadCached } from '@tools/lib/download';

/**
 * Lit une réponse JSON d'API, mise en cache dans `path` : une relance du pipeline
 * ne refait que les requêtes manquantes. Les échecs passagers sont retentés, longtemps :
 * GBIF limite le débit (HTTP 429) et peut refuser plusieurs fois de suite.
 */
export async function cachedJson<T>(url: string, path: string): Promise<T> {
  await downloadCached(url, path, { minBytes: 2, retries: 8 });
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

interface FacetResponse {
  count: number;
  facets?: { field: string; counts: { name: string; count: number }[] }[];
}

/** Réponse d'une recherche d'occurrences GBIF à facette unique : total et comptes par valeur. */
export async function facetCounts(url: string, path: string): Promise<{ total: number; counts: Map<number, number> }> {
  const r = await cachedJson<FacetResponse>(url, path);
  if (typeof r.count !== 'number') throw new Error(`Réponse GBIF inattendue (${path})`);
  const counts = new Map((r.facets?.[0]?.counts ?? []).map((c) => [Number(c.name), c.count] as const));
  return { total: r.count, counts };
}
