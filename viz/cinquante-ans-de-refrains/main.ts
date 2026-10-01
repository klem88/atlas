import { renderLineChart, type ChartScales } from '@shell/charts/line-chart';
import { attachScrub } from '@shell/charts/scrub';
import { escapeHtml } from '@shell/html';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import { createStore } from '@shell/store';
import { MEASURES, type Measure, type Series, type YearPoint, type YearsFile } from './data/contract';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { renderRibbons, type RibbonScales } from './ui/ribbons';
import { renderShareCard } from './ui/share-card';
import './viz.css';

mountShell({ currentSlug: 'cinquante-ans-de-refrains' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};
const els = {
  measures: $('measures'),
  corpus: $('corpus'),
  styleField: $('style-field'),
  style: $<HTMLSelectElement>('style'),
  result: $('result'),
  lineTitle: $('line-title'),
  lineHost: $('line-host'),
  line: document.getElementById('line') as unknown as SVGSVGElement,
  ribbonsHost: $('ribbons-host'),
  ribbons: document.getElementById('ribbons') as unknown as SVGSVGElement,
  ribbonsNote: $('ribbons-note'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
};

export const MEASURE_LABELS: Record<Measure, { chip: string; title: string; unit: (v: number) => string; word: string }> = {
  distincts: { chip: 'Accords distincts', title: 'Nombre moyen d’accords distincts par morceau', unit: (v) => v.toLocaleString('fr-FR', { maximumFractionDigits: 1 }), word: 'accords distincts en moyenne' },
  mineurs: { chip: 'Part des mineurs', title: 'Part des accords mineurs', unit: (v) => `${Math.round(v * 100)} %`, word: 'des accords sont mineurs' },
  quatre: { chip: 'Quatre accords ou moins', title: 'Part des morceaux qui tiennent en quatre accords ou moins', unit: (v) => `${Math.round(v * 100)} %`, word: 'des morceaux tiennent en quatre accords ou moins' },
  septiemes: { chip: 'Septièmes', title: 'Part des accords qui portent une septième', unit: (v) => `${Math.round(v * 100)} %`, word: 'des accords portent une septième' },
  emprunts: { chip: 'Emprunts', title: 'Part des accords dont la fondamentale sort de la gamme', unit: (v) => `${Math.round(v * 100)} %`, word: 'des accords sortent de la gamme' },
};

const store = createStore<VizState>(readStateFromUrl(location.search));
let file: YearsFile | null = null;
let lineScales: ChartScales | null = null;
let ribbonScales: RibbonScales | null = null;
const fr = (n: number) => n.toLocaleString('fr-FR');

els.measures.innerHTML = MEASURES.map((m) => `<button class="chip" type="button" data-measure="${m}" aria-pressed="false">${escapeHtml(MEASURE_LABELS[m].chip)}</button>`).join('');
els.measures.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-measure]');
  if (b) store.set({ measure: b.dataset.measure as Measure });
});
els.corpus.addEventListener('change', (e) => store.set({ corpus: (e.target as HTMLInputElement).value as VizState['corpus'], year: null }));
els.style.addEventListener('change', () => store.set({ style: els.style.value || null }));

function currentSeries(state: VizState): Series | null {
  if (!file) return null;
  if (state.corpus === 'billboard') return file.series.find((s) => s.key === 'billboard') ?? null;
  if (state.style) return file.series.find((s) => s.key === `cho:${state.style}`) ?? null;
  return file.series.find((s) => s.key === 'chordonomicon') ?? null;
}

const valueOf = (p: YearPoint, m: Measure): number | null => (m === 'septiemes' ? p.septiemes : p[m]);

function ticks(years: YearPoint[]): number[] {
  const y0 = years[0]!.year;
  const y1 = years[years.length - 1]!.year;
  const out: number[] = [];
  for (let y = Math.ceil(y0 / 10) * 10; y <= y1; y += 10) out.push(y);
  if (!out.includes(y0)) out.unshift(y0);
  if (!out.includes(y1)) out.push(y1);
  return out;
}

