/**
 * La carte d'une tonalité majeure : les sept accords de la gamme, leur fonction, et leur place dans les dispositions
 * locales (cercle, grille). La bande des quintes, qui montre tous les accords, est dans `scene.ts`.
 * Les positions sont normalisées (0 à 1 en largeur, 0 à `aspect` en hauteur) ; la page les met à l'échelle.
 */
import { parseDegreeLabel, type Degree } from '@shell/music/degrees';

/** Repos (tonique), départ (sous-dominante), tension (dominante). */
export type Fn = 'repos' | 'depart' | 'tension';

export interface MapChord {
  label: string;
  degree: Degree;
  fn: Fn;
}

const chord = (label: string, fn: Fn): MapChord => ({ label, degree: parseDegreeLabel(label)!, fn });

/** Dans l'ordre de la gamme. */
export const DIATONIC: readonly MapChord[] = [
  chord('I', 'repos'),
  chord('ii', 'depart'),
  chord('iii', 'repos'),
  chord('IV', 'depart'),
  chord('V', 'tension'),
  chord('vi', 'repos'),
  chord('vii°', 'tension'),
];

export const FN_LABELS: Readonly<Record<Fn, { name: string; learned: string }>> = {
  repos: { name: 'repos', learned: 'tonique' },
  depart: { name: 'départ', learned: 'sous-dominante' },
  tension: { name: 'tension', learned: 'dominante' },
};

export type View = 'cercle' | 'grille' | 'bande';
export const VIEWS: readonly View[] = ['cercle', 'grille', 'bande'];
/** Les dispositions centrées sur une tonalité (la bande montre tout). */
export type LocalView = Exclude<View, 'bande'>;

export interface Point {
  x: number;
  y: number;
}

export interface Layout {
  view: LocalView;
  /** Hauteur rapportée à la largeur. */
  aspect: number;
  /** Rayon d'un accord de la gamme, et d'un voisin, en fraction de la largeur. */
  radius: number;
  satelliteRadius: number;
  /** Distance d'un voisin à l'accord auquel il se rattache. */
  satelliteDistance: number;
  /** Centre de la disposition : les voisins s'en écartent. */
  center: Point;
  /** Courbure des flèches (fraction de leur longueur), et hauteur minimale de la courbe (pour sauter par-dessus les disques voisins). */
  bend: number;
  minHop: number;
  positions: Readonly<Record<string, Point>>;
  /** Secteurs de fonction (cercle seulement) : angle de début et de fin, en degrés, sens horaire depuis 3 h. */
  sectors: readonly { fn: Fn; from: number; to: number }[];
  /** Rayons intérieur et extérieur des secteurs. */
  sectorRadii: readonly [number, number];
}

/**
 * Cercle : I au centre ; autour, trois secteurs de 120° (tension en haut, repos à droite, départ à gauche).
 * L'ordre horaire V, vii°, iii, vi, ii, IV suit le cycle des quintes, à IV près : la plupart des pas naturels
 * se font entre voisins, ou vers le centre. L'anneau laisse la place, au-dehors, aux accords voisins.
 */
const CIRCLE_ANGLES: Readonly<Record<string, number>> = { V: -110, 'vii°': -70, iii: 10, vi: 50, ii: 130, IV: 170 };
export const CIRCLE_RING = 0.31;

function circle(): Layout {
  const positions: Record<string, Point> = { I: { x: 0.5, y: 0.5 } };
  for (const [label, deg] of Object.entries(CIRCLE_ANGLES)) {
    const a = (deg * Math.PI) / 180;
    positions[label] = { x: 0.5 + CIRCLE_RING * Math.cos(a), y: 0.5 + CIRCLE_RING * Math.sin(a) };
  }
  return {
    view: 'cercle',
    aspect: 1,
    radius: 0.062,
    satelliteRadius: 0.047,
    satelliteDistance: 0.145,
    center: { x: 0.5, y: 0.5 },
    bend: 0.18,
    minHop: 0,
    positions,
    sectors: [
      { fn: 'tension', from: -150, to: -30 },
      { fn: 'repos', from: -30, to: 90 },
      { fn: 'depart', from: 90, to: 210 },
    ],
    sectorRadii: [0.13, 0.385],
  };
}

/** Grille « de livre » : la cadence IV – I – V au milieu, ses deux voisins mineurs dessous, ii et vii° au-dessus. */
function grid(): Layout {
  const positions: Record<string, Point> = {
    ii: { x: 0.28, y: 0.2 },
    'vii°': { x: 0.72, y: 0.2 },
    IV: { x: 0.17, y: 0.42 },
    I: { x: 0.5, y: 0.42 },
    V: { x: 0.83, y: 0.42 },
    vi: { x: 0.33, y: 0.64 },
    iii: { x: 0.67, y: 0.64 },
  };
  return {
    view: 'grille',
    aspect: 0.84,
    radius: 0.056,
    satelliteRadius: 0.044,
    satelliteDistance: 0.14,
    center: { x: 0.5, y: 0.42 },
    bend: 0.18,
    minHop: 0,
    positions,
    sectors: [],
    sectorRadii: [0, 0],
  };
}

export function layoutOf(view: LocalView): Layout {
  return view === 'grille' ? grid() : circle();
}

export const chordByLabel = (label: string): MapChord | undefined => DIATONIC.find((c) => c.label === label);

/** Retrouve l'accord de la carte qui correspond à un degré (ou rien s'il n'est pas dans la gamme). */
export const chordOfDegree = (d: Degree): MapChord | undefined => DIATONIC.find((c) => c.degree.step === d.step && c.degree.cls === d.cls);

/**
 * Flèche courbe de `a` vers `b` : courbe de Bézier quadratique qui s'incurve toujours à gauche du sens de marche
 * (A→B et B→A ne se superposent pas), au moins `minHop` de haut, raccourcie aux deux bouts pour partir du bord des disques
 * (`ra` au départ, `rb` à l'arrivée).
 */
export function arrowPath(a: Point, b: Point, ra: number, bend = 0.2, minHop = 0, rb = ra): { d: string; mid: Point; end: Point; angle: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dy / len;
  const ny = -dx / len;
  const lift = Math.max(bend * len, minHop);
  const c = { x: (a.x + b.x) / 2 + nx * lift, y: (a.y + b.y) / 2 + ny * lift };
  const trim = (from: Point, toward: Point, by: number): Point => {
    const l = Math.hypot(toward.x - from.x, toward.y - from.y) || 1;
    return { x: from.x + ((toward.x - from.x) * by) / l, y: from.y + ((toward.y - from.y) * by) / l };
  };
  const start = trim(a, c, ra * 1.15);
  const end = trim(b, c, rb * 1.3);
  const mid = { x: 0.25 * start.x + 0.5 * c.x + 0.25 * end.x, y: 0.25 * start.y + 0.5 * c.y + 0.25 * end.y };
  const angle = (Math.atan2(end.y - c.y, end.x - c.x) * 180) / Math.PI;
  const f = (n: number) => n.toFixed(4);
  return { d: `M${f(start.x)},${f(start.y)} Q${f(c.x)},${f(c.y)} ${f(end.x)},${f(end.y)}`, mid, end, angle };
}

/** Les attractions classiques, dessinées en fond de carte. */
export const BACKGROUND_ARROWS: readonly (readonly [string, string])[] = [
  ['V', 'I'],
  ['vii°', 'I'],
  ['IV', 'V'],
  ['ii', 'V'],
  ['IV', 'I'],
  ['vi', 'ii'],
  ['iii', 'vi'],
  ['vi', 'IV'],
];
