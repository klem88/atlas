import { escapeHtml, normalizeForSearch } from './html';

export interface SearchItem {
  id: string;
  label: string;
  /** Précision affichée à droite (ex. numéro de département). */
  detail: string;
}

interface IndexedItem extends SearchItem {
  key: string;
}

const MAX_RESULTS = 8;

/** Classe les résultats : début du nom, puis début d'un mot, puis simple inclusion ; noms courts d'abord. */
export function rankItems<T extends { key: string; label: string }>(items: readonly T[], query: string): T[] {
  const q = normalizeForSearch(query);
  if (q.length < 2) return [];
  const scored: [number, T][] = [];
  for (const item of items) {
    const score = item.key.startsWith(q) ? 0 : item.key.includes(` ${q}`) ? 1 : item.key.includes(q) ? 2 : -1;
    if (score >= 0) scored.push([score, item]);
  }
  return scored
    .sort(([a, x], [b, y]) => a - b || x.label.length - y.label.length || x.label.localeCompare(y.label, 'fr'))
    .slice(0, MAX_RESULTS)
    .map(([, item]) => item);
}

/**
 * Champ de recherche avec suggestions (motif « combobox » de l'ARIA APG) :
 * flèches pour parcourir, Entrée pour choisir, Échap pour fermer.
 */
export function createSearch(
  target: HTMLElement,
  options: { label: string; placeholder: string; items: readonly SearchItem[]; onPick: (id: string) => void },
): { clear(): void } {
  const uid = `search-${Math.random().toString(36).slice(2, 8)}`;
  const items: IndexedItem[] = options.items.map((i) => ({ ...i, key: normalizeForSearch(i.label) }));

  target.innerHTML = `
    <label class="field-label" for="${uid}-input">${escapeHtml(options.label)}</label>
    <div class="search-box">
      <span class="input-affix">
        <svg class="search-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.4"/></svg>
        <input id="${uid}-input" type="search" role="combobox" autocomplete="off" spellcheck="false"
          aria-autocomplete="list" aria-expanded="false" aria-controls="${uid}-list" placeholder="${escapeHtml(options.placeholder)}" />
      </span>
      <ul class="search-list" id="${uid}-list" role="listbox" hidden></ul>
    </div>`;

  const input = target.querySelector<HTMLInputElement>('input')!;
  const list = target.querySelector<HTMLUListElement>('ul')!;
  let results: IndexedItem[] = [];
  let active = -1;

  const render = () => {
    list.hidden = results.length === 0;
    input.setAttribute('aria-expanded', String(results.length > 0));
    list.innerHTML = results
      .map(
        (r, i) =>
          `<li role="option" id="${uid}-opt-${i}" data-id="${escapeHtml(r.id)}" aria-selected="${i === active}">
            <span>${escapeHtml(r.label)}</span><span class="search-detail">${escapeHtml(r.detail)}</span>
          </li>`,
      )
      .join('');
    if (active >= 0) input.setAttribute('aria-activedescendant', `${uid}-opt-${active}`);
    else input.removeAttribute('aria-activedescendant');
  };

  const close = () => {
    results = [];
    active = -1;
    render();
  };

  const pick = (item: IndexedItem | undefined) => {
    if (!item) return;
    input.value = item.label;
    close();
    options.onPick(item.id);
  };

  input.addEventListener('input', () => {
    results = rankItems(items, input.value);
    active = results.length > 0 ? 0 : -1;
    render();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (results.length === 0) return;
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      render();
    } else if (e.key === 'Enter') {
      if (results.length > 0) {
        e.preventDefault();
        pick(results[active] ?? results[0]);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  });

  // mousedown plutôt que click : se déclenche avant la perte de focus du champ.
  list.addEventListener('mousedown', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLLIElement>('li[data-id]');
    if (!li) return;
    e.preventDefault();
    pick(results.find((r) => r.id === li.dataset.id));
  });
  input.addEventListener('blur', () => window.setTimeout(close, 100));

  return {
    clear() {
      input.value = '';
      close();
    },
  };
}
