/**
 * Le tore en three.js : la surface, le réseau (quintes, tierces majeures, tierces mineures), les 24 triades en
 * facettes étiquetées, et le chemin d'un morceau qui se trace pendant l'écoute (tête à l'accent, traîne dans la rampe).
 * Orbite à la souris (deux doigts sur téléphone), rotation automatique lente sauf `prefers-reduced-motion`.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TRIADS, latticeOf, pathBetween, torusCoords, torusPoint, triadLattice, triadTorus, MAJOR_RADIUS, MINOR_RADIUS, type Triad } from '../domain/tonnetz';

export interface TorusTheme {
  background: string;
  surface: string;
  wire: string;
  major: string;
  minor: string;
  label: string;
  trail: string;
  ahead: string;
  accent: string;
}

export function readTorusTheme(): TorusTheme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return { background: v('--surface'), surface: v('--surface-sunk'), wire: v('--rule-strong'), major: v('--seq-1'), minor: v('--seq-3'), label: v('--ink'), trail: v('--seq-5'), ahead: v('--seq-2'), accent: v('--accent') };
}

export interface TorusScene {
  /** Le chemin complet (positions sur le tore) ; `rings` : positions des accords ramenés à une triade voisine. */
  setPath(points: readonly { s: number; t: number }[], rings: readonly { s: number; t: number }[]): void;
  /** Avance la tête jusqu'au point d'indice `i` (−1 : rien de parcouru). */
  setHead(i: number): void;
  setTheme(theme: TorusTheme): void;
  setAutoRotate(on: boolean): void;
  resize(): void;
  canvas: HTMLCanvasElement;
  dispose(): void;
}

const V3 = (p: { x: number; y: number; z: number }) => new THREE.Vector3(p.x, p.y, p.z);

