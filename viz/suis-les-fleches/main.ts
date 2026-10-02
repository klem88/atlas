import { escapeHtml } from '@shell/html';
import { progressionKey } from '@shell/music/degrees';
import { equalFrequency } from '@shell/music/pitch';
import { Player, type Step } from '@shell/music/player';
import { Synth } from '@shell/music/synth';
import { voice } from '@shell/music/voicing';
import { mountShell } from '@shell/shell';
import { vizUrl } from '@shell/site';
import { createStore } from '@shell/store';
import { loadMeta, loadShard } from '../progression-jouee/data/load';
import { findProgression } from '../progression-jouee/domain/lookup';
import { chordId, doorsOf, keyName, mod12, modulationSentence, nameOf, roleOf, sameChord, type Chord } from './domain/harmony';
import { VIEWS, type View } from './domain/layout';
import { countableDegrees, FAMILY_LABELS, LIBRARY, progressionById, stepsOf, type Family, type PlayStep, type Progression } from './domain/library';
import { moveSentence, roleText } from './domain/moves';
import { sceneOf } from './domain/scene';
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
  trip: $('trip'),
  sequence: $('sequence'),
  legend: $('legend'),
  doors: $('doors'),
  mapScroll: $('map-scroll'),
  map: document.getElementById('map') as unknown as SVGSVGElement,
};
const KEY_LABELS = ['do', 'ré♭', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
const fr = (n: number) => n.toLocaleString('fr-FR');

const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* État d'exploration (hors URL) ------------------------------------------------------------------------- */

/** Le trajet : les tonalités traversées depuis la maison (la première). */
let trip: number[] = [store.get().tonic];
/** La tonalité d'où la progression choisie se lit (elle peut moduler en chemin). */
let progStart = store.get().tonic;
/** L'accord touché : ses voisins et ses portes éclosent ; `null` pendant l'écoute. */
let focus: Chord | null = null;
/** Le dernier accord entendu (d'où part la prochaine flèche) et sa voix (pour l'enchaînement doux). */
let lastChord: Chord | null = null;
let lastVoicing: number[] | null = null;
/** Le pas de la progression où l'on est (pas à pas), ou −1. */
let cursor = -1;
/** Vrai pendant qu'une modulation demandée par la page change la tonalité (ce n'est pas un changement de maison). */
let modulating = false;

const current = (): Progression => progressionById(store.get().progression)!;
const steps = (): PlayStep[] => stepsOf(current(), progStart);

/* La carte ------------------------------------------------------------------------------------------------ */

const map = new ChordMap(els.map, {
  onPick: (node) => node.chord && pick(node.chord),
  onDoor: (tonic) => goThroughDoor(tonic),
  reducedMotion,
});

/** Les accords de la progression lus dans la tonalité du moment, pour qu'ils paraissent même hors de la gamme. */
const extras = (tonic: number): Chord[] => steps().filter((s) => s.key === tonic).map((s) => s.chord);

function draw(animate: boolean) {
  const { view, tonic } = store.get();
  map.render(sceneOf({ view, tonic, extras: extras(tonic), focus }), animate);
  const visited = new Set(steps().filter((s) => s.key === tonic).map((s) => chordId(s.chord)));
  map.setActive(lastChord ? chordId(lastChord) : null, visited);
  if (view === 'bande') {
    // Sur un écran étroit, la bande défile : on la recentre sur la fenêtre de la tonalité.
    const sc = els.mapScroll;
    sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
  }
  renderDoors();
}

/* Son et pas --------------------------------------------------------------------------------------------- */

function sound(c: Chord, seconds: number) {
  lastVoicing = voice({ step: c.root, cls: c.cls }, 0, lastVoicing);
  synth.play(lastVoicing.map((m) => equalFrequency(m)), Math.max(0.6, seconds * 0.95));
}

/** Arrive sur un accord : on l'allume, on trace le pas depuis le précédent, on le raconte (`prefix` : une modulation). */
function arrive(c: Chord, seconds: number, opts: { play: boolean; prefix?: string | undefined }) {
  const { tonic } = store.get();
  if (opts.play) sound(c, seconds);
  draw(true);
  let text: string;
  if (lastChord && !sameChord(lastChord, c)) {
    map.drawMove(chordId(lastChord), chordId(c), seconds);
    text = moveSentence(lastChord, c, tonic);
  } else if (lastChord) text = `${nameOf(c)} : on reste sur le même accord.`;
  else text = `${nameOf(c)} : ${roleText(c, tonic)}.`;
  lastChord = c;
  const visited = new Set(steps().filter((s) => s.key === tonic).map((s) => chordId(s.chord)));
  map.setActive(chordId(c), visited);
  els.legend.textContent = opts.prefix ? `${opts.prefix} ${text}` : text;
}

/** Change de tonalité depuis la page (porte, progression qui module, retour) ; renvoie la phrase qui l'explique. */
function modulate(to: number, pivot: Chord | null): string {
  const from = store.get().tonic;
  to = mod12(to);
  if (to === from) return '';
  const sentence = modulationSentence(from, to, pivot);
  const i = trip.indexOf(to);
  trip = i >= 0 ? trip.slice(0, i + 1) : [...trip, to];
  map.clearTrail();
  modulating = true;
  store.set({ tonic: to });
  modulating = false;
  return sentence;
}

/** Passer une porte : on change de tonalité, et on se pose sur sa tonique (on l'entend). */
function goThroughDoor(to: number) {
  if (player.playing) player.stop();
  const pivot = focus ?? lastChord;
  const sentence = modulate(to, pivot);
  // Après une porte, la progression choisie se lit dans la nouvelle tonalité.
  progStart = mod12(to);
  renderSequence();
  void renderCount(current(), progStart);
  cursor = -1;
  markSequence(-1);
  const home: Chord = { root: mod12(to), cls: 'maj' };
  focus = home;
  arrive(home, 0.9, { play: true, prefix: sentence });
}

/** Toucher un accord : on l'entend, ses voisins et ses portes éclosent, le pas depuis le précédent se dessine. */
function pick(c: Chord) {
  if (player.playing) player.stop();
  cursor = -1;
  markSequence(-1);
  focus = c;
  arrive(c, 0.9, { play: true });
}

function renderDoors() {
  const { tonic } = store.get();
  if (!focus) {
    els.doors.innerHTML = '';
    return;
  }
  const doors = doorsOf(focus, tonic, 3);
  els.doors.innerHTML = doors.length
    ? `<span class="doors-label">${escapeHtml(nameOf(focus))} est aussi dans :</span>${doors
        .map((d) => `<button class="door" type="button" data-key="${d.tonic}"><span class="door-key">${escapeHtml(keyName(d.tonic))}</span><span class="door-role">${escapeHtml(nameOf(focus!))} y est ${escapeHtml(d.role.label)}</span></button>`)
        .join('')}`
    : `<span class="doors-label">${escapeHtml(nameOf(focus))} n’est dans aucune tonalité majeure : c’est un accord de passage.</span>`;
}
els.doors.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-key]');
  if (b) goThroughDoor(Number(b.dataset.key));
});

