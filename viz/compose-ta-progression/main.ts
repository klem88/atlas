import { escapeHtml } from '@shell/html';
import { degreeLabel, progressionKey, type Degree } from '@shell/music/degrees';
import { equalFrequency } from '@shell/music/pitch';
import { Player, type Step } from '@shell/music/player';
import { Synth } from '@shell/music/synth';
import { voice } from '@shell/music/voicing';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { vizUrl } from '@shell/site';
import { createStore } from '@shell/store';
import type { Meta, Shard, TokenizedSong } from '../progression-jouee/data/contract';
import { loadMeta, loadShard, loadSongs } from '../progression-jouee/data/load';
import { findExamples } from '../progression-jouee/domain/examples';
import { findProgression, GENRE_LABELS, GENRE_WITH_ARTICLE } from '../progression-jouee/domain/lookup';
import { chordName, fanSentence, nextChords, pct, progressionNames, weightedPick, type Candidate, type Fan } from './domain/next';
import { KEY_NAMES, MAX_CHORDS, readStateFromUrl, stateToSearch, type VizState } from './state';
import { layoutFan, renderFan } from './ui/fan';
import { renderShareCard } from './ui/share-card';
import './viz.css';

mountShell({ currentSlug: 'compose-ta-progression' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};
const els = {
  tonic: $<HTMLSelectElement>('tonic'),
  style: $<HTMLSelectElement>('style'),
  result: $('result'),
  listen: $<HTMLButtonElement>('listen'),
  random: $<HTMLButtonElement>('random'),
  undo: $<HTMLButtonElement>('undo'),
  reset: $<HTMLButtonElement>('reset'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
  deeper: $('deeper'),
  staff: $('staff'),
  breath: $('breath'),
  sentence: $('sentence'),
  fan: document.getElementById('fan') as unknown as SVGSVGElement,
};
const KEY_LABELS = ['do', 'ré♭', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let meta: Meta | null = null;
let songs: TokenizedSong[] = [];
let fan: Fan | null = null;
let currentCount: number | null = null;
let requestId = 0;
const fr = (n: number) => n.toLocaleString('fr-FR');

els.tonic.innerHTML = KEY_NAMES.map((k, i) => `<option value="${i}">${KEY_LABELS[i]} majeur (${k})</option>`).join('');
els.tonic.addEventListener('change', () => store.set({ tonic: Number(els.tonic.value) }));
els.style.addEventListener('change', () => store.set({ style: els.style.value || null }));
els.undo.addEventListener('click', () => store.set({ progression: store.get().progression.slice(0, -1) }));
els.reset.addEventListener('click', () => store.set({ progression: [] }));
els.random.addEventListener('click', () => {
  if (!fan) return;
  const c = weightedPick(fan.candidates);
  if (c) choose(c);
});
els.staff.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-index]');
  if (b) store.set({ progression: store.get().progression.slice(0, Number(b.dataset.index) + 1) });
});

function playChord(d: Degree, previous: number[] | null = null): number[] {
  const midis = voice(d, store.get().tonic, previous);
  synth.play(midis.map((m) => equalFrequency(m)), 0.7);
  return midis;
}

let lastVoicing: number[] | null = null;
function choose(c: Candidate) {
  const { progression } = store.get();
  if (progression.length >= MAX_CHORDS) return;
  lastVoicing = playChord(c.degree, lastVoicing);
  store.set({ progression: [...progression, c.degree] });
}

/* Portée et ligne qui respire ------------------------------------------------------------------------- */

function renderStaff(state: VizState) {
  const { progression, tonic } = state;
  els.staff.innerHTML = progression.length
    ? progression
        .map(
          (d, i) =>
            `<button class="chord${i === progression.length - 1 ? ' is-last' : ''}" type="button" data-index="${i}" title="Revenir à cet accord"><span class="chord-name">${escapeHtml(chordName(d, tonic))}</span><span class="chord-degree">${escapeHtml(degreeLabel(d))}</span></button>`,
        )
        .join('<span class="chord-sep" aria-hidden="true"></span>')
    : '<p class="staff-empty">Ta progression commence ici : choisis un premier accord dans l’éventail.</p>';
  els.undo.disabled = progression.length === 0;
  els.reset.disabled = progression.length === 0;
  els.listen.disabled = progression.length < 2;
}

