/* =====================================================================
   EPOS — bibliothèque de rendu 3D
   Éléments communs à toutes les illustrations du jeu : palette, banc
   d'éclairage, molécules en boules-et-bâtons, verrerie, décor.
   Tout est rendu avec le même banc pour garantir la cohérence graphique.
   ===================================================================== */

const PALETTE = {
  nuit:      0x081726,
  nuit2:     0x0E2B45,
  ardoise:   0x1B3C5A,
  teal:      0x0097A9,
  tealClair: 0x22C5D6,
  violet:    0x6D5FE0,
  vert:      0x23A572,
  ambre:     0xE8971A,
  rouge:     0xDB3E44,
  blanc:     0xF2F7FB,
  verre:     0xBFE3EC
};

// Couleurs des atomes, proches des conventions CPK mais adoucies pour
// rester lisibles sur le fond sombre du jeu.
const ATOMES = {
  C: { couleur: 0x8FA6BC, rayon: 0.32, metal: 0.15, rugosite: 0.38 },
  O: { couleur: 0xE85A60, rayon: 0.30, metal: 0.10, rugosite: 0.32 },
  N: { couleur: 0x4C8DF6, rayon: 0.30, metal: 0.10, rugosite: 0.32 },
  S: { couleur: 0xE3B341, rayon: 0.34, metal: 0.15, rugosite: 0.35 },
  H: { couleur: 0xE7EFF6, rayon: 0.18, metal: 0.05, rugosite: 0.45 },
  X: { couleur: 0x22C5D6, rayon: 0.30, metal: 0.25, rugosite: 0.30 }
};

/* ---------------------------------------------------- banc d'éclairage */
function bancEclairage(scene, opts) {
  opts = opts || {};
  const intensite = opts.intensite === undefined ? 1 : opts.intensite;

  const ambiante = new THREE.HemisphereLight(0xBFD8E8, 0x0A1A2A, 0.55 * intensite);
  scene.add(ambiante);

  // lumière principale, en haut à gauche
  const cle = new THREE.DirectionalLight(0xFFFFFF, 1.15 * intensite);
  cle.position.set(-6, 9, 7);
  cle.castShadow = true;
  cle.shadow.mapSize.set(2048, 2048);
  cle.shadow.camera.near = 0.5;
  cle.shadow.camera.far = 60;
  cle.shadow.camera.left = -14;
  cle.shadow.camera.right = 14;
  cle.shadow.camera.top = 14;
  cle.shadow.camera.bottom = -14;
  cle.shadow.bias = -0.0012;
  cle.shadow.radius = 3;
  scene.add(cle);

  // contre-jour turquoise : signature visuelle du jeu
  const rimTeal = new THREE.DirectionalLight(PALETTE.tealClair, 0.85 * intensite);
  rimTeal.position.set(7, 3.5, -6);
  scene.add(rimTeal);

  // touche violette d'appoint, côté opposé
  const rimViolet = new THREE.DirectionalLight(PALETTE.violet, 0.5 * intensite);
  rimViolet.position.set(-7, 1.5, -5);
  scene.add(rimViolet);

  // rehaut doux venant du bas, évite les ombres bouchées
  const remplissage = new THREE.DirectionalLight(0x9FC4DA, 0.28 * intensite);
  remplissage.position.set(1, -5, 4);
  scene.add(remplissage);

  return { ambiante, cle, rimTeal, rimViolet, remplissage };
}

/* --------------------------------------------------------- matériaux */
function matAtome(sym) {
  const a = ATOMES[sym] || ATOMES.X;
  return new THREE.MeshStandardMaterial({
    color: a.couleur, metalness: a.metal, roughness: a.rugosite
  });
}

function matLiaison() {
  return new THREE.MeshStandardMaterial({
    color: 0xC9DCEA, metalness: 0.35, roughness: 0.45
  });
}

function matVerre(teinte) {
  return new THREE.MeshStandardMaterial({
    color: teinte === undefined ? PALETTE.verre : teinte,
    metalness: 0.05, roughness: 0.08,
    transparent: true, opacity: 0.34,
    side: THREE.DoubleSide
  });
}

