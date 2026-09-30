import { escapeHtml } from '@shell/html';
import { parseChord } from '@shell/music/chords';
import { tokensOf } from '@shell/music/degrees';
import { equalFrequency } from '@shell/music/pitch';
import { Synth } from '@shell/music/synth';
import { voice } from '@shell/music/voicing';
import { createSearch } from '@shell/search';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import { createStore } from '@shell/store';
import type { NamedSong, Signature, SongsFile, StyleRose, StylesFile } from './data/contract';
import { CLASSES, liftWords, nearestStyles, roseAxes, shares, signatures, songVector, transitionLabel } from './domain/compass';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { renderRose } from './ui/rose';
import { renderShareCard } from './ui/share-card';
import './viz.css';

mountShell({ currentSlug: 'carte-des-styles' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};
const els = {
  search: $('search'),
  result: $('result'),
  listen: $<HTMLButtonElement>('listen'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
  roses: $('roses'),
  focus: $('focus'),
};

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();
let file: StylesFile | null = null;
let songs = new Map<string, NamedSong>();
const pct = (x: number) => (x >= 0.1 ? `${Math.round(x * 100)} %` : x >= 0.001 ? `${(x * 100).toFixed(1).replace('.', ',')} %` : `${(x * 100).toFixed(2).replace('.', ',')} %`);
const fr = (n: number) => n.toLocaleString('fr-FR');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Ce qu'on sait du morceau choisi : son vecteur, sa rose, ses signatures, ses styles proches. */
interface SongView {
  song: NamedSong;
  vector: Float32Array;
  axes: number[];
  signatures: Signature[];
  nearest: { style: StyleRose; similarity: number }[];
}

function analyse(song: NamedSong): SongView | null {
  if (!file) return null;
  const tokens: number[] = [];
  for (const sec of song.sections) {
    const t = tokensOf(sec.chords.map(([sym]) => parseChord(sym)), song.tonic);
    if (t.length) {
      if (tokens.length) tokens.push(255);
      tokens.push(...t);
    }
  }
  const vector = songVector(tokens, 4);
  if (!vector) return null;
  // Comptes bruts pour les parts (le vecteur est en racine carrée).
  const counts = new Array<number>(CLASSES * CLASSES).fill(0);
  for (let i = 0; i < vector.length; i++) counts[i] = vector[i]! ** 2;
  const sh = shares(counts);
  return { song, vector, axes: roseAxes(sh, file.baseShares, file.axes), signatures: signatures(sh, file.baseShares, 5, 0.02), nearest: nearestStyles(vector, file.styles) };
}

/* Roses ------------------------------------------------------------------------------------------- */

function renderRoses(state: VizState, view: SongView | null) {
  if (!file) return;
  els.roses.innerHTML =
    (view ? `<button class="rose-card rose-card--song" type="button" role="listitem" data-style="__song" aria-pressed="${state.style === '__song'}"><svg aria-hidden="true"></svg><span class="rose-name">${escapeHtml(view.song.title)}</span></button>` : '') +
    file.styles.map((s) => `<button class="rose-card" type="button" role="listitem" data-style="${escapeHtml(s.key)}" aria-pressed="${state.style === s.key}"><svg aria-hidden="true"></svg><span class="rose-name">${escapeHtml(s.label)}</span></button>`).join('');
  for (const card of els.roses.querySelectorAll<HTMLButtonElement>('.rose-card')) {
    const key = card.dataset.style!;
    const values = key === '__song' ? view!.axes : file.styles.find((s) => s.key === key)!.axes;
    renderRose(card.querySelector('svg')!, values, { size: 100, accent: state.style === key });
    card.addEventListener('click', () => store.set({ style: key }));
  }
}

function renderFocus(state: VizState, view: SongView | null) {
  if (!file) return;
  const isSong = state.style === '__song' && view;
  const label = isSong ? view.song.title : (file.styles.find((s) => s.key === state.style)?.label ?? '');
  const values = isSong ? view.axes : (file.styles.find((s) => s.key === state.style)?.axes ?? []);
  const sigs = isSong ? view.signatures : (file.styles.find((s) => s.key === state.style)?.signatures ?? []);
  const style = file.styles.find((s) => s.key === state.style);
  els.focus.innerHTML = `
    <figure class="focus-rose"><svg role="img" aria-label="Rose de ${escapeHtml(label)}"></svg></figure>
    <div>
      <p class="focus-title">${escapeHtml(cap(label))}</p>
      <p class="focus-sub">${isSong ? `${escapeHtml(view.song.artist)}${view.song.year ? ` · ${view.song.year}` : ''} · rose du morceau, comparée à l’ensemble des tablatures` : style ? `${fr(style.songs)} morceaux · ${fr(style.transitions)} enchaînements` : ''}</p>
      <p class="figure-title">${isSong ? 'Ses enchaînements les plus marqués' : 'Ses cinq enchaînements signatures'} <span class="detail">— part dans ${isSong ? 'le morceau' : 'le style'} (accent) contre part dans l’ensemble</span></p>
      <ol class="signatures">${sigs
        .map(
          (s) => `<li><span class="sig-label">${escapeHtml(transitionLabel([s.from, s.to]))}</span><span class="sig-bars"><span class="sig-bar is-style"><span style="width:${Math.min(100, s.share * 400).toFixed(1)}%"></span><span>${pct(s.share)}</span></span><span class="sig-bar"><span style="width:${Math.min(100, s.base * 400).toFixed(1)}%"></span><span>${pct(s.base)}</span></span><span class="sig-lift">${escapeHtml(liftWords(s.lift))}</span></span></li>`,
        )
        .join('')}</ol>
    </div>`;
  renderRose(els.focus.querySelector('svg')!, values, { size: 300, labels: true, axisLabels: file.axes.map((a) => transitionLabel(a.transition).replace(' → ', '→')), accent: true });
}

function renderResult(state: VizState, view: SongView | null) {
  if (!file) return;
  if (view) {
    const top = view.nearest.slice(0, 3);
    els.result.innerHTML = `
      <p class="result-eyebrow">${escapeHtml(view.song.title)} · ${escapeHtml(view.song.artist)}${view.song.year ? ` · ${view.song.year}` : ''}</p>
      <p class="result-title">ressemble le plus ${escapeHtml(article(top[0]!.style.label))}</p>
      <ol class="rank">${top.map((n) => `<li><span class="rank-name">${escapeHtml(n.style.label)}</span><span class="rank-bar"><span style="width:${(n.similarity * 100).toFixed(1)}%"></span></span><span class="rank-value">${n.similarity.toFixed(2)}</span></li>`).join('')}</ol>
      <p class="result-line detail">Ressemblance : cosinus entre les enchaînements du morceau et le centre de chaque style (1 = identique). <button class="link" type="button" data-clear>Retirer le morceau</button></p>`;
    els.result.querySelector('[data-clear]')?.addEventListener('click', () => store.set({ song: null, style: state.style === '__song' ? 'irb' : state.style }));
    return;
  }
  const style = file.styles.find((s) => s.key === state.style);
  if (!style) return;
  const top = style.signatures[0];
  els.result.innerHTML = `
    <p class="result-eyebrow">${escapeHtml(cap(style.label))} · ${fr(style.songs)} morceaux</p>
    <p class="result-title">${top ? `${escapeHtml(transitionLabel([top.from, top.to]))} : ${escapeHtml(liftWords(top.lift))}` : '—'}</p>
    <p class="result-line">${styleSentence(style)}</p>`;
}

function article(label: string): string {
  if (/^[aeiouéè]/i.test(label)) return `à l’${label}`;
  if (/^(pop|country|soul)/.test(label)) return `à la ${label}`;
  if (/^tubes/.test(label)) return `aux ${label}`;
  return `au ${label}`;
}

function styleSentence(style: StyleRose): string {
  if (!file) return '';
  const strong = style.axes.map((v, i) => ({ v, i })).filter((x) => x.v >= 1.25).sort((a, b) => b.v - a.v);
  const weak = style.axes.map((v, i) => ({ v, i })).filter((x) => x.v <= 0.8).sort((a, b) => a.v - b.v);
  const name = (i: number) => transitionLabel(file!.axes[i]!.transition);
  const parts: string[] = [];
  if (strong.length) parts.push(`Plus que les autres : ${strong.slice(0, 3).map((x) => `<strong>${escapeHtml(name(x.i))}</strong>`).join(', ')}`);
  if (weak.length) parts.push(`moins : ${weak.slice(0, 3).map((x) => escapeHtml(name(x.i))).join(', ')}`);
  if (!parts.length) return 'Sur les douze axes communs, ce style est la moyenne même : sa rose est presque un cercle.';
  return `${parts.join(' ; ')}.`;
}

/* Son ------------------------------------------------------------------------------------------------ */

let timer: ReturnType<typeof setTimeout> | null = null;
let playing = false;
function stopSound() {
  if (timer) clearTimeout(timer);
  timer = null;
  playing = false;
  synth.stop();
  els.listen.textContent = 'Écouter les signatures';
}
els.listen.addEventListener('click', () => {
  if (playing) {
    stopSound();
    return;
  }
  if (!file) return;
  const state = store.get();
  const view = currentView;
  const sigs = state.style === '__song' && view ? view.signatures : (file.styles.find((s) => s.key === state.style)?.signatures ?? []);
  const steps: number[][] = [];
  let prev: number[] | null = null;
  for (const s of sigs) {
    const d1 = { step: Math.floor(s.from / 2), cls: s.from % 2 ? ('min' as const) : ('maj' as const) };
    const d2 = { step: Math.floor(s.to / 2), cls: s.to % 2 ? ('min' as const) : ('maj' as const) };
    const v1 = voice(d1, 0, prev);
    const v2 = voice(d2, 0, v1);
    steps.push(v1, v2, []);
    prev = v2;
  }
  if (!steps.length) return;
  playing = true;
  els.listen.textContent = 'Arrêter';
  let i = 0;
  const next = () => {
    if (!playing) return;
    if (i >= steps.length) {
      stopSound();
      return;
    }
    const m = steps[i++]!;
    if (m.length) synth.play(m.map((x) => equalFrequency(x)), 0.6);
    timer = setTimeout(next, m.length ? 650 : 350);
  };
  next();
});

/* Rendu ------------------------------------------------------------------------------------------------ */

let currentView: SongView | null = null;
function render(state: VizState) {
  if (!file) return;
  const song = state.song ? songs.get(state.song) : null;
  currentView = song ? analyse(song) : null;
  if (state.style === '__song' && !currentView) {
    store.set({ style: 'irb' });
    return;
  }
  renderRoses(state, currentView);
  renderFocus(state, currentView);
  renderResult(state, currentView);
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
  stopSound();
}
store.subscribe(render);

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'boussole-des-styles.png',
  render: () => {
    const state = store.get();
    const isSong = state.style === '__song' && currentView;
    const style = file!.styles.find((s) => s.key === state.style);
    return renderShareCard({
      title: isSong ? currentView!.song.title : cap(style?.label ?? ''),
      subtitle: isSong ? `ressemble le plus ${article(currentView!.nearest[0]!.style.label)} (${currentView!.nearest[0]!.similarity.toFixed(2)})` : style ? `${fr(style.songs)} morceaux` : '',
      axes: isSong ? currentView!.axes : (style?.axes ?? []),
      axisLabels: file!.axes.map((a) => transitionLabel(a.transition).replace(' → ', '→')),
      signatures: isSong ? currentView!.signatures : (style?.signatures ?? []),
      siteUrl: location.host + location.pathname,
    });
  },
  text: () => {
    const state = store.get();
    if (state.style === '__song' && currentView) return `« ${currentView.song.title} » ressemble le plus ${article(currentView.nearest[0]!.style.label)}, sur la boussole des styles.`;
    const style = file?.styles.find((s) => s.key === state.style);
    return style ? `La rose ${article(style.label).replace(/^à /, 'de ')} sur la boussole des styles.` : '';
  },
});

