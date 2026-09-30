import { escapeHtml } from '@shell/html';
import { chooseRange, renderKeyboard, type Keyboard } from '@shell/music/keyboard';
import { intervalName, noteName } from '@shell/music/pitch';
import { Synth } from '@shell/music/synth';
import { chordFrequencies } from '@shell/music/tuning';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { createStore } from '@shell/store';
import { closureTurns, integerRatios, precession, relativeRatios } from './domain/curve';
import { createChordScene, readSceneTheme, type TimeMode } from './scene/scene';
import { normalizeNotes, readStateFromUrl, stateToSearch, type VizState } from './state';
import { renderShareCard, SHARE_PHRASE } from './ui/share-card';
import './viz.css';

mountShell({ currentSlug: 'forme-accord' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};

const els = {
  tuning: $('tuning'),
  mode: $('mode'),
  result: $('result'),
  listen: $<HTMLButtonElement>('listen'),
  presets: $('presets'),
  keyboard: $('keyboard'),
  scene: $('scene'),
  sceneHint: $('scene-hint'),
  formula: $('formula'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
};

const PRESETS: { label: string; notes: number[] }[] = [
  { label: 'Octave', notes: [60, 72] },
  { label: 'Quinte', notes: [60, 67] },
  { label: 'Tierce majeure', notes: [60, 64] },
  { label: 'Accord majeur', notes: [60, 64, 67] },
  { label: 'Accord mineur', notes: [60, 63, 67] },
  { label: 'Triton', notes: [60, 66] },
  { label: 'Quarte et sixte', notes: [60, 65, 69] },
];

const AXES = ['gauche – droite', 'bas – haut', 'avant – arrière'];
const SPEED_TURNS_PER_S = 30;
const fr = (n: number, digits = 4) => n.toLocaleString('fr-FR', { maximumFractionDigits: digits });

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
const scene = createChordScene(els.scene, readSceneTheme(), reducedMotion);

/* Clavier ------------------------------------------------------------------- */

let keyboard: Keyboard | null = null;

function toggleNote(midi: number) {
  const { notes } = store.get();
  const next = notes.includes(midi) ? notes.filter((n) => n !== midi) : normalizeNotes([...notes, midi]);
  if (!notes.includes(midi) && next.length === notes.length) return; // déjà trois notes
  store.set({ notes: next });
  if (next.length > notes.length) playChord(1.2);
}

function mountKeyboard() {
  const range = chooseRange(els.keyboard.clientWidth || window.innerWidth);
  if (keyboard && keyboard.range.low === range.low) return;
  keyboard = renderKeyboard(els.keyboard, range, toggleNote);
  keyboard.update(store.get().notes);
}

/* Son ------------------------------------------------------------------------ */

function playChord(seconds: number) {
  const { notes, tuning } = store.get();
  if (notes.length === 0) return;
  const p = synth.play(chordFrequencies(notes, tuning), seconds);
  els.listen.textContent = 'Arrêter';
  void p.finished.then(() => {
    if (synth.playing === null) els.listen.textContent = 'Écouter';
  });
}

els.listen.addEventListener('click', () => {
  if (synth.playing) {
    synth.stop();
    els.listen.textContent = 'Écouter';
  } else playChord(3.5);
});

/* Panneau --------------------------------------------------------------------- */

els.tuning.addEventListener('change', (e) => store.set({ tuning: (e.target as HTMLInputElement).value as VizState['tuning'] }));
els.mode.addEventListener('change', (e) => store.set({ mode: (e.target as HTMLInputElement).value as TimeMode }));

els.presets.innerHTML = PRESETS.map((p, i) => `<button class="chip" type="button" data-preset="${i}" aria-pressed="false">${escapeHtml(p.label)}</button>`).join('');
els.presets.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-preset]');
  if (!b) return;
  store.set({ notes: [...PRESETS[Number(b.dataset.preset)]!.notes] });
  playChord(2);
});

/** Phrase sur la fermeture ou la précession, avec ses chiffres. */
function motionSentence(state: VizState): { html: string; detail: string } {
  const { notes, tuning } = state;
  const turns = closureTurns(notes);
  if (tuning === 'pur' || notes.length < 2 || precession(notes, tuning).every((p) => p === 0)) {
    return {
      html: `La courbe <strong>se referme</strong> au bout de ${turns === 1 ? 'un tour' : `${turns} tours`} de ${escapeHtml(noteName(notes[0]!))}, puis repasse sur elle-même à jamais.`,
      detail: tuning === 'egal' ? 'L’octave est le seul intervalle pur du piano.' : '',
    };
  }
  const p = precession(notes, tuning);
  const fastest = Math.max(...p.map(Math.abs));
  const turnsPerLap = 1 / fastest;
  const seconds = turnsPerLap / SPEED_TURNS_PER_S;
  const i = p.findIndex((x) => Math.abs(x) === fastest);
  return {
    html: `La courbe <strong>ne se referme jamais</strong> : elle tourne sur elle-même en ${fr(turnsPerLap, 0)} tours de ${escapeHtml(noteName(notes[0]!))}, soit ${fr(seconds, 1)} s quand le temps file.`,
    detail: `${noteName(notes[i]!)} gagne ${fr(Math.abs(p[i]!) , 4)} cycle par tour sur l’accord pur (${p[i]! > 0 ? 'trop haut' : 'trop bas'}).`,
  };
}

