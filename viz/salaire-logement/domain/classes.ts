/**
 * Classes de surface pour la carte (choroplèthe à seuils).
 * Des seuils fixes et lisibles plutôt qu'une échelle continue : on lit « 35 à 50 m² »,
 * pas une nuance, et une même couleur garde le même sens d'une année à l'autre.
 */
export interface AreaClass {
  /** Borne basse incluse (m²). */
  min: number;
  /** Borne haute exclue (m²), Infinity pour la dernière classe. */
  max: number;
  label: string;
  /** Repère concret, pour l'explication. */
  hint: string;
}

export const AREA_CLASSES: readonly AreaClass[] = [
  { min: 0, max: 20, label: 'moins de 20 m²', hint: 'moins qu’un studio' },
  { min: 20, max: 35, label: '20 à 35 m²', hint: 'un studio' },
  { min: 35, max: 50, label: '35 à 50 m²', hint: 'un deux-pièces' },
  { min: 50, max: 70, label: '50 à 70 m²', hint: 'un trois-pièces' },
  { min: 70, max: 100, label: '70 à 100 m²', hint: 'un logement familial' },
  { min: 100, max: 150, label: '100 à 150 m²', hint: 'une grande maison' },
  { min: 150, max: Infinity, label: '150 m² et plus', hint: 'très spacieux' },
];

export function classIndex(area: number): number {
  const i = AREA_CLASSES.findIndex((c) => area >= c.min && area < c.max);
  return i === -1 ? 0 : i;
}
