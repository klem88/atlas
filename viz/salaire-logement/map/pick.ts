/**
 * Lecture du canvas de détection, où chaque commune est peinte d'une couleur unique (id = r + g·256 + b·65 536, 0 = vide).
 *
 * À l'échelle de la France, une commune ne fait que quelques pixels : la plupart des pixels sont des bords
 * anticrénelés, transparents ou mélangés. On ne lit donc pas un seul pixel, mais un petit carré autour du
 * point visé, et on renvoie les communes candidates de la plus proche à la plus lointaine. L'appelant
 * confirme ensuite chaque candidat sur la vraie géométrie, ce qui écarte les couleurs issues d'un mélange.
 */

export interface PickCandidate {
  /** Indice de la commune (id de couleur − 1). */
  index: number;
  /** Position du pixel le plus proche du centre où elle apparaît, relative au coin du carré lu. */
  x: number;
  y: number;
}

/**
 * @param data   pixels RGBA d'un carré de `size` × `size` centré sur le point visé
 * @param count  nombre de communes : un id hors de [1, count] vient forcément d'un mélange
 */
export function pickCandidates(data: ArrayLike<number>, size: number, count: number): PickCandidate[] {
  const c = (size - 1) / 2;
  const best = new Map<number, { d: number; x: number; y: number }>();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4;
      // Pixel partiellement couvert : sa couleur mélange plusieurs communes.
      if (data[o + 3] !== 255) continue;
      const id = data[o]! + (data[o + 1]! << 8) + (data[o + 2]! << 16);
      if (id < 1 || id > count) continue;
      const d = (x - c) ** 2 + (y - c) ** 2;
      const prev = best.get(id);
      if (!prev || d < prev.d) best.set(id, { d, x, y });
    }
  }
  return [...best.entries()].sort((a, b) => a[1].d - b[1].d).map(([id, p]) => ({ index: id - 1, x: p.x, y: p.y }));
}
