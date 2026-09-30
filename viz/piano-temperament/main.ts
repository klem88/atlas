import { escapeHtml } from '@shell/html';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { createStore } from '@shell/store';
import { beatWindow, chordPairs, pairBeats, type PairBeats } from './domain/beats';
import { noteName } from './domain/pitch';
import { chordFrequencies, type TuningId } from './domain/tuning';
import { MAX_NOTES, normalizeNotes, readStateFromUrl, stateToSearch, type VizState } from './state';
import { renderHarmonics } from './ui/harmonics';
import { chooseRange, renderKeyboard, type Keyboard } from './ui/keyboard';
import { SHARE_PHRASE, renderShareCard } from './ui/share-card';
import { setupSpiral } from './ui/spiral';
import { PRESETS, STRINGS, fmtBeats, fmtCents, fmtHz, fmtInterval, fmtNotes, fmtOrdinal, pairSentence } from './ui/strings';
import { Synth, type Playback } from './ui/synth';
import { createWaves, readWaveTheme } from './ui/waves';
import './viz.css';

mountShell({ currentSlug: 'piano-temperament' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();

const els = {
  tuning: $('tuning'),
  result: $('result'),
  listen: $<HTMLButtonElement>('listen'),
  compare: $<HTMLButtonElement>('compare'),
  presets: $('presets'),
  keyboard: $('keyboard'),
  hint: $('stage-hint'),
  waves: $<HTMLCanvasElement>('waves'),
  wavesLegend: $('waves-legend'),
  pairs: $('pairs'),
  harmonics: document.getElementById('harmonics') as unknown as SVGSVGElement,
  formula: $('formula'),
  spiral: document.getElementById('spiral') as unknown as SVGSVGElement,
  spiralControls: $('spiral-controls'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
};

/* Vue dérivée de l'état -------------------------------------------------------- */

interface View {
  pairs: PairBeats[];
  pair: PairBeats | null;
  /** Fenêtre de temps de la vague : celle du tempérament égal, pour comparer à fenêtre égale. */
  windowS: number;
  /** Instant montré au repos : un quart de battement, pour que les deux ondes se distinguent (0 si elles coïncident). */
  restT: number;
}

function view(state: VizState): View {
  const pairs = chordPairs(state.notes, state.tuning);
  const pair = pairs[Math.min(state.pair, pairs.length - 1)] ?? null;
  const windowS = pair ? beatWindow(pairBeats(pair.low, pair.high, 'egal').beatHz) : 1;
  const restT = pair && pair.beatHz > 0.001 ? 1 / (4 * pair.beatHz) : 0;
  return { pairs, pair, windowS, restT };
}

/* Clavier ---------------------------------------------------------------------- */

let keyboard: Keyboard | null = null;

function toggleNote(midi: number) {
  const { notes } = store.get();
  const next = notes.includes(midi) ? notes.filter((n) => n !== midi) : normalizeNotes([...notes, midi]);
  if (next.length === notes.length && !notes.includes(midi)) {
    els.hint.textContent = `Quatre notes au plus : enlève-en une d’abord.`;
    return;
  }
  store.set({ notes: next, pair: 0 });
  // Un geste de l'utilisateur : on peut faire entendre la note ajoutée, brièvement.
  if (next.length > notes.length) playChord(1.4);
}

function mountKeyboard() {
  const range = chooseRange(els.keyboard.clientWidth || window.innerWidth);
  if (keyboard && keyboard.range.low === range.low) return;
  keyboard = renderKeyboard(els.keyboard, range, toggleNote);
  keyboard.update(store.get().notes);
}

/* Son ---------------------------------------------------------------------------- */

const waves = createWaves(els.waves, readWaveTheme);
let playback: Playback | null = null;
let raf = 0;

function animate() {
  const p = playback;
  if (!p) return;
  const v = view(store.get());
  waves.render({ pair: v.pair, windowS: v.windowS, t: p.elapsed(), playing: true });
  raf = requestAnimationFrame(animate);
}

function stopSound() {
  synth.stop();
  playback = null;
  cancelAnimationFrame(raf);
  els.listen.textContent = STRINGS.listen;
  els.compare.disabled = false;
  const v = view(store.get());
  waves.render({ pair: v.pair, windowS: v.windowS, t: v.restT, playing: false });
}

function playChord(seconds: number, tuning: TuningId = store.get().tuning): Playback | null {
  const { notes } = store.get();
  if (notes.length === 0) return null;
  cancelAnimationFrame(raf);
  playback = synth.play(chordFrequencies(notes, tuning), seconds);
  els.listen.textContent = STRINGS.stop;
  const mine = playback;
  void mine.finished.then(() => {
    if (playback === mine) stopSound();
  });
  animate();
  return mine;
}

els.listen.addEventListener('click', () => {
  if (playback) stopSound();
  else playChord(3.5);
});

els.compare.addEventListener('click', async () => {
  const { tuning } = store.get();
  const other: TuningId = tuning === 'pur' ? 'egal' : 'pur';
  els.compare.disabled = true;
  const first = playChord(2.6, tuning);
  if (!first) {
    els.compare.disabled = false;
    return;
  }
  await first.finished;
  if (playback !== null) return; // arrêté entre-temps
  await new Promise((r) => setTimeout(r, 250));
  els.compare.textContent = tuning === 'pur' ? 'Puis ton piano…' : STRINGS.comparing;
  const second = playChord(2.6, other);
  await second?.finished;
  els.compare.textContent = tuning === 'pur' ? 'Comparer avec ton piano' : STRINGS.compare;
  els.compare.disabled = false;
});

/* Panneau ------------------------------------------------------------------------ */

els.tuning.addEventListener('change', (e) => {
  const value = (e.target as HTMLInputElement).value as TuningId;
  store.set({ tuning: value });
});

els.presets.innerHTML = PRESETS.map(
  (p, i) => `<button class="chip" type="button" data-preset="${i}" aria-pressed="false">${escapeHtml(p.label)}</button>`,
).join('');
els.presets.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-preset]');
  if (!b) return;
  const p = PRESETS[Number(b.dataset.preset)]!;
  store.set({ notes: [...p.notes], tuning: p.tuning ?? 'egal', pair: 0 });
  playChord(2.2);
});

