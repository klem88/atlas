import './tokens.css';
import './base.css';
import './page.css';
import './components.css';
import './charts/charts.css';
import { setupDetails } from './details';
import { escapeHtml } from './html';
import { SITE, VISUALIZATIONS, homeUrl, listedVisualizations, vizUrl, type EntryKind } from './site';

/**
 * Monte l'en-tête et le pied de page communs dans les éléments
 * `[data-site-header]` et `[data-site-footer]` de la page.
 * Le contenu propre à chaque visualisation reste dans son HTML.
 */
export function mountShell(options: { currentSlug?: string } = {}): void {
  const current = VISUALIZATIONS.find((v) => v.slug === options.currentSlug);

  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (header) {
    header.className = 'site-header';
    header.innerHTML = `
      <a class="site-mark" href="${homeUrl()}">${SITE.name}${current ? ` <span>· ${escapeHtml(current.title)}</span>` : ''}</a>
      <nav class="site-nav" aria-label="Site">
        <a href="${homeUrl()}"${current ? '' : ' aria-current="page"'}>Toutes les visualisations</a>
      </nav>`;
  }

  const footer = document.querySelector<HTMLElement>('[data-site-footer]');
  if (footer) {
    footer.className = 'site-footer';
    footer.innerHTML = `
      <span>${SITE.name} — ${SITE.tagline}</span>
      <span>Données publiques, code ouvert, calculs expliqués.</span>`;
  }

  setupDetails();
}

/**
 * Rend une rubrique de l'accueil (visualisations ou exercices au piano).
 * Les brouillons n'apparaissent qu'en développement. Renvoie le nombre d'entrées affichées.
 */
export function renderCatalog(target: HTMLElement, kind: EntryKind = 'viz'): number {
  const entries = listedVisualizations(import.meta.env.DEV, VISUALIZATIONS, kind);
  target.innerHTML = entries.map(
    (v) => `
    <li class="catalog-item"${v.status === 'draft' ? ' data-draft' : ''}>
      <a href="${vizUrl(v.slug)}">
        <p class="viz-kicker">${v.status === 'draft' ? 'Brouillon · ' : ''}${v.tags.map(escapeHtml).join(' · ')}</p>
        <h2>${escapeHtml(v.title)}</h2>
        <p>${escapeHtml(v.summary)}</p>
      </a>
    </li>`,
  ).join('');
  return entries.length;
}
