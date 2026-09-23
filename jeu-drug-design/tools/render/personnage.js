/* =====================================================================
   EPOS — pharmacien et pharmacienne 3D
   Personnages stylisés mais anatomiquement cohérents, destinés à
   remplacer l'ouvrier au casque jaune du modèle d'origine. Ils sont
   rendus avec le même banc d'éclairage que les décors, ce qui garantit
   leur cohérence graphique avec le laboratoire.

   Repères : pieds au sol (y ~ 0), sommet du crâne vers y = 2.05.
   Les articulations sont exposées dans userData pour l'animation :
   aucune pièce n'est créée ou détruite d'une image à l'autre, ce qui
   interdit qu'un membre disparaisse au cours du cycle de marche.
   ===================================================================== */

const TEINTES_PERSO = {
  blouse:     0xDCE7F0,
  blouseOmbre:0xB4C5D3,
  chemise:    0x0E7C8C,
  pantalon:   0x23394E,
  chaussure:  0x25313F,
  peau:       0xD09A72,
  cheveux:    0x2B2019,
  badge:      0x22C5D6
};

function mat(couleur, rugosite, metal) {
  return new THREE.MeshStandardMaterial({
    color: couleur,
    roughness: rugosite === undefined ? 0.7 : rugosite,
    metalness: metal === undefined ? 0.04 : metal
  });
}

/* Capsule : three r128 n'a pas CapsuleGeometry, on compose un tronc de
   cône et deux calottes. Le tronc de cône permet de galber un membre. */
function membre(rHaut, rBas, longueur, materiau, segments) {
  const g = new THREE.Group();
  const s = segments || 20;
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(rHaut, rBas, longueur, s), materiau);
  g.add(cyl);
  const haut = new THREE.Mesh(new THREE.SphereGeometry(rHaut, s, 14), materiau);
  haut.position.y = longueur / 2;
  g.add(haut);
  const bas = new THREE.Mesh(new THREE.SphereGeometry(rBas, s, 14), materiau);
  bas.position.y = -longueur / 2;
  g.add(bas);
  g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function capsule(rayon, longueur, materiau, segments) {
  return membre(rayon, rayon, longueur, materiau, segments);
}

function boiteArrondie(l, h, p, rayon, materiau) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, p, 4, 4, 4), materiau);
  const pos = m.geometry.attributes.position;
  const v = new THREE.Vector3();
  const demi = new THREE.Vector3(l / 2 - rayon, h / 2 - rayon, p / 2 - rayon);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const noyau = new THREE.Vector3(
      Math.max(-demi.x, Math.min(demi.x, v.x)),
      Math.max(-demi.y, Math.min(demi.y, v.y)),
      Math.max(-demi.z, Math.min(demi.z, v.z)));
    const d = new THREE.Vector3().subVectors(v, noyau);
    if (d.lengthSq() > 1e-9) { d.setLength(rayon); v.copy(noyau).add(d); }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  m.geometry.computeVertexNormals();
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* Volume elliptique : base des bustes et des bassins. Un tronc de cône
   aplati sur l'axe z donne une section ovale, bien plus proche d'un
   corps qu'une boîte. */
function volumeOvale(rHaut, rBas, hauteur, aplatissement, materiau, segments) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rHaut, rBas, hauteur, segments || 30, 1, false), materiau);
  m.scale.z = aplatissement;
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* ---------------------------------------------------------------------
   Construit le personnage. Renvoie les articulations pour l'animation.
   variante : { feminin, blouse, chemise, pantalon, peau, cheveux }
   --------------------------------------------------------------------- */
