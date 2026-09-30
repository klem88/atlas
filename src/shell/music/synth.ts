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

  /**
   * Son tenu : des notes qui durent jusqu'à `stop()` et dont les fréquences se modifient en continu
   * (glissando). Même timbre que `play`, mêmes précautions de volume.
   * `harmonics` : un nombre (amplitudes en 1/k^1,2) ou les amplitudes de chaque harmonique, modifiables ensuite.
   */
  hold(freqs: readonly number[], harmonics: number | readonly number[] = HARMONICS): Held {
    this.stop();
    const ctx = this.context();
    const t0 = ctx.currentTime + 0.02;
    const level = MASTER / Math.sqrt(Math.max(1, freqs.length));
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, t0);
    master.gain.linearRampToValueAtTime(level, t0 + ATTACK * 2);
    master.connect(ctx.destination);

    const amplitudes = typeof harmonics === 'number' ? Array.from({ length: harmonics }, (_, i) => 1 / (i + 1) ** 1.2) : [...harmonics];
    const gains: GainNode[][] = [];
    const voices = freqs.map((f) => {
      const oscs: OscillatorNode[] = [];
      const gs: GainNode[] = [];
      amplitudes.forEach((a, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f * (i + 1);
        const g = ctx.createGain();
        g.gain.value = a;
        osc.connect(g).connect(master);
        osc.start(t0);
        oscs.push(osc);
        gs.push(g);
      });
      gains.push(gs);
      return oscs;
    });

    let stopped = false;
    let resolve!: () => void;
    const finished = new Promise<void>((r) => (resolve = r));
    const held: Held = {
      elapsed: () => Math.max(0, ctx.currentTime - t0),
      setFrequencies(next) {
        const now = ctx.currentTime;
        voices.forEach((oscs, i) => {
          const f = next[i];
          if (f === undefined) return;
          oscs.forEach((o, k) => {
            o.frequency.cancelScheduledValues(now);
            o.frequency.setTargetAtTime(f * (k + 1), now, 0.02);
          });
        });
      },
      setAmplitudes(next) {
        const now = ctx.currentTime;
        for (const gs of gains) {
          gs.forEach((g, k) => {
            const a = next[k];
            if (a === undefined) return;
            g.gain.cancelScheduledValues(now);
            g.gain.setTargetAtTime(a, now, 0.03);
          });
        }
      },
      stop: () => {
        if (stopped) return;
        stopped = true;
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0, now + RELEASE);
        for (const oscs of voices) for (const o of oscs) o.stop(now + RELEASE + 0.05);
        resolve();
      },
      finished,
    };
    void finished.then(() => {
      if (this.current === held) this.current = null;
    });
    this.current = held;
    return held;
  }
}

export interface Held extends Playback {
  /** Nouvelles fréquences des notes, dans l'ordre de `hold` ; le passage est lissé sur 20 ms. */
  setFrequencies(freqs: readonly number[]): void;
  /** Nouvelles amplitudes des harmoniques (rang 1 en premier), lissées sur 30 ms. */
  setAmplitudes(amplitudes: readonly number[]): void;
}
