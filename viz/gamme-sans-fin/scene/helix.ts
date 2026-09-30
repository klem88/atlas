/**
 * L'hélice des hauteurs en three.js : un tour par octave, neuf tours, les douze noms de notes autour,
 * et les composantes du son de Shepard en sphères qui grimpent (taille et opacité = amplitude).
 * Deux vues : de côté (on voit monter), de dessus (on voit tourner en rond). La caméra glisse de l'une à l'autre.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OCTAVES, PITCH_NAMES, helixPoint, type Component } from '../domain/shepard';

export type ViewId = 'cote' | 'dessus';

export interface HelixTheme {
  background: string;
  wire: string;
  sphere: string;
  accent: string;
  label: string;
}

export function readHelixTheme(): HelixTheme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return { background: v('--surface'), wire: v('--rule-strong'), sphere: v('--seq-4'), accent: v('--accent'), label: v('--ink-2') };
}

const RADIUS = 1;
const PITCH = 0.42;
const HEIGHT = OCTAVES * PITCH;
const VIEWS: Record<ViewId, THREE.Vector3> = {
  cote: new THREE.Vector3(3.6, HEIGHT / 2 + 1.2, 4.2),
  dessus: new THREE.Vector3(0.01, HEIGHT + 5.2, 0.01),
};

export interface HelixScene {
  setComponents(components: readonly Component[]): void;
  setView(view: ViewId): void;
  setTheme(theme: HelixTheme): void;
  resize(): void;
  renderOnce(): void;
  canvas: HTMLCanvasElement;
}

function labelSprite(text: string, color: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.font = '500 34px "Atkinson Hyperlegible Next", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 64, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(0.5, 0.25, 1);
  return s;
}

export function createHelixScene(container: HTMLElement, theme: HelixTheme, reducedMotion: boolean): HelixScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  container.append(renderer.domElement);
  const canvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const target = new THREE.Vector3(0, HEIGHT / 2, 0);
  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.touches = { ONE: null as unknown as THREE.TOUCH, TWO: THREE.TOUCH.ROTATE };
  canvas.style.touchAction = 'pan-y';

  // L'hélice
  const wirePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= OCTAVES * 96; i++) {
    const p = helixPoint(i / 96, RADIUS, PITCH);
    wirePoints.push(new THREE.Vector3(p.x, p.y, p.z));
  }
  const wireMaterial = new THREE.LineBasicMaterial({ color: theme.wire, transparent: true, opacity: 0.8 });
  const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(wirePoints), wireMaterial);
  scene.add(wire);

  // Un cercle au sol et les douze noms, pour lire la classe de hauteur
  const ringPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 96; i++) {
    const p = helixPoint(i / 96, RADIUS * 1.18, 0);
    ringPoints.push(new THREE.Vector3(p.x, -0.02, p.z));
  }
  const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPoints), new THREE.LineBasicMaterial({ color: theme.wire, transparent: true, opacity: 0.5 }));
  scene.add(ring);
  const labels: THREE.Sprite[] = PITCH_NAMES.map((name, i) => {
    const p = helixPoint(i / 12, RADIUS * 1.42, 0);
    const s = labelSprite(name, theme.label);
    s.position.set(p.x, 0, p.z);
    scene.add(s);
    return s;
  });

  // Les composantes
  const sphereGeometry = new THREE.SphereGeometry(0.11, 20, 20);
  const spheres: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>[] = [];
  for (let k = 0; k < OCTAVES; k++) {
    const m = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({ color: theme.sphere, transparent: true }));
    scene.add(m);
    spheres.push(m);
  }
  let sphereColor = new THREE.Color(theme.sphere);
  let accentColor = new THREE.Color(theme.accent);

  let currentView: ViewId = 'cote';
  let cameraGoal = VIEWS.cote.clone();
  let animating = false;
  /** L'utilisateur a orbité lui-même : on ne replace pas la caméra au prochain redimensionnement. */
  let userMoved = false;

  /** Sur un écran étroit (portrait), la caméra recule pour garder toute l'hélice dans le cadre. */
  function goalFor(view: ViewId): THREE.Vector3 {
    const spread = Math.max(1, 1.35 / camera.aspect);
    return VIEWS[view].clone().multiplyScalar(spread);
  }

  function render() {
    renderer.render(scene, camera);
  }

  function tick() {
    const d = camera.position.distanceTo(cameraGoal);
    if (d > 0.005) {
      camera.position.lerp(cameraGoal, reducedMotion ? 1 : 0.08);
      controls.update();
      render();
      requestAnimationFrame(tick);
    } else {
      controls.update();
      render();
      animating = false;
    }
  }

  function requestRender() {
    if (animating) return;
    animating = true;
    requestAnimationFrame(tick);
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
    if (!userMoved) {
      cameraGoal = goalFor(currentView);
      camera.position.copy(cameraGoal);
    }
    controls.update();
    render();
  }

  controls.addEventListener('change', render);
  // Quand l'utilisateur tourne la caméra, la vue « de côté » devient la sienne : l'objectif suit.
  controls.addEventListener('end', () => {
    cameraGoal.copy(camera.position);
    userMoved = true;
  });

  renderer.setClearColor(new THREE.Color(theme.background), 1);
  camera.position.copy(VIEWS.cote);
  camera.lookAt(target);
  resize();
  controls.update();
  render();

  return {
    canvas,
    setComponents(components) {
      let best = 0;
      components.forEach((c, k) => {
        if (c.amp > components[best]!.amp) best = k;
      });
      components.forEach((c, k) => {
        const s = spheres[k]!;
        const p = helixPoint(c.octaves, RADIUS, PITCH);
        s.position.set(p.x, p.y, p.z);
        const size = 0.35 + c.amp * 1.1;
        s.scale.set(size, size, size);
        s.material.opacity = 0.15 + 0.85 * c.amp;
        s.material.color.copy(k === best ? accentColor : sphereColor);
      });
      render();
    },
    setView(next) {
      currentView = next;
      userMoved = false;
      cameraGoal = goalFor(next);
      requestRender();
    },
    setTheme(next) {
      renderer.setClearColor(new THREE.Color(next.background), 1);
      wireMaterial.color.set(next.wire);
      (ring.material as THREE.LineBasicMaterial).color.set(next.wire);
      sphereColor = new THREE.Color(next.sphere);
      accentColor = new THREE.Color(next.accent);
      labels.forEach((s, i) => {
        const fresh = labelSprite(PITCH_NAMES[i]!, next.label);
        s.material.map?.dispose();
        s.material.map = fresh.material.map;
        s.material.needsUpdate = true;
      });
      render();
    },
    resize,
    renderOnce: render,
  };
}

