/**
 * Les mots de la page : la légende d'un pas (une seule à la fois, par priorité), la phrase « où je suis », les bulles.
 * Les légendes d'apprentissage (`once`) ne paraissent qu'une fois par visite : la page tient la liste de celles déjà vues.
 */
import { chordAt, fifthsOffset, keyName, nameOf, roleOf, sameChord, type Chord } from '../../suis-les-fleches/domain/harmony';
import { chordByLabel } from '../../suis-les-fleches/domain/layout';
import type { Candidate } from './halos';
import type { Journey } from './journey';

export type NoteKind = 'retour' | 'confirme' | 'eteint' | 'frole' | 'suspens' | 'boucle' | 'emprunt' | 'couleur' | 'rare' | 'satellite' | 'halos' | 'depart';

export interface Note {
  kind: NoteKind;
  text: string;
  once: boolean;
}

export interface NoteContext {
  /** Part du corpus du pas qu'on vient de faire (`null` : premier accord, ou pas inconnu). */
  share: number | null;
  /** Nombre de satellites affichés maintenant. */
  satellites: number;
  seen: ReadonlySet<NoteKind>;
}

/** « Sol », pour une tonalité dite en court. */
const short = (tonic: number) => nameOf({ root: tonic, cls: 'maj' });

export const pct = (share: number) => (share < 0.01 ? '< 1 %' : `${Math.round(share * 100)} %`);

export function noteFor(j: Journey, ctx: NoteContext): Note | null {
  const n = j.steps.length;
  if (n === 0) return { kind: 'depart', text: 'Touche un accord pour commencer. Depuis la maison, tout est possible.', once: false };
  const last = j.steps[n - 1]!;
  const c = last.chord;
  const e = last.event;
  const ev = (kind: NoteKind, text: string): Note => ({ kind, text, once: false });

  switch (e.kind) {
    case 'confirme': {
      if (e.to === j.home) return ev('retour', `De retour en ${keyName(j.home)}, la maison.`);
      const p = j.steps[e.pivot]!;
      return ev(
        'confirme',
        `${nameOf(c)} n’existe qu’en ${keyName(e.to)} : on y est. ${nameOf(p.chord)} a servi de pivot : ${p.pivot!.before} en ${short(e.from)}, ${p.pivot!.after} en ${short(e.to)}.`,
      );
    }
    case 'eteint': {
      const frolant = nameOf(j.steps[e.frole]!.chord);
      const head = roleOf(c, j.key).kind === 'diatonique' ? `${nameOf(c)} n’existe qu’en ${keyName(j.key)}` : `${nameOf(c)} ramène en ${keyName(j.key)}`;
      return ev('eteint', `${head} : ${frolant} n’était qu’un détour vers ${keyName(e.target)} (on dit une tonicisation).`);
    }
    case 'frole':
      return ev('frole', `${nameOf(c)} n’est pas dans ${keyName(last.key)} : il tire vers ${keyName(e.target)}. Si un accord propre à ${short(e.target)} suit, on aura modulé.`);
    case 'suspens':
      return ev('suspens', `${nameOf(c)} est en ${short(last.key)} comme en ${short(e.target)} : on ne sait pas encore.`);
    case 'couleur': {
      if (e.cause === 'dominante') {
        const target = chordAt(j.key, chordByLabel(e.anchor)!.degree);
        return ev('couleur', `${nameOf(c)} pointe vers ${nameOf(target)} : il l’éclaire sans quitter ${keyName(j.key)} (une dominante secondaire).`);
      }
      const before = j.steps[n - 2];
      const twoBefore = j.steps[n - 3];
      if (before && twoBefore && before.label === 'I' && sameChord(twoBefore.chord, c)) {
        const loop = `${nameOf(before.chord)} – ${nameOf(c)} en boucle`;
        const why = last.label === '♭VII' ? 'le son du rock (mode mixolydien)' : `une couleur qui revient`;
        return ev('boucle', `${loop} : ${why}. On reste en ${short(j.key)} : ${nameOf(c)} est une couleur, pas une destination.`);
      }
      return ev('emprunt', `${nameOf(c)} vient de ${short(j.key)} mineur : une ombre passagère, on reste en ${short(j.key)}.`);
    }
    default:
      break;
  }
  if (ctx.share !== null && ctx.share < 0.01 && n > 1) return ev('rare', `Peu de chansons font ce pas. Rien n’est interdit : à toi de juger à l’oreille.`);
  if (ctx.satellites > 0 && !ctx.seen.has('satellite'))
    return { kind: 'satellite', text: 'En pointillés : un accord hors de la gamme, que les chansons jouent souvent ici.', once: true };
  if (n === 1 && !ctx.seen.has('halos'))
    return { kind: 'halos', text: `Les halos montrent où vont les chansons après ${nameOf(c)} : plus il est grand, plus le pas est courant.`, once: true };
  return null;
}

/** Sous « Tu es en Sol majeur » : d'où l'on vient, ou ce qui est en suspens. */
export function whereText(j: Journey): string {
  if (j.leaning !== null) return `on penche vers ${keyName(j.leaning)}`;
  const off = fifthsOffset(j.home, j.key);
  if (off === 0) return 'la maison';
  if (Math.abs(off) === 6) return `parti de ${keyName(j.home)}, à l’autre bout du cycle des quintes`;
  const crans = Math.abs(off) === 1 ? 'un cran' : `${Math.abs(off)} crans`;
  return `parti de ${keyName(j.home)}, ${crans} vers les ${off > 0 ? 'dièses' : 'bémols'}`;
}

export const haloTip = (from: Chord, c: Candidate) =>
  c.share === null ? `${nameOf(c.chord)} : ${c.label}.` : `${pct(c.share)} des chansons qui jouent ${nameOf(from)} font ensuite ${nameOf(c.chord)}.`;

export const pivotTip = (chord: Chord, before: string, after: string) => `${nameOf(chord)} appartient aux deux tonalités : ${before} avant, ${after} après.`;

export const RING_TIP = `Les douze tonalités majeures, rangées par quintes : deux voisines partagent presque tous leurs accords. En pointillés, la maison ; en couleur, où tu es.`;
export const RIBBON_TIP = `Ta progression, accord par accord. Chaque bande est une tonalité ; un accord pivot est à cheval sur deux bandes.`;
