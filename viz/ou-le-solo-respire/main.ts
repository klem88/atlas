import { escapeHtml } from '@shell/html';
import { parseChord, prettySymbol, type Chord } from '@shell/music/chords';
import { equalFrequency } from '@shell/music/pitch';
import { Synth } from '@shell/music/synth';
import { createSearch } from '@shell/search';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import { createStore } from '@shell/store';
import type { Dist, SolosFile, Tune, TypeAgg } from './data/contract';
import { DEGREE_LONG, DEGREE_NAMES, chordTones, onceEvery, read, sum, type Reading } from './domain/solo';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { renderShareCard } from './ui/share-card';
import './viz.css';

mountShell({ currentSlug: 'ou-le-solo-respire' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};
const els = {
  search: $('search'),
  presets: $('presets'),
  soloist: $<HTMLSelectElement>('soloist'),
  measure: $('measure'),
  result: $('result'),
  listen: $<HTMLButtonElement>('listen'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
  gridTitle: $('grid-title'),
  grid: $('grid'),
  types: $('types'),
};

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();
let file: SolosFile | null = null;
let tunes = new Map<string, Tune>();
const fr = (n: number) => n.toLocaleString('fr-FR');
const pct = (x: number) => `${Math.round(x * 100)} %`;

els.soloist.addEventListener('change', () => store.set({ solo: els.soloist.value ? Number(els.soloist.value) : null }));
els.measure.addEventListener('change', (e) => store.set({ onBeat: (e.target as HTMLInputElement).value === 'beat' }));
els.presets.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tune]');
  if (b) store.set({ tune: b.dataset.tune!, solo: null, chord: null });
});

/** Comptes du symbole pour la sélection courante (tous les solistes ou un seul). */
function countsFor(tune: Tune, symbol: string, state: VizState): number[] {
  const solos = state.solo === null ? tune.solos : tune.solos.filter((s) => s.melid === state.solo);
  let acc = new Array<number>(12).fill(0);
  for (const s of solos) {
    const d: Dist | undefined = s.chords[symbol];
    if (d) acc = sum(acc, state.onBeat ? d.beat : d.all);
  }
  return acc;
}

/** Les symboles de la grille, avec leur accord lu. */
function gridSymbols(tune: Tune): { symbol: string; chord: Chord }[] {
  const seen = new Map<string, Chord>();
  for (const sec of tune.grid) for (const bar of sec.bars) for (const sym of bar.chords) {
    if (seen.has(sym)) continue;
    const c = parseChord(sym);
    if (c) seen.set(sym, c);
  }
  // Les symboles joués mais absents du texte de la grille (autres chorus) : ajoutés à la fin.
  for (const s of tune.solos) for (const sym of Object.keys(s.chords)) {
    if (seen.has(sym)) continue;
    const c = parseChord(sym);
    if (c) seen.set(sym, c);
  }
  return [...seen.entries()].map(([symbol, chord]) => ({ symbol, chord }));
}

function ladder(shares: number[], top: number, size: 'small' | 'large' = 'small'): string {
  const max = Math.max(1e-6, ...shares);
  return `<span class="ladder ladder--${size}" aria-hidden="true">${[...shares]
    .map((v, i) => ({ v, i }))
    .reverse()
    .map(({ v, i }) => `<span class="rung${i === top && v > 0 ? ' is-top' : ''}" style="--f:${(v / max).toFixed(3)}" title="${DEGREE_NAMES[i]!} : ${pct(v)}"></span>`)
    .join('')}</span>`;
}

function renderGrid(tune: Tune, state: VizState) {
  const solosShown = state.solo === null ? tune.solos.length : 1;
  els.gridTitle.textContent = `${tune.title} — ${tune.composer || 'compositeur inconnu'}, en ${tune.key.replace('-maj', ' majeur').replace('-min', ' mineur')} · ${solosShown} solo${solosShown > 1 ? 's' : ''}${state.onBeat ? ' · notes sur le temps' : ''}`;
  const readings = new Map<string, Reading>();
  for (const { symbol, chord } of gridSymbols(tune)) readings.set(symbol, read(countsFor(tune, symbol, state), chord.quality));
  els.grid.innerHTML = tune.grid
    .map(
      (sec) => `<div class="grid-section"><p class="grid-section-name">${escapeHtml(sec.name)}</p><div class="grid-row">${sec.bars
        .map(
          (bar) =>
            `<span class="bar">${bar.chords.length ? bar.chords
              .map((sym) => {
                const r = readings.get(sym);
                return `<button class="cell${state.chord === sym ? ' is-selected' : ''}" type="button" data-chord="${escapeHtml(sym)}" title="${escapeHtml(sym)}">${r && r.total ? ladder(r.shares, r.top) : '<span class="ladder ladder--small ladder--empty" aria-hidden="true"></span>'}<span class="cell-symbol">${escapeHtml(prettySymbol(sym))}</span></button>`;
              })
              .join('') : '<span class="cell cell--rest">—</span>'}</span>`,
        )
        .join('')}</div></div>`,
    )
    .join('');
  els.grid.querySelectorAll<HTMLButtonElement>('[data-chord]').forEach((b) => b.addEventListener('click', () => store.set({ chord: b.dataset.chord! })));
  return readings;
}