/* Lecture ------------------------------------------------------------------------------------------------ */

function markSequence(index: number) {
  els.sequence.querySelectorAll('.seq-chord').forEach((s, i) => s.classList.toggle('is-current', i === index));
}

const player = new Player(synth, (step) => {
  if (!step) {
    els.play.textContent = 'Écouter';
    els.play.setAttribute('aria-pressed', 'false');
    return;
  }
  const { index, s } = step.tag as { index: number; s: PlayStep };
  const prog = current();
  let prefix = '';
  if (index === 0) {
    // Chaque tour repart de la tonalité de départ ; le pas qui referme la boucle reste dessiné.
    prefix = modulate(s.key, null);
    map.clearTrail();
  } else if (s.key !== store.get().tonic) prefix = modulate(s.key, lastChord);
  cursor = index;
  arrive(s.chord, prog.seconds, { play: false, prefix });
  markSequence(index);
});

function startLoop() {
  const prog = current();
  focus = null;
  // La progression se joue depuis la tonalité du moment ; chaque tour y revient.
  progStart = store.get().tonic;
  renderSequence();
  const list = steps();
  const reps = Math.max(2, Math.ceil(20 / (list.length * prog.seconds)));
  let prev: number[] | null = null;
  const out: Step[] = [];
  for (let r = 0; r < reps; r++)
    list.forEach((s, index) => {
      const midis = voice({ step: s.chord.root, cls: s.chord.cls }, 0, prev);
      prev = midis;
      out.push({ midis, seconds: prog.seconds, tag: { index, s } });
    });
  lastChord = null;
  player.play(out);
  els.play.textContent = 'Arrêter';
  els.play.setAttribute('aria-pressed', 'true');
}
els.play.addEventListener('click', () => (player.playing ? player.stop() : startLoop()));

