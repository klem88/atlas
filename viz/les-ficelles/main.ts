import { escapeHtml } from '@shell/html';
import { Player, type Step } from '@shell/music/player';
import { realiser, type Voix } from '@shell/music/realisation';
import { Synth } from '@shell/music/synth';
import { mountShell } from '@shell/shell';
import { createStore } from '@shell/store';
import { ecouteUrl, signaturesDe } from './data/signatures';
import { FICELLES, ficelle, type FicelleId } from './domain/ficelles';
import { accordDuDegre, basseDe, cliche, decouper, LABELS, lireAccord, MAX_DEPART, MIN_DEPART, notesDe, transposer, type Accord, type Grille } from './domain/grille';
import { nomAccord } from './domain/orthographe';
import { rejouer, retirer } from './domain/pile';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { dessinerPortee } from './ui/portee';
import './viz.css';

mountShell({ currentSlug: 'les-ficelles' });

const $ = <T extends HTMLElement>(id: string): T => {
  const e = document.getElementById(id);
  if (!e) throw new Error(`#${id} introuvable`);
  return e as T;
};
const els = {
  home: $<HTMLSelectElement>('home'),
  degres: $('degres'),
  saisie: $<HTMLFormElement>('saisie'),
  saisieTexte: $<HTMLInputElement>('saisie-texte'),
  saisieErreur: $('saisie-erreur'),
  cliche: $<HTMLButtonElement>('cliche'),
  effacer: $<HTMLButtonElement>('effacer'),
  resultat: $('resultat'),
  copier: $<HTMLButtonElement>('copier'),
  consigne: $('consigne'),
  portee: $('portee'),
  apercu: $('apercu'),
  apercuTexte: $('apercu-texte'),
  garder: $<HTMLButtonElement>('garder'),
  annuler: $<HTMLButtonElement>('annuler'),
  pile: $('pile'),
  message: $('message'),
  cartes: $('cartes'),
  ecouter: $<HTMLButtonElement>('ecouter'),
  avant: $<HTMLButtonElement>('avant'),
  apres: $<HTMLButtonElement>('apres'),
};

const store = createStore<VizState>(readStateFromUrl(location.search));
/** La ficelle choisie et, si on a touché un endroit, cet endroit (rien de tout ça n’entre dans l’URL). */
let choix: { id: FicelleId; index: number | null } | null = null;
/** Un message ponctuel (ficelles tombées, limite atteinte). */
let message = '';
/** La mesure qui sonne (suivra l’écoute). */
let curseur: number | null = null;

const voixDe = (g: Grille): Voix[] => realiser(g.map((a) => ({ notes: notesDe(a), basse: basseDe(a) })));
const tonique = (k: number) => nomAccord(accordDuDegre('I', k));

/** La grille du moment (la pile rejouée), la ficelle choisie, et l’aperçu de l’endroit choisi. */
function vue() {
  const s = store.get();
  const grille = rejouer(s.depart, s.pile).grille;
  const c = choix;
  const f = c ? ficelle(c.id) : null;
  const apercu = f && c && c.index !== null ? { ...f.appliquer(grille, c.index), index: c.index } : null;
  return { grille, f, apercu };
}

function dessiner() {
  const { grille, f, apercu } = vue();
  const g = apercu ? apercu.grille : grille;
  if (g.length === 0) {
    els.portee.innerHTML = '<p class="hint">Pose des accords pour les voir sur la portée.</p>';
    return;
  }
  const allumes = new Set<number>();
  if (f && !apercu) for (const e of f.endroits(grille)) for (const i of f.zone(grille, e)) allumes.add(i);
  els.portee.innerHTML = dessinerPortee({
    grille: g,
    voix: voixDe(g),
    noms: g.map(nomAccord),
    largeur: Math.max(300, Math.floor(els.portee.clientWidth)),
    allumes,
    touches: new Set(apercu?.touches ?? []),
    curseur,
  });
}

const CLES_FOCUS = ['data-ficelle', 'data-degre', 'data-i', 'data-retirer'];
/** Où remettre le focus au prochain rendu (sélecteur), si une action le déplace d’elle-même. */
let focusVers: string | null = null;

/** Le focus survit aux reconstructions en innerHTML : on retrouve l’élément par son attribut de donnée. */
function focusActuel(): string | null {
  const a = document.activeElement;
  if (!a || a === document.body) return null;
  for (const k of CLES_FOCUS) if (a.hasAttribute(k)) return `[${k}="${a.getAttribute(k)}"]`;
  return null;
}

