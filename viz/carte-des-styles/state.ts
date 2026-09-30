/** État dans l'URL : `?style=irb&morceau=irb:63`. */
export interface VizState {
  style: string;
  song: string | null;
}

export const DEFAULT_STATE: VizState = { style: 'irb', song: null };

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const st = q.get('style');
  const m = q.get('morceau');
  return { style: st && /^[a-z ]{1,20}$/.test(st) ? st : DEFAULT_STATE.style, song: m && /^(irb|bb):[\w-]+$/.test(m) ? m : null };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.style !== DEFAULT_STATE.style) q.set('style', s.style);
  if (s.song) q.set('morceau', s.song);
  const str = q.toString().replace(/%3A/g, ':').replace(/\+/g, '%20');
  return str ? `?${str}` : '';
}
