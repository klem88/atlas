/**
 * Page d'exercice au piano : des partitions à écouter, avec un curseur qui suit les notes,
 * une page qui garde la ligne jouée au centre de l'écran et un écran qui reste allumé.
 *
 * Le HTML de l'exercice porte des attributs, la page fournit seulement ses partitions :
 *
 *   <div data-exercise-bar>                  bandeau collant (tempo, suivi, accords)
 *     <input type="range" data-tempo>  <output data-tempo-out>
 *     <input type="checkbox" data-follow checked>
 *     <fieldset data-chord-labels>             radios value="names" | "degrees" | "both"
 *   <button data-play="etape-1">             bouton Écouter / Arrêter
 *   <input type="checkbox" data-mute="etape-1">   coupe la main droite (première voix)
 *   <input type="checkbox" data-loop="etape-1">   rejoue en boucle
 *   <div data-score="etape-1">               la partition
 *
 *   mountExercise({ slug: 'six-ficelles', scores: { 'etape-1': pianoTune({ rh, lh }) } });
 *
 * Le mode d'affichage des accords est annoncé par un événement `chordlabels` sur `document`
 * (detail : le mode), pour que la page puisse accorder ses propres éléments (grille…).
 */
import abcjs from 'abcjs';
import { UserScrollGuard, centeredScroll, easeToward, lineSpans, type LineSpan } from './follow';
import { PianoSynth, toScheduledNotes, type PianoPlayback } from './piano';
import { Score, applyChordLabels, type ChordLabelMode } from './score';
import './score.css';

export interface ExerciseOptions {
  /** Sert à retenir les réglages (tempo, accords), par exercice. */
  slug: string;
  /** Partitions ABC, par identifiant (`data-score`). */
  scores: Record<string, string>;
}

const ICON_PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 .5v9l8-4.5z"/></svg>';
const ICON_STOP = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="1" width="8" height="8"/></svg>';
const LABEL_MODES: readonly ChordLabelMode[] = ['names', 'degrees', 'both'];

interface Current {
  id: string;
  sound: PianoPlayback;
  timing: abcjs.TimingCallbacks;
  timers: ReturnType<typeof setTimeout>[];
  frames: { raf: number; watchdog: ReturnType<typeof setInterval> };
}

/** Réglage retenu d'une visite à l'autre (simple confort : la page marche sans stockage). */
function remembered(key: string): { get(): string | null; set(v: string): void } {
  return {
    get: () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set: (v) => {
      try {
        localStorage.setItem(key, v);
      } catch {
        // stockage indisponible
      }
    },
  };
}

