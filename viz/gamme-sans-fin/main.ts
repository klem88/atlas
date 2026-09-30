import { escapeHtml } from '@shell/html';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { createStore } from '@shell/store';
import { SPEEDS, counter, pitchAt, shepardComponents, type Component } from './domain/shepard';
import { createHelixScene, readHelixTheme } from './scene/helix';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { renderShareCard, sharePhrase } from './ui/share-card';
import { ShepardSynth } from './ui/shepard-synth';
import { createSpectrum } from './ui/spectrum';
import './viz.css';

mountShell({ currentSlug: 'gamme-sans-fin' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};

const els = {
  play: $<HTMLButtonElement>('play'),
  reset: $<HTMLButtonElement>('reset'),
  result: $('result'),
  sens: $('sens'),
  mouvement: $('mouvement'),
  vitesse: $('vitesse'),
  vue: $('vue'),
  scene: $('scene'),
  sceneHint: $('scene-hint'),
  spectrum: document.getElementById('spectrum') as unknown as SVGSVGElement,
  formula: $('formula'),
  paradoxPlay: $<HTMLButtonElement>('paradox-play'),
  paradoxUp: $<HTMLButtonElement>('paradox-up'),
  paradoxDown: $<HTMLButtonElement>('paradox-down'),
  paradoxStatus: $('paradox-status'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
};

const fr = (n: number) => n.toLocaleString('fr-FR');
const store = createStore<VizState>(readStateFromUrl(location.search));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
const synth = new ShepardSynth();
const scene = createHelixScene(els.scene, readHelixTheme(), reducedMotion);
const spectrum = createSpectrum(els.spectrum);

/* La position du son ------------------------------------------------------------- */

/** Cents parcourus depuis le départ, signés, jamais réduits à l'octave. */
let travelled = 0;
let playing = false;
let raf = 0;
let lastFrame = 0;
let stepClock = 0;
let frame = 0;

function components(): Component[] {
  return shepardComponents(travelled);
}

function show(comps: Component[]) {
  scene.setComponents(comps);
  if (frame++ % 2 === 0) spectrum.set(comps);
  renderCounter();
}

function tick(now: number) {
  if (!playing) return;
  const state = store.get();
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  const dir = state.sens === 'monte' ? 1 : -1;
  const speed = SPEEDS[state.vitesse];
  if (state.mouvement === 'glissando') {
    travelled += dir * speed * dt;
    const comps = components();
    synth.update(comps);
    show(comps);
  } else {
    stepClock += dt;
    const interval = 100 / speed;
    if (stepClock >= interval) {
      stepClock -= interval;
      travelled += dir * 100;
      const comps = components();
      synth.update(comps, true);
      show(comps);
    }
  }
  raf = requestAnimationFrame(tick);
}

function start() {
  if (playing) return;
  stopParadox();
  playing = true;
  synth.start(components());
  els.play.textContent = 'Arrêter';
  lastFrame = performance.now();
  stepClock = 0;
  raf = requestAnimationFrame(tick);
}

function stop() {
  if (!playing) return;
  playing = false;
  cancelAnimationFrame(raf);
  synth.stop();
  els.play.textContent = 'Jouer';
  renderCounter();
}

els.play.addEventListener('click', () => (playing ? stop() : start()));
els.reset.addEventListener('click', () => {
  travelled = 0;
  const comps = components();
  if (playing) synth.update(comps);
  show(comps);
});

/* Compteur ------------------------------------------------------------------------ */

function renderCounter() {
  const c = counter(travelled);
  const at = pitchAt(travelled);
  const semis = Math.abs(c.semitones);
  const verb = c.semitones >= 0 ? 'monté' : 'descendu';
  els.result.innerHTML = `
    <p class="result-eyebrow">Depuis le départ, tu as ${verb}</p>
    <p class="result-figure"><strong>${fr(semis)}</strong> demi-ton${semis > 1 ? 's' : ''}</p>
    <p class="result-line">${c.turns === 0 ? 'Moins d’une octave.' : `${c.turns === 1 ? 'Une octave' : `${fr(c.turns)} octaves`}, ${c.semitones >= 0 ? 'au-dessus' : 'au-dessous'} du départ, à l’oreille.`}</p>
    <p class="result-line">En vrai : tu es sur <strong>${escapeHtml(at.name)}</strong>${at.offsetCents ? ` (${at.offsetCents > 0 ? '+' : '−'} ${fr(Math.abs(at.offsetCents))} cents)` : ''}, comme à chaque tour.</p>
    <p class="result-detail">Le son le plus fort est toujours vers do5 : ce qui monte s’éteint, ce qui naît est grave.</p>`;

  const comps = components();
  els.formula.textContent = comps
    .map((k) => `k = ${k.k} : ${k.hz.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Hz, amplitude ${k.amp.toFixed(2)}`)
    .join('\n');
}

/* Paradoxe du triton --------------------------------------------------------------- */

let paradoxTimer = 0;
let paradoxPair: [number, number] | null = null;

function stopParadox() {
  clearTimeout(paradoxTimer);
  if (!playing && synth.playing) synth.stop();
}

els.paradoxPlay.addEventListener('click', () => {
  stop();
  stopParadox();
  const p = Math.floor(Math.random() * 12) * 100;
  paradoxPair = [p, p + 600];
  els.paradoxStatus.textContent = 'Écoute…';
  els.paradoxUp.hidden = els.paradoxDown.hidden = true;
  synth.start(shepardComponents(p));
  const playSecond = () => {
    synth.update(shepardComponents(p + 600), true);
    paradoxTimer = window.setTimeout(() => {
      synth.stop();
      els.paradoxStatus.textContent = 'Alors, le second son : plus haut ou plus bas que le premier ?';
      els.paradoxUp.hidden = els.paradoxDown.hidden = false;
    }, 900);
  };
  paradoxTimer = window.setTimeout(playSecond, 900);
});

const answer = (heardUp: boolean) => {
  if (!paradoxPair) return;
  const from = pitchAt(paradoxPair[0]).name;
  const to = pitchAt(paradoxPair[1]).name;
  els.paradoxUp.hidden = els.paradoxDown.hidden = true;
  els.paradoxStatus.textContent = `Tu as entendu ${heardUp ? 'monter' : 'descendre'}, de ${from} à ${to}. Les deux sons sont pourtant à égale distance dans les deux sens : d’autres personnes, pour cette même paire, entendent l’inverse. Réécoute : la paire change à chaque fois.`;
};
els.paradoxUp.addEventListener('click', () => answer(true));
els.paradoxDown.addEventListener('click', () => answer(false));

/* Panneau ----------------------------------------------------------------------------- */

for (const key of ['sens', 'mouvement', 'vitesse', 'vue'] as const) {
  els[key].addEventListener('change', (e) => store.set({ [key]: (e.target as HTMLInputElement).value } as Partial<VizState>));
}

function render(state: VizState) {
  for (const key of ['sens', 'mouvement', 'vitesse', 'vue'] as const) {
    for (const input of els[key].querySelectorAll<HTMLInputElement>('input')) input.checked = input.value === state[key];
  }
  scene.setView(state.vue);
  els.sceneHint.textContent =
    state.vue === 'dessus'
      ? 'Vu de dessus : un cercle. Le son tourne, il ne monte pas.'
      : coarsePointer
        ? 'Deux doigts pour tourner autour de l’hélice.'
        : 'Glisse pour tourner autour de l’hélice.';
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
}

store.subscribe(render);

/* Partage --------------------------------------------------------------------------- */

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'la-gamme-qui-monte-sans-fin.png',
  render: () => {
    scene.renderOnce();
    return renderShareCard({ travelled, sceneCanvas: scene.canvas, siteUrl: location.host + location.pathname });
  },
  text: () => sharePhrase(travelled),
});

/* Mise en place --------------------------------------------------------------------- */

render(store.get());
show(components());
spectrum.set(components());
new ResizeObserver(() => {
  scene.resize();
  spectrum.resize();
}).observe(els.scene);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => scene.setTheme(readHelixTheme()));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stop();
    stopParadox();
  }
});