async function boot() {
  try {
    const base = assetUrl('data/carte-des-styles');
    const [sf, ss] = await Promise.all([
      fetch(`${base}/styles.json`).then((r) => (r.ok ? (r.json() as Promise<StylesFile>) : Promise.reject(new Error(`styles : HTTP ${r.status}`)))),
      fetch(`${base}/songs.json`).then((r) => (r.ok ? (r.json() as Promise<SongsFile>) : Promise.reject(new Error(`songs : HTTP ${r.status}`)))),
    ]);
    file = sf;
    songs = new Map(ss.songs.map((s) => [s.id, s]));
    createSearch(els.search, {
      label: 'À quel style ressemble ce morceau ?',
      placeholder: 'Autumn Leaves, Beat It…',
      items: ss.songs.map((s) => ({ id: s.id, label: s.title, detail: `${s.artist}${s.year ? ` · ${s.year}` : ''}` })),
      onPick: (id) => store.set({ song: id, style: '__song' }),
    });
    const s = store.get();
    if (s.song && !songs.has(s.song)) store.set({ song: null });
    if (!file.styles.some((x) => x.key === s.style) && s.style !== '__song') store.set({ style: 'irb' });
    render(store.get());
  } catch (err) {
    console.error(err);
    els.result.innerHTML = '<p class="result-line">Les données n’ont pas pu être chargées. Recharge la page ; si ça persiste, le problème est de notre côté.</p>';
  }
}
void boot();
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSound();
});
