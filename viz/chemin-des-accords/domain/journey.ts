/**
 * Le parcours : à partir de la maison et des accords posés, la tonalité de chaque pas.
 * Un accord hors de la tonalité « frôle » une autre tonalité ; le premier accord qui n'appartient qu'à l'une des deux
 * tranche (confirmation : on a modulé ; sinon le frôlement s'éteint, c'était un détour). Les emprunts au mineur et les
 * dominantes secondaires de cibles mineures sont des couleurs : elles ne frôlent rien.
 * Symétrie : ♭VII et v (emprunts) penchent vers la sous-dominante, comme V/V penche vers la dominante.
 * Une boucle (aller-retour autour de la tonique, comme Do – Si♭ – Do – Si♭) reste en tonique : l'accord frôleur devient une couleur.
 * Tout se recalcule de zéro à chaque geste ; annuler, c'est recalculer sans le dernier accord.
 */
import { chordAt, chordId, keysContaining, mod12, roleOf, sameChord, type Chord } from '../../suis-les-fleches/domain/harmony';
import { chordByLabel } from '../../suis-les-fleches/domain/layout';

export type StepEvent =
  | { kind: 'gamme' }
  | { kind: 'repete' }
  | { kind: 'couleur'; cause: 'emprunt' | 'dominante'; anchor: string }
  | { kind: 'frole'; target: number }
  | { kind: 'suspens'; target: number }
  | { kind: 'confirme'; from: number; to: number; pivot: number }
  | { kind: 'eteint'; target: number; frole: number }
  | { kind: 'boucle'; target: number; frole: number };

export interface JourneyStep {
  chord: Chord;
  /** La tonalité où ce pas se lit (sa bande dans le ruban). */
  key: number;
  /** Son degré dans cette tonalité (« V », « V/V », « ♭VII »). */
  label: string;
  event: StepEvent;
  /** Pour l'accord pivot d'une modulation : son degré avant et après. */
  pivot: { before: string; after: string } | null;
}

export interface Journey {
  home: number;
  steps: JourneyStep[];
  /** La tonalité du moment. */
  key: number;
  /** La tonalité frôlée, tant que rien n'a tranché. */
  leaning: number | null;
  /** L'indice de l'accord qui a frôlé (en suspens). */
  pending: number | null;
}

const inKey = (c: Chord, key: number) => roleOf(c, key).kind === 'diatonique';

/** La tonalité vers laquelle un accord fait pencher, ou `null` (dans la gamme, ou simple couleur).
 *  Vers les dièses : V/V penche vers la dominante. Vers les bémols : ♭VII et v (empruntés) penchent vers la sous-dominante. */
export function leanOf(c: Chord, key: number): number | null {
  const r = roleOf(c, key);
  if (r.kind === 'diatonique') return null;
  if (r.kind === 'emprunt') return r.label === '♭VII' || r.label === 'v' ? mod12(key + 5) : null;
  if (r.kind === 'dominante') {
    const target = chordAt(key, chordByLabel(r.anchor!)!.degree);
    return target.cls === 'maj' ? target.root : null;
  }
  return keysContaining(c, key)[0]?.tonic ?? null;
}

/** L'événement d'un accord quand rien n'est en suspens. */
function freshEvent(c: Chord, key: number, loops: ReadonlySet<string>, leanIn: (chord: Chord, k: number) => number | null): StepEvent {
  const r = roleOf(c, key);
  if (r.kind === 'diatonique') return { kind: 'gamme' };
  const target = leanIn(c, key);
  if (target !== null) return { kind: 'frole', target };
  return { kind: 'couleur', cause: r.kind === 'emprunt' ? 'emprunt' : 'dominante', anchor: r.anchor ?? 'I' };
}

export function journeyOf(home: number, chords: readonly Chord[]): Journey {
  type Draft = Omit<JourneyStep, 'label'>;
  const steps: Draft[] = [];
  let key = home;
  let leaning: number | null = null;
  let pending: number | null = null;
  let loops = new Set<string>();

  // Pencher vers une tonalité, en respectant les boucles (accords connus ne penchent plus).
  const leanIn = (c: Chord, k: number): number | null => (loops.has(chordId(c)) ? null : leanOf(c, k));

  chords.forEach((c, i) => {
    const previous = steps[i - 1];
    if (previous && sameChord(previous.chord, c)) {
      steps.push({ chord: c, key, event: { kind: 'repete' }, pivot: null });
      return;
    }
    if (leaning === null) {
      const event = freshEvent(c, key, loops, leanIn);
      if (event.kind === 'frole') {
        leaning = event.target;
        pending = i;
      }
      steps.push({ chord: c, key, event, pivot: null });
      return;
    }
    const inOld = inKey(c, key);
    const inNew = inKey(c, leaning);
    if (inNew && !inOld) {
      const frolant = steps[pending!]!.chord;
      const before = steps[i - 1];
      // Aller-retour autour de la tonique (Do – Si♭ – Do – Si♭) : une couleur, pas une destination.
      if (sameChord(c, frolant) && before && before.chord.cls === 'maj' && before.chord.root === key) {
        steps.push({ chord: c, key, event: { kind: 'boucle', target: leaning, frole: pending! }, pivot: null });
        loops.add(chordId(c));
        leaning = null;
        pending = null;
        return;
      }
      const from = key;
      const to: number = leaning;
      const p = pending!;
      for (let k = p; k < i; k++) steps[k]!.key = to;
      steps[p]!.pivot = { before: roleOf(steps[p]!.chord, from).label, after: roleOf(steps[p]!.chord, to).label };
      key = to;
      leaning = null;
      pending = null;
      loops = new Set();
      steps.push({ chord: c, key, event: { kind: 'confirme', from, to, pivot: p }, pivot: null });
    } else if (inOld && inNew) {
      steps.push({ chord: c, key, event: { kind: 'suspens', target: leaning }, pivot: null });
    } else if (inOld) {
      steps.push({ chord: c, key, event: { kind: 'eteint', target: leaning, frole: pending! }, pivot: null });
      leaning = null;
      pending = null;
    } else {
      const target = leanIn(c, key);
      if (target === null) {
        steps.push({ chord: c, key, event: { kind: 'eteint', target: leaning, frole: pending! }, pivot: null });
        leaning = null;
        pending = null;
      } else if (target === leaning) {
        steps.push({ chord: c, key, event: { kind: 'suspens', target }, pivot: null });
      } else {
        leaning = target;
        pending = i;
        steps.push({ chord: c, key, event: { kind: 'frole', target }, pivot: null });
      }
    }
  });

  return { home, key, leaning, pending, steps: steps.map((s) => ({ ...s, label: roleOf(s.chord, s.key).label })) };
}

export interface Band {
  key: number;
  from: number;
  to: number;
}

/** Les bandes du ruban : les pas consécutifs lus dans la même tonalité. */
export function bandsOf(j: Journey): Band[] {
  const out: Band[] = [];
  j.steps.forEach((s, i) => {
    const last = out[out.length - 1];
    if (last && last.key === s.key) last.to = i;
    else out.push({ key: s.key, from: i, to: i });
  });
  return out;
}
