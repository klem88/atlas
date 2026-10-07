/**
 * Deux mesures d'exemple par palier, écrites note à note pour les deux mains : ce que montre la petite partition
 * de chaque carte, et ce que joue « Écouter l'exemple » (en boucle, avec la section rythmique).
 *
 * - Main gauche : l'exemple du palier (`exemple`), avec les voicings de toute la grille, pour que la partition
 *   montre les mêmes notes que les claviers des cartes d'accords.
 * - Main droite : rien aux paliers 1 à 3 ; aux paliers 4 à 6, une ligne de croches calculée dans le mode de chaque
 *   accord, qui retombe sur la 3ce à chaque changement d'accord.
 */
import type { Hit } from '@shell/music/swing';
import { notesDuMode, nomsDuMode } from './modes';
import { exemple, encerclement, type Palier } from './paliers';
import { QUALITES, type AccordJoue } from './progressions';

/** Longueur de l'exemple, en temps : deux mesures. */
export const FENETRE = 8;

/** Zone de la main droite, en MIDI (mi4 à la5). */
export const MD_BAS = 64;
export const MD_HAUT = 81;
const MD_CENTRE = 72;

/** Un événement écrit : un accord, une note, ou un silence (aucune note). */
export interface Evenement {
  /** Début, en temps (0 à 8). */
  debut: number;
  duree: number;
  notes: number[];
  /** Nom de chaque note (« ré♭ »), pour l'orthographe de la partition. */
  noms: string[];
}