function stepBy(delta: number) {
  player.stop();
  const list = steps();
  const n = list.length;
  const nextIndex = cursor < 0 ? (delta > 0 ? 0 : n - 1) : (cursor + delta + n) % n;
  const s = list[nextIndex]!;
  if (delta > 0 && nextIndex === 0) {
    map.clearTrail();
    if (cursor < 0) lastChord = null;
  } else if (delta < 0) {
    map.clearTrail();
    lastChord = nextIndex > 0 && list[nextIndex - 1]!.key === s.key ? list[nextIndex - 1]!.chord : null;
  }
  const prefix = s.key !== store.get().tonic ? modulate(s.key, lastChord) : '';
  cursor = nextIndex;
  focus = s.chord;
  arrive(s.chord, current().seconds, { play: true, prefix });
  markSequence(nextIndex);
}
els.next.addEventListener('click', () => stepBy(1));
els.prev.addEventListener('click', () => stepBy(-1));

/* Panneau ----------------------------------------------------------------------------------------------- */

els.tonic.innerHTML = KEY_NAMES.map((k, i) => `<option value="${i}">${KEY_LABELS[i]} majeur (${k})</option>`).join('');
els.tonic.addEventListener('change', () => store.set({ tonic: Number(els.tonic.value) }));

const VIEW_LABELS: Record<View, string> = { cercle: 'Cercle', grille: 'Grille', bande: 'Bande des quintes' };
els.views.innerHTML = VIEWS.map((v) => `<label><input type="radio" name="view" value="${v}" />${VIEW_LABELS[v]}</label>`).join('');
els.views.addEventListener('change', (e) => store.set({ view: (e.target as HTMLInputElement).value as View }));

const FAMILIES: Family[] = ['gamme', 'voisins', 'modulation'];
els.library.innerHTML = FAMILIES.map(
  (f) =>
    `<li class="library-family"><h3 class="library-family-name">${escapeHtml(FAMILY_LABELS[f])}</h3><ul>${LIBRARY.filter((p) => p.family === f)
      .map(
        (p) =>
          `<li><button class="prog" type="button" data-id="${p.id}"><span class="prog-name">${escapeHtml(p.name)}</span><span class="prog-degrees">${escapeHtml(p.labels.length > 8 ? `${[...new Set(p.labels)].join(' · ')}, ${p.labels.length} mesures` : p.labels.join(' – '))}</span></button></li>`,
      )
      .join('')}</ul></li>`,
).join('');
els.library.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-id]');
  if (!b) return;
  store.set({ progression: b.dataset.id! });
  startLoop();
});

