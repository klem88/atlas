/**
 * Recherche d'une progression dans les agrégats : le compte, ses parts par genre et par décennie,
 * l'équivalent dans le relatif (mineur ↔ majeur), les rotations proches. Fonctions pures.
 */
import { degreeLabel, progressionKey, rotations, type Degree } from '@shell/music/degrees';
import { ROW, type Meta, type ProgressionRow, type Shard } from '../data/contract';

export interface Breakdown {
  label: string;
  count: number;
  /** Part des morceaux de cette catégorie qui contiennent la suite (0–1) ; `null` si la catégorie est vide. */
  share: number | null;
}

export interface Found {
  key: string;
  total: number;
  minor: number;
  firstYear: number | null;
  /** Part du corpus (0–1). */
  share: number;
  byGenre: Breakdown[];
  byDecade: Breakdown[];
}

export interface Lookup {
  /** La suite telle que saisie, en épellation majeure (celle des agrégats). */
  degrees: Degree[];
  found: Found | null;
  /** Nombre de morceaux en dessous duquel une suite n'est pas retenue, pour cette longueur. */
  threshold: number;
  /** Rotations retenues, de la plus fréquente à la moins fréquente. */
  rotations: { degrees: Degree[]; found: Found }[];
}

/** Un degré saisi « en mineur » (i, bIII, bVI, bVII, v, iv…) ramené à l'épellation du relatif majeur, dont la tonique est trois demi-tons plus haut : i devient vi. */
export function toRelativeMajor(p: readonly Degree[]): Degree[] {
  return p.map((d) => ({ step: (d.step + 9) % 12, cls: d.cls }));
}

/** L'inverse : la même suite écrite depuis le relatif mineur (vi devient i). */
export function toRelativeMinor(p: readonly Degree[]): Degree[] {
  return p.map((d) => ({ step: (d.step + 3) % 12, cls: d.cls }));
}

/**
 * Une suite « se lit en mineur » si elle contient un i mineur et pas de I majeur : l'utilisateur pense alors
 * en la mineur, et les agrégats la connaissent sous son nom majeur (i–bVI–bIII–bVII → vi–IV–I–V).
 */
export function readsAsMinor(p: readonly Degree[]): boolean {
  const hasI = p.some((d) => d.step === 0 && d.cls === 'maj');
  const hasi = p.some((d) => d.step === 0 && d.cls === 'min');
  return hasi && !hasI;
}

function rowToFound(key: string, row: ProgressionRow, meta: Meta): Found {
  const total = row[ROW.total]!;
  const byGenre = meta.genres.map((label, i) => {
    const count = row[ROW.fixed + i]!;
    const base = meta.corpus.byGenre[i]!;
    return { label, count, share: base > 0 ? count / base : null };
  });
  const byDecade = meta.decades.map((d, i) => {
    const count = row[ROW.fixed + meta.genres.length + i]!;
    const base = meta.corpus.byDecade[i]!;
    return { label: String(d), count, share: base > 0 ? count / base : null };
  });
  return { key, total, minor: row[ROW.minor]!, firstYear: row[ROW.firstYear] || null, share: total / meta.corpus.songs, byGenre, byDecade };
}

export function findProgression(p: readonly Degree[], shard: Shard, meta: Meta): Found | null {
  const key = progressionKey(p);
  const row = shard.rows[key];
  return row ? rowToFound(key, row, meta) : null;
}

export function lookup(input: readonly Degree[], shard: Shard, meta: Meta): Lookup {
  const degrees = readsAsMinor(input) ? toRelativeMajor(input) : [...input];
  const found = findProgression(degrees, shard, meta);
  const rots = rotations(degrees)
    .map((r) => ({ degrees: r, found: findProgression(r, shard, meta) }))
    .filter((r): r is { degrees: Degree[]; found: Found } => r.found !== null)
    .sort((a, b) => b.found.total - a.found.total);
  return { degrees, found, threshold: meta.minSongs[meta.lengths.indexOf(degrees.length)] ?? 20, rotations: rots };
}

/** Décennie et genre où la suite est la plus fréquente (en part, pas en nombre) ; effectifs faibles écartés. */
export function peaks(f: Found, minBase = 200, meta?: Meta): { decade: Breakdown | null; genre: Breakdown | null } {
  const pick = (items: Breakdown[], bases: number[] | undefined) => {
    let best: Breakdown | null = null;
    items.forEach((b, i) => {
      if (b.share === null || (bases && bases[i]! < minBase)) return;
      if (!best || b.share > best.share!) best = b;
    });
    return best;
  };
  return { decade: pick(f.byDecade, meta?.corpus.byDecade), genre: pick(f.byGenre, meta?.corpus.byGenre) };
}

const fr = (n: number) => n.toLocaleString('fr-FR');
const pct = (x: number) => (x >= 0.1 ? `${Math.round(x * 100)} %` : x >= 0.01 ? `${(x * 100).toFixed(1).replace('.', ',')} %` : `${(x * 100).toFixed(2).replace('.', ',')} %`);

export const GENRE_LABELS: Readonly<Record<string, string>> = {
  pop: 'pop',
  rock: 'rock',
  country: 'country',
  alternative: 'alternatif',
  'pop rock': 'pop rock',
  punk: 'punk',
  metal: 'metal',
  rap: 'rap',
  soul: 'soul',
  jazz: 'jazz',
  reggae: 'reggae',
  electronic: 'électro',
};

/** Le genre avec son article, pour les phrases (« c’est la pop… », « c’est l’électro… »). */
export const GENRE_WITH_ARTICLE: Readonly<Record<string, string>> = {
  pop: 'la pop',
  rock: 'le rock',
  country: 'la country',
  alternative: 'l’alternatif',
  'pop rock': 'le pop rock',
  punk: 'le punk',
  metal: 'le metal',
  rap: 'le rap',
  soul: 'la soul',
  jazz: 'le jazz',
  reggae: 'le reggae',
  electronic: 'l’électro',
};

export const decadeLabel = (d: string | number, first = false) => (first ? `jusqu’aux années 1950` : `années ${d}`);

/** Le style et la décennie où la suite est la plus fréquente, en une phrase ; vide si rien ne se détache. */
export function peakSentence(f: Found, meta: Meta): string {
  const { decade, genre } = peaks(f, 200, meta);
  const parts: string[] = [];
  if (genre) parts.push(`C’est ${GENRE_WITH_ARTICLE[genre.label] ?? genre.label} qui l’aime le plus (${pct(genre.share!)} de ses morceaux)`);
  if (decade) parts.push(`${genre ? 'et ' : ''}son sommet, ${decade.label === '1950' ? 'c’est avant 1960' : `ce sont les années ${decade.label}`} (${pct(decade.share!)})`);
  return parts.length ? `${parts.join(', ')}.` : '';
}

/** La phrase de résultat, celle qui se partage. */
export function resultSentence(l: Lookup, meta: Meta): string {
  const label = l.degrees.map(degreeLabel).join('–');
  if (!l.found) return `${label} : moins de ${l.threshold} morceaux sur ${fr(meta.corpus.songs)}. Une suite rare, ou une suite qu’on n’écrit pas comme ça.`;
  const f = l.found;
  const head = `${label} est dans ${fr(f.total)} morceaux, soit ${pct(f.share)} du corpus${f.firstYear ? ` ; la première fois, c’était en ${f.firstYear}` : ''}.`;
  const tail = peakSentence(f, meta);
  return tail ? `${head} ${tail}` : head;
}

export { fr, pct };
