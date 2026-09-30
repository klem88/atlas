import { escapeHtml } from '@shell/html';
import { equalFrequency, intervalName, noteName } from '@shell/music/pitch';
import { Synth, type Held } from '@shell/music/synth';
import { setupShareDialog } from '@shell/share';
import { mountShell } from '@shell/shell';
import { createStore } from '@shell/store';
import { findValleys, nearestRatio, roughness, roughnessCurve, type CurvePoint, type Valley } from './domain/roughness';
import { clampCents, readStateFromUrl, stateToSearch, type VizState } from './state';
import { createLandscape } from './ui/landscape';
import { renderShareCard, SHARE_PHRASE } from './ui/share-card';
import './viz.css';

mountShell({ currentSlug: 'consonance' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};

const els = {
  cents: $<HTMLInputElement>('cents'),
  result: $('result'),
  listen: $<HTMLButtonElement>('listen'),
  harmonics: $('harmonics'),
  root: $('root'),
  presets: $('presets'),
  landscape: document.getElementById('landscape') as unknown as SVGSVGElement,
  formula: $('formula'),
  shareButton: $<HTMLButtonElement>('share-button'),
  shareDialog: $<HTMLDialogElement>('share-dialog'),
};

const PRESETS: { label: string; cents: number }[] = [
  { label: 'Tierce pure (5/4)', cents: 386 },
  { label: 'Tierce du piano', cents: 400 },
  { label: 'Quinte', cents: 702 },
  { label: 'Triton', cents: 600 },
  { label: 'Seconde', cents: 200 },
  { label: 'Octave', cents: 1200 },
];

const fr = (n: number, digits = 0) => n.toLocaleString('fr-FR', { maximumFractionDigits: digits });
const store = createStore<VizState>(readStateFromUrl(location.search));
const synth = new Synth();

/* Modèle dérivé (recalculé quand le timbre ou la grave change) ---------------- */

let curve: CurvePoint[] = [];
let valleys: Valley[] = [];
let curveKey = '';

function ensureCurve(state: VizState) {
  const key = `${state.root}-${state.harmonics}`;
  if (key === curveKey) return;
  curveKey = key;
  curve = roughnessCurve(equalFrequency(state.root), state.harmonics);
  valleys = findValleys(curve);
  landscape.setCurve(curve, valleys, state.root);
}

const frequencies = (state: VizState) => [equalFrequency(state.root), equalFrequency(state.root) * 2 ** (state.cents / 1200)];

/* Son tenu ------------------------------------------------------------------ */

let held: Held | null = null;

function startSound() {
  const state = store.get();
  held = synth.hold(frequencies(state), state.harmonics);
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

/* Paysage et curseur ----------------------------------------------------------- */

const landscape = createLandscape(els.landscape, (cents) => store.set({ cents: clampCents(cents) }));

els.cents.addEventListener('input', () => store.set({ cents: clampCents(Number(els.cents.value)) }));
els.harmonics.addEventListener('change', (e) => {
  const h = Number((e.target as HTMLInputElement).value) as VizState['harmonics'];
  store.set({ harmonics: h });
  // Le timbre du son tenu change : on le relance avec le bon nombre d'harmoniques.
  if (held) startSound();
});
els.root.addEventListener('change', (e) => store.set({ root: Number((e.target as HTMLInputElement).value) as VizState['root'] }));

els.presets.innerHTML = PRESETS.map((p, i) => `<button class="chip" type="button" data-preset="${i}" aria-pressed="false">${escapeHtml(p.label)}</button>`).join('');
els.presets.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-preset]');
  if (b) store.set({ cents: PRESETS[Number(b.dataset.preset)]!.cents });
});

/* Résultat ------------------------------------------------------------------- */

