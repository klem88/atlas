/**
 * Les six paliers, les mêmes pour toutes les progressions, pensés pour le piano solo : la main gauche tient toujours
 * la basse (un shell, fondamentale et note guide), la main droite complète l'harmonie ou joue la ligne.
 * Chacun dit en mots ce que fait chaque main et sait jouer son accompagnement sur une grille.
 * Les deux mesures écrites de chaque carte sont dans cellules.ts.
 */
import type { Hit } from '@shell/music/swing';
import { MODES, notesDuMode } from './modes';
import { QUALITES, type AccordJoue } from './progressions';
import { spellDegree } from './spelling';
import { autresGuides, shells, voicings } from './voicings';

export interface Palier {
  n: number;
  titre: string;
  /** Ce que fait la main gauche, ce que fait la main droite, ce qu'on écoute. */
  consignes: readonly string[];
  /** Quand tamponner « J’y arrive ». */
  reussi: string;
  /** Main droite : l'autre note guide (palier 1), le voicing à quatre sons (paliers 2 et 3), ou une ligne. */
  md: 'guide' | 'voicing' | 'ligne';
}

export const PALIERS: readonly Palier[] = [
  {
    n: 1,
    titre: 'Les notes guides',
    consignes: [
      'Main gauche : la fondamentale en bas, et juste au-dessus la 7e ou la 3ce (un « shell », à la Bud Powell). Posée sur le temps 1 et tenue.',
      'Main droite : l’autre note guide, tenue aussi. À deux mains, tu entends la 3ce et la 7e de chaque accord sur sa basse.',
      'Écoute les notes guides descendre d’un demi-ton d’un accord à l’autre. Chante cette ligne en jouant.',
    ],
    reussi: 'Toute la grille sans t’arrêter, sans chercher la note suivante des yeux.',
    md: 'guide',
  },
  {
    n: 2,
    titre: 'Le Charleston',
    consignes: [
      'Main gauche : le shell, sur le temps 1 puis sur le « et » de 2.',
      'Main droite : le voicing à quatre sons (3ce ou 7e en bas), en même temps que la main gauche. Le second coup est court, presque sec.',
      'Le « et » swingue : il tombe tard, sur la dernière croche d’un triolet. Écoute la ride, elle le joue avec toi.',

    ],
    reussi: 'Tu tombes avec la ride sur le « et » de 2 sans y penser, à chaque mesure.',
    md: 'voicing',
  },
  {
    n: 3,
    titre: 'L’anticipation',
    consignes: [
      'Les deux mains, shell et voicing : chaque accord arrive une croche en avance, sur le « et » de 4 de la mesure d’avant, et passe la barre de mesure. Un coup court sur le « et » de 2.',
      'L’harmonie bouge avant le temps : c’est ce décalage qui fait avancer la musique.',
    ],
    reussi: 'Quand la basse arrive sur le temps 1, ta main gauche y est déjà, sans précipiter le reste.',
    md: 'voicing',
  },
  {
    n: 4,
    titre: 'Croches swing dans le mode',
    consignes: [
      'Main gauche : le shell, en Charleston (temps 1 et « et » de 2).',
      'Main droite : des croches continues dans le mode de chaque accord, en montant et en descendant. Change de mode pile au changement d’accord.',
      'Arrive sur la 3ce du nouvel accord à son temps 1 : c’est la note qui fait entendre le changement.',
      'Legato, accent sur les « et » : « dou-BA dou-BA ».',
    ],
    reussi: 'Des croches sans trou sur toute la grille, chaque nouvel accord pris par sa 3ce.',
    md: 'ligne',
  },
  {
    n: 5,
    titre: 'Phrases à contretemps',
    consignes: [
      'Main gauche : le shell, en Charleston.',
      'Main droite : une phrase courte, puis autant de silence (dans l’exemple, une mesure de chaque). Chaque phrase commence sur un « et », le plus souvent le « et » de 1.',
      'Finis sur une note guide, sur un temps faible, et laisse le silence répondre.',
      'C’est l’exercice qui fait swinguer : on apprend à partir d’à côté du temps, pas à jouer dessus.',
    ],
    reussi: 'Tes phrases démarrent sur le « et » sans hésiter, et tu retombes sur la grille après chaque silence.',
    md: 'ligne',
  },
  {
    n: 6,
    titre: 'Les encerclements',
    consignes: [
      'Main gauche : le shell, en Charleston.',
      'Main droite : avant chaque changement d’accord, encercle la 3ce du nouvel accord. D’abord la note du mode juste au-dessus, puis le demi-ton en dessous, puis la cible, sur le temps 1 : trois croches, « 4, et, UN ».',
      'Entre deux encerclements, des croches dans le mode, comme au palier 4.',
    ],
    reussi: 'Chaque 3ce encerclée tombe pile sur le temps 1, sur toute la grille.',
    md: 'ligne',
  },
];

