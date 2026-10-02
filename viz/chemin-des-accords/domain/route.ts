/**
 * La route vers une tonalité : de voisine en voisine sur le cycle des quintes, et pour la prochaine voisine (« l’étape »),
 * une recette de trois ou quatre accords (un commun, celui qui fait pencher, celui qui confirme, la nouvelle tonique),
 * les portes (ce qui mène, ce qui ramène) et le guide de chaque accord de la carte.
 */
import { diatonicChords, fifthsOffset, mod12, roleOf, sameChord, type Chord } from '../../suis-les-fleches/domain/harmony';
import type { Journey } from './journey';

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

export function routeTo(j: Journey, target: number): Route | null {
  const t = mod12(target);
  if (j.key === t) return null;
  const hops = hopsTo(j.key, t);
  const hop = hops[0]!;
  const sharp = mod12(hop - j.key) === 7;
  // Vers les dièses : vi (= ii de l’étape), V/V, iii de l’étape. Vers les bémols : ii (= vi de l’étape), ♭VII, ii de l’étape.
  const pivot = sharp ? m(j.key + 9) : m(j.key + 2);
  const frolant = sharp ? M(j.key + 2) : M(j.key + 10);
  const confirm = sharp ? m(hop + 4) : m(hop + 2);
  const last = j.steps[j.steps.length - 1]?.chord ?? null;
  const plan: [Chord, RecipeWhy][] =
    j.leaning === hop
      ? [
          [confirm, 'confirme'],
          [M(hop), 'arrivee'],
        ]
      : [...(last && sameChord(last, pivot) ? [] : [[pivot, 'pivot'] as [Chord, RecipeWhy]]), [frolant, 'frole'], [confirm, 'confirme'], [M(hop), 'arrivee']];
  const recipe = plan.map(([chord, why]) => ({ chord, why, here: roleOf(chord, j.key).label, there: roleOf(chord, hop).label }));
  return { target: t, hop, hops, recipe, ...doors(j.key, hop) };
}

export function guideOf(c: Chord, r: Route, key: number): Guide {
  if (r.pass.some((x) => sameChord(x, c))) return 'mene';
  const here = inKey(c, key);
  const there = inKey(c, r.hop);
  if (here && there) return 'commun';
  if (here) return 'ramene';
  return 'neutre';
}
