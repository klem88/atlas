/**
 * Les possibilités après un accord, dans la tonalité du moment : les sept accords de la gamme (toujours, tout reste
 * jouable), plus quelques voisins hors gamme (dominantes secondaires, emprunts) que les chansons jouent souvent ici.
 * Le poids vient du corpus : la part des morceaux qui, après cet accord, font ce pas (`p2.json` de progression-jouee).
 */
import { degreeLabel, parseDegreeLabel } from '@shell/music/degrees';
import { degreeIn, diatonicChords, mod12, roleOf, sameChord, type Chord, type Cls } from '../../suis-les-fleches/domain/harmony';

export type Rows = Readonly<Record<string, readonly number[]>>;

export interface Candidate {
  chord: Chord;
  /** Son degré dans la tonalité du moment (« vi », « V/V », « ♭VII »). */
  label: string;
  /** Part des morceaux qui font ce pas (0 à 1), ou `null` au départ. */
  share: number | null;
  count: number;
  satellite: boolean;
  /** L'accord de la gamme auquel un satellite se rattache. */
  anchor: string | null;
}

const CLASSES: readonly string[] = ['maj', 'min', 'dim'];
export const MIN_SATELLITE_SHARE = 0.01;

export function candidates(from: Chord | null, key: number, rows: Rows, maxSatellites = 3): Candidate[] {
  const diatonic = diatonicChords(key);
  if (!from) return diatonic.map(({ chord, role }) => ({ chord, label: role.label, share: null, count: 0, satellite: false, anchor: null }));

  const prefix = `${degreeLabel(degreeIn(from, key))},`;
  const counts = new Map<string, { chord: Chord; count: number }>();
  let total = 0;
  for (const [k, row] of Object.entries(rows)) {
    if (!k.startsWith(prefix)) continue;
    const n = row[0] ?? 0;
    total += n;
    const d = parseDegreeLabel(k.slice(prefix.length));
    if (!d || !CLASSES.includes(d.cls)) continue;
    const chord: Chord = { root: mod12(key + d.step), cls: d.cls as Cls };
    counts.set(`${chord.root}${chord.cls}`, { chord, count: n });
  }
  const shareOf = (c: Chord) => {
    const n = counts.get(`${c.root}${c.cls}`)?.count ?? 0;
    return { count: n, share: total > 0 ? n / total : 0 };
  };

  const inScale: Candidate[] = diatonic
    .filter(({ chord }) => !sameChord(chord, from))
    .map(({ chord, role }) => ({ chord, label: role.label, ...shareOf(chord), satellite: false, anchor: null }));

  const satellites: Candidate[] = [...counts.values()]
    .map(({ chord }) => ({ chord, role: roleOf(chord, key) }))
    .filter(({ chord, role }) => (role.kind === 'dominante' || role.kind === 'emprunt') && !sameChord(chord, from))
    .map(({ chord, role }) => ({ chord, label: role.label, ...shareOf(chord), satellite: true, anchor: role.anchor }))
    .filter((c) => c.share! >= MIN_SATELLITE_SHARE)
    .sort((a, b) => b.share! - a.share!)
    .slice(0, maxSatellites);

  return [...inScale, ...satellites];
}
