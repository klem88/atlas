/**
 * Choix d'un enregistrement Xeno-canto par espèce, à partir des occurrences republiées sur GBIF.
 */

export interface Recording {
  xcId: string;
  mp3: string;
  licence: string;
  /** Note Xeno-canto : 5 = A (excellent) … 1 = E. */
  rating: number;
  author: string;
  /** Code pays ISO 3166 (FR, ES…). */
  countryCode: string;
  year: number | null;
  /** Durée de l'enregistrement complet (s). */
  duration: number;
  /** Le type déclaré contient « song » (chant), par opposition aux cris. */
  song: boolean;
  /** D'autres espèces sont audibles en fond. */
  background: boolean;
  bitrate: number;
}

type Media = Record<string, string | undefined>;

export interface GbifOccurrence {
  catalogNumber?: string;
  behavior?: string;
  recordedBy?: string;
  countryCode?: string;
  year?: number;
  associatedTaxa?: string;
  extensions?: Record<string, Media[]>;
}

const MULTIMEDIA = 'http://rs.tdwg.org/ac/terms/Multimedia';
const DC = 'http://purl.org/dc/';

/** Durée minimale utile d'un enregistrement (s). */
export const MIN_DURATION = 6;

/** Lit une occurrence Xeno-canto ; null si elle n'a pas de son MP3 exploitable. */
export function parseRecording(o: GbifOccurrence): Recording | null {
  const sound = o.extensions?.[MULTIMEDIA]?.find((m) => m[`${DC}elements/1.1/type`] === 'Sound');
  if (!sound || !o.catalogNumber?.startsWith('XC')) return null;
  const mp3 = sound[`${DC}terms/identifier`];
  if (!mp3 || sound[`${DC}terms/format`] !== 'audio/mp3') return null;
  const technique = sound['http://rs.tdwg.org/ac/terms/resourceCreationTechnique'] ?? '';
  if (/automatic recording:\s*yes/.test(technique)) return null;
  return {
    xcId: o.catalogNumber,
    mp3,
    licence: sound[`${DC}terms/rights`] ?? '',
    rating: Number(sound['http://ns.adobe.com/xap/1.0/Rating'] ?? 0),
    author: sound[`${DC}elements/1.1/creator`] ?? o.recordedBy ?? '',
    countryCode: o.countryCode ?? '',
    year: o.year ?? null,
    duration: Number(/(\d+(?:\.\d+)?)\s*s/.exec(sound[`${DC}terms/description`] ?? '')?.[1] ?? 0),
    song: /\bsong\b/i.test(o.behavior ?? ''),
    background: /background/i.test(o.associatedTaxa ?? ''),
    bitrate: Number(/bitrate:\s*(\d+)/.exec(technique)?.[1] ?? 0),
  };
}

/** Licence utilisable : pas de clause ND (couper et tirer un spectrogramme, c'est modifier). */
export const usableLicence = (licence: string) => /^CC/.test(licence) && !/\bND\b/.test(licence);

/**
 * Meilleur enregistrement : un chant plutôt qu'un cri (quand l'espèce en a un), puis la note,
 * puis sans autres espèces en fond, enregistré en France, le plus récent.
 */
export function chooseRecording(candidates: readonly Recording[]): Recording | null {
  const usable = candidates.filter(
    (r) => usableLicence(r.licence) && r.duration >= MIN_DURATION && r.author && r.rating >= 3,
  );
  const score = (r: Recording): number[] => [
    r.song ? 1 : 0,
    r.rating,
    r.background ? 0 : 1,
    r.countryCode === 'FR' ? 1 : 0,
    r.year ?? 0,
  ];
  let best: Recording | null = null;
  let bestScore: number[] = [];
  for (const r of usable) {
    const s = score(r);
    if (!best || compare(s, bestScore) > 0) {
      best = r;
      bestScore = s;
    }
  }
  return best;
}

function compare(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i]! - b[i]!;
  return 0;
}

/** Page publique d'un enregistrement. */
export const xenoCantoPage = (xcId: string) => `https://xeno-canto.org/${xcId.slice(2)}`;
