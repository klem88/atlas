import { escapeHtml } from '@shell/html';
import { renderKeyboard, type Keyboard } from '@shell/music/keyboard';
import { equalFrequency, noteName } from '@shell/music/pitch';
import { Synth, type Held } from '@shell/music/synth';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { createStore } from '@shell/store';
import { MAX_RANK, amplitudeOf, harmonicSeries, normalizeRanks, summarize, type Partial } from './domain/partials';
import { ALL_RANKS, readStateFromUrl, stateToSearch, type Fundamental, type VizState } from './state';
import { createRail } from './ui/rail';
import { renderShareCard, SHARE_PHRASE } from './ui/share-card';
import { createWave, readWaveColors } from './ui/wave';
import './viz.css';

mountShell({ currentSlug: 'une-seule-note' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};

const els = {
  fundamental: $('fundamental'),
  result: $('result'),
  listen: $<HTMLButtonElement>('listen'),
  presets: $('presets'),
  rail: $('rail'),
  keyboard: $('keyboard'),
  scroll: $('scroll'),
  wave: $<HTMLCanvasElement>('wave'),
  formula: $('formula'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
};

const PRESETS: { label: string; ranks: number[] }[] = [
  { label: 'La fondamentale seule', ranks: [1] },
  { label: 'L’accord caché (4·5·6)', ranks: [4, 5, 6] },
  { label: 'La septième bleue (4·5·6·7)', ranks: [4, 5, 6, 7] },
  { label: 'Les octaves', ranks: [1, 2, 4, 8, 16] },
  { label: 'Entre les touches', ranks: [7, 11, 13, 14] },
  { label: 'Toutes', ranks: ALL_RANKS },
];

const fr = (n: number, digits = 1) => n.toLocaleString('fr-FR', { maximumFractionDigits: digits });
const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();

/* Série courante ---------------------------------------------------------------- */

let partials: Partial[] = harmonicSeries(store.get().fundamental);
const amplitudes = (ranks: readonly number[]) => Array.from({ length: MAX_RANK }, (_, i) => (ranks.includes(i + 1) ? amplitudeOf(i + 1) : 0));

/* Clavier et rail ----------------------------------------------------------------- */

let keyboard: Keyboard | null = null;

function toggleRank(k: number) {
  const { ranks } = store.get();
  store.set({ ranks: ranks.includes(k) ? ranks.filter((r) => r !== k) : normalizeRanks([...ranks, k]) });
}

function mountKeyboard(fundamental: Fundamental) {
  if (keyboard && keyboard.range.low === fundamental) return;
  keyboard = renderKeyboard(els.keyboard, { low: fundamental, high: fundamental + 48 }, (midi) => {
    // Une touche allume ou éteint l'harmonique qui s'y pose (la plus proche, s'il y en a une).
    const p = partials.find((x) => x.midi === midi);
    if (p) toggleRank(p.k);
  });
}

const rail = createRail(els.rail, els.keyboard, toggleRank);
const wave = createWave(els.wave, readWaveColors);

/* Son ------------------------------------------------------------------------------ */

let held: Held | null = null;

function startSound() {
  const state = store.get();
  held = synth.hold([equalFrequency(state.fundamental)], amplitudes(state.ranks));
  els.listen.textContent = 'Arrêter';
  const mine = held;
  void mine.finished.then(() => {
    if (held === mine) {
      held = null;
      els.listen.textContent = 'Écouter';
    }
  });
}

function stopSound() {
  held?.stop();
  held = null;
  els.listen.textContent = 'Écouter';
}

els.listen.addEventListener('click', () => (held ? stopSound() : startSound()));

/* Panneau ---------------------------------------------------------------------------- */

els.fundamental.addEventListener('change', (e) => store.set({ fundamental: Number((e.target as HTMLInputElement).value) as Fundamental }));
els.presets.innerHTML = PRESETS.map((p, i) => `<button class="chip" type="button" data-preset="${i}" aria-pressed="false">${escapeHtml(p.label)}</button>`).join('');
els.presets.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-preset]');
  if (!b) return;
  store.set({ ranks: [...PRESETS[Number(b.dataset.preset)]!.ranks] });
  if (!held) startSound();
});

