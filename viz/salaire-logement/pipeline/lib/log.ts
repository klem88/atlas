const time = () => new Date().toISOString().slice(11, 19);

export const log = {
  step: (msg: string) => console.log(`\n[${time()}] ▶ ${msg}`),
  info: (msg: string) => console.log(`[${time()}]   ${msg}`),
  warn: (msg: string) => console.warn(`[${time()}] ⚠ ${msg}`),
};
