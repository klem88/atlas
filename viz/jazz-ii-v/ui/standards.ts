/**
 * Combien de standards contiennent la progression, et lesquels : la liste se charge à la demande
 * (standards.json), chaque titre s'ouvre sur sa grille, avec les passages trouvés surlignés.
 */
import { fmtInt as formatInt } from '@shell/format';
import { escapeHtml } from '@shell/html';
import { assetUrl } from '@shell/site';
import type { FrequenceProgression, Frequences, Standards } from '../data/contract';

let standards: Promise<Standards> | null = null;
const chargerStandards = () =>
  (standards ??= fetch(assetUrl('data/jazz-ii-v/standards.json')).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<Standards>;
  }));

export async function chargerFrequences(): Promise<Frequences | null> {
  try {
    const r = await fetch(assetUrl('data/jazz-ii-v/frequences.json'));
    return r.ok ? ((await r.json()) as Frequences) : null;
  } catch {
    return null;
  }
}

const pourcent = (n: number, total: number) => `${Math.round((100 * n) / total)} %`;

export function rendreFrequence(el: HTMLElement, f: Frequences | null, id: string): void {
  const p = f?.progressions.find((x) => x.id === id);
  if (!f || !p) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <p><strong>${formatInt(p.n)}</strong> standards sur ${formatInt(f.total)} la contiennent, soit ${pourcent(p.n, f.total)} des grilles de l’iRb.
      <button type="button" class="bouton-lien" data-voir aria-expanded="false">Voir lesquels</button></p>
    <div class="standards" data-liste hidden></div>`;
  const bouton = el.querySelector<HTMLButtonElement>('[data-voir]')!;
  const liste = el.querySelector<HTMLElement>('[data-liste]')!;
  bouton.addEventListener('click', async () => {
    const ouvert = bouton.getAttribute('aria-expanded') === 'true';
    bouton.setAttribute('aria-expanded', String(!ouvert));
    bouton.textContent = ouvert ? 'Voir lesquels' : 'Masquer la liste';
    liste.hidden = ouvert;
    if (!ouvert && !liste.childElementCount) {
      liste.innerHTML = '<p class="jazz-aide">Chargement de la liste…</p>';
      try {
        rendreListe(liste, p, await chargerStandards());
      } catch {
        liste.innerHTML = '<p class="jazz-aide">La liste n’a pas pu être chargée. Vérifie ta connexion et rouvre-la.</p>';
        standards = null;
      }
    }
  });
}

function rendreListe(el: HTMLElement, p: FrequenceProgression, s: Standards): void {
  el.innerHTML = `
    <label class="standards-filtre">Chercher un titre <input type="search" data-filtre autocomplete="off" /></label>
    <p class="jazz-aide">Ouvre un titre pour voir sa grille, dans sa tonalité, avec la progression surlignée.</p>
    <ul class="standards-liste">${p.morceaux
      .map(({ s: i }, k) => {
        const m = s.morceaux[i]!;
        const info = [m.c, m.a].filter(Boolean).join(', ');
        return `<li data-titre="${escapeHtml(m.t.toLowerCase())}"><details data-k="${k}"><summary><span class="standard-titre">${escapeHtml(m.t)}</span>${info ? ` <span class="standard-info">${escapeHtml(info)}</span>` : ''}</summary></details></li>`;
      })
      .join('')}</ul>`;
  el.querySelector<HTMLInputElement>('[data-filtre]')!.addEventListener('input', (e) => {
    const q = (e.target as HTMLInputElement).value.trim().toLowerCase();
    el.querySelectorAll<HTMLLIElement>('li[data-titre]').forEach((li) => (li.hidden = !!q && !li.dataset.titre!.includes(q)));
  });
  el.addEventListener(
    'toggle',
    (e) => {
      const d = e.target as HTMLDetailsElement;
      if (!d.open || d.childElementCount > 1) return;
      const { s: i, m: occ } = p.morceaux[Number(d.dataset.k)]!;
      const m = s.morceaux[i]!;
      const surlignes = new Set<number>();
      for (const [debut, l] of occ) for (let j = 0; j < l; j++) surlignes.add((debut + j) % m.accords.length);
      d.insertAdjacentHTML(
        'beforeend',
        `<div class="standard-grille">${m.ton ? `<p class="jazz-aide">En ${escapeHtml(m.ton.toLowerCase())}.</p>` : ''}<p>${m.accords
          .map((a, j) => (surlignes.has(j) ? `<mark>${escapeHtml(a)}</mark>` : `<span>${escapeHtml(a)}</span>`))
          .join(' ')}</p></div>`,
      );
    },
    true,
  );
}
