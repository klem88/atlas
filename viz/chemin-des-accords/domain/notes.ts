/**
 * Les mots de la page : la légende d'un pas (une seule à la fois, par priorité), la phrase « où je suis », les bulles.
 * Les légendes d'apprentissage (`once`) ne paraissent qu'une fois par visite : la page tient la liste de celles déjà vues.
 */
import { chordAt, fifthsOffset, keyName, nameOf, roleOf, sameChord, type Chord } from '../../suis-les-fleches/domain/harmony';
import { chordByLabel } from '../../suis-les-fleches/domain/layout';
import { roleText } from '../../suis-les-fleches/domain/moves';
import type { Candidate } from './halos';
import type { Journey } from './journey';
import { doors, type RecipeStep } from './route';

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

/** « Do – Si♭ en boucle : le son du rock (mode mixolydien). On reste en Do : Si♭ est une couleur, pas une destination. » */
function loopText(tonic: Chord, c: Chord, label: string, key: number): string {
  const why = label === '♭VII' ? 'le son du rock (mode mixolydien)' : 'une couleur qui revient';
  return `${nameOf(tonic)} – ${nameOf(c)} en boucle : ${why}. On reste en ${short(key)} : ${nameOf(c)} est une couleur, pas une destination.`;
}

/** « A », « A ou B », « A, B ou C ». */
function either(chords: readonly Chord[]): string {
  const names = chords.map(nameOf);
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} ou ${names[names.length - 1]}`;
}

const CRANS: Record<number, string> = { 2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six' };
const capital = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Les accords qui feraient passer vers `target` (sauf celui qui a frôlé) et ceux qui ramènent dans `key`. */
function doorsOf(key: number, target: number, frolant: Chord) {
  const d = doors(key, target);
  return { pass: d.pass.filter((c) => !sameChord(c, frolant)), back: d.back };
}

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
    case 'frole': {
      const head = `${nameOf(c)} n’est pas dans ${keyName(last.key)} : il tire vers ${keyName(e.target)}`;
      if (Math.abs(fifthsOffset(last.key, e.target)) !== 1) {
        return ev('frole', `${head}, à ${CRANS[Math.abs(fifthsOffset(last.key, e.target))]} crans. Un accord qui n’existe qu’en ${short(e.target)} y fera passer ; un accord qui n’existe qu’en ${short(last.key)} te ramènera.`);
      }
      const { pass, back } = doorsOf(last.key, e.target, c);
      const parts = [
        pass.length ? `pour y passer, joue ${either(pass)} (${pass.length > 1 ? 'ils n’existent' : 'il n’existe'} qu’en ${short(e.target)})` : '',
        back.length ? `pour rester en ${short(last.key)}, joue ${either(back)}` : '',
      ].filter(Boolean);
      return ev('frole', `${head}.${parts.length ? ` ${capital(parts.join(' ; '))}.` : ''}`);
    }
    case 'suspens': {
      const head = `${nameOf(c)} est en ${short(last.key)} comme en ${short(e.target)} : on ne sait pas encore.`;
      if (Math.abs(fifthsOffset(last.key, e.target)) !== 1) return ev('suspens', head);
      const { pass, back } = doorsOf(last.key, e.target, j.steps[j.pending ?? n - 1]!.chord);
      const parts = [
        pass.length ? `${either(pass)} passerai${pass.length > 1 ? 'ent' : 't'} en ${short(e.target)}` : '',
        back.length ? `${either(back)} ramènerai${back.length > 1 ? 'ent' : 't'} en ${short(last.key)}` : '',
      ].filter(Boolean);
      return ev('suspens', `${head}${parts.length ? ` ${capital(parts.join(' ; '))}.` : ''}`);
    }
    case 'boucle':
      return ev('boucle', loopText(j.steps[n - 2]!.chord, c, last.label, j.key));
    case 'couleur': {
      if (e.cause === 'dominante') {
        const target = chordAt(j.key, chordByLabel(e.anchor)!.degree);
        return ev('couleur', `${nameOf(c)} pointe vers ${nameOf(target)} : il l’éclaire sans quitter ${keyName(j.key)} (une dominante secondaire).`);
      }
      const before = j.steps[n - 2];
      const twoBefore = j.steps[n - 3];
      if (before && twoBefore && before.label === 'I' && sameChord(twoBefore.chord, c)) {
        return ev('boucle', loopText(before.chord, c, last.label, j.key));
      }
      return ev('emprunt', `${nameOf(c)} vient de ${short(j.key)} mineur : une ombre passagère, on reste en ${short(j.key)}.`);
    }
    default:
      break;
  }
  // Rejouer le même accord n'est pas un « pas » : il n'est jamais parmi les candidats, sa part vaut 0 sans être rare.
  if (ctx.share !== null && ctx.share < 0.01 && n > 1 && e.kind !== 'repete') return ev('rare', `Peu de chansons font ce pas. Rien n’est interdit : à toi de juger à l’oreille.`);
  if (n === 1 && !ctx.seen.has('halos'))
    return { kind: 'halos', text: `Les halos montrent où vont les chansons après ${nameOf(c)} : plus il est grand, plus le pas est courant.`, once: true };
  if (ctx.satellites > 0 && !ctx.seen.has('satellite'))
    return { kind: 'satellite', text: 'En pointillés : un accord hors de la gamme, que les chansons jouent souvent ici.', once: true };
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

const WHY: Record<RecipeStep['why'], (s: RecipeStep, key: number, hop: number, home: number, target: number) => string> = {
  pivot: (s, key, hop) => `commun : ${s.here} en ${short(key)}, ${s.there} en ${short(hop)}`,
  frole: (s, _key, hop) => `tire vers ${short(hop)} (${s.here})`,
  confirme: (_s, _key, hop) => `n’existe qu’en ${short(hop)} : confirmé`,
  arrivee: (_s, _key, hop, home, target) => `${short(hop)}, ${hop === home ? 'la maison' : hop === target ? 'la nouvelle maison' : `une étape vers ${short(target)}`}`,
};

/** `key` : tonalité du moment ; `hop` : l’étape ; `home` : la maison ; `target` : la destination (l’étape par défaut). */
export const recipeText = (s: RecipeStep, key: number, hop: number, home: number, target = hop) => WHY[s.why](s, key, hop, home, target);

export const arrivalText = (t: number) => `Te voilà en ${keyName(t)}.`;

export const DEST_HINT = 'Touche une tonalité de l’anneau pour t’y rendre : la carte te montrera le chemin.';

export interface StepCard {
  name: string;
  key: string;
  degree: string;
  role: string;
  did: string;
}

/** La fiche d'un accord du chemin : où il est, ce qu'il est, ce qu'il a fait. */
export function stepCard(j: Journey, i: number): StepCard {
  const s = j.steps[i]!;
  const e = s.event;
  const confirm = s.pivot ? j.steps.find((x) => x.event.kind === 'confirme' && x.event.pivot === i) : undefined;
  const from = confirm && confirm.event.kind === 'confirme' ? confirm.event.from : s.key;
  let did = '';
  switch (e.kind) {
    case 'gamme':
      did = i === 0 ? 'il ouvre le chemin' : 'il reste dans la tonalité';
      break;
    case 'repete':
      did = 'il se répète';
      break;
    case 'couleur':
      did =
        e.cause === 'emprunt'
          ? `une couleur empruntée à ${short(s.key)} mineur, sans quitter la tonalité`
          : `il éclaire ${nameOf(chordAt(s.key, chordByLabel(e.anchor)!.degree))} sans quitter la tonalité`;
      break;
    case 'frole':
      did = `il a fait pencher vers ${keyName(e.target)}`;
      break;
    case 'suspens':
      did = 'commun aux deux tonalités, il a laissé la question ouverte';
      break;
    case 'confirme':
      did = `il a confirmé le passage en ${keyName(e.to)}`;
      break;
    case 'eteint':
      did = `il a ramené en ${keyName(s.key)} : ${nameOf(j.steps[e.frole]!.chord)} n’était qu’un détour`;
      break;
    case 'boucle':
      did = 'un aller-retour autour de la tonique : une couleur, pas une destination';
      break;
  }
  if (s.pivot) did += ` ; il est devenu le pivot (${s.pivot.after} en ${short(s.key)})`;
  return {
    name: nameOf(s.chord),
    key: s.pivot ? `${keyName(from)}, puis ${keyName(s.key)}` : keyName(s.key),
    degree: s.pivot ? `${s.pivot.before} en ${short(from)}, ${s.pivot.after} en ${short(s.key)}` : s.label,
    role: roleText(s.chord, s.key),
    did: `${did}.`,
  };
}
