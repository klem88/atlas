import { escapeHtml } from '@shell/html';
import { Band, type Loop } from '@shell/music/band';
import { carnetStocke, exporterCarnet, fusionner, lireCarnet, meilleurTempo } from '@shell/music/logbook';
import { drumPattern, walkingBass, type ChordSpan } from '@shell/music/swing';
import { mountShell } from '@shell/shell';
import { MODES, nomsDuMode, notesDuMode } from './domain/modes';
import { PALIERS, encerclement, exemple, nomMode, type Palier } from './domain/paliers';
import { PROGRESSIONS, QUALITES, dureeGrille, nomTonalite, progression, transpose, type Qualite } from './domain/progressions';
import { CYCLE_QUARTES, tonicName } from './domain/spelling';
import { voicingsMainGauche } from './domain/voicings';
import { miniClavier, type Marque } from './ui/clavier';
import { dateCourte, rendreCarnet } from './ui/carnet';
import { chargerFrequences, rendreFrequence } from './ui/standards';
import type { Frequences } from './data/contract';
import '@shell/music/score.css';
import './viz.css';

const SLUG = 'jazz-ii-v';
mountShell({ currentSlug: SLUG });

/* Réglages retenus d'une visite à l'autre ------------------------------------------------------------------ */

function retenu(cle: string) {
  const key = `atlas:${SLUG}:${cle}`;
  return {
    get: (): string | null => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set: (v: string) => {
      try {
        localStorage.setItem(key, v);
      } catch {
        // Stockage indisponible : le réglage vit le temps de la visite.
      }
    },
  };
}

const tempoRetenu = retenu('tempo');
const palierRetenu = retenu('palier');
const carnet = carnetStocke(SLUG);

const q = <T extends Element>(sel: string) => document.querySelector<T>(sel)!;
const el = {
  lecture: q<HTMLButtonElement>('[data-lecture]'),
  tempo: q<HTMLInputElement>('#tempo'),
  tempoOut: q<HTMLOutputElement>('#tempo-out'),
  palier: q<HTMLSelectElement>('#palier'),
  exemple: q<HTMLInputElement>('#exemple'),
  tonNom: q<HTMLElement>('[data-ton-nom]'),
  tonSuivant: q<HTMLButtonElement>('[data-ton-suivant]'),
  progression: q<HTMLSelectElement>('#progression'),
  tons: q<HTMLFieldSetElement>('[data-tons]'),
  titre: q<HTMLElement>('[data-titre]'),
  court: q<HTMLElement>('[data-court]'),
  explication: q<HTMLElement>('[data-explication]'),
  ou: q<HTMLElement>('[data-ou]'),
  frequence: q<HTMLElement>('[data-frequence]'),
  grille: q<HTMLOListElement>('[data-grille]'),
  accords: q<HTMLElement>('[data-accords]'),
  paliers: q<HTMLElement>('[data-paliers]'),
  carnet: q<HTMLElement>('[data-carnet]'),
};

/* État : progression et tonalité dans l'adresse, tempo et palier retenus ----------------------------------- */

const params = new URLSearchParams(location.search);
const etat = {
  p: progression(params.get('p') ?? ''),
  tonique: 0,
  palier: Math.min(6, Math.max(1, Number(palierRetenu.get()) || 1)),
  bpm: Number(tempoRetenu.get()) || 100,
  exemple: false,
};
const kParam = Number(params.get('k'));
etat.tonique = params.has('k') && Number.isInteger(kParam) && kParam >= 0 && kParam < 12 ? kParam : etat.p.tonique;

let frequences: Frequences | null = null;
const band = new Band();

const accords = () => transpose(etat.p, etat.tonique);
const palierCourant = (): Palier => PALIERS[etat.palier - 1]!;

