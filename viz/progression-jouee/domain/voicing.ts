/**
 * Du degré au son, et du clavier au degré.
 * - `voice` : les notes MIDI d'un degré dans une tonalité, en position serrée autour du do du milieu, avec la basse.
 * - `chordFromNotes` : reconnaît une triade (majeure, mineure, diminuée, augmentée, suspendue) dans un ensemble de notes.
 */
import type { TriadClass } from '@shell/music/chords';
import { degreeOf, type Degree } from '@shell/music/degrees';

const INTERVALS: Record<TriadClass, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus: [0, 5, 7],
  other: [0, 7],
};

/**
 * Notes d'un degré : la basse (fondamentale entre do2 et si2) et la triade renversée pour rester
 * la plus proche possible de l'accord précédent (enchaînement doux), entre mi3 et sol4.
 */
export function voice(d: Degree, tonic: number, previous: readonly number[] | null = null): number[] {
  const rootPc = (tonic + d.step) % 12;
  const bass = 36 + rootPc; // do2 = 36
  const pcs = INTERVALS[d.cls].map((i) => (rootPc + i) % 12);
  // Trois renversements possibles, chacun placé au-dessus de mi3 (52).
  const candidates: number[][] = [];
  for (let inv = 0; inv < pcs.length; inv++) {
    const order = [...pcs.slice(inv), ...pcs.slice(0, inv)];
    const notes: number[] = [];
    let last = 51;
    for (const pc of order) {
      let n = last + 1;
      while (n % 12 !== pc) n++;
      notes.push(n);
      last = n;
    }
    // Ramené dans la fenêtre mi3–sol4 par octaves entières.
    while (notes[0]! > 60) for (let i = 0; i < notes.length; i++) notes[i]! -= 12;
    candidates.push(notes);
  }
  const prev = previous?.filter((n) => n >= 48) ?? null;
  const distance = (notes: number[]) => (prev ? notes.reduce((a, n) => a + Math.min(...prev.map((p) => Math.abs(p - n))), 0) : Math.abs(notes[0]! - 55));
  candidates.sort((a, b) => distance(a) - distance(b));
  return [bass, ...candidates[0]!];
}

/** Classe de triade reconnue dans des classes de hauteur (au moins trois notes distinctes ; la fondamentale trouvée). */
export function chordFromNotes(midis: readonly number[]): { root: number; cls: TriadClass } | null {
  const pcs = [...new Set(midis.map((m) => ((m % 12) + 12) % 12))].sort((a, b) => a - b);
  if (pcs.length < 2) return null;
  const set = new Set(pcs);
  const order: TriadClass[] = ['maj', 'min', 'dim', 'aug', 'sus'];
  for (const cls of order) {
    for (const root of pcs) {
      const wanted = INTERVALS[cls].map((i) => (root + i) % 12);
      if (wanted.every((pc) => set.has(pc)) && pcs.length <= wanted.length + 1) return { root, cls };
    }
  }
  // Deux notes : une quinte ou une quarte à vide → « accord de puissance », compté majeur.
  if (pcs.length === 2) {
    const [a, b] = pcs as [number, number];
    if ((b - a) % 12 === 7) return { root: a, cls: 'maj' };
    if ((b - a) % 12 === 5) return { root: b, cls: 'maj' };
  }
  return null;
}

/** Le degré joué sur le clavier, dans la tonalité d'écoute. */
export function degreeFromNotes(midis: readonly number[], tonic: number): Degree | null {
  const c = chordFromNotes(midis);
  if (!c) return null;
  return degreeOf({ root: c.root, quality: c.cls === 'maj' ? 'maj' : c.cls === 'min' ? 'min' : c.cls === 'dim' ? 'dim' : c.cls === 'aug' ? 'aug' : 'sus' }, tonic);
}