function render() {
  if (player.playing) player.stop();
  const vers = focusVers ?? focusActuel();
  focusVers = null;
  const s = store.get();
  const { grille, f, apercu } = vue();
  els.home.value = String(s.home);
  els.degres.innerHTML = LABELS.map(
    (l) => `<button type="button" class="button" data-degre="${l}">${escapeHtml(nomAccord(accordDuDegre(l, s.home)))}</button>`,
  ).join('');
  els.resultat.textContent = grille.length ? grille.map(nomAccord).join(' – ') : '—';

  const assez = grille.length >= MIN_DEPART;
  els.cartes.innerHTML = FICELLES.map((x) => {
    const n = assez ? x.endroits(grille).length : 0;
    const compte = !assez ? 'Pose au moins deux accords.' : n === 0 ? x.pourquoiPas(grille) : `${n} endroit${n > 1 ? 's' : ''}`;
    const sig = signaturesDe(x.id);
    const signature = sig.length
      ? `<p class="carte-signature">On l’entend chez ${sig
          .map((s) => `${escapeHtml(s.auteur)}, <a href="${escapeHtml(ecouteUrl(s))}" target="_blank" rel="noopener">« ${escapeHtml(s.titre)} »</a> (${escapeHtml(s.passage)})`)
          .join(' ; ')}.</p>`
      : '';
    return `<article class="carte${n === 0 ? ' vide' : ''}">
      <button type="button" class="carte-choisir" data-ficelle="${x.id}" aria-pressed="${choix?.id === x.id}"${n === 0 ? ' aria-disabled="true"' : ''}>
        <span class="carte-nom">${escapeHtml(x.nom)}</span>
        <span class="carte-resume">${escapeHtml(x.resume)}</span>
        <span class="carte-compte">${escapeHtml(compte)}</span>
      </button>
      ${signature}
    </article>`;
  }).join('');

  els.pile.innerHTML = s.pile
    .map((g, k) => {
      const nom = escapeHtml(ficelle(g.id).nom);
      return `<li>${nom} <button type="button" data-retirer="${k}" aria-label="Retirer ${nom}">✕</button></li>`;
    })
    .join('');
  els.message.hidden = !message;
  els.message.textContent = message;

  els.apercu.hidden = !apercu;
  if (f && apercu) els.apercuTexte.textContent = f.explique(grille, apercu.index);
  els.consigne.textContent = f && !apercu ? 'Touche un endroit allumé sur la portée.' : '';
  dessiner();
  majBoutons();
  if (vers) document.querySelector<HTMLElement>(vers)?.focus();
}

const SECONDES = 1.5;
type Ecoute = 'tout' | 'avant' | 'apres';
let ecoute: Ecoute | null = null;

const synth = new Synth();
const player = new Player(synth, (step) => {
  curseur = typeof step?.tag === 'number' ? step.tag : null;
  if (!step) ecoute = null;
  dessiner();
  majBoutons();
});

/** Les accords de `de` à `a` ; `suit` : le curseur avance sur la portée (seulement si c’est la grille affichée). */
function etapes(voix: readonly Voix[], de: number, a: number, suit: boolean): Step[] {
  const out: Step[] = [];
  for (let i = Math.max(0, de); i <= Math.min(voix.length - 1, a); i++) {
    const midis = [...voix[i]!];
    out.push(suit ? { midis, seconds: SECONDES, tag: i } : { midis, seconds: SECONDES });
  }
  return out;
}

function ecouter(quoi: Ecoute) {
  if (player.playing && ecoute === quoi) {
    player.stop();
    return;
  }
  const { grille, f, apercu } = vue();
  let steps: Step[] = [];
  if (quoi === 'tout') {
    const g = apercu ? apercu.grille : grille;
    steps = etapes(voixDe(g), 0, g.length - 1, true);
  } else if (f && apercu && quoi === 'avant') {
    const z = f.zone(grille, apercu.index);
    steps = etapes(voixDe(grille), Math.min(...z) - 1, Math.max(...z) + 1, false);
  } else if (apercu && quoi === 'apres') {
    steps = etapes(voixDe(apercu.grille), Math.min(...apercu.touches) - 1, Math.max(...apercu.touches) + 1, true);
  }
  if (!steps.length) return;
  player.play(steps);
  ecoute = quoi;
  majBoutons();
}

function majBoutons() {
  const en = (q: Ecoute) => player.playing && ecoute === q;
  els.ecouter.textContent = en('tout') ? 'Arrêter' : 'Écouter';
  els.avant.textContent = en('avant') ? 'Arrêter' : 'Écouter avant';
  els.apres.textContent = en('apres') ? 'Arrêter' : 'Écouter après';
  els.ecouter.disabled = vue().grille.length === 0;
}

