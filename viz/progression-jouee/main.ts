import { escapeHtml } from '@shell/html';
import { chooseRange, renderKeyboard, type Keyboard } from '@shell/music/keyboard';
import { degreeLabel, MAX_LENGTH, MIN_LENGTH, parseDegreeLabel, parseProgression, progressionKey, type Degree } from '@shell/music/degrees';
import { degreeOf } from '@shell/music/degrees';
import { Synth } from '@shell/music/synth';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { createStore } from '@shell/store';
import type { Meta, TokenizedSong } from './data/contract';
import { loadMeta, loadShard, loadSongs } from './data/load';
import { findExamples, type Example } from './domain/examples';
import { GENRE_LABELS, fr, lookup, pct, peakSentence, readsAsMinor, toRelativeMinor, type Lookup } from './domain/lookup';
import { degreeFromNotes, voice } from '@shell/music/voicing';
import { KEY_NAMES, readStateFromUrl, stateToSearch, type VizState } from './state';
import { friezeItems, renderFrieze, type FriezeItem } from './ui/frieze';
import { gridCells, renderGrid, setCursor } from './ui/grid';
import { Player } from './ui/player';
import { renderShareCard, sharePhrase } from './ui/share-card';
import './viz.css';

mountShell({ currentSlug: 'progression-jouee' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};
const els = {
  tokens: $('tokens'),
  paletteDiatonic: $('palette-diatonic'),
  paletteBorrowed: $('palette-borrowed'),
  presets: $('presets'),
  result: $('result'),
  tonic: $<HTMLSelectElement>('tonic'),
  listen: $<HTMLButtonElement>('listen'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
  frieze: document.getElementById('frieze') as unknown as SVGSVGElement,
  friezeTitle: $('frieze-title'),
  genres: $('genres'),
  examplesList: $('examples-list'),
  grid: $('grid'),
  keyboard: $('keyboard'),
  heard: $('heard'),
  addChord: $<HTMLButtonElement>('add-chord'),
  clearKeys: $<HTMLButtonElement>('clear-keys'),
  accInline: $('acc-inline'),
  limitKey: $('limit-key'),
};

const PRESETS: { label: string; p: string }[] = [
  { label: 'Les quatre accords', p: 'I,V,vi,IV' },
  { label: 'ii–V–I', p: 'ii,V,I' },
  { label: 'Années 50', p: 'I,vi,IV,V' },
  { label: 'Andalouse', p: 'i,bVII,bVI,V' },
  { label: 'Blues', p: 'I,IV,V' },
  { label: 'vi–IV–I–V', p: 'vi,IV,I,V' },
  { label: 'Rock', p: 'I,bVII,IV' },
  { label: 'Canon', p: 'I,V,vi,iii,IV,I,IV,V' },
];
const DIATONIC = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const BORROWED = ['i', 'bII', 'II', 'bIII', 'III', 'iv', '#iv°', 'v', 'bVI', 'VI', 'bVII', 'VII'];
const KEY_LABELS = ['do', 'ré♭', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();
let meta: Meta | null = null;
let songs: TokenizedSong[] = [];
let current: Lookup | null = null;
let items: FriezeItem[] | null = null;
let examples: Example[] = [];
let shownExamples = 12;
let requestId = 0;
let friezeWidth = 0;

/* Panneau : jetons, palette, préréglages ---------------------------------------------------------- */

function setProgression(p: Degree[]) {
  if (p.length > MAX_LENGTH) return;
  store.set({ progression: p, example: null });
}

els.paletteDiatonic.innerHTML = DIATONIC.map((d) => `<button class="degree" type="button" data-degree="${d}">${d}</button>`).join('');
els.paletteBorrowed.innerHTML = BORROWED.map((d) => `<button class="degree degree--borrowed" type="button" data-degree="${d}">${d}</button>`).join('');
for (const pal of [els.paletteDiatonic, els.paletteBorrowed]) {
  pal.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-degree]');
    if (!b) return;
    const d = parseDegreeLabel(b.dataset.degree!)!;
    const { progression, tonic } = store.get();
    if (progression.length >= MAX_LENGTH) return;
    synth.play(voice(d, tonic).map((m) => 440 * 2 ** ((m - 69) / 12)), 0.6);
    setProgression([...progression, d]);
  });
}
els.tokens.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-index]');
  if (!b) return;
  const { progression } = store.get();
  if (progression.length <= MIN_LENGTH) return;
  setProgression(progression.filter((_, i) => i !== Number(b.dataset.index)));
});
els.presets.innerHTML = PRESETS.map((p) => `<button class="chip" type="button" data-preset="${p.p}" aria-pressed="false">${escapeHtml(p.label)}</button>`).join('');
els.presets.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-preset]');
  if (b) setProgression(parseProgression(b.dataset.preset!)!);
});
els.tonic.innerHTML = KEY_NAMES.map((k, i) => `<option value="${i}">${KEY_LABELS[i]} majeur (${k})</option>`).join('');
els.tonic.addEventListener('change', () => store.set({ tonic: Number(els.tonic.value) }));

