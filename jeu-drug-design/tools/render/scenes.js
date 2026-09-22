/* =====================================================================
   EPOS — catalogue des scènes 3D
   Chaque entrée construit une scène complète et renvoie la caméra.
   ===================================================================== */

const SCENES = {};

/* --------------------------------------------------------------------
   Fond commun des transitions : dégradé nuit + halos, sol réfléchissant
   -------------------------------------------------------------------- */
function fondTransition(scene, renderer, opts) {
  opts = opts || {};
  // Pas de sol : une ligne d'horizon couperait la composition et se
  // remarque d'autant plus que le titre de la diapositive vient par-dessus.
  // On travaille en fond studio, comme une image de campagne scientifique.
  scene.background = cielDegrade(opts);
  scene.fog = new THREE.Fog(new THREE.Color(opts.brouillard || 0x081A2B), 14, 36);
  scene.add(poussiere(300, 14, PALETTE.tealClair, 0.05));

  // profondeur : des points de lumière hors mise au point, comme les
  // écrans et la verrerie d'un laboratoire vus derrière le sujet. Le
  // fond cesse d'être une surface vide sans rien y découper de net.
  bokeh(scene, [
    { x: 7.2, y: 3.2, z: -7, r: 3.4, c: PALETTE.tealClair, o: 0.20 },
    { x: 9.2, y: -2.0, z: -6, r: 4.6, c: PALETTE.teal, o: 0.16 },
    { x: 4.6, y: -3.8, z: -4, r: 2.4, c: PALETTE.violet, o: 0.17 },
    { x: -1.8, y: 4.8, z: -8, r: 3.0, c: PALETTE.violet, o: 0.12 },
    { x: 2.2, y: 5.2, z: -5, r: 1.6, c: PALETTE.tealClair, o: 0.16 },
    { x: 10.2, y: 1.0, z: -3, r: 1.3, c: PALETTE.ambre, o: 0.14 },
    { x: -4.6, y: -4.4, z: -7, r: 3.6, c: PALETTE.teal, o: 0.10 },
    { x: 6.0, y: -5.0, z: -2, r: 1.1, c: PALETTE.ambre, o: 0.12 },
    { x: 1.0, y: -4.6, z: -6, r: 2.0, c: PALETTE.tealClair, o: 0.09 },
    { x: 11.5, y: 4.4, z: -6, r: 2.2, c: PALETTE.violet, o: 0.11 }
  ]);
}

/* Verrerie de paillasse, posée au sol, en appui de composition. */
function verrerieSol(x, z, echelle) {
  const g = new THREE.Group();
  const e1 = erlenmeyer(1.9, 0.8, PALETTE.tealClair);
  e1.position.set(0, 0, 0);
  g.add(e1);
  const e2 = erlenmeyer(1.35, 0.6, PALETTE.violet);
  e2.position.set(1.5, 0, 0.6);
  g.add(e2);
  [2.55, 2.95, 3.35].forEach(function (dx, i) {
    const t = tubeEssai(1.25, 0.18, [PALETTE.vert, PALETTE.ambre, PALETTE.teal][i]);
    t.position.set(dx, 0, 0.25);
    g.add(t);
  });
  const portoir = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.12, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x1D4463, metalness: 0.5, roughness: 0.38 }));
  portoir.position.set(2.95, 0.06, 0.25);
  portoir.castShadow = true; portoir.receiveShadow = true;
  g.add(portoir);
  g.position.set(x, -2.6, z);
  g.scale.setScalar(echelle === undefined ? 1 : echelle);
  return g;
}

/* --------------------------------------------------------------------
   Les trois transitions partagent la même grammaire : sujet 3D à droite,
   tiers gauche calme et sombre pour laisser respirer le titre de la
   diapositive, paillasse en profondeur pour ancrer la scène.
   -------------------------------------------------------------------- */

SCENES['transition-2'] = function (scene, renderer, L, H) {
  fondTransition(scene, renderer, { haloX: 0.66, haloY: 0.42,
    halo: 'rgba(34,197,214,0.34)' });
  bancEclairage(scene);
  arrierePlanMoleculaire(scene, ACIDE_SALICYLIQUE, 7, 13, 1.5);

  // bicouche lipidique : la barrière que la molécule doit franchir
  const membrane = new THREE.Group();
  const geoTete = new THREE.SphereGeometry(0.14, 16, 12);
  const matTete = new THREE.MeshStandardMaterial({
    color: PALETTE.tealClair, metalness: 0.25, roughness: 0.3 });
  const matQueue = new THREE.MeshStandardMaterial({
    color: 0x2B5570, metalness: 0.1, roughness: 0.6 });
  for (let i = -11; i <= 11; i++) {
    for (let k = -4; k <= 4; k++) {
      [1, -1].forEach(function (sens) {
        const t = new THREE.Mesh(geoTete, matTete);
        t.position.set(i * 0.34, sens * 0.5, k * 0.34);
        t.castShadow = true;
        membrane.add(t);
        const q = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 6), matQueue);
        q.position.set(i * 0.34, sens * 0.24, k * 0.34);
        membrane.add(q);
      });
    }
  }
  membrane.position.set(2.7, -0.4, 0);
  membrane.rotation.y = -0.42;
  membrane.rotation.z = 0.05;
  scene.add(membrane);

  // molécule qui franchit la membrane
  const mol = molecule(ACIDE_SALICYLIQUE, { echelle: 1.0, facteurRayon: 1.15 });
  mol.position.set(1.5, 1.9, 1.3);
  mol.rotation.set(0.45, 0.7, 0.2);
  mol.scale.setScalar(0.42);
  scene.add(mol);

  const mol2 = molecule(ACIDE_SALICYLIQUE, { echelle: 1.0, sansH: true });
  mol2.position.set(4.3, -1.8, 0.9);
  mol2.rotation.set(-0.3, -0.5, 0.35);
  mol2.scale.setScalar(0.3);
  scene.add(mol2);

  // trajectoire de passage
  scene.add(cheminPointille([
    new THREE.Vector3(1.5, 1.6, 1.3), new THREE.Vector3(2.4, 0.5, 1.1),
    new THREE.Vector3(3.4, -0.7, 1.0), new THREE.Vector3(4.2, -1.6, 0.9)],
    PALETTE.ambre, 0.055, 14));


  const cam = new THREE.PerspectiveCamera(36, L / H, 0.1, 120);
  cam.position.set(-1.2, 1.9, 13.6);
  cam.lookAt(1.1, 0.75, 0);
  return cam;
};

SCENES['transition-3'] = function (scene, renderer, L, H) {
  fondTransition(scene, renderer, { haloX: 0.58, haloY: 0.40,
    halo: 'rgba(109,95,224,0.30)', halo2: 'rgba(34,197,214,0.20)' });
  bancEclairage(scene);
  arrierePlanMoleculaire(scene, ASPIRINE, 7, 13, 1.2);

  // acide acétylsalicylique -> acétylsalicylate de lysine : la molécule
  // de départ, la flèche de modulation, la molécule obtenue
  const gauche = molecule(ACIDE_SALICYLIQUE, { echelle: 1.0, facteurRayon: 1.1, sansH: true });
  gauche.position.set(1.0, 0.4, 0);
  gauche.rotation.set(0.32, 0.5, 0.1);
  gauche.scale.setScalar(0.44);
  scene.add(gauche);

  const droite = molecule(ASPIRINE, { echelle: 1.0, facteurRayon: 1.1, sansH: true });
  droite.position.set(5.0, 0.4, 0);
  droite.rotation.set(0.25, -0.45, -0.08);
  droite.scale.setScalar(0.44);
  scene.add(droite);

  const fleche = new THREE.Group();
  const matFleche = new THREE.MeshStandardMaterial({
    color: PALETTE.ambre, metalness: 0.45, roughness: 0.28 });
  const corps = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.9, 18), matFleche);
  corps.rotation.z = -Math.PI / 2;
  corps.castShadow = true;
  fleche.add(corps);
  const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.45, 22), matFleche);
  pointe.position.x = 1.16;
  pointe.rotation.z = -Math.PI / 2;
  pointe.castShadow = true;
  fleche.add(pointe);
  fleche.position.set(3.0, 0.4, 0);
  scene.add(fleche);

  [0.62, 0.95, 1.28].forEach(function (r, i) {
    const anneau = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.016, 10, 56),
      new THREE.MeshBasicMaterial({ color: PALETTE.violet, transparent: true,
                                    opacity: 0.42 - i * 0.1 }));
    anneau.position.set(3.0, 0.4, 0);
    anneau.rotation.x = Math.PI / 2 - 0.35;
    scene.add(anneau);
  });


  const cam = new THREE.PerspectiveCamera(36, L / H, 0.1, 120);
  cam.position.set(1.6, 1.3, 12.6);
  cam.lookAt(2.1, 0.95, 0);
  return cam;
};

