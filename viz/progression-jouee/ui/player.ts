/** Lecture d'une suite d'accords : un accord après l'autre, avec rappel à chaque pas (curseur), arrêtable. */
import { equalFrequency } from '@shell/music/pitch';
import type { Synth } from '@shell/music/synth';

export interface Step {
  /** Notes MIDI ; vide pour un silence. */
  midis: number[];
  seconds: number;
  tag?: unknown;
}

export class Player {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private token = 0;

  constructor(
    private synth: Synth,
    private onStep: (step: Step | null, index: number) => void,
  ) {}

  get playing(): boolean {
    return this.timer !== null;
  }

  play(steps: readonly Step[]): void {
    this.stop();
    const mine = ++this.token;
    let i = 0;
    const next = () => {
      if (mine !== this.token) return;
      if (i >= steps.length) {
        this.timer = null;
        this.onStep(null, -1);
        return;
      }
      const s = steps[i]!;
      if (s.midis.length) this.synth.play(s.midis.map((m) => equalFrequency(m)), s.seconds * 0.95);
      this.onStep(s, i);
      i++;
      this.timer = setTimeout(next, s.seconds * 1000);
    };
    next();
  }

  stop(): void {
    this.token++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.synth.stop();
    this.onStep(null, -1);
  }
}
