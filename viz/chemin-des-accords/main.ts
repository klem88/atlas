import { escapeHtml } from '@shell/html';
import { equalFrequency } from '@shell/music/pitch';
import { Synth } from '@shell/music/synth';
import { voice } from '@shell/music/voicing';
import { mountShell } from '@shell/shell';
import { createStore } from '@shell/store';
import { KEY_NAMES } from '../compose-ta-progression/state';
import { loadShard } from '../progression-jouee/data/load';
import { chordId, keyName, nameOf, type Chord } from '../suis-les-fleches/domain/harmony';
import { moveSentence, roleText } from '../suis-les-fleches/domain/moves';
import { ringRotation } from './domain/geometry';
import { candidates, type Candidate, type Rows } from './domain/halos';
import { journeyOf, type Journey } from './domain/journey';
import { pct, whereText } from './domain/notes';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { ChordMap } from './ui/map';
import './viz.css';

mountShell({ currentSlug: 'chemin-des-accords' });

const $ = <T extends HTMLElement>(id: string) => {
  const e = document.getElementById(id);
  if (!e) throw new Error(`#${id} introuvable`);
  return e as T;
};
const els = {
  home: $<HTMLSelectElement>('home'),
  whereKey: $('where-key'),
  whereSub: $('where-sub'),
  step: $('step'),
  next: $('next'),
  note: $('note'),
  undo: $<HTMLButtonElement>('undo'),
  listen: $<HTMLButtonElement>('listen'),
  restart: $<HTMLButtonElement>('restart'),
  ribbon: $('ribbon'),
  map: document.getElementById('map') as unknown as SVGSVGElement,
};

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let rows: Rows = {};
let shardState: 'chargement' | 'pret' | 'echec' = 'chargement';
let lastVoicing: number[] | null = null;
let rotation = 0;
let rotationKey = store.get().home;
/** Part du corpus du dernier pas posé (pour la légende « pas rare »). */
let lastShare: number | null = null;

const map = new ChordMap(els.map, {
  onPick: (c) => pick(c),
  onHover: (c) => hover(c),
  reducedMotion,
});

/** Survol d'un candidat (souris) : sa flèche se dessine et le panneau raconte le pas à venir. */
function hover(c: Chord | null) {
  map.preview(c);
  const { home, path } = store.get();
  const j = journeyOf(home, path);
  const last = j.steps[j.steps.length - 1];
  if (c && last && chordId(c) !== chordId(last.chord)) els.step.textContent = `Si tu joues ${nameOf(c)} — ${moveSentence(last.chord, c, j.key)}`;
  else render();
}

els.home.innerHTML = KEY_NAMES.map((_, t) => `<option value="${t}">${escapeHtml(keyName(t))}</option>`).join('');

function sound(c: Chord) {
  lastVoicing = voice({ step: c.root, cls: c.cls }, 0, lastVoicing);
  synth.play(lastVoicing.map((m) => equalFrequency(m)), 1.2);
}

/** Les derniers accords joués dans la tonalité du moment (au plus cinq). */
function trailOf(j: Journey): Chord[] {
  const out: Chord[] = [];
  for (let i = j.steps.length - 1; i >= 0 && out.length < 5 && j.steps[i]!.key === j.key; i--) out.unshift(j.steps[i]!.chord);
  return out;
}

/** Dessine le chemin jusqu'au pas `n` (tout le chemin par défaut ; l'écoute rejoue pas à pas). */
function render(n = store.get().path.length) {
  const { home, path } = store.get();
  const j = journeyOf(home, path.slice(0, n));
  const last = j.steps[j.steps.length - 1]?.chord ?? null;
  const cands = candidates(last, j.key, rows);
  rotation = ringRotation(rotation, rotationKey, j.key);
  rotationKey = j.key;
  map.render({ key: j.key, home, leaning: j.leaning, rotation, current: last, candidates: cands, trail: trailOf(j) });
  renderPanel(j, cands);
}

function renderPanel(j: Journey, cands: Candidate[]) {
  els.home.value = String(j.home);
  els.whereKey.textContent = keyName(j.key);
  els.whereSub.textContent = whereText(j);
  const n = j.steps.length;
  const last = j.steps[n - 1];
  const before = j.steps[n - 2];
  els.step.textContent = !last ? 'Rien encore : choisis un premier accord.' : before ? moveSentence(before.chord, last.chord, last.key) : `${nameOf(last.chord)} : ${roleText(last.chord, last.key)}.`;
  const top = cands.filter((c) => c.share !== null && c.share > 0).sort((a, b) => b.share! - a.share!).slice(0, 4);
  els.next.textContent = !last
    ? 'Partout : depuis la maison, tout est possible.'
    : shardState === 'chargement'
      ? 'Chargement des parts des chansons…'
      : shardState === 'echec'
        ? 'Les parts des chansons n’ont pas pu être chargées ; la carte reste jouable.'
        : top.length
          ? top.map((c) => `${nameOf(c.chord)} ${pct(c.share!)}`).join(' · ')
          : 'Trop peu de chansons pour le dire.';
  els.undo.disabled = n === 0;
  els.restart.disabled = n === 0;
}

function pick(c: Chord) {
  const { home, path } = store.get();
  const j = journeyOf(home, path);
  const last = j.steps[j.steps.length - 1]?.chord ?? null;
  lastShare = last ? (candidates(last, j.key, rows).find((x) => chordId(x.chord) === chordId(c))?.share ?? 0) : null;
  sound(c);
  store.set({ path: [...path, c] });
}

els.undo.addEventListener('click', () => {
  lastShare = null;
  store.set({ path: store.get().path.slice(0, -1) });
});
els.restart.addEventListener('click', () => {
  lastShare = null;
  lastVoicing = null;
  store.set({ path: [] });
});
els.home.addEventListener('change', () => {
  lastShare = null;
  store.set({ home: Number(els.home.value), path: [] });
});

store.subscribe(() => {
  history.replaceState(null, '', `${location.pathname}${stateToSearch(store.get())}${location.hash}`);
  render();
});

render();
loadShard(2)
  .then((s) => {
    rows = s.rows;
    shardState = 'pret';
    render();
  })
  .catch(() => {
    shardState = 'echec';
    render();
  });

// Servi par la tâche 9 (légende « pas rare ») ; retiré à ce moment-là.
void lastShare;