/* ------------------------------------------------- molécule 3D */
// atomes : [{e, p:[x,y,z]}], liaisons : [[i, j, ordre]]
function molecule(def, opts) {
  opts = opts || {};
  const echelle = opts.echelle === undefined ? 1 : opts.echelle;
  const rayonLiaison = opts.rayonLiaison === undefined ? 0.085 : opts.rayonLiaison;
  const g = new THREE.Group();

  const geoSphere = new THREE.SphereGeometry(1, 40, 28);
  def.atomes.forEach(function (a) {
    if (opts.sansH && a.e === 'H') return;
    const info = ATOMES[a.e] || ATOMES.X;
    const m = new THREE.Mesh(geoSphere, matAtome(a.e));
    m.scale.setScalar(info.rayon * echelle * (opts.facteurRayon || 1));
    m.position.set(a.p[0] * echelle, a.p[1] * echelle, a.p[2] * echelle);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
  });

  const mat = matLiaison();
  def.liaisons.forEach(function (l) {
    const a = def.atomes[l[0]], b = def.atomes[l[1]];
    if (opts.sansH && (a.e === 'H' || b.e === 'H')) return;
    const pa = new THREE.Vector3(a.p[0], a.p[1], a.p[2]).multiplyScalar(echelle);
    const pb = new THREE.Vector3(b.p[0], b.p[1], b.p[2]).multiplyScalar(echelle);
    const dir = new THREE.Vector3().subVectors(pb, pa);
    const long = dir.length();
    const ordre = l[2] || 1;
    const ecarts = ordre === 2 ? [-0.11, 0.11] : [0];
    // vecteur perpendiculaire pour dédoubler les liaisons doubles
    const perp = new THREE.Vector3(0, 0, 1).cross(dir).normalize();
    if (perp.lengthSq() < 0.01) perp.set(1, 0, 0);

    ecarts.forEach(function (d) {
      const geo = new THREE.CylinderGeometry(rayonLiaison * echelle, rayonLiaison * echelle, long, 20, 1);
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pa).add(pb).multiplyScalar(0.5)
        .add(perp.clone().multiplyScalar(d * echelle));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      m.castShadow = true;
      g.add(m);
    });
  });
  return g;
}

/* ------------------------------------------- modèles moléculaires */
const ACIDE_SALICYLIQUE = {
  atomes: [
    { e:'C', p:[ 1.39,  0.00, 0.00] }, { e:'C', p:[ 0.70,  1.20, 0.00] },
    { e:'C', p:[-0.70,  1.20, 0.03] }, { e:'C', p:[-1.39,  0.00, 0.03] },
    { e:'C', p:[-0.70, -1.20, 0.01] }, { e:'C', p:[ 0.70, -1.20, 0.00] },
    { e:'C', p:[ 2.52, -0.65,-0.10] }, { e:'O', p:[ 3.62, -0.12,-0.30] },
    { e:'O', p:[ 2.45, -1.95, 0.08] }, { e:'O', p:[ 1.35,  2.35, 0.15] },
    { e:'H', p:[-1.25,  2.14, 0.06] }, { e:'H', p:[-2.47,  0.00, 0.05] },
    { e:'H', p:[-1.25, -2.14, 0.02] }, { e:'H', p:[ 1.25, -2.14,-0.01] },
    { e:'H', p:[ 3.25, -2.40, 0.02] }, { e:'H', p:[ 0.95,  3.16, 0.10] }
  ],
  liaisons: [[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],
             [0,6,1],[6,7,2],[6,8,1],[8,14,1],[1,9,1],[9,15,1],
             [2,10,1],[3,11,1],[4,12,1],[5,13,1]]
};

const ASPIRINE = {
  atomes: [
    { e:'C', p:[ 1.39,  0.00, 0.00] }, { e:'C', p:[ 0.70,  1.20, 0.00] },
    { e:'C', p:[-0.70,  1.20, 0.05] }, { e:'C', p:[-1.39,  0.00, 0.05] },
    { e:'C', p:[-0.70, -1.20, 0.02] }, { e:'C', p:[ 0.70, -1.20, 0.00] },
    { e:'C', p:[ 2.52, -0.65,-0.12] }, { e:'O', p:[ 3.62, -0.12,-0.35] },
    { e:'O', p:[ 2.45, -1.95, 0.10] }, { e:'O', p:[ 1.35,  2.35, 0.18] },
    { e:'C', p:[ 1.66,  3.36,-0.72] }, { e:'O', p:[ 2.36,  3.22,-1.72] },
    { e:'C', p:[ 1.06,  4.66,-0.32] },
    { e:'H', p:[-1.25,  2.14, 0.10] }, { e:'H', p:[-2.47,  0.00, 0.09] },
    { e:'H', p:[-1.25, -2.14, 0.03] }, { e:'H', p:[ 1.25, -2.14,-0.02] },
    { e:'H', p:[ 3.25, -2.40, 0.02] }
  ],
  liaisons: [[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],
             [0,6,1],[6,7,2],[6,8,1],[8,17,1],[1,9,1],[9,10,1],
             [10,11,2],[10,12,1],[2,13,1],[3,14,1],[4,15,1],[5,16,1]]
};

// Hélice alpha stylisée : représente la cible protéique.
function heliceAlpha(tours, parTour, rayon, pas) {
  const atomes = [], liaisons = [];
  const n = Math.round(tours * parTour);
  for (let i = 0; i < n; i++) {
    const a = (i / parTour) * Math.PI * 2;
    atomes.push({ e: i % 4 === 0 ? 'O' : 'C',
                  p: [Math.cos(a) * rayon, (i / parTour) * pas - tours * pas / 2, Math.sin(a) * rayon] });
    if (i > 0) liaisons.push([i - 1, i, 1]);
  }
  return { atomes, liaisons };
}

