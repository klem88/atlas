/**
 * Configuration du site : une seule source de vérité pour le nom, la navigation
 * et le catalogue des visualisations (utilisé par l'en-tête et la page d'accueil).
 */

export interface VizEntry {
  /** Nom du dossier `viz/<slug>/`, aussi utilisé dans l'URL. */
  slug: string;
  title: string;
  summary: string;
  /** Thèmes courts, affichés en surtitre. */
  tags: string[];
  /**
   * `draft` : visible sur l'accueil en développement seulement (la page reste accessible par son URL).
   * `published` : visible partout.
   */
  status: 'draft' | 'published';
  /** Mois de publication (AAAA-MM), sert au tri : la plus récente en premier. */
  published: string;
}

export const SITE = {
  name: 'Atlas',
  tagline: 'cartes & simulations',
} as const;

export const VISUALIZATIONS: readonly VizEntry[] = [
  {
    slug: 'salaire-logement',
    title: 'Ce que ton salaire achète',
    summary: 'Commune par commune, la surface que tes revenus permettent d’acheter, de 2010 à aujourd’hui.',
    tags: ['Logement', 'France', '2010–2025'],
    status: 'published',
    published: '2026-10',
  },
  // npm run new:viz ajoute ici les nouvelles entrées (en brouillon).
];

/** Visualisations à afficher sur l'accueil, la plus récente d'abord. */
export function listedVisualizations(includeDrafts: boolean, all: readonly VizEntry[] = VISUALIZATIONS): VizEntry[] {
  return all.filter((v) => includeDrafts || v.status === 'published').sort((a, b) => b.published.localeCompare(a.published));
}

/** URL publiques, relatives à la base de déploiement (`/` en local, `/atlas/` sur GitHub Pages). */
export const homeUrl = () => import.meta.env.BASE_URL;
export const vizUrl = (slug: string) => `${import.meta.env.BASE_URL}viz/${slug}/`;
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
