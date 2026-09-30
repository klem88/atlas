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
  {
    slug: 'qui-chante',
    title: 'Qui chante autour de chez toi',
    summary: 'Les oiseaux observés autour de ta commune, leurs chants et le chœur de l’aube.',
    tags: ['Nature', 'Oiseaux', 'France'],
    status: 'published',
    published: '2026-09',
  },
  {
    slug: 'piano-temperament',
    title: 'Pourquoi ton piano est (légèrement) faux',
    summary: 'Joue un accord et regarde les ondes battre : sur un piano, aucune quinte n’est juste, et c’est voulu.',
    tags: ['Musique', 'Physique'],
    status: 'published',
    published: '2026-09',
  },
  {
    slug: 'forme-accord',
    title: 'La forme d’un accord',
    summary: 'Chaque accord dessine une courbe dans l’espace : simple quand il est pur, qui tourne sans fin quand il vient d’un piano.',
    tags: ['Musique', 'Géométrie'],
    status: 'published',
    published: '2026-09',
  },
  {
    slug: 'consonance',
    title: 'Pourquoi une tierce sonne douce',
    summary: 'Glisse d’une note à l’autre et écoute la rugosité monter et descendre : les intervalles doux sont des vallées, et ton piano n’en atteint aucune tout à fait.',
    tags: ['Musique', 'Psychoacoustique'],
    status: 'published',
    published: '2026-09',
  },
  {
    slug: 'gamme-sans-fin',
    title: 'La gamme qui monte sans fin',
    summary: 'Un son qui monte, monte, monte… et ne va nulle part. L’illusion de Shepard, vue de l’intérieur : une hélice de hauteurs qui tourne sur elle-même.',
    tags: ['Musique', 'Illusion'],
    status: 'published',
    published: '2026-09',
  },
  {
    slug: 'une-seule-note',
    title: 'Ce qu’une seule note contient',
    summary: 'Joue un do : tu entends déjà un accord majeur. Allume et éteins ses harmoniques une à une, et découvre celles que ton piano ne sait pas jouer.',
    tags: ['Musique', 'Acoustique'],
    status: 'published',
    published: '2026-09',
  },
  {
    slug: 'progression-jouee',
    title: 'Ta progression a déjà été jouée 40 000 fois',
    summary: 'Choisis quatre accords et la page te dit combien de morceaux les enchaînent, dans quels styles, depuis quand, et lesquels.',
    tags: ['Musique', 'Harmonie', 'Données'],
    status: 'draft',
    published: '2026-09',
  },
  {
    slug: 'fleuve-des-accords',
    title: 'Le fleuve des enchaînements',
    summary: 'D’un accord au suivant, où va la musique ? Compare deux styles : le jazz descend le cercle des quintes, la pop tourne autour de quatre accords.',
    tags: ['Musique', 'Harmonie', 'Données'],
    status: 'draft',
    published: '2026-09',
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
