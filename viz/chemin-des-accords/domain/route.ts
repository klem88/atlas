/**
 * La route vers une tonalité : de voisine en voisine sur le cycle des quintes, et pour la prochaine voisine (« l’étape »),
 * une recette de trois ou quatre accords (un commun, celui qui fait pencher, celui qui confirme, la nouvelle tonique),
 * les portes (ce qui mène, ce qui ramène) et le guide de chaque accord de la carte.
 * La recette est construite en rejouant la règle du parcours (`journeyOf`) : chaque accord proposé fait vraiment ce
 * qu’il annonce à la suite du chemin déjà joué (boucles, accords qui ne frôlent plus, répétitions compris).
 */
import { diatonicChords, fifthsOffset, mod12, roleOf, sameChord, type Chord } from '../../suis-les-fleches/domain/harmony';
import { journeyOf, type Journey, type StepEvent } from './journey';

export type Guide = 'mene' | 'commun' | 'ramene' | 'neutre';
export type RecipeWhy = 'pivot' | 'frole' | 'confirme' | 'arrivee';

export interface RecipeStep {
  chord: Chord;
  why: RecipeWhy;
  /** Son degré dans la tonalité du moment, et dans l’étape. */
  here: string;
  there: string;
}

export interface Route {
  /** La destination, l’étape (prochaine voisine), et toutes les tonalités traversées jusqu’à la destination. */
  target: number;
  hop: number;
  hops: number[];
  recipe: RecipeStep[];
  /** Les accords qui n’existent que dans l’étape (ils y mènent), et ceux qui n’existent que dans la tonalité du moment (ils ramènent). */
  pass: Chord[];
  back: Chord[];
}

const inKey = (c: Chord, key: number) => roleOf(c, key).kind === 'diatonique';
const M = (root: number): Chord => ({ root: mod12(root), cls: 'maj' });
const m = (root: number): Chord => ({ root: mod12(root), cls: 'min' });
const dim = (root: number): Chord => ({ root: mod12(root), cls: 'dim' });

/** La voisine sur le cycle des quintes en direction de `target` (à six crans : côté dièses). */
export function nextHop(from: number, target: number): number {
  const off = fifthsOffset(from, target);
  return off === 0 ? mod12(from) : mod12(from + (off > 0 ? 7 : 5));
}

export function hopsTo(from: number, target: number): number[] {
  const out: number[] = [];
  let k = mod12(from);
  while (k !== mod12(target)) {
    k = nextHop(k, target);
    out.push(k);
  }
  return out;
}

export function doors(from: number, to: number): { pass: Chord[]; back: Chord[] } {
  return {
    pass: diatonicChords(to).map((d) => d.chord).filter((c) => !inKey(c, from)),
    back: diatonicChords(from).map((d) => d.chord).filter((c) => !inKey(c, to)),
  };
}

/**
 * Si la page penche vers une autre tonalité que l’étape (par un accord chromatique), la recette part de la tonalité
 * du moment : ses premiers pas peuvent éteindre ce frôlement lointain.
 */
export function routeTo(j: Journey, target: number): Route | null {
  const t = mod12(target);
  if (j.key === t) return null;
  const hops = hopsTo(j.key, t);
  const hop = hops[0]!;
  const sharp = mod12(hop - j.key) === 7;
  // Le pivot : vi du moment (= ii de l’étape) côté dièses, ii du moment (= vi de l’étape) côté bémols.
  const pivot = sharp ? m(j.key + 9) : m(j.key + 2);
  // Par ordre de préférence. Dièses : V/V, iii de l’étape, vii° de l’étape. Bémols : ♭VII, v (= ii de l’étape), vii° de l’étape.
  const leaners = sharp ? [M(j.key + 2), m(hop + 4), dim(hop + 11)] : [M(j.key + 10), m(j.key + 7), dim(hop + 11)];
  const confirmers = sharp ? [m(hop + 4), M(j.key + 2), dim(hop + 11)] : [m(hop + 2), M(j.key + 10), dim(hop + 11)];

  const played = j.steps.map((s) => s.chord);
  const after = (extra: Chord[]) => journeyOf(j.home, [...played, ...extra]);
  const lastEvent = (extra: Chord[]): StepEvent | undefined => after(extra).steps.at(-1)?.event;
  const leansWith = (extra: Chord[]) => {
    const e = lastEvent(extra);
    return e?.kind === 'frole' && e.target === hop;
  };
  const confirmsWith = (extra: Chord[]) => {
    const e = lastEvent(extra);
    return e?.kind === 'confirme' && e.to === hop;
  };
  const lastOf = (extra: Chord[]): Chord | null => extra.at(-1) ?? played.at(-1) ?? null;
  const differs = (c: Chord, extra: Chord[]) => {
    const last = lastOf(extra);
    return !last || !sameChord(last, c);
  };

  const all = doors(j.key, hop);
  // Les portes : seulement les accords qui, joués maintenant, font pencher vers l’étape ou y font passer.
  const gates = { pass: all.pass.filter((c) => leansWith([c]) || confirmsWith([c])), back: all.back };
  const chosen: [Chord, RecipeWhy][] = [];
  const steps = (): Route => ({
    target: t,
    hop,
    hops,
    recipe: chosen.map(([chord, why]) => ({ chord, why, here: roleOf(chord, j.key).label, there: roleOf(chord, hop).label })),
    ...gates,
  });

  if (j.leaning !== hop) {
    // Faire pencher : d’abord par le pivot (sauf s’il vient d’être joué), sinon directement.
    const withPivot = differs(pivot, []) ? [pivot] : [];
    const tryLean = (prefix: Chord[]) => leaners.find((c) => leansWith([...prefix, c]));
    let lean = tryLean(withPivot);
    let prefix = withPivot;
    if (!lean && withPivot.length) {
      lean = tryLean([]);
      prefix = [];
    }
    if (!lean) return { ...steps(), recipe: [] };
    for (const c of prefix) chosen.push([c, 'pivot']);
    chosen.push([lean, 'frole']);
  }

  // Confirmer : un accord propre à l’étape, qui ne rejoue pas le dernier et ne ferme pas une boucle.
  const sofar = () => chosen.map(([c]) => c);
  const tryConfirm = (prefix: Chord[]) => confirmers.find((c) => differs(c, prefix) && confirmsWith([...prefix, c]));
  const direct = tryConfirm(sofar());
  if (direct) chosen.push([direct, 'confirme']);
  else {
    // Sinon, un accord commun aux deux tonalités (le pivot d’abord), qui n’est ni la tonique du moment ni le dernier joué.
    const tonic = M(j.key);
    const commons = [pivot, ...diatonicChords(j.key).map((d) => d.chord).filter((c) => inKey(c, hop) && !sameChord(c, pivot))].filter(
      (c) => !sameChord(c, tonic) && differs(c, sofar()),
    );
    let found: [Chord, Chord] | null = null;
    for (const x of commons) {
      const c = tryConfirm([...sofar(), x]);
      if (c) {
        found = [x, c];
        break;
      }
    }
    if (!found) return { ...steps(), recipe: [] };
    chosen.push([found[0], 'pivot'], [found[1], 'confirme']);
  }

  if (differs(M(hop), sofar())) chosen.push([M(hop), 'arrivee']);
  return steps();
}

export function guideOf(c: Chord, r: Route, key: number): Guide {
  if (r.pass.some((x) => sameChord(x, c))) return 'mene';
  const here = inKey(c, key);
  const there = inKey(c, r.hop);
  if (here && there) return 'commun';
  if (here) return 'ramene';
  return 'neutre';
}