function renderTokens(state: VizState) {
  const removable = state.progression.length > MIN_LENGTH;
  els.tokens.innerHTML = state.progression
    .map(
      (d, i) =>
        `<button class="token" type="button" role="listitem" data-index="${i}" ${removable ? '' : 'disabled'} aria-label="${escapeHtml(degreeLabel(d))}, ${removable ? 'retirer' : 'au moins deux accords'}">${escapeHtml(degreeLabel(d))}${removable ? '<span class="token-x" aria-hidden="true">×</span>' : ''}</button>`,
    )
    .join('<span class="token-sep" aria-hidden="true">–</span>');
  const full = state.progression.length >= MAX_LENGTH;
  for (const b of document.querySelectorAll<HTMLButtonElement>('.degree')) b.disabled = full;
  const key = progressionKey(state.progression);
  els.presets.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === key)));
  els.tonic.value = String(state.tonic);
}

/* Résultat -------------------------------------------------------------------------------------------- */

function renderResult(l: Lookup, m: Meta, input: readonly Degree[]) {
  const label = l.degrees.map(degreeLabel).join('–');
  const f = l.found;
  const minorNote = readsAsMinor(input) ? `<p class="result-line">Tu l’as écrite en mineur : dans l’armure du relatif majeur, c’est <strong>${escapeHtml(label)}</strong>, et c’est sous ce nom qu’elle est comptée.</p>` : '';
  const rot = l.rotations.length
    ? `<p class="result-rot"><span class="detail">Mêmes accords, autre point de départ : </span>${l.rotations
        .map((r) => `<button class="link" type="button" data-rot="${progressionKey(r.degrees)}">${escapeHtml(r.degrees.map(degreeLabel).join('–'))}</button> <span class="result-rot-n">${fr(r.found.total)}</span>`)
        .join(' · ')}</p>`
    : '';
  els.result.innerHTML = f
    ? `
    <p class="result-eyebrow">${escapeHtml(label)} · ${l.degrees.length} accords</p>
    <p class="result-figure">${fr(f.total)} <span class="result-unit">morceaux</span></p>
    <p class="result-line">soit <strong>${pct(f.share)}</strong> des ${fr(m.corpus.songs)} du corpus${f.firstYear ? ` ; la première fois, c’était en <strong>${f.firstYear}</strong>` : ''}. ${f.minor ? `${fr(f.minor)} sont en mineur${readsAsMinor(input) ? '' : ` (où elle s’écrit ${escapeHtml(toRelativeMinor(l.degrees).map(degreeLabel).join('–'))})`}.` : ''}</p>
    ${minorNote}
    <p class="result-sentence">${escapeHtml(peakSentence(f, m))}</p>
    ${rot}`
    : `
    <p class="result-eyebrow">${escapeHtml(label)} · ${l.degrees.length} accords</p>
    <p class="result-figure">moins de ${l.threshold}</p>
    <p class="result-line">morceaux sur ${fr(m.corpus.songs)} : une suite rare, ou une suite qu’on n’écrit pas comme ça dans une tablature.</p>
    ${minorNote}${rot}`;
  els.result.querySelectorAll<HTMLButtonElement>('[data-rot]').forEach((b) => b.addEventListener('click', () => setProgression(parseProgression(b.dataset.rot!)!)));
}

function renderGenres(l: Lookup, m: Meta) {
  if (!l.found) {
    els.genres.innerHTML = '';
    return;
  }
  const rows = l.found.byGenre
    .map((b, i) => ({ ...b, base: m.corpus.byGenre[i]! }))
    .filter((b) => b.share !== null)
    .sort((a, b) => b.share! - a.share!);
  const max = Math.max(1e-6, ...rows.map((r) => r.share!));
  els.genres.innerHTML = `<p class="figure-title">Et par style <span class="detail">— part des morceaux du style qui la contiennent</span></p><ul class="genre-list">${rows
    .map(
      (r, i) =>
        `<li class="genre-row${i === 0 ? ' is-peak' : ''}"><span class="genre-name">${escapeHtml(GENRE_LABELS[r.label] ?? r.label)}</span><span class="genre-bar"><span style="width:${((r.share! / max) * 100).toFixed(1)}%"></span></span><span class="genre-value">${pct(r.share!)}</span></li>`,
    )
    .join('')}</ul>`;
}

