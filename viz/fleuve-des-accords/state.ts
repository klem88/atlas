/** État de la page dans l'URL : `?a=irb&b=pop&de=V` (style A, style B ou rien, degré de départ ou rien). */
import { degreeToken, parseDegreeLabel, degreeLabel, tokenToDegree } from '@shell/music/degrees';

export interface VizState {
  a: string;
  b: string | null;
  /** Jeton du degré de départ isolé, ou null pour tout le fleuve. */
  from: number | null;
}

export const DEFAULT_STATE: VizState = { a: 'irb', b: 'pop', from: null };
const KEY_RE = /^[a-z0-9 ]{1,20}$/;

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const a = q.get('a');
  const b = q.get('b');
  const de = q.get('de');
  const d = de ? parseDegreeLabel(de) : null;
  return {
    a: a && KEY_RE.test(a) ? a : DEFAULT_STATE.a,
    b: b === '' || b === 'aucun' ? null : b && KEY_RE.test(b) ? b : b === null ? DEFAULT_STATE.b : null,
    from: d ? degreeToken(d) : null,
  };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.a !== DEFAULT_STATE.a) q.set('a', s.a);
  if (s.b !== DEFAULT_STATE.b) q.set('b', s.b ?? 'aucun');
  if (s.from !== null) q.set('de', degreeLabel(tokenToDegree(s.from)));
  const str = q.toString().replace(/%23/g, '#').replace(/\+/g, '%20');
  return str ? `?${str}` : '';
}
