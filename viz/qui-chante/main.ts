import { fmtInt } from '@shell/format';
import { escapeHtml } from '@shell/html';
import { createSearch } from '@shell/search';
import { mountShell } from '@shell/shell';
import { assetUrl } from '@shell/site';
import { createStore } from '@shell/store';
import { GRID, type CellEntry, type CommunesFile, type SpeciesFile } from './data/contract';
import { validateCellBlock, validateCommunes, validateSpecies } from './data/validate';
import { planChorus, type ChorusPlan } from './domain/chorus';
import { blockOf } from './domain/grid';
import { LOW_EFFORT, frenchList, inSentence, presenceClass } from './domain/presence';
import { readStateFromUrl, stateToSearch, type VizState } from './state';
import { SongPlayer, type Playback, type Voice } from './ui/audio';
import { chorusHtml, lazySpectrograms, listHtml, type LocalSpecies, type Urls } from './ui/partition';
import { drawSpectrogram, loadSpectrogram } from './ui/spectrogram';
import './viz.css';

const DATA = assetUrl('data/qui-chante');

/** Quelques communes pour essayer, de la ville au bocage. */
const EXAMPLES: [string, string][] = [
  ['75056', 'Paris'],
  ['13004', 'Arles'],
  ['21584', 'Saulieu'],
  ['29019', 'Brest'],
  ['74056', 'Chamonix'],
];

mountShell({ currentSlug: 'qui-chante' });

const $ = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} introuvable`);
  return el as T;
};

async function loadJson(path: string): Promise<unknown> {
  const res = await fetch(`${DATA}/${path}`);
  if (!res.ok) throw new Error(`${path} : HTTP ${res.status}`);
  return res.json();
}

const urls: Urls = {
  song: (id) => `${DATA}/songs/${id}.mp3`,
  spectrogram: (id) => `${DATA}/spectrograms/${id}.bin`,
};

const inkColor = () => getComputedStyle(document.documentElement).getPropertyValue('--seq-6').trim();
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const PLAY_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true"><path class="i-play" d="M5 3.5v9l7.5-4.5z"/><path class="i-stop" d="M4.5 4.5h7v7h-7z"/></svg>`;

interface Head {
  el: HTMLElement;
  start: number;
  duration: number;
  /** Durée représentée par toute la largeur du curseur (s). */
  span: number;
}