function renderResult(state: VizState) {
  const { notes, tuning } = state;
  if (notes.length === 0) {
    els.result.innerHTML = `<p class="result-eyebrow">Joue une ou plusieurs notes sur le clavier.</p>`;
    return;
  }
  if (notes.length === 1) {
    els.result.innerHTML = `<p class="result-eyebrow">${escapeHtml(noteName(notes[0]!))}</p><p class="result-figure">une ligne</p><p class="result-detail">Une seule note va et vient sur son axe. Ajoute-en une deuxième pour voir une forme.</p>`;
    return;
  }
  const ints = integerRatios(notes);
  const ratios = relativeRatios(notes, tuning);
  const what = notes.length === 2 ? `une ${intervalName(notes[1]! - notes[0]!)}` : 'un accord';
  const m = motionSentence(state);
  els.result.innerHTML = `
    <p class="result-eyebrow">${escapeHtml(notes.map(noteName).join(notes.length === 2 ? ' – ' : ', '))}, ${escapeHtml(what)}</p>
    <p class="result-figure">${ints.join(' : ')}</p>
    <p class="result-detail">${tuning === 'pur' ? 'rapports entiers de fréquences' : `rapports réels : ${ratios.map((r) => fr(r)).join(' : ')}`}</p>
    <p class="result-line">${m.html}</p>
    ${m.detail ? `<p class="result-detail detail">${escapeHtml(m.detail)}</p>` : ''}`;
}

function renderFormula(state: VizState) {
  const { notes, tuning } = state;
  if (notes.length < 2) {
    els.formula.textContent = 'Joue au moins deux notes pour voir le calcul.';
    return;
  }
  const ratios = relativeRatios(notes, tuning);
  const pure = relativeRatios(notes, 'pur');
  const ints = integerRatios(notes);
  const p = precession(notes, tuning);
  const lines = notes.map((n, i) => `r(${noteName(n)}) = ${fr(ratios[i]!, 5)}${tuning === 'egal' && i > 0 ? `   pur : ${fr(pure[i]!, 5)}   écart : ${p[i]! >= 0 ? '+' : '−'}${fr(Math.abs(p[i]!), 5)} cycle par tour` : ''}`);
  lines.push(`entiers : ${ints.join(' : ')}   fermeture pure : ${closureTurns(notes)} tour${closureTurns(notes) > 1 ? 's' : ''} de ${noteName(notes[0]!)}`);
  els.formula.textContent = lines.join('\n');
}

function renderHint(state: VizState) {
  els.sceneHint.innerHTML = state.notes.map((n, i) => `<span>${escapeHtml(AXES[i]!)} : ${escapeHtml(noteName(n))}</span>`).join('') +
    (state.notes.length >= 2 ? `<span>${reducedMotion ? 'Touche la courbe pour la mettre en mouvement.' : coarsePointer ? 'Deux doigts pour tourner autour.' : 'Glisse pour tourner autour.'}</span>` : '');
}

/* Rendu global ------------------------------------------------------------------ */

function render(state: VizState) {
  keyboard?.update(state.notes);
  for (const input of els.tuning.querySelectorAll<HTMLInputElement>('input')) input.checked = input.value === state.tuning;
  for (const input of els.mode.querySelectorAll<HTMLInputElement>('input')) input.checked = input.value === state.mode;
  const presetIndex = PRESETS.findIndex((p) => p.notes.join(',') === state.notes.join(','));
  els.presets.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b, i) => b.setAttribute('aria-pressed', String(i === presetIndex)));
  els.listen.disabled = state.notes.length === 0;
  els.shareButton.disabled = state.notes.length < 2;
  renderResult(state);
  renderFormula(state);
  renderHint(state);
  scene.setMode(state.mode);
  scene.setCurve(state.notes.length ? relativeRatios(state.notes, state.tuning) : [1], closureTurns(state.notes));
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
}

store.subscribe((state, previous) => {
  if (state.mode !== previous.mode) scene.setMode(state.mode);
  render(state);
});

/* Partage ---------------------------------------------------------------------- */

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'la-forme-d-un-accord.png',
  render: () => {
    const state = store.get();
    scene.renderOnce();
    return renderShareCard({ notes: state.notes, tuning: state.tuning, ints: integerRatios(state.notes), sceneCanvas: scene.canvas, siteUrl: location.host + location.pathname });
  },
  text: () => `${store.get().notes.map(noteName).join(', ')} : ${integerRatios(store.get().notes).join(':')}. ${SHARE_PHRASE}`,
});

/* Mise en place ----------------------------------------------------------------- */

mountKeyboard();
render(store.get());

new ResizeObserver(() => {
  mountKeyboard();
  scene.resize();
}).observe(els.scene);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => scene.setTheme(readSceneTheme()));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) synth.stop();
});
