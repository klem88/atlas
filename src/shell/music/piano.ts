/**
 * Piano de synthèse pour jouer une partition : des notes programmées à l'avance, chacune avec son
 * attaque et sa décroissance (une corde frappée s'éteint d'elle-même, plus lentement dans le grave).
 * Complète `synth.ts`, qui tient des accords comme un orgue : ici, chaque voix vit sa vie.
 */

export interface ScheduledNote {
  midi: number;
  /** Début, en secondes depuis le départ de la lecture. */
  start: number;
  /** Durée écrite, en secondes. */
  duration: number;
  /** Nuance, de 0 à 1. */
  velocity: number;
}

/** Événement de note tel que le donne abcjs (`setUpAudio`) : temps en rondes. */
export interface WholeNoteEvent {
  cmd: string;
  pitch?: number;
  start?: number;
  duration?: number;
  volume?: number;
}

/**
 * Convertit les pistes d'abcjs (temps en rondes) en notes programmées (temps en secondes).
 * Les pistes de `muted` sont ignorées (piste 0 = première voix, la main droite d'une partition de piano).
 */
export function toScheduledNotes(
  tracks: readonly (readonly WholeNoteEvent[])[],
  quarterPerMinute: number,
  muted: ReadonlySet<number> = new Set(),
): { notes: ScheduledNote[]; end: number } {
  const secondsPerWhole = (4 * 60) / quarterPerMinute;
  const notes: ScheduledNote[] = [];
  let end = 0;
  tracks.forEach((track, i) => {
    for (const ev of track) {
      if (ev.cmd !== 'note' || ev.pitch === undefined || ev.start === undefined || ev.duration === undefined) continue;
      end = Math.max(end, (ev.start + ev.duration) * secondsPerWhole);
      if (muted.has(i)) continue;
      notes.push({
        midi: ev.pitch,
        start: ev.start * secondsPerWhole,
        duration: ev.duration * secondsPerWhole,
        velocity: Math.min(1, (ev.volume ?? 90) / 110),
      });
    }
  });
  return { notes, end };
}

/** Temps de décroissance (constante de temps, en secondes) : les cordes graves sonnent plus longtemps. */
export function decayTime(midi: number): number {
  if (midi < 52) return 1.4;
  if (midi < 64) return 1.0;
  return 0.7;
}

export interface PianoPlayback {
  stop(): void;
}

export class PianoSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  /** À appeler dans un gestionnaire de clic : débloque l'audio sur mobile. */
  private context(): { ctx: AudioContext; master: GainNode } {
    if (!this.ctx || !this.master) {
      this.ctx = new AudioContext();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(comp).connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return { ctx: this.ctx, master: this.master };
  }

  /** Programme toutes les notes ; la lecture commence dans `lead` secondes. */
  play(notes: readonly ScheduledNote[], lead = 0.12): PianoPlayback {
    const { ctx, master } = this.context();
    const bus = ctx.createGain();
    bus.connect(master);
    const t0 = ctx.currentTime + lead;
    for (const n of notes) pianoNote(ctx, bus, n.midi, t0 + n.start, n.duration, n.velocity);
    return {
      stop: () => {
        bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05);
        setTimeout(() => bus.disconnect(), 400);
      },
    };
  }
}

/** Une note de piano de synthèse, programmée au temps `t` (horloge du contexte), vers `bus`. */
export function pianoNote(ctx: BaseAudioContext, bus: AudioNode, midi: number, t: number, dur: number, vel: number): void {
  const f = 440 * 2 ** ((midi - 69) / 12);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(Math.min(6000, f * 6), t);
  lp.frequency.exponentialRampToValueAtTime(Math.min(2500, f * 2.5), t + 0.6);
  const o1 = ctx.createOscillator();
  o1.type = 'triangle';
  o1.frequency.value = f;
  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = f * 2;
  const g2 = ctx.createGain();
  g2.gain.value = 0.25;
  const g = ctx.createGain();
  o1.connect(lp);
  o2.connect(g2).connect(lp);
  lp.connect(g).connect(bus);
  const peak = 0.22 * vel;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.setTargetAtTime(peak * 0.12, t + 0.01, decayTime(midi));
  g.gain.setTargetAtTime(0.0001, t + dur, 0.09);
  o1.start(t);
  o2.start(t);
  o1.stop(t + dur + 0.6);
  o2.stop(t + dur + 0.6);
}