function renderExamples(state: VizState) {
  const list = examples.slice(0, shownExamples);
  els.examplesList.innerHTML = list.length
    ? list
        .map(
          (e) =>
            `<li><button class="example${state.example === e.song.id ? ' is-open' : ''}" type="button" data-example="${escapeHtml(e.song.id)}" aria-pressed="${state.example === e.song.id}"><span class="example-title">${escapeHtml(e.song.title)}</span><span class="example-meta">${escapeHtml(e.song.artist)}${e.song.year ? ` · ${e.song.year}` : ''} · ${escapeHtml(e.song.sections[e.section]!.name)}${e.sections > 1 ? ` (+${e.sections - 1})` : ''}</span></button></li>`,
        )
        .join('') + (examples.length > shownExamples ? `<li><button class="link" type="button" data-more>Voir ${Math.min(24, examples.length - shownExamples)} de plus (${examples.length} au total)</button></li>` : '')
    : `<li class="example-none">Aucun des ${fr(songs.length)} morceaux nommés ne la contient telle quelle. Les exemples s’arrêtent en 1991 ou sont des standards de jazz.</li>`;
  els.examplesList.querySelectorAll<HTMLButtonElement>('[data-example]').forEach((b) => b.addEventListener('click', () => store.set({ example: store.get().example === b.dataset.example ? null : b.dataset.example! })));
  els.examplesList.querySelector('[data-more]')?.addEventListener('click', () => {
    shownExamples += 24;
    renderExamples(store.get());
  });
}

function renderOpenGrid(state: VizState) {
  const song = state.example ? songs.find((s) => s.id === state.example) : null;
  if (!song) {
    els.grid.hidden = true;
    els.grid.innerHTML = '';
    return;
  }
  const cells = gridCells(song, current?.degrees ?? state.progression);
  renderGrid(
    els.grid,
    song,
    cells,
    () => store.set({ example: null }),
    () => {
      if (player.playing) {
        player.stop();
        return;
      }
      // Enchaînement doux : chaque accord choisit son renversement d'après le précédent.
      let prev: number[] | null = null;
      const steps = cells.flat().map((c) => {
        const midis = c.chord ? voice(degreeOf(c.chord, song.tonic), song.tonic, prev) : [];
        if (midis.length) prev = midis;
        return { midis, seconds: Math.max(0.35, Math.min(2.4, c.beats * 0.28)), tag: c };
      });
      player.play(steps);
    },
  );
}

/* Son --------------------------------------------------------------------------------------------------- */

const player = new Player(synth, (step) => {
  const c = step?.tag as { section: number; index: number } | undefined;
  if (!els.grid.hidden) setCursor(els.grid, c?.section ?? null, c?.index ?? null);
  els.tokens.querySelectorAll('.token').forEach((t, i) => t.classList.toggle('is-playing', !!step && (step.tag as { token?: number } | undefined)?.token === i));
  if (!step) els.listen.textContent = 'Écouter';
});

els.listen.addEventListener('click', () => {
  if (player.playing) {
    player.stop();
    return;
  }
  const { progression, tonic } = store.get();
  const p = current?.degrees ?? progression;
  let prev: number[] | null = null;
  const steps = [...p, ...p].map((d, i) => {
    const midis = voice(d, tonic, prev);
    prev = midis;
    return { midis, seconds: 0.75, tag: { token: i % p.length } };
  });
  els.listen.textContent = 'Arrêter';
  player.play(steps);
});

/* Clavier ------------------------------------------------------------------------------------------------- */

let keyboard: Keyboard | null = null;
let pressed: number[] = [];

function mountKeyboard() {
  const range = chooseRange(els.keyboard.clientWidth || window.innerWidth);
  if (keyboard && keyboard.range.low === range.low) return;
  keyboard = renderKeyboard(els.keyboard, range, (midi) => {
    pressed = pressed.includes(midi) ? pressed.filter((m) => m !== midi) : [...pressed, midi].sort((a, b) => a - b);
    synth.play(pressed.map((m) => 440 * 2 ** ((m - 69) / 12)), 0.8);
    renderHeard();
  });
  keyboard.update(pressed);
}

