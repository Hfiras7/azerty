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
  scene.fog = new THREE.Fog(new THREE.Color(opts.brouillard || 0x081A2B), 14, 34);
  scene.add(poussiere(300, 14, PALETTE.tealClair, 0.05));
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
    couleur: 0x1B6A83, opacite: 0.74 });
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
    new THREE.Vector3(3.1, 0.95, 1.5)], PALETTE.ambre, 0.045, 9));

  // interactions ligand-cible
  const matInter = new THREE.MeshBasicMaterial({ color: PALETTE.ambre, transparent: true, opacity: 0.9 });
  [[[2.65, 0.45, 1.15], [2.35, -0.25, 0.85]],
   [[3.6, 0.5, 1.1], [3.95, -0.2, 0.8]],
   [[3.1, 0.25, 1.35], [3.1, -0.5, 1.15]]].forEach(function (seg) {
    const a = new THREE.Vector3().fromArray(seg[0]);
    const b = new THREE.Vector3().fromArray(seg[1]);
    const dir = new THREE.Vector3().subVectors(b, a);
    const n = 5;
    for (let i = 0; i < n; i += 2) {
      const p0 = a.clone().add(dir.clone().multiplyScalar(i / n));
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, dir.length() / n, 8), matInter);
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
   Laboratoire de chimie computationnelle — décor de la diapositive
   d'accueil. Remplace la salle isométrique d'origine.

   Contraintes de composition (coordonnées de la diapositive, 960x720) :
     - bulle de dialogue   x 144..444  y 412..562
     - personnage qui parle x 396..553  y 316..532
     - zone d'action        x 535..625  y 201..251
   Le centre-gauche et le bas doivent donc rester dégagés : le décor
   travaille en profondeur, avec la paillasse et les écrans en fond.
   -------------------------------------------------------------------- */
function construireLabo(scene, renderer, L, H) {
  scene.background = cielDegrade({
    haut: '#05121F', milieu: '#0A2438', bas: '#071B2A',
    haloX: 0.52, haloY: 0.28, halo: 'rgba(90,190,215,0.20)',
    halo2: 'rgba(109,95,224,0.12)' });
  scene.fog = new THREE.Fog(new THREE.Color(0x081D2C), 30, 72);

  // éclairage plus contrasté que le banc standard : on veut du volume,
  // pas l'aplat uniforme d'une image de synthèse bon marché
  scene.add(new THREE.HemisphereLight(0x7FA8BF, 0x060F18, 0.30));

  const cle = new THREE.DirectionalLight(0xEAF4FA, 0.8);
  cle.position.set(-9, 12, 9);
  cle.castShadow = true;
  cle.shadow.mapSize.set(2048, 2048);
  cle.shadow.camera.near = 1; cle.shadow.camera.far = 50;
  cle.shadow.camera.left = -20; cle.shadow.camera.right = 20;
  cle.shadow.camera.top = 18; cle.shadow.camera.bottom = -8;
  cle.shadow.bias = -0.0012;
  scene.add(cle);

  // plafonnier : flaque de lumière au-dessus du poste de travail
  const plafonnier = new THREE.SpotLight(0xD8EEF8, 1.25, 40, 0.78, 0.6, 1.5);
  plafonnier.position.set(-2.0, 10.5, 2.5);
  plafonnier.target.position.set(-1.5, 2.4, -5.5);
  plafonnier.castShadow = true;
  plafonnier.shadow.mapSize.set(1024, 1024);
  scene.add(plafonnier);
  scene.add(plafonnier.target);

  // accent turquoise, côté droit, à hauteur de paillasse
  const rasant = new THREE.PointLight(PALETTE.tealClair, 0.85, 18, 2);
  rasant.position.set(8.5, 4.6, -3.5);
  scene.add(rasant);

  const matSol = new THREE.MeshStandardMaterial({
    color: 0x071827, metalness: 0.6, roughness: 0.26 });
  const solLabo = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), matSol);
  solLabo.rotation.x = -Math.PI / 2;
  solLabo.receiveShadow = true;
  scene.add(solLabo);

  // carrelage discret
  const carrelage = new THREE.GridHelper(60, 30, 0x2C5D7C, 0x21485F);
  carrelage.material.transparent = true;
  carrelage.material.opacity = 0.18;
  carrelage.position.y = 0.012;
  scene.add(carrelage);

  const matMur = new THREE.MeshStandardMaterial({
    color: 0x0A2537, metalness: 0.06, roughness: 0.92 });
  const murFond = new THREE.Mesh(new THREE.BoxGeometry(70, 16, 0.4), matMur);
  murFond.position.set(0, 8, -9);
  murFond.receiveShadow = true;
  scene.add(murFond);

  // Pas de mur latéral : vu sous cet angle il n'apparaît que par la
  // tranche, en aplat noir. Le dégradé de fond ferme mieux le cadrage.

  /* ---- porte d'entrée du laboratoire ----
     Elle donne sa logique spatiale à la diapositive d'accueil : le
     pharmacien apparaît devant elle, puis rejoint le poste de travail.
     Placée à gauche, hors de l'emprise de la paillasse. */
  const porte = new THREE.Group();
  const PX = -15.5, PZ = -8.6;

  const chambranle = new THREE.Mesh(new THREE.BoxGeometry(3.5, 5.6, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x0D2B40, metalness: 0.3, roughness: 0.6 }));
  chambranle.position.set(0, 2.8, 0);
  chambranle.castShadow = true; chambranle.receiveShadow = true;
  porte.add(chambranle);

  const vantail = new THREE.Mesh(new THREE.BoxGeometry(2.9, 5.1, 0.16),
    new THREE.MeshStandardMaterial({ color: 0xD3E2EC, metalness: 0.1, roughness: 0.62 }));
  vantail.position.set(0, 2.55, 0.16);
  vantail.castShadow = true;
  porte.add(vantail);

  // hublot vitré, typique d'une porte de laboratoire
  const hublot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.1, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x8FC9DA, metalness: 0.1, roughness: 0.1,
      transparent: true, opacity: 0.55 }));
  hublot.position.set(0, 3.45, 0.24);
  porte.add(hublot);
  const cadreHublot = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.3, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x9FB4C2, metalness: 0.4, roughness: 0.4 }));
  cadreHublot.position.set(0, 3.45, 0.2);
  porte.add(cadreHublot);

  const poignee = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 14),
    new THREE.MeshStandardMaterial({ color: 0x9CB2C0, metalness: 0.75, roughness: 0.28 }));
  poignee.position.set(1.15, 2.4, 0.3);
  poignee.rotation.z = Math.PI / 2;
  porte.add(poignee);

  // plaque de signalisation
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.04),
    new THREE.MeshStandardMaterial({ color: PALETTE.teal, metalness: 0.3, roughness: 0.45 }));
  plaque.position.set(0, 1.5, 0.25);
  porte.add(plaque);

  porte.position.set(PX, 0, PZ);
  porte.rotation.y = 0.06;
  scene.add(porte);

  // filet de lumière au sol devant la porte : indique le point d'entrée
  const seuil = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6),
    new THREE.MeshBasicMaterial({ color: PALETTE.tealClair, transparent: true, opacity: 0.09 }));
  seuil.rotation.x = -Math.PI / 2;
  seuil.position.set(PX, 0.02, PZ + 1.9);
  scene.add(seuil);

  // bandeau lumineux mural
  const bandeau = new THREE.Mesh(new THREE.BoxGeometry(26, 0.16, 0.1),
    new THREE.MeshBasicMaterial({ color: PALETTE.tealClair, transparent: true, opacity: 0.55 }));
  bandeau.position.set(-1, 7.6, -8.75);
  scene.add(bandeau);

  /* ---- paillasse ---- */
  const matPlan = new THREE.MeshStandardMaterial({
    color: 0x0F2C40, metalness: 0.5, roughness: 0.3 });
  const matMeuble = new THREE.MeshStandardMaterial({
    color: 0xA9BECD, metalness: 0.08, roughness: 0.82 });

  const paillasse = new THREE.Group();
  const caisson = new THREE.Mesh(new THREE.BoxGeometry(20, 2.5, 3.0), matMeuble);
  caisson.position.set(0, 1.25, -6.4);
  caisson.castShadow = true; caisson.receiveShadow = true;
  paillasse.add(caisson);
  const plateau = new THREE.Mesh(new THREE.BoxGeometry(20.6, 0.22, 3.4), matPlan);
  plateau.position.set(0, 2.6, -6.4);
  plateau.castShadow = true; plateau.receiveShadow = true;
  paillasse.add(plateau);
  // portes de placard
  for (let i = -4; i <= 4; i++) {
    const porte = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.9, 0.06), new THREE.MeshStandardMaterial({
      color: 0x9BB2C3, metalness: 0.1, roughness: 0.78 }));
    porte.position.set(i * 2.1, 1.3, -4.86);
    paillasse.add(porte);
    const poignee = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x7E97A8, metalness: 0.7, roughness: 0.3 }));
    poignee.position.set(i * 2.1, 2.0, -4.8);
    paillasse.add(poignee);
  }
  scene.add(paillasse);

  /* ---- étagère et flacons ---- */
  const etagere = new THREE.Mesh(new THREE.BoxGeometry(11, 0.16, 1.0), matPlan);
  etagere.position.set(-6.5, 5.6, -8.3);
  etagere.castShadow = true;
  scene.add(etagere);
  const teintes = [PALETTE.tealClair, PALETTE.ambre, PALETTE.vert, PALETTE.violet,
                   PALETTE.teal, 0xE06A70, PALETTE.tealClair, PALETTE.ambre];
  for (let i = 0; i < 12; i++) {
    const h = 0.55 + (i % 3) * 0.22;
    const flacon = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, h, 18),
      new THREE.MeshStandardMaterial({ color: teintes[i % teintes.length],
        metalness: 0.1, roughness: 0.32, transparent: true, opacity: 0.88 }));
    flacon.position.set(-11.2 + i * 0.82, 5.68 + h / 2, -8.3);
    flacon.castShadow = true;
    scene.add(flacon);
    const bouchon = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 12),
      new THREE.MeshStandardMaterial({ color: 0xE9F2F7, roughness: 0.7 }));
    bouchon.position.set(-11.2 + i * 0.82, 5.68 + h + 0.07, -8.3);
    scene.add(bouchon);
  }

  /* ---- poste de travail : deux écrans de modélisation ---- */
  function ecran(x, y, z, l, h, rot, contenu) {
    const g = new THREE.Group();
    const cadre = new THREE.Mesh(new THREE.BoxGeometry(l, h, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x18303F, metalness: 0.55, roughness: 0.3 }));
    cadre.castShadow = true;
    g.add(cadre);
    const dalle = new THREE.Mesh(new THREE.PlaneGeometry(l * 0.94, h * 0.9),
      new THREE.MeshBasicMaterial({ color: contenu === 'sombre' ? 0x0A2233 : 0x0D2C3F }));
    dalle.position.z = 0.065;
    g.add(dalle);
    const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.7, 14),
      new THREE.MeshStandardMaterial({ color: 0x2A4A5E, metalness: 0.6, roughness: 0.35 }));
    pied.position.y = -h / 2 - 0.35;
    g.add(pied);
    const socle = new THREE.Mesh(new THREE.BoxGeometry(l * 0.4, 0.07, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x2A4A5E, metalness: 0.6, roughness: 0.35 }));
    socle.position.y = -h / 2 - 0.7;
    g.add(socle);
    g.position.set(x, y, z);
    g.rotation.y = rot;
    return g;
  }

  const e1 = ecran(-2.6, 4.0, -6.0, 3.6, 2.2, 0.22, 'sombre');
  scene.add(e1);
  const e2 = ecran(1.9, 3.85, -6.2, 3.0, 1.9, -0.26, 'sombre');
  scene.add(e2);

  // molécule affichée à l'écran principal
  const molEcran = molecule(ASPIRINE, { echelle: 1, sansH: true, facteurRayon: 0.9 });
  molEcran.scale.setScalar(0.19);
  molEcran.position.set(-2.6, 4.05, -5.85);
  molEcran.rotation.set(0.3, 0.5, 0.1);
  molEcran.traverse(function (o) { if (o.isMesh) o.castShadow = false; });
  scene.add(molEcran);

  // courbes de résultats sur le second écran
  for (let i = 0; i < 5; i++) {
    const barre = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.25 + Math.abs(Math.sin(i * 1.7)) * 1.0, 0.02),
      new THREE.MeshBasicMaterial({ color: [PALETTE.tealClair, PALETTE.violet, PALETTE.ambre,
                                            PALETTE.vert, PALETTE.teal][i] }));
    const hh = 0.25 + Math.abs(Math.sin(i * 1.7)) * 1.0;
    barre.position.set(1.9 + (i - 2) * 0.32 + 0.07, 3.3 + hh / 2, -6.05);
    barre.rotation.y = -0.26;
    scene.add(barre);
  }

  /* ---- verrerie sur la paillasse ---- */
  const v1 = erlenmeyer(1.5, 0.62, PALETTE.tealClair);
  v1.position.set(-7.4, 2.71, -6.0);
  scene.add(v1);
  const v2 = erlenmeyer(1.1, 0.48, PALETTE.ambre);
  v2.position.set(-6.1, 2.71, -6.3);
  scene.add(v2);
  const portoir = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x1D4463, metalness: 0.5, roughness: 0.38 }));
  portoir.position.set(6.4, 2.78, -6.1);
  portoir.castShadow = true;
  scene.add(portoir);
  [-0.45, 0, 0.45].forEach(function (dx, i) {
    const t = tubeEssai(1.05, 0.15, [PALETTE.vert, PALETTE.violet, PALETTE.teal][i]);
    t.position.set(6.4 + dx, 2.72, -6.1);
    scene.add(t);
  });

  // microscope stylisé
  const micro = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x24455C, metalness: 0.62, roughness: 0.3 }));
  micro.add(base);
  const bras = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x24455C, metalness: 0.62, roughness: 0.3 }));
  bras.position.set(-0.22, 0.6, -0.1);
  bras.rotation.z = 0.16;
  micro.add(bras);
  const tubeOculaire = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.8, 16),
    new THREE.MeshStandardMaterial({ color: 0x2E5871, metalness: 0.68, roughness: 0.26 }));
  tubeOculaire.position.set(0.02, 1.25, 0.05);
  tubeOculaire.rotation.z = -0.32;
  micro.add(tubeOculaire);
  micro.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  micro.position.set(4.1, 2.72, -6.2);
  scene.add(micro);

  // molécule en hologramme au-dessus de la paillasse : rappel du thème
  const holo = molecule(ACIDE_SALICYLIQUE, { echelle: 1, sansH: true, facteurRayon: 1.05 });
  holo.scale.setScalar(0.5);
  holo.position.set(6.9, 5.4, -4.6);
  holo.rotation.set(0.4, -0.5, 0.15);
  scene.add(holo);
  const socleHolo = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 0.04, 40),
    new THREE.MeshBasicMaterial({ color: PALETTE.tealClair, transparent: true, opacity: 0.18 }));
  socleHolo.position.set(6.9, 4.25, -4.6);
  scene.add(socleHolo);

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

/* Plan de station : même laboratoire, cadré plus bas et plus frontalement.
   Le mur dégagé entre les placards et la paillasse accueille les jalons
   numérotés, et le sol occupe le bas de l'image, où marche le personnage. */
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