/* ------------------------------------------------------- ruban protéique */
// Ruban hélicoïdal continu : lecture plus « protéine » qu'une chaîne de billes.
function rubanHelice(opts) {
  opts = opts || {};
  const tours = opts.tours || 4;
  const rayon = opts.rayon || 1.2;
  const pas = opts.pas || 1.5;
  const points = [];
  // le nombre de segments doit rester entier : TubeGeometry ne tolère pas
  // une valeur fractionnaire (cas des demi-tours, par ex. 2,6 tours)
  const n = Math.round(tours * 64);
  for (let i = 0; i <= n; i++) {
    const t = i / 64;
    points.push(new THREE.Vector3(
      Math.cos(t * Math.PI * 2) * rayon,
      t * pas - tours * pas / 2,
      Math.sin(t * Math.PI * 2) * rayon));
  }
  const courbe = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(courbe, n, opts.epaisseur || 0.22, 16, false);
  const mat = new THREE.MeshStandardMaterial({
    color: opts.couleur === undefined ? PALETTE.teal : opts.couleur,
    metalness: 0.3, roughness: 0.35
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* ------------------------------------------------------------ verrerie */
function erlenmeyer(hauteur, rayonBase, teinteLiquide) {
  const g = new THREE.Group();
  const profil = [];
  const R = rayonBase, H = hauteur;
  profil.push(new THREE.Vector2(0.0001, 0));
  profil.push(new THREE.Vector2(R, 0));
  profil.push(new THREE.Vector2(R * 0.98, H * 0.06));
  profil.push(new THREE.Vector2(R * 0.42, H * 0.62));
  profil.push(new THREE.Vector2(R * 0.30, H * 0.80));
  profil.push(new THREE.Vector2(R * 0.30, H));
  profil.push(new THREE.Vector2(R * 0.36, H));
  const geo = new THREE.LatheGeometry(profil, 48);
  const m = new THREE.Mesh(geo, matVerre());
  m.castShadow = true;
  g.add(m);

  if (teinteLiquide !== undefined) {
    const hl = H * 0.32;
    const pl = [];
    pl.push(new THREE.Vector2(0.0001, 0));
    pl.push(new THREE.Vector2(R * 0.94, 0.02));
    pl.push(new THREE.Vector2(R * 0.70, hl));
    pl.push(new THREE.Vector2(0.0001, hl));
    const gl = new THREE.LatheGeometry(pl, 48);
    const ml = new THREE.Mesh(gl, new THREE.MeshStandardMaterial({
      color: teinteLiquide, metalness: 0.1, roughness: 0.2,
      transparent: true, opacity: 0.85
    }));
    g.add(ml);
  }
  return g;
}

function tubeEssai(hauteur, rayon, teinteLiquide) {
  const g = new THREE.Group();
  const corps = new THREE.Mesh(
    new THREE.CylinderGeometry(rayon, rayon, hauteur, 28, 1, true), matVerre());
  corps.position.y = hauteur / 2;
  corps.castShadow = true;
  g.add(corps);
  const fond = new THREE.Mesh(new THREE.SphereGeometry(rayon, 28, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), matVerre());
  g.add(fond);
  if (teinteLiquide !== undefined) {
    const hl = hauteur * 0.55;
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(rayon * 0.92, rayon * 0.92, hl, 24),
      new THREE.MeshStandardMaterial({ color: teinteLiquide, metalness: 0.1, roughness: 0.25,
        transparent: true, opacity: 0.9 }));
    liq.position.y = hl / 2;
    g.add(liq);
  }
  return g;
}

/* ------------------------------------------------------------ décor */
function sol(taille, couleur) {
  const geo = new THREE.PlaneGeometry(taille, taille);
  const mat = new THREE.MeshStandardMaterial({
    color: couleur === undefined ? 0x0C2136 : couleur,
    metalness: 0.28, roughness: 0.55
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

function grille(taille, divisions, couleur, opacite) {
  const g = new THREE.GridHelper(taille, divisions,
    couleur === undefined ? PALETTE.teal : couleur,
    couleur === undefined ? PALETTE.ardoise : couleur);
  g.material.transparent = true;
  g.material.opacity = opacite === undefined ? 0.16 : opacite;
  return g;
}

// Nuage de points : évoque un espace d'échantillonnage / de conformations.
function poussiere(nb, rayon, couleur, taille) {
  const pos = new Float32Array(nb * 3);
  for (let i = 0; i < nb; i++) {
    const r = rayon * (0.35 + Math.random() * 0.65);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
    pos[i*3+1] = r * Math.cos(ph) * 0.55;
    pos[i*3+2] = r * Math.sin(ph) * Math.sin(th);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: couleur === undefined ? PALETTE.tealClair : couleur,
    size: taille === undefined ? 0.06 : taille,
    transparent: true, opacity: 0.55, sizeAttenuation: true
  });
  return new THREE.Points(geo, mat);
}

/* ------------------------------------------------- rendu et export */
function creerRendu(largeur, hauteur, transparent) {
  const canvas = document.createElement('canvas');
  canvas.width = largeur; canvas.height = hauteur;
  const r = new THREE.WebGLRenderer({
    canvas: canvas, antialias: true, alpha: !!transparent,
    preserveDrawingBuffer: true
  });
  r.setSize(largeur, hauteur, false);
  r.setPixelRatio(1);
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.outputEncoding = THREE.sRGBEncoding;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.98;
  if (transparent) r.setClearAlpha(0);
  document.body.appendChild(canvas);
  return r;
}

/* ------------------------------------------------- fond dégradé riche */
// Un simple aplat donne une image plate : on peint un dégradé vertical
// plus un halo radial sur une toile 2D, utilisée comme texture de fond.
function cielDegrade(opts) {
  opts = opts || {};
  const c = document.createElement('canvas');
  c.width = 640; c.height = 640;
  const x = c.getContext('2d');

  // Dégradé vertical : sombre en bas, plus soutenu vers le haut, de façon
  // à poser le sujet sur une zone calme et à garder les angles denses.
  const dv = x.createLinearGradient(0, 0, 0, 640);
  dv.addColorStop(0,    opts.haut   || '#050F1A');
  dv.addColorStop(0.42, opts.milieu || '#0A1F33');
  dv.addColorStop(1,    opts.bas    || '#061520');
  x.fillStyle = dv; x.fillRect(0, 0, 640, 640);

  // halo principal derrière le sujet
  const hx = opts.haloX === undefined ? 0.64 : opts.haloX;
  const hy = opts.haloY === undefined ? 0.44 : opts.haloY;
  const dr = x.createRadialGradient(640 * hx, 640 * hy, 12, 640 * hx, 640 * hy, 400);
  dr.addColorStop(0,   opts.halo || 'rgba(34,197,214,0.34)');
  dr.addColorStop(0.45,'rgba(34,197,214,0.10)');
  dr.addColorStop(1,   'rgba(34,197,214,0)');
  x.fillStyle = dr; x.fillRect(0, 0, 640, 640);

  // contre-halo, côté opposé
  const dr2 = x.createRadialGradient(640 * 0.16, 640 * 0.72, 12, 640 * 0.16, 640 * 0.72, 330);
  dr2.addColorStop(0, opts.halo2 || 'rgba(109,95,224,0.26)');
  dr2.addColorStop(1, 'rgba(109,95,224,0)');
  x.fillStyle = dr2; x.fillRect(0, 0, 640, 640);

  // vignettage : densifie les bords, met le sujet en valeur
  const vg = x.createRadialGradient(320, 320, 150, 320, 320, 470);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  x.fillStyle = vg; x.fillRect(0, 0, 640, 640);

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

// Sol sombre légèrement réfléchissant + grille en perspective.
function solStudio(y, teinteGrille) {
  const g = new THREE.Group();
  const plan = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({ color: 0x071522, metalness: 0.55, roughness: 0.42 }));
  plan.rotation.x = -Math.PI / 2;
  plan.receiveShadow = true;
  g.add(plan);

  const gr = new THREE.GridHelper(160, 80,
    teinteGrille === undefined ? PALETTE.tealClair : teinteGrille,
    teinteGrille === undefined ? PALETTE.teal : teinteGrille);
  gr.material.transparent = true;
  gr.material.opacity = 0.14;
  gr.position.y = 0.01;
  g.add(gr);

  g.position.y = y;
  return g;
}

// Molécules lointaines, floutées par le brouillard : donnent de la profondeur.
function arrierePlanMoleculaire(scene, def, nb, rayon, yBase) {
  for (let i = 0; i < nb; i++) {
    const m = molecule(def, { echelle: 1, sansH: true });
    const a = (i / nb) * Math.PI * 2 + 0.4;
    const r = rayon * (0.75 + Math.random() * 0.5);
    m.position.set(Math.cos(a) * r, yBase + Math.random() * 4 - 1.2, -6 - Math.random() * 12);
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    m.scale.setScalar(0.16 + Math.random() * 0.1);
    m.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    scene.add(m);
  }
}

/* --------------------------------------------- surface protéique */
// Une hélice seule se lit comme un ressort. Pour évoquer une cible
// protéique, on déforme une sphère très subdivisée par une somme de
// sinus : on obtient une surface bosselée, avec une poche creusée.
function surfaceProteique(opts) {
  opts = opts || {};
  const rayon = opts.rayon || 2.2;
  const geo = new THREE.SphereGeometry(rayon, 128, 88);
  const pos = geo.attributes.position;
  const pocheDir = (opts.poche || new THREE.Vector3(0.15, 0.9, 0.4)).clone().normalize();
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    // relief : plusieurs fréquences pour un aspect organique
    const amp = opts.relief === undefined ? 1 : opts.relief;
    let d = amp * (
      0.26 * Math.sin(n.x * 3.1 + 0.7) * Math.cos(n.y * 2.7) +
      0.17 * Math.sin(n.y * 5.3 + 1.9) * Math.cos(n.z * 4.1) +
      0.11 * Math.sin(n.z * 7.7 + 0.3) * Math.cos(n.x * 6.3) +
      0.06 * Math.sin(n.x * 11.3 + 2.2) * Math.cos(n.y * 9.7));
    // creusement de la poche de liaison
    const prox = n.dot(pocheDir);
    if (prox > 0.72) {
      const t = (prox - 0.72) / 0.28;
      d -= (opts.profondeur || 0.85) * t * t;
    }
    v.setLength(rayon + d);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();

  const g = new THREE.Group();
  const externe = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: opts.couleur === undefined ? 0x1E6E86 : opts.couleur,
    metalness: 0.15, roughness: 0.62,
    transparent: true, opacity: opts.opacite === undefined ? 0.62 : opts.opacite,
    side: THREE.DoubleSide, flatShading: false }));
  externe.castShadow = true; externe.receiveShadow = true;
  g.add(externe);

  // cœur opaque : donne du corps à la surface translucide
  const geoCoeur = new THREE.SphereGeometry(rayon * 0.8, 72, 48);
  const pc = geoCoeur.attributes.position, vc = new THREE.Vector3();
  for (let i = 0; i < pc.count; i++) {
    vc.fromBufferAttribute(pc, i);
    const n = vc.clone().normalize();
    const d = 0.18 * Math.sin(n.x * 3.1 + 0.7) * Math.cos(n.y * 2.7)
            + 0.1 * Math.sin(n.y * 5.3 + 1.9) * Math.cos(n.z * 4.1);
    vc.setLength(rayon * 0.8 + d);
    pc.setXYZ(i, vc.x, vc.y, vc.z);
  }
  geoCoeur.computeVertexNormals();
  const coeur = new THREE.Mesh(geoCoeur,
    new THREE.MeshStandardMaterial({ color: 0x0D3145, metalness: 0.15, roughness: 0.82 }));
  g.add(coeur);

  // quelques hélices affleurantes, pour la lecture « protéine »
  if (opts.helices !== 0) {
    for (let k = 0; k < 3; k++) {
      const h = rubanHelice({ tours: 1.3, rayon: 0.3, pas: 0.44,
                              epaisseur: 0.09, couleur: PALETTE.tealClair });
      const a = k * 2.1 + 0.6;
      h.position.set(Math.cos(a) * rayon * 0.5, -rayon * 0.12 + k * 0.26, Math.sin(a) * rayon * 0.5);
      h.rotation.set(0.5 + k * 0.3, a, 0.4);
      g.add(h);
    }
  }
  return g;
}

/* Chemin en pointillés lumineux (trajet, interaction). */
function cheminPointille(points, couleur, rayon, nb) {
  const courbe = new THREE.CatmullRomCurve3(points);
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: couleur === undefined ? PALETTE.ambre : couleur,
    transparent: true, opacity: 0.9 });
  const geo = new THREE.SphereGeometry(rayon === undefined ? 0.06 : rayon, 12, 10);
  const n = nb === undefined ? 16 : nb;
  for (let i = 0; i <= n; i++) {
    const p = courbe.getPoint(i / n);
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(p);
    m.scale.setScalar(0.6 + 0.6 * Math.sin(i / n * Math.PI));
    g.add(m);
  }
  return g;
}

