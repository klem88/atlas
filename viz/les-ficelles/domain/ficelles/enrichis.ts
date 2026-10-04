/**
 * Les accords enrichis : une septième sur les accords de la gamme. 7M sur I et IV, m7 sur ii, iii et vi (des notes de
 * la gamme : l'accord s'adoucit sans changer de rôle), 7 sur V (la septième veut descendre : la dominante tire plus fort).
 */
import { accordDuDegre, degre, type Accord, type Couleur } from '../grille';
import { ecrireAccord, nomAccord, nomNote } from '../orthographe';
import type { Ficelle } from './type';

const SEPTIEME: Readonly<Record<string, Couleur>> = { I: '7M', IV: '7M', ii: 'm7', iii: 'm7', vi: 'm7', V: '7' };

function cible(a: Accord): Couleur | null {
  if ((a.couleur !== 'maj' && a.couleur !== 'min') || a.bass !== undefined) return null;
  return SEPTIEME[degre(a) ?? ''] ?? null;
}

export const enrichis: Ficelle = {
  id: 'enrichis',
  nom: 'Les accords enrichis',
  resume: 'Une septième sur un accord de la gamme : il s\'arrondit sans changer de rôle.',
  endroits: (g) => g.flatMap((a, i) => (cible(a) ? [i] : [])),
  zone: (_g, i) => [i],
  appliquer(g, i) {
    return { grille: g.map((a, k) => (k === i ? { ...a, couleur: cible(a)! } : a)), touches: [i] };
  },
  explique(g, i) {
    const a = g[i]!;
    const b: Accord = { ...a, couleur: cible(a)! };
    const septieme = nomNote(ecrireAccord(b)[3]!);
    if (degre(a) === 'V')
      return `${nomAccord(a)} devient ${nomAccord(b)} : on ajoute ${septieme}, la septième. Elle veut descendre d\'un demi-ton : la dominante tire plus fort vers ${nomAccord(accordDuDegre('I', a.key))}.`;
    return `${nomAccord(a)} devient ${nomAccord(b)} : on ajoute ${septieme}, la septième, une note de la gamme. L\'accord garde son rôle, il devient plus doux, plus rond.`;
  },
  pourquoiPas: () => 'Tous les accords de la gamme sont déjà enrichis, ou renversés (un accord sur une autre basse reste tel quel).',
};
