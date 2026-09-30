/**
 * Les morceaux nommés (iRb, Billboard) qui contiennent une progression : recherche de la suite de jetons
 * dans chaque section, position de la première occurrence, tri par année. Fonctions pures.
 */
import { degreeToken, type Degree } from '@shell/music/degrees';
import type { TokenizedSong } from '../data/contract';

export interface Example {
  song: TokenizedSong;
  /** Indice de la section et position (dans les jetons) de la première occurrence. */
  section: number;
  at: number;
  /** Nombre de sections qui la contiennent. */
  sections: number;
}

/** Position de `needle` dans `hay`, ou −1. */
export function indexOfSequence(hay: readonly number[], needle: readonly number[], from = 0): number {
  if (needle.length === 0) return -1;
  outer: for (let i = from; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

export function findExamples(songs: readonly TokenizedSong[], p: readonly Degree[]): Example[] {
  const needle = p.map(degreeToken);
  const out: Example[] = [];
  for (const song of songs) {
    let section = -1;
    let at = -1;
    let n = 0;
    for (let i = 0; i < song.sections.length; i++) {
      const pos = indexOfSequence(song.sections[i]!.tokens, needle);
      if (pos < 0) continue;
      n++;
      if (section < 0) {
        section = i;
        at = pos;
      }
    }
    if (section >= 0) out.push({ song, section, at, sections: n });
  }
  return out.sort((a, b) => (a.song.year ?? 9999) - (b.song.year ?? 9999) || a.song.title.localeCompare(b.song.title, 'fr'));
}

/**
 * Dans une section, les indices d'accords couverts par la progression : les jetons sont la suite sans répétition,
 * et il faut retrouver quels accords (avec leurs répétitions) portent chaque jeton.
 * `tokenOfChord` donne le jeton de chaque accord (ou −1 pour un silence).
 */
export function highlightRange(tokenOfChord: readonly number[], needle: readonly number[]): [number, number] | null {
  // Reconstitue la correspondance accord → rang de jeton (sans répétition immédiate).
  const rankOf: number[] = [];
  let rank = -1;
  let prev = -2;
  for (const t of tokenOfChord) {
    if (t < 0) {
      rankOf.push(-1);
      continue;
    }
    if (t !== prev) {
      rank++;
      prev = t;
    }
    rankOf.push(rank);
  }
  const tokens: number[] = [];
  tokenOfChord.forEach((t, i) => {
    if (t >= 0 && rankOf[i] === tokens.length) tokens.push(t);
  });
  const at = indexOfSequence(tokens, needle);
  if (at < 0) return null;
  const startRank = at;
  const endRank = at + needle.length - 1;
  let start = -1;
  let end = -1;
  rankOf.forEach((r, i) => {
    if (r === startRank && start < 0) start = i;
    if (r === endRank) end = i;
  });
  return start >= 0 && end >= 0 ? [start, end] : null;
}
