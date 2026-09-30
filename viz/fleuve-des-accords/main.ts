import { escapeHtml } from '@shell/html';
import { tokenToDegree } from '@shell/music/degrees';
import { equalFrequency } from '@shell/music/pitch';
import { Synth } from '@shell/music/synth';
import { voice } from '@shell/music/voicing';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import { createStore } from '@shell/store';
import type { StyleAgg, TransitionsFile } from './data/contract';
import { validateTransitions } from './data/validate';
import { arrivalsFrom, buildFlow, compareSentence, labelOf, oddsWords, topTokens, type Flow } from './domain/flow';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { renderRiver } from './ui/river';
import type { Ribbon } from './ui/river-layout';
import { renderShareCard } from './ui/share-card';
import './viz.css';

mountShell({ currentSlug: 'fleuve-des-accords' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};
const els = {
  a: $<HTMLSelectElement>('style-a'),
  b: $<HTMLSelectElement>('style-b'),
  presets: $('presets'),
  departures: $('departures'),
  result: $('result'),
  listen: $<HTMLButtonElement>('listen'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
  rivers: $('rivers'),
  caption: $('caption'),
};

const PRESETS: { label: string; a: string; b: string | null; from: number | null }[] = [
  { label: 'Jazz contre pop, après un V', a: 'irb', b: 'pop', from: 7 * 6 },
  { label: 'Country contre metal', a: 'country', b: 'metal', from: null },
  { label: 'Années 60 contre années 2010', a: 'd1960', b: 'd2010', from: null },
  { label: 'Billboard contre tablatures', a: 'billboard', b: 'all', from: 7 * 6 },
  { label: 'Après un ii, jazz contre rock', a: 'irb', b: 'rock', from: 2 * 6 + 1 },
];

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();
let styles = new Map<string, StyleAgg>();
const fr = (n: number) => n.toLocaleString('fr-FR');
const pct = (x: number) => `${Math.round(x * 100)} %`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* Panneau ------------------------------------------------------------------------------------------ */

function fillSelects(file: TransitionsFile) {
  const groups: [string, StyleAgg[]][] = [
    ['Corpus', file.styles.filter((s) => s.kind === 'all' || s.kind === 'corpus')],
    ['Genres (tablatures)', file.styles.filter((s) => s.kind === 'genre')],
    ['Décennies (tablatures)', file.styles.filter((s) => s.kind === 'decade')],
  ];
  const html = groups.map(([g, list]) => `<optgroup label="${escapeHtml(g)}">${list.map((s) => `<option value="${escapeHtml(s.key)}">${escapeHtml(cap(s.label))} · ${fr(s.songs)}</option>`).join('')}</optgroup>`).join('');
  els.a.innerHTML = html;
  els.b.innerHTML = `<option value="">aucun autre style</option>${html}`;
}
els.a.addEventListener('change', () => store.set({ a: els.a.value }));
els.b.addEventListener('change', () => store.set({ b: els.b.value || null }));
els.presets.innerHTML = PRESETS.map((p, i) => `<button class="chip" type="button" data-preset="${i}" aria-pressed="false">${escapeHtml(p.label)}</button>`).join('');
els.presets.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-preset]');
  if (!b) return;
  const p = PRESETS[Number(b.dataset.preset)]!;
  store.set({ a: p.a, b: p.b, from: p.from });
});
els.departures.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-from]');
  if (!b) return;
  const t = b.dataset.from === '' ? null : Number(b.dataset.from);
  store.set({ from: t });
});

function renderDepartures(state: VizState, a: StyleAgg) {
  const tokens = topTokens(a, 0, 10);
  els.departures.innerHTML =
    `<button class="chip" type="button" data-from="" aria-pressed="${state.from === null}">tout le fleuve</button>` +
    tokens.map((t) => `<button class="chip" type="button" data-from="${t}" aria-pressed="${state.from === t}">${escapeHtml(labelOf(t))}</button>`).join('');
}

