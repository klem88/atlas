/**
 * Le Sol suspendu : le V devient IV/V (Sol → Fa/Sol). La basse de dominante reste, mais la sensible disparaît :
 * la tension demeure, sans le tiraillement. Un geste très « chanson » des années 70.
 */
import { accordDuDegre, degre, mod12, type Accord } from '../grille';
import { ecrireAccord, nomAccord, nomNote } from '../orthographe';
import type { Ficelle } from './type';

const suspenduDe = (a: Accord): Accord => ({ root: mod12(a.key + 5), couleur: 'maj', key: a.key, bass: a.root });

export const suspendu: Ficelle = {
  id: 'suspendu',
  nom: 'Le Sol suspendu',
  resume: 'Le V devient IV sur la basse du V : la tension sans le tiraillement.',
  endroits: (g) => g.flatMap((a, i) => (degre(a) === 'V' && a.bass === undefined ? [i] : [])),
  zone: (_g, i) => [i],
  appliquer(g, i) {
    return { grille: g.map((a, k) => (k === i ? suspenduDe(a) : a)), touches: [i] };
  },
  explique(g, i) {
    const a = g[i]!;
    const s = suspenduDe(a);
    const [basse, sensible] = ecrireAccord(a);
    const iv = nomAccord(accordDuDegre('IV', a.key));
    return `${nomAccord(s)} garde la basse ${nomNote(basse!)} mais pose dessus l’accord de ${iv} : plus de ${nomNote(sensible!)}, la sensible. La tension reste, en plus doux.`;
  },
  pourquoiPas: (g) => `Il faut un accord de dominante, le V (par exemple ${nomAccord(accordDuDegre('V', g[0]?.key ?? 0))}).`,
};
