/**
 * Page d'exercice au piano : des partitions à écouter, avec un curseur qui suit les notes,
 * une page qui défile toute seule et un écran qui reste allumé pendant la lecture.
 *
 * Le HTML de l'exercice porte des attributs, la page fournit seulement ses partitions :
 *
 *   <div data-exercise-bar>                  bandeau collant (tempo, suivi)
 *     <input type="range" data-tempo>  <output data-tempo-out>
 *     <input type="checkbox" data-follow checked>
 *   <button data-play="etape-1">             bouton Écouter / Arrêter
 *   <input type="checkbox" data-mute="etape-1">   coupe la main droite (première voix)
 *   <input type="checkbox" data-loop="etape-1">   rejoue en boucle
 *   <div data-score="etape-1">               la partition
 *
 *   mountExercise({ slug: 'six-ficelles', scores: { 'etape-1': pianoTune({ rh, lh }) } });
 */
import abcjs from 'abcjs';
import { UserScrollGuard, followTarget } from './follow';
import { PianoSynth, toScheduledNotes, type PianoPlayback } from './piano';
import { Score } from './score';
import './score.css';

export interface ExerciseOptions {
  /** Sert à retenir le tempo choisi, par exercice. */
  slug: string;
  /** Partitions ABC, par identifiant (`data-score`). */
  scores: Record<string, string>;
}

const ICON_PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 .5v9l8-4.5z"/></svg>';
const ICON_STOP = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="1" width="8" height="8"/></svg>';

interface Current {
  id: string;
  sound: PianoPlayback;
  timing: abcjs.TimingCallbacks;
  timers: ReturnType<typeof setTimeout>[];
}

export function mountExercise({ slug, scores }: ExerciseOptions): void {
  const q = <T extends Element>(sel: string) => document.querySelector<T>(sel);
  const tempo = q<HTMLInputElement>('[data-tempo]');
  const tempoOut = q<HTMLOutputElement>('[data-tempo-out]');
  const follow = q<HTMLInputElement>('[data-follow]');
  const bar = q<HTMLElement>('[data-exercise-bar]');
  const tempoKey = `atlas:${slug}:tempo`;

  // Tempo retenu d'une visite à l'autre (simple confort : la page marche sans).
  try {
    const saved = localStorage.getItem(tempoKey);
    if (saved && tempo) tempo.value = saved;
  } catch {
    // stockage indisponible
  }
  const showTempo = () => {
    if (tempo && tempoOut) tempoOut.textContent = tempo.value;
  };
  showTempo();
  tempo?.addEventListener('input', showTempo);
  tempo?.addEventListener('change', () => {
    try {
      localStorage.setItem(tempoKey, tempo.value);
    } catch {
      // stockage indisponible
    }
  });

  const synth = new PianoSynth();
  const guard = new UserScrollGuard();
  for (const ev of ['wheel', 'touchmove'] as const) window.addEventListener(ev, () => guard.touched(), { passive: true });
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) guard.touched();
  });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /** Défilement doux vers la ligne ; s'il n'a pas avancé (page non dessinée, navigateur réticent), on saute. */
  const scrollToLine = (top: number) => {
    if (reducedMotion.matches) {
      window.scrollTo(0, top);
      return;
    }
    const from = window.scrollY;
    window.scrollTo({ top, behavior: 'smooth' });
    setTimeout(() => {
      if (Math.abs(window.scrollY - from) < Math.abs(top - from) / 2 && !guard.paused) window.scrollTo(0, top);
    }, 700);
  };

  const views = new Map<string, Score>();
  for (const [id, abc] of Object.entries(scores)) {
    const el = q<HTMLElement>(`[data-score="${id}"]`);
    if (!el) continue;
    const view = new Score(el, abc);
    view.onRerender(() => {
      if (current?.id === id) stop();
    });
    views.set(id, view);
  }

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
    const { id, sound, timing, timers } = current;
    current = null;
    timers.forEach(clearTimeout);
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
    let lastLine = -1;
    guard.reset();
    const timing = new abcjs.TimingCallbacks(view.visual, {
      qpm,
      eventCallback: (ev) => {
        lit.forEach((n) => n.classList.remove('is-playing'));
        lit = [];
        if (!ev) return;
        ev.elements?.forEach((group) =>
          group.forEach((n) => {
            n.classList.add('is-playing');
            lit.push(n);
          }),
        );
        if (ev.line === undefined || ev.line === lastLine || ev.top === undefined || ev.height === undefined) return;
        lastLine = ev.line;
        if (!follow?.checked || guard.paused) return;
        const box = view.lineBox(ev.top, ev.height);
        if (!box) return;
        const target = followTarget(box.top, box.height, window.scrollY, window.innerHeight, bar?.offsetHeight ?? 0);
        if (target !== null) scrollToLine(target);
      },
    });

    const timers = [
      setTimeout(() => timing.start(), lead * 1000),
      setTimeout(
        () => {
          const loop = q<HTMLInputElement>(`[data-loop="${id}"]`)?.checked;
          stop();
          if (loop) play(id);
        },
        (end + lead + 0.5) * 1000,
      ),
    ];
    current = { id, sound, timing, timers };
    setButton(id, true);
    void keepAwake();
  }

  for (const id of views.keys()) {
    setButton(id, false);
    q(`[data-play="${id}"]`)?.addEventListener('click', () => (current?.id === id ? stop() : play(id)));
  }
}
