/**
 * Petites bulles : au survol (souris), au toucher long (doigt), ou par un bouton « ? » (`.tip-q[data-tip]`).
 * Une seule à la fois, jamais bloquante ; un toucher long n'ajoute pas l'accord (le clic qui suit est avalé).
 */
const LONG_PRESS_MS = 500;

export function mountTips(root: HTMLElement) {
  const bubble = document.createElement('div');
  bubble.className = 'tip';
  bubble.setAttribute('role', 'tooltip');
  bubble.hidden = true;
  root.appendChild(bubble);
  let timer = 0;
  let swallowClick = false;

  const show = (target: Element) => {
    const text = (target as HTMLElement).dataset.tip;
    if (!text) return;
    bubble.textContent = text;
    bubble.hidden = false;
    const r = target.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    // La bulle (centrée, au plus 18 rem ou la largeur de l'écran moins 2 rem) reste dans la boîte et dans l'écran.
    const half = Math.min(bubble.offsetWidth, box.width) / 2;
    const x = Math.min(Math.max(r.left + r.width / 2 - box.left, half), Math.max(box.width - half, half));
    bubble.style.left = `${x}px`;
    // Au-dessus de la cible ; en dessous quand il n'y a pas la place.
    const above = r.top - box.top - 8 >= bubble.offsetHeight;
    bubble.classList.toggle('tip--below', !above);
    bubble.style.top = `${above ? r.top - box.top - 8 : r.bottom - box.top + 8}px`;
  };
  const hide = () => {
    bubble.hidden = true;
  };
  const tipOf = (e: Event) => (e.target as Element).closest('[data-tip]');

  root.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const t = tipOf(e);
    if (t && !t.classList.contains('tip-q')) show(t);
  });
  root.addEventListener('pointerout', (e) => {
    if (e.pointerType === 'mouse') hide();
  });
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    swallowClick = false;
    const t = tipOf(e);
    if (!t || t.classList.contains('tip-q')) return;
    timer = window.setTimeout(() => {
      show(t);
      swallowClick = true;
    }, LONG_PRESS_MS);
  });
  const cancel = () => clearTimeout(timer);
  root.addEventListener('pointerup', cancel);
  root.addEventListener('pointercancel', () => {
    cancel();
    swallowClick = false;
  });
  root.addEventListener('scroll', hide, true);
  root.addEventListener(
    'click',
    (e) => {
      if (swallowClick) {
        e.stopPropagation();
        e.preventDefault();
        swallowClick = false;
        return;
      }
      const q = (e.target as Element).closest('.tip-q');
      if (q) {
        e.preventDefault();
        if (bubble.hidden || bubble.textContent !== (q as HTMLElement).dataset.tip) show(q);
        else hide();
        return;
      }
      hide();
    },
    true,
  );
  root.addEventListener('contextmenu', (e) => {
    if (tipOf(e)) e.preventDefault();
  });
}