SCENES['transition-4'] = function (scene, renderer, L, H) {
  fondTransition(scene, renderer, { haloX: 0.64, haloY: 0.44,
    halo: 'rgba(34,197,214,0.32)' });
  bancEclairage(scene);
  arrierePlanMoleculaire(scene, ASPIRINE, 6, 13, 1.4);

  // cible : surface protéique bosselée, creusée d'une poche de liaison
  const cible = surfaceProteique({
    rayon: 2.0, profondeur: 1.25, relief: 1.5,
    poche: new THREE.Vector3(-0.1, 0.62, 0.78),
    couleur: 0x1B6A83, opacite: 0.66 });
  cible.position.set(3.3, -0.9, -0.4);
  cible.rotation.y = -0.25;
  scene.add(cible);

  // ligand en approche de la poche
  const ligand = molecule(ASPIRINE, { echelle: 1.0, sansH: true, facteurRayon: 1.2 });
  ligand.position.set(3.1, 0.55, 1.25);
  ligand.rotation.set(0.5, 0.4, 0.16);
  ligand.scale.setScalar(0.3);
  scene.add(ligand);

  // trajectoire d'amarrage
  scene.add(cheminPointille([
    new THREE.Vector3(3.2, 2.9, 2.6), new THREE.Vector3(3.15, 1.8, 2.0),
    new THREE.Vector3(3.1, 0.95, 1.5)], PALETTE.ambre, 0.032, 13));

  // interactions ligand-cible
  const matInter = new THREE.MeshBasicMaterial({ color: PALETTE.ambre, transparent: true, opacity: 0.75 });
  [[[2.65, 0.45, 1.15], [2.35, -0.25, 0.85]],
   [[3.6, 0.5, 1.1], [3.95, -0.2, 0.8]],
   [[3.1, 0.25, 1.35], [3.1, -0.5, 1.15]]].forEach(function (seg) {
    const a = new THREE.Vector3().fromArray(seg[0]);
    const b = new THREE.Vector3().fromArray(seg[1]);
    const dir = new THREE.Vector3().subVectors(b, a);
    const n = 5;
    for (let i = 0; i < n; i += 2) {
      const p0 = a.clone().add(dir.clone().multiplyScalar(i / n));
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, dir.length() / n, 8), matInter);
      t.position.copy(p0).add(dir.clone().multiplyScalar(0.5 / n));
      t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      scene.add(t);
    }
  });

  // boîte de recherche du docking
  const boite = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 2.4, 2.6),
    new THREE.MeshBasicMaterial({ color: PALETTE.tealClair, wireframe: true,
                                  transparent: true, opacity: 0.22 }));
  boite.position.set(3.15, 0.5, 1.15);
  scene.add(boite);


  const cam = new THREE.PerspectiveCamera(36, L / H, 0.1, 120);
  cam.position.set(-0.4, 1.5, 12.6);
  cam.lookAt(1.9, 0.45, 0);
  return cam;
};

/* --------------------------------------------------------------------
   Illustration de concept : molécule candidate
   Remplace un clipart d'origine (molécules dessinées + titre en rouge,
   bandes noires en haut et en bas) qui jurait avec le reste du jeu.
   Purement décorative : aucune donnée, aucun libellé.
   -------------------------------------------------------------------- */
SCENES['illus-molecule'] = function (scene, renderer, L, H) {
  scene.background = cielDegrade({
    haut: '#05121F', milieu: '#0A2438', bas: '#071B2A',
    haloX: 0.52, haloY: 0.46, halo: 'rgba(34,197,214,0.30)',
    halo2: 'rgba(109,95,224,0.18)' });
  scene.fog = new THREE.Fog(new THREE.Color(0x081A2B), 16, 40);
  bancEclairage(scene, { intensite: 0.95 });
  scene.add(poussiere(220, 11, PALETTE.tealClair, 0.06));

  // hexagone en fil de fer : le motif qui court dans toute l'interface
  [[2.62, 0.05, PALETTE.tealClair, 0.3], [3.25, 0.03, PALETTE.violet, 0.18]]
    .forEach(function (h) {
      const anneau = new THREE.Mesh(
        new THREE.TorusGeometry(h[0], h[1], 8, 6),
        new THREE.MeshBasicMaterial({ color: h[2], transparent: true, opacity: h[3] }));
      anneau.rotation.z = Math.PI / 6;
      anneau.position.z = -1.2;
      scene.add(anneau);
    });

  const mol = molecule(ASPIRINE, { echelle: 1.0, facteurRayon: 1.12 });
  mol.scale.setScalar(0.52);
  mol.rotation.set(0.3, 0.62, 0.1);
  mol.position.set(0.05, -0.15, 0);
  scene.add(mol);

  // molécules satellites, très en retrait
  [[-3.5, 1.9, -6, 0.26, 0.5], [3.7, -1.7, -5.5, 0.22, -0.7],
   [3.1, 2.3, -7, 0.18, 1.2], [-3.2, -2.1, -6.5, 0.2, -0.3]]
    .forEach(function (p) {
      const m = molecule(ACIDE_SALICYLIQUE, { echelle: 1, sansH: true, facteurRayon: 1.0 });
      m.scale.setScalar(p[3]);
      m.position.set(p[0], p[1], p[2]);
      m.rotation.set(0.3, p[4], 0.1);
      scene.add(m);
    });

  bokeh(scene, [
    { x: -3.9, y: 2.2, z: -3, r: 2.6, c: PALETTE.violet, o: 0.16 },
    { x: 4.1, y: -2.0, z: -3, r: 3.0, c: PALETTE.teal, o: 0.15 },
    { x: 3.6, y: 2.4, z: -2, r: 1.5, c: PALETTE.tealClair, o: 0.15 },
    { x: -3.4, y: -2.3, z: -2, r: 1.8, c: PALETTE.tealClair, o: 0.11 }
  ]);

  const cam = new THREE.PerspectiveCamera(34, L / H, 0.1, 80);
  cam.position.set(0, 0.2, 11.2);
  cam.lookAt(0, 0.05, 0);
  return cam;
};

/* --------------------------------------------------------------------
   Laboratoire de chimie computationnelle — décor de la diapositive
   d'accueil et de toutes les stations.

   Contraintes de composition (coordonnées de la diapositive, 960x720) :
     - bulle de dialogue     x 144..444  y 412..562
     - personnage qui parle  x 396..553  y 316..532
     - zone d'action au sol  x 584..734  y 516..594
     - couloir de marche     y 508..720  (le reste est en collision)
   Le décor s'organise en trois plans : la coque de la salle (sol, murs,
   plafond lumineux) qui donne la profondeur, la paillasse et ses
   équipements qui occupent la bande médiane, et le sol laissé libre au
   premier plan, où le pharmacien circule. Aucun objet n'est posé au sol
   dans ce couloir : le personnage ne peut donc ni traverser ni
   contourner un obstacle qui n'existerait qu'en image.

   Repères : sol y = 0, plan de travail y = 2.6, plafond y = 9.0,
   mur du fond z = -9, façade des meubles z = -4.9.
   Dans le cadrage d'accueil, x = 0 tombe vers le milieu de l'image et
   un pas de 1 unité vaut environ 32 px de diapositive au fond.
   -------------------------------------------------------------------- */

var LABO = {
  planY: 2.6, plafondY: 9.0,
  murZ: -9, faceZ: -4.9, fondZ: -7.9,
  porteX: -15.0, posteX: 4.0,
  paillasseG: -10.8, paillasseD: 11.4
};

function matStd(opts) { return new THREE.MeshStandardMaterial(opts); }