function renderBreath(state: VizState, count: number | null, m: Meta) {
  const n = state.progression.length;
  if (n < 2 || count === null) {
    els.breath.innerHTML = n === 1 ? '<span class="breath-note">Un accord : toutes les chansons ou presque. Le compte commence au deuxième.</span>' : '';
    return;
  }
  const base = state.style ? m.corpus.byGenre[m.genres.indexOf(state.style)]! : m.corpus.songs;
  const share = base ? count / base : 0;
  // Largeur en échelle log : 1 chanson → 2 %, tout le corpus → 100 %.
  const width = count > 0 ? Math.max(2, (Math.log10(count) / Math.log10(Math.max(10, base))) * 100) : 2;
  els.breath.innerHTML = `<span class="breath-bar" style="width:${width.toFixed(1)}%"></span><span class="breath-label">${count > 0 ? `<strong>${fr(count)}</strong> chanson${count > 1 ? 's' : ''} contiennent cette suite (${pct(share)})` : `moins de 20 chansons : une rareté`}</span>`;
}

/* Résultat ------------------------------------------------------------------------------------------------ */

function renderResult(state: VizState, m: Meta, count: number | null, row: number[] | null) {
  const { progression, tonic } = state;
  if (progression.length < 2) {
    els.result.innerHTML = `<p class="result-eyebrow">${progression.length ? escapeHtml(chordName(progression[0]!, tonic)) : 'Rien de posé'}</p><p class="result-line">${progression.length ? 'Choisis un deuxième accord : le compte commence.' : 'Touche un disque de l’éventail pour commencer.'}</p>`;
    els.deeper.textContent = '';
    return;
  }
  const label = progressionNames(progression, tonic);
  const degrees = progression.map(degreeLabel).join('–');
  let styles = '';
  if (row && count) {
    const ranked = m.genres
      .map((g, i) => ({ g, share: m.corpus.byGenre[i]! ? row[3 + i]! / m.corpus.byGenre[i]! : 0 }))
      .filter((x) => x.share > 0)
      .sort((a, b) => b.share - a.share)
      .slice(0, 3);
    if (ranked.length) styles = `<p class="result-line">L’aiment le plus : ${ranked.map((x) => `<strong>${escapeHtml(GENRE_LABELS[x.g] ?? x.g)}</strong> (${pct(x.share)})`).join(', ')}.</p>`;
  }
  const examples = findExamples(songs, progression).slice(0, 5);
  const ex = examples.length
    ? `<p class="result-line result-examples">La jouent : ${examples.map((e) => `<em>${escapeHtml(e.song.title)}</em> (${escapeHtml(e.song.artist)}${e.song.year ? `, ${e.song.year}` : ''})`).join(' · ')}.</p>`
    : '';
  els.result.innerHTML = `
    <p class="result-eyebrow">${escapeHtml(label)} <span class="detail">· ${escapeHtml(degrees)}</span></p>
    <p class="result-figure">${count === null ? '…' : count > 0 ? fr(count) : '< 20'} <span class="result-unit">chanson${count && count > 1 ? 's' : ''}</span></p>
    ${styles}${ex}`;
  els.deeper.innerHTML = `<a href="${vizUrl('progression-jouee')}?p=${encodeURIComponent(progressionKey(progression)).replace(/%2C/g, ',')}&t=${KEY_NAMES[tonic]}">Voir cette progression en détail : frise des décennies, styles, tous les morceaux →</a>`;
}

/* Éventail --------------------------------------------------------------------------------------------- */

function renderFanView(state: VizState, m: Meta) {
  if (!fan) return;
  const width = Math.max(320, Math.round(els.fan.clientWidth || 640));
  const styleLabel = state.style ? (GENRE_WITH_ARTICLE[state.style] ?? state.style).replace(/^(le |la |l’)/, (a) => (a === 'l’' ? 'de l’' : a === 'la ' ? 'de la ' : 'du ')) : null;
  const layout = layoutFan(fan.candidates, { width, nameOf: (c) => chordName(c.degree, state.tonic), subOf: (c) => (state.progression.length ? pct(c.p) : degreeLabel(c.degree)), other: fan.other });
  const last = state.progression[state.progression.length - 1];
  renderFan(els.fan, layout, {
    current: last ? chordName(last, state.tonic) : null,
    currentSub: last ? degreeLabel(last) : null,
    onPick: choose,
    onHover: (c) => {
      els.sentence.textContent = c && fan ? (state.progression.length ? `${chordName(c.degree, state.tonic)} (${degreeLabel(c.degree)}) : ${pct(c.p)} ${styleLabel ? `des chansons ${styleLabel}` : 'des chansons'}, ${fr(c.count)} morceaux.` : `${chordName(c.degree, state.tonic)} : le degré ${degreeLabel(c.degree)}.`) : fanSentence(state.progression, fan!, state.tonic, styleLabel);
    },
  });
  els.sentence.textContent = state.progression.length >= MAX_CHORDS ? 'Huit accords : c’est la limite des comptes. Écoute, partage, ou recommence.' : fanSentence(state.progression, fan, state.tonic, styleLabel);
  if (state.progression.length >= MAX_CHORDS) els.fan.replaceChildren();
  els.random.disabled = state.progression.length >= MAX_CHORDS || fan.candidates.length === 0;
  void m;
}