/* =====================================================================
   Textures procédurales
   Dessinées sur une toile 2D puis utilisées comme carte de couleur et de
   rugosité. Elles suffisent à casser l'aspect « plastique » des aplats,
   sans dépendre d'aucun fichier externe. Les scènes étant calculées hors
   ligne puis exportées en image, leur coût n'existe pas au moment du jeu.
   ===================================================================== */

function _toile2D(taille) {
  const c = document.createElement('canvas');
  c.width = c.height = taille;
  return c;
}

function _grain(ctx, taille, intensite, densite) {
  const img = ctx.getImageData(0, 0, taille, taille);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.random() > densite) continue;
    const v = (Math.random() - 0.5) * intensite;
    d[i] = Math.max(0, Math.min(255, d[i] + v));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + v));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + v));
  }
  ctx.putImageData(img, 0, 0);
}

function _finaliser(canvas, repetitions) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repetitions[0], repetitions[1]);
  t.anisotropy = 8;
  return t;
}

/* Sol : résine coulée, dalles larges, joints discrets, reflets irréguliers. */
function textureSol(repetitions) {
  const T = 512, c = _toile2D(T), x = c.getContext('2d');
  x.fillStyle = '#0C2438'; x.fillRect(0, 0, T, T);
  // marbrures
  for (let i = 0; i < 90; i++) {
    const g = x.createRadialGradient(Math.random() * T, Math.random() * T, 2,
                                     Math.random() * T, Math.random() * T, 40 + Math.random() * 90);
    g.addColorStop(0, 'rgba(38,84,116,0.20)');
    g.addColorStop(1, 'rgba(38,84,116,0)');
    x.fillStyle = g; x.fillRect(0, 0, T, T);
  }
  _grain(x, T, 16, 0.5);
  // joints de dalles
  x.strokeStyle = 'rgba(6,18,30,0.55)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(0, T / 2); x.lineTo(T, T / 2);
  x.moveTo(T / 2, 0); x.lineTo(T / 2, T); x.stroke();

  const r = _toile2D(T), xr = r.getContext('2d');
  xr.fillStyle = '#4a4a4a'; xr.fillRect(0, 0, T, T);
  for (let i = 0; i < 60; i++) {
    const g = xr.createRadialGradient(Math.random() * T, Math.random() * T, 4,
                                      Math.random() * T, Math.random() * T, 60 + Math.random() * 110);
    g.addColorStop(0, 'rgba(150,150,150,0.5)');
    g.addColorStop(1, 'rgba(150,150,150,0)');
    xr.fillStyle = g; xr.fillRect(0, 0, T, T);
  }
  return { map: _finaliser(c, repetitions), roughnessMap: _finaliser(r, repetitions) };
}

