/**
 * Les notes des deux mains, accord par accord, toujours en bougeant le moins possible d'un accord au suivant :
 * c'est ce qui fait entendre les voix qui descendent d'un demi-ton.
 *
 * - Main gauche, en piano solo : un « shell » à la Bud Powell, la fondamentale grave et la 7e ou la 3ce juste
 *   au-dessus (`shells`).
 * - Main droite : les notes guides (deux sons) ou le voicing sans fondamentale (quatre sons, Bill Evans), en position
 *   serrée autour du do central (`voicings`). Au palier 1, la seule note guide que le shell ne joue pas (`autresGuides`).
 */
import { QUALITES, voicingDe, type AccordJoue } from './progressions';

export type Main = 'guides' | 'sansFondamentale';

export interface Zone {
  bas: number;
  haut: number;
  centre: number;
}

/** Zone des voicings de main droite, en MIDI (la3 à fa5). */
export const ZONE_MD: Zone = { bas: 57, haut: 77, centre: 66 };
/** Zone de la fondamentale des shells, en MIDI (mi2 à mi3) ; la note du dessus monte jusqu'à ré♯4. */
export const BASSE_BAS = 40;
export const BASSE_HAUT = 52;
const BASSE_CENTRE = 45;
/** Zone de la note guide de main droite au palier 1 (sol3 à do5) : assez bas pour que do4 descende sur si3. */
const GUIDE_BAS = 55;
const GUIDE_HAUT = 72;

const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** Toutes les positions serrées de ces classes de hauteur dont la note du bas est l'une de `bases`. */
export function positions(racine: number, intervalles: readonly number[], bases: readonly number[], zone: Zone = ZONE_MD): number[][] {
  const pcs = intervalles.map((i) => mod12(racine + i));
  const out: number[][] = [];
  for (const b of bases) {
    const bas = mod12(racine + b);
    const dessus = pcs.filter((p) => p !== bas).map((p) => mod12(p - bas)).sort((x, y) => x - y);
    for (let midi = zone.bas - (zone.bas % 12) + bas - 12; midi <= zone.haut; midi += 12) {
      if (midi < zone.bas) continue;
      const v = [midi, ...dessus.map((d) => midi + d)];
      if (v[v.length - 1]! <= zone.haut) out.push(v);
    }
  }
  return out;
}

const mouvement = (a: readonly number[], b: readonly number[]) => a.reduce((s, n, i) => s + Math.abs(n - b[i]!), 0);
const moyenne = (v: readonly number[]) => v.reduce((s, n) => s + n, 0) / v.length;

/**
 * Le meilleur enchaînement sur toute la grille, retour au début compris (la grille tourne en boucle) :
 * le moins de mouvement possible, puis le plus près du centre de la zone. Programmation dynamique, refaite
 * pour chaque position de départ ; choisir accord par accord coincerait la main au bord de la zone.
 */
export function enchainement(candidats: readonly (readonly number[][])[], centre: number): number[][] {
  const ecart = (v: readonly number[]) => Math.abs(moyenne(v) - centre);
  let meilleur: { cout: number; choix: number[][] } | null = null;
  for (const depart of candidats[0]!) {
    let couts = [ecart(depart)];
    let prec: readonly number[][] = [depart];
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
        return { cout: bestCout + ecart(v), retour: best };
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

/** Notes guides (deux sons) ou voicings sans fondamentale (quatre sons), formes A et B : la 3ce ou la 7e en bas. */
export function voicings(accords: readonly AccordJoue[], main: Main, zone: Zone = ZONE_MD): number[][] {
  const candidats = accords.map((acc) => {
    const q = QUALITES[acc.qualite];
    return positions(acc.racine, main === 'guides' ? q.guides : voicingDe(acc), q.guides, zone);
  });
  return enchainement(candidats, zone.centre);
}

/** Shells de main gauche : fondamentale, puis la 3ce ou la 7e juste au-dessus. */
export function shells(accords: readonly AccordJoue[]): number[][] {
  const candidats = accords.map((acc) => {
    const out: number[][] = [];
    for (let r = BASSE_BAS; r <= BASSE_HAUT; r++)
      if (mod12(r) === acc.racine) for (const g of QUALITES[acc.qualite].guides) out.push([r, r + g]);
    return out;
  });
  return enchainement(candidats, BASSE_CENTRE + 5);
}

/** Palier 1, main droite : la note guide que le shell ne joue pas, une seule note, au plus près de la précédente. */
export function autresGuides(accords: readonly AccordJoue[], mg: readonly (readonly number[])[]): number[][] {
  let prec = 64;
  return accords.map((acc, i) => {
    const deShell = mod12(mg[i]![1]!);
    const pc = QUALITES[acc.qualite].guides.map((g) => mod12(acc.racine + g)).find((p) => p !== deShell)!;
    let best = -1;
    for (let m = GUIDE_BAS; m <= GUIDE_HAUT; m++) if (mod12(m) === pc && (best < 0 || Math.abs(m - prec) < Math.abs(best - prec))) best = m;
    prec = best;
    return [best];
  });
}
