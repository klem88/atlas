/**
 * Le synthé de Shepard : neuf sinusoïdes à l'octave, chacune avec son gain, mises à jour en continu.
 * Contexte créé au premier geste (exigence d'iOS Safari), volume bas, transitions lissées (aucun clic).
 */
import { OCTAVES, type Component } from '../domain/shepard';

const MASTER = 0.22;
const SMOOTH = 0.03;

export class ShepardSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  playing = false;

  private context(): AudioContext {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Démarre les oscillateurs sur les composantes données. À appeler dans un gestionnaire de geste. */
  start(components: readonly Component[]): void {
    if (this.playing) return;
    const ctx = this.context();
    const now = ctx.currentTime;
    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, now);
    this.master.gain.linearRampToValueAtTime(MASTER, now + 0.15);
    this.master.connect(ctx.destination);
    this.oscillators = [];
    this.gains = [];
    for (let k = 0; k < OCTAVES; k++) {
      const c = components[k]!;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = c.hz;
      const g = ctx.createGain();
      g.gain.value = c.amp / Math.sqrt(OCTAVES / 2);
      osc.connect(g).connect(this.master);
      osc.start(now);
      this.oscillators.push(osc);
      this.gains.push(g);
    }
    this.playing = true;
  }

  /** Nouvelles fréquences et amplitudes. `articulate` : petit creux de volume, pour marquer une marche. */
  update(components: readonly Component[], articulate = false): void {
    if (!this.playing || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    components.forEach((c, k) => {
      const osc = this.oscillators[k];
      const g = this.gains[k];
      if (!osc || !g) return;
      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setTargetAtTime(c.hz, now, articulate ? 0.005 : SMOOTH);
      g.gain.cancelScheduledValues(now);
      g.gain.setTargetAtTime(c.amp / Math.sqrt(OCTAVES / 2), now, SMOOTH);
    });
    if (articulate) {
      const m = this.master.gain;
      m.cancelScheduledValues(now);
      m.setValueAtTime(m.value, now);
      m.linearRampToValueAtTime(MASTER * 0.15, now + 0.03);
      m.linearRampToValueAtTime(MASTER, now + 0.12);
    }
  }

  stop(): void {
    if (!this.playing || !this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const master = this.master;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.25);
    for (const o of this.oscillators) o.stop(now + 0.3);
    setTimeout(() => master.disconnect(), 400);
    this.oscillators = [];
    this.gains = [];
    this.master = null;
    this.playing = false;
  }
}