function labelSprite(text: string, color: string, minor: boolean): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.font = `${minor ? 400 : 700} 34px "Atkinson Hyperlegible Next", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 64, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: true }));
  s.scale.set(0.42, 0.21, 1);
  return s;
}

const NAMES = ['do', 'ré♭', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
const label = (t: Triad) => (t.mode === 'maj' ? NAMES[t.root]!.toUpperCase() : NAMES[t.root]!);

/** Triangle d'une triade en coordonnées de réseau (fondamentale, puis les deux autres). */
function triangleLattice(t: Triad): [number, number][] {
  const { a, b } = latticeOf(t.root);
  return t.mode === 'maj'
    ? [
        [a, b],
        [a, b + 1],
        [a + 1, b],
      ]
    : [
        [a, b],
        [a + 1, b - 1],
        [a + 1, b],
      ];
}

/** Facette courbe : le triangle subdivisé, chaque sommet posé sur la surface. */
function facetGeometry(t: Triad, lift: number, n = 5): THREE.BufferGeometry {
  const [A, B, C] = triangleLattice(t);
  const verts: number[] = [];
  const idx: number[] = [];
  const rows: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const row: number[] = [];
    for (let j = 0; j <= n - i; j++) {
      const u = i / n;
      const v = j / n;
      const w = 1 - u - v;
      const a = A![0] * w + B![0] * u + C![0] * v;
      const b = A![1] * w + B![1] * u + C![1] * v;
      const { s, t: tt } = torusCoords(a, b);
      const p = torusPoint(s, tt, lift);
      row.push(verts.length / 3);
      verts.push(p.x, p.y, p.z);
    }
    rows.push(row);
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i; j++) {
      idx.push(rows[i]![j]!, rows[i + 1]![j]!, rows[i]![j + 1]!);
      if (j < n - i - 1) idx.push(rows[i + 1]![j]!, rows[i + 1]![j + 1]!, rows[i]![j + 1]!);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Une ligne du réseau : on marche dans une direction (da, db) depuis (a0, b0) jusqu'au retour. */
function latticeLine(a0: number, b0: number, da: number, db: number, period: number, lift: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const sub = 10;
  for (let i = 0; i <= period * sub; i++) {
    const a = a0 + (da * i) / sub;
    const b = b0 + (db * i) / sub;
    const { s, t } = torusCoords(a, b);
    pts.push(V3(torusPoint(s, t, lift)));
  }
  return pts;
}

export function createTorusScene(container: HTMLElement, theme: TorusTheme, reducedMotion: boolean): TorusScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  container.append(renderer.domElement);
  const canvas = renderer.domElement;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 5.2, 6.4);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.45;
  controls.touches = { ONE: null as unknown as THREE.TOUCH, TWO: THREE.TOUCH.ROTATE };
  canvas.style.touchAction = 'pan-y';

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 0.7);
  sun.position.set(3, 6, 4);
  scene.add(sun);

  // Surface
  const surfaceMat = new THREE.MeshLambertMaterial({ color: theme.surface, transparent: true, opacity: 0.96 });
  const surface = new THREE.Mesh(new THREE.TorusGeometry(MAJOR_RADIUS, MINOR_RADIUS, 40, 96), surfaceMat);
  surface.rotation.x = Math.PI / 2; // l'axe du tore vertical
  scene.add(surface);
  // TorusGeometry pose le tube dans le plan XY ; nos points (torusPoint) le posent dans le plan XZ : on tourne la surface, pas les points.

  // Réseau : une ligne de quintes (12 pas), quatre de tierces majeures (3 pas), trois de tierces mineures (4 pas)
  const wireMat = new THREE.LineBasicMaterial({ color: theme.wire, transparent: true, opacity: 0.9 });
  const wires: THREE.Line[] = [];
  const addLine = (pts: THREE.Vector3[]) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat);
    scene.add(l);
    wires.push(l);
  };
  addLine(latticeLine(0, 0, 1, 0, 12, 0.012));
  for (let a = 0; a < 4; a++) addLine(latticeLine(a, 0, 0, 1, 3, 0.012));
  for (let k = 0; k < 3; k++) addLine(latticeLine(0, k, 1, -1, 4, 0.012));

  // Facettes et étiquettes
  const facetMats = { maj: new THREE.MeshLambertMaterial({ color: theme.major, transparent: true, opacity: 0.92, side: THREE.DoubleSide }), min: new THREE.MeshLambertMaterial({ color: theme.minor, transparent: true, opacity: 0.92, side: THREE.DoubleSide }) };
  const sprites: { sprite: THREE.Sprite; triad: Triad }[] = [];
  for (const t of TRIADS) {
    scene.add(new THREE.Mesh(facetGeometry(t, 0.006), facetMats[t.mode]));
    const { a, b } = triadLattice(t);
    const { s, t: tt } = torusCoords(a, b);
    const sp = labelSprite(label(t), theme.label, t.mode === 'min');
    sp.position.copy(V3(torusPoint(s, tt, 0.05)));
    scene.add(sp);
    sprites.push({ sprite: sp, triad: t });
  }
  void triadTorus;

  // Chemin
  const LIFT = 0.07;
  let aheadMesh: THREE.Mesh | null = null;
  let trailMesh: THREE.Mesh | null = null;
  const aheadMat = new THREE.MeshBasicMaterial({ color: theme.ahead, transparent: true, opacity: 0.55 });
  const trailMat = new THREE.MeshBasicMaterial({ color: theme.trail });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), new THREE.MeshBasicMaterial({ color: theme.accent }));
  head.visible = false;
  scene.add(head);
  const ringMat = new THREE.MeshBasicMaterial({ color: theme.accent, transparent: true, opacity: 0.8 });
  const ringGeo = new THREE.TorusGeometry(0.1, 0.012, 8, 32);
  let ringMeshes: THREE.Mesh[] = [];
  /** Points 3D du chemin, densifiés le long de la surface ; `anchors[i]` = indice du point du i-ème accord. */
  let curvePoints: THREE.Vector3[] = [];
  let anchors: number[] = [];

  function tube(points: THREE.Vector3[], radius: number, mat: THREE.Material): THREE.Mesh | null {
    if (points.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    const geo = new THREE.TubeGeometry(curve, Math.max(8, points.length * 3), radius, 10, false);
    return new THREE.Mesh(geo, mat);
  }
  function clearMesh(m: THREE.Mesh | null) {
    if (!m) return;
    scene.remove(m);
    m.geometry.dispose();
  }

  function setPath(points: readonly { s: number; t: number }[], rings: readonly { s: number; t: number }[]) {
    clearMesh(aheadMesh);
    clearMesh(trailMesh);
    aheadMesh = trailMesh = null;
    for (const r of ringMeshes) scene.remove(r);
    ringMeshes = [];
    curvePoints = [];
    anchors = [];
    points.forEach((p, i) => {
      if (i === 0) {
        anchors.push(0);
        curvePoints.push(V3(torusPoint(p.s, p.t, LIFT)));
        return;
      }
      const seg = pathBetween(points[i - 1]!, p, 8).slice(1);
      for (const q of seg) curvePoints.push(V3(torusPoint(q.s, q.t, LIFT)));
      anchors.push(curvePoints.length - 1);
    });
    aheadMesh = tube(curvePoints, 0.028, aheadMat);
    if (aheadMesh) scene.add(aheadMesh);
    for (const r of rings) {
      const m = new THREE.Mesh(ringGeo, ringMat);
      const p = V3(torusPoint(r.s, r.t, LIFT));
      m.position.copy(p);
      m.lookAt(V3(torusPoint(r.s, r.t, LIFT + 1)));
      scene.add(m);
      ringMeshes.push(m);
    }
    setHead(-1);
  }

  function setHead(i: number) {
    clearMesh(trailMesh);
    trailMesh = null;
    if (i < 0 || anchors.length === 0) {
      head.visible = false;
      render();
      return;
    }
    const end = anchors[Math.min(i, anchors.length - 1)]!;
    const pts = curvePoints.slice(0, end + 1);
    trailMesh = tube(pts, 0.04, trailMat);
    if (trailMesh) scene.add(trailMesh);
    head.visible = true;
    head.position.copy(curvePoints[end]!);
    render();
  }

  let raf = 0;
  function render() {
    renderer.render(scene, camera);
  }
  function loop() {
    controls.update();
    render();
    raf = requestAnimationFrame(loop);
  }
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // En portrait, on recule pour garder le tore entier.
    const back = Math.max(1, 1.25 / camera.aspect);
    camera.position.setLength(8.2 * back);
    controls.update();
    render();
  }
  renderer.setClearColor(new THREE.Color(theme.background), 1);
  resize();
  if (reducedMotion) controls.addEventListener('change', render);
  else loop();

  return {
    canvas,
    setPath,
    setHead,
    setAutoRotate(on) {
      controls.autoRotate = on && !reducedMotion;
    },
    setTheme(next) {
      renderer.setClearColor(new THREE.Color(next.background), 1);
      surfaceMat.color.set(next.surface);
      wireMat.color.set(next.wire);
      facetMats.maj.color.set(next.major);
      facetMats.min.color.set(next.minor);
      aheadMat.color.set(next.ahead);
      trailMat.color.set(next.trail);
      (head.material as THREE.MeshBasicMaterial).color.set(next.accent);
      ringMat.color.set(next.accent);
      for (const { sprite, triad } of sprites) {
        const fresh = labelSprite(label(triad), next.label, triad.mode === 'min');
        sprite.material.map?.dispose();
        sprite.material.map = fresh.material.map;
        sprite.material.needsUpdate = true;
      }
      render();
    },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      renderer.dispose();
    },
  };
}
