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
import { noteFor, pct, RIBBON_TIP, RING_TIP, whereText, type NoteKind } from './domain/notes';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { ChordMap } from './ui/map';
import { renderRibbon } from './ui/ribbon';
import { mountTips } from './ui/tip';
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
/** Légendes d'apprentissage déjà vues pendant cette visite. */
const seen = new Set<NoteKind>();
let noteKey = '';
let noteText = '';
/** Identifiant du minuteur de l'écoute en cours (null hors écoute). */
let playing: number | null = null;

const map = new ChordMap(els.map, {
  onPick: (c) => pick(c),
  onHover: (c) => hover(c),
  reducedMotion,
});

/** Survol d'un candidat (souris) : sa flèche se dessine et le panneau raconte le pas à venir. */
function hover(c: Chord | null) {
  map.preview(c);
  if (playing !== null) return; // pendant l'écoute, ni le panneau ni la carte ne reviennent au chemin complet
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
  renderRibbon(els.ribbon, j);
  renderPanel(j, cands);
  // La légende ne parle que du chemin complet : pendant l'écoute, on la vide.
  if (n === path.length) {
    // Un nouveau rendu du même état (survol, chargement des parts) garde la légende affichée, même « une seule fois ».
    const satellites = cands.filter((c) => c.satellite).length;
    const key = `${home}|${path.map(chordId).join(',')}|${satellites}`;
    if (key !== noteKey) {
      noteKey = key;
      const note = noteFor(j, { share: lastShare, satellites, seen });
      noteText = note?.text ?? '';
      if (note?.once) seen.add(note.kind);
    }
    els.note.textContent = noteText;
  } else els.note.textContent = '';
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
  els.listen.disabled = store.get().path.length === 0;
}

/* Écouter : rejoue le chemin pas à pas ; la carte rebascule à chaque modulation. */
const STEP_MS = 900;

function stopListening() {
  if (playing !== null) clearTimeout(playing);
  playing = null;
  els.listen.textContent = '▶ Écouter';
  render();
}

function listen() {
  const { path } = store.get();
  if (!path.length) return;
  lastVoicing = null;
  els.listen.textContent = '■ Arrêter';
  // La rotation de l'anneau n'est pas remise à zéro : `ringRotation` le ramène vers la maison par le plus court chemin.
  const step = (i: number) => {
    if (i > path.length) return stopListening();
    render(i);
    sound(path[i - 1]!);
    playing = window.setTimeout(() => step(i + 1), STEP_MS);
  };
  step(1);
}

function pick(c: Chord) {
  // Toucher un accord pendant l'écoute l'arrête seulement, sans l'ajouter au chemin.
  if (playing !== null) {
    stopListening();
    return;
  }
  const { home, path } = store.get();
  const j = journeyOf(home, path);
  const last = j.steps[j.steps.length - 1]?.chord ?? null;
  lastShare = last ? (candidates(last, j.key, rows).find((x) => chordId(x.chord) === chordId(c))?.share ?? 0) : null;
  sound(c);
  store.set({ path: [...path, c] });
}

els.undo.addEventListener('click', () => {
  if (playing !== null) stopListening();
  lastShare = null;
  store.set({ path: store.get().path.slice(0, -1) });
});
els.restart.addEventListener('click', () => {
  if (playing !== null) stopListening();
  lastShare = null;
  lastVoicing = null;
  store.set({ path: [] });
});
els.home.addEventListener('change', () => {
  if (playing !== null) stopListening();
  lastShare = null;
  store.set({ home: Number(els.home.value), path: [] });
});

els.listen.addEventListener('click', () => (playing !== null ? stopListening() : listen()));

store.subscribe(() => {
  history.replaceState(null, '', `${location.pathname}${stateToSearch(store.get())}${location.hash}`);
  render();
});

document.querySelector<HTMLElement>('.tip-q--ring')!.dataset.tip = RING_TIP;
document.querySelector<HTMLElement>('.ribbon-head .tip-q')!.dataset.tip = RIBBON_TIP;
mountTips(document.querySelector('.viz-stage') as HTMLElement);

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
