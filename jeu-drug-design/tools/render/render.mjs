/* Rend les scènes 3D en PNG haute résolution via Chromium headless. */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// liste : [nom de scène, largeur, hauteur, fichier de sortie, transparent]
const TACHES = JSON.parse(process.argv[2]);
const ICI = dirname(new URL(import.meta.url).pathname);

const navigateur = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const page = await navigateur.newPage({ viewport: { width: 400, height: 300 } });
page.on('pageerror', e => console.error('ERREUR PAGE :', e.message));
await page.goto('file://' + resolve(ICI, 'page.html'));
await page.waitForFunction('window.__pret === true', { timeout: 30000 });

for (const [nom, L, H, sortie, transparent] of TACHES) {
  const t0 = Date.now();
  const url = await page.evaluate(
    ([n, l, h, tr]) => window.__rendu(n, l, h, tr),
    [nom, L, H, !!transparent]);
  const chemin = resolve(ICI, '../..', sortie);
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, Buffer.from(url.split(',')[1], 'base64'));
  console.log(`${nom.padEnd(22)} ${L}x${H} -> ${sortie}  (${Date.now() - t0} ms)`);
}
await navigateur.close();
