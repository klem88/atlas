import { escapeHtml } from '@shell/html';
import { prettySymbol } from '@shell/music/chords';
import { Player, type Step } from '@shell/music/player';
import { Synth } from '@shell/music/synth';
import { voice } from '@shell/music/voicing';
import { createSearch } from '@shell/search';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import { createStore } from '@shell/store';
import type { NamedSong, SongsFile, StylesFile } from './data/contract';
import { validateSongs, validateStyles } from './data/validate';
import { buildJourney, journeyPath, journeyWords, type Journey, type Stop } from './domain/journey';
import { triadName, triadShort } from './domain/tonnetz';
import { createTorusScene, readTorusTheme } from './scene/torus';
import { SPEEDS, readStateFromUrl, stateToSearch, type Speed, type VizState } from './state';
import { renderShareCard, sharePhrase } from './ui/share-card';
import './viz.css';

mountShell({ currentSlug: 'voyage-sur-le-tore' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};
const els = {
  search: $('search'),
  presets: $('presets'),
  result: $('result'),
  speed: $('speed'),
  play: $<HTMLButtonElement>('play'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
  scene: $('scene'),
  grid: $('grid'),
  styleList: $('style-list'),
};

const PRESETS: { label: string; id: string }[] = [
  { label: 'Autumn Leaves', id: 'irb:63' },
  { label: 'Giant Steps', id: 'irb:362' },
  { label: 'So What', id: 'irb:953' },
  { label: 'Blue Bossa', id: 'irb:116' },
  { label: 'All The Things You Are', id: 'irb:34' },
  { label: 'Beat It', id: 'bb:0629' },
  { label: 'With Or Without You', id: 'bb:0681' },
];

const store = createStore<VizState>(readStateFromUrl(location.search));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const synth = new Synth();
const scene = createTorusScene(els.scene, readTorusTheme(), reducedMotion);
let songs = new Map<string, NamedSong>();
let journey: Journey | null = null;
/** Indice de la position du chemin (journeyPath) pour chaque arrêt de la grille. */
let pathIndexOfStop: number[] = [];
const fr1 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

els.presets.innerHTML = PRESETS.map((p) => `<button class="chip" type="button" data-song="${p.id}" aria-pressed="false">${escapeHtml(p.label)}</button>`).join('');
els.presets.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-song]');
  if (b) store.set({ song: b.dataset.song! });
});
els.speed.addEventListener('change', (e) => store.set({ speed: (e.target as HTMLInputElement).value as Speed }));

/* Résultat et grille ------------------------------------------------------------------------------------ */

function renderResult(j: Journey) {
  const s = j.stats;
  const inexact = j.stops.filter((x) => x.triad && !x.exact).length;
  els.result.innerHTML = `
    <p class="result-eyebrow">${escapeHtml(j.song.title)} <span class="detail">· ${escapeHtml(j.song.artist)}${j.song.year ? ` · ${j.song.year}` : ''} · ${j.song.corpus === 'irb' ? 'iRb' : 'Billboard'}</span></p>
    <p class="result-figure">${s.steps.length} <span class="result-unit">pas</span> · ${fr1(s.mean)} <span class="result-unit">de long en moyenne</span></p>
    <p class="result-line">${escapeHtml(journeyWords(s).charAt(0).toUpperCase() + journeyWords(s).slice(1))}.${s.longest ? ` Le plus grand saut : <strong>de ${escapeHtml(triadName(s.longest.from))} à ${escapeHtml(triadName(s.longest.to))}</strong>, ${s.longest.distance} pas.` : ''}</p>
    <p class="result-histo" aria-label="Répartition des longueurs de pas">${s.histogram
      .map((n, d) => (n ? `<span class="histo-cell"><span class="histo-n">${n}</span><span class="histo-d">× ${d === 5 ? '5+' : d}</span></span>` : ''))
      .join('')}</p>
    ${inexact ? `<p class="result-detail detail">${inexact} accord${inexact > 1 ? 's' : ''} ramené${inexact > 1 ? 's' : ''} à une triade voisine (anneaux).</p>` : ''}`;
}

function renderGrid(j: Journey) {
  els.grid.innerHTML = j.song.sections
    .map(
      (sec, si) => `<div class="grid-section"><p class="grid-section-name">${escapeHtml(sec.name)}</p><div class="grid-row">${j.stops
        .filter((st) => st.section === si)
        .map(
          (st) =>
            `<button class="grid-cell${st.triad && !st.exact ? ' is-approx' : ''}" type="button" data-stop="${st.index}" style="--beats:${Math.max(1, Math.min(8, st.beats))}" title="${escapeHtml(st.triad ? triadName(st.triad) : 'silence')}"><span class="grid-symbol">${escapeHtml(prettySymbol(st.symbol))}</span><span class="grid-triad">${st.triad ? escapeHtml(triadShort(st.triad)) : '—'}</span></button>`,
        )
        .join('')}</div></div>`,
    )
    .join('');
}
els.grid.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-stop]');
  if (!b || !journey) return;
  const st = journey.stops[Number(b.dataset.stop)]!;
  player.stop();
  setCursor(st);
  if (st.triad) synth.play(voice({ step: st.triad.root, cls: st.triad.mode }, 0).map((m) => 440 * 2 ** ((m - 69) / 12)), 1.2);
});

