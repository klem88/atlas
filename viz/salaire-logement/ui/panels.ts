import { renderLineChart } from '@shell/charts/line-chart';
import { fmtEuros, fmtEurosRounded, fmtInt, fmtPct } from '@shell/format';
import { escapeHtml } from '@shell/html';
import { PriceSource } from '../data/contract';
import { AREA_CLASSES } from '../domain/classes';
import { departementOf } from '../map/geo';
import type { CommuneResult, Model } from '../model';
import type { VizState } from '../state';

const TYPE_LABEL = { maison: 'Maison', appartement: 'Appartement' } as const;

/** Bloc « résultat » : le budget de l'année et son évolution. */
export function renderResult(target: HTMLElement, model: Model, state: VizState): void {
  const c = model.capacity(state);
  const rate = model.rateFor(state.year);
  const years = model.years;
  const series = years.map((x) => ({ x, y: model.capacity(state, x).maxPrice }));
  const best = series.reduce((a, b) => (b.y > a.y ? b : a));
  const delta = c.maxPrice / best.y - 1;

  target.innerHTML = `
    <p class="result-eyebrow">En ${state.year}, ton budget d’achat</p>
    <p class="result-figure">${fmtEurosRounded(c.maxPrice)}</p>
    <p class="result-detail">
      ${fmtEuros(Math.round(c.monthlyPayment))} de mensualité pendant ${state.assumptions.loanYears} ans à ${fmtPct(rate)},
      ${state.assumptions.downPayment > 0 ? `plus ${fmtEurosRounded(state.assumptions.downPayment)} d’apport, ` : ''}frais de notaire déduits.
    </p>
    <figure class="result-chart">
      <figcaption>Ton budget selon l’année${
        best.x !== state.year ? ` <span>· ${fmtInt(Math.round(Math.abs(delta) * 100))} % sous son pic de ${best.x}</span>` : ' <span>· au plus haut</span>'
      }</figcaption>
      <svg></svg>
    </figure>`;

  renderLineChart(target.querySelector('svg')!, series, {
    width: 320,
    height: 92,
    current: state.year,
    formatY: (y) => `${fmtInt(Math.round(y / 1000))} k€`,
    xTicks: [years[0]!, years.at(-1)!],
    label: `Budget d’achat de ${years[0]} à ${years.at(-1)}`,
    margin: { top: 22, right: 8, bottom: 20, left: 8 },
  });
}

/** Fiche de la commune sélectionnée, ou invitation à en choisir une. */
export function renderCommuneCard(
  target: HTMLElement,
  model: Model,
  state: VizState,
  commune: { code: string; nom: string } | null,
  onClear: () => void,
): void {
  if (!commune) {
    target.innerHTML = `<p class="commune-empty">Choisis une commune sur la carte, ou cherche-la par son nom, pour voir son détail et son évolution.</p>`;
    return;
  }

  const r = model.communeAt(state, commune.code);
  const title = `<header class="commune-head">
      <h2>${escapeHtml(commune.nom)} <span>(${departementOf(commune.code)})</span></h2>
      <button type="button" class="commune-clear" aria-label="Désélectionner ${escapeHtml(commune.nom)}">Retirer</button>
    </header>`;

  if (r.status.kind !== 'ok') {
    target.innerHTML = `${title}<p class="commune-empty">${statusSentence(r)}</p>`;
  } else {
    const p = r.status.price;
    const series = model.communeSeries(state, commune.code);
    const valid = series.filter((s): s is { x: number; y: number } => s.y !== null);
    const peak = valid.reduce((a, b) => (b.y > a.y ? b : a), valid[0]!);

    target.innerHTML = `${title}
      <p class="commune-figure"><span class="num">≈ ${fmtInt(Math.round(r.area!))}</span> m²</p>
      <p class="commune-detail">
        ${TYPE_LABEL[p.type]} au prix médian de <strong>${fmtEuros(p.pxm2)}/m²</strong> en ${state.year}
        — ${AREA_CLASSES[r.classIndex!]!.hint}.
      </p>
      <p class="note">${sourceSentence(p.src, p.n, state.year)}</p>
      <figure class="result-chart">
        <figcaption>Surface achetable selon l’année${peak && peak.x !== state.year ? ` <span>· ${fmtInt(Math.round(peak.y))} m² en ${peak.x}</span>` : ''}</figcaption>
        <svg></svg>
      </figure>`;

    renderLineChart(target.querySelector('svg')!, series, {
      width: 320,
      height: 92,
      current: state.year,
      formatY: (y) => `${fmtInt(Math.round(y))} m²`,
      xTicks: [model.years[0]!, model.years.at(-1)!],
      label: `Surface achetable à ${commune.nom} de ${model.years[0]} à ${model.years.at(-1)}`,
      margin: { top: 22, right: 8, bottom: 20, left: 8 },
    });
  }
  target.querySelector('.commune-clear')?.addEventListener('click', onClear);
}

/** Contenu de l'infobulle au survol d'une commune. */
export function tooltipHtml(model: Model, state: VizState, commune: { code: string; nom: string }): string {
  const r = model.communeAt(state, commune.code);
  const head = `<p class="tt-title">${escapeHtml(commune.nom)} <span>(${departementOf(commune.code)})</span></p>`;
  if (r.status.kind !== 'ok') return `${head}<p class="tt-muted">${statusSentence(r)}</p>`;
  const p = r.status.price;
  return `${head}
    <p class="tt-figure"><strong class="num">≈ ${fmtInt(Math.round(r.area!))} m²</strong> achetables</p>
    <p>${TYPE_LABEL[p.type]} · ${fmtEuros(p.pxm2)}/m² médian</p>
    <p class="tt-muted">${sourceSentence(p.src, p.n, state.year)}</p>`;
}

function statusSentence(r: CommuneResult): string {
  return r.status.kind === 'uncovered'
    ? 'Les ventes de ce territoire ne sont pas publiées dans les données de l’administration fiscale (régime foncier local).'
    : 'Pas assez de ventes de ce type de logement ici, ni dans l’intercommunalité, pour établir un prix.';
}

function sourceSentence(src: PriceSource, n: number, year: number): string {
  switch (src) {
    case PriceSource.CommuneAnnual:
      return `Prix mesuré sur ${fmtInt(n)} ventes en ${year}.`;
    case PriceSource.CommuneTriennial:
      return `Seulement ${fmtInt(n)} ventes en ${year} : prix calculé sur trois ans autour de ${year}.`;
    case PriceSource.EpciAnnual:
    case PriceSource.EpciTriennial:
      return `Trop peu de ventes dans la commune (${fmtInt(n)} en ${year}) : prix estimé à partir de l’intercommunalité.`;
    default:
      return '';
  }
}