/* Plan de travail : stratifié minéral sombre, finement moucheté. */
function texturePlanTravail(repetitions) {
  const T = 512, c = _toile2D(T), x = c.getContext('2d');
  x.fillStyle = '#12304A'; x.fillRect(0, 0, T, T);
  for (let i = 0; i < 2600; i++) {
    const r = 0.6 + Math.random() * 1.9;
    x.fillStyle = ['rgba(180,205,222,0.30)', 'rgba(30,64,92,0.55)',
                   'rgba(120,160,190,0.22)'][i % 3];
    x.beginPath(); x.arc(Math.random() * T, Math.random() * T, r, 0, 6.3); x.fill();
  }
  _grain(x, T, 10, 0.6);
  const r = _toile2D(T), xr = r.getContext('2d');
  xr.fillStyle = '#3c3c3c'; xr.fillRect(0, 0, T, T);
  _grain(xr, T, 40, 0.8);
  return { map: _finaliser(c, repetitions), roughnessMap: _finaliser(r, repetitions) };
}

/* Mur : peinture satinée, très légère variation verticale. */
function textureMur(repetitions) {
  const T = 512, c = _toile2D(T), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, T);
  g.addColorStop(0, '#0E2E45'); g.addColorStop(1, '#0A2537');
  x.fillStyle = g; x.fillRect(0, 0, T, T);
  _grain(x, T, 7, 0.35);
  return { map: _finaliser(c, repetitions) };
}