/* ---- coque de la salle : sol, murs, plafond, rampes lumineuses ---- */
function coqueLabo(scene) {
  const texSol = textureSol([16, 16]);
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(90, 90),
    matStd({ map: texSol.map, roughnessMap: texSol.roughnessMap,
             color: 0x7C93A6, metalness: 0.2, roughness: 0.95 }));
  sol.rotation.x = -Math.PI / 2;
  sol.receiveShadow = true;
  scene.add(sol);

  const texMur = textureMur([6, 1.6]);
  const murFond = new THREE.Mesh(new THREE.BoxGeometry(90, LABO.plafondY, 0.5),
    matStd({ map: texMur.map, color: 0xA9BECC, metalness: 0.04, roughness: 0.95 }));
  murFond.position.set(0, LABO.plafondY / 2, LABO.murZ - 0.25);
  murFond.receiveShadow = true;
  scene.add(murFond);

  // mur de gauche : il ferme le cadrage et donne un second point de fuite
  const murGauche = new THREE.Mesh(new THREE.BoxGeometry(0.5, LABO.plafondY, 28),
    matStd({ map: textureMur([2, 1.6]).map, color: 0x8FA6B6,
             metalness: 0.04, roughness: 0.95 }));
  murGauche.position.set(-19.5, LABO.plafondY / 2, 4);
  murGauche.receiveShadow = true;
  scene.add(murGauche);

  const plinthe = new THREE.Mesh(new THREE.BoxGeometry(90, 0.32, 0.14),
    matStd({ color: 0x12354D, metalness: 0.3, roughness: 0.55 }));
  plinthe.position.set(0, 0.16, LABO.murZ + 0.07);
  scene.add(plinthe);

  // faux plafond sombre : il pose un couvercle sans attirer le regard
  const plafond = new THREE.Mesh(new THREE.PlaneGeometry(90, 50),
    matStd({ color: 0x07192A, metalness: 0.08, roughness: 0.96 }));
  plafond.rotation.x = Math.PI / 2;
  plafond.position.set(0, LABO.plafondY, 2);
  scene.add(plafond);

  // ossature : quelques profilés fuyant vers le fond, très discrets
  const matOssature = matStd({ color: 0x0D2537, metalness: 0.35, roughness: 0.6 });
  for (let i = -5; i <= 5; i++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 26), matOssature);
    t.position.set(i * 3.6, LABO.plafondY - 0.05, -4);
    scene.add(t);
  }

  // rampes lumineuses : source visible de l'éclairage général
  const matNeon = new THREE.MeshBasicMaterial({ color: 0xA6C8DC });
  [-9.0, -1.8, 5.4].forEach(function (x) {
    const capot = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 9.6),
      matStd({ color: 0x748EA0, metalness: 0.4, roughness: 0.48 }));
    capot.position.set(x, LABO.plafondY - 0.08, -4.6);
    scene.add(capot);
    const rampe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 9.2), matNeon);
    rampe.position.set(x, LABO.plafondY - 0.19, -4.6);
    scene.add(rampe);
  });
}

/* ---- éclairage : une clé douce, des appoints, pas d'aplat ---- */
function eclairageLabo(scene) {
  scene.add(new THREE.HemisphereLight(0x6E92AC, 0x060F18, 0.26));

  const cle = new THREE.DirectionalLight(0xDDEBF4, 0.60);
  cle.position.set(-11, 16, 11);
  cle.castShadow = true;
  cle.shadow.mapSize.set(2048, 2048);
  cle.shadow.camera.near = 1; cle.shadow.camera.far = 64;
  cle.shadow.camera.left = -26; cle.shadow.camera.right = 26;
  cle.shadow.camera.top = 22; cle.shadow.camera.bottom = -12;
  cle.shadow.bias = -0.0009;
  cle.shadow.radius = 3.5;
  scene.add(cle);

  // les rampes du plafond éclairent réellement la paillasse
  [-9.0, -1.8, 5.4].forEach(function (x, i) {
    const l = new THREE.PointLight(0xB9D6E8, 0.30, 24, 2);
    l.position.set(x, LABO.plafondY - 0.7, -4.0);
    if (i === 1) {
      l.castShadow = true;
      l.shadow.mapSize.set(1024, 1024);
      l.shadow.bias = -0.002;
    }
    scene.add(l);
  });

  // flaque de lumière sur le poste de travail
  const poste = new THREE.SpotLight(0xCFE8F6, 0.80, 28, 0.55, 0.8, 1.6);
  poste.position.set(LABO.posteX, LABO.plafondY - 0.5, -1.0);
  poste.target.position.set(LABO.posteX, 2.6, -6.6);
  scene.add(poste); scene.add(poste.target);

  const accentT = new THREE.PointLight(PALETTE.tealClair, 0.5, 18, 2);
  accentT.position.set(8.8, 4.2, -3.2);
  scene.add(accentT);
  const accentV = new THREE.PointLight(PALETTE.violet, 0.34, 18, 2);
  accentV.position.set(-12.0, 3.8, -3.5);
  scene.add(accentV);

  // rehaut rasant : évite un premier plan complètement bouché
  const rasant = new THREE.DirectionalLight(0x7FA6BE, 0.16);
  rasant.position.set(2, 1.2, 14);
  scene.add(rasant);
}

/* ---- porte d'entrée : point de départ du parcours ----
   Un vantail entrouvert sur un couloir éclairé : le joueur comprend
   d'où arrive le pharmacien avant même qu'il ne se déplace. */
function porteLabo(scene) {
  const g = new THREE.Group();
  const L = 3.2, H = 6.0;

  // couloir éclairé derrière la porte
  const couloir = new THREE.Mesh(new THREE.PlaneGeometry(L, H),
    new THREE.MeshBasicMaterial({ color: 0x5E93AC }));
  couloir.position.set(0, H / 2, -0.55);
  g.add(couloir);

  // embrasure creusée dans le mur
  const matCadre = matStd({ color: 0x7C93A4, metalness: 0.6, roughness: 0.36 });
  [-1, 1].forEach(function (s) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.34, H + 0.34, 0.75), matCadre);
    p.position.set(s * (L / 2 + 0.17), (H + 0.34) / 2, -0.25);
    p.castShadow = true; p.receiveShadow = true;
    g.add(p);
  });
  const linteau = new THREE.Mesh(new THREE.BoxGeometry(L + 0.68, 0.34, 0.75), matCadre);
  linteau.position.set(0, H + 0.17, -0.25);
  linteau.castShadow = true;
  g.add(linteau);

  // deux vantaux à hublot ; celui de gauche est resté entrouvert
  const matVantail = matStd({ color: 0xB9CBD8, metalness: 0.16, roughness: 0.5 });
  function vantail(sens, ouverture) {
    const v = new THREE.Group();
    const l = L / 2 - 0.04;
    const panneau = new THREE.Mesh(new THREE.BoxGeometry(l, H - 0.12, 0.13), matVantail);
    panneau.position.set(sens * l / 2, (H - 0.12) / 2, 0);
    panneau.castShadow = true; panneau.receiveShadow = true;
    v.add(panneau);
    const vitre = new THREE.Mesh(new THREE.BoxGeometry(l - 0.55, 2.4, 0.04),
      matStd({ color: 0x8FCEE0, metalness: 0.1, roughness: 0.07,
               transparent: true, opacity: 0.4 }));
    vitre.position.set(sens * l / 2, H - 2.0, 0.07);
    v.add(vitre);
    const cadreV = new THREE.Mesh(new THREE.BoxGeometry(l - 0.4, 2.56, 0.03),
      matStd({ color: 0x93AAB9, metalness: 0.55, roughness: 0.35 }));
    cadreV.position.set(sens * l / 2, H - 2.0, 0.05);
    v.add(cadreV);
    const barre = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 16),
      matStd({ color: 0xA7BCC9, metalness: 0.78, roughness: 0.24 }));
    barre.position.set(sens * (l - 0.28), 2.65, 0.14);
    barre.castShadow = true;
    v.add(barre);
    v.position.set(-sens * L / 2, 0, 0.12);   // pivot sur le gond
    v.rotation.y = sens * ouverture;
    return v;
  }
  g.add(vantail(1, 0.62));    // vantail entrouvert vers la salle
  g.add(vantail(-1, 0.0));

  // plaque de salle et voyant d'accès
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.46, 0.05),
    matStd({ color: PALETTE.teal, metalness: 0.35, roughness: 0.4 }));
  plaque.position.set(L / 2 + 0.55, 3.6, 0.28);
  g.add(plaque);
  const voyant = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12),
    new THREE.MeshBasicMaterial({ color: PALETTE.vert }));
  voyant.position.set(L / 2 + 0.55, 4.5, 0.2);
  g.add(voyant);

  const enseigne = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.52, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x2B7C8E }));
  enseigne.position.set(0, H + 0.75, 0.15);
  g.add(enseigne);

  g.position.set(LABO.porteX, 0, LABO.murZ + 0.02);
  scene.add(g);

  // la porte devient une vraie source : le sas éclaire le coin de la salle
  const sas = new THREE.PointLight(0xAEDCEC, 0.5, 13, 2);
  sas.position.set(LABO.porteX + 0.8, 3.2, LABO.murZ + 1.4);
  scene.add(sas);

  // trace de lumière au sol : le seuil, départ du trajet
  const seuil = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({ color: 0x8FD2E4, transparent: true, opacity: 0.13 }));
  seuil.rotation.x = -Math.PI / 2;
  seuil.position.set(LABO.porteX + 0.3, 0.02, LABO.murZ + 2.2);
  scene.add(seuil);
}

