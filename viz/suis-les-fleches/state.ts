/** État dans l'URL : `?p=pop&vue=ligne&t=G` (les valeurs par défaut sont omises). */
import { parsePitch } from '@shell/music/chords';
import { KEY_NAMES } from '../compose-ta-progression/state';
import { VIEWS, type View } from './domain/layout';
import { DEFAULT_PROGRESSION, progressionById } from './domain/library';

export interface VizState {
  progression: string;
  view: View;
  tonic: number;
}

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const p = q.get('p');
  const v = q.get('vue') as View | null;
  return {
    progression: progressionById(p) ? p! : DEFAULT_PROGRESSION,
    view: v && VIEWS.includes(v) ? v : 'cercle',
    tonic: parsePitch(q.get('t') ?? 'C') ?? 0,
  };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.progression !== DEFAULT_PROGRESSION) q.set('p', s.progression);
  if (s.view !== 'cercle') q.set('vue', s.view);
  if (s.tonic !== 0) q.set('t', KEY_NAMES[s.tonic]!);
  const str = q.toString().replace(/%23/g, '#');
  return str ? `?${str}` : '';
}

export { KEY_NAMES };
