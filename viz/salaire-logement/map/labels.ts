/**
 * Placement des noms de communes sur la carte zoomée.
 *
 * Les communes sont examinées de la plus importante à la moins importante ; un nom est posé
 * s'il tombe dans la vue et ne chevauche aucun nom déjà posé. Ainsi les villes apparaissent
 * d'abord, puis les villages à mesure qu'on zoome et que la place se libère.
 */

export interface LabelCandidate {
  index: number;
  /** Point d'ancrage (centre de la commune), en coordonnées de la carte non zoomée. */
  x: number;
  y: number;
  /** Largeur du texte à l'écran (px). */
  width: number;
}

export interface PlacedLabel {
  index: number;
  /** Centre du texte, à l'écran (px). */
  x: number;
  y: number;
}

export interface LabelView {
  /** Transformation du zoom : écran = carte × k + (tx, ty). */
  k: number;
  tx: number;
  ty: number;
  width: number;
  height: number;
}

/** Zoom à partir duquel on nomme les communes : en dessous, la carte se lit comme un tout. */
export const LABEL_MIN_ZOOM = 3;

const HEIGHT = 14;
const GAP = 4;
/** Un nom pour ~9 000 px² de carte (une vingtaine sur téléphone), 60 au plus : les couleurs restent lisibles. */
const PX_PER_LABEL = 9000;
const MAX_LABELS = 60;

/**
 * @param ordered candidats déjà triés par importance décroissante (la commune sélectionnée en tête)
 */
export function placeLabels(ordered: readonly LabelCandidate[], view: LabelView): PlacedLabel[] {
  if (view.k < LABEL_MIN_ZOOM) return [];
  const max = Math.min(MAX_LABELS, Math.round((view.width * view.height) / PX_PER_LABEL));
  const placed: PlacedLabel[] = [];
  const boxes: [number, number, number, number][] = [];
  for (const c of ordered) {
    const x = c.x * view.k + view.tx;
    const y = c.y * view.k + view.ty;
    const x0 = x - c.width / 2 - GAP;
    const x1 = x + c.width / 2 + GAP;
    const y0 = y - HEIGHT / 2 - GAP;
    const y1 = y + HEIGHT / 2 + GAP;
    if (x0 < 0 || y0 < 0 || x1 > view.width || y1 > view.height) continue;
    if (boxes.some(([a0, b0, a1, b1]) => x0 < a1 && x1 > a0 && y0 < b1 && y1 > b0)) continue;
    boxes.push([x0, y0, x1, y1]);
    placed.push({ index: c.index, x, y });
    if (placed.length >= max) break;
  }
  return placed;
}