function renderResult(state: VizState, a: StyleAgg, b: StyleAgg | null) {
  if (state.from === null) {
    const top = a.rows[0];
    els.result.innerHTML = `
      <p class="result-eyebrow">${escapeHtml(cap(a.label))} · ${fr(a.songs)} morceaux · ${fr(a.transitions)} transitions</p>
      <p class="result-figure">${top ? `${escapeHtml(labelOf(top[0]))} → ${escapeHtml(labelOf(top[1]))}` : '—'}</p>
      <p class="result-line">${top ? `est l’enchaînement le plus joué : <strong>${pct(top[2] / a.transitions)}</strong> de toutes les transitions.` : ''}${b ? ` ${escapeHtml(cap(b.label))} : ${b.rows[0] ? `${escapeHtml(labelOf(b.rows[0][0]))} → ${escapeHtml(labelOf(b.rows[0][1]))} (${pct(b.rows[0][2] / b.transitions)})` : '—'}.` : ''}</p>
      <p class="result-sentence">Choisis un degré de départ pour comparer où chacun va.</p>`;
    return;
  }
  const arrA = arrivalsFrom(a, state.from).slice(0, 3);
  const arrB = b ? arrivalsFrom(b, state.from).slice(0, 3) : [];
  const list = (label: string, arr: typeof arrA) =>
    `<div class="arrivals"><p class="arrivals-title">${escapeHtml(cap(label))}</p>${arr.length ? `<ol>${arr.map((x) => `<li><span class="arrivals-degree">${escapeHtml(x.label)}</span><span class="arrivals-bar"><span style="width:${(x.share * 100).toFixed(1)}%"></span></span><span class="arrivals-value">${pct(x.share)}</span></li>`).join('')}</ol>` : '<p class="arrivals-none">trop rare</p>'}</div>`;
  els.result.innerHTML = `
    <p class="result-eyebrow">Après un ${escapeHtml(labelOf(state.from))}</p>
    <p class="result-figure">${arrA[0] ? `→ ${escapeHtml(arrA[0].label)} <span class="result-unit">${escapeHtml(oddsWords(arrA[0].share))}</span>` : '—'}</p>
    <p class="result-sentence">${escapeHtml(compareSentence(a, b, state.from))}</p>
    <div class="arrivals-grid">${list(a.label, arrA)}${b ? list(b.label, arrB) : ''}</div>`;
}

/* Fleuves ---------------------------------------------------------------------------------------------- */

const flows = new Map<string, Flow>();
const flowOf = (s: StyleAgg) => {
  let f = flows.get(s.key);
  if (!f) {
    f = buildFlow(s);
    flows.set(s.key, f);
  }
  return f;
};

function renderRivers(state: VizState, a: StyleAgg, b: StyleAgg | null) {
  const list = b ? [a, b] : [a];
  els.rivers.classList.toggle('rivers--two', !!b);
  els.rivers.innerHTML = list
    .map(
      (s) => `<figure class="river" data-key="${escapeHtml(s.key)}">
        <figcaption class="figure-title">${escapeHtml(cap(s.label))} <span class="detail">— ${fr(s.songs)} morceaux, ${fr(s.transitions)} transitions</span></figcaption>
        <svg class="river-svg" role="img" aria-label="Fleuve des enchaînements : ${escapeHtml(s.label)}"></svg>
      </figure>`,
    )
    .join('');
  drawRivers(state);
}

function drawRivers(state: VizState) {
  for (const fig of els.rivers.querySelectorAll<HTMLElement>('.river')) {
    const s = styles.get(fig.dataset.key!)!;
    const svg = fig.querySelector<SVGSVGElement>('svg')!;
    const width = Math.max(280, Math.round(svg.clientWidth || fig.clientWidth || 400));
    const height = width < 420 ? 360 : 400;
    renderRiver(svg, flowOf(s), {
      width,
      height,
      from: state.from,
      onPick: (t) => store.set({ from: store.get().from === t ? null : t }),
      onHover: (r) => showCaption(s, r),
    });
  }
}

function showCaption(s: StyleAgg, r: Ribbon | null) {
  if (!r) {
    els.caption.textContent = store.get().from === null ? 'Survole ou touche un courant pour lire sa part.' : compareSentence(styles.get(store.get().a)!, store.get().b ? styles.get(store.get().b!)! : null, store.get().from!);
    return;
  }
  els.caption.textContent = `${cap(s.label)} : après un ${labelOf(r.from)}, ${labelOf(r.to)} ${pct(r.share)} du temps (${fr(r.value)} transitions).`;
}