function renderSequence() {
  const { tonic } = store.get();
  const list = steps();
  els.sequence.innerHTML = list
    .map((s, i) => {
      const role = roleOf(s.chord, s.key);
      const change = i > 0 && list[i - 1]!.key !== s.key ? `<span class="seq-key" title="On passe en ${escapeHtml(keyName(s.key))}">→ ${escapeHtml(keyName(s.key))}</span>` : '';
      return `${change}<span class="seq-chord seq-chord--${role.kind}${role.fn ? ` seq-chord--${role.fn}` : ''}${s.key !== tonic ? ' is-elsewhere' : ''}"><span class="seq-name">${escapeHtml(nameOf(s.chord))}</span><span class="seq-degree">${escapeHtml(role.label)}</span></span>`;
    })
    .join('');
  markSequence(cursor);
}

function renderTrip() {
  const { tonic } = store.get();
  const home = trip[0]!;
  els.trip.innerHTML =
    trip.length > 1
      ? `<span class="trip-path">${trip.map((t, i) => `<span class="trip-key${i === trip.length - 1 ? ' is-here' : ''}">${escapeHtml(keyName(t))}</span>`).join('<span class="trip-sep" aria-hidden="true">→</span>')}</span><button class="button button--ghost trip-home" type="button" id="home">Rentrer en ${escapeHtml(keyName(home))}</button>`
      : `<span class="trip-path"><span class="trip-key is-here">${escapeHtml(keyName(tonic))}</span><span class="trip-hint">la maison</span></span>`;
}
els.trip.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('#home')) goThroughDoor(trip[0]!);
});

let countRequest = 0;
async function renderCount(prog: Progression, tonic: number) {
  const id = ++countRequest;
  const degrees = countableDegrees(prog);
  if (!degrees) {
    els.count.innerHTML = prog.modulations
      ? '<span class="detail">Elle change de tonalité : les comptes des chansons, lus dans une seule tonalité, ne la voient pas.</span>'
      : prog.id === 'blues'
        ? '<span class="detail">Douze mesures avec des répétitions : la grille n’est pas comptée dans les chansons (les comptes s’arrêtent à huit accords distincts).</span>'
        : '';
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
      : `Trop peu de chansons pour la compter. <a href="${link}">Chercher quand même →</a>`;
  } catch (err) {
    console.error(err);
    if (id === countRequest) els.count.textContent = '';
  }
}

/* Rendu ---------------------------------------------------------------------------------------------------- */

let shown: VizState | null = null;
function render(state: VizState) {
  els.tonic.value = String(trip[0]);
  els.views.querySelectorAll('input').forEach((i) => (i.checked = i.value === state.view));
  els.library.querySelectorAll<HTMLButtonElement>('[data-id]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === state.progression)));
  const prog = current();
  const progressionChanged = !shown || shown.progression !== state.progression;
  const tonicChanged = !shown || shown.tonic !== state.tonic;
  if (tonicChanged && !modulating) {
    // Nouvelle maison choisie dans le panneau : le trajet repart d'elle.
    if (player.playing) player.stop();
    trip = [state.tonic];
    progStart = state.tonic;
    map.clearTrail();
    lastChord = null;
    lastVoicing = null;
    focus = null;
    cursor = -1;
    els.tonic.value = String(state.tonic);
  }
  if (progressionChanged) {
    if (player.playing) player.stop();
    map.clearTrail();
    focus = null;
    lastChord = null;
    lastVoicing = null;
    cursor = -1;
    progStart = state.tonic;
    els.about.innerHTML = `<p class="about-name">${escapeHtml(prog.name)}</p><p class="about-blurb">${escapeHtml(prog.blurb)}</p>`;
    els.legend.textContent = 'Écoute la progression, avance pas à pas, ou touche un accord pour voir ses voisins et ses portes.';
  }
  if (progressionChanged || (tonicChanged && !modulating)) void renderCount(prog, progStart);
  renderSequence();
  renderTrip();
  if (!shown || progressionChanged || tonicChanged || shown.view !== state.view) draw(!!shown);
  shown = { ...state };
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}${location.hash}`);
}
store.subscribe(render);
render(store.get());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) player.stop();
});