/* Façade de meuble : laqué clair, reflet doux. */
function textureMeuble(repetitions) {
  const T = 256, c = _toile2D(T), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, T);
  g.addColorStop(0, '#D6E3EC'); g.addColorStop(0.6, '#C6D6E1'); g.addColorStop(1, '#B9CBD8');
  x.fillStyle = g; x.fillRect(0, 0, T, T);
  _grain(x, T, 5, 0.3);
  return { map: _finaliser(c, repetitions) };
}

/* Dalle d'écran : interface de modélisation moléculaire. */
function textureEcranDocking(largeur, hauteur) {
  const W = largeur || 1024, H = hauteur || 640;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');

  const fond = x.createLinearGradient(0, 0, 0, H);
  fond.addColorStop(0, '#07243A'); fond.addColorStop(1, '#041A2B');
  x.fillStyle = fond; x.fillRect(0, 0, W, H);

  // barre d'outils
  x.fillStyle = '#0C3550'; x.fillRect(0, 0, W, H * 0.09);
  for (let i = 0; i < 7; i++) {
    x.fillStyle = i === 2 ? '#22C5D6' : '#2A5E7E';
    x.fillRect(W * 0.02 + i * W * 0.045, H * 0.028, W * 0.032, H * 0.035);
  }
  // panneau latéral
  x.fillStyle = 'rgba(12,53,80,0.85)'; x.fillRect(W * 0.72, H * 0.09, W * 0.28, H * 0.91);
  for (let i = 0; i < 9; i++) {
    x.fillStyle = 'rgba(150,190,215,0.35)';
    x.fillRect(W * 0.745, H * 0.15 + i * H * 0.075, W * 0.2 * (0.4 + Math.random() * 0.6), H * 0.02);
  }
  // grille de docking
  x.strokeStyle = 'rgba(34,197,214,0.22)'; x.lineWidth = 1;
  for (let i = 0; i <= 12; i++) {
    x.beginPath(); x.moveTo(W * 0.05 + i * W * 0.052, H * 0.16);
    x.lineTo(W * 0.05 + i * W * 0.052, H * 0.92); x.stroke();
  }
  for (let i = 0; i <= 8; i++) {
    x.beginPath(); x.moveTo(W * 0.05, H * 0.16 + i * H * 0.095);
    x.lineTo(W * 0.68, H * 0.16 + i * H * 0.095); x.stroke();
  }
  // molécule schématique au centre
  const cx = W * 0.36, cy = H * 0.54, R = H * 0.19;
  const noeuds = [];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    noeuds.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.92]);
  }
  x.strokeStyle = '#BFD9E8'; x.lineWidth = Math.max(2, H * 0.008);
  x.beginPath();
  noeuds.forEach(function (n, i) { i ? x.lineTo(n[0], n[1]) : x.moveTo(n[0], n[1]); });
  x.closePath(); x.stroke();
  noeuds.forEach(function (n, i) {
    x.fillStyle = i % 3 === 0 ? '#22C5D6' : (i === 2 ? '#E8686C' : '#9FB6C9');
    x.beginPath(); x.arc(n[0], n[1], H * 0.032, 0, 6.3); x.fill();
  });
  // isosurface suggérée
  x.strokeStyle = 'rgba(109,95,224,0.5)'; x.lineWidth = Math.max(1, H * 0.005);
  x.beginPath(); x.ellipse(cx, cy, R * 1.7, R * 1.45, 0.3, 0, 6.3); x.stroke();

  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  return t;
}

