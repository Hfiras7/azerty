/* Rend les images du pharmacien (pose statique + cycles de marche). */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ICI = dirname(new URL(import.meta.url).pathname);
const L = parseInt(process.argv[2] || '482', 10);   // 2x 241
const H = parseInt(process.argv[3] || '742', 10);   // 2x 371
const IMAGES = parseInt(process.argv[4] || '12', 10);  // 12 images : la marche
                                                      // reste fluide sans alourdir

const navigateur = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await navigateur.newPage({ viewport: { width: 400, height: 300 } });
page.on('pageerror', e => console.error('ERREUR PAGE :', e.message));
await page.goto('file://' + resolve(ICI, 'page.html'));
await page.waitForFunction('window.__pret === true', { timeout: 30000 });

mkdirSync(resolve(ICI, 'out/perso'), { recursive: true });

async function rendre(direction, phase, repos, nom) {
  const url = await page.evaluate(
    ([l, h, d, p, r]) => window.__perso(l, h, d, p, r),
    [L, H, direction, phase, repos]);
  writeFileSync(resolve(ICI, 'out/perso', nom), Buffer.from(url.split(',')[1], 'base64'));
}

/* Deux jeux d'images : le pharmacien et la pharmacienne. L'étudiant
   choisit son personnage au lancement ; le jeu charge l'un ou l'autre.
   Les deux partagent la même blouse, la même chemise et le même
   pantalon : c'est le même rôle, pas deux styles différents. */
const VARIANTES = [
  ['', {}],
  ['f-', { feminin: true, cheveux: 0x3A2A20 }]
];

for (const [prefixe, variante] of VARIANTES) {
  await page.evaluate(v => { window.__variante = v; }, variante);
  await rendre('bas', 0, true, prefixe + 'pose.png');
  for (const dir of ['bas', 'haut', 'gauche', 'droite']) {
    for (let i = 0; i < IMAGES; i++) {
      await rendre(dir, i / IMAGES, false,
        `${prefixe}${dir}-${String(i).padStart(2, '0')}.png`);
    }
    console.log(`cycle de marche rendu : ${prefixe || 'pharmacien '}${dir}`);
  }
}
await page.evaluate(() => { window.__variante = {}; });
// boucle de présentation de la diapositive d'accueil, pour les deux
// personnages : celui qui accueille doit être celui que l'étudiant choisit
for (const [suffixe, feminin] of [['', true], ['h-', false]]) {
  const nb = 14;
  for (let i = 0; i < nb; i++) {
    // cadre plus large que celui de la marche : le bloc de la diapositive
    // d'accueil a un rapport 157x216, on évite ainsi toute déformation
    const url = await page.evaluate(([l, h, ph, f]) => window.__presente(l, h, ph, f),
      [Math.round(H * 157 / 216), H, i / nb, feminin]);
    writeFileSync(resolve(ICI, 'out/perso', `presente-${suffixe}${String(i).padStart(2, '0')}.png`),
      Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(`boucle de présentation rendue : ${feminin ? 'pharmacienne' : 'pharmacien'}`);
}
await navigateur.close();
