/** État de la page reflété dans l'URL : la progression (`p=I,V,vi,IV`), la tonalité d'écoute (`t=C`), l'exemple ouvert (`ex=irb:12`). */
import { parsePitch } from '@shell/music/chords';
import { parseProgression, progressionKey, type Degree } from '@shell/music/degrees';

export interface VizState {
  progression: Degree[];
  /** Classe de hauteur de la tonique pour l'écoute (0 = do). */
  tonic: number;
  /** Identifiant du morceau nommé dont la grille est ouverte. */
  example: string | null;
}

export const KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export const DEFAULT_PROGRESSION = 'I,V,vi,IV';

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const p = parseProgression(q.get('p') ?? DEFAULT_PROGRESSION) ?? parseProgression(DEFAULT_PROGRESSION)!;
  const t = parsePitch(q.get('t') ?? 'C');
  const ex = q.get('ex');
  return { progression: p, tonic: t ?? 0, example: ex && /^(irb|bb):[\w-]+$/.test(ex) ? ex : null };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  const key = progressionKey(s.progression);
  if (key !== DEFAULT_PROGRESSION) q.set('p', key);
  if (s.tonic !== 0) q.set('t', KEY_NAMES[s.tonic]!);
  if (s.example) q.set('ex', s.example);
  const str = q.toString().replace(/%2C/g, ',').replace(/%23/g, '#').replace(/%3A/g, ':');
  return str ? `?${str}` : '';
}