/* ---- marquage au sol : porte -> allée -> poste de travail ----
   Un laboratoire réel signale ses circulations. Ici le marquage dit
   aussi au joueur où le personnage peut aller et où il doit s'arrêter. */
function marquageSol(scene) {
  function bande(x, z, l, p, couleur, opacite) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, p),
      new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: opacite }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.015, z);
    scene.add(m);
  }

  // allée de circulation, parallèle à la paillasse
  bande(-2, -2.3, 34, 4.2, 0x2E6E8E, 0.30);
  bande(-2, -4.35, 34, 0.14, PALETTE.tealClair, 0.60);
  bande(-2, -0.25, 34, 0.14, PALETTE.tealClair, 0.60);

  // amorce depuis la porte, qui rejoint l'allée
  bande(LABO.porteX + 0.6, -5.6, 3.6, 3.6, 0x2E6E8E, 0.22);

  // emprise du poste de travail, face aux écrans
  const poste = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.3),
    new THREE.MeshBasicMaterial({ color: PALETTE.teal, transparent: true, opacity: 0.15 }));
  poste.rotation.x = -Math.PI / 2;
  poste.position.set(3.6, 0.022, -3.0);
  scene.add(poste);
  [-2.1, 2.1].forEach(function (dx) {
    bande(3.6 + dx, -3.0, 0.11, 2.3, PALETTE.tealClair, 0.4);
  });
}

/* ---- paillasse continue, façades, plan de travail, dosseret ---- */
function paillasseLabo(scene) {
  const G = LABO.paillasseG, D = LABO.paillasseD;
  const largeur = D - G, cx = (G + D) / 2, prof = 3.0;
  const zc = (LABO.faceZ + LABO.fondZ) / 2;

  const texPlan = texturePlanTravail([10, 1.6]);
  const matPlan = matStd({ map: texPlan.map, roughnessMap: texPlan.roughnessMap,
                           color: 0xA8BECE, metalness: 0.3, roughness: 0.7 });
  const texMeuble = textureMeuble([1, 1]);
  const matMeuble = matStd({ map: texMeuble.map, color: 0x7A92A6,
                             metalness: 0.1, roughness: 0.52 });
  const matInox = matStd({ color: 0x7E94A4, metalness: 0.82, roughness: 0.28 });

  const socle = new THREE.Mesh(new THREE.BoxGeometry(largeur - 0.4, 0.34, prof - 0.5),
    matStd({ color: 0x091C2B, metalness: 0.4, roughness: 0.5 }));
  socle.position.set(cx, 0.17, zc);
  socle.receiveShadow = true;
  scene.add(socle);

  const caisson = new THREE.Mesh(new THREE.BoxGeometry(largeur, LABO.planY - 0.5, prof),
    matStd({ color: 0x6E8698, metalness: 0.08, roughness: 0.64 }));
  caisson.position.set(cx, 0.32 + (LABO.planY - 0.5) / 2, zc);
  caisson.castShadow = true; caisson.receiveShadow = true;
  scene.add(caisson);

  // façades : alternance tiroir / porte, comme un mobilier de paillasse
  const pas = 2.0;
  const n = Math.floor(largeur / pas);
  const marge = (largeur - n * pas) / 2;
  for (let i = 0; i < n; i++) {
    const x = G + marge + pas * (i + 0.5);
    const tiroir = new THREE.Mesh(new THREE.BoxGeometry(pas - 0.13, 0.6, 0.07), matMeuble);
    tiroir.position.set(x, 1.88, LABO.faceZ + 0.04);
    tiroir.castShadow = true;
    scene.add(tiroir);
    const battant = new THREE.Mesh(new THREE.BoxGeometry(pas - 0.13, 1.24, 0.07), matMeuble);
    battant.position.set(x, 1.12, LABO.faceZ + 0.04);
    battant.castShadow = true;
    scene.add(battant);
    [1.88, 1.66].forEach(function (y) {
      const poignee = new THREE.Mesh(new THREE.BoxGeometry(pas * 0.4, 0.05, 0.05), matInox);
      poignee.position.set(x, y, LABO.faceZ + 0.1);
      scene.add(poignee);
    });
    if (i % 3 === 1) {
      const eti = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.18),
        new THREE.MeshBasicMaterial({ color: 0x2E6B85 }));
      eti.position.set(x - pas * 0.26, 1.2, LABO.faceZ + 0.09);
      scene.add(eti);
    }
  }

  const plateau = new THREE.Mesh(new THREE.BoxGeometry(largeur + 0.5, 0.2, prof + 0.5), matPlan);
  plateau.position.set(cx, LABO.planY - 0.1, zc);
  plateau.castShadow = true; plateau.receiveShadow = true;
  scene.add(plateau);
  const chant = new THREE.Mesh(new THREE.BoxGeometry(largeur + 0.52, 0.055, 0.055), matInox);
  chant.position.set(cx, LABO.planY - 0.205, LABO.faceZ - 0.25);
  scene.add(chant);

  const dosseret = new THREE.Mesh(new THREE.BoxGeometry(largeur + 0.5, 0.8, 0.16), matPlan);
  dosseret.position.set(cx, LABO.planY + 0.4, LABO.fondZ - 0.32);
  dosseret.castShadow = true;
  scene.add(dosseret);

  // rail de services : arrivées de gaz et de vide, typiques d'une paillasse
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, largeur - 1.0, 14), matInox);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(cx, LABO.planY + 1.45, LABO.fondZ - 0.36);
  scene.add(rail);
  for (let x = G + 1.2; x < D - 1.0; x += 2.6) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 10), matInox);
    col.position.set(x, LABO.planY + 1.24, LABO.fondZ - 0.36);
    scene.add(col);
    const robinet = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.3),
      matStd({ color: PALETTE.ambre, metalness: 0.4, roughness: 0.4 }));
    robinet.position.set(x, LABO.planY + 1.03, LABO.fondZ - 0.24);
    scene.add(robinet);
  }

  return { matInox: matInox, matPlan: matPlan };
}