export interface Cellule {
  /** Les accords des deux mesures, coupés à la fin de la seconde. */
  accords: AccordJoue[];
  md: Evenement[];
  mg: Evenement[];
  /** Les deux mains, pour l'écoute (temps droits, le swing s'applique à la lecture). */
  hits: Hit[];
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** Les accords des deux premières mesures de la grille. */
export function fenetre(accords: readonly AccordJoue[]): AccordJoue[] {
  return accords.filter((a) => a.debut < FENETRE).map((a) => ({ ...a, temps: Math.min(a.temps, FENETRE - a.debut) }));
}

const accordA = (accords: readonly AccordJoue[], t: number) => accords.filter((a) => a.debut <= t).pop() ?? accords[0]!;

/** Nom d'une note dans le contexte d'un accord : celui de son mode, un nom à dièse ou bémol sinon. */
export function nommer(acc: AccordJoue, midi: number): string {
  const pcs = notesDuMode(acc.racine, acc.mode);
  const k = pcs.indexOf(mod12(midi));
  if (k >= 0) return nomsDuMode(acc.note, acc.racine, acc.mode)[k]!;
  return (acc.note.includes('♭') ? BEMOLS : DIESES)[mod12(midi)]!;
}
const BEMOLS = ['do', 'ré♭', 'ré', 'mi♭', 'mi', 'fa', 'sol♭', 'sol', 'la♭', 'la', 'si♭', 'si'];
const DIESES = ['do', 'do♯', 'ré', 'ré♯', 'mi', 'fa', 'fa♯', 'sol', 'sol♯', 'la', 'la♯', 'si'];

/** La note de classe `pc` la plus proche de `pres`, dans la zone de la main droite. */
function proche(pc: number, pres: number): number {
  let best = -1;
  for (let m = MD_BAS; m <= MD_HAUT; m++) if (mod12(m) === pc && (best < 0 || Math.abs(m - pres) < Math.abs(best - pres))) best = m;
  return best;
}

/** La note du mode juste au-dessus (dir = 1) ou en dessous (dir = -1). */
function pas(depuis: number, pcs: readonly number[], dir: 1 | -1): number {
  let m = depuis + dir;
  while (!pcs.includes(mod12(m))) m += dir;
  return m;
}

const tierce = (acc: AccordJoue) => mod12(acc.racine + QUALITES[acc.qualite].guides[0]);

/**
 * Croches continues de `debut` à `fin` : la 3ce de l'accord à chaque changement, puis on monte dans le mode
 * pendant la première moitié de l'accord et on redescend pendant la seconde.
 */
export function ligne(accords: readonly AccordJoue[], debut: number, fin: number, depart?: number): number[] {
  const notes: number[] = [];
  let prec = depart ?? MD_CENTRE;
  for (let t = debut; t < fin; t += 0.5) {
    const acc = accordA(accords, t);
    let n: number;
    if ((t === debut && depart === undefined) || (t === acc.debut && t > debut)) n = proche(tierce(acc), prec);
    else {
      const pcs = notesDuMode(acc.racine, acc.mode);
      const dir: 1 | -1 = t < acc.debut + acc.temps / 2 ? 1 : -1;
      n = pas(prec, pcs, dir);
      if (n > MD_HAUT || n < MD_BAS) n = pas(prec, pcs, dir === 1 ? -1 : 1);
    }
    notes.push(n);
    prec = n;
  }
  return notes;
}

function croches(accords: readonly AccordJoue[], debut: number, notes: readonly number[]): Evenement[] {
  return notes.map((midi, i) => {
    const t = debut + i * 0.5;
    return { debut: t, duree: 0.5, notes: [midi], noms: [nommer(accordA(accords, t), midi)] };
  });
}

/** Main droite des paliers 4 à 6. */
export function mainDroite(palier: Palier, accords: readonly AccordJoue[]): Evenement[] {
  if (palier.n <= 3) return [];
  if (palier.n === 4) return croches(accords, 0, ligne(accords, 0, FENETRE));
  if (palier.n === 5) {
    // Une phrase qui part du « et » de 1 et se pose sur une note guide au temps 4, puis une mesure de silence.
    const phrase = ligne(accords, 0, 3).slice(1);
    const acc = accordA(accords, 3);
    const fin = QUALITES[acc.qualite].guides
      .map((g) => proche(mod12(acc.racine + g), phrase[phrase.length - 1]!))
      .reduce((a, b) => (Math.abs(a - phrase[phrase.length - 1]!) <= Math.abs(b - phrase[phrase.length - 1]!) ? a : b));
    return [...croches(accords, 0.5, phrase), { debut: 3, duree: 1, notes: [fin], noms: [nommer(acc, fin)] }];
  }
  // Palier 6 : croches, puis l'encerclement de la 3ce du deuxième accord (« 4, et, UN »), puis de nouveau des croches.
  const avant = ligne(accords, 0, 3);
  const accAvant = accordA(accords, 3);
  const accCible = accordA(accords, 4);
  let cible = proche(tierce(accCible), avant[avant.length - 1]!);
  if (cible + 2 > MD_HAUT) cible -= 12; // la note du dessus doit rester dans la zone
  const pcs = notesDuMode(accAvant.racine, accAvant.mode);
  let dessus = pas(cible, pcs, 1);
  if (dessus - cible > 2) dessus = cible + 1;
  const enc = encerclement(accAvant, accCible);
  const apres = ligne(accords, 5, FENETRE, cible);
  return [
    ...croches(accords, 0, avant),
    { debut: 3, duree: 0.5, notes: [dessus], noms: [nommer(accAvant, dessus)] },
    { debut: 3.5, duree: 0.5, notes: [cible - 1], noms: [enc.dessous] },
    { debut: 4, duree: 1, notes: [cible], noms: [enc.cible] },
    ...croches(accords, 5, apres),
  ];
}

const arrondi = (x: number) => Math.max(0.5, Math.round(x * 2) / 2);

/**
 * Main gauche écrite, à partir des coups de l'exemple : arrondie à la croche, coupée au coup suivant,
 * et un accord qui déborde de la boucle (l'anticipation du premier accord) est écrit en deux morceaux.
 */
function mainGauche(hits: readonly Hit[], accords: readonly AccordJoue[], voicings: readonly (readonly number[])[]): Evenement[] {
  const parDebut = new Map<number, Hit[]>();
  for (const h of hits) parDebut.set(h.beat, [...(parDebut.get(h.beat) ?? []), h]);
  const evts: Evenement[] = [];
  for (const [debut, groupe] of parDebut) {
    const notes = groupe.map((h) => h.midi!).sort((a, b) => a - b);
    const cle = notes.join(',');
    const i = voicings.findIndex((v) => [...v].sort((a, b) => a - b).join(',') === cle);
    const acc = accords[Math.max(0, i)]!;
    const noms = notes.map((m) => nommer(acc, m));
    const duree = arrondi(groupe[0]!.dur);
    if (debut + duree > FENETRE) {
      evts.push({ debut, duree: FENETRE - debut, notes, noms });
      evts.push({ debut: 0, duree: debut + duree - FENETRE, notes, noms });
    } else evts.push({ debut, duree, notes, noms });
  }
  evts.sort((a, b) => a.debut - b.debut);
  evts.forEach((e, k) => {
    const suivant = evts[k + 1]?.debut ?? FENETRE;
    e.duree = Math.min(e.duree, suivant - e.debut);
  });
  return evts;
}

/** Les deux mesures d'un palier, sur la grille `accords` (toute la grille) avec ses voicings de main gauche. */
export function cellule(palier: Palier, accords: readonly AccordJoue[], voicings: readonly (readonly number[])[]): Cellule {
  const win = fenetre(accords);
  const vWin = voicings.slice(0, win.length);
  const hitsMg = exemple(palier, win, FENETRE, vWin);
  const md = mainDroite(palier, win);
  const hitsMd: Hit[] = md.flatMap((e) =>
    e.notes.map((midi) => ({ beat: e.debut, kind: 'piano' as const, midi, dur: e.duree * 0.9, vel: e.debut % 1 ? 0.75 : 0.62 })),
  );
  return { accords: win, md, mg: mainGauche(hitsMg, win, vWin), hits: [...hitsMg, ...hitsMd].sort((a, b) => a.beat - b.beat) };
}
