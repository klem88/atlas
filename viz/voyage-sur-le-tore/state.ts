/** État dans l'URL : `?morceau=irb:362&vitesse=lente`. */
export type Speed = 'lente' | 'normale' | 'rapide';

export interface VizState {
  song: string;
  speed: Speed;
}

export const SPEEDS: Record<Speed, number> = { lente: 0.5, normale: 0.32, rapide: 0.2 };
export const DEFAULT_STATE: VizState = { song: 'irb:63', speed: 'normale' };

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const m = q.get('morceau');
  const v = q.get('vitesse');
  return {
    song: m && /^(irb|bb):[\w-]+$/.test(m) ? m : DEFAULT_STATE.song,
    speed: v === 'lente' || v === 'rapide' || v === 'normale' ? v : DEFAULT_STATE.speed,
  };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.song !== DEFAULT_STATE.song) q.set('morceau', s.song);
  if (s.speed !== DEFAULT_STATE.speed) q.set('vitesse', s.speed);
  const str = q.toString().replace(/%3A/g, ':');
  return str ? `?${str}` : '';
}
