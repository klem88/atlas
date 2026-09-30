/** Chargement des données statiques, une part de suites par longueur, avec cache mémoire. */
import { parseChord } from '@shell/music/chords';
import { tokensOf } from '@shell/music/degrees';
import { assetUrl } from '@shell/site';
import type { Meta, NamedSong, Shard, SongsFile, TokenizedSong } from './contract';
import { validateMeta, validateShard, validateSongs } from './validate';

export const DATA_URL = assetUrl('data/progression-jouee');

async function fetchJson<T>(name: string): Promise<T> {
  const res = await fetch(`${DATA_URL}/${name}`);
  if (!res.ok) throw new Error(`${name} : HTTP ${res.status}`);
  return (await res.json()) as T;
}

let meta: Promise<Meta> | null = null;
let songs: Promise<TokenizedSong[]> | null = null;

/** Les jetons de degrés de chaque section, calculés une fois au chargement. */
export function tokenize(song: NamedSong): TokenizedSong {
  return { ...song, sections: song.sections.map((sec) => ({ ...sec, tokens: tokensOf(sec.chords.map(([sym]) => parseChord(sym)), song.tonic) })) };
}
const shards = new Map<number, Promise<Shard>>();

export const loadMeta = () => (meta ??= fetchJson<Meta>('meta.json').then(validateMeta));
export const loadSongs = () => (songs ??= fetchJson<SongsFile>('songs.json').then((f) => validateSongs(f).songs.map(tokenize)));
export function loadShard(n: number): Promise<Shard> {
  let p = shards.get(n);
  if (!p) {
    p = Promise.all([fetchJson<Shard>(`p${n}.json`), loadMeta()]).then(([s, m]) => validateShard(s, m));
    shards.set(n, p);
  }
  return p;
}