function pharmacien(variante) {
  variante = variante || {};
  const feminin = !!variante.feminin;
  const perso = new THREE.Group();
  const matBlouse   = mat(variante.blouse   || TEINTES_PERSO.blouse, 0.66);
  const matOmbre    = mat(TEINTES_PERSO.blouseOmbre, 0.72);
  const matChemise  = mat(variante.chemise  || TEINTES_PERSO.chemise, 0.66);
  const matPantalon = mat(variante.pantalon || TEINTES_PERSO.pantalon, 0.78);
  const matChauss   = mat(TEINTES_PERSO.chaussure, 0.48, 0.12);
  const matPeau     = mat(variante.peau     || TEINTES_PERSO.peau, 0.58);
  const matCheveux  = mat(variante.cheveux  || TEINTES_PERSO.cheveux, 0.62);

  /* ================= bassin et jambes ================= */
  const bassin = new THREE.Group();
  bassin.position.y = 0.92;
  perso.add(bassin);

  const hanches = volumeOvale(0.2, 0.185, 0.26, 0.66, matPantalon);
  bassin.add(hanches);
  // ceinture : sépare nettement le pantalon du buste
  const ceinture = volumeOvale(0.203, 0.203, 0.055, 0.66, mat(0x121D29, 0.5, 0.15));
  ceinture.position.y = 0.11;
  bassin.add(ceinture);

  function jambe(cote) {
    const g = new THREE.Group();
    g.position.set(cote * 0.105, -0.1, 0);

    const cuisse = membre(0.1, 0.082, 0.3, matPantalon);
    cuisse.position.y = -0.2;
    g.add(cuisse);

    const genou = new THREE.Group();
    genou.position.y = -0.4;

    const mollet = membre(0.083, 0.062, 0.3, matPantalon);
    mollet.position.y = -0.2;
    genou.add(mollet);
    // bas de pantalon : un léger revers marque la cassure sur la chaussure
    const revers = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.07, 0.075, 18), matPantalon);
    revers.position.y = -0.345;
    revers.castShadow = true;
    genou.add(revers);

    // chaussure : un seul volume, semelle comprise, pour qu'aucune pièce
    // ne se détache en vue arrière comme le faisait l'ancien talon
    const chaussure = boiteArrondie(0.124, 0.082, 0.24, 0.04, matChauss);
    chaussure.position.set(0, -0.414, 0.042);
    genou.add(chaussure);
    const bout = new THREE.Mesh(new THREE.SphereGeometry(0.062, 20, 14), matChauss);
    bout.position.set(0, -0.404, 0.118);
    bout.scale.set(1.0, 0.85, 0.75);
    bout.castShadow = true;
    genou.add(bout);
    const semelle = boiteArrondie(0.132, 0.028, 0.256, 0.012, mat(0x3A4857, 0.5));
    semelle.position.set(0, -0.455, 0.046);
    genou.add(semelle);

    g.add(genou);
    g.userData.genou = genou;
    bassin.add(g);
    return g;
  }
  const jambeG = jambe(-1), jambeD = jambe(1);

  /* ================= buste ================= */
  const torse = new THREE.Group();
  torse.position.y = 0.16;
  bassin.add(torse);

  // chemise : elle n'apparaît que dans l'ouverture de la blouse
  const chemise = volumeOvale(0.2, 0.19, 0.5, 0.66, matChemise);
  chemise.position.y = 0.3;
  torse.add(chemise);

  // blouse : un seul volume galbé, sans couture visible. L'ancienne
  // version, faite de deux pans et d'une doublure, laissait une encoche
  // sombre au milieu de l'ourlet.
  const largeurEpaule = feminin ? 0.212 : 0.226;
  const blouse = volumeOvale(largeurEpaule, largeurEpaule + 0.016, 0.88, 0.66, matBlouse);
  blouse.position.y = 0.09;
  torse.add(blouse);
  // ourlet légèrement plus sombre : la blouse se détache du pantalon
  const ourlet = new THREE.Mesh(
    new THREE.CylinderGeometry(largeurEpaule + 0.016, largeurEpaule + 0.016, 0.032, 30), matOmbre);
  ourlet.scale.z = 0.66;
  ourlet.position.y = -0.34;
  torse.add(ourlet);

  // haut du buste : la calotte ferme le volume au niveau des épaules
  const epaules = new THREE.Mesh(new THREE.SphereGeometry(largeurEpaule, 30, 20), matBlouse);
  epaules.scale.set(1, 0.52, 0.66);
  epaules.position.y = 0.53;
  epaules.castShadow = true;
  torse.add(epaules);

  // bord d'ouverture de la blouse, du col à l'ourlet
  const ouverture = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.8, 0.02), matOmbre);
  ouverture.position.set(0.012, 0.1, largeurEpaule * 0.66 + 0.004);
  torse.add(ouverture);

  // col et revers
  const col = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.035, 12, 28, Math.PI * 1.25), matBlouse);
  col.position.set(0, 0.55, -0.01);
  col.rotation.set(Math.PI / 2 - 0.25, 0, -Math.PI * 0.62);
  col.scale.z = 0.9;
  col.castShadow = true;
  torse.add(col);
  [-1, 1].forEach(function (cote) {
    const revers = boiteArrondie(0.058, 0.23, 0.04, 0.019, matBlouse);
    revers.position.set(cote * 0.062, 0.36, largeurEpaule * 0.655);
    revers.rotation.set(0.1, cote * 0.3, cote * 0.16);
    torse.add(revers);
  });

  // boutonnage, poche poitrine, stylo, badge
  [0.1, -0.05, -0.2].forEach(function (y) {
    const bouton = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 12),
      mat(0xB9C8D4, 0.45));
    bouton.position.set(0.04, y, largeurEpaule * 0.63);
    bouton.rotation.x = Math.PI / 2;
    torse.add(bouton);
  });
  const poche = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.01), matOmbre);
  poche.position.set(0.14, 0.02, largeurEpaule * 0.635);
  poche.rotation.y = -0.22;
  torse.add(poche);
  const stylo = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.1, 10),
    mat(PALETTE.teal, 0.35, 0.25));
  stylo.position.set(0.168, 0.085, largeurEpaule * 0.63);
  stylo.rotation.z = -0.1;
  torse.add(stylo);
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.048, 0.008),
    mat(TEINTES_PERSO.badge, 0.35, 0.2));
  badge.position.set(-0.135, 0.22, largeurEpaule * 0.635);
  badge.rotation.y = 0.22;
  torse.add(badge);

  /* ================= bras ================= */
  function bras(cote) {
    const g = new THREE.Group();
    g.position.set(cote * (largeurEpaule + 0.054), 0.485, 0.004);

    const epaule = new THREE.Mesh(new THREE.SphereGeometry(0.082, 22, 16), matBlouse);
    epaule.castShadow = true;
    g.add(epaule);

    const haut = membre(0.072, 0.058, 0.26, matBlouse);
    haut.position.y = -0.17;
    g.add(haut);

    const coude = new THREE.Group();
    coude.position.y = -0.31;

    const avant = membre(0.058, 0.048, 0.23, matBlouse);
    avant.position.y = -0.135;
    coude.add(avant);
    const manchette = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.05, 0.045, 18), matOmbre);
    manchette.position.y = -0.248;
    manchette.castShadow = true;
    coude.add(manchette);

    // main : paume, masse des doigts, pouce — plus lisible qu'une boule
    const main = new THREE.Group();
    main.position.y = -0.285;
    const paume = boiteArrondie(0.07, 0.115, 0.05, 0.026, matPeau);
    paume.position.y = -0.058;
    main.add(paume);
    const doigts = boiteArrondie(0.062, 0.062, 0.044, 0.022, matPeau);
    doigts.position.set(0, -0.108, 0.004);
    main.add(doigts);
    const pouce = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 10), matPeau);
    pouce.position.set(cote * -0.032, -0.052, 0.022);
    pouce.scale.set(0.8, 1.4, 0.9);
    pouce.rotation.z = cote * 0.35;
    pouce.castShadow = true;
    main.add(pouce);
    coude.add(main);

    g.add(coude);
    g.userData.coude = coude;
    g.userData.main = main;
    torse.add(g);
    return g;
  }
  const brasG = bras(-1), brasD = bras(1);

  /* ================= cou et tête ================= */
  const cou = new THREE.Group();
  cou.position.y = 0.6;
  torse.add(cou);
  const gorge = membre(0.055, 0.068, 0.12, matPeau, 20);
  gorge.position.y = 0.0;
  cou.add(gorge);

  const tete = new THREE.Group();
  tete.position.y = 0.225;
  cou.add(tete);

  const crane = new THREE.Mesh(new THREE.SphereGeometry(0.152, 38, 28), matPeau);
  crane.scale.set(0.93, 1.07, 0.98);
  crane.castShadow = true; crane.receiveShadow = true;
  tete.add(crane);

  // mâchoire et menton : le visage cesse d'être une simple boule
  const machoire = new THREE.Mesh(new THREE.SphereGeometry(0.108, 24, 18), matPeau);
  machoire.position.set(0, -0.05, 0.02);
  machoire.scale.set(0.9, 0.78, 0.95);
  tete.add(machoire);
  const menton = new THREE.Mesh(new THREE.SphereGeometry(0.044, 18, 14), matPeau);
  menton.position.set(0, -0.098, 0.05);
  menton.scale.set(1.0, 0.75, 0.85);
  tete.add(menton);

  // oreilles
  [-1, 1].forEach(function (cote) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), matPeau);
    o.position.set(cote * 0.142, -0.005, 0.0);
    o.scale.set(0.42, 1.05, 0.85);
    tete.add(o);
  });

  // nez et arête
  const arete = new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 10), matPeau);
  arete.position.set(0, 0.002, 0.1405);
  arete.scale.set(0.62, 1.7, 0.75);
  tete.add(arete);
  const nez = new THREE.Mesh(new THREE.SphereGeometry(0.019, 16, 12), matPeau);
  nez.position.set(0, -0.03, 0.1445);
  nez.scale.set(1.0, 0.8, 0.85);
  tete.add(nez);

  // yeux : légèrement enfoncés dans l'orbite, pour éviter le regard
  // exorbité que donnaient des globes posés sur la surface du crâne
  [-1, 1].forEach(function (cote) {
    const orbite = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12),
      mat(0xD8A47E, 0.65));
    orbite.position.set(cote * 0.057, 0.012, 0.131);
    orbite.scale.set(1, 0.72, 0.4);
    tete.add(orbite);
    const blanc = new THREE.Mesh(new THREE.SphereGeometry(0.0205, 18, 14), mat(0xEDF3F8, 0.45));
    blanc.position.set(cote * 0.056, 0.012, 0.1405);
    blanc.scale.set(1.05, 0.7, 0.34);
    tete.add(blanc);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 14, 12), mat(0x2A4A63, 0.3));
    iris.position.set(cote * 0.058, 0.011, 0.1465);
    iris.scale.set(1, 1, 0.3);
    tete.add(iris);
    const pupille = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 10, 8), mat(0x0B141D, 0.2));
    pupille.position.set(cote * 0.058, 0.011, 0.1485);
    pupille.scale.set(1, 1, 0.4);
    tete.add(pupille);
    // paupière supérieure : un regard sans paupière paraît fixe
    const paupiere = new THREE.Mesh(new THREE.SphereGeometry(0.023, 16, 12), matPeau);
    paupiere.position.set(cote * 0.056, 0.027, 0.139);
    paupiere.scale.set(1.1, 0.5, 0.34);
    tete.add(paupiere);
    const sourcil = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.011, 0.01),
      mat(0x241A14, 0.9));
    sourcil.position.set(cote * 0.057, 0.052, 0.1375);
    sourcil.rotation.z = cote * 0.14;
    tete.add(sourcil);
  });

  // bouche : deux lèvres légèrement décalées
  const bouche = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.009, 0.008), mat(0x9C5F58, 0.6));
  bouche.position.set(0, -0.072, 0.1305);
  tete.add(bouche);

  /* ---- coiffure ---- */
  if (feminin) {
    /* Carre mi-long avec une raie de cote.

       La calotte s'arrete au-dessus des sourcils et bascule vers
       l'arriere : posee plus bas, elle descendait sous la ligne des
       yeux et le visage se reduisait a une fente, comme un masque. Les
       masses laterales passent derriere le plan du visage, de sorte que
       le crane les occulte : elles encadrent la figure au lieu de
       mordre sur les joues. */
    const calotte = new THREE.Mesh(
      new THREE.SphereGeometry(0.165, 36, 26, 0, Math.PI * 2, 0, Math.PI * 0.52), matCheveux);
    calotte.scale.set(0.99, 1.05, 1.02);
    calotte.position.set(0, 0.010, -0.020);
    calotte.rotation.x = -0.46;
    calotte.castShadow = true;
    tete.add(calotte);
    // frange balayee sur le cote, posee sur le haut du front
    const frange = new THREE.Mesh(new THREE.SphereGeometry(0.070, 22, 16), matCheveux);
    frange.position.set(-0.042, 0.077, 0.094);
    frange.scale.set(1.38, 0.38, 0.50);
    frange.rotation.z = 0.30;
    frange.castShadow = true;
    tete.add(frange);
    // masses laterales, en retrait derriere les pommettes
    [-1, 1].forEach(function (cote) {
      const meche = new THREE.Mesh(new THREE.SphereGeometry(0.088, 22, 16), matCheveux);
      meche.position.set(cote * 0.133, -0.070, -0.046);
      meche.scale.set(0.55, 1.70, 0.95);
      meche.castShadow = true;
      tete.add(meche);
    });
    const arriere = new THREE.Mesh(new THREE.SphereGeometry(0.135, 26, 20), matCheveux);
    arriere.position.set(0, -0.092, -0.078);
    arriere.scale.set(1.0, 1.50, 0.86);
    arriere.castShadow = true;
    tete.add(arriere);
  } else {
    // coupe courte : calotte plaquée, nuque dégagée, mèche sur le front
    const calotte = new THREE.Mesh(
      new THREE.SphereGeometry(0.158, 36, 26, 0, Math.PI * 2, 0, Math.PI * 0.5), matCheveux);
    calotte.scale.set(0.97, 1.04, 1.0);
    calotte.position.set(0, 0.016, -0.012);
    calotte.rotation.x = -0.16;
    calotte.castShadow = true;
    tete.add(calotte);
    const meche = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), matCheveux);
    meche.position.set(-0.04, 0.095, 0.092);
    meche.scale.set(1.5, 0.5, 0.65);
    meche.rotation.z = 0.28;
    meche.castShadow = true;
    tete.add(meche);
    const nuque = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), matCheveux);
    nuque.position.set(0, -0.032, -0.088);
    nuque.scale.set(1.15, 0.85, 0.7);
    tete.add(nuque);
  }

  perso.userData = { bassin, torse, tete, cou, jambeG, jambeD, brasG, brasD };
  return perso;
}

