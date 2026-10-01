/** État dans l'URL : `?p=I,V,vi&t=C&style=pop` (suite éventuellement vide). */
import { parsePitch } from '@shell/music/chords';
import { parseDegreeLabel, progressionKey, type Degree } from '@shell/music/degrees';

export interface VizState {
  progression: Degree[];
  tonic: number;
  style: string | null;
}

export const KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export const MAX_CHORDS = 8;

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const p = (q.get('p') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseDegreeLabel);
  const progression = p.every((d): d is Degree => d !== null) ? p.slice(0, MAX_CHORDS) : [];
  const t = parsePitch(q.get('t') ?? 'C');
  const st = q.get('style');
  return { progression, tonic: t ?? 0, style: st && /^[a-z ]{1,20}$/.test(st) ? st : null };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.progression.length) q.set('p', progressionKey(s.progression));
  if (s.tonic !== 0) q.set('t', KEY_NAMES[s.tonic]!);
  if (s.style) q.set('style', s.style);
  const str = q.toString().replace(/%2C/g, ',').replace(/%23/g, '#').replace(/\+/g, '%20');
  return str ? `?${str}` : '';
}
