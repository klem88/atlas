import { escapeHtml } from '@shell/html';
import { degreeLabel, progressionKey, type Degree } from '@shell/music/degrees';
import { equalFrequency } from '@shell/music/pitch';
import { Player, type Step } from '@shell/music/player';
import { Synth } from '@shell/music/synth';
import { voice } from '@shell/music/voicing';
import { mountShell } from '@shell/shell';
import { vizUrl } from '@shell/site';
import { createStore } from '@shell/store';
import { chordName } from '../compose-ta-progression/domain/next';
import { loadMeta, loadShard } from '../progression-jouee/data/load';
import { findProgression } from '../progression-jouee/domain/lookup';
import { chordByLabel, chordOfDegree, FN_LABELS, VIEWS, type View } from './domain/layout';
import { countableDegrees, degreesOf, LIBRARY, progressionById, type Progression } from './domain/library';
import { moveSentence } from './domain/moves';
import { KEY_NAMES, readStateFromUrl, stateToSearch, type VizState } from './state';
import { ChordMap } from './ui/map';
import './viz.css';

mountShell({ currentSlug: 'suis-les-fleches' });

const $ = <T extends HTMLElement>(id: string) => {
  const e = document.getElementById(id);
  if (!e) throw new Error(`#${id} introuvable`);
  return e as T;
};
const els = {
  tonic: $<HTMLSelectElement>('tonic'),
  views: $('views'),
  library: $('library'),
  about: $('about'),
  count: $('count'),
  play: $<HTMLButtonElement>('play'),
  prev: $<HTMLButtonElement>('prev'),
  next: $<HTMLButtonElement>('next'),
  sequence: $('sequence'),
  legend: $('legend'),
  map: document.getElementById('map') as unknown as SVGSVGElement,
};
const KEY_LABELS = ['do', 'ré♭', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
const fr = (n: number) => n.toLocaleString('fr-FR');

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const labelOf = (d: Degree) => chordOfDegree(d)?.label ?? degreeLabel(d);
const nameOfLabel = (label: string) => chordName(chordByLabel(label)!.degree, store.get().tonic);

const map = new ChordMap(els.map, store.get().view, {
  nameOf: nameOfLabel,
  onPick: pick,
  reducedMotion,
});

/* Lecture ------------------------------------------------------------------------------------------------ */

/** Où on en est dans la progression (pas à pas), et le dernier accord entendu (pour l'enchaînement des voix). */
let cursor = -1;
let lastVoicing: number[] | null = null;
let lastLabel: string | null = null;

const current = (): Progression => progressionById(store.get().progression)!;

function chordSentence(label: string): string {
  const c = chordByLabel(label)!;
  return `${nameOfLabel(label)} : le ${label}, ${c.label === 'I' ? 'la maison, ' : ''}zone « ${FN_LABELS[c.fn].name} » (${FN_LABELS[c.fn].learned}).`;
}

/** Fait entendre et montre un accord ; si on vient d'un autre, trace le pas et le raconte. */
function arrive(label: string, seconds: number, visited: ReadonlySet<string>, sound: boolean) {
  const d = chordByLabel(label)!.degree;
  if (sound) {
    lastVoicing = voice(d, store.get().tonic, lastVoicing);
    synth.play(lastVoicing.map((m) => equalFrequency(m)), Math.max(0.6, seconds * 0.95));
  }
  if (lastLabel && lastLabel !== label) {
    map.drawMove(lastLabel, label, seconds);
    els.legend.textContent = moveSentence(chordByLabel(lastLabel)!.degree, d, store.get().tonic);
  } else if (lastLabel === label) {
    els.legend.textContent = `${nameOfLabel(label)} : on reste sur le même accord.`;
  } else {
    els.legend.textContent = chordSentence(label);
  }
  map.setActive(label, visited);
  lastLabel = label;
}

function markSequence(index: number) {
  els.sequence.querySelectorAll('.seq-chord').forEach((s, i) => s.classList.toggle('is-current', i === index));
}

const player = new Player(synth, (step) => {
  if (!step) {
    els.play.textContent = 'Écouter';
    els.play.setAttribute('aria-pressed', 'false');
    return;
  }
  const { index, label } = step.tag as { index: number; label: string };
  const prog = current();
  // Chaque tour efface le chemin ; le pas qui referme la boucle (dernier → premier) reste dessiné.
  if (index === 0) map.clearTrail();
  cursor = index;
  // Le Player joue déjà le son : on ne fait que montrer.
  arrive(label, prog.seconds, new Set(prog.labels.slice(0, index + 1)), false);
  markSequence(index);
});

function startLoop() {
  const prog = current();
  lastLabel = null;
  const degrees = degreesOf(prog);
  const tonic = store.get().tonic;
  const reps = Math.max(2, Math.ceil(20 / (degrees.length * prog.seconds)));
  let prev: number[] | null = null;
  const steps: Step[] = [];
  for (let r = 0; r < reps; r++)
    degrees.forEach((d, index) => {
      const midis = voice(d, tonic, prev);
      prev = midis;
      steps.push({ midis, seconds: prog.seconds, tag: { index, label: prog.labels[index]! } });
    });
  player.play(steps);
  els.play.textContent = 'Arrêter';
  els.play.setAttribute('aria-pressed', 'true');
}

els.play.addEventListener('click', () => (player.playing ? player.stop() : startLoop()));

function stepBy(delta: number) {
  player.stop();
  const prog = current();
  const n = prog.labels.length;
  const nextIndex = cursor < 0 ? (delta > 0 ? 0 : n - 1) : (cursor + delta + n) % n;
  if (delta > 0 && nextIndex === 0) {
    // Un nouveau tour : on efface le chemin, mais le pas qui referme la boucle se dessine.
    map.clearTrail();
    if (cursor < 0) lastLabel = null;
  } else if (delta < 0) {
    // En arrière : on retrace le chemin jusqu'au pas précédent, sans le rejouer.
    map.clearTrail();
    for (let i = 0; i + 1 < nextIndex; i++) map.drawMove(prog.labels[i]!, prog.labels[i + 1]!, 0, false);
    lastLabel = nextIndex > 0 ? prog.labels[nextIndex - 1]! : null;
  }
  cursor = nextIndex;
  arrive(prog.labels[nextIndex]!, prog.seconds, new Set(prog.labels.slice(0, nextIndex + 1)), true);
  markSequence(nextIndex);
}
els.next.addEventListener('click', () => stepBy(1));
els.prev.addEventListener('click', () => stepBy(-1));

/** Toucher un accord de la carte : on l'entend, et le pas depuis le précédent se dessine (exploration libre). */
function pick(label: string) {
  if (player.playing) player.stop();
  cursor = -1;
  markSequence(-1);
  arrive(label, 0.9, new Set(), true);
}

/* Rendu ---------------------------------------------------------------------------------------------------- */

els.tonic.innerHTML = KEY_NAMES.map((k, i) => `<option value="${i}">${KEY_LABELS[i]} majeur (${k})</option>`).join('');
els.tonic.addEventListener('change', () => store.set({ tonic: Number(els.tonic.value) }));

const VIEW_LABELS: Record<View, string> = { cercle: 'Cercle', ligne: 'Ligne de quintes', grille: 'Grille' };
els.views.innerHTML = VIEWS.map((v) => `<label><input type="radio" name="view" value="${v}" />${VIEW_LABELS[v]}</label>`).join('');
els.views.addEventListener('change', (e) => store.set({ view: (e.target as HTMLInputElement).value as View }));

els.library.innerHTML = LIBRARY.map(
  (p) =>
    `<li><button class="prog" type="button" data-id="${p.id}"><span class="prog-name">${escapeHtml(p.name)}</span><span class="prog-degrees">${escapeHtml(p.labels.length > 8 ? `${[...new Set(p.labels)].join(' · ')}, ${p.labels.length} mesures` : p.labels.join(' – '))}</span></button></li>`,
).join('');
els.library.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-id]');
  if (!b) return;
  store.set({ progression: b.dataset.id! });
  startLoop();
});

