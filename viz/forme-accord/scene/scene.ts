/**
 * La scène three.js : la courbe de l'accord (ligne épaisse dégradée du plus ancien au plus récent),
 * un point de tête à l'accent, un cube discret pour situer les axes, une orbite à la souris et une rotation lente.
 *
 * Le temps est compté en tours de la note grave. Deux régimes :
 *   - « dessin » : 0,35 tour par seconde, la traîne grandit jusqu'à quelques tours, on voit la courbe se tracer ;
 *   - « normal » : 30 tours par seconde, la traîne couvre plusieurs tours, la forme précesse si l'accord n'est pas pur.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { curvePoints } from '../domain/curve';

export type TimeMode = 'dessin' | 'normal';

export interface SceneTheme {
  background: string;
  /** Du plus ancien au plus récent : les pas les plus contrastés de la rampe, lisibles dans les deux thèmes. */
  ramp: string[];
  accent: string;
  frame: string;
}

export function readSceneTheme(): SceneTheme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return { background: v('--surface'), ramp: [3, 4, 5, 6].map((i) => v(`--seq-${i}`)), accent: v('--accent'), frame: v('--rule-strong') };
}

const SAMPLES_PER_TURN = 240;
const MAX_TURNS = 12;
/** Segments alloués une fois : three.js fige le nombre maximal d'instances au premier rendu. */
const MAX_SEGMENTS = MAX_TURNS * SAMPLES_PER_TURN;
const SPEED: Record<TimeMode, number> = { dessin: 0.35, normal: 30 };

export interface ChordScene {
  setCurve(ratios: readonly number[], closureTurns: number): void;
  setMode(mode: TimeMode): void;
  setTheme(theme: SceneTheme): void;
  /** Rendu immédiat (utile quand l'animation est en pause). */
  renderOnce(): void;
  resize(): void;
  /** Le canvas WebGL, pour l'image de partage (le tampon est conservé). */
  canvas: HTMLCanvasElement;
  dispose(): void;
}

export function createChordScene(container: HTMLElement, theme: SceneTheme, reducedMotion: boolean): ChordScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  container.append(renderer.domElement);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.6;
  // Sur téléphone : un doigt fait défiler la page, deux doigts tournent la courbe.
  controls.touches = { ONE: null as unknown as THREE.TOUCH, TWO: THREE.TOUCH.ROTATE };
  canvas.style.touchAction = 'pan-y';

  const material = new LineMaterial({ linewidth: 2.5, vertexColors: true, worldUnits: false });
  const geometry = new LineGeometry();
  geometry.setPositions(new Float32Array((MAX_SEGMENTS + 1) * 3));
  geometry.setColors(new Float32Array((MAX_SEGMENTS + 1) * 3));
  const segStart = geometry.attributes.instanceStart as THREE.InterleavedBufferAttribute;
  const colStart = geometry.attributes.instanceColorStart as THREE.InterleavedBufferAttribute;
  const segData = segStart.data.array as Float32Array;
  const colData = colStart.data.array as Float32Array;
  const line = new Line2(geometry, material);
  line.frustumCulled = false;
  scene.add(line);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), new THREE.MeshBasicMaterial({ color: theme.accent }));
  scene.add(head);

  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2.1, 2.1, 2.1)),
    new THREE.LineBasicMaterial({ color: theme.frame, transparent: true, opacity: 0.5 }),
  );
  scene.add(frame);

  let ratios: number[] = [1, 1.5];
  let closure = 2;
  let mode: TimeMode = 'normal';
  let t = 0;
  let trail = 0;
  let lastFrame = performance.now();
  let raf = 0;
  let paletteRamp = theme.ramp.map((c) => new THREE.Color(c));

  function trailTarget(): number {
    return mode === 'dessin' ? Math.min(6, Math.max(closure, 2)) : Math.max(4, Math.min(12, closure));
  }

  /** Recalcule la courbe et l'écrit en place dans les tampons (paires début/fin de segment, stride 6). */
  function rebuild() {
    const turns = Math.max(0.02, Math.min(MAX_TURNS, trail));
    const samples = Math.max(8, Math.min(MAX_SEGMENTS, Math.round(turns * SAMPLES_PER_TURN)));
    const pts = curvePoints(ratios, t - turns, turns, samples);
    const last = paletteRamp.length - 1;
    const rgb = (age: number, out: Float32Array, at: number) => {
      const pos = age * last;
      const a = paletteRamp[Math.floor(pos)]!;
      const b = paletteRamp[Math.min(last, Math.floor(pos) + 1)]!;
      const k = pos - Math.floor(pos);
      out[at] = a.r + (b.r - a.r) * k;
      out[at + 1] = a.g + (b.g - a.g) * k;
      out[at + 2] = a.b + (b.b - a.b) * k;
    };
    for (let i = 0; i < samples; i++) {
      const o = i * 6;
      segData[o] = pts[i * 3]!;
      segData[o + 1] = pts[i * 3 + 1]!;
      segData[o + 2] = pts[i * 3 + 2]!;
      segData[o + 3] = pts[i * 3 + 3]!;
      segData[o + 4] = pts[i * 3 + 4]!;
      segData[o + 5] = pts[i * 3 + 5]!;
      rgb(i / samples, colData, o);
      rgb((i + 1) / samples, colData, o + 3);
    }
    segStart.data.needsUpdate = true;
    colStart.data.needsUpdate = true;
    geometry.instanceCount = samples;
    const n = samples * 3;
    head.position.set(pts[n]!, pts[n + 1]!, pts[n + 2]!);
  }

  function placeCamera() {
    const flat = ratios.length < 3;
    frame.visible = !flat;
    if (flat) camera.position.set(0, 0, 4.6);
    else camera.position.set(2.9, 2.1, 3.4);
    controls.autoRotate = !reducedMotion && !flat;
    camera.lookAt(0, 0, 0);
    controls.update();
  }

  function render() {
    renderer.render(scene, camera);
  }

  function tick(now: number) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    t += SPEED[mode] * dt;
    const target = trailTarget();
    trail = mode === 'dessin' ? Math.min(target, trail + SPEED[mode] * dt) : target;
    rebuild();
    controls.update();
    render();
    raf = requestAnimationFrame(tick);
  }

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    material.resolution.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    render();
  }

  function start() {
    cancelAnimationFrame(raf);
    lastFrame = performance.now();
    raf = requestAnimationFrame(tick);
  }

  renderer.setClearColor(new THREE.Color(theme.background), 1);
  resize();
  placeCamera();
  rebuild();
  render();
  if (!reducedMotion) start();
  else canvas.addEventListener('pointerdown', () => start(), { once: true }); // un geste relance le mouvement

  return {
    canvas,
    setCurve(next, closureTurns) {
      const wasFlat = ratios.length < 3;
      ratios = [...next];
      closure = closureTurns;
      t = 0;
      trail = mode === 'dessin' ? 0 : trailTarget();
      if (wasFlat !== ratios.length < 3) placeCamera();
      rebuild();
      render();
    },
    setMode(next) {
      mode = next;
      t = 0;
      trail = mode === 'dessin' ? 0 : trailTarget();
      rebuild();
      render();
    },
    setTheme(next) {
      paletteRamp = next.ramp.map((c) => new THREE.Color(c));
      renderer.setClearColor(new THREE.Color(next.background), 1);
      (head.material as THREE.MeshBasicMaterial).color.set(next.accent);
      (frame.material as THREE.LineBasicMaterial).color.set(next.frame);
      rebuild();
      render();
    },
    renderOnce: render,
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      controls.dispose();
      renderer.dispose();
    },
  };
}
