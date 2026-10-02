/**
 * Ce que la carte montre, pour une vue, une tonalité, des accords à faire paraître et un accord touché :
 * des disques identifiés par l'accord réel (un même accord garde son disque d'une tonalité à l'autre, ce qui fait
 * glisser les accords communs pendant une modulation), des flèches, des secteurs ou la fenêtre de la tonalité.
 *
 * - Cercle et grille : les sept accords de la tonalité ; autour d'un accord touché, ses voisins (dominante secondaire,
 *   ombre mineure) et ses portes (les tonalités proches qui le contiennent aussi).
 * - Bande des quintes : tous les accords rangés par quintes (majeurs, mineurs, diminués) ; la tonalité est une fenêtre
 *   de trois colonnes ; moduler, c'est la faire glisser.
 */
import { BACKGROUND_ARROWS, chordByLabel, layoutOf, type Fn, type Layout, type LocalView, type Point, type View } from './layout';
import { chordAt, chordId, diatonicChords, doorsOf, fifthsIndex, fifthsOffset, keyName, mod12, nameOf, neighborsOf, roleOf, type Chord } from './harmony';

export type NodeKind = 'diatonique' | 'voisin' | 'ailleurs' | 'porte';

export interface SceneNode {
  id: string;
  /** L'accord ; `null` pour une porte (une tonalité). */
  chord: Chord | null;
  /** La tonalité où mène une porte. */
  door: number | null;
  x: number;
  y: number;
  r: number;
  kind: NodeKind;
  fn: Fn | null;
  name: string;
  sub: string;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Scene {
  view: View;
  aspect: number;
  bend: number;
  minHop: number;
  nodes: SceneNode[];
  /** Flèches de fond, d'un identifiant de disque à un autre. */
  arrows: [string, string][];
  sectors: Layout['sectors'];
  sectorRadii: Layout['sectorRadii'];
  /** La fenêtre de la tonalité (bande), et celles des portes de l'accord touché. */
  window: Rect | null;
  ghostWindows: (Rect & { tonic: number; name: string })[];
}

export interface SceneInput {
  view: View;
  tonic: number;
  /** Accords à faire paraître même hors de la gamme (ceux de la progression choisie). */
  extras: readonly Chord[];
  /** L'accord touché : ses voisins et ses portes éclosent autour de lui. */
  focus: Chord | null;
}

export const doorId = (tonic: number) => `porte:${mod12(tonic)}`;

/** Angles (en degrés) des places autour d'un accord, comptés depuis la direction qui s'écarte du centre. */
const SLOT = { dominante: -28, emprunt: 28, ailleurs: 0, porteA: -74, porteB: 74 } as const;

function satellite(l: Layout, anchor: string, angle: number): Point {
  const a = l.positions[anchor]!;
  let dx = a.x - l.center.x;
  let dy = a.y - l.center.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) [dx, dy] = [0, 1];
  else [dx, dy] = [dx / len, dy / len];
  const t = (angle * Math.PI) / 180;
  const [rx, ry] = [dx * Math.cos(t) - dy * Math.sin(t), dx * Math.sin(t) + dy * Math.cos(t)];
  const r = l.satelliteRadius + 0.008;
  return {
    x: Math.min(1 - r, Math.max(r, a.x + rx * l.satelliteDistance)),
    y: Math.min(l.aspect - r, Math.max(r, a.y + ry * l.satelliteDistance)),
  };
}