/** Notes de l'accord pour la contrebasse : fondamentale, 3ce, « 5te », 7e. */
function tonsBasse(q: Qualite): number[] {
  if (q === '7alt') return [0, 4, 8, 10];
  return QUALITES[q].notes.slice(0, 4);
}

function boucle(): Loop {
  const a = accords();
  const L = dureeGrille(etat.p);
  const spans: ChordSpan[] = a.map((x) => ({ root: x.racine, start: x.debut, beats: x.temps, tones: tonsBasse(x.qualite) }));
  const hits = [...walkingBass(spans, L), ...drumPattern(L)];
  if (etat.exemple) hits.push(...exemple(palierCourant(), a, L));
  return { hits, beats: L };
}

function majAdresse(): void {
  const url = new URL(location.href);
  url.searchParams.set('p', etat.p.id);
  url.searchParams.set('k', String(etat.tonique));
  history.replaceState(null, '', url);
}

/* Bandeau --------------------------------------------------------------------------------------------------- */

const ICON_PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 .5v9l8-4.5z"/></svg>';
const ICON_STOP = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="1" width="8" height="8"/></svg>';

let wakeLock: WakeLockSentinel | null = null;

function majLecture(): void {
  el.lecture.innerHTML = band.playing ? `${ICON_STOP} Arrêter` : `${ICON_PLAY} Jouer avec la section`;
  el.lecture.setAttribute('aria-pressed', String(band.playing));
  document.querySelectorAll<HTMLButtonElement>('[data-ecouter]').forEach((b) => {
    const actif = band.playing && etat.exemple && Number(b.dataset.ecouter) === etat.palier;
    b.setAttribute('aria-pressed', String(actif));
    b.innerHTML = actif ? `${ICON_STOP} Arrêter l’exemple` : `${ICON_PLAY} Écouter l’exemple`;
  });
}

function jouer(): void {
  band.play(boucle(), etat.bpm);
  void navigator.wakeLock
    ?.request('screen')
    .then((w) => (wakeLock = w))
    .catch(() => undefined);
  majLecture();
  suivre();
}

function arreter(): void {
  band.stop();
  void wakeLock?.release().catch(() => undefined);
  wakeLock = null;
  majLecture();
}

el.lecture.addEventListener('click', () => (band.playing ? arreter() : jouer()));

el.tempo.value = String(etat.bpm);
el.tempoOut.textContent = String(etat.bpm);
el.tempo.addEventListener('input', () => {
  etat.bpm = Number(el.tempo.value);
  el.tempoOut.textContent = el.tempo.value;
  band.setTempo(etat.bpm);
  rendrePaliers();
});
el.tempo.addEventListener('change', () => tempoRetenu.set(el.tempo.value));

el.palier.innerHTML = PALIERS.map((p) => `<option value="${p.n}">${p.n}. ${escapeHtml(p.titre)}</option>`).join('');
el.palier.addEventListener('change', () => choisirPalier(Number(el.palier.value)));

el.exemple.addEventListener('change', () => {
  etat.exemple = el.exemple.checked;
  band.setLoop(boucle());
  majLecture();
});

el.tonSuivant.addEventListener('click', () => {
  const i = CYCLE_QUARTES.indexOf(etat.tonique);
  choisirTonalite(CYCLE_QUARTES[(i + 1) % 12]!);
});

/* Choix ----------------------------------------------------------------------------------------------------- */

el.progression.innerHTML = PROGRESSIONS.map((p) => `<option value="${p.id}">${escapeHtml(p.titre)}</option>`).join('');
el.progression.addEventListener('change', () => {
  const p = progression(el.progression.value);
  // On garde la tonique si on reste dans le même mode, sinon on prend celle de la progression.
  if (p.mode !== etat.p.mode) etat.tonique = p.tonique;
  etat.p = p;
  if (band.playing) band.setLoop(boucle());
  rendreTout();
});

el.tons.addEventListener('change', (e) => choisirTonalite(Number((e.target as HTMLInputElement).value)));

