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
  /**
   * `viz` (par défaut) : une visualisation, dans le catalogue principal.
   * `exercice` : un exercice au piano, rangé dans sa propre rubrique sur l'accueil.
   */
  kind?: EntryKind;
}

export type EntryKind = 'viz' | 'exercice';

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
    status: 'published',
    published: '2026-10',
  },
  {
    slug: 'fleuve-des-accords',
    title: 'Le fleuve des enchaînements',
    summary: 'D’un accord au suivant, où va la musique ? Compare deux styles : le jazz descend le cercle des quintes, la pop tourne autour de quatre accords.',
    tags: ['Musique', 'Harmonie', 'Données'],
    status: 'published',
    published: '2026-10',
  },
  {
    slug: 'voyage-sur-le-tore',
    title: 'Le voyage sur le tore',
    summary: 'Chaque accord est une case sur un tore ; un morceau y trace un chemin. Surprise : « Giant Steps » y avance à plus petits pas qu’« Autumn Leaves ».',
    tags: ['Musique', 'Géométrie'],
    status: 'published',
    published: '2026-10',
  },
  {
    slug: 'carte-des-styles',
    title: 'La boussole des styles',
    summary: 'Une rose par style, dessinée avec ses enchaînements d’accords préférés ; et pour ton morceau, le style auquel il ressemble le plus.',
    tags: ['Musique', 'Harmonie', 'Cartographie'],
    status: 'published',
    published: '2026-10',
  },
  {
    slug: 'cinquante-ans-de-refrains',
    title: 'Cinquante ans de refrains',
    summary: 'Année par année, ce que les chansons font de leurs accords : combien, lesquels, et ce que ça ne dit pas.',
    tags: ['Musique', 'Harmonie', 'Histoire'],
    status: 'published',
    published: '2026-10',
  },
  {
    slug: 'ou-le-solo-respire',
    title: 'Où le solo respire',
    summary: 'Sur chaque accord d’un standard, les notes que les grands solistes ont vraiment jouées : la couleur de l’accord, vue depuis 456 solos transcrits.',
    tags: ['Musique', 'Jazz', 'Improvisation'],
    status: 'published',
    published: '2026-10',
  },
  {
    slug: 'compose-ta-progression',
    title: 'Compose ta progression',
    summary: 'Pose un accord, choisis le suivant parmi ceux que les chansons jouent vraiment, et découvre en chemin si ta progression est un classique ou une rareté.',
    tags: ['Musique', 'Harmonie', 'Jeu'],
    status: 'published',
    published: '2026-10',
  },
  {
    slug: 'suis-les-fleches',
    title: 'Suis les flèches',
    summary: 'La carte d’une tonalité : sept accords, des flèches qui disent qui tire vers qui, et les progressions les plus jouées qui s’y dessinent pendant qu’elles sonnent.',
    tags: ['Musique', 'Harmonie', 'Apprendre'],
    status: 'published',
    published: '2026-10',
  },
  {
    slug: 'chemin-des-accords',
    title: 'Le chemin des accords',
    summary: 'Compose une progression sur la carte d’une tonalité : à chaque accord, vois où tu es, où tu peux aller, et d’où tu viens.',
    tags: ['Musique', 'Harmonie', 'Apprendre'],
    status: 'published',
    published: '2026-10',
  },
  {
    slug: 'les-ficelles',
    title: 'Les ficelles',
    summary: 'Six procédés de la chanson française des années 70 pour transformer une progression simple : à voir sur la portée, à écouter, à garder ou non.',
    tags: ['Musique', 'Harmonie', 'Apprendre'],
    status: 'published',
    published: '2026-10',
  },
  {
    slug: 'six-ficelles',
    title: 'Six ficelles au piano',
    summary: 'Une grille de huit mesures en Do, puis un ton plus haut, qui réunit les six ficelles de la chanson française : à jouer en quatre étapes, des accords plaqués à la mélodie.',
    tags: ['Piano', 'Harmonie', 'Exercice'],
    status: 'published',
    published: '2026-10',
    kind: 'exercice',
  },
  {
    slug: 'improviser-nostalgie',
    title: 'Improviser sur trois grilles nostalgiques',
    summary: 'Trois grilles mélancoliques en La mineur et en Do, et une méthode en six étapes pour improviser dessus : la main gauche d’abord, puis la gamme, les notes cibles, le motif et la question-réponse.',
    tags: ['Piano', 'Improvisation', 'Exercice'],
    status: 'draft',
    published: '2026-10',
    kind: 'exercice',
  },
  // npm run new:viz ajoute ici les nouvelles entrées (en brouillon).
];

/** Entrées d'une rubrique de l'accueil (visualisations ou exercices), la plus récente d'abord. */
export function listedVisualizations(
  includeDrafts: boolean,
  all: readonly VizEntry[] = VISUALIZATIONS,
  kind: EntryKind = 'viz',
): VizEntry[] {
  return all
    .filter((v) => (v.kind ?? 'viz') === kind && (includeDrafts || v.status === 'published'))
    .sort((a, b) => b.published.localeCompare(a.published));
}

/** URL publiques, relatives à la base de déploiement (`/` en local, `/atlas/` sur GitHub Pages). */
export const homeUrl = () => import.meta.env.BASE_URL;
export const vizUrl = (slug: string) => `${import.meta.env.BASE_URL}viz/${slug}/`;
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
