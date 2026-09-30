/**
 * Agrégation des observations d'un voisinage de mailles.
 */

/** Observations d'une maille : nombre total et nombre par espèce (clé GBIF). */
export interface CellObservations {
  total: number;
  bySpecies: ReadonlyMap<number, number>;
}

export interface Neighborhood {
  total: number;
  /** Espèces retenues, de la plus observée à la moins observée. */
  species: { key: number; count: number }[];
}

/**
 * Somme les observations des mailles données et ne garde que les espèces vues au moins
 * `minCount` fois : un oiseau noté une ou deux fois est souvent un individu égaré ou une erreur.
 * À égalité, l'ordre suit la clé, pour un résultat stable d'une exécution à l'autre.
 */
export function aggregate(cells: readonly (CellObservations | undefined)[], minCount: number): Neighborhood {
  let total = 0;
  const sums = new Map<number, number>();
  for (const cell of cells) {
    if (!cell) continue;
    total += cell.total;
    for (const [key, n] of cell.bySpecies) sums.set(key, (sums.get(key) ?? 0) + n);
  }
  const species = [...sums]
    .filter(([, n]) => n >= minCount)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key - b.key);
  return { total, species };
}