function renderCharts(state: VizState, series: Series) {
  const width = Math.max(320, Math.round(els.lineHost.clientWidth || 640));
  const years = series.years;
  const m = state.measure;
  const points = years.map((p) => ({ x: p.year, y: valueOf(p, m) }));
  const max = Math.max(...points.map((p) => p.y ?? 0));
  const yTicks = m === 'distincts' ? [0, Math.ceil(max)] : [0, Math.ceil(max * 10) / 10];
  const lineOpts = { width, height: 220, formatY: MEASURE_LABELS[m].unit, xTicks: ticks(years), yTicks, label: MEASURE_LABELS[m].title } as const;
  lineScales = renderLineChart(els.line, points, state.year !== null ? { ...lineOpts, current: state.year } : lineOpts);
  // Hachures des années fragiles, par-dessus la ligne du socle.
  const NS = 'http://www.w3.org/2000/svg';
  const y0 = years[0]!.year;
  const y1 = years[years.length - 1]!.year;
  const step = (lineScales.x(y1) - lineScales.x(y0)) / Math.max(1, y1 - y0);
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'lc-weak');
  for (const p of years) {
    if (p.songs >= series.minSongs) continue;
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', String(lineScales.x(p.year) - step / 2));
    r.setAttribute('y', '22');
    r.setAttribute('width', String(step));
    r.setAttribute('height', '176');
    r.setAttribute('fill', 'url(#rb-hatch)');
    g.append(r);
  }
  els.line.insertBefore(g, els.line.firstChild?.nextSibling ?? null);
  ribbonScales = renderRibbons(els.ribbons, years, { width, height: 200, current: state.year, xTicks: ticks(years), minSongs: series.minSongs });
  els.lineTitle.textContent = `${MEASURE_LABELS[m].title} — ${series.label}`;
  const weak = years.filter((p) => p.songs < series.minSongs).length;
  els.ribbonsNote.textContent = `${series.label} : ${fr(years.reduce((a, p) => a + p.songs, 0))} morceaux datés de ${y0} à ${y1}${weak ? ` ; ${weak} année${weak > 1 ? 's' : ''} hachurée${weak > 1 ? 's' : ''} (moins de ${series.minSongs} morceaux)` : ''}.${state.corpus === 'chordonomicon' ? ' Les années rondes (1990, 2000…) sont gonflées par les tablatures datées à la décennie seule.' : ''}`;
}

function renderResult(state: VizState, series: Series) {
  const m = state.measure;
  const years = series.years;
  const pick = state.year !== null ? years.find((p) => p.year === state.year) : null;
  const first = years.find((p) => p.songs >= series.minSongs) ?? years[0]!;
  const last = [...years].reverse().find((p) => p.songs >= series.minSongs) ?? years[years.length - 1]!;
  const v1 = valueOf(first, m);
  const v2 = valueOf(last, m);
  const trend = v1 !== null && v2 !== null ? `${first.year} : ${MEASURE_LABELS[m].unit(v1)} · ${last.year} : ${MEASURE_LABELS[m].unit(v2)}` : '';
  if (!pick) {
    els.result.innerHTML = `
      <p class="result-eyebrow">${escapeHtml(series.label)} · ${escapeHtml(MEASURE_LABELS[m].chip.toLowerCase())}</p>
      <p class="result-figure">${escapeHtml(trend)}</p>
      <p class="result-line">Entre la première et la dernière année bien peuplées. Glisse sur les courbes pour lire une année.</p>`;
    return;
  }
  const v = valueOf(pick, m);
  const weak = pick.songs < series.minSongs;
  els.result.innerHTML = `
    <p class="result-eyebrow">${escapeHtml(series.label)} · ${pick.year}${weak ? ' · <span class="result-weak">peu de morceaux</span>' : ''}</p>
    <p class="result-figure">${v === null ? '—' : escapeHtml(MEASURE_LABELS[m].unit(v))} <span class="result-unit">${escapeHtml(MEASURE_LABELS[m].word)}</span></p>
    <p class="result-line">${fr(pick.songs)} morceau${pick.songs > 1 ? 'x' : ''} cette année-là. Degrés : ${pick.degrees
      .map((d, i) => `${['I', 'ii', 'iii', 'IV', 'V', 'vi', 'autres'][i]} ${Math.round(d * 100)} %`)
      .slice(0, 6)
      .join(', ')}.</p>
    ${pick.most && pick.least ? `<p class="result-line">Le plus riche : <strong>${escapeHtml(pick.most.title)}</strong> (${escapeHtml(pick.most.artist)}, ${pick.most.distincts} accords) ; le plus sobre : <strong>${escapeHtml(pick.least.title)}</strong> (${escapeHtml(pick.least.artist)}, ${pick.least.distincts}).</p>` : ''}
    <p class="result-line detail">${escapeHtml(trend)}.</p>`;
}