function setCursor(st: Stop | null) {
  els.grid.querySelectorAll('.grid-cell.is-playing').forEach((c) => c.classList.remove('is-playing'));
  if (!st) {
    scene.setHead(-1);
    return;
  }
  const cell = els.grid.querySelector<HTMLElement>(`[data-stop="${st.index}"]`);
  cell?.classList.add('is-playing');
  cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  scene.setHead(pathIndexOfStop[st.index] ?? -1);
}

/* Son ---------------------------------------------------------------------------------------------------- */

const player = new Player(synth, (step) => {
  if (!step) {
    els.play.textContent = 'Jouer';
    scene.setAutoRotate(true);
    if (journey) scene.setHead(-1);
    els.grid.querySelectorAll('.grid-cell.is-playing').forEach((c) => c.classList.remove('is-playing'));
    return;
  }
  setCursor(step.tag as Stop);
});

els.play.addEventListener('click', () => {
  if (player.playing) {
    player.stop();
    return;
  }
  if (!journey) return;
  const perBeat = SPEEDS[store.get().speed];
  let prev: number[] | null = null;
  const steps: Step[] = journey.stops.map((st) => {
    const midis = st.triad ? voice({ step: st.triad.root, cls: st.triad.mode }, 0, prev) : [];
    if (midis.length) prev = midis;
    return { midis, seconds: Math.max(0.25, st.beats * perBeat), tag: st };
  });
  // `play` commence par arrêter (et remettre le bouton à « Jouer ») : on écrit l'état après.
  player.play(steps);
  els.play.textContent = 'Arrêter';
  scene.setAutoRotate(false);
});

/* Styles ----------------------------------------------------------------------------------------------------- */

function renderStyles(f: StylesFile) {
  const shown = f.styles.filter((s) => ['irb', 'billboard', 'pop', 'rock', 'country', 'jazz', 'metal', 'soul', 'rap', 'electronic'].includes(s.key)).sort((a, b) => a.mean - b.mean);
  const max = Math.max(...shown.map((s) => s.mean));
  els.styleList.innerHTML = shown
    .map((s) => `<li><span class="style-name">${escapeHtml(s.label)}</span><span class="style-bar"><span style="width:${((s.mean / max) * 100).toFixed(1)}%"></span></span><span class="style-value">${fr1(s.mean)}</span></li>`)
    .join('');
}

/* Rendu ------------------------------------------------------------------------------------------------------ */

function render(state: VizState, previous?: VizState) {
  for (const input of els.speed.querySelectorAll<HTMLInputElement>('input')) input.checked = input.value === state.speed;
  els.presets.querySelectorAll<HTMLButtonElement>('[data-song]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.song === state.song)));
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
  const song = songs.get(state.song);
  if (!song) return;
  if (!previous || previous.song !== state.song || !journey) {
    player.stop();
    journey = buildJourney(song);
    const path = journeyPath(journey);
    pathIndexOfStop = new Array<number>(journey.stops.length).fill(-1);
    let k = -1;
    const pathStops = new Set(path.map((p) => p.stop.index));
    for (const st of journey.stops) {
      if (pathStops.has(st.index)) k++;
      pathIndexOfStop[st.index] = st.triad ? k : -1;
    }
    scene.setPath(
      path.map((p) => ({ s: p.s, t: p.t })),
      journey.stops.filter((st) => st.pos && !st.exact).map((st) => st.pos!),
    );
    renderResult(journey);
    renderGrid(journey);
    els.play.disabled = journey.stats.steps.length === 0 && journey.stops.every((st) => !st.triad);
  }
}
store.subscribe(render);

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'voyage-sur-le-tore.png',
  render: () => renderShareCard({ journey: journey!, scene: scene.canvas, siteUrl: location.host + location.pathname }),
  text: () => (journey ? sharePhrase(journey) : ''),
});

async function boot() {
  try {
    const base = assetUrl('data/voyage-sur-le-tore');
    const [sf, st] = await Promise.all([
      fetch(`${base}/songs.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`songs : HTTP ${r.status}`)))),
      fetch(`${base}/styles.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`styles : HTTP ${r.status}`)))),
    ]);
    const songsFile = validateSongs(sf as SongsFile);
    songs = new Map(songsFile.songs.map((s) => [s.id, s]));
    renderStyles(validateStyles(st as StylesFile));
    createSearch(els.search, {
      label: 'Un morceau',
      placeholder: 'Autumn Leaves, Beat It…',
      items: songsFile.songs.map((s) => ({ id: s.id, label: s.title, detail: `${s.artist}${s.year ? ` · ${s.year}` : ''}` })),
      onPick: (id) => store.set({ song: id }),
    });
    if (!songs.has(store.get().song)) store.set({ song: 'irb:63' });
    render(store.get());
  } catch (err) {
    console.error(err);
    els.result.innerHTML = '<p class="result-line">Les données n’ont pas pu être chargées. Recharge la page ; si ça persiste, le problème est de notre côté.</p>';
  }
}
void boot();

new ResizeObserver(() => scene.resize()).observe(els.scene);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => scene.setTheme(readTorusTheme()));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) player.stop();
});