function renderHeard() {
  keyboard?.update(pressed);
  const { tonic } = store.get();
  const d = degreeFromNotes(pressed, tonic);
  els.addChord.disabled = !d;
  if (pressed.length === 0) els.heard.textContent = 'Aucune note posée.';
  else if (!d) els.heard.textContent = `${pressed.length} note${pressed.length > 1 ? 's' : ''} : pas une triade que je reconnaisse.`;
  else els.heard.innerHTML = `Je lis <strong>${escapeHtml(degreeLabel(d))}</strong> en ${KEY_LABELS[tonic]} majeur.`;
}
els.addChord.addEventListener('click', () => {
  const d = degreeFromNotes(pressed, store.get().tonic);
  if (!d) return;
  setProgression([...store.get().progression, d]);
  pressed = [];
  renderHeard();
});
els.clearKeys.addEventListener('click', () => {
  pressed = [];
  renderHeard();
});

/* Rendu global --------------------------------------------------------------------------------------------- */

async function refresh(state: VizState) {
  const id = ++requestId;
  const m = meta ?? (meta = await loadMeta());
  const n = state.progression.length;
  const shard = await loadShard(n);
  if (id !== requestId) return;
  current = lookup(state.progression, shard, m);
  items = current.found ? friezeItems(current.found.byDecade, m.corpus.byDecade) : null;
  renderResult(current, m, state.progression);
  friezeWidth = Math.round(els.frieze.clientWidth) || 640;
  renderFrieze(els.frieze, items, friezeWidth);
  renderGenres(current, m);
  examples = findExamples(songs, current.degrees);
  shownExamples = 12;
  renderExamples(state);
  renderOpenGrid(state);
}

function render(state: VizState, previous?: VizState) {
  renderTokens(state);
  renderHeard();
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
  if (!previous || progressionKey(previous.progression) !== progressionKey(state.progression)) {
    player.stop();
    void refresh(state);
  } else if (previous.example !== state.example) {
    player.stop();
    renderExamples(state);
    renderOpenGrid(state);
  }
}

store.subscribe(render);

/* Partage ------------------------------------------------------------------------------------------------------ */

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'ma-progression.png',
  render: () => renderShareCard({ lookup: current!, items, corpusSize: meta!.corpus.songs, siteUrl: location.host + location.pathname }),
  text: () => (current ? sharePhrase(current) : ''),
});

/* Mise en place ---------------------------------------------------------------------------------------------------- */

async function boot() {
  render(store.get());
  mountKeyboard();
  try {
    const [m, s] = await Promise.all([loadMeta(), loadSongs()]);
    meta = m;
    songs = s;
    const irb = m.keyAccuracy.irb;
    const bb = m.keyAccuracy.billboard;
    const p = (a: number, n: number) => `${Math.round((100 * a) / n)} %`;
    els.accInline.textContent = `${p(bb.tonic, bb.n)} de toniques justes sur le Billboard, ${p(irb.signature, irb.n)} d’armures justes sur les standards de jazz`;
    els.limitKey.innerHTML = `<strong>La tonalité est estimée</strong> pour Chordonomicon. Mesurée là où elle est annotée : ${p(bb.tonic, bb.n)} de toniques justes sur les ${fr(bb.n)} titres du Billboard, ${p(irb.signature, irb.n)} d’armures justes sur les ${fr(irb.n)} standards de jazz de l’iRb (le jazz module davantage ; il pèse 1 % de Chordonomicon). Quand elle est fausse, le morceau compte pour une autre progression, souvent la même décalée d’une quarte (un I–bVII–IV lu comme V–IV–I).`;
    await refresh(store.get());
  } catch (err) {
    console.error(err);
    els.result.innerHTML = `<p class="result-line">Les données n’ont pas pu être chargées. Recharge la page ; si ça persiste, le problème est de notre côté.</p>`;
  }
}

void boot();
// Redessine la frise seulement quand la largeur change vraiment (sa hauteur dépend de sa largeur : sans ce garde-fou, on boucle).
new ResizeObserver(() => {
  const w = Math.round(els.frieze.clientWidth);
  if (w && w !== friezeWidth) {
    friezeWidth = w;
    if (current) renderFrieze(els.frieze, items, w);
  }
  mountKeyboard();
}).observe(els.frieze);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) player.stop();
});
