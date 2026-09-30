import type { ChartScales } from '@shell/charts/line-chart';
import { attachScrub } from '@shell/charts/scrub';
import { fmtInt, parseFrenchNumber } from '@shell/format';
import { createSearch } from '@shell/search';
import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import { createStore } from '@shell/store';
import type { Topology } from 'topojson-specification';
import { PriceTable } from './data/prices';
import { validatePrices, validateRates } from './data/validate';
import { affordableArea } from './domain/affordability';
import { classIndex } from './domain/classes';
import { isEstimate } from './data/prices';
import { decodeTopology, departementOf } from './map/geo';
import { CanvasMap, type CommuneFill } from './map/renderer';
import { Model } from './model';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { renderLegend } from './ui/legend';
import { renderAssumptionList, renderFormula } from './ui/method';
import { renderCommuneCard, renderResult, tooltipHtml } from './ui/panels';
import { setupShare, shareText } from './ui/share';
import { buildCardData } from './ui/share-card';
import { readTheme, watchTheme } from './ui/theme';
import { createTimeline } from './ui/timeline';
import './viz.css';

const DATA = assetUrl('data/salaire-logement');

mountShell({ currentSlug: 'salaire-logement' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};

async function loadJson(path: string): Promise<unknown> {
  const res = await fetch(`${DATA}/${path}`);
  if (!res.ok) throw new Error(`${path} : HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const [pricesRaw, ratesRaw, topo] = await Promise.all([
    loadJson('prices.json'),
    loadJson('rates.json'),
    loadJson('communes.topo.json'),
  ]);
  const prices = new PriceTable(validatePrices(pricesRaw));
  const model = new Model(prices, validateRates(ratesRaw, prices.years));
  const geo = decodeTopology(topo as Topology<never>);
  const communes = geo.communes.map((f) => f.properties);
  const indexByCode = new Map(communes.map((c, i) => [c.code, i]));

  const initial = readStateFromUrl(location.search, { first: prices.firstYear, last: prices.lastYear });
  if (initial.selectedCode && !indexByCode.has(initial.selectedCode)) initial.selectedCode = null;
  const store = createStore<VizState>(initial);

  // --- Carte ------------------------------------------------------------------
  let theme = readTheme();
  const mapEl = $('map');
  const tooltip = $('tooltip');
  const hint = $('map-hint');
  let hintTimer: number | undefined;
  let wheelTimer: number | undefined;
  let wheelCount = 0;

  const map = new CanvasMap(mapEl, geo, theme.map, {
    onHover(index, at) {
      if (index === null) {
        tooltip.dataset.visible = 'false';
        return;
      }
      tooltip.innerHTML = tooltipHtml(model, store.get(), communes[index]!);
      tooltip.dataset.visible = 'true';
      const { width, height } = mapEl.getBoundingClientRect();
      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;
      const x = at.x + 16 + tw > width ? at.x - tw - 12 : at.x + 16;
      const y = Math.min(Math.max(8, at.y - th / 2), height - th - 8);
      tooltip.style.transform = `translate(${x}px, ${y}px)`;
    },
    onSelect(index) {
      store.set({ selectedCode: index === null ? null : communes[index]!.code });
    },
    onWheelWithoutModifier() {
      // N'afficher l'aide qu'après une rafale de molette sur la carte, pas à chaque défilement de page.
      wheelCount++;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => (wheelCount = 0), 700);
      if (wheelCount < 6) return;
      hint.dataset.visible = 'true';
      window.clearTimeout(hintTimer);
      hintTimer = window.setTimeout(() => (hint.dataset.visible = 'false'), 1600);
    },
  });

  const fillsFor = (s: VizState): ((i: number) => CommuneFill) => {
    const maxPrice = model.capacity(s).maxPrice; // calculé une fois, pas 35 000
    return (i) => {
      const status = prices.lookup(communes[i]!.code, s.year, s.mode);
      if (status.kind === 'uncovered') return { color: theme.noData, texture: 'uncovered' };
      if (status.kind === 'no-market') return { color: theme.noMarket, texture: 'none' };
      const area = affordableArea(maxPrice, status.price.pxm2);
      return { color: theme.ramp[classIndex(area)]!, texture: isEstimate(status.price.src) ? 'estimate' : 'none' };
    };
  };

  $('zoom-in').addEventListener('click', () => map.zoomBy(2));
  $('zoom-out').addEventListener('click', () => map.zoomBy(0.5));
  $('zoom-reset').addEventListener('click', () => map.resetZoom());
  watchTheme(() => {
    theme = readTheme();
    map.setTheme(theme.map);
    map.setFills(fillsFor(store.get()));
  });

  // --- Réglages ---------------------------------------------------------------
  const incomeInput = $<HTMLInputElement>('income');
  const downInput = $<HTMLInputElement>('down-payment');
  const yearsInput = $<HTMLInputElement>('loan-years');

  /** Recopie l'état dans les champs, sauf celui en cours de saisie (sauf si `force`). */
  const syncInputs = (s: VizState, force?: HTMLInputElement) => {
    const editable = (el: HTMLInputElement) => el === force || document.activeElement !== el;
    if (editable(incomeInput)) incomeInput.value = fmtInt(s.netMonthlyIncome);
    if (editable(downInput)) downInput.value = fmtInt(s.assumptions.downPayment);
    if (editable(yearsInput)) yearsInput.value = String(s.assumptions.loanYears);
    for (const r of document.querySelectorAll<HTMLInputElement>('input[name="mode"]')) r.checked = r.value === s.mode;
  };

  const onNumber = (input: HTMLInputElement, apply: (n: number) => void, min: number, max: number) => {
    let t: number | undefined;
    input.addEventListener('input', () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const n = parseFrenchNumber(input.value);
        const valid = n !== null && n >= min && n <= max;
        input.closest('.input-affix')?.toggleAttribute('data-invalid', !valid && input.value.trim() !== '');
        if (valid) apply(n);
      }, 120);
    });
    input.addEventListener('blur', () => {
      // En quittant le champ : on revient à la dernière valeur valide, mise en forme.
      window.clearTimeout(t);
      input.closest('.input-affix')?.removeAttribute('data-invalid');
      syncInputs(store.get(), input);
    });
  };
  onNumber(incomeInput, (n) => store.set({ netMonthlyIncome: n }), 0, 100_000);
  onNumber(downInput, (n) => store.set({ assumptions: { ...store.get().assumptions, downPayment: n } }), 0, 10_000_000);
  onNumber(yearsInput, (n) => store.set({ assumptions: { ...store.get().assumptions, loanYears: Math.round(n) } }), 5, 25);
  $('mode').addEventListener('change', (e) => {
    store.set({ mode: (e.target as HTMLInputElement).value as VizState['mode'] });
  });
  $('settings').addEventListener('submit', (e) => e.preventDefault());

  const search = createSearch($('search'), {
    label: 'Trouver une commune',
    placeholder: 'Nantes, Guéret, Ajaccio…',
    items: communes.map((c) => ({ id: c.code, label: c.nom, detail: departementOf(c.code) })),
    onPick(code) {
      store.set({ selectedCode: code });
      map.zoomToCommune(indexByCode.get(code)!);
    },
  });

  // --- Frise, légende, panneaux -----------------------------------------------
  const timeline = createTimeline($('timeline'), {
    years: prices.years,
    rateFor: (y) => model.rateFor(y),
    onChange: (year) => store.set({ year }),
  });
  renderLegend($('legend'));

  // Les courbes du budget et de la commune choisissent aussi l'année, comme la frise : tout reste synchronisé par l'état.
  let resultScales: ChartScales | null = null;
  let communeScales: ChartScales | null = null;
  const pickYear = (year: number) => {
    timeline.stop();
    store.set({ year });
  };
  const years = { min: prices.years[0]!, max: prices.years.at(-1)! };
  attachScrub($('result'), { selector: '.result-chart svg', scales: () => resultScales, ...years, onPick: pickYear });
  attachScrub($('commune-card'), { selector: '.result-chart svg', scales: () => communeScales, ...years, onPick: pickYear });

  const renderPanels = (s: VizState) => {
    resultScales = renderResult($('result'), model, s);
    const i = s.selectedCode ? indexByCode.get(s.selectedCode) : undefined;
    communeScales = renderCommuneCard($('commune-card'), model, s, i === undefined ? null : communes[i]!, () => {
      store.set({ selectedCode: null });
      search.clear();
    });
    renderFormula($('formula'), model, s);
    renderAssumptionList($('assumption-list'), model, s);
  };

  // --- Partage ------------------------------------------------------------------
  const cardData = () => {
    const s = store.get();
    const budgetSeries = prices.years.map((x) => ({ x, y: model.capacity(s, x).maxPrice }));
    const i = s.selectedCode ? indexByCode.get(s.selectedCode) : undefined;
    let commune = null;
    if (i !== undefined) {
      const r = model.communeAt(s, communes[i]!.code);
      if (r.area !== undefined) {
        const series = model.communeSeries(s, communes[i]!.code);
        const valid = series.filter((p): p is { x: number; y: number } => p.y !== null);
        const peak = valid.length ? valid.reduce((a, b) => (b.y > a.y ? b : a)) : null;
        commune = { nom: communes[i]!.nom, area: r.area, peak, series };
      }
    }
    return buildCardData({
      netMonthlyIncome: s.netMonthlyIncome,
      year: s.year,
      rate: model.rateFor(s.year),
      commune,
      budget: { value: model.capacity(s).maxPrice, peak: budgetSeries.reduce((a, b) => (b.y > a.y ? b : a)), series: budgetSeries },
      url: location.href,
    });
  };
  setupShare($<HTMLButtonElement>('share-button'), $<HTMLDialogElement>('share-dialog'), {
    getData: cardData,
    getMapImage: () => map.element,
    getText: () => {
      const d = cardData();
      return shareText(store.get().netMonthlyIncome, d.figure, d.figureCaption, d.comparison);
    },
  });

  // --- Rendu réactif ----------------------------------------------------------
  let urlTimer: number | undefined;
  const render = (s: VizState, prev?: VizState) => {
    const dataChanged =
      !prev || s.year !== prev.year || s.mode !== prev.mode || s.netMonthlyIncome !== prev.netMonthlyIncome || s.assumptions !== prev.assumptions;
    if (dataChanged) map.setFills(fillsFor(s));
    if (!prev || s.selectedCode !== prev.selectedCode) {
      map.setSelected(s.selectedCode ? (indexByCode.get(s.selectedCode) ?? null) : null);
    }
    timeline.update(s.year);
    syncInputs(s);
    renderPanels(s);
    window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(() => history.replaceState(null, '', stateToSearch(s)), 300);
  };

  store.subscribe(render);
  render(store.get());
  if (initial.selectedCode) map.zoomToCommune(indexByCode.get(initial.selectedCode)!, 0);
  $('map-loading').remove();
}

main().catch((err: unknown) => {
  console.error(err);
  const loading = document.getElementById('map-loading');
  if (loading) {
    loading.textContent = 'Les données n’ont pas pu être chargées. Recharge la page ; si le problème persiste, la source a peut-être changé de format.';
    loading.dataset.error = 'true';
  }
});
