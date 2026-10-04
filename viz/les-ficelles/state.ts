/** État dans l'URL : `?t=G&p=G,Em,C,D&f=descend.0,emprunt.3` (la tonalité, le départ, la pile ; valeurs par défaut omises). */
import { parsePitch } from '@shell/music/chords';
import { KEY_NAMES } from '../compose-ta-progression/state';
import { IDS, type FicelleId } from './domain/ficelles';
import { cliche, egaux, lireAccord, MAX_DEPART, MIN_DEPART, symbole, type Accord } from './domain/grille';
import type { Geste } from './domain/pile';

export interface VizState {
  home: number;
  depart: Accord[];
  pile: Geste[];
}

const GESTE = /^([a-z]+)\.(\d+)$/;

export function readStateFromUrl(search: string): VizState {
  const q = new URLSearchParams(search);
  const home = parsePitch(q.get('t') ?? 'C') ?? 0;
  const lus = (q.get('p') ?? '').split(',').filter(Boolean).map((s) => lireAccord(s, home));
  const valides = lus.filter((a): a is Accord => a !== null);
  const depart = valides.length === lus.length && lus.length >= MIN_DEPART && lus.length <= MAX_DEPART ? valides : cliche(home);
  const pile = (q.get('f') ?? '').split(',').flatMap((s): Geste[] => {
    const m = GESTE.exec(s);
    return m && (IDS as readonly string[]).includes(m[1]!) ? [{ id: m[1] as FicelleId, index: Number(m[2]) }] : [];
  });
  return { home, depart, pile };
}

export function stateToSearch(s: VizState): string {
  const q = new URLSearchParams();
  if (s.home !== 0) q.set('t', KEY_NAMES[s.home]!);
  const c = cliche(s.home);
  if (s.depart.length !== c.length || s.depart.some((a, i) => !egaux(a, c[i]!))) q.set('p', s.depart.map(symbole).join(','));
  if (s.pile.length) q.set('f', s.pile.map((g) => `${g.id}.${g.index}`).join(','));
  // Virgules et barres obliques lisibles ; le dièse reste encodé (%23), sinon il ouvrirait un fragment.
  const str = q.toString().replace(/%2C/g, ',').replace(/%2F/g, '/');
  return str ? `?${str}` : '';
}