els.pairs.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-pair]');
  if (b) store.set({ pair: Number(b.dataset.pair) });
});

function renderResult(state: VizState, v: View) {
  const { notes, tuning } = state;
  if (notes.length === 0) {
    els.result.innerHTML = `<p class="result-eyebrow">${STRINGS.pick}</p>`;
    return;
  }
  if (notes.length === 1) {
    const hz = chordFrequencies(notes, tuning)[0]!;
    els.result.innerHTML = `
      <p class="result-eyebrow">Une note</p>
      <p class="result-figure">${escapeHtml(noteName(notes[0]!))} <span class="result-detail">${fmtHz(hz)}</span></p>
      <p class="result-detail">${STRINGS.onlyOne}</p>`;
    return;
  }
  const p = v.pair!;
  const title = notes.length === 2 ? `une ${fmtInterval(p.semitones)}` : `un accord de ${notes.length} notes`;
  els.result.innerHTML = `
    <p class="result-eyebrow">${escapeHtml(fmtNotes(notes))}</p>
    <p class="result-figure">${escapeHtml(title)}</p>
    <p class="result-beats"><strong>${escapeHtml(fmtBeats(p.beatHz))}</strong>${notes.length > 2 ? ` <span class="result-detail">entre ${escapeHtml(noteName(p.low))} et ${escapeHtml(noteName(p.high))}</span>` : ''}</p>
    <p class="result-detail">${escapeHtml(pairSentence(p, tuning))}</p>
    <p class="result-detail detail">${fmtOrdinal(p.harmonics[0])} harmonique de ${escapeHtml(noteName(p.low))} : ${fmtHz(p.lowHz)} · ${fmtOrdinal(p.harmonics[1])} de ${escapeHtml(noteName(p.high))} : ${fmtHz(p.highHz)} · écart ${escapeHtml(fmtCents(p.cents))}</p>`;
}

function renderPairs(state: VizState, v: View) {
  if (v.pairs.length < 2) {
    els.pairs.innerHTML = '';
    return;
  }
  const active = Math.min(state.pair, v.pairs.length - 1);
  els.pairs.innerHTML =
    `<span>${STRINGS.pairs}</span>` +
    v.pairs
      .map(
        (p, i) =>
          `<button class="chip" type="button" data-pair="${i}" aria-pressed="${i === active}">${escapeHtml(noteName(p.low))} – ${escapeHtml(noteName(p.high))} · ${escapeHtml(fmtBeats(p.beatHz).replace(' par seconde', '/s'))}</button>`,
      )
      .join('');
}

