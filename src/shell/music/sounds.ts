/**
 * Sons de la section rythmique, en Web Audio pur (aucun échantillon à charger) :
 * - ride : du bruit et six ondes carrées inharmoniques, filtrés dans l'aigu, qui s'éteignent lentement ;
 * - charleston au pied : un « tchik » de bruit très court ;
 * - contrebasse : une note pincée, ronde, qui s'éteint vite (une octave plus haut que la vraie, voir swing.ts).
 */

const bruits = new WeakMap<BaseAudioContext, AudioBuffer>();

function bruit(ctx: BaseAudioContext): AudioBuffer {
  let b = bruits.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    bruits.set(ctx, b);
  }
  return b;
}

/** Fréquences des carrés métalliques (celles de la TR-808, la cymbale de synthèse la plus connue). */
const METAL = [205.3, 304.4, 369.6, 522.7, 540, 800];

export function rideHit(ctx: BaseAudioContext, bus: AudioNode, t: number, vel: number): void {
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6500;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 9000;
  bp.Q.value = 0.6;
  const g = ctx.createGain();
  hp.connect(bp).connect(g).connect(bus);
  const peak = 0.16 * vel;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.003);
  g.gain.exponentialRampToValueAtTime(peak * 0.25, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  for (const f of METAL) {
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = f * 2.2;
    o.connect(hp);
    o.start(t);
    o.stop(t + 0.95);
  }
  const n = ctx.createBufferSource();
  n.buffer = bruit(ctx);
  const gn = ctx.createGain();
  gn.gain.value = 0.5;
  n.connect(gn).connect(hp);
  n.start(t);
  n.stop(t + 0.95);
}

export function hatHit(ctx: BaseAudioContext, bus: AudioNode, t: number, vel: number): void {
  const n = ctx.createBufferSource();
  n.buffer = bruit(ctx);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7500;
  const g = ctx.createGain();
  n.connect(hp).connect(g).connect(bus);
  const peak = 0.22 * vel;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  n.start(t);
  n.stop(t + 0.08);
}

export function bassNote(ctx: BaseAudioContext, bus: AudioNode, midi: number, t: number, dur: number, vel: number): void {
  const f = 440 * 2 ** ((midi - 69) / 12);
  const o1 = ctx.createOscillator();
  o1.type = 'triangle';
  o1.frequency.value = f;
  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = f * 2;
  const g2 = ctx.createGain();
  g2.gain.value = 0.35;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(1400, t);
  lp.frequency.exponentialRampToValueAtTime(450, t + 0.15);
  const g = ctx.createGain();
  o1.connect(lp);
  o2.connect(g2).connect(lp);
  lp.connect(g).connect(bus);
  const peak = 0.5 * vel;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  g.gain.setTargetAtTime(peak * 0.45, t + 0.02, 0.12);
  g.gain.setTargetAtTime(0.0001, t + dur, 0.05);
  o1.start(t);
  o2.start(t);
  o1.stop(t + dur + 0.4);
  o2.stop(t + dur + 0.4);
}