function renderResult(tune: Tune, state: VizState, readings: Map<string, Reading>) {
  const sym = state.chord && readings.has(state.chord) ? state.chord : null;
  if (!sym) {
    const dom = file!.types.find((t) => t.quality === 'dom7');
    const r = dom ? read(state.onBeat ? dom.dist.beat : dom.dist.all, 'dom7') : null;
    els.result.innerHTML = `
      <p class="result-eyebrow">${escapeHtml(tune.title)} · touche un accord de la grille</p>
      ${r ? `<p class="result-title">Sur une dominante, ${escapeHtml(DEGREE_LONG[2]!)} ${escapeHtml(onceEvery(r.shares[2]!))}, ${escapeHtml(DEGREE_LONG[4]!)} ${escapeHtml(onceEvery(r.shares[4]!))}, la fondamentale ${escapeHtml(onceEvery(r.shares[0]!))}.</p><p class="result-line detail">Sur les ${fr(dom!.occurrences)} accords de dominante des 456 solos${state.onBeat ? ', notes sur le temps' : ''}.</p>` : ''}`;
    els.listen.disabled = true;
    return;
  }
  const r = readings.get(sym)!;
  const chord = parseChord(sym)!;
  const avoided = r.avoided !== null ? DEGREE_LONG[r.avoided]! : null;
  els.result.innerHTML = `
    <p class="result-eyebrow">${escapeHtml(prettySymbol(sym))} · ${fr(r.total)} note${r.total > 1 ? 's' : ''}${state.solo === null ? ` · ${tune.solos.filter((s) => s.chords[sym]).length} soliste${tune.solos.filter((s) => s.chords[sym]).length > 1 ? 's' : ''}` : ''}</p>
    ${r.total ? `<p class="result-title">${escapeHtml(cap(DEGREE_LONG[r.top]!))} <span class="result-unit">${escapeHtml(onceEvery(r.shares[r.top]!))}</span></p>
    <ol class="top3">${r.top3.map((d) => `<li><span class="top3-degree">${escapeHtml(DEGREE_NAMES[d]!)}</span><span class="top3-bar"><span style="width:${(r.shares[d]! * 100).toFixed(1)}%"></span></span><span class="top3-value">${pct(r.shares[d]!)}</span></li>`).join('')}</ol>
    <p class="result-line">${pct(r.outside)} des notes hors des notes de l’accord${avoided ? ` ; la plus évitée parmi les notes attendues : <strong>${escapeHtml(avoided)}</strong> (${pct(r.shares[r.avoided!]!)})` : ''}.</p>` : '<p class="result-line">Aucune note comptée sur cet accord pour cette sélection.</p>'}`;
  els.listen.disabled = r.total === 0;
  void chord;
}

function renderTypes(state: VizState) {
  if (!file) return;
  const shown = file.types.filter((t) => ['dom7', 'maj7', 'min7', 'hdim', 'maj', 'min', 'dim', 'sus'].includes(t.quality));
  els.types.innerHTML = shown
    .map((t: TypeAgg) => {
      const r = read(state.onBeat ? t.dist.beat : t.dist.all, t.quality);
      return `<figure class="type"><figcaption class="type-name">${escapeHtml(t.label)} <span class="detail">· ${fr(t.occurrences)} accords</span></figcaption><div class="type-bars">${r.shares
        .map((v, i) => `<span class="type-bar${i === r.top ? ' is-top' : ''}${chordTones(t.quality).includes(i) ? ' is-tone' : ''}" style="--f:${v.toFixed(3)}" title="${DEGREE_NAMES[i]!} : ${pct(v)}"><span></span><em>${DEGREE_NAMES[i]!}</em></span>`)
        .join('')}</div></figure>`;
    })
    .join('');
}

/* Son ---------------------------------------------------------------------------------------------------- */

