/**
 * Carnet de travail : un tampon par « J’y arrive », avec l'exercice, le palier, la tonalité, le tempo et la date.
 * Les calculs sont purs ; le stockage (localStorage, propre à ce navigateur) est une fine couche à part,
 * qui ne lève jamais d'erreur : sans stockage, le carnet vit le temps de la visite.
 */

export interface Tampon {
  /** Identifiant de l'exercice (la progression). */
  p: string;
  /** Palier, à partir de 1. */
  s: number;
  /** Tonalité : classe de hauteur de la tonique. */
  k: number;
  /** Tempo, à la noire. */
  bpm: number;
  /** Date et heure, ISO 8601. */
  at: string;
}

export function meilleurTempo(tampons: readonly Tampon[], p: string, s: number, k: number): number | null {
  let best: number | null = null;
  for (const t of tampons) if (t.p === p && t.s === s && t.k === k && (best === null || t.bpm > best)) best = t.bpm;
  return best;
}

/** Meilleur tempo par palier (lignes) et par tonalité (colonnes, do = 0). */
export function grilleTempos(tampons: readonly Tampon[], p: string, paliers: number): (number | null)[][] {
  const g = Array.from({ length: paliers }, () => new Array<number | null>(12).fill(null));
  for (const t of tampons) {
    if (t.p !== p || t.s < 1 || t.s > paliers) continue;
    const ligne = g[t.s - 1]!;
    ligne[t.k] = Math.max(ligne[t.k] ?? 0, t.bpm);
  }
  return g;
}

/** Les tampons d'un exercice, du plus ancien au plus récent. */
export function serie(tampons: readonly Tampon[], p: string): Tampon[] {
  return tampons.filter((t) => t.p === p).sort((a, b) => a.at.localeCompare(b.at));
}

export function resume(tampons: readonly Tampon[]): { tampons: number; jours: number; tempoMoyen: number | null } {
  const jours = new Set(tampons.map((t) => t.at.slice(0, 10))).size;
  const tempoMoyen = tampons.length ? Math.round(tampons.reduce((s, t) => s + t.bpm, 0) / tampons.length) : null;
  return { tampons: tampons.length, jours, tempoMoyen };
}

function estTampon(x: unknown): x is Tampon {
  if (typeof x !== 'object' || x === null) return false;
  const t = x as Record<string, unknown>;
  return (
    typeof t.p === 'string' &&
    Number.isInteger(t.s) &&
    Number.isInteger(t.k) &&
    (t.k as number) >= 0 &&
    (t.k as number) < 12 &&
    typeof t.bpm === 'number' &&
    t.bpm > 0 &&
    typeof t.at === 'string' &&
    !Number.isNaN(Date.parse(t.at))
  );
}

/** Lit un carnet exporté (`{ tampons: [...] }` ou un tableau). `null` si le fichier n'en est pas un. */
export function lireCarnet(texte: string): Tampon[] | null {
  let data: unknown;
  try {
    data = JSON.parse(texte);
  } catch {
    return null;
  }
  const liste = Array.isArray(data) ? data : (data as { tampons?: unknown })?.tampons;
  if (!Array.isArray(liste) || !liste.every(estTampon)) return null;
  return liste.map(({ p, s, k, bpm, at }) => ({ p, s, k, bpm, at }));
}

const cle = (t: Tampon) => `${t.p}|${t.s}|${t.k}|${t.bpm}|${t.at}`;

/** Réunit deux carnets, sans doublons, du plus ancien au plus récent. */
export function fusionner(a: readonly Tampon[], b: readonly Tampon[]): Tampon[] {
  const vus = new Map<string, Tampon>();
  for (const t of [...a, ...b]) vus.set(cle(t), t);
  return [...vus.values()].sort((x, y) => x.at.localeCompare(y.at));
}

export const exporterCarnet = (tampons: readonly Tampon[]) => JSON.stringify({ version: 1, tampons }, null, 1);

/** Carnet gardé dans ce navigateur. */
export interface Carnet {
  tampons(): Tampon[];
  ajouter(t: Tampon): Tampon[];
  retirerDernier(): Tampon[];
  remplacer(tampons: readonly Tampon[]): Tampon[];
}

export function carnetStocke(slug: string): Carnet {
  const key = `atlas:${slug}:carnet`;
  let memoire: Tampon[] = [];
  try {
    memoire = lireCarnet(localStorage.getItem(key) ?? '[]') ?? [];
  } catch {
    // Stockage indisponible (navigation privée, aperçu) : le carnet reste en mémoire.
  }
  const ecrire = (tampons: Tampon[]) => {
    memoire = tampons;
    try {
      localStorage.setItem(key, exporterCarnet(tampons));
    } catch {
      // idem
    }
    return memoire;
  };
  return {
    tampons: () => memoire,
    ajouter: (t) => ecrire([...memoire, t]),
    retirerDernier: () => ecrire(memoire.slice(0, -1)),
    remplacer: (tampons) => ecrire([...tampons]),
  };
}