/* ---------------------------------------------------------------------
   Pose de marche. phase ∈ [0,1[ ; repos = true pour la pose statique.
   Le cycle est continu : toutes les valeurs sont des fonctions
   sinusoïdales de la phase, donc la dernière image enchaîne sur la
   première sans rupture.
   --------------------------------------------------------------------- */
function poserPharmacien(perso, phase, repos) {
  const u = perso.userData;

  if (repos) {
    u.jambeG.rotation.x = 0.02; u.jambeD.rotation.x = -0.02;
    u.jambeG.rotation.z = 0; u.jambeD.rotation.z = 0;
    u.jambeG.userData.genou.rotation.x = 0.03;
    u.jambeD.userData.genou.rotation.x = 0.03;
    u.brasG.rotation.x = 0.1; u.brasD.rotation.x = -0.08;
    u.brasG.rotation.z = 0.05; u.brasD.rotation.z = -0.05;
    u.brasG.userData.coude.rotation.x = -0.24;
    u.brasD.userData.coude.rotation.x = -0.2;
    u.bassin.position.y = 0.92;
    u.bassin.rotation.z = 0;
    u.torse.rotation.set(0, 0, 0);
    u.tete.rotation.set(0, 0, 0);
    return;
  }

  const a = phase * Math.PI * 2;
  const s = Math.sin(a), c = Math.cos(a);
  const amp = 0.52;                     // amplitude de foulée, volontairement
                                        // modérée : une marche de laboratoire

  u.jambeG.rotation.x =  s * amp;
  u.jambeD.rotation.x = -s * amp;
  u.jambeG.rotation.z = 0; u.jambeD.rotation.z = 0;

  // le genou plie surtout quand la jambe revient vers l'avant
  u.jambeG.userData.genou.rotation.x = 0.05 + Math.max(0, -Math.sin(a - 0.75)) * 0.8;
  u.jambeD.userData.genou.rotation.x = 0.05 + Math.max(0, Math.sin(a - 0.75)) * 0.8;

  // balancier des bras, en opposition de phase avec les jambes
  u.brasG.rotation.x = -s * 0.42;
  u.brasD.rotation.x =  s * 0.42;
  u.brasG.rotation.z = 0.06; u.brasD.rotation.z = -0.06;
  u.brasG.userData.coude.rotation.x = -0.26 - Math.max(0, s) * 0.3;
  u.brasD.userData.coude.rotation.x = -0.26 - Math.max(0, -s) * 0.3;

  // ballant vertical : deux oscillations par cycle, d'amplitude faible
  u.bassin.position.y = 0.92 + Math.abs(c) * 0.03 - 0.015;
  u.bassin.rotation.z = s * 0.025;
  // contre-rotation du buste : la marche cesse d'être raide
  u.torse.rotation.y = s * 0.075;
  u.torse.rotation.z = -s * 0.02;
  u.torse.rotation.x = 0.02;
  // la tête reste stable : elle compense la rotation du buste
  u.tete.rotation.y = -s * 0.04;
  u.tete.rotation.x = Math.abs(c) * 0.015 - 0.008;
}
