/** État dans l'URL : `?t=G&p=C,Am,D,G,Bm` (la maison, puis le chemin en accords réels ; valeurs par défaut omises). */
import { parseChord, parsePitch, triadClass } from '@shell/music/chords';
import { KEY_NAMES } from '../compose-ta-progression/state';
import type { Chord } from '../suis-les-fleches/domain/harmony';

export interface VizState {
  home: number;
  path: Chord[];
}

export const MAX_PATH = 32;
const SUFFIX: Record<Chord['cls'], string> = { maj: '', min: 'm', dim: 'dim' };

export const chordSymbol = (c: Chord) => `${KEY_NAMES[c.root]}${SUFFIX[c.cls]}`;

export function parseSymbol(s: string): Chord | null {
  const c = parseChord(s);
  if (!c) return null;
  const cls = triadClass(c.quality);
  return cls === 'maj' || cls === 'min' || cls === 'dim' ? { root: c.root, cls } : null;
}

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const path = (q.get('p') ?? '')
    .split(',')
    .filter(Boolean)
    .map(parseSymbol)
    .filter((c): c is Chord => c !== null)
    .slice(0, MAX_PATH);
  return { home: parsePitch(q.get('t') ?? 'C') ?? 0, path };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.home !== 0) q.set('t', KEY_NAMES[s.home]!);
  if (s.path.length) q.set('p', s.path.map(chordSymbol).join(','));
  // Virgules lisibles ; le dièse reste encodé (%23), sinon il ouvrirait un fragment.
  const str = q.toString().replace(/%2C/g, ',');
  return str ? `?${str}` : '';
}