function choisirTonalite(k: number): void {
  etat.tonique = k;
  if (band.playing) band.setLoop(boucle());
  rendreTout();
}

function choisirPalier(n: number): void {
  etat.palier = n;
  el.palier.value = String(n);
  palierRetenu.set(String(n));
  if (band.playing && etat.exemple) band.setLoop(boucle());
  rendreAccords();
  rendrePaliers();
  rendreLeCarnet();
  majLecture();
}

/* Rendu ----------------------------------------------------------------------------------------------------- */

const italiques = (s: string) => escapeHtml(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

function rendreTout(): void {
  const p = etat.p;
  majAdresse();
  el.progression.value = p.id;
  el.palier.value = String(etat.palier);
  el.tonNom.textContent = nomTonalite(p, etat.tonique);
  el.tons.innerHTML =
    '<legend>Tonalité, dans l’ordre du cycle des quartes</legend>' +
    CYCLE_QUARTES.map(
      (k) =>
        `<label><input type="radio" name="ton" value="${k}"${k === etat.tonique ? ' checked' : ''} />${escapeHtml(tonicName(k, p.mode))}${p.mode === 'mineur' ? '<span class="visually-hidden"> mineur</span>' : ''}</label>`,
    ).join('');
  el.titre.textContent = `${p.titre}, en ${nomTonalite(p, etat.tonique)}`;
  el.court.textContent = p.court;
  el.explication.textContent = p.explication;
  el.ou.innerHTML = italiques(p.ou);
  rendreFrequence(el.frequence, frequences, p.id);
  rendreGrille();
  rendreAccords();
  rendrePaliers();
  rendreLeCarnet();
}

/** Une case par mesure ; un accord de deux mesures laisse le signe de répétition dans la seconde. */
function rendreGrille(): void {
  const a = accords();
  const mesures = dureeGrille(etat.p) / 4;
  const cases: string[] = [];
  for (let m = 0; m < mesures; m++) {
    const dedans = a.filter((x) => x.debut < (m + 1) * 4 && x.debut + x.temps > m * 4);
    const contenu = dedans
      .map((x) =>
        x.debut >= m * 4
          ? `<span class="jazz-accord"><span class="jazz-nom">${escapeHtml(x.nom)}</span><span class="jazz-degre">${escapeHtml(x.chiffrage)}</span></span>`
          : '<span class="jazz-accord jazz-repete" aria-label="même accord">%</span>',
      )
      .join('');
    cases.push(`<li data-mesure="${m}"><span class="jazz-mesure">${contenu}</span><span class="jazz-temps" aria-hidden="true"><i></i><i></i><i></i><i></i></span></li>`);
  }
  el.grille.innerHTML = cases.join('');
}

function rendreAccords(): void {
  const a = accords();
  const voicings = voicingsMainGauche(a, palierCourant().main);
  el.accords.innerHTML = a
    .map((acc, i) => {
      const suivant = a[(i + 1) % a.length]!;
      const guides = QUALITES[acc.qualite].guides.map((g) => (acc.racine + g) % 12);
      const noms = nomsDuMode(acc.note, acc.racine, acc.mode);
      const pcs = notesDuMode(acc.racine, acc.mode);
      // Main droite : le mode, depuis la fondamentale autour du do central.
      const bas = 60 + acc.racine;
      const md = new Map<number, Marque>();
      for (let m = bas; m <= bas + 12; m++) if (pcs.includes(m % 12)) md.set(m, guides.includes(m % 12) ? 'guide' : 'mode');
      // Le clavier commence au do ou au fa en dessous, et finit sur une touche blanche.
      // Deux octaves, du do ou du fa en dessous : tous les claviers ont la même taille.
      const debut = bas - (bas % 12 < 5 ? bas % 12 : (bas % 12) - 5);
      const fin = debut + 24;
      const mg = new Map<number, Marque>(voicings[i]!.map((m) => [m, 'joue']));
      const enc = encerclement(acc, suivant);
      const listeNoms = noms.map((n, k) => (guides.includes(pcs[k]!) ? `<strong>${escapeHtml(n)}</strong>` : escapeHtml(n))).join(' ');
      return `<article class="jazz-carte">
        <h3><span class="jazz-nom">${escapeHtml(acc.nom)}</span> <span class="jazz-degre">${escapeHtml(acc.chiffrage)}</span></h3>
        <p class="carte-mode">${escapeHtml(nomMode(acc))}</p>
        <p class="carte-notes">${listeNoms}</p>
        ${miniClavier(debut, fin, md, `Main droite : ${nomMode(acc)}`)}
        <p class="carte-couleur">${escapeHtml(MODES[acc.mode].couleur)}</p>
        <p class="carte-cible">Vers ${escapeHtml(suivant.nom)} : vise <strong>${escapeHtml(enc.cible)}</strong>.</p>
        <p class="carte-mg">Main gauche</p>
        ${miniClavier(48, 71, mg, `Main gauche : ${voicings[i]!.length} notes`)}
      </article>`;
    })
    .join('');
}

function rythme(p: Palier): string {
  const coups = p.rythme
    .map((c) => {
      const debut = c.debut * 2 + 1;
      const fin = Math.min(9, debut + c.duree * 2);
      const deborde = c.debut + c.duree > 4;
      return `<span class="coup${deborde ? ' coup-deborde' : ''}" style="grid-column:${debut} / ${fin}"></span>`;
    })
    .join('');
  const temps = ['1', 'et', '2', 'et', '3', 'et', '4', 'et'].map((t, i) => `<span class="temps${i % 2 ? ' temps-et' : ''}" style="grid-column:${i + 1}">${t}</span>`).join('');
  return `<div class="rythme" role="img" aria-label="Rythme de la main gauche">${coups}${temps}</div>`;
}

function rendrePaliers(): void {
  const a = accords();
  const enc = encerclement(a[a.length - 2] ?? a[0]!, a[a.length - 1]!);
  const ton = tonicName(etat.tonique, etat.p.mode);
  el.paliers.innerHTML = PALIERS.map((p) => {
    const record = meilleurTempo(carnet.tampons(), etat.p.id, p.n, etat.tonique);
    const courant = p.n === etat.palier;
    const exempleEnc = p.n === 6 ? `<li>Ici, vers ${escapeHtml(enc.vers)} : ${escapeHtml(enc.dessus)}, ${escapeHtml(enc.dessous)}, <strong>${escapeHtml(enc.cible)}</strong>.</li>` : '';
    return `<article class="jazz-palier${courant ? ' palier-courant' : ''}" data-palier="${p.n}">
      <p class="exercise-step-num">Palier ${p.n}</p>
      <h3>${escapeHtml(p.titre)}</h3>
      ${rythme(p)}
      <ul>${p.consignes.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}${exempleEnc}</ul>
      <p class="palier-reussi"><span class="jazz-etiquette">Réussi quand</span> ${escapeHtml(p.reussi)}</p>
      <div class="exercise-controls">
        <button type="button" class="play-button" data-ecouter="${p.n}" aria-pressed="false"></button>
        <button type="button" class="button bouton-tampon" data-tampon="${p.n}">J’y arrive à ${etat.bpm}, en ${escapeHtml(ton)}</button>
      </div>
      <p class="palier-record" data-record="${p.n}">${record ? `Ton record ici : <strong>${record}</strong> à la noire.` : 'Pas encore de tampon dans cette tonalité.'}</p>
    </article>`;
  }).join('');
  majLecture();
}

function rendreLeCarnet(): void {
  rendreCarnet(el.carnet, { tampons: carnet.tampons(), progression: etat.p, palier: etat.palier, tonique: etat.tonique });
}

/* Paliers : écouter, tamponner ------------------------------------------------------------------------------ */

el.paliers.addEventListener('click', (e) => {
  const cible = e.target as HTMLElement;
  const ecouter = cible.closest<HTMLButtonElement>('[data-ecouter]');
  if (ecouter) {
    const n = Number(ecouter.dataset.ecouter);
    if (band.playing && etat.exemple && n === etat.palier) {
      arreter();
      return;
    }
    etat.exemple = true;
    el.exemple.checked = true;
    if (n !== etat.palier) choisirPalier(n);
    if (band.playing) band.setLoop(boucle());
    else jouer();
    majLecture();
    return;
  }
  const tampon = cible.closest<HTMLButtonElement>('[data-tampon]');
  if (tampon) {
    const n = Number(tampon.dataset.tampon);
    const t = { p: etat.p.id, s: n, k: etat.tonique, bpm: etat.bpm, at: new Date().toISOString() };
    carnet.ajouter(t);
    if (n !== etat.palier) choisirPalier(n);
    else {
      rendrePaliers();
      rendreLeCarnet();
    }
    const record = q<HTMLElement>(`[data-record="${n}"]`);
    record.innerHTML = `Tamponné le ${escapeHtml(dateCourte(t.at))} à <strong>${t.bpm}</strong>, en ${escapeHtml(tonicName(t.k, etat.p.mode))}. Bravo.`;
    record.classList.add('palier-tamponne');
  }
});

/* Carnet : export, import, retrait -------------------------------------------------------------------------- */

el.carnet.addEventListener('click', (e) => {
  const cible = e.target as HTMLElement;
  if (cible.closest('[data-exporter]')) {
    const blob = new Blob([exporterCarnet(carnet.tampons())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `carnet-jazz-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } else if (cible.closest('[data-annuler]')) {
    carnet.retirerDernier();
    rendrePaliers();
    rendreLeCarnet();
  }
});

el.carnet.addEventListener('change', async (e) => {
  const input = (e.target as HTMLElement).closest<HTMLInputElement>('[data-importer]');
  const fichier = input?.files?.[0];
  if (!fichier) return;
  const lus = lireCarnet(await fichier.text());
  if (!lus) {
    q<HTMLElement>('[data-carnet-message]').textContent = 'Ce fichier n’est pas un carnet exporté depuis cette page. Rien n’a été changé.';
    return;
  }
  const avant = carnet.tampons().length;
  const fusion = carnet.remplacer(fusionner(carnet.tampons(), lus));
  rendrePaliers();
  rendreLeCarnet();
  q<HTMLElement>('[data-carnet-message]').textContent = `${fusion.length - avant} tampon${fusion.length - avant > 1 ? 's' : ''} ajouté${fusion.length - avant > 1 ? 's' : ''} depuis le fichier.`;
});

/* Suivi de la lecture : la mesure jouée s'allume, et le temps en cours ------------------------------------- */

let suivi = 0;
function suivre(): void {
  cancelAnimationFrame(suivi);
  const pas = () => {
    const pos = band.position();
    const mesure = pos === null || pos < 0 ? -1 : Math.floor(pos / 4);
    const temps = pos === null ? -1 : pos < 0 ? Math.floor(pos + 4) : Math.floor(pos % 4);
    el.grille.querySelectorAll<HTMLLIElement>('li').forEach((li, i) => {
      const actif = i === mesure;
      li.classList.toggle('mesure-jouee', actif);
      li.querySelectorAll('i').forEach((dot, k) => dot.classList.toggle('temps-joue', actif && k === temps));
    });
    el.grille.classList.toggle('decompte', pos !== null && pos < 0);
    if (pos !== null) suivi = requestAnimationFrame(pas);
  };
  pas();
}

rendreTout();
majLecture();
void chargerFrequences().then((f) => {
  frequences = f;
  rendreFrequence(el.frequence, frequences, etat.p.id);
});
