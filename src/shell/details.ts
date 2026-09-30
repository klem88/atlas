/**
 * « Plus de détails » : les textes secondaires (aides, notes de calcul, sources) portent la classe `detail`
 * et restent cachés tant que le lecteur ne les demande pas. Un bouton `[data-details-toggle]` les affiche
 * ou les masque, et le navigateur retient ce choix d'une visite à l'autre.
 *
 * Ce qui est indispensable pour lire juste (légende, estimations signalées) ne porte jamais `detail`.
 */

const KEY = 'atlas:details';

/** Préférence enregistrée : false par défaut, et si le stockage est indisponible (navigation privée, blocage). */
export function readDetailsPref(storage: Pick<Storage, 'getItem'> | undefined): boolean {
  try {
    return storage?.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

function saveDetailsPref(storage: Pick<Storage, 'setItem'> | undefined, on: boolean): void {
  try {
    storage?.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // Préférence non retenue : sans conséquence.
  }
}

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function setupDetails(): void {
  const root = document.documentElement;
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-details-toggle]')];
  if (buttons.length === 0) return;

  const apply = (on: boolean) => {
    root.dataset.details = on ? 'on' : 'off';
    for (const b of buttons) {
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('.details-toggle-label')!.textContent = on ? 'Moins de détails' : 'Plus de détails';
    }
  };

  apply(readDetailsPref(storage()));
  for (const b of buttons) {
    b.hidden = false;
    b.addEventListener('click', () => {
      const on = root.dataset.details !== 'on';
      apply(on);
      saveDetailsPref(storage(), on);
    });
  }
}
