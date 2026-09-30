/**
 * Lecture des chants avec Web Audio : un seul contexte, créé au premier geste de l'utilisateur
 * (exigence d'iOS Safari), des tampons mis en cache, et une horloge commune pour synchroniser
 * les curseurs de lecture avec le son.
 */

export interface Voice {
  url: string;
  /** Entrée (s après le début de la lecture). */
  start: number;
  gain: number;
}

export interface Playback {
  /** Temps écoulé depuis le début de la lecture (s). */
  elapsed(): number;
  stop(): void;
  /** Résolue quand toutes les voix ont fini ou que la lecture est arrêtée. */
  finished: Promise<void>;
}

export class SongPlayer {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private current: Playback | null = null;

  /** À appeler dans un gestionnaire de clic : débloque l'audio sur mobile. */
  private context(): AudioContext {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private load(url: string): Promise<AudioBuffer> {
    let p = this.buffers.get(url);
    if (!p) {
      const ctx = this.context();
      p = fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
          return r.arrayBuffer();
        })
        .then((b) => ctx.decodeAudioData(b));
      p.catch(() => this.buffers.delete(url));
      this.buffers.set(url, p);
    }
    return p;
  }

  /** Arrête ce qui joue, puis joue les voix données, toutes chargées avant de démarrer. */
  async play(voices: readonly Voice[]): Promise<Playback> {
    this.stop();
    const ctx = this.context();
    const buffers = await Promise.all(voices.map((v) => this.load(v.url)));
    const t0 = ctx.currentTime + 0.05;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    // Plusieurs voix ensemble : on baisse le volume global pour ne pas saturer.
    master.gain.value = 1 / Math.sqrt(Math.max(1, voices.length));

    let resolve!: () => void;
    const finished = new Promise<void>((r) => (resolve = r));
    let remaining = voices.length;
    const sources = voices.map((v, i) => {
      const src = ctx.createBufferSource();
      src.buffer = buffers[i]!;
      const g = ctx.createGain();
      g.gain.value = v.gain;
      src.connect(g).connect(master);
      src.onended = () => {
        if (--remaining === 0) resolve();
      };
      src.start(t0 + v.start);
      return src;
    });

    const playback: Playback = {
      elapsed: () => Math.max(0, ctx.currentTime - t0),
      stop: () => {
        for (const s of sources) {
          s.onended = null;
          try {
            s.stop();
          } catch {
            // déjà arrêtée
          }
        }
        master.disconnect();
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
}
