/**
 * Fenêtre « Partager » commune : génère une image (fournie par la visualisation), la montre,
 * puis propose le partage natif (mobile), le téléchargement et la copie du lien.
 *
 * Marquage attendu dans la fenêtre : `.share-preview` (img), `[data-action=share|download|copy|close]`,
 * `.share-status`. Styles dans components.css.
 */
export interface ShareSetup {
  button: HTMLButtonElement;
  dialog: HTMLDialogElement;
  fileName: string;
  /** Dessine l'image au moment du clic. */
  render(): Promise<Blob>;
  /** Phrase qui accompagne l'image dans le partage natif. */
  text(): string;
}

export function setupShareDialog(o: ShareSetup): void {
  const { button, dialog } = o;
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
      blob = await o.render();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(blob);
      img.src = objectUrl;
      const file = new File([blob], o.fileName, { type: 'image/png' });
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
      await navigator.share({ files: [new File([blob], o.fileName, { type: 'image/png' })], text: `${o.text()} ${location.href}` });
      status.textContent = 'Partagé.';
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') status.textContent = 'Le partage a échoué. Télécharge l’image à la place.';
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!objectUrl) return;
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = o.fileName;
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
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}

/** Un canvas en PNG. */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob a échoué'))), 'image/png'));
}

/** Coupe un texte en lignes qui tiennent dans `maxWidth` (canvas). */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines;
}
