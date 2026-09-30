/**
 * Les morceaux nommés (standards de l'iRb, titres du Billboard) dans le format servi aux pages : grilles par partie,
 * tonalité annotée (le mode du Billboard est déduit des accords de tonique), identifiant stable.
 */
import { dedupeBillboard, readBillboard, readIrb, type CorpusSong } from './corpora';
import { knownKey } from './degrees-corpus';

export interface NamedSection {
  name: string;
  /** [symbole, temps] */
  chords: [string, number][];
}

export interface NamedSongRecord {
  id: string;
  corpus: 'irb' | 'billboard';
  title: string;
  artist: string;
  year: number | null;
  /** Tonique du relatif majeur (l'armure). */
  tonic: number;
  mode: 'major' | 'minor';
  sections: NamedSection[];
}

export function toNamedSong(song: CorpusSong): NamedSongRecord | null {
  const key = knownKey(song);
  if (!key || !song.title || (song.corpus !== 'irb' && song.corpus !== 'billboard')) return null;
  return {
    id: song.id,
    corpus: song.corpus,
    title: song.title,
    artist: song.artist ?? '',
    year: song.year ?? null,
    tonic: key.relativeMajor,
    mode: key.mode,
    sections: song.sections
      .map((sec) => ({ name: sec.name, chords: sec.chords.map((c) => [c.symbol, Math.round(c.beats * 100) / 100] as [string, number]) }))
      .filter((s) => s.chords.length > 0),
  };
}

/** iRb puis Billboard (dédoublonné), avec les morceaux bruts pour les mesures. */
export async function loadNamedSongs(): Promise<{ irb: CorpusSong[]; billboard: CorpusSong[]; named: NamedSongRecord[] }> {
  const irb = await readIrb();
  const billboard = dedupeBillboard(await readBillboard());
  const named = [...irb, ...billboard].map(toNamedSong).filter((s): s is NamedSongRecord => s !== null);
  return { irb, billboard, named };
}