/* Dalle d'écran : courbes et indicateurs ADMET. */
function textureEcranAnalyse(largeur, hauteur) {
  const W = largeur || 1024, H = hauteur || 640;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const fond = x.createLinearGradient(0, 0, 0, H);
  fond.addColorStop(0, '#08283D'); fond.addColorStop(1, '#051B2B');
  x.fillStyle = fond; x.fillRect(0, 0, W, H);
  x.fillStyle = '#0C3550'; x.fillRect(0, 0, W, H * 0.1);
  x.fillStyle = '#22C5D6'; x.fillRect(W * 0.03, H * 0.035, W * 0.16, H * 0.03);

  // histogramme
  const couleurs = ['#22C5D6', '#6D5FE0', '#E8971A', '#23A572', '#4E8FC0'];
  for (let i = 0; i < 5; i++) {
    const h = H * (0.18 + Math.abs(Math.sin(i * 1.8)) * 0.42);
    x.fillStyle = couleurs[i];
    x.fillRect(W * 0.08 + i * W * 0.085, H * 0.86 - h, W * 0.055, h);
  }
  // courbe
  x.strokeStyle = '#8FD4E4'; x.lineWidth = Math.max(2, H * 0.006);
  x.beginPath();
  for (let i = 0; i <= 40; i++) {
    const px = W * 0.56 + (i / 40) * W * 0.38;
    const py = H * 0.62 - Math.sin(i * 0.32) * H * 0.16 - i * H * 0.004;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.stroke();
  // lignes de texte
  for (let i = 0; i < 6; i++) {
    x.fillStyle = 'rgba(150,190,215,0.32)';
    x.fillRect(W * 0.56, H * 0.72 + i * H * 0.04, W * 0.32 * (0.45 + Math.random() * 0.55), H * 0.016);
  }
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  return t;
}

/* Affiche scientifique encadrée : schéma d'amarrage ou d'étude SAR.
   Les libellés restent courts et génériques : ce sont des éléments de
   décor, jamais du contenu pédagogique. */
function textureAffiche(variante) {
  const W = 700, H = 980;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');

  const fond = x.createLinearGradient(0, 0, 0, H);
  fond.addColorStop(0, '#0B2F48'); fond.addColorStop(1, '#072133');
  x.fillStyle = fond; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(34,197,214,0.35)'; x.lineWidth = 6;
  x.strokeRect(18, 18, W - 36, H - 36);

  x.fillStyle = '#22C5D6';
  x.font = 'bold 44px DejaVu Sans, sans-serif';
  x.textAlign = 'center';

  if (variante === 'sar') {
    x.fillText('STRUCTURE', W / 2, 108);
    x.fillText('ACTIVITÉ', W / 2, 158);
    // série de molécules schématiques en colonnes
    for (let r = 0; r < 3; r++) {
      for (let k = 0; k < 3; k++) {
        const cx = 160 + k * 190, cy = 300 + r * 210, R = 52;
        x.strokeStyle = 'rgba(200,222,236,0.85)'; x.lineWidth = 5;
        x.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
          i ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.closePath(); x.stroke();
        x.fillStyle = ['#22C5D6', '#E8971A', '#6D5FE0'][(r + k) % 3];
        x.beginPath(); x.arc(cx + R, cy, 15, 0, 6.3); x.fill();
        // barre d'activité sous chaque analogue
        x.fillStyle = 'rgba(35,165,114,0.75)';
        x.fillRect(cx - 52, cy + 72, 104 * (0.35 + ((r * 3 + k) % 4) * 0.2), 12);
      }
    }
  } else {
    x.fillText('AMARRAGE', W / 2, 108);
    x.fillText('MOLÉCULAIRE', W / 2, 158);
    // poche de liaison en courbes de niveau, ligand au centre
    const cx = W / 2, cy = 520;
    for (let i = 7; i >= 1; i--) {
      x.strokeStyle = 'rgba(34,197,214,' + (0.10 + i * 0.045) + ')';
      x.lineWidth = 3;
      x.beginPath();
      for (let a = 0; a <= 64; a++) {
        const t = a / 64 * Math.PI * 2;
        const rr = i * 34 * (1 + 0.22 * Math.sin(t * 3 + i) + 0.12 * Math.cos(t * 5));
        const px = cx + Math.cos(t) * rr, py = cy + Math.sin(t) * rr * 0.8;
        a ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.closePath(); x.stroke();
    }
    const n = [[0, -50], [44, -25], [44, 25], [0, 50], [-44, 25], [-44, -25]];
    x.strokeStyle = '#DCEAF4'; x.lineWidth = 7;
    x.beginPath();
    n.forEach(function (p, i) { i ? x.lineTo(cx + p[0], cy + p[1]) : x.moveTo(cx + p[0], cy + p[1]); });
    x.closePath(); x.stroke();
    n.forEach(function (p, i) {
      x.fillStyle = i === 1 ? '#E8686C' : (i === 4 ? '#22C5D6' : '#B9CCDC');
      x.beginPath(); x.arc(cx + p[0], cy + p[1], 20, 0, 6.3); x.fill();
    });
    // barre d'énergie de liaison
    x.fillStyle = 'rgba(150,190,215,0.28)'; x.fillRect(90, 820, W - 180, 20);
    x.fillStyle = '#E8971A'; x.fillRect(90, 820, (W - 180) * 0.68, 20);
  }

  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 8;
  return t;
}

/* Banc d'éclairage dédié aux personnages.
   Le banc générique, réglé pour des objets brillants, brûlait la blouse
   et le visage. Ici la clé est plus douce, le remplissage plus présent,
   et deux contre-jours détachent la silhouette du décor sur lequel elle
   sera incrustée. */
function bancPersonnage(scene) {
  scene.add(new THREE.HemisphereLight(0xC3D9E8, 0x16232F, 0.48));

  const cle = new THREE.DirectionalLight(0xFFF6EC, 0.82);
  cle.position.set(-3.4, 5.2, 5.0);
  cle.castShadow = true;
  cle.shadow.mapSize.set(2048, 2048);
  cle.shadow.camera.near = 0.5; cle.shadow.camera.far = 20;
  cle.shadow.camera.left = -2.5; cle.shadow.camera.right = 2.5;
  cle.shadow.camera.top = 3; cle.shadow.camera.bottom = -1;
  cle.shadow.bias = -0.0015;
  cle.shadow.radius = 3;
  scene.add(cle);

  const remplissage = new THREE.DirectionalLight(0xBBD3E4, 0.34);
  remplissage.position.set(4.2, 1.6, 3.6);
  scene.add(remplissage);

  const rimTeal = new THREE.DirectionalLight(PALETTE.tealClair, 0.52);
  rimTeal.position.set(3.6, 3.0, -4.2);
  scene.add(rimTeal);

  const rimViolet = new THREE.DirectionalLight(PALETTE.violet, 0.3);
  rimViolet.position.set(-3.8, 2.2, -3.6);
  scene.add(rimViolet);

  const sol = new THREE.DirectionalLight(0x86A6BE, 0.14);
  sol.position.set(0, -4, 2.5);
  scene.add(sol);
}

/* Halo doux : disque dégradé utilisé pour les points de lumière hors mise
   au point des écrans de transition. */
let _texHalo = null;
function textureHalo() {
  if (_texHalo) return _texHalo;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  _texHalo = new THREE.CanvasTexture(c);
  return _texHalo;
}

/* Points de lumière hors mise au point : ils donnent de la profondeur à
   un fond qui, sans eux, reste une surface vide. */
function bokeh(scene, taches) {
  const tex = textureHalo();
  const geo = new THREE.PlaneGeometry(1, 1);
  taches.forEach(function (t) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: tex, color: t.c, transparent: true, opacity: t.o,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    m.position.set(t.x, t.y, t.z);
    m.scale.setScalar(t.r);
    scene.add(m);
  });
}