function renderLegend(v: View) {
  const p = v.pair;
  if (!p) {
    els.wavesLegend.innerHTML = '';
    return;
  }
  els.wavesLegend.innerHTML = `
    <span class="legend-low">${fmtOrdinal(p.harmonics[0])} harmonique de ${escapeHtml(noteName(p.low))} · ${fmtHz(p.lowHz)}</span>
    <span class="legend-high">${fmtOrdinal(p.harmonics[1])} harmonique de ${escapeHtml(noteName(p.high))} · ${fmtHz(p.highHz)}</span>
    <span class="legend-sum">leur somme</span>`;
}

function renderFormula(state: VizState, v: View) {
  const p = v.pair;
  if (!p) {
    els.formula.textContent = 'Joue au moins deux notes pour voir le calcul.';
    return;
  }
  const [fLow, fHigh] = chordFrequencies([p.low, p.high], state.tuning) as [number, number];
  const ratio = fHigh / fLow;
  const lines = [
    `${noteName(p.low)} = ${fmtHz(fLow)}   ${noteName(p.high)} = ${fmtHz(fHigh)}   rapport = ${ratio.toLocaleString('fr-FR', { maximumFractionDigits: 5 })}`,
    `intervalle pur : ${p.harmonics[0]}/${p.harmonics[1]} = ${(p.harmonics[0] / p.harmonics[1]).toLocaleString('fr-FR', { maximumFractionDigits: 5 })}   écart = 1200 · log₂(${ratio.toLocaleString('fr-FR', { maximumFractionDigits: 5 })} ÷ ${p.harmonics[0]}/${p.harmonics[1]}) = ${fmtCents(p.cents)}`,
    `${fmtOrdinal(p.harmonics[0])} harmonique de ${noteName(p.low)} : ${p.harmonics[0]} × ${fmtHz(fLow)} = ${fmtHz(p.lowHz)}`,
    `${fmtOrdinal(p.harmonics[1])} harmonique de ${noteName(p.high)} : ${p.harmonics[1]} × ${fmtHz(fHigh)} = ${fmtHz(p.highHz)}`,
    `battements : |${fmtHz(p.lowHz)} − ${fmtHz(p.highHz)}| = ${p.beatHz.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} par seconde`,
  ];
  els.formula.textContent = lines.join('\n');
}

/* Rendu global --------------------------------------------------------------------- */

function render(state: VizState) {
  const v = view(state);
  keyboard?.update(state.notes);
  for (const input of els.tuning.querySelectorAll<HTMLInputElement>('input')) input.checked = input.value === state.tuning;
  els.compare.textContent = state.tuning === 'pur' ? 'Comparer avec ton piano' : STRINGS.compare;
  const presetIndex = PRESETS.findIndex((p) => p.notes.join(',') === state.notes.join(',') && (p.tuning ?? 'egal') === state.tuning);
  els.presets.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b, i) => b.setAttribute('aria-pressed', String(i === presetIndex)));
  els.listen.disabled = state.notes.length === 0;
  els.compare.disabled = state.notes.length < 2;
  els.shareButton.disabled = state.notes.length < 2;
  if (state.notes.length < MAX_NOTES) els.hint.textContent = 'Touche une note pour l’ajouter, touche-la encore pour l’enlever. Jusqu’à quatre notes.';

  renderResult(state, v);
  renderPairs(state, v);
  renderLegend(v);
  renderFormula(state, v);
  renderHarmonics(els.harmonics, state.notes, state.tuning, v.pair);
  if (!playback) waves.render({ pair: v.pair, windowS: v.windowS, t: v.restT, playing: false });
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
}

store.subscribe(render);

/* Partage ------------------------------------------------------------------------- */

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'pourquoi-ton-piano-est-faux.png',
  render: () => {
    const state = store.get();
    const v = view(state);
    if (!v.pair) throw new Error('Aucun intervalle à partager.');
    return renderShareCard({ notes: state.notes, tuning: state.tuning, pair: v.pair, windowS: v.windowS, siteUrl: location.host + location.pathname });
  },
  text: () => {
    const v = view(store.get());
    return v.pair ? `${fmtNotes(store.get().notes)} : ${fmtBeats(v.pair.beatHz)}. ${SHARE_PHRASE}` : SHARE_PHRASE;
  },
});

/* Mise en place --------------------------------------------------------------------- */

setupSpiral(els.spiral, els.spiralControls);
mountKeyboard();
waves.resize();
render(store.get());

new ResizeObserver(() => {
  mountKeyboard();
  waves.resize();
  renderHarmonics(els.harmonics, store.get().notes, store.get().tuning, view(store.get()).pair);
}).observe(els.keyboard);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render(store.get()));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSound();
});