async function main() {
  const [communesRaw, speciesRaw] = await Promise.all([loadJson('communes.json'), loadJson('species.json')]);
  const communes: CommunesFile = validateCommunes(communesRaw);
  const catalog: SpeciesFile = validateSpecies(speciesRaw);
  const indexByCode = new Map(communes.codes.map((c, i) => [c, i]));
  const blocks = new Map<string, Promise<Record<string, CellEntry>>>();

  const loadCell = (cell: number): Promise<CellEntry | undefined> => {
    const name = blockOf(GRID, cell);
    let p = blocks.get(name);
    if (!p) {
      p = loadJson(`cells/${name}.json`).then((b) => validateCellBlock(b, catalog.species.length).cells);
      p.catch(() => blocks.delete(name));
      blocks.set(name, p);
    }
    return p.then((cells) => cells[cell]);
  };

  const initial = readStateFromUrl(location.search);
  if (initial.commune && !indexByCode.has(initial.commune)) initial.commune = null;
  const store = createStore<VizState>(initial);

  const player = new SongPlayer();
  let playing: { playback: Playback; button: HTMLElement } | null = null;
  let spectros: ReturnType<typeof lazySpectrograms> | null = null;
  let redrawChorus = () => {};

  // --- Recherche -----------------------------------------------------------
  const search = createSearch($('search'), {
    label: 'Ta commune',
    placeholder: 'Nom de la commune',
    items: communes.codes.map((code, i) => ({ id: code, label: communes.names[i]!, detail: communes.departements[i]! })),
    onPick: (code) => store.set({ commune: code }),
  });

  $('examples').innerHTML =
    'Pour essayer : ' +
    EXAMPLES.map(([code, name]) => `<button type="button" class="link-button" data-example="${code}">${name}</button>`).join(', ');
  $('examples').addEventListener('click', (e) => {
    const code = (e.target as HTMLElement).closest<HTMLElement>('[data-example]')?.dataset.example;
    if (code) store.set({ commune: code });
  });

  // --- Lecture -------------------------------------------------------------
  /** Fait avancer les curseurs tant que la lecture dure. */
  function follow(playback: Playback, heads: Head[]) {
    if (reducedMotion()) return;
    const tick = () => {
      if (playing?.playback !== playback) return heads.forEach((h) => (h.el.hidden = true));
      const t = playback.elapsed();
      for (const h of heads) {
        const local = t - h.start;
        h.el.hidden = local < 0 || local > h.duration;
        if (!h.el.hidden) h.el.style.left = `${(100 * t) / h.span}%`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /** Joue les voix depuis `button` ; un second appui sur le même bouton arrête. */
  async function toggle(button: HTMLElement, voices: Voice[], onPlay: (p: Playback) => void) {
    const same = playing?.button === button;
    playing?.playback.stop();
    if (same) return;
    $('status').textContent = '';
    button.setAttribute('aria-busy', 'true');
    try {
      const playback = await player.play(voices);
      playing = { playback, button };
      button.setAttribute('aria-pressed', 'true');
      void playback.finished.then(() => {
        button.setAttribute('aria-pressed', 'false');
        if (playing?.playback === playback) playing = null;
      });
      onPlay(playback);
    } catch {
      $('status').textContent = 'Le chant n’a pas pu être chargé. Vérifie ta connexion et réessaie.';
    } finally {
      button.removeAttribute('aria-busy');
    }
  }

  // --- Rendu d'une commune -----------------------------------------------------
  async function render(state: VizState) {
    playing?.playback.stop();
    spectros?.disconnect();
    redrawChorus = () => {};
    const result = $('result');
    const stage = $('stage');
    if (!state.commune) {
      result.innerHTML = '';
      stage.innerHTML = `<p class="stage-empty">Choisis ta commune : tu verras les oiseaux observés autour de chez toi, et tu pourras les écouter.</p>`;
      return;
    }
    const i = indexByCode.get(state.commune)!;
    const name = communes.names[i]!;
    search.clear();
    stage.setAttribute('aria-busy', 'true');
    const entry = await loadCell(communes.cell[i]!).catch(() => null);
    stage.removeAttribute('aria-busy');
    if (store.get().commune !== state.commune) return; // une autre commune a été choisie entre-temps
    if (entry === null) {
      stage.innerHTML = `<p class="stage-empty">Les données de cette zone n’ont pas pu être chargées. Vérifie ta connexion et recharge la page.</p>`;
      return;
    }
    const total = entry?.total ?? 0;
    const local: LocalSpecies[] = (entry?.species ?? []).map((s, k) => ({
      species: catalog.species[s]!,
      count: entry!.counts[k]!,
      presence: presenceClass(entry!.counts[k]!, total),
    }));
    const top = local.slice(0, 3).map((l) => inSentence(l.species.french));

    result.innerHTML = `
      <div class="result">
        <p class="result-eyebrow">Autour de ${escapeHtml(name)}, dans un rayon d’environ 15 km</p>
        <p class="result-figure">${fmtInt(local.length)} espèces d’oiseaux</p>
        <p class="result-detail">observées depuis ${catalog.years[0]}${top.length ? `. Les plus présentes : ${escapeHtml(frenchList(top))}.` : '.'}</p>
        ${total < LOW_EFFORT ? `<p class="note">Peu d’observations ont été partagées autour de chez toi (${fmtInt(total)}) : la liste est sans doute incomplète, surtout pour les espèces discrètes.</p>` : ''}
        <p class="result-detail detail">${fmtInt(total)} observations d’oiseaux partagées par des naturalistes, de ${catalog.years[0]} à ${catalog.years[1]}.</p>
      </div>`;

    const plan: ChorusPlan = planChorus(local.map((l) => ({ count: l.count, duration: l.species.song?.duration ?? null })));
    stage.innerHTML = `
      ${
        plan.voices.length > 1
          ? `<section class="chorus" aria-labelledby="chorus-title">
        <div class="chorus-head">
          <h2 id="chorus-title">Le chœur de l’aube</h2>
          <button class="button button--primary chorus-play" type="button" id="chorus-play" aria-pressed="false">${PLAY_ICON}<span class="i-play">Écouter le chœur</span><span class="i-stop">Arrêter</span></button>
        </div>
        <p class="chorus-lede">Les ${plan.voices.length} espèces les plus présentes autour de toi entrent l’une après l’autre, comme les voix d’un canon.</p>
        <div class="voices-frame">${chorusHtml(local, plan)}</div>
      </section>`
          : ''
      }
      <section class="birds" aria-labelledby="birds-title">
        <h2 id="birds-title">Toutes les espèces, de la plus présente à la plus rare</h2>
        <ol class="bird-list">${listHtml(local)}</ol>
      </section>`;

    spectros = lazySpectrograms(stage, local, catalog.spectrogram, urls, inkColor);

    stage.querySelector('#chorus-play')?.addEventListener('click', (e) => {
      const button = e.currentTarget as HTMLElement;
      const voices = plan.voices.map((v) => ({ url: urls.song(local[v.index]!.species.song!.xcId), start: v.start, gain: v.gain }));
      void toggle(button, voices, (playback) => {
        const head = stage.querySelector<HTMLElement>('.playhead--chorus')!;
        follow(playback, [{ el: head, start: 0, duration: plan.duration, span: plan.duration }]);
        // L'accent désigne les voix qui chantent.
        const rows = [...stage.querySelectorAll<HTMLElement>('.voice')];
        const mark = () => {
          const on = playing?.playback === playback;
          const t = playback.elapsed();
          plan.voices.forEach((v, k) => rows[k]!.toggleAttribute('data-singing', on && t >= v.start && t <= v.start + v.duration));
          if (on) requestAnimationFrame(mark);
        };
        requestAnimationFrame(mark);
      });
    });

    stage.querySelector('.bird-list')?.addEventListener('click', (e) => {
      const button = (e.target as HTMLElement).closest<HTMLElement>('[data-play]');
      if (!button) return;
      const song = local[Number(button.dataset.play)]!.species.song!;
      void toggle(button, [{ url: urls.song(song.xcId), start: 0, gain: 1 }], (playback) => {
        const head = button.closest('.bird')!.querySelector<HTMLElement>('.playhead')!;
        follow(playback, [{ el: head, start: 0, duration: song.duration, span: song.frames * catalog.spectrogram.frameSeconds }]);
      });
    });

    // Partition du chœur : chaque voix à sa place sur le temps commun.
    const voiceData = await Promise.all(
      plan.voices.map((v) => loadSpectrogram(urls.spectrogram(local[v.index]!.species.song!.xcId)).catch(() => null)),
    );
    if (store.get().commune !== state.commune) return;
    redrawChorus = () =>
      plan.voices.forEach((v, k) => {
        const canvas = stage.querySelector<HTMLCanvasElement>(`[data-voice-spectro="${k}"]`);
        const data = voiceData[k];
        const song = local[v.index]!.species.song!;
        if (canvas && data) {
          drawSpectrogram(canvas, data, catalog.spectrogram, song.frames, inkColor(), { seconds: plan.duration, offset: v.start });
        }
      });
    redrawChorus();
  }

  store.subscribe((state) => {
    history.replaceState(null, '', `${location.pathname}${stateToSearch(state)}`);
    void render(state);
  });
  void render(store.get());

  // Redessin au changement de taille ou de thème.
  const redraw = () => {
    spectros?.redraw();
    redrawChorus();
  };
  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(redraw, 150);
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redraw);
}

main().catch((err: unknown) => {
  console.error(err);
  $('stage').innerHTML = `<p class="stage-empty">Les données n’ont pas pu être chargées. Recharge la page ; si le problème continue, reviens un peu plus tard.</p>`;
});