/* Son ----------------------------------------------------------------------------------------------------- */

let playing = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function stopSound() {
  if (timer) clearTimeout(timer);
  timer = null;
  playing = false;
  synth.stop();
  els.listen.textContent = 'Écouter';
}

els.listen.addEventListener('click', () => {
  if (playing) {
    stopSound();
    return;
  }
  const state = store.get();
  const a = styles.get(state.a)!;
  const b = state.b ? styles.get(state.b) : null;
  // Pour chaque style : les trois courants les plus forts du départ (ou l'enchaînement le plus joué), départ puis arrivée.
  const pairs: [number, number][] = [];
  for (const s of b ? [a, b] : [a]) {
    if (state.from === null) {
      const r = s.rows[0];
      if (r) pairs.push([r[0], r[1]]);
    } else for (const x of arrivalsFrom(s, state.from).slice(0, 3)) pairs.push([state.from, x.token]);
  }
  if (!pairs.length) return;
  const steps: number[][] = [];
  let prev: number[] | null = null;
  for (const [from, to] of pairs) {
    const v1 = voice(tokenToDegree(from), 0, prev);
    const v2 = voice(tokenToDegree(to), 0, v1);
    steps.push(v1, v2, []);
    prev = v2;
  }
  playing = true;
  els.listen.textContent = 'Arrêter';
  let i = 0;
  const next = () => {
    if (!playing) return;
    if (i >= steps.length) {
      stopSound();
      return;
    }
    const midis = steps[i++]!;
    if (midis.length) synth.play(midis.map((m) => equalFrequency(m)), 0.6);
    timer = setTimeout(next, midis.length ? 0.65 * 1000 : 350);
  };
  next();
});

/* Rendu global --------------------------------------------------------------------------------------------- */

function render(state: VizState, previous?: VizState) {
  const a = styles.get(state.a);
  if (!a) return;
  const b = state.b ? (styles.get(state.b) ?? null) : null;
  els.a.value = state.a;
  els.b.value = state.b && styles.has(state.b) ? state.b : '';
  els.presets.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn, i) => {
    const p = PRESETS[i]!;
    btn.setAttribute('aria-pressed', String(p.a === state.a && p.b === state.b && p.from === state.from));
  });
  renderDepartures(state, a);
  renderResult(state, a, b);
  if (!previous || previous.a !== state.a || previous.b !== state.b) renderRivers(state, a, b);
  else drawRivers(state);
  showCaption(a, null);
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
  stopSound();
}
store.subscribe(render);

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'fleuve-des-enchainements.png',
  render: () => {
    const s = store.get();
    return renderShareCard({ a: styles.get(s.a)!, b: s.b ? (styles.get(s.b) ?? null) : null, from: s.from, siteUrl: location.host + location.pathname });
  },
  text: () => {
    const s = store.get();
    return s.from === null ? 'D’un accord au suivant : le fleuve des enchaînements.' : compareSentence(styles.get(s.a)!, s.b ? (styles.get(s.b) ?? null) : null, s.from);
  },
});

async function boot() {
  try {
    const res = await fetch(assetUrl('data/fleuve-des-accords/transitions.json'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const file = validateTransitions((await res.json()) as TransitionsFile);
    styles = new Map(file.styles.map((s) => [s.key, s]));
    fillSelects(file);
    const s = store.get();
    if (!styles.has(s.a)) store.set({ a: 'irb' });
    render(store.get());
  } catch (err) {
    console.error(err);
    els.result.innerHTML = '<p class="result-line">Les données n’ont pas pu être chargées. Recharge la page ; si ça persiste, le problème est de notre côté.</p>';
  }
}
void boot();

let lastWidth = 0;
new ResizeObserver(() => {
  const w = Math.round(els.rivers.clientWidth);
  if (w && w !== lastWidth) {
    lastWidth = w;
    if (styles.size) drawRivers(store.get());
  }
}).observe(els.rivers);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSound();
});