/* ---- sorbonne : l'équipement le plus reconnaissable d'un laboratoire ---- */
function sorbonne(scene, x) {
  const g = new THREE.Group();
  const L = 4.4, H = 4.3, P = 2.9;
  const matCorps = matStd({ color: 0x8097A8, metalness: 0.16, roughness: 0.52 });
  const matInt = matStd({ color: 0x102B3F, metalness: 0.2, roughness: 0.72 });
  const matVitre = matStd({ color: 0x9FD0E0, metalness: 0.08, roughness: 0.06,
                            transparent: true, opacity: 0.22, side: THREE.DoubleSide });

  const fond = new THREE.Mesh(new THREE.BoxGeometry(L, H, 0.12), matInt);
  fond.position.set(0, H / 2, -P / 2);
  fond.receiveShadow = true;
  g.add(fond);
  [-1, 1].forEach(function (s) {
    const joue = new THREE.Mesh(new THREE.BoxGeometry(0.16, H, P), matCorps);
    joue.position.set(s * (L / 2 - 0.08), H / 2, 0);
    joue.castShadow = true; joue.receiveShadow = true;
    g.add(joue);
  });
  const hotte = new THREE.Mesh(new THREE.BoxGeometry(L, 0.85, P), matCorps);
  hotte.position.set(0, H - 0.42, 0);
  hotte.castShadow = true;
  g.add(hotte);
  const gaine = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4.4, 18),
    matStd({ color: 0x6E8494, metalness: 0.5, roughness: 0.42 }));
  gaine.position.set(0.6, H + 2.1, -0.9);
  gaine.castShadow = true;
  g.add(gaine);

  const vitre = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.3, 2.0), matVitre);
  vitre.position.set(0, H - 1.55, P / 2 - 0.06);
  g.add(vitre);
  const barreG = new THREE.Mesh(new THREE.BoxGeometry(L - 0.3, 0.11, 0.11),
    matStd({ color: 0x8FA8B8, metalness: 0.7, roughness: 0.28 }));
  barreG.position.set(0, H - 2.58, P / 2 - 0.02);
  g.add(barreG);

  const neonInt = new THREE.Mesh(new THREE.BoxGeometry(L - 0.6, 0.07, 0.18),
    new THREE.MeshBasicMaterial({ color: 0xD6EEFA }));
  neonInt.position.set(0, H - 0.92, 0.1);
  g.add(neonInt);
  const lampeInt = new THREE.PointLight(0xB6DEEE, 0.7, 7, 2);
  lampeInt.position.set(0, H - 1.3, 0.1);
  g.add(lampeInt);

  // montage de synthèse sous la hotte
  const ballon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 26, 18),
    matStd({ color: PALETTE.verre, metalness: 0.05, roughness: 0.06,
             transparent: true, opacity: 0.38 }));
  ballon.position.set(-0.9, 0.48, 0.1);
  g.add(ballon);
  const liquide = new THREE.Mesh(new THREE.SphereGeometry(0.29, 22, 14),
    matStd({ color: PALETTE.ambre, metalness: 0.1, roughness: 0.3,
             transparent: true, opacity: 0.8 }));
  liquide.position.set(-0.9, 0.4, 0.1);
  g.add(liquide);
  const colonne = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 16),
    matStd({ color: PALETTE.verre, metalness: 0.05, roughness: 0.06,
             transparent: true, opacity: 0.3 }));
  colonne.position.set(-0.9, 1.5, 0.1);
  g.add(colonne);
  const potence = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 12),
    matStd({ color: 0x8195A5, metalness: 0.8, roughness: 0.26 }));
  potence.position.set(-0.1, 1.2, -0.4);
  g.add(potence);
  const pince = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.06),
    matStd({ color: 0x8195A5, metalness: 0.8, roughness: 0.26 }));
  pince.position.set(-0.5, 1.85, -0.28);
  g.add(pince);
  const agitateur = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.15, 0.68),
    matStd({ color: 0xBFD1DD, metalness: 0.22, roughness: 0.4 }));
  agitateur.position.set(1.2, 0.09, 0.12);
  agitateur.castShadow = true;
  g.add(agitateur);
  const temoin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.02),
    new THREE.MeshBasicMaterial({ color: PALETTE.vert }));
  temoin.position.set(1.42, 0.11, 0.46);
  g.add(temoin);

  g.position.set(x, LABO.planY, (LABO.faceZ + LABO.fondZ) / 2 - 0.05);
  scene.add(g);
}

/* ---- étagères murales et flaconnage ---- */
function etageresLabo(scene, x0, x1) {
  const matEtagere = matStd({ color: 0x113349, metalness: 0.45, roughness: 0.42 });
  const teintes = [PALETTE.tealClair, PALETTE.ambre, PALETTE.vert, PALETTE.violet,
                   PALETTE.teal, 0xE06A70];
  [4.85, 6.3].forEach(function (y, niveau) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.13, 1.05), matEtagere);
    p.position.set((x0 + x1) / 2, y, LABO.murZ + 0.6);
    p.castShadow = true; p.receiveShadow = true;
    scene.add(p);
    [x0 + 0.4, (x0 + x1) / 2, x1 - 0.4].forEach(function (xe) {
      const eq = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.46, 0.75), matEtagere);
      eq.position.set(xe, y - 0.28, LABO.murZ + 0.48);
      scene.add(eq);
    });

    const nb = Math.floor((x1 - x0 - 0.5) / 0.58);
    for (let i = 0; i < nb; i++) {
      const px = x0 + 0.42 + i * 0.58;
      const h = 0.48 + ((i + niveau) % 3) * 0.18;
      const teinte = teintes[(i + niveau * 2) % teintes.length];
      const matF = matStd({ color: teinte, metalness: 0.08, roughness: 0.22,
                            transparent: true, opacity: 0.82 });
      const flacon = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, h, 20), matF);
      flacon.position.set(px, y + 0.065 + h / 2, LABO.murZ + 0.6);
      flacon.castShadow = true;
      scene.add(flacon);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.13, 12), matF);
      col.position.set(px, y + 0.065 + h + 0.065, LABO.murZ + 0.6);
      scene.add(col);
      const bouchon = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.11, 12),
        matStd({ color: 0xD9E5ED, roughness: 0.6 }));
      bouchon.position.set(px, y + 0.065 + h + 0.18, LABO.murZ + 0.6);
      scene.add(bouchon);
      const eti = new THREE.Mesh(new THREE.PlaneGeometry(0.18, h * 0.4),
        new THREE.MeshBasicMaterial({ color: 0xDCE8F0, transparent: true, opacity: 0.8 }));
      eti.position.set(px, y + 0.065 + h / 2, LABO.murZ + 0.76);
      scene.add(eti);
    }
  });
}

/* ---- poste de modélisation : deux écrans, clavier, unité centrale ---- */
function posteInformatique(scene, cx) {
  const matChassis = matStd({ color: 0x142936, metalness: 0.55, roughness: 0.36 });
  const matPied = matStd({ color: 0x223D4F, metalness: 0.6, roughness: 0.34 });

  function ecran(x, z, l, h, rot, texture) {
    const g = new THREE.Group();
    const cadre = new THREE.Mesh(new THREE.BoxGeometry(l + 0.13, h + 0.13, 0.11), matChassis);
    cadre.castShadow = true;
    g.add(cadre);
    const dalle = new THREE.Mesh(new THREE.PlaneGeometry(l, h),
      new THREE.MeshBasicMaterial({ map: texture }));
    dalle.position.z = 0.06;
    g.add(dalle);
    const bras = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.7, 0.11), matPied);
    bras.position.y = -h / 2 - 0.36;
    g.add(bras);
    const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.06, 26), matPied);
    socle.position.y = -h / 2 - 0.7;
    socle.castShadow = true;
    g.add(socle);
    g.position.set(x, LABO.planY + 0.72 + h / 2, z);
    g.rotation.y = rot;
    return g;
  }

  scene.add(ecran(cx, -6.6, 3.3, 1.95, 0.06, textureEcranDocking(1280, 800)));
  scene.add(ecran(cx + 2.75, -6.3, 2.2, 1.36, -0.44, textureEcranAnalyse(1024, 640)));

  const lueur = new THREE.PointLight(0x4FB4CE, 0.45, 8, 2);
  lueur.position.set(cx, LABO.planY + 1.4, -5.7);
  scene.add(lueur);

  const clavier = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.085, 0.64), matChassis);
  clavier.position.set(cx - 0.1, LABO.planY + 0.055, -5.6);
  clavier.rotation.x = -0.05;
  clavier.castShadow = true;
  scene.add(clavier);
  const touches = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.52),
    new THREE.MeshBasicMaterial({ color: 0x1B394C }));
  touches.rotation.x = -Math.PI / 2 - 0.05;
  touches.position.set(cx - 0.1, LABO.planY + 0.1, -5.6);
  scene.add(touches);
  const souris = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), matChassis);
  souris.scale.set(1, 0.5, 1.5);
  souris.position.set(cx + 1.25, LABO.planY + 0.06, -5.55);
  souris.castShadow = true;
  scene.add(souris);

  const carnet = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.05, 0.64),
    matStd({ color: 0xD3E0E9, metalness: 0.02, roughness: 0.85 }));
  carnet.position.set(cx - 1.75, LABO.planY + 0.035, -5.45);
  carnet.rotation.y = 0.3;
  carnet.castShadow = true;
  scene.add(carnet);
}

/* ---- baie de calcul : la chimie computationnelle a besoin de machines ---- */
function baieCalcul(scene, x) {
  const g = new THREE.Group();
  const H = 5.6, L = 2.4, P = 1.2;
  const corps = new THREE.Mesh(new THREE.BoxGeometry(L, H, P),
    matStd({ color: 0x0E2434, metalness: 0.6, roughness: 0.4 }));
  corps.position.y = H / 2;
  corps.castShadow = true; corps.receiveShadow = true;
  g.add(corps);
  const porteV = new THREE.Mesh(new THREE.BoxGeometry(L - 0.2, H - 0.3, 0.05),
    matStd({ color: 0x24506B, metalness: 0.3, roughness: 0.12,
             transparent: true, opacity: 0.3 }));
  porteV.position.set(0, H / 2, P / 2 + 0.03);
  g.add(porteV);
  for (let i = 0; i < 13; i++) {
    const lame = new THREE.Mesh(new THREE.BoxGeometry(L - 0.32, 0.24, 0.1),
      matStd({ color: 0x173648, metalness: 0.55, roughness: 0.42 }));
    lame.position.set(0, 0.55 + i * 0.37, P / 2 - 0.02);
    g.add(lame);
    for (let k = 0; k < 4; k++) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02),
        new THREE.MeshBasicMaterial({
          color: (i + k) % 5 === 0 ? PALETTE.ambre : PALETTE.tealClair }));
      d.position.set(-L / 2 + 0.32 + k * 0.15, 0.55 + i * 0.37, P / 2 + 0.05);
      g.add(d);
    }
  }
  const lueur = new THREE.PointLight(PALETTE.tealClair, 0.32, 8, 2);
  lueur.position.set(0, 3.0, P / 2 + 0.7);
  g.add(lueur);
  g.position.set(x, 0, LABO.murZ + 0.75);
  scene.add(g);
}

