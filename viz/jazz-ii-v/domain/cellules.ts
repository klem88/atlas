/**
 * Deux mesures d'exemple par palier, écrites note à note pour les deux mains : ce que montre la petite partition
 * de chaque carte, et ce que joue « Écouter l'exemple » (en boucle, avec la section rythmique).
 *
 * - Les deux mesures sont prises dans l'accompagnement de toute la grille (`exemple`), avec les notes de toute la grille
 *   (`mains`) : la partition montre les mêmes notes que les claviers des cartes d'accords, et l'anticipation de la fin
 *   de la mesure 2 vise bien l'accord suivant de la grille.
 * - Main gauche : le shell. Main droite : l'autre note guide (palier 1), le voicing (paliers 2 et 3), ou, aux paliers
 *   4 à 6, une ligne de croches calculée dans le mode de chaque accord, qui retombe sur la 3ce à chaque changement.
 */
import type { Hit } from '@shell/music/swing';
import { notesDuMode, nomsDuMode } from './modes';
import { exemple, encerclement, mains, type Palier } from './paliers';
import { QUALITES, dureeGrilleJouee, type AccordJoue } from './progressions';

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
  /** Les deux mains telles qu'écrites, pour l'écoute (temps droits, le swing s'applique à la lecture). */
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
 * Les coups de toute la grille ramenés aux deux mesures : ceux qui commencent avant la fin de la mesure 2 (coupés là),
 * et le morceau d'un accord anticipé à la fin de la grille qui déborde sur le début (palier 3).
 */
function fenetrer(hits: readonly Hit[], duree: number): Hit[] {
  const out: Hit[] = [];
  for (const h of hits) {
    if (h.beat < FENETRE) out.push({ ...h, dur: Math.min(h.dur, FENETRE - h.beat) });
    if (h.beat + h.dur > duree) out.push({ ...h, beat: 0, dur: h.beat + h.dur - duree });
  }
  return out;
}

/** Une main écrite, à partir de ses coups : arrondie à la croche, chaque coup coupé au suivant. */
function ecrire(hits: readonly Hit[], accords: readonly AccordJoue[], notes: readonly (readonly number[])[]): Evenement[] {
  const parDebut = new Map<number, Hit[]>();
  for (const h of hits) parDebut.set(h.beat, [...(parDebut.get(h.beat) ?? []), h]);
  const evts: Evenement[] = [];
  for (const [debut, groupe] of parDebut) {
    const n = [...new Set(groupe.map((h) => h.midi!))].sort((a, b) => a - b);
    const cle = n.join(',');
    const i = notes.findIndex((v) => [...v].sort((a, b) => a - b).join(',') === cle);
    const acc = accords[Math.max(0, i)]!;
    evts.push({ debut, duree: arrondi(Math.max(...groupe.map((h) => h.dur))), notes: n, noms: n.map((m) => nommer(acc, m)) });
  }
  evts.sort((a, b) => a.debut - b.debut);
  evts.forEach((e, k) => {
    const suivant = evts[k + 1]?.debut ?? FENETRE;
    e.duree = Math.min(e.duree, suivant - e.debut);
  });
  return evts;
}

const versHits = (evts: readonly Evenement[], vel: (e: Evenement) => number): Hit[] =>
  evts.flatMap((e) => e.notes.map((midi) => ({ beat: e.debut, kind: 'piano' as const, midi, dur: e.duree * 0.9, vel: vel(e) })));

/** Les deux mesures d'un palier, prises dans la grille `accords` (toute la grille, dans la tonalité choisie). */
export function cellule(palier: Palier, accords: readonly AccordJoue[]): Cellule {
  const win = fenetre(accords);
  const duree = dureeGrilleJouee(accords);
  const { mg: notesMg, md: notesMd } = mains(palier, accords);
  const mg = ecrire(fenetrer(exemple(palier, accords, duree, notesMg), duree), accords, notesMg);
  const md = notesMd ? ecrire(fenetrer(exemple(palier, accords, duree, notesMd), duree), accords, notesMd) : mainDroite(palier, win);
  const hits = [...versHits(mg, () => 0.7), ...versHits(md, (e) => (notesMd ? 0.6 : e.debut % 1 ? 0.75 : 0.62))];
  return { accords: win, md, mg, hits: hits.sort((a, b) => a.beat - b.beat) };
}
