/**
 * L'orchestre : joue en boucle une grille de coups (`Hit`, voir swing.ts) avec l'horloge de Web Audio.
 * Les coups sont programmés par petits lots, 150 ms à l'avance, toutes les 25 ms : le tempo et la grille peuvent
 * changer pendant la lecture sans couper le son. Un décompte de quatre temps au charleston précède la grille.
 */
import { pianoNote } from './piano';
import { bassNote, hatHit, rideHit } from './sounds';
import { swingFraction, swungBeat, type Hit } from './swing';

export interface Loop {
  hits: readonly Hit[];
  /** Longueur de la boucle, en temps. */
  beats: number;
}

const AVANCE = 0.15;
const PERIODE = 25;
const DECOMPTE = 4;

export class Band {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private timer: number | null = null;
  private loop: Loop = { hits: [], beats: 4 };
  private bpm = 120;
  /** Horloge : au temps `anchorTime` du contexte, on en était au temps `anchorBeat` (droit, depuis le début de la grille). */
  private anchorTime = 0;
  private anchorBeat = 0;
  /** Tout ce qui précède ce temps est déjà programmé. */
  private scheduledUntil = 0;

  get playing(): boolean {
    return this.timer !== null;
  }

  /** À appeler dans un gestionnaire de clic : débloque l'audio sur mobile. */
  play(loop: Loop, bpm: number): void {
    this.stop();
    if (!this.ctx) this.ctx = new AudioContext();
    const ctx = this.ctx;
    if (ctx.state === 'suspended') void ctx.resume();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    this.bus = ctx.createGain();
    this.bus.gain.value = 0.8;
    this.bus.connect(comp).connect(ctx.destination);
    this.loop = loop;
    this.bpm = bpm;
    this.anchorTime = ctx.currentTime + 0.1;
    this.anchorBeat = -DECOMPTE;
    this.scheduledUntil = -DECOMPTE;
    this.tick();
    this.timer = window.setInterval(() => this.tick(), PERIODE);
  }

  stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    const { ctx, bus } = this;
    if (ctx && bus) {
      bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.04);
      setTimeout(() => bus.disconnect(), 400);
    }
    this.bus = null;
  }

  /** Change de grille sans s'arrêter (même longueur : la position est gardée ; sinon la lecture repart). */
  setLoop(loop: Loop): void {
    const relancer = this.playing && loop.beats !== this.loop.beats;
    this.loop = loop;
    if (relancer) this.play(loop, this.bpm);
  }

  setTempo(bpm: number): void {
    if (this.ctx && this.playing) {
      const now = this.ctx.currentTime;
      this.anchorBeat = this.beatAt(now);
      this.anchorTime = now;
    }
    this.bpm = bpm;
  }

  /** Temps en cours dans la grille (négatif pendant le décompte), ou `null` à l'arrêt. */
  position(): number | null {
    if (!this.ctx || !this.playing) return null;
    const b = this.beatAt(this.ctx.currentTime);
    return b < 0 ? b : b % this.loop.beats;
  }

  private beatAt(time: number): number {
    return this.anchorBeat + ((time - this.anchorTime) * this.bpm) / 60;
  }

  private timeOf(beat: number): number {
    return this.anchorTime + ((beat - this.anchorBeat) * 60) / this.bpm;
  }

  private tick(): void {
    const { ctx, bus } = this;
    if (!ctx || !bus) return;
    const debut = this.scheduledUntil;
    const fin = this.beatAt(ctx.currentTime + AVANCE);
    if (fin <= debut) return;
    const frac = swingFraction(this.bpm);
    const sec = 60 / this.bpm;
    // Décompte : le charleston sur chaque temps.
    for (let b = Math.ceil(debut); b < Math.min(fin, 0); b++) hatHit(ctx, bus, this.timeOf(b), 1);
    const L = this.loop.beats;
    for (let pass = Math.floor(Math.max(debut, 0) / L); pass * L < fin; pass++) {
      for (const h of this.loop.hits) {
        const abs = pass * L + h.beat;
        if (abs < debut || abs >= fin || abs < 0) continue;
        const t = this.timeOf(swungBeat(abs, frac));
        const dur = h.dur * sec;
        switch (h.kind) {
          case 'ride':
            rideHit(ctx, bus, t, h.vel);
            break;
          case 'charleston':
            hatHit(ctx, bus, t, h.vel);
            break;
          case 'basse':
            bassNote(ctx, bus, h.midi!, t, dur, h.vel);
            break;
          case 'piano':
            pianoNote(ctx, bus, h.midi!, t, dur, h.vel);
            break;
        }
      }
    }
    this.scheduledUntil = fin;
  }
}