/* Rendu ------------------------------------------------------------------------------------------------- */

async function refresh(state: VizState) {
  const id = ++requestId;
  const m = meta ?? (meta = await loadMeta());
  const n = state.progression.length;
  const [shardNext, shardPrefix] = await Promise.all([n < MAX_CHORDS ? loadShard(Math.max(2, n + 1)) : null, n >= 2 ? loadShard(n) : null]);
  if (id !== requestId) return;
  let row: number[] | null = null;
  currentCount = null;
  if (n >= 2 && shardPrefix) {
    const found = findProgression(state.progression, shardPrefix, m);
    row = shardPrefix.rows[progressionKey(state.progression)] ?? null;
    currentCount = found ? (state.style ? row![3 + m.genres.indexOf(state.style)]! : found.total) : 0;
  }
  fan = shardNext ? nextChords(state.progression, shardNext, shardPrefix, m, state.style) : { base: 0, candidates: [], other: 0 };
  renderBreath(state, currentCount, m);
  renderResult(state, m, currentCount, row);
  renderFanView(state, m);
}

function render(state: VizState) {
  els.tonic.value = String(state.tonic);
  els.style.value = state.style ?? '';
  renderStaff(state);
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
  if (meta) void refresh(state);
}
store.subscribe(render);

/* Son ------------------------------------------------------------------------------------------------------ */

const player = new Player(synth, (step) => {
  els.staff.querySelectorAll('.chord').forEach((c, i) => c.classList.toggle('is-playing', !!step && (step.tag as number) === i));
  if (!step) els.listen.textContent = 'Écouter';
});
els.listen.addEventListener('click', () => {
  if (player.playing) {
    player.stop();
    return;
  }
  const { progression, tonic } = store.get();
  let prev: number[] | null = null;
  const steps: Step[] = [...progression, ...progression].map((d, i) => {
    const midis = voice(d, tonic, prev);
    prev = midis;
    return { midis, seconds: 0.75, tag: i % progression.length };
  });
  player.play(steps);
  els.listen.textContent = 'Arrêter';
});

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'ma-progression.png',
  render: () => {
    const s = store.get();
    return renderShareCard({ state: s, fan: fan!, count: currentCount, corpus: meta!.corpus.songs, siteUrl: location.host + location.pathname });
  },
  text: () => {
    const s = store.get();
    if (s.progression.length < 2) return 'Compose ta progression, accord après accord.';
    return `Ma progression : ${progressionNames(s.progression, s.tonic)}. ${currentCount ? `${fr(currentCount)} chansons la contiennent.` : 'Moins de 20 chansons la contiennent.'}`;
  },
});

async function boot() {
  try {
    const [m, s] = await Promise.all([loadMeta(), loadSongs()]);
    meta = m;
    songs = s;
    els.style.innerHTML = `<option value="">toutes les tablatures</option>${m.genres.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(GENRE_LABELS[g] ?? g)}</option>`).join('')}`;
    render(store.get());
  } catch (err) {
    console.error(err);
    els.result.innerHTML = '<p class="result-line">Les données n’ont pas pu être chargées. Recharge la page ; si ça persiste, le problème est de notre côté.</p>';
  }
}
void boot();
let lastWidth = 0;
new ResizeObserver(() => {
  const w = Math.round(els.fan.clientWidth);
  if (w && w !== lastWidth) {
    lastWidth = w;
    if (meta && fan) renderFanView(store.get(), meta);
  }
}).observe(els.fan);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) player.stop();
});
void reducedMotion;
