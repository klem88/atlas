/**
 * Le voyage d'un morceau : sa grille à plat (accords, parties, durées) devient une suite de triades avec leurs
 * positions sur le tore, plus les statistiques du chemin. Pur.
 */
import { parseChord, type Chord } from '@shell/music/chords';
import type { NamedSong } from '../data/contract';
import { nearestTriad, pathStats, triadTorus, type PathStats, type Triad } from './tonnetz';

export interface Stop {
  /** Indice dans la liste à plat. */
  index: number;
  section: number;
  symbol: string;
  beats: number;
  chord: Chord | null;
  triad: Triad | null;
  /** Faux si l'accord a été ramené à une triade voisine (diminué, augmenté, suspendu). */
  exact: boolean;
  /** Position sur le tore, ou null pour un silence. */
  pos: { s: number; t: number } | null;
}

export interface Journey {
  song: NamedSong;
  stops: Stop[];
  stats: PathStats;
  /** Nombre de temps total. */
  beats: number;
}

export function buildJourney(song: NamedSong): Journey {
  const stops: Stop[] = [];
  let beats = 0;
  song.sections.forEach((sec, si) => {
    for (const [symbol, dur] of sec.chords) {
      const chord = parseChord(symbol);
      const near = chord ? nearestTriad(chord) : null;
      stops.push({
        index: stops.length,
        section: si,
        symbol,
        beats: dur,
        chord,
        triad: near?.triad ?? null,
        exact: near?.exact ?? true,
        pos: near ? triadTorus(near.triad) : null,
      });
      beats += dur;
    }
  });
  return { song, stops, stats: pathStats(stops.map((s) => s.triad)), beats };
}

/** Les positions distinctes successives (sans répétition immédiate ni silence), pour tracer le chemin. */
export function journeyPath(j: Journey): { s: number; t: number; stop: Stop }[] {
  const out: { s: number; t: number; stop: Stop }[] = [];
  let prevKey = '';
  for (const st of j.stops) {
    if (!st.pos || !st.triad) continue;
    const k = `${st.triad.root}${st.triad.mode}`;
    if (k === prevKey) continue;
    prevKey = k;
    out.push({ s: st.pos.s, t: st.pos.t, stop: st });
  }
  return out;
}

/** « 38 pas, 1,4 en moyenne » : qualificatif du voyage. */
export function journeyWords(stats: PathStats): string {
  if (stats.steps.length === 0) return 'aucun changement d’accord';
  // Repères du corpus : moyenne 2,4 sur les tablatures, 2,7 sur les standards ; extrêmes 1,2 et 4.
  if (stats.mean < 1.9) return 'à petits pas, presque sans quitter ses voisins';
  if (stats.mean < 2.45) return 'à pas moyens, comme la plupart des chansons';
  if (stats.mean < 3) return 'à grandes enjambées';
  return 'en bonds, d’un bout du tore à l’autre';
}
