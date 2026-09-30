/**
 * Lance une tâche Node d'une visualisation, par convention de dossier :
 *
 *   npm run data -- <slug> [options]   → viz/<slug>/pipeline/build.ts
 *   npm run og   -- <slug>             → viz/<slug>/og/build-og.ts
 *
 * Chaque fichier exporte par défaut une fonction `(args: string[]) => Promise<void>`.
 * Sans slug, affiche les visualisations qui proposent la tâche.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const TASKS = {
  data: 'pipeline/build.ts',
  og: 'og/build-og.ts',
} as const;
export type TaskName = keyof typeof TASKS;

/** Erreur d'utilisation : on affiche le message seul, sans pile d'appels. */
class UsageError extends Error {}

const VIZ_DIR = join(import.meta.dirname, '..', 'viz');

export function vizWithTask(task: TaskName, vizDir = VIZ_DIR): string[] {
  return readdirSync(vizDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && existsSync(join(vizDir, d.name, TASKS[task])))
    .map((d) => d.name);
}

async function run(argv: string[]): Promise<void> {
  const [task, slug, ...rest] = argv;
  if (!task || !(task in TASKS)) {
    throw new UsageError(`Tâche inconnue « ${task ?? ''} ». Tâches disponibles : ${Object.keys(TASKS).join(', ')}.`);
  }
  const available = vizWithTask(task as TaskName);
  if (!slug || !available.includes(slug)) {
    throw new UsageError(
      `${slug ? `« ${slug} » ne propose pas la tâche « ${task} ».` : 'Visualisation manquante.'}\n` +
        `Usage : npm run ${task} -- <slug>\nDisponibles : ${available.join(', ') || '(aucune)'}`,
    );
  }
  const mod = (await import(pathToFileURL(join(VIZ_DIR, slug, TASKS[task as TaskName])).href)) as {
    default?: (args: string[]) => Promise<void>;
  };
  if (typeof mod.default !== 'function') throw new Error(`${TASKS[task as TaskName]} doit exporter une fonction par défaut.`);
  await mod.default(rest);
}

// Exécuté directement (pas lors d'un import dans les tests).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  run(process.argv.slice(2)).catch((err: unknown) => {
    console.error(`\n✖ ${(err as Error).message}`);
    process.exitCode = 1;
  });
}
