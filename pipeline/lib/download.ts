import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { log } from './log';

interface DownloadOptions {
  /** Taille minimale attendue (octets) : protège contre les pages d'erreur servies en 200. */
  minBytes?: number;
  retries?: number;
}

/**
 * Télécharge `url` vers `dest` si le fichier n'est pas déjà en cache.
 * Écriture atomique (fichier temporaire puis renommage) : un téléchargement
 * interrompu ne laisse jamais de fichier corrompu dans le cache.
 */
export async function downloadCached(url: string, dest: string, opts: DownloadOptions = {}): Promise<string> {
  const { minBytes = 1, retries = 3 } = opts;
  if (await isValidFile(dest, minBytes)) return dest;

  await mkdir(dirname(dest), { recursive: true });
  const tmp = `${dest}.part`;

  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body as WebReadableStream), createWriteStream(tmp));
      if (!(await isValidFile(tmp, minBytes))) throw new Error(`fichier trop petit (< ${minBytes} o)`);
      await rename(tmp, dest);
      log.info(`téléchargé ${dest.split(/[\\/]/).pop()}`);
      return dest;
    } catch (err) {
      await rm(tmp, { force: true });
      if (attempt >= retries) throw new Error(`Échec du téléchargement ${url} : ${(err as Error).message}`);
      const delay = 1000 * 2 ** attempt;
      log.warn(`tentative ${attempt}/${retries} échouée (${(err as Error).message}), nouvel essai dans ${delay} ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  return res.text();
}

async function isValidFile(path: string, minBytes: number): Promise<boolean> {
  try {
    return (await stat(path)).size >= minBytes;
  } catch {
    return false;
  }
}

/** Exécute `tasks` avec au plus `limit` promesses simultanées, en conservant l'ordre des résultats. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
