/**
 * L’emprunt mineur : après un IV qui va vers le I ou le V, on glisse le iv (Fa – Fa m – Do). Sa tierce descend d’un
 * demi-ton : une note prise au mode mineur, la lumière baisse un instant.
 */
import { accordDuDegre, degre, type Accord, type Grille } from '../grille';
import { ecrireAccord, nomAccord, nomNote } from '../orthographe';
import { MAX_GRILLE, type Ficelle } from './type';

/** Le même accord en mineur (sa fondamentale garde sa lettre ; l’endroit n’a pas de basse écrite). */
const ivDe = (a: Accord): Accord => ({ ...a, couleur: 'min' });

function estEndroit(g: Grille, i: number): boolean {
  const a = g[i];
  const b = g[i + 1];
  return !!a && !!b && degre(a) === 'IV' && a.bass === undefined && b.key === a.key && (degre(b) === 'I' || degre(b) === 'V') && g.length < MAX_GRILLE;
}

export const emprunt: Ficelle = {
  id: 'emprunt',
  nom: `L’emprunt mineur`,
  resume: `Le IV devient mineur un instant : une note descend d’un demi-ton, la lumière baisse.`,
  endroits: (g) => g.flatMap((_, i) => (estEndroit(g, i) ? [i] : [])),
  zone: (_g, i) => [i, i + 1],
  appliquer(g, i) {
    return { grille: [...g.slice(0, i + 1), ivDe(g[i]!), ...g.slice(i + 1)], touches: [i + 1] };
  },
  explique(g, i) {
    const a = g[i]!;
    const iv = ivDe(a);
    const tierce = ecrireAccord({ ...a, couleur: 'maj' })[1]!;
    const tierceMineure = ecrireAccord(iv)[1]!;
    return `Entre ${nomAccord(a)} et ${nomAccord(g[i + 1]!)}, ${nomAccord(iv)} : le ${nomNote(tierce)} descend au ${nomNote(tierceMineure)}, une note empruntée au mode mineur. La lumière baisse un instant.`;
  },
  pourquoiPas(g) {
    const k = g[0]?.key ?? 0;
    const [iv, i, v] = (['IV', 'I', 'V'] as const).map((l) => nomAccord(accordDuDegre(l, k)));
    return `Il faut un IV suivi du I ou du V (par exemple ${iv} puis ${i}, ou ${iv} puis ${v}).`;
  },
};