/** Les notes de chaque main, accord par accord : le shell à gauche ; à droite l'autre note guide ou le voicing. */
export function mains(palier: Palier, accords: readonly AccordJoue[]): { mg: number[][]; md: number[][] | null } {
  const mg = shells(accords);
  const md = palier.md === 'guide' ? autresGuides(accords, mg) : palier.md === 'voicing' ? voicings(accords, 'sansFondamentale') : null;
  return { mg, md };
}

/**
 * L'accompagnement du palier sur la grille, pour une main : des coups de piano en temps depuis le début de la boucle.
 * Palier 1 : tenu. Palier 3 : anticipé sur le « et » de 4. Les autres : Charleston (temps 1 et « et » de 2).
 */
export function exemple(palier: Palier, accords: readonly AccordJoue[], dureeBoucle: number, notes: readonly (readonly number[])[]): Hit[] {
  const hits: Hit[] = [];
  const coup = (beat: number, dur: number, n: readonly number[], vel: number) => {
    for (const midi of n) hits.push({ beat: (beat + dureeBoucle) % dureeBoucle, kind: 'piano', midi, dur, vel });
  };
  accords.forEach((acc, i) => {
    const v = notes[i]!;
    if (palier.n === 1) {
      coup(acc.debut, acc.temps - 0.1, v, 0.6);
      return;
    }
    for (let seg = 0; seg < acc.temps; seg += 4) {
      const debut = acc.debut + seg;
      const longueur = Math.min(4, acc.temps - seg);
      if (palier.n === 3) {
        coup(debut - 0.5, Math.min(1.5, longueur), v, 0.75);
        if (longueur === 4) coup(debut + 1.5, 0.4, v, 0.55);
      } else {
        coup(debut, Math.min(1.4, longueur), v, 0.7);
        if (longueur === 4) coup(debut + 1.5, 0.4, v, 0.55);
      }
    }
  });
  return hits.sort((a, b) => a.beat - b.beat);
}

const NOMS_BEMOLS = ['do', 'ré♭', 'ré', 'mi♭', 'mi', 'fa', 'sol♭', 'sol', 'la♭', 'la', 'si♭', 'si'];
const NOMS_DIESES = ['do', 'do♯', 'ré', 'ré♯', 'mi', 'fa', 'fa♯', 'sol', 'sol♯', 'la', 'la♯', 'si'];
const mod12 = (n: number) => ((n % 12) + 12) % 12;

export interface Encerclement {
  vers: string;
  dessus: string;
  dessous: string;
  cible: string;
}

/**
 * L'encerclement de la 3ce de l'accord suivant : la note du mode courant juste au-dessus, puis le demi-ton
 * en dessous, puis la cible. Noms en minuscules, pour une phrase (« fa, ré♯, mi »).
 */
export function encerclement(accord: AccordJoue, suivant: AccordJoue): Encerclement {
  const tierce = QUALITES[suivant.qualite].guides[0];
  const cible = mod12(suivant.racine + tierce);
  const mode = notesDuMode(accord.racine, accord.mode);
  let dessus = cible;
  for (let d = 1; d <= 2; d++)
    if (mode.includes(mod12(cible + d))) {
      dessus = mod12(cible + d);
      break;
    }
  if (dessus === cible) dessus = mod12(cible + 1);
  const nomCible = spellDegree(suivant.note, tierce === 3 ? 'b3' : '3').toLowerCase();
  const dessous = mod12(cible - 1);
  // Le demi-ton du dessous s'écrit avec la lettre de la cible (ré♯ vers mi), sauf si c'est une note naturelle.
  const nomDessous = NOMS_BEMOLS[dessous] === NOMS_DIESES[dessous] ? NOMS_BEMOLS[dessous]! : NOMS_DIESES[dessous]!;
  return { vers: suivant.nom, dessus: NOMS_BEMOLS[dessus]!, dessous: nomDessous, cible: nomCible };
}

export const nomMode = (acc: AccordJoue) => `${acc.note.toLowerCase()} ${MODES[acc.mode].nom}`;