export function mountExercise({ slug, scores }: ExerciseOptions): void {
  const q = <T extends Element>(sel: string) => document.querySelector<T>(sel);
  const tempo = q<HTMLInputElement>('[data-tempo]');
  const tempoOut = q<HTMLOutputElement>('[data-tempo-out]');
  const follow = q<HTMLInputElement>('[data-follow]');
  const bar = q<HTMLElement>('[data-exercise-bar]');
  const labelsField = q<HTMLFieldSetElement>('[data-chord-labels]');
  const tempoStore = remembered(`atlas:${slug}:tempo`);
  const labelsStore = remembered(`atlas:${slug}:accords`);

  // Tempo.
  const savedTempo = tempoStore.get();
  if (savedTempo && tempo) tempo.value = savedTempo;
  const showTempo = () => {
    if (tempo && tempoOut) tempoOut.textContent = tempo.value;
  };
  showTempo();
  tempo?.addEventListener('input', showTempo);
  tempo?.addEventListener('change', () => tempoStore.set(tempo.value));

  // Noms d'accords, degrés, ou les deux.
  const savedLabels = labelsStore.get() as ChordLabelMode | null;
  let labelMode: ChordLabelMode = savedLabels && LABEL_MODES.includes(savedLabels) ? savedLabels : 'names';
  const radio = labelsField?.querySelector<HTMLInputElement>(`input[value="${labelMode}"]`);
  if (radio) radio.checked = true;

  const synth = new PianoSynth();
  const guard = new UserScrollGuard();
  for (const ev of ['wheel', 'touchmove'] as const) window.addEventListener(ev, () => guard.touched(), { passive: true });
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) guard.touched();
  });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const views = new Map<string, Score>();
  for (const [id, abc] of Object.entries(scores)) {
    const el = q<HTMLElement>(`[data-score="${id}"]`);
    if (!el) continue;
    const view = new Score(el, applyChordLabels(abc, labelMode));
    view.onRerender(() => {
      if (current?.id === id) stop();
    });
    views.set(id, view);
  }
  const announceLabels = () => document.dispatchEvent(new CustomEvent<ChordLabelMode>('chordlabels', { detail: labelMode }));
  announceLabels();
  labelsField?.addEventListener('change', (e) => {
    const value = (e.target as HTMLInputElement).value as ChordLabelMode;
    if (!LABEL_MODES.includes(value)) return;
    labelMode = value;
    labelsStore.set(value);
    for (const [id, view] of views) view.setAbc(applyChordLabels(scores[id]!, labelMode));
    announceLabels();
  });

  // Écran allumé pendant la lecture, quand le navigateur l'accorde.
  let wakeLock: WakeLockSentinel | null = null;
  const keepAwake = async () => {
    try {
      wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
    } catch {
      wakeLock = null;
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && current) void keepAwake();
  });

  let current: Current | null = null;

  const setButton = (id: string, playing: boolean) => {
    const b = q<HTMLButtonElement>(`[data-play="${id}"]`);
    if (!b) return;
    b.setAttribute('aria-pressed', String(playing));
    b.innerHTML = playing ? `${ICON_STOP} Arrêter` : `${ICON_PLAY} Écouter`;
  };

  const clearCursor = () => document.querySelectorAll('.is-playing').forEach((n) => n.classList.remove('is-playing'));

  function stop(): void {
    if (!current) return;
    const { id, sound, timing, timers, frames } = current;
    current = null;
    timers.forEach(clearTimeout);
    cancelAnimationFrame(frames.raf);
    clearInterval(frames.watchdog);
    timing.stop();
    sound.stop();
    clearCursor();
    setButton(id, false);
    void wakeLock?.release().catch(() => undefined);
    wakeLock = null;
  }

  function play(id: string): void {
    stop();
    const view = views.get(id);
    if (!view) return;
    const qpm = Number(tempo?.value ?? 70);
    const muted = q<HTMLInputElement>(`[data-mute="${id}"]`)?.checked ? new Set([0]) : new Set<number>();
    const audio = view.visual.setUpAudio({ chordsOff: true });
    const { notes, end } = toScheduledNotes(audio.tracks, qpm, muted);
    const lead = 0.12;
    const sound = synth.play(notes, lead);

    let lit: Element[] = [];
    guard.reset();
    const timing = new abcjs.TimingCallbacks(view.visual, {
      qpm,
      eventCallback: (ev) => {
        lit.forEach((n) => n.classList.remove('is-playing'));
        lit = [];
        ev?.elements?.forEach((group) =>
          group.forEach((n) => {
            n.classList.add('is-playing');
            lit.push(n);
          }),
        );
      },
    });

    // Suivi : la ligne jouée reste au centre, la page glisse en continu vers la suivante.
    const spans: LineSpan[] = lineSpans(timing.noteTimings, end * 1000);
    const startedAt = performance.now() + lead * 1000;
    let lastFrame = performance.now();
    const step = (now: number) => {
      const dt = now - lastFrame;
      lastFrame = now;
      if (!follow?.checked || guard.paused) return;
      const ms = Math.max(0, now - startedAt);
      const docSpans = spans.flatMap((s) => {
        const box = view.lineBox(s.top, s.height);
        return box ? [{ ...s, ...box }] : [];
      });
      const still = reducedMotion.matches;
      const target = centeredScroll(docSpans, ms, window.innerHeight, bar?.offsetHeight ?? 0, !still);
      if (target === null || Math.abs(target - window.scrollY) < 0.5) return;
      window.scrollTo(0, still ? target : easeToward(window.scrollY, target, dt));
    };
    const frames = { raf: 0, watchdog: 0 as unknown as ReturnType<typeof setInterval> };
    const loop = (now: number) => {
      step(now);
      frames.raf = requestAnimationFrame(loop);
    };
    frames.raf = requestAnimationFrame(loop);
    // Certains navigateurs suspendent les images d'animation (onglet en arrière-plan, aperçu) : relais lent.
    frames.watchdog = setInterval(() => {
      if (performance.now() - lastFrame > 150) step(performance.now());
    }, 100);

    const timers = [
      setTimeout(() => timing.start(), lead * 1000),
      setTimeout(
        () => {
          const again = q<HTMLInputElement>(`[data-loop="${id}"]`)?.checked;
          stop();
          if (again) play(id);
        },
        (end + lead + 0.5) * 1000,
      ),
    ];
    current = { id, sound, timing, timers, frames };
    setButton(id, true);
    void keepAwake();
  }

  for (const id of views.keys()) {
    setButton(id, false);
    q(`[data-play="${id}"]`)?.addEventListener('click', () => (current?.id === id ? stop() : play(id)));
  }
}