let timer: ReturnType<typeof setTimeout> | null = null;
els.listen.addEventListener('click', () => {
  if (timer) clearTimeout(timer);
  const state = store.get();
  const tune = state.tune ? tunes.get(state.tune) : null;
  if (!tune || !state.chord) return;
  const chord = parseChord(state.chord);
  if (!chord) return;
  const r = read(countsFor(tune, state.chord, state), chord.quality);
  const root = 48 + chord.root;
  const chordMidis = chordTones(chord.quality).map((i) => root + i);
  const steps: number[][] = [chordMidis, ...r.top3.map((d) => [...chordMidis, 60 + chord.root + d])];
  let i = 0;
  const next = () => {
    if (i >= steps.length) {
      timer = null;
      return;
    }
    synth.play(steps[i++]!.map((m) => equalFrequency(m)), i === 1 ? 1.1 : 0.9);
    timer = setTimeout(next, i === 1 ? 1200 : 950);
  };
  next();
});

/* Rendu -------------------------------------------------------------------------------------------------- */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function render(state: VizState) {
  if (!file) return;
  const tune = state.tune ? tunes.get(state.tune) : null;
  if (!tune) return;
  els.presets.querySelectorAll<HTMLButtonElement>('[data-tune]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tune === state.tune)));
  els.soloist.innerHTML = `<option value="">tous les solistes (${tune.solos.length})</option>${tune.solos.map((s) => `<option value="${s.melid}">${escapeHtml(s.performer)} · ${escapeHtml(s.instrument)}${s.year ? ` · ${s.year}` : ''}</option>`).join('')}`;
  els.soloist.value = state.solo !== null && tune.solos.some((s) => s.melid === state.solo) ? String(state.solo) : '';
  for (const input of els.measure.querySelectorAll<HTMLInputElement>('input')) input.checked = (input.value === 'beat') === state.onBeat;
  const readings = renderGrid(tune, state);
  renderResult(tune, state, readings);
  renderTypes(state);
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
}
store.subscribe(render);

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'ou-le-solo-respire.png',
  render: () => {
    const state = store.get();
    const tune = tunes.get(state.tune!)!;
    const sym = state.chord;
    const chord = sym ? parseChord(sym) : null;
    const dom = file!.types.find((t) => t.quality === 'dom7')!;
    const counts = sym && chord ? countsFor(tune, sym, state) : state.onBeat ? dom.dist.beat : dom.dist.all;
    const quality = chord?.quality ?? 'dom7';
    const title = sym ? `${prettySymbol(sym)} dans « ${tune.title} »` : 'Sur un accord de dominante';
    const solos = state.solo === null ? tune.solos.length : 1;
    return renderShareCard({ title, subtitle: sym ? `${solos} solo${solos > 1 ? 's' : ''}${state.onBeat ? ', notes sur le temps' : ''}` : `${fr(dom.occurrences)} accords, 456 solos`, counts, quality, siteUrl: location.host + location.pathname });
  },
  text: () => {
    const state = store.get();
    const tune = state.tune ? tunes.get(state.tune) : null;
    if (!tune) return '';
    if (!state.chord) return 'Où le solo respire : ce que les solistes jouent vraiment sur chaque accord.';
    const chord = parseChord(state.chord);
    if (!chord) return '';
    const r = read(countsFor(tune, state.chord, state), chord.quality);
    return `Sur ${prettySymbol(state.chord)} dans « ${tune.title} », les solistes jouent ${DEGREE_LONG[r.top]!} ${onceEvery(r.shares[r.top]!)}.`;
  },
});

async function boot() {
  try {
    const res = await fetch(assetUrl('data/ou-le-solo-respire/solos.json'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    file = (await res.json()) as SolosFile;
    tunes = new Map(file.tunes.map((t) => [t.id, t]));
    const byCount = [...file.tunes].sort((a, b) => b.solos.length - a.solos.length);
    const presets = byCount.slice(0, 7);
    els.presets.innerHTML = presets.map((t) => `<button class="chip" type="button" data-tune="${t.id}" aria-pressed="false">${escapeHtml(t.title)} <span class="chip-n">${t.solos.length}</span></button>`).join('');
    createSearch(els.search, {
      label: 'Un standard',
      placeholder: 'Anthropology, Blue Bossa…',
      items: file.tunes.map((t) => ({ id: t.id, label: t.title, detail: `${t.composer || ''}${t.composer ? ' · ' : ''}${t.solos.length} solo${t.solos.length > 1 ? 's' : ''}` })),
      onPick: (id) => store.set({ tune: id, solo: null, chord: null }),
    });
    const s = store.get();
    if (!s.tune || !tunes.has(s.tune)) store.set({ tune: presets[0]!.id });
    else render(s);
  } catch (err) {
    console.error(err);
    els.result.innerHTML = '<p class="result-line">Les données n’ont pas pu être chargées. Recharge la page ; si ça persiste, le problème est de notre côté.</p>';
  }
}
void boot();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) synth.stop();
});