function renderSequence(prog: Progression, tonic: number) {
  els.sequence.innerHTML = prog.labels
    .map((l) => {
      const d = chordByLabel(l)!.degree;
      return `<span class="seq-chord seq-chord--${chordByLabel(l)!.fn}"><span class="seq-name">${escapeHtml(chordName(d, tonic))}</span><span class="seq-degree">${escapeHtml(l)}</span></span>`;
    })
    .join('');
}

let countRequest = 0;
async function renderCount(prog: Progression, tonic: number) {
  const id = ++countRequest;
  const degrees = countableDegrees(prog);
  if (!degrees) {
    els.count.innerHTML = prog.id === 'blues' ? '<span class="detail">Douze mesures avec des répétitions : la grille n’est pas comptée dans les chansons (les comptes s’arrêtent à huit accords distincts).</span>' : '';
    return;
  }
  els.count.innerHTML = '<span class="count-wait">On compte les chansons…</span>';
  try {
    const [meta, shard] = await Promise.all([loadMeta(), loadShard(degrees.length)]);
    if (id !== countRequest) return;
    const found = findProgression(degrees, shard, meta);
    const link = `${vizUrl('progression-jouee')}?p=${progressionKey(degrees)}&t=${encodeURIComponent(KEY_NAMES[tonic]!)}`;
    els.count.innerHTML = found
      ? `Cette suite exacte apparaît dans <strong>${fr(found.total)}</strong> chansons sur ${fr(meta.corpus.songs)} tablatures. <a href="${link}">Le détail →</a>`
      : `Trop peu de chansons pour la compter (moins de ${degrees.length <= 4 ? 20 : 30}). <a href="${link}">Chercher quand même →</a>`;
  } catch (err) {
    console.error(err);
    if (id === countRequest) els.count.textContent = '';
  }
}

let shown: { progression: string; tonic: number; view: View } | null = null;
function render(state: VizState) {
  els.tonic.value = String(state.tonic);
  els.views.querySelectorAll('input').forEach((i) => (i.checked = i.value === state.view));
  els.library.querySelectorAll<HTMLButtonElement>('[data-id]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === state.progression)));
  const prog = current();
  if (!shown || shown.progression !== state.progression || shown.tonic !== state.tonic) {
    if (player.playing) player.stop();
    map.clearTrail();
    map.setActive(null, new Set(prog.labels));
    lastLabel = null;
    lastVoicing = null;
    cursor = -1;
    els.about.innerHTML = `<p class="about-name">${escapeHtml(prog.name)}</p><p class="about-blurb">${escapeHtml(prog.blurb)}</p>`;
    renderSequence(prog, state.tonic);
    els.legend.textContent = 'Écoute la progression, ou avance pas à pas pour voir chaque flèche.';
    void renderCount(prog, state.tonic);
  }
  if (!shown || shown.tonic !== state.tonic) map.renameAll();
  if (!shown || shown.view !== state.view) map.setView(state.view);
  shown = { ...state };
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}${location.hash}`);
}
store.subscribe(render);
render(store.get());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) player.stop();
});
