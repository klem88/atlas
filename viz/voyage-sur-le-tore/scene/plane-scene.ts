/**
 * La scène : un canvas 2D qui dessine le Tonnetz à plat et suit la tête du chemin pendant l'écoute.
 * Glisser déplace la vue (et suspend le suivi jusqu'au prochain « Recentrer » ou à la prochaine lecture).
 */
import type { PlanePoint } from '../domain/plane';
import { drawPlane, fitView, type PlaneColors, type PlaneView } from './draw-plane';

export function readPlaneColors(): PlaneColors {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    background: v('--surface'),
    major: v('--surface'),
    minor: v('--surface-sunk'),
    visited: v('--seq-1'),
    current: v('--accent-soft'),
    edge: v('--rule-strong'),
    node: v('--ink-3'),
    label: v('--ink-2'),
    labelStrong: v('--ink'),
    trail: v('--seq-5'),
    ahead: v('--seq-2'),
    accent: v('--accent'),
  };
}

export interface PlaneScene {
  setPath(points: readonly PlanePoint[], rings: ReadonlySet<number>): void;
  setHead(i: number): void;
  setFollow(on: boolean): void;
  recenter(): void;
  setColors(c: PlaneColors): void;
  resize(): void;
  canvas: HTMLCanvasElement;
}

export function createPlaneScene(container: HTMLElement, colors: PlaneColors, reducedMotion: boolean): PlaneScene {
  const canvas = document.createElement('canvas');
  canvas.className = 'plane-canvas';
  canvas.style.touchAction = 'pan-y';
  container.append(canvas);
  const ctx = canvas.getContext('2d')!;
  const fontUi = getComputedStyle(document.body).getPropertyValue('--font-ui') || 'sans-serif';
  let path: readonly PlanePoint[] = [];
  let rings: ReadonlySet<number> = new Set();
  let head = -1;
  let view: PlaneView = { cx: 1, cy: -0.5, scale: 70, width: 300, height: 225 };
  let goal: { cx: number; cy: number } | null = null;
  let follow = true;
  let raf = 0;
  let dpr = 1;

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPlane(ctx, view, { path, head, rings, fontUi }, colors);
  }
  function tick() {
    raf = 0;
    if (!goal) return draw();
    const dx = goal.cx - view.cx;
    const dy = goal.cy - view.cy;
    if (Math.hypot(dx, dy) < 0.002 || reducedMotion) {
      view.cx = goal.cx;
      view.cy = goal.cy;
      goal = null;
      return draw();
    }
    view.cx += dx * 0.14;
    view.cy += dy * 0.14;
    draw();
    raf = requestAnimationFrame(tick);
  }
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const fitted = fitView(path, w, h);
    view = { ...view, width: w, height: h, scale: fitted.scale };
    if (follow) {
      view.cx = fitted.cx;
      view.cy = fitted.cy;
    }
    draw();
  }
  function recenter() {
    follow = true;
    const fitted = fitView(path, view.width, view.height);
    view.scale = fitted.scale;
    goal = head >= 0 && path[head] ? { cx: path[head]!.x, cy: path[head]!.y } : { cx: fitted.cx, cy: fitted.cy };
    schedule();
  }

  // Glisser pour déplacer
  let drag: { x: number; y: number; cx: number; cy: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) {
      follow = false;
      goal = null;
    }
    view.cx = drag.cx - dx / view.scale;
    view.cy = drag.cy - dy / view.scale;
    draw();
  });
  const endDrag = () => (drag = null);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  resize();
  return {
    canvas,
    setPath(points, r) {
      path = points;
      rings = r;
      head = -1;
      follow = true;
      const fitted = fitView(path, view.width, view.height);
      view = { ...view, cx: fitted.cx, cy: fitted.cy, scale: fitted.scale };
      goal = null;
      draw();
    },
    setHead(i) {
      head = i;
      if (follow && i >= 0 && path[i]) {
        goal = { cx: path[i]!.x, cy: path[i]!.y };
        schedule();
      } else if (follow && i < 0) {
        const fitted = fitView(path, view.width, view.height);
        goal = { cx: fitted.cx, cy: fitted.cy };
        schedule();
      } else draw();
    },
    setFollow(on) {
      follow = on;
    },
    recenter,
    setColors(c) {
      colors = c;
      draw();
    },
    resize,
  };
}
