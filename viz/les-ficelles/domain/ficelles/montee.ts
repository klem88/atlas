/**
 * La montée finale : la progression rejouée un ton plus haut, amenée par la dominante de la nouvelle tonalité
 * (… Sol – La7 – Ré …). Le geste des derniers refrains. Une seule fois : ensuite, la grille n'a plus une seule tonalité.
 */
import { accordDuDegre, mod12, transposer, type Accord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { MAX_GRILLE, type Ficelle } from './type';

const MONTEE = 2;
const nouvelle = (g: Grille) => mod12(g[0]!.key + MONTEE);
const dominanteDe = (k: number): Accord => ({ root: mod12(k + 7), couleur: '7', key: k });

export const montee: Ficelle = {
  id: 'montee',
  nom: 'La montée finale',
  resume: 'Toute la progression, rejouée un ton plus haut : le geste des derniers refrains.',
  endroits: (g) => (g.length >= 2 && g.every((a) => a.key === g[0]!.key) && 2 * g.length + 1 <= MAX_GRILLE ? [g.length - 1] : []),
  zone: (_g, i) => [i],
  appliquer(g) {
    const haut = g.map((a) => transposer(a, MONTEE));
    return {
      grille: [...g, dominanteDe(nouvelle(g)), ...haut],
      touches: [g.length, ...haut.map((_, j) => g.length + 1 + j)],
    };
  },
  explique(g) {
    const k = nouvelle(g);
    return `${nomAccord(dominanteDe(k))}, la dominante de ${nomAccord(accordDuDegre('I', k))}, fait monter toute la progression d'un ton : le même chemin, plus haut, plus lumineux. C'est le geste des derniers refrains.`;
  },
  pourquoiPas: () => 'La progression est déjà montée une fois, ou elle est trop longue pour être rejouée plus haut.',
};
