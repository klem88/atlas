/**
 * Le parcours : à partir de la maison et des accords posés, la tonalité de chaque pas.
 * Un accord hors de la tonalité « frôle » une autre tonalité ; le premier accord qui n'appartient qu'à l'une des deux
 * tranche (confirmation : on a modulé ; sinon le frôlement s'éteint, c'était un détour). Les emprunts au mineur et les
 * dominantes secondaires de cibles mineures sont des couleurs : elles ne frôlent rien.
 * Tout se recalcule de zéro à chaque geste ; annuler, c'est recalculer sans le dernier accord.
 */
import { chordAt, keysContaining, roleOf, sameChord, type Chord } from '../../suis-les-fleches/domain/harmony';
import { chordByLabel } from '../../suis-les-fleches/domain/layout';

export type StepEvent =
  | { kind: 'gamme' }
  | { kind: 'repete' }
  | { kind: 'couleur'; cause: 'emprunt' | 'dominante'; anchor: string }
  | { kind: 'frole'; target: number }
  | { kind: 'suspens'; target: number }
  | { kind: 'confirme'; from: number; to: number; pivot: number }
  | { kind: 'eteint'; target: number; frole: number };

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

/** La tonalité vers laquelle un accord fait pencher, ou `null` (dans la gamme, ou simple couleur). */
export function leanOf(c: Chord, key: number): number | null {
  const r = roleOf(c, key);
  if (r.kind === 'diatonique' || r.kind === 'emprunt') return null;
  if (r.kind === 'dominante') {
    const target = chordAt(key, chordByLabel(r.anchor!)!.degree);
    return target.cls === 'maj' ? target.root : null;
  }
  return keysContaining(c, key)[0]?.tonic ?? null;
}

/** L'événement d'un accord quand rien n'est en suspens. */
function freshEvent(c: Chord, key: number): StepEvent {
  const r = roleOf(c, key);
  if (r.kind === 'diatonique') return { kind: 'gamme' };
  const target = leanOf(c, key);
  if (target !== null) return { kind: 'frole', target };
  return { kind: 'couleur', cause: r.kind === 'emprunt' ? 'emprunt' : 'dominante', anchor: r.anchor ?? 'I' };
}

export function journeyOf(home: number, chords: readonly Chord[]): Journey {
  type Draft = Omit<JourneyStep, 'label'>;
  const steps: Draft[] = [];
  let key = home;
  let leaning: number | null = null;
  let pending: number | null = null;

  chords.forEach((c, i) => {
    const previous = steps[i - 1];
    if (previous && sameChord(previous.chord, c)) {
      steps.push({ chord: c, key, event: { kind: 'repete' }, pivot: null });
      return;
    }
    if (leaning === null) {
      const event = freshEvent(c, key);
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
      const from = key;
      const to: number = leaning;
      const p = pending!;
      for (let k = p; k < i; k++) steps[k]!.key = to;
      steps[p]!.pivot = { before: roleOf(steps[p]!.chord, from).label, after: roleOf(steps[p]!.chord, to).label };
      key = to;
      leaning = null;
      pending = null;
      steps.push({ chord: c, key, event: { kind: 'confirme', from, to, pivot: p }, pivot: null });
    } else if (inOld && inNew) {
      steps.push({ chord: c, key, event: { kind: 'suspens', target: leaning }, pivot: null });
    } else if (inOld) {
      steps.push({ chord: c, key, event: { kind: 'eteint', target: leaning, frole: pending! }, pivot: null });
      leaning = null;
      pending = null;
    } else {
      const target = leanOf(c, key);
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