/* ---- affiche encadrée ---- */
function afficheMurale(scene, x, y, variante, echelle) {
  const e = echelle === undefined ? 1 : echelle;
  const l = 1.85 * e, h = 2.6 * e;
  const cadre = new THREE.Mesh(new THREE.BoxGeometry(l + 0.14, h + 0.14, 0.07),
    matStd({ color: 0x8299A9, metalness: 0.5, roughness: 0.42 }));
  cadre.position.set(x, y, LABO.murZ + 0.05);
  cadre.castShadow = true;
  scene.add(cadre);
  const toile = new THREE.Mesh(new THREE.PlaneGeometry(l, h),
    new THREE.MeshBasicMaterial({ map: textureAffiche(variante) }));
  toile.position.set(x, y, LABO.murZ + 0.095);
  scene.add(toile);
}

/* ---- modèle moléculaire physique sur son pied ----
   Plus crédible dans un laboratoire de pharmacie qu'un hologramme, et
   tout aussi explicite sur le thème de la modélisation. */
function modeleMoleculaire(scene, x, z) {
  const g = new THREE.Group();
  const matSocle = matStd({ color: 0x1B3E57, metalness: 0.55, roughness: 0.35 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.46, 0.13, 32), matSocle);
  base.position.y = 0.08;
  base.castShadow = true; base.receiveShadow = true;
  g.add(base);
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.78, 14), matSocle);
  tige.position.y = 0.5;
  tige.castShadow = true;
  g.add(tige);

  const mol = molecule(ASPIRINE, { echelle: 1, sansH: true, facteurRayon: 1.0 });
  mol.scale.setScalar(0.19);
  mol.position.y = 1.28;
  mol.rotation.set(0.3, -0.5, 0.12);
  g.add(mol);

  g.position.set(x, LABO.planY, z);
  scene.add(g);
}

/* ---- petits équipements posés sur le plan de travail ---- */
function equipementsPaillasse(scene, matInox) {
  // balance analytique sous cloche
  const balance = new THREE.Group();
  const socleB = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.26, 0.95),
    matStd({ color: 0xBACCD8, metalness: 0.2, roughness: 0.45 }));
  socleB.position.y = 0.13;
  socleB.castShadow = true;
  balance.add(socleB);
  const afficheurB = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.15),
    new THREE.MeshBasicMaterial({ color: 0x2BD4C4 }));
  afficheurB.position.set(0, 0.19, 0.49);
  afficheurB.rotation.x = -0.35;
  balance.add(afficheurB);
  const cloche = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.78),
    matStd({ color: PALETTE.verre, metalness: 0.05, roughness: 0.05,
             transparent: true, opacity: 0.2, side: THREE.DoubleSide }));
  cloche.position.set(0, 0.66, -0.05);
  balance.add(cloche);
  const plateauB = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.035, 24), matInox);
  plateauB.position.set(0, 0.33, -0.05);
  balance.add(plateauB);
  balance.position.set(-5.3, LABO.planY, -6.5);
  balance.rotation.y = 0.2;
  scene.add(balance);

  // évier de paillasse et robinet col de cygne
  const cuve = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.1), matInox);
  cuve.position.set(-3.7, LABO.planY + 0.01, -6.6);
  scene.add(cuve);
  const robinet = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 10, 24, Math.PI), matInox);
  robinet.position.set(-3.7, LABO.planY + 0.4, -7.1);
  robinet.rotation.y = Math.PI / 2;
  robinet.castShadow = true;
  scene.add(robinet);
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.42, 12), matInox);
  pied.position.set(-4.02, LABO.planY + 0.21, -7.1);
  scene.add(pied);

  // verrerie
  const v1 = erlenmeyer(1.35, 0.55, PALETTE.tealClair);
  v1.position.set(-2.5, LABO.planY + 0.01, -6.5);
  scene.add(v1);
  const v2 = erlenmeyer(1.0, 0.42, PALETTE.ambre);
  v2.position.set(-1.75, LABO.planY + 0.01, -6.85);
  scene.add(v2);
  const bechers = new THREE.Group();
  [0, 1, 2].forEach(function (i) {
    const r = 0.25 - i * 0.03, h = 0.58 - i * 0.08;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true),
      matStd({ color: PALETTE.verre, metalness: 0.05, roughness: 0.06,
               transparent: true, opacity: 0.26, side: THREE.DoubleSide }));
    b.position.set(i * 0.58, h / 2, 0);
    bechers.add(b);
  });
  bechers.position.set(-6.9, LABO.planY, -6.9);
  scene.add(bechers);

  // portoir de tubes à essai
  const support = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.6),
    matStd({ color: 0x183B56, metalness: 0.5, roughness: 0.4 }));
  support.position.set(-0.6, LABO.planY + 0.075, -6.3);
  support.castShadow = true;
  scene.add(support);
  [-0.46, -0.15, 0.15, 0.46].forEach(function (dx, i) {
    const t = tubeEssai(0.95, 0.135, [PALETTE.vert, PALETTE.violet, PALETTE.teal, PALETTE.ambre][i]);
    t.position.set(-0.6 + dx, LABO.planY + 0.02, -6.3);
    scene.add(t);
  });

  // portoir de micropipettes
  const portoirP = new THREE.Group();
  const montant = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.4, 12), matInox);
  montant.position.y = 0.7;
  portoirP.add(montant);
  const socleP = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.08, 24), matInox);
  socleP.position.y = 0.04;
  socleP.castShadow = true;
  portoirP.add(socleP);
  [0, 1, 2].forEach(function (i) {
    const a = -0.7 + i * 0.7;
    const bras = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.055, 0.09), matInox);
    bras.position.set(Math.cos(a) * 0.2, 1.22 - i * 0.14, Math.sin(a) * 0.2);
    bras.rotation.y = -a;
    portoirP.add(bras);
    const pip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.018, 0.98, 12),
      matStd({ color: [PALETTE.violet, PALETTE.teal, PALETTE.ambre][i],
               metalness: 0.2, roughness: 0.42 }));
    pip.position.set(Math.cos(a) * 0.38, 0.8 - i * 0.14, Math.sin(a) * 0.38);
    pip.rotation.z = 0.07;
    pip.castShadow = true;
    portoirP.add(pip);
  });
  portoirP.position.set(1.5, LABO.planY, -6.9);
  scene.add(portoirP);

  // centrifugeuse, en bout de paillasse
  const centri = new THREE.Group();
  const cuveC = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.56, 32),
    matStd({ color: 0xB2C5D2, metalness: 0.25, roughness: 0.42 }));
  cuveC.position.y = 0.28;
  cuveC.castShadow = true;
  centri.add(cuveC);
  const couvercle = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.72, 0.16, 32),
    matStd({ color: 0x27465D, metalness: 0.5, roughness: 0.32 }));
  couvercle.position.y = 0.63;
  centri.add(couvercle);
  const hublotC = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.03, 28),
    matStd({ color: 0x7FB9CC, metalness: 0.1, roughness: 0.08,
             transparent: true, opacity: 0.45 }));
  hublotC.position.y = 0.72;
  centri.add(hublotC);
  const pupitre = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.12),
    new THREE.MeshBasicMaterial({ color: PALETTE.ambre }));
  pupitre.position.set(0, 0.42, 0.78);
  pupitre.rotation.x = -0.2;
  centri.add(pupitre);
  centri.position.set(8.6, LABO.planY, -6.4);
  scene.add(centri);
}