function render(state: VizState) {
  if (!file) return;
  els.measures.querySelectorAll<HTMLButtonElement>('[data-measure]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.measure === state.measure)));
  for (const input of els.corpus.querySelectorAll<HTMLInputElement>('input')) input.checked = input.value === state.corpus;
  els.styleField.hidden = state.corpus === 'billboard';
  els.style.value = state.style ?? '';
  const series = currentSeries(state);
  if (!series) return;
  renderCharts(state, series);
  renderResult(state, series);
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
}
store.subscribe(render);

for (const [host, scales] of [
  [els.lineHost, () => lineScales],
  [els.ribbonsHost, () => ribbonScales],
] as const) {
  attachScrub(host, {
    selector: 'svg',
    scales: () => {
      const s = scales();
      return s ? ({ x: s.x, y: () => 0, xInvert: s.xInvert } as ChartScales) : null;
    },
    min: 1950,
    max: 2024,
    onPick: (x) => {
      const series = currentSeries(store.get());
      if (!series) return;
      const y0 = series.years[0]!.year;
      const y1 = series.years[series.years.length - 1]!.year;
      store.set({ year: Math.min(y1, Math.max(y0, x)) });
    },
  });
}

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'cinquante-ans-de-refrains.png',
  render: () => {
    const state = store.get();
    const series = currentSeries(state)!;
    return renderShareCard({ series, measure: state.measure, year: state.year, labels: MEASURE_LABELS, siteUrl: location.host + location.pathname });
  },
  text: () => {
    const state = store.get();
    const series = currentSeries(state);
    if (!series) return '';
    const years = series.years.filter((p) => p.songs >= series.minSongs);
    const a = years[0];
    const b = years[years.length - 1];
    if (!a || !b) return '';
    const m = state.measure;
    return `${MEASURE_LABELS[m].title}, ${series.label} : ${MEASURE_LABELS[m].unit(valueOf(a, m) ?? 0)} en ${a.year}, ${MEASURE_LABELS[m].unit(valueOf(b, m) ?? 0)} en ${b.year}. Et pourtant.`;
  },
});

async function boot() {
  try {
    const res = await fetch(assetUrl('data/cinquante-ans-de-refrains/years.json'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    file = (await res.json()) as YearsFile;
    els.style.innerHTML = `<option value="">tous</option>${file.series
      .filter((s) => s.genre)
      .map((s) => `<option value="${escapeHtml(s.genre!)}">${escapeHtml(s.label)}</option>`)
      .join('')}`;
    render(store.get());
  } catch (err) {
    console.error(err);
    els.result.innerHTML = '<p class="result-line">Les données n’ont pas pu être chargées. Recharge la page ; si ça persiste, le problème est de notre côté.</p>';
  }
}
void boot();
let lastWidth = 0;
new ResizeObserver(() => {
  const w = Math.round(els.lineHost.clientWidth);
  if (w && w !== lastWidth) {
    lastWidth = w;
    if (file) render(store.get());
  }
}).observe(els.lineHost);
