/**
 * Synthèse additive avec Web Audio : chaque note est une somme d'harmoniques (sinusoïdes en 1/n).
 * Des sinusoïdes pures ne battraient pas sur une quinte : ce sont les harmoniques qui font entendre
 * ce que la vague montre. Un seul contexte, créé au premier geste (exigence d'iOS Safari), volume bas.
 */

export const HARMONICS = 6;
const ATTACK = 0.03;
const RELEASE = 0.35;
const MASTER = 0.16;

export interface Playback {
  /** Secondes écoulées depuis le début du son. */
  elapsed(): number;
  stop(): void;
  finished: Promise<void>;
}

export class Synth {
  private ctx: AudioContext | null = null;
  private current: Playback | null = null;

  /** À appeler dans un gestionnaire de clic : débloque l'audio sur mobile. */
  private context(): AudioContext {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Joue les fréquences données pendant `seconds` (enveloppe douce). Arrête ce qui jouait. */
  play(freqs: readonly number[], seconds: number): Playback {
    this.stop();
    const ctx = this.context();
    const t0 = ctx.currentTime + 0.02;
    const tEnd = t0 + seconds;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, t0);
    master.gain.linearRampToValueAtTime(MASTER / Math.sqrt(Math.max(1, freqs.length)), t0 + ATTACK);
    master.gain.setValueAtTime(MASTER / Math.sqrt(Math.max(1, freqs.length)), tEnd);
    master.gain.linearRampToValueAtTime(0, tEnd + RELEASE);
    master.connect(ctx.destination);

    const oscillators: OscillatorNode[] = [];
    for (const f of freqs) {
      for (let k = 1; k <= HARMONICS; k++) {
        if (f * k > 12_000) break;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f * k;
        const g = ctx.createGain();
        g.gain.value = 1 / k ** 1.2;
        osc.connect(g).connect(master);
        osc.start(t0);
        osc.stop(tEnd + RELEASE + 0.05);
        oscillators.push(osc);
      }
    }

    let resolve!: () => void;
    const finished = new Promise<void>((r) => (resolve = r));
    const last = oscillators[oscillators.length - 1];
    if (last) last.onended = () => resolve();
    else resolve();

    const playback: Playback = {
      elapsed: () => Math.max(0, ctx.currentTime - t0),
      stop: () => {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0, now + 0.08);
        for (const o of oscillators) {
          o.onended = null;
          try {
            o.stop(now + 0.1);
          } catch {
            // déjà arrêté
          }
        }
        resolve();
      },
      finished,
    };
    void finished.then(() => {
      if (this.current === playback) this.current = null;
    });
    this.current = playback;
    return playback;
  }

  stop(): void {
    this.current?.stop();
    this.current = null;
  }

  get playing(): Playback | null {
    return this.current;
  }
}
