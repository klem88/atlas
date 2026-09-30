/**
 * Configuration du site : une seule source de vérité pour le nom, la navigation
 * et le catalogue des visualisations (utilisé par l'en-tête et la page d'accueil).
 */

export interface VizEntry {
  slug: string;
  title: string;
  summary: string;
  /** Thèmes courts, affichés en surtitre. */
  tags: string[];
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
    published: '2026-10',
  },
];

/** URL publiques, relatives à la base de déploiement (`/` en local, `/atlas/` sur GitHub Pages). */
export const homeUrl = () => import.meta.env.BASE_URL;
export const vizUrl = (slug: string) => `${import.meta.env.BASE_URL}viz/${slug}/`;
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
