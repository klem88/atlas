import { fmtInt } from '@shell/format';
import { CARD_HEIGHT, CARD_WIDTH, drawShareCard, type CardTheme, type ShareCardData } from './share-card';

interface ShareOptions {
  /** Données de la carte au moment du clic. */
  getData: () => ShareCardData;
  /** Vue courante de la carte, à intégrer à l'image. */
  getMapImage: () => HTMLCanvasElement | undefined;
  getText: () => string;
}

const FILE_NAME = 'ce-que-ton-salaire-achete.png';

/**
 * Bouton « Partager mon résultat » : génère l'image, la montre dans une fenêtre,
 * puis propose le partage natif (mobile) ou le téléchargement + copie du lien.
 */
export function setupShare(button: HTMLButtonElement, dialog: HTMLDialogElement, o: ShareOptions): void {
  const img = dialog.querySelector<HTMLImageElement>('.share-preview')!;
  const shareBtn = dialog.querySelector<HTMLButtonElement>('[data-action="share"]')!;
  const downloadBtn = dialog.querySelector<HTMLButtonElement>('[data-action="download"]')!;
  const copyBtn = dialog.querySelector<HTMLButtonElement>('[data-action="copy"]')!;
  const status = dialog.querySelector<HTMLElement>('.share-status')!;
  let blob: Blob | null = null;
  let objectUrl: string | null = null;

  button.addEventListener('click', async () => {
    status.textContent = '';
    button.disabled = true;
    try {
      blob = await renderCard(o.getData(), o.getMapImage());
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(blob);
      img.src = objectUrl;
      const file = new File([blob], FILE_NAME, { type: 'image/png' });
      shareBtn.hidden = !navigator.canShare?.({ files: [file] });
      dialog.showModal();
    } catch (err) {
      console.error(err);
      status.textContent = 'L’image n’a pas pu être générée.';
    } finally {
      button.disabled = false;
    }
  });

  shareBtn.addEventListener('click', async () => {
    if (!blob) return;
    try {
      await navigator.share({
        files: [new File([blob], FILE_NAME, { type: 'image/png' })],
        text: `${o.getText()} ${location.href}`,
      });
      status.textContent = 'Partagé.';
    } catch (err) {
      // Annulation par l'utilisateur : rien à signaler.
      if ((err as DOMException).name !== 'AbortError') status.textContent = 'Le partage a échoué. Télécharge l’image à la place.';
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!objectUrl) return;
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = FILE_NAME;
    a.click();
    status.textContent = 'Image téléchargée.';
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      status.textContent = 'Lien copié : il redonne exactement cette vue.';
    } catch {
      status.textContent = `Copie impossible. Voici le lien : ${location.href}`;
    }
  });

  dialog.querySelector('[data-action="close"]')!.addEventListener('click', () => dialog.close());
  // Clic sur le fond : fermer.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}

async function renderCard(data: ShareCardData, mapImage: HTMLCanvasElement | undefined): Promise<Blob> {
  const theme = readCardTheme();
  // Les polices web doivent être chargées avant de dessiner sur le canvas.
  await Promise.all([
    document.fonts.load(`300 150px ${theme.fontUi}`),
    document.fonts.load(`600 36px ${theme.fontUi}`),
    document.fonts.load(`300 44px ${theme.fontDisplay}`),
    document.fonts.load(`400 46px ${theme.fontDisplay}`),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  drawShareCard(canvas.getContext('2d')!, data, theme, mapImage);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob a échoué'))), 'image/png'));
}

function readCardTheme(): CardTheme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    surface: v('--surface'),
    page: v('--page'),
    ink: v('--ink'),
    ink2: v('--ink-2'),
    ink3: v('--ink-3'),
    rule: v('--rule'),
    line: v('--seq-5'),
    accent: v('--accent'),
    fontDisplay: v('--font-display'),
    fontUi: v('--font-ui'),
  };
}

/** Phrase d'accompagnement du partage. */
export function shareText(income: number, figure: string, caption: string, comparison: string | null): string {
  return `Avec ${fmtInt(income)} € nets par mois : ${figure} ${caption}${comparison ? ` (${comparison})` : ''}. Et toi ?`;
}