function localScene(view: LocalView, input: SceneInput): Scene {
  const l = layoutOf(view);
  const { tonic, extras, focus } = input;
  const nodes = new Map<string, SceneNode>();
  for (const { chord, role } of diatonicChords(tonic)) {
    const p = l.positions[role.label]!;
    const r = role.label === 'I' && view === 'cercle' ? l.radius * 1.25 : l.radius;
    nodes.set(chordId(chord), { id: chordId(chord), chord, door: null, x: p.x, y: p.y, r, kind: 'diatonique', fn: role.fn, name: nameOf(chord), sub: role.label });
  }
  const satellites: Chord[] = [...extras];
  let focusAnchor: string | null = null;
  if (focus) {
    const r = roleOf(focus, tonic);
    if (r.kind === 'diatonique') satellites.push(...neighborsOf(r.label, tonic));
    else satellites.push(focus);
    focusAnchor = r.anchor ?? 'I';
  }
  for (const c of satellites) {
    const id = chordId(c);
    if (nodes.has(id)) continue;
    const role = roleOf(c, tonic);
    const p = satellite(l, role.anchor ?? 'I', SLOT[role.kind === 'diatonique' ? 'ailleurs' : role.kind]);
    nodes.set(id, { id, chord: c, door: null, ...p, r: l.satelliteRadius, kind: role.kind === 'ailleurs' ? 'ailleurs' : 'voisin', fn: role.fn, name: nameOf(c), sub: role.label });
  }
  if (focus && focusAnchor) {
    doorsOf(focus, tonic, 2).forEach((d, i) => {
      const p = satellite(l, focusAnchor, i === 0 ? SLOT.porteA : SLOT.porteB);
      const id = doorId(d.tonic);
      nodes.set(id, { id, chord: null, door: d.tonic, ...p, r: l.satelliteRadius, kind: 'porte', fn: null, name: nameOf({ root: d.tonic, cls: 'maj' }), sub: 'majeur' });
    });
  }
  const idOf = (label: string) => chordId(chordAt(tonic, chordByLabel(label)!.degree));
  return {
    view,
    aspect: l.aspect,
    bend: l.bend,
    minHop: l.minHop,
    nodes: [...nodes.values()],
    arrows: BACKGROUND_ARROWS.map(([a, b]) => [idOf(a), idOf(b)]),
    sectors: l.sectors,
    sectorRadii: l.sectorRadii,
    window: null,
    ghostWindows: [],
  };
}

/* Bande des quintes ------------------------------------------------------------------------------------------ */

export const BAND_HALF = 4;
const BAND_COLS = BAND_HALF * 2 + 1;
const BAND_ROWS = [0.1, 0.235, 0.37];
const BAND_ASPECT = 0.47;
const BAND_RADIUS = 0.043;

/** La colonne `c` du cycle des quintes : son accord majeur, son relatif mineur, et le diminué qui sert de vii°. */
export const bandColumn = (c: number): Chord[] => [
  { root: mod12(7 * c), cls: 'maj' },
  { root: mod12(7 * c + 9), cls: 'min' },
  { root: mod12(7 * c + 11), cls: 'dim' },
];

const columnX = (j: number) => (j + BAND_HALF + 0.5) / BAND_COLS;
const windowAt = (offset: number): Rect => ({ x: columnX(offset - 1) - 0.5 / BAND_COLS + 0.004, y: 0.035, w: 3 / BAND_COLS - 0.008, h: BAND_ROWS[2]! + 0.065 - 0.035 });

function bandScene(input: SceneInput): Scene {
  const { tonic, focus } = input;
  const k = fifthsIndex(tonic);
  const nodes: SceneNode[] = [];
  for (let j = -BAND_HALF; j <= BAND_HALF; j++) {
    bandColumn(k + j).forEach((chord, row) => {
      const role = roleOf(chord, tonic);
      const kind: NodeKind = role.kind === 'diatonique' ? 'diatonique' : role.kind === 'ailleurs' ? 'ailleurs' : 'voisin';
      nodes.push({ id: chordId(chord), chord, door: null, x: columnX(j), y: BAND_ROWS[row]!, r: BAND_RADIUS, kind, fn: role.fn, name: nameOf(chord), sub: kind === 'ailleurs' ? '' : role.label });
    });
  }
  const ghostWindows = focus
    ? doorsOf(focus, tonic, 2)
        .map((d) => ({ ...windowAt(fifthsOffset(tonic, d.tonic)), tonic: d.tonic, name: keyName(d.tonic), off: fifthsOffset(tonic, d.tonic) }))
        .filter((g) => Math.abs(g.off) <= BAND_HALF - 1)
        .map(({ off: _off, ...g }) => g)
    : [];
  const idOf = (label: string) => chordId(chordAt(tonic, chordByLabel(label)!.degree));
  return {
    view: 'bande',
    aspect: BAND_ASPECT,
    bend: 0.3,
    minHop: 0.07,
    nodes,
    arrows: BACKGROUND_ARROWS.map(([a, b]) => [idOf(a), idOf(b)]),
    sectors: [],
    sectorRadii: [0, 0],
    window: windowAt(0),
    ghostWindows,
  };
}

export function sceneOf(input: SceneInput): Scene {
  return input.view === 'bande' ? bandScene(input) : localScene(input.view, input);
}