function construireLabo(scene, renderer, L, H) {
  scene.background = cielDegrade({
    haut: '#04101C', milieu: '#08202F', bas: '#061A27',
    haloX: 0.5, haloY: 0.24, halo: 'rgba(80,175,205,0.14)',
    halo2: 'rgba(109,95,224,0.08)' });
  // brume légère : les éléments du fond reculent, le premier plan ressort
  scene.fog = new THREE.Fog(new THREE.Color(0x07182A), 22, 72);

  eclairageLabo(scene);
  coqueLabo(scene);
  porteLabo(scene);
  marquageSol(scene);

  const p = paillasseLabo(scene);
  sorbonne(scene, -6.9);
  etageresLabo(scene, -4.8, -1.2);
  afficheMurale(scene, 1.4, 6.0, 'docking', 0.95);
  afficheMurale(scene, 10.4, 5.7, 'sar', 0.85);
  baieCalcul(scene, 8.2);
  posteInformatique(scene, LABO.posteX);
  equipementsPaillasse(scene, p.matInox);
  modeleMoleculaire(scene, -0.6, -5.6);
}

/* Diapositive d'accueil : vue de trois quarts, la paillasse fuit vers la
   droite, le centre-gauche reste dégagé pour la bulle de dialogue. */
SCENES['labo-accueil'] = function (scene, renderer, L, H) {
  construireLabo(scene, renderer, L, H);
  const cam = new THREE.PerspectiveCamera(42, L / H, 0.1, 160);
  cam.position.set(6.6, 4.3, 12.0);
  cam.lookAt(-0.6, 2.9, -5);
  return cam;
};

/* Écran d'identification : le laboratoire vu de plus loin et de plus
   haut, volontairement calme. Le panneau de saisie se pose dessus, à
   droite : la moitié gauche garde la paillasse et les écrans, la droite
   reste sombre et dégagée. */
SCENES['accueil-identite'] = function (scene, renderer, L, H) {
  construireLabo(scene, renderer, L, H);
  // l'assombrissement est posé en CSS par-dessus l'image : le rendu
  // reste net, et le dégradé suit la place réelle du panneau

  const cam = new THREE.PerspectiveCamera(46, L / H, 0.1, 160);
  cam.position.set(7.4, 5.1, 13.6);
  cam.lookAt(-1.4, 3.1, -5);
  return cam;
};

/* Plan de station : même laboratoire, cadré plus bas et plus frontalement.
   Le sol occupe le bas de l'image, où marche le personnage. */
SCENES['labo-station'] = function (scene, renderer, L, H) {
  construireLabo(scene, renderer, L, H);
  const cam = new THREE.PerspectiveCamera(44, L / H, 0.1, 160);
  cam.position.set(3.0, 3.15, 11.4);
  cam.lookAt(-0.3, 3.55, -5);
  return cam;
};

/* =====================================================================
   Jeu d'icônes
   Toutes rendues sur fond transparent, avec le même banc d'éclairage :
   c'est ce qui leur donne une identité commune, là où les cliparts
   d'origine venaient de sources hétérogènes.
   ===================================================================== */

function camIcone(L, H, distance, cible, fov) {
  const cam = new THREE.PerspectiveCamera(fov || 30, L / H, 0.1, 60);
  cam.position.set(distance * 0.28, distance * 0.30, distance);
  cam.lookAt(cible.x, cible.y, cible.z);
  return cam;
}

function matMetal(couleur) {
  return new THREE.MeshStandardMaterial({ color: couleur, metalness: 0.55, roughness: 0.3 });
}
function matMat(couleur) {
  return new THREE.MeshStandardMaterial({ color: couleur, metalness: 0.08, roughness: 0.62 });
}

/* Objectifs : une cible dont le centre est une molécule. */
SCENES['icone-objectifs'] = function (scene, renderer, L, H) {
  bancEclairage(scene, { intensite: 1.05 });
  const g = new THREE.Group();
  const anneaux = [
    { r: 2.05, c: PALETTE.nuit2 }, { r: 1.55, c: 0x1C5E73 },
    { r: 1.05, c: PALETTE.teal },  { r: 0.6,  c: PALETTE.tealClair }
  ];
  anneaux.forEach(function (a, i) {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(a.r, a.r, 0.16 + i * 0.04, 64), matMat(a.c));
    d.rotation.x = Math.PI / 2;
    d.position.z = i * 0.05;
    d.castShadow = true; d.receiveShadow = true;
    g.add(d);
  });
  const mol = molecule(ACIDE_SALICYLIQUE, { echelle: 1, sansH: true, facteurRayon: 1.1 });
  mol.scale.setScalar(0.18);
  mol.position.set(0, 0, 0.55);
  mol.rotation.set(0.3, 0.5, 0.1);
  g.add(mol);
  // flèche plantée dans la cible
  const fleche = new THREE.Group();
  const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.6, 18), matMetal(0xC8D8E4));
  fleche.add(tige);
  const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 20), matMetal(PALETTE.ambre));
  pointe.position.y = -1.5;
  pointe.rotation.x = Math.PI;
  fleche.add(pointe);
  [0, 1, 2].forEach(function (k) {
    const empenne = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.03), matMat(PALETTE.ambre));
    empenne.position.y = 1.15;
    empenne.rotation.y = k * Math.PI / 3;
    fleche.add(empenne);
  });
  fleche.position.set(0.55, 0.5, 1.5);
  fleche.rotation.set(1.05, 0, -0.5);
  fleche.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  g.add(fleche);
  g.rotation.set(-0.32, 0.22, 0);
  scene.add(g);
  return camIcone(L, H, 9.5, new THREE.Vector3(0.1, 0.1, 0), 30);
};

/* Prérequis : une rangée des savoirs attendus (bandeau large). */
SCENES['icone-prerequis'] = function (scene, renderer, L, H) {
  bancEclairage(scene, { intensite: 1.05 });
  const g = new THREE.Group();

  // planchette à pince
  const planchette = new THREE.Group();
  const planche = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.3, 0.14), matMat(0x1B4A63));
  planche.castShadow = true;
  planchette.add(planche);
  const feuille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.95, 0.05), matMat(0xF4F9FC));
  feuille.position.set(0, -0.12, 0.1);
  planchette.add(feuille);
  const pince = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.2, 0.24), matMetal(0x93A9B8));
  pince.position.set(0, 1.08, 0.13);
  planchette.add(pince);
  for (let i = 0; i < 3; i++) {
    const y = 0.42 - i * 0.48;
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.045, 0.04), matMat(PALETTE.vert));
    b1.position.set(-0.47, y - 0.02, 0.14); b1.rotation.z = 0.9;
    planchette.add(b1);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.045, 0.04), matMat(PALETTE.vert));
    b2.position.set(-0.4, y + 0.03, 0.14); b2.rotation.z = -0.65;
    planchette.add(b2);
    const ligne = new THREE.Mesh(new THREE.BoxGeometry(0.82 - i * 0.1, 0.075, 0.03), matMat(0xC3D5E2));
    ligne.position.set(0.16 - i * 0.05, y, 0.14);
    planchette.add(ligne);
  }
  planchette.position.set(-3.5, 0, 0);
  planchette.rotation.set(-0.08, 0.42, 0.05);
  g.add(planchette);

  // erlenmeyer : chimie organique et thérapeutique
  const fiole = erlenmeyer(1.5, 0.62, PALETTE.tealClair);
  fiole.position.set(-1.35, -0.85, 0);
  g.add(fiole);

  // gélule : pharmacologie
  const gelule = new THREE.Group();
  const corpsG = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.62, 28), matMat(PALETTE.ambre));
  gelule.add(corpsG);
  const capA = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    matMat(0xF0F6FA));
  capA.position.y = 0.31;
  gelule.add(capA);
  const capB = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    matMat(PALETTE.ambre));
  capB.position.y = -0.31;
  gelule.add(capB);
  gelule.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  gelule.position.set(0.5, -0.1, 0.2);
  gelule.rotation.set(0.2, 0, -0.6);
  g.add(gelule);

  // molécule : propriétés physico-chimiques
  const mol = molecule(ACIDE_SALICYLIQUE, { echelle: 1, sansH: true, facteurRayon: 1.05 });
  mol.scale.setScalar(0.3);
  mol.position.set(2.3, 0.05, 0);
  mol.rotation.set(0.3, 0.5, 0.1);
  g.add(mol);

  // écran : ressources numériques
  const poste = new THREE.Group();
  const dalle = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.15, 0.1), matMat(0x1C4257));
  dalle.castShadow = true;
  poste.add(dalle);
  const image = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95),
    new THREE.MeshBasicMaterial({ color: 0x0E3346 }));
  image.position.z = 0.06;
  poste.add(image);
  [0, 1, 2].forEach(function (k) {
    const barre = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28 + k * 0.22, 0.02),
      new THREE.MeshBasicMaterial({ color: [PALETTE.tealClair, PALETTE.violet, PALETTE.ambre][k] }));
    barre.position.set(-0.35 + k * 0.35, -0.3 + (0.28 + k * 0.22) / 2, 0.07);
    poste.add(barre);
  });
  const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.42, 14), matMetal(0x2A4A5E));
  pied.position.y = -0.78;
  poste.add(pied);
  poste.position.set(4.3, 0.15, 0);
  poste.rotation.set(-0.06, -0.34, 0);
  g.add(poste);

  g.rotation.set(-0.1, 0.06, 0);
  scene.add(g);
  const cam = new THREE.PerspectiveCamera(26, L / H, 0.1, 60);
  cam.position.set(0.4, 0.95, 7.1);
  cam.lookAt(0.4, -0.15, 0);
  return cam;
};

