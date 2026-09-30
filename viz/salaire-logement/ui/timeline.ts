import { renderLineChart, type ChartScales } from '@shell/charts/line-chart';
import { fmtPct } from '@shell/format';

interface TimelineOptions {
  years: readonly number[];
  rateFor: (year: number) => number;
  onChange: (year: number) => void;
}

const HEIGHT = 132;
const PLAY_STEP_MS = 650;

/**
 * Frise des années = courbe des taux d'emprunt.
 * On choisit l'année en glissant sur la courbe (souris, doigt) ou au clavier
 * (flèches, via un curseur natif invisible mais focalisable).
 */
export function createTimeline(target: HTMLElement, o: TimelineOptions) {
  const first = o.years[0]!;
  const last = o.years.at(-1)!;
  target.innerHTML = `
    <div class="timeline-head">
      <button class="button button--icon timeline-play" type="button" aria-label="Animer de ${first} à ${last}">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path class="icon-play" d="M5 3.5v9l7-4.5z" fill="currentColor"/><path class="icon-pause" d="M4.5 3.5h2.5v9H4.5zM9 3.5h2.5v9H9z" fill="currentColor"/></svg>
      </button>
      <p class="timeline-readout">
        <span class="timeline-year num"></span>
        <span class="timeline-rate">taux moyen d’emprunt <strong class="num"></strong></span>
      </p>
    </div>
    <div class="timeline-track">
      <svg aria-hidden="true"></svg>
      <input class="timeline-input" type="range" min="${first}" max="${last}" step="1" aria-label="Année de la simulation" />
    </div>
    <p class="note detail timeline-note">Glisse le long de la courbe pour changer d’année. Taux moyen des nouveaux crédits immobiliers, par an.</p>`;

  const svg = target.querySelector<SVGSVGElement>('.timeline-track svg')!;
  const input = target.querySelector<HTMLInputElement>('.timeline-input')!;
  const play = target.querySelector<HTMLButtonElement>('.timeline-play')!;
  const yearEl = target.querySelector<HTMLElement>('.timeline-year')!;
  const rateEl = target.querySelector<HTMLElement>('.timeline-rate strong')!;
  const track = target.querySelector<HTMLElement>('.timeline-track')!;

  let current = Number.NaN; // forcé au premier `update`
  let scales: ChartScales | null = null;
  let timer: number | undefined;

  const maxRate = Math.max(...o.years.map(o.rateFor));
  const yTop = Math.ceil(maxRate);

  function draw() {
    const width = Math.max(280, Math.round(track.getBoundingClientRect().width));
    const narrow = width < 520;
    scales = renderLineChart(
      svg,
      o.years.map((x) => ({ x, y: o.rateFor(x) })),
      {
        width,
        height: HEIGHT,
        current: Number.isFinite(current) ? current : last,
        formatY: (y) => fmtPct(y, y % 1 === 0 ? 1 : 2).replace(',0 ', ' '),
        xTicks: o.years.filter((y) => (narrow ? (y - first) % 5 === 0 || y === last : true)),
        yTicks: [0, yTop],
        label: `Taux moyen d’emprunt de ${first} à ${last}`,
        margin: { top: 22, right: 16, bottom: 22, left: 16 },
      },
    );
  }

  function set(year: number, notify: boolean) {
    const y = Math.min(last, Math.max(first, Math.round(year)));
    if (y === current && !notify) return;
    current = y;
    input.value = String(y);
    input.setAttribute('aria-valuetext', `${y}, taux moyen ${fmtPct(o.rateFor(y))}`);
    yearEl.textContent = String(y);
    rateEl.textContent = fmtPct(o.rateFor(y));
    draw();
    if (notify) o.onChange(y);
  }

  function stop() {
    window.clearInterval(timer);
    timer = undefined;
    play.classList.remove('is-playing');
    play.setAttribute('aria-label', `Animer de ${first} à ${last}`);
  }

  play.addEventListener('click', () => {
    if (timer !== undefined) return stop();
    if (current === last) set(first, true);
    play.classList.add('is-playing');
    play.setAttribute('aria-label', 'Mettre en pause');
    timer = window.setInterval(() => {
      if (current >= last) return stop();
      set(current + 1, true);
    }, PLAY_STEP_MS);
  });

  input.addEventListener('input', () => {
    stop();
    set(Number(input.value), true);
  });

  const fromPointer = (e: PointerEvent) => {
    if (!scales) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * Number(svg.viewBox.baseVal.width);
    set(scales.xInvert(px), true);
  };
  svg.addEventListener('pointerdown', (e) => {
    stop();
    svg.setPointerCapture(e.pointerId);
    fromPointer(e);
    input.focus({ preventScroll: true });
  });
  svg.addEventListener('pointermove', (e) => {
    if (svg.hasPointerCapture(e.pointerId)) fromPointer(e);
  });

  new ResizeObserver(draw).observe(track);

  return {
    /** Met à jour l'affichage sans notifier (l'état vient d'ailleurs). */
    update(year: number) {
      set(year, false);
    },
    /** Arrête l'animation (l'année a été choisie ailleurs). */
    stop,
  };
}