function renderResult(state: VizState) {
  const { cents, root } = state;
  const value = curve[cents]?.value ?? 0;
  const max = Math.max(...curve.filter((p) => p.cents <= 1200).map((p) => p.value));
  const relative = max > 0 ? value / max : 0;
  const semis = Math.round(cents / 100);
  const offPiano = cents - semis * 100;
  const pianoNote = noteName(root + semis);
  const ratio = nearestRatio(cents, 60);
  const valley = valleys.find((v) => v.ratio && ratio && v.ratio.label === ratio.label);
  const [f1, f2] = frequencies(state) as [number, number];

  let where: string;
  if (valley && Math.abs(valley.cents - cents) <= 3) where = `Tu es <strong>au fond de la vallée</strong> de la ${escapeHtml(valley.ratio!.label)} (${valley.ratio!.num}/${valley.ratio!.den}).`;
  else if (valley) where = `La vallée de la ${escapeHtml(valley.ratio!.label)} (${valley.ratio!.num}/${valley.ratio!.den}) est à <strong>${fr(Math.abs(valley.cents - cents))} cents</strong> ${valley.cents > cents ? 'à droite' : 'à gauche'}.`;
  else if (state.harmonics === 1) where = `Sans harmoniques, <strong>pas de vallée</strong> : rien ne distingue cet intervalle de ses voisins.`;
  else where = `Aucune vallée à moins de 60 cents : c’est un <strong>versant</strong>.`;

  const roughLabel = relative < 0.08 ? 'presque lisse' : relative < 0.3 ? 'douce' : relative < 0.6 ? 'rugueuse' : 'très rugueuse';
  els.result.innerHTML = `
    <p class="result-eyebrow">${fr(cents)} cents · ${escapeHtml(noteName(root))} et ${fr(f2, 1)} Hz</p>
    <p class="result-figure">${escapeHtml(semis === 0 && offPiano === 0 ? 'unisson' : intervalName(semis))}${offPiano !== 0 ? ` <span class="result-detail">${offPiano > 0 ? '+' : '−'}${fr(Math.abs(offPiano))} cents</span>` : ''}</p>
    <p class="result-detail">${offPiano === 0 ? `exactement la note ${escapeHtml(pianoNote)} du piano` : `à ${fr(Math.abs(offPiano))} cents ${offPiano > 0 ? 'au-dessus' : 'au-dessous'} de ${escapeHtml(pianoNote)}`}</p>
    <p class="result-line">${where}</p>
    <p class="result-detail">Rugosité : ${escapeHtml(roughLabel)} (${fr(relative * 100)} % du maximum du paysage).</p>
    <p class="result-detail detail">${fr(f1, 1)} Hz et ${fr(f2, 1)} Hz, ${state.harmonics} harmonique${state.harmonics > 1 ? 's' : ''} chacune.</p>`;

  els.formula.textContent = [
    `note grave : ${noteName(root)} = ${fr(f1, 2)} Hz   note aiguë : ${fr(f1, 2)} × 2^(${cents}/1200) = ${fr(f2, 2)} Hz`,
    `rugosité totale (somme sur ${state.harmonics} × ${state.harmonics} paires de partiels) : ${roughness(f1, 2 ** (cents / 1200), state.harmonics).toFixed(4)}`,
    `maximum du paysage : ${max.toFixed(4)}   part : ${fr(relative * 100, 1)} %`,
  ].join('\n');
}

/* Rendu global --------------------------------------------------------------------- */

function render(state: VizState) {
  ensureCurve(state);
  landscape.setCursor(state.cents);
  if (String(state.cents) !== els.cents.value) els.cents.value = String(state.cents);
  for (const input of els.harmonics.querySelectorAll<HTMLInputElement>('input')) input.checked = Number(input.value) === state.harmonics;
  for (const input of els.root.querySelectorAll<HTMLInputElement>('input')) input.checked = Number(input.value) === state.root;
  els.presets.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((b, i) => b.setAttribute('aria-pressed', String(PRESETS[i]!.cents === state.cents)));
  renderResult(state);
  held?.setFrequencies(frequencies(state));
  history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
}

store.subscribe(render);

/* Partage --------------------------------------------------------------------------- */

setupShareDialog({
  button: els.shareButton,
  dialog: els.shareDialog,
  fileName: 'pourquoi-une-tierce-sonne-douce.png',
  render: () => renderShareCard({ state: store.get(), curve, valleys, siteUrl: location.host + location.pathname }),
  text: () => `${fr(store.get().cents)} cents entre deux notes. ${SHARE_PHRASE}`,
});

/* Mise en place ---------------------------------------------------------------------- */

render(store.get());
new ResizeObserver(() => landscape.resize()).observe(els.landscape);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSound();
});