function renderResult(state: VizState) {
  const on = partials.filter((p) => state.ranks.includes(p.k));
  const all = summarize(partials);
  const worst = all.worst!;
  const f0 = equalFrequency(state.fundamental);
  let heard: string;
  if (on.length === 0) heard = 'Rien n’est allumé : silence.';
  else if (on.length === 1) heard = `Un seul rang : une sinusoïde pure, ${on[0]!.k === 1 ? 'la note nue' : `à ${on[0]!.k} fois la fondamentale`}.`;
  else if (on.every((p) => [4, 5, 6].includes(p.k)) && on.length === 3) heard = 'Les rangs 4, 5, 6 : do, mi, sol. L’accord majeur, sans avoir joué d’accord.';
  else if (on.every((p) => [4, 5, 6, 7].includes(p.k)) && on.length === 4) heard = 'Do, mi, sol et la septième bleue : l’accord des cuivres et du blues, que le piano ne peut qu’approcher.';
  else if (on.every((p) => (p.k & (p.k - 1)) === 0)) heard = 'Que des octaves : un son creux, comme un orgue sans mélange.';
  else heard = `${on.length} rangs allumés sur ${MAX_RANK} : un timbre ${on.length >= 12 ? 'riche, un peu nasal' : 'clair'}.`;

  els.result.innerHTML = `
    <p class="result-eyebrow">${escapeHtml(noteName(state.fundamental))} · ${fr(f0)} Hz</p>
    <p class="result-figure">${on.length === 0 ? 'silence' : `${on.length} harmonique${on.length > 1 ? 's' : ''}`}</p>
    <p class="result-line">${escapeHtml(heard)}</p>
    <p class="result-line">Sur les seize premières, <strong>${all.offKey} tombent entre les touches</strong> ; la plus loin est la ${worst.k}ᵉ, à ${fr(Math.abs(worst.cents), 0)} cents ${worst.cents < 0 ? 'sous' : 'au-dessus de'} ${escapeHtml(noteName(worst.midi))}.</p>
    <p class="result-detail detail">« Entre les touches » : à plus de 15 cents de la touche la plus proche.</p>`;

  els.formula.textContent = partials
    .map((p) => `rang ${String(p.k).padStart(2)} : ${fr(p.hz).padStart(8)} Hz → ${noteName(p.midi).padEnd(5)} ${p.cents === 0 ? '   0' : `${p.cents > 0 ? '+' : '−'}${fr(Math.abs(p.cents)).padStart(4)}`} cents${state.ranks.includes(p.k) ? '   ●' : ''}`)
    .join('\n');
}

/* Rendu global ---------------------------------------------------------------------- */

function render(state: VizState, previous?: VizState) {
  if (!previous || previous.fundamental !== state.fundamental) {
    partials = harmonicSeries(state.fundamental);
    mountKeyboard(state.fundamental);
    if (held) startSound();
  }
  for (const input of els.fundamental.querySelectorAll<HTMLInputElement>('input')) input.checked = Number(input.value) === state.fundamental;
  const on = new Set(state.ranks);
  keyboard?.update(partials.filter((p) => on.has(p.k)).map((p) => p.midi));
  rail.update(partials, on);
  wave.render(state.ranks);
  els.presets.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b, i) => b.setAttribute('aria-pressed', String(PRESETS[i]!.ranks.join(',') === state.ranks.join(','))));
  els.listen.disabled = state.ranks.length === 0;
  renderResult(state);
  held?.setAmplitudes(amplitudes(state.ranks));
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
}

store.subscribe(render);

/* Partage ---------------------------------------------------------------------------- */

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'ce-qu-une-seule-note-contient.png',
  render: () => renderShareCard({ state: store.get(), partials, siteUrl: location.host + location.pathname }),
  text: () => SHARE_PHRASE,
});

/* Mise en place ------------------------------------------------------------------------ */

render(store.get());
wave.resize();
render(store.get());
new ResizeObserver(() => {
  wave.resize();
  rail.update(partials, new Set(store.get().ranks));
}).observe(els.scroll);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => wave.render(store.get().ranks));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSound();
});