els.ecouter.addEventListener('click', () => ecouter('tout'));
els.avant.addEventListener('click', () => ecouter('avant'));
els.apres.addEventListener('click', () => ecouter('apres'));

store.subscribe(() => {
  history.replaceState(null, '', `${location.pathname}${stateToSearch(store.get())}${location.hash}`);
  render();
});

/** Changer de départ vide la pile : ses endroits ne voudraient plus rien dire. */
function changerDepart(depart: Accord[]) {
  choix = null;
  message = '';
  store.set({ depart, pile: [] });
}

function erreur(t: string) {
  els.saisieErreur.textContent = t;
  els.saisieErreur.hidden = false;
}

els.home.innerHTML = Array.from({ length: 12 }, (_, k) => `<option value="${k}">${escapeHtml(tonique(k))} majeur</option>`).join('');
els.home.addEventListener('change', () => {
  const s = store.get();
  const k = Number(els.home.value);
  choix = null;
  // Transposer garde les endroits de la pile : tout bouge ensemble.
  store.set({ home: k, depart: s.depart.map((a) => transposer(a, k - s.home)) });
});

els.degres.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-degre]');
  if (!b) return;
  const s = store.get();
  if (s.depart.length >= MAX_DEPART) {
    message = `${MAX_DEPART} accords au plus au départ.`;
    render();
    return;
  }
  changerDepart([...s.depart, accordDuDegre(b.dataset.degre!, s.home)]);
});

els.saisie.addEventListener('submit', (e) => {
  e.preventDefault();
  const s = store.get();
  const mots = decouper(els.saisieTexte.value);
  const lus = mots.map((m) => lireAccord(m, s.home));
  const k = lus.findIndex((a) => a === null);
  if (k >= 0) return erreur(`Je ne sais pas lire « ${mots[k]} ».`);
  if (lus.length < MIN_DEPART || lus.length > MAX_DEPART) return erreur(`Il faut entre ${MIN_DEPART} et ${MAX_DEPART} accords.`);
  els.saisieErreur.hidden = true;
  changerDepart(lus.filter((a): a is Accord => a !== null));
});

els.cliche.addEventListener('click', () => changerDepart(cliche(store.get().home)));
els.effacer.addEventListener('click', () => changerDepart([]));

els.cartes.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-ficelle]');
  if (!b || b.getAttribute('aria-disabled') === 'true') return;
  const id = b.dataset.ficelle as FicelleId;
  choix = choix?.id === id ? null : { id, index: null };
  render();
});

function choisirEndroit(cible: EventTarget | null) {
  const m = (cible as Element | null)?.closest<SVGElement>('[data-i]');
  if (!m || !choix || choix.index !== null) return;
  const i = Number(m.dataset.i);
  const { grille } = vue();
  const f = ficelle(choix.id);
  const e = f.endroits(grille).find((x) => f.zone(grille, x).includes(i));
  if (e === undefined) return;
  choix = { id: choix.id, index: e };
  focusVers = '#garder';
  render();
}
els.portee.addEventListener('click', (e) => choisirEndroit(e.target));
els.portee.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  choisirEndroit(e.target);
});

els.garder.addEventListener('click', () => {
  if (!choix || choix.index === null) return;
  const geste = { id: choix.id, index: choix.index };
  focusVers = `[data-ficelle="${choix.id}"]`;
  choix = null;
  message = '';
  store.set({ pile: [...store.get().pile, geste] });
});
els.annuler.addEventListener('click', () => {
  if (choix) focusVers = `[data-ficelle="${choix.id}"]`;
  choix = choix ? { id: choix.id, index: null } : null;
  render();
});

els.pile.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-retirer]');
  if (!b) return;
  const s = store.get();
  const r = rejouer(s.depart, retirer(s.pile, Number(b.dataset.retirer)));
  message = r.tombes.length ? `Retirée${r.tombes.length > 1 ? 's' : ''} aussi, faute de place : ${r.tombes.map((t) => ficelle(t.id).nom).join(', ')}.` : '';
  choix = null;
  store.set({ pile: r.gardes });
});

els.copier.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(els.resultat.textContent ?? '');
    els.copier.textContent = 'Grille copiée';
  } catch {
    els.copier.textContent = 'Copie impossible';
  }
  setTimeout(() => (els.copier.textContent = 'Copier la grille'), 1500);
});

new ResizeObserver(() => dessiner()).observe(els.portee);

// Une URL peut contenir des ficelles qui ne s’appliquent pas : on ne garde que celles qui tiennent.
const init = store.get();
const r0 = rejouer(init.depart, init.pile);
if (r0.tombes.length) store.set({ pile: r0.gardes });
render();
