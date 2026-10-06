/**
 * Main gauche : notes guides (deux sons) ou voicings sans fondamentale (quatre sons, Bill Evans).
 * Toujours en position serrée, entre ré3 et sol4, et en bougeant le moins possible d'un accord au suivant :
 * c'est ce qui fait entendre les voix qui descendent d'un demi-ton.
 */
import { QUALITES, voicingDe, type AccordJoue } from './progressions';

export type Main = 'guides' | 'sansFondamentale';

/** Zone de la main gauche, en MIDI (ré3 à sol4). */
export const BAS = 50;
export const HAUT = 67;
const CENTRE = 58;

const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** Toutes les positions serrées de ces classes de hauteur dont la note du bas est l'une de `bases`. */
export function positions(racine: number, intervalles: readonly number[], bases: readonly number[]): number[][] {
  const pcs = intervalles.map((i) => mod12(racine + i));
  const out: number[][] = [];
  for (const b of bases) {
    const bas = mod12(racine + b);
    const dessus = pcs.filter((p) => p !== bas).map((p) => mod12(p - bas)).sort((x, y) => x - y);
    for (let midi = BAS - (BAS % 12) + bas - 12; midi <= HAUT; midi += 12) {
      if (midi < BAS) continue;
      const v = [midi, ...dessus.map((d) => midi + d)];
      if (v[v.length - 1]! <= HAUT) out.push(v);
    }
  }
  return out;
}

const mouvement = (a: readonly number[], b: readonly number[]) => a.reduce((s, n, i) => s + Math.abs(n - b[i]!), 0);
const moyenne = (v: readonly number[]) => v.reduce((s, n) => s + n, 0) / v.length;

/**
 * Le meilleur enchaînement sur toute la grille, retour au début compris (la grille tourne en boucle) :
 * le moins de mouvement possible, puis le plus près du centre de la zone. Programmation dynamique, refaite
 * pour chaque voicing de départ possible ; choisir accord par accord coincerait la main au bord de la zone.
 */
export function voicingsMainGauche(accords: readonly AccordJoue[], main: Main): number[][] {
  // Formes A et B : la 3ce ou la 7e en bas.
  const candidats = accords.map((acc) => {
    const q = QUALITES[acc.qualite];
    return positions(acc.racine, main === 'guides' ? q.guides : voicingDe(acc), q.guides);
  });
  const centre = (v: readonly number[]) => Math.abs(moyenne(v) - CENTRE);
  let meilleur: { cout: number; choix: number[][] } | null = null;
  for (const depart of candidats[0]!) {
    let couts = [centre(depart)];
    let prec: number[][] = [depart];
    const retours: number[][] = [];
    for (let i = 1; i < candidats.length; i++) {
      const suivants = candidats[i]!.map((v) => {
        let best = 0;
        let bestCout = Infinity;
        prec.forEach((u, j) => {
          const c = couts[j]! + mouvement(v, u) * 10;
          if (c < bestCout) {
            bestCout = c;
            best = j;
          }
        });
        return { cout: bestCout + centre(v), retour: best };
      });
      couts = suivants.map((x) => x.cout);
      retours.push(suivants.map((x) => x.retour));
      prec = candidats[i]!;
    }
    // Retour au début de la boucle : les grilles qui descendent par quintes font glisser la main vers le grave,
    // il faut remonter une fois par tour ; le saut coûte moins ici, au début de la grille, qu'en plein milieu.
    const finaux = prec.map((u, j) => couts[j]! + (candidats.length > 1 ? mouvement(depart, u) * 3 : 0));
    let k = finaux.indexOf(Math.min(...finaux));
    const cout = finaux[k]!;
    if (meilleur && cout >= meilleur.cout) continue;
    const choix: number[][] = [prec[k]!];
    for (let i = retours.length - 1; i >= 0; i--) {
      k = retours[i]![k]!;
      choix.unshift(i === 0 ? depart : candidats[i]![k]!);
    }
    if (candidats.length === 1) choix.splice(0, choix.length, depart);
    meilleur = { cout, choix };
  }
  return meilleur!.choix;
}