/* Stations : quatre jalons reliés par un parcours. */
SCENES['icone-stations'] = function (scene, renderer, L, H) {
  bancEclairage(scene, { intensite: 1.05 });
  const g = new THREE.Group();
  const couleurs = [PALETTE.teal, PALETTE.violet, PALETTE.ambre, PALETTE.vert];
  const positions = [[-2.4, -0.7], [-0.8, 0.5], [0.8, -0.5], [2.4, 0.7]];
  // ruban du parcours
  const pts = positions.map(function (p) { return new THREE.Vector3(p[0], p[1] * 0.5, 0); });
  const courbe = new THREE.CatmullRomCurve3(pts);
  const ruban = new THREE.Mesh(new THREE.TubeGeometry(courbe, 80, 0.09, 12, false),
    matMat(0x2C5E77));
  ruban.castShadow = true;
  g.add(ruban);
  positions.forEach(function (p, i) {
    const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 32), matMat(couleurs[i]));
    socle.position.set(p[0], p[1] * 0.5, 0);
    socle.rotation.x = Math.PI / 2;
    socle.castShadow = true;
    g.add(socle);
    const bille = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 20), matMat(couleurs[i]));
    bille.position.set(p[0], p[1] * 0.5, 0.36);
    bille.castShadow = true;
    g.add(bille);
    const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 12), matMetal(0xA7BECE));
    tige.position.set(p[0], p[1] * 0.5, 0.18);
    tige.rotation.x = Math.PI / 2;
    g.add(tige);
  });
  g.rotation.set(-0.4, 0.25, 0.04);
  scene.add(g);
  return camIcone(L, H, 9.5, new THREE.Vector3(0, 0, 0), 30);
};

/* Déroulement : un chronomètre et une étoile de points. */
SCENES['icone-deroulement'] = function (scene, renderer, L, H) {
  bancEclairage(scene, { intensite: 1.05 });
  const g = new THREE.Group();
  const boitier = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.42, 64), matMetal(0x24506B));
  boitier.rotation.x = Math.PI / 2;
  boitier.castShadow = true; boitier.receiveShadow = true;
  g.add(boitier);
  const cadran = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 0.06, 64), matMat(0xF3F9FC));
  cadran.rotation.x = Math.PI / 2;
  cadran.position.z = 0.22;
  g.add(cadran);
  // couronne de temps restant
  const couronne = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.1, 14, 64, Math.PI * 1.45),
    matMat(PALETTE.tealClair));
  couronne.position.z = 0.26;
  couronne.rotation.z = Math.PI / 2;
  g.add(couronne);
  // aiguille
  const aiguille = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.05), matMat(PALETTE.rouge));
  aiguille.position.set(0.28, 0.42, 0.3);
  aiguille.rotation.z = -0.62;
  g.add(aiguille);
  const axe = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), matMetal(0x2E5E7A));
  axe.position.z = 0.32;
  g.add(axe);
  // poussoir
  const poussoir = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 20), matMetal(0x93A9B8));
  poussoir.position.set(0, 1.66, 0);
  poussoir.castShadow = true;
  g.add(poussoir);
  // étoile de score
  const etoile = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const branche = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 4), matMat(PALETTE.ambre));
    branche.position.set(Math.sin(i * Math.PI * 2 / 5) * 0.38,
                         Math.cos(i * Math.PI * 2 / 5) * 0.38, 0);
    branche.rotation.z = -i * Math.PI * 2 / 5;
    branche.castShadow = true;
    etoile.add(branche);
  }
  const centre = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), matMat(PALETTE.ambre));
  etoile.add(centre);
  etoile.position.set(2.0, -1.1, 0.5);
  etoile.scale.setScalar(0.9);
  g.add(etoile);
  g.rotation.set(-0.22, 0.3, 0.02);
  scene.add(g);
  return camIcone(L, H, 10.5, new THREE.Vector3(0.4, -0.1, 0), 30);
};

/* Message à retenir : une ampoule dont le filament est une molécule. */
SCENES['icone-message'] = function (scene, renderer, L, H) {
  bancEclairage(scene, { intensite: 1.05 });
  const g = new THREE.Group();
  const bulbe = new THREE.Mesh(new THREE.SphereGeometry(1.35, 48, 36),
    new THREE.MeshStandardMaterial({ color: 0xCFEAF2, metalness: 0.05, roughness: 0.1,
      transparent: true, opacity: 0.38 }));
  bulbe.position.y = 0.75;
  bulbe.castShadow = true;
  g.add(bulbe);
  const collet = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 0.5, 32), matMat(0xE3EEF4));
  collet.position.y = -0.55;
  g.add(collet);
  const culot = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.8, 32), matMetal(0x97A9B6));
  culot.position.y = -1.15;
  culot.castShadow = true;
  g.add(culot);
  for (let i = 0; i < 4; i++) {
    const filet = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.045, 8, 32), matMetal(0x7F929F));
    filet.position.y = -0.92 - i * 0.17;
    filet.rotation.x = Math.PI / 2;
    g.add(filet);
  }
  const culotBas = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), matMetal(0x5E6F7B));
  culotBas.position.y = -1.6;
  g.add(culotBas);
  // filament moléculaire
  const mol = molecule(ACIDE_SALICYLIQUE, { echelle: 1, sansH: true, facteurRayon: 1.0 });
  mol.scale.setScalar(0.24);
  mol.position.set(0, 0.8, 0);
  mol.rotation.set(0.25, 0.6, 0.1);
  g.add(mol);
  // rayonnement
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + 0.2;
    const rayon = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.09),
      new THREE.MeshBasicMaterial({ color: PALETTE.ambre, transparent: true, opacity: 0.7 }));
    rayon.position.set(Math.cos(a) * 1.95, 0.75 + Math.sin(a) * 1.95, 0);
    rayon.rotation.z = -a + Math.PI / 2;
    g.add(rayon);
  }
  g.rotation.set(-0.06, 0.3, 0);
  scene.add(g);
  return camIcone(L, H, 10.5, new THREE.Vector3(0, 0.3, 0), 30);
};

/* Repère d'action : marqueur à cliquer. */
SCENES['icone-action'] = function (scene, renderer, L, H) {
  bancEclairage(scene, { intensite: 1.05 });
  const g = new THREE.Group();
  const goutte = new THREE.Mesh(new THREE.SphereGeometry(1.0, 40, 30), matMat(PALETTE.teal));
  goutte.position.y = 0.55;
  goutte.castShadow = true;
  g.add(goutte);
  const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.72, 1.5, 40), matMat(PALETTE.teal));
  pointe.position.y = -0.62;
  pointe.rotation.x = Math.PI;
  pointe.castShadow = true;
  g.add(pointe);
  const bague = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.1, 14, 40), matMat(0xF3FAFC));
  bague.position.set(0, 0.62, 0.62);
  g.add(bague);
  const noyau = new THREE.Mesh(new THREE.SphereGeometry(0.26, 22, 16), matMat(0xF3FAFC));
  noyau.position.set(0, 0.62, 0.72);
  g.add(noyau);
  // ondes
  [1.35, 1.75].forEach(function (r, i) {
    const onde = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 10, 48),
      new THREE.MeshBasicMaterial({ color: PALETTE.tealClair, transparent: true,
                                    opacity: 0.45 - i * 0.16 }));
    onde.position.y = 0.55;
    g.add(onde);
  });
  g.rotation.set(-0.12, 0.22, 0);
  scene.add(g);
  return camIcone(L, H, 9.0, new THREE.Vector3(0, 0.2, 0), 30);
};
