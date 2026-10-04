/**
 * La dominante qui annonce : juste avant un accord, sa septième de dominante (Do – Mi7 – La m). Sa tierce est la
 * sensible de l’accord visé : elle monte d’un demi-ton vers lui, on le sent arriver.
 */
import { dominanteDe, mod12, type Accord, type Grille } from '../grille';
import { ecrireAccord, nomAccord, nomNote } from '../orthographe';
import { MAX_GRILLE, type Ficelle } from './type';

const annonceDeja = (avant: Accord, a: Accord) => avant.root === mod12(a.root + 7) && (avant.couleur === 'maj' || avant.couleur === '7');

function estEndroit(g: Grille, i: number): boolean {
  const a = g[i];
  const avant = g[i - 1];
  return !!a && !!avant && a.couleur !== 'dim' && a.bass === undefined && !annonceDeja(avant, a) && g.length < MAX_GRILLE;
}

export const dominante: Ficelle = {
  id: 'dominante',
  nom: 'La dominante qui annonce',
  resume: `Juste avant un accord, sa dominante : une note monte d’un demi-ton vers lui.`,
  endroits: (g) => g.flatMap((_, i) => (estEndroit(g, i) ? [i] : [])),
  zone: (_g, i) => [i - 1, i],
  appliquer(g, i) {
    return { grille: [...g.slice(0, i), dominanteDe(g[i]!), ...g.slice(i)], touches: [i] };
  },
  explique(g, i) {
    const a = g[i]!;
    const d = dominanteDe(a);
    const sensible = ecrireAccord(d)[1]!;
    const cible = ecrireAccord(a)[0]!;
    return `${nomAccord(d)} annonce ${nomAccord(a)} : son ${nomNote(sensible)} monte d’un demi-ton vers le ${nomNote(cible)}. On sent ${nomAccord(a)} arriver avant qu’il sonne.`;
  },
  pourquoiPas: () => 'Il faut un accord majeur ou mineur, après le premier, qui ne soit pas déjà précédé de sa dominante.',
};
