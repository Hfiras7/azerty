/* =====================================================================
   EPOS — pharmacien 3D
   Personnage stylisé (volumes simples, matériaux mats) destiné à
   remplacer l'ouvrier au casque jaune. Rendu avec le même banc
   d'éclairage que les autres illustrations, pour rester cohérent.
   ===================================================================== */

const TEINTES_PERSO = {
  blouse:    0xF4F8FB,
  blouseOmbre:0xD9E4EC,
  chemise:   0x0E7C8C,
  pantalon:  0x22374B,
  chaussure: 0x161F29,
  peau:      0xE7B894,
  cheveux:   0x2B2019,
  lunettes:  0x9FD4E2,
  badge:     0x22C5D6
};

function mat(couleur, rugosite, metal) {
  return new THREE.MeshStandardMaterial({
    color: couleur,
    roughness: rugosite === undefined ? 0.72 : rugosite,
    metalness: metal === undefined ? 0.04 : metal
  });
}

// Capsule : three r128 n'a pas CapsuleGeometry, on compose cylindre + calottes.
function capsule(rayon, longueur, materiau, segments) {
  const g = new THREE.Group();
  const s = segments || 20;
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(rayon, rayon, longueur, s), materiau);
  g.add(cyl);
  const haut = new THREE.Mesh(new THREE.SphereGeometry(rayon, s, 14), materiau);
  haut.position.y = longueur / 2;
  g.add(haut);
  const bas = new THREE.Mesh(new THREE.SphereGeometry(rayon, s, 14), materiau);
  bas.position.y = -longueur / 2;
  g.add(bas);
  g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function boiteArrondie(l, h, p, rayon, materiau) {
  // approximation : boîte + arêtes adoucies par une sphère d'échelle
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

/* ---------------------------------------------------------------------
   Construit le pharmacien. Renvoie les articulations pour l'animation.
   --------------------------------------------------------------------- */
function pharmacien(variante) {
  variante = variante || {};
  const feminin = !!variante.feminin;
  const perso = new THREE.Group();
  const matBlouse   = mat(variante.blouse   || TEINTES_PERSO.blouse, 0.78);
  const matChemise  = mat(variante.chemise  || TEINTES_PERSO.chemise, 0.7);
  const matPantalon = mat(variante.pantalon || TEINTES_PERSO.pantalon, 0.8);
  const matChauss   = mat(TEINTES_PERSO.chaussure, 0.55, 0.1);
  const matPeau     = mat(variante.peau     || TEINTES_PERSO.peau, 0.62);
  const matCheveux  = mat(variante.cheveux  || TEINTES_PERSO.cheveux, 0.68);

  /* ---- bassin et jambes ---- */
  const bassin = new THREE.Group();
  bassin.position.y = 0.92;
  perso.add(bassin);

  const hanches = boiteArrondie(0.44, 0.26, 0.28, 0.1, matPantalon);
  bassin.add(hanches);

  function jambe(cote) {
    const g = new THREE.Group();
    g.position.set(cote * 0.13, -0.1, 0);
    const cuisse = capsule(0.095, 0.3, matPantalon);
    cuisse.position.y = -0.2;
    g.add(cuisse);
    const genou = new THREE.Group();
    genou.position.y = -0.4;
    const mollet = capsule(0.085, 0.3, matPantalon);
    mollet.position.y = -0.2;
    genou.add(mollet);
    const pied = boiteArrondie(0.145, 0.075, 0.26, 0.035, matChauss);
    pied.position.set(0, -0.425, 0.055);
    genou.add(pied);
    const empeigne = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 14), matChauss);
    empeigne.position.set(0, -0.395, 0.0);
    empeigne.scale.set(0.95, 0.85, 1.0);
    empeigne.castShadow = true;
    genou.add(empeigne);
    const semelle = boiteArrondie(0.15, 0.028, 0.265, 0.012, mat(0x0D141C, 0.6));
    semelle.position.set(0, -0.455, 0.055);
    genou.add(semelle);
    g.add(genou);
    g.userData.genou = genou;
    bassin.add(g);
    return g;
  }
  const jambeG = jambe(-1), jambeD = jambe(1);

  /* ---- torse ---- */
  const torse = new THREE.Group();
  torse.position.y = 0.16;
  bassin.add(torse);

  // chemise (visible dans l'ouverture de la blouse)
  // col en V de la chemise : visible seulement en haut de la poitrine
  const chemise = boiteArrondie(0.3, 0.3, 0.26, 0.08, matChemise);
  chemise.position.y = 0.4;
  torse.add(chemise);
  const cravate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.02), matChemise);
  cravate.position.set(0, 0.25, 0.145);
  torse.add(cravate);

  // blouse : deux pans légèrement écartés
  [-1, 1].forEach(function (cote) {
    const pan = boiteArrondie(0.27, 0.78, 0.31, 0.09, matBlouse);
    pan.position.set(cote * 0.115, 0.15, 0.005);
    pan.rotation.z = cote * 0.03;
    torse.add(pan);
  });
  // dos de la blouse, pour fermer la silhouette
  const dos = boiteArrondie(0.46, 0.74, 0.16, 0.08, matBlouse);
  dos.position.set(0, 0.17, -0.09);
  torse.add(dos);
  // doublure : sans elle, l'entre-deux des pans laissait voir le pantalon
  // et se lisait comme un trou sombre au niveau des hanches
  const doublure = boiteArrondie(0.3, 0.72, 0.26, 0.07, matBlouse);
  doublure.position.set(0, 0.14, -0.02);
  torse.add(doublure);
  // épaules : adoucissent la jonction bras / torse
  [-1, 1].forEach(function (cote) {
    const epaule = new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 18), matBlouse);
    epaule.position.set(cote * 0.225, 0.46, 0);
    epaule.scale.set(1, 0.95, 1.05);
    epaule.castShadow = true;
    torse.add(epaule);
  });

  // col et revers de blouse
  const col = boiteArrondie(0.32, 0.09, 0.25, 0.042, matBlouse);
  col.position.set(0, 0.52, 0.015);
  torse.add(col);
  [-1, 1].forEach(function (cote) {
    const revers = boiteArrondie(0.1, 0.26, 0.07, 0.03, matBlouse);
    revers.position.set(cote * 0.105, 0.37, 0.145);
    revers.rotation.z = cote * 0.28;
    torse.add(revers);
  });
  // boutonnage
  [0.12, -0.04, -0.2].forEach(function (y) {
    const bouton = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 12),
      mat(0xC9D6DF, 0.5));
    bouton.position.set(0.012, y, 0.162);
    bouton.rotation.x = Math.PI / 2;
    torse.add(bouton);
  });
  // badge
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.055, 0.012),
    mat(TEINTES_PERSO.badge, 0.4, 0.2));
  badge.position.set(-0.17, 0.3, 0.165);
  torse.add(badge);
  // poche
  const poche = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.012),
    mat(TEINTES_PERSO.blouseOmbre, 0.8));
  poche.position.set(0.15, 0.03, 0.163);
  torse.add(poche);
  const stylo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.11, 10),
    mat(PALETTE.teal, 0.4, 0.2));
  stylo.position.set(0.185, 0.1, 0.168);
  torse.add(stylo);

  /* ---- bras ---- */
  function bras(cote) {
    const g = new THREE.Group();
    // `cote` vaut -1 à gauche, +1 à droite
    g.position.set(cote * 0.26, 0.46, 0);
    const haut = capsule(0.072, 0.24, matBlouse);
    haut.position.y = -0.16;
    g.add(haut);
    const coude = new THREE.Group();
    coude.position.y = -0.32;
    const avant = capsule(0.062, 0.2, matBlouse);
    avant.position.y = -0.14;
    coude.add(avant);
    const main = new THREE.Group();
    const paume = new THREE.Mesh(new THREE.SphereGeometry(0.062, 20, 16), matPeau);
    paume.scale.set(0.95, 1.15, 0.7);
    paume.castShadow = true;
    main.add(paume);
    const pouce = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), matPeau);
    pouce.position.set(cote * -0.05, 0.02, 0.02);
    pouce.scale.set(0.8, 1.3, 0.8);
    main.add(pouce);
    // manchette de blouse
    const manchette = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.062, 0.05, 18), matBlouse);
    manchette.position.y = 0.07;
    main.add(manchette);
    main.position.y = -0.3;
    coude.add(main);
    g.add(coude);
    g.userData.coude = coude;
    torse.add(g);
    return g;
  }
  const brasG = bras(-1), brasD = bras(1);

  /* ---- tête ---- */
  const cou = new THREE.Group();
  cou.position.y = 0.58;
  torse.add(cou);
  const gorge = capsule(0.055, 0.06, matPeau);
  gorge.position.y = 0.02;
  cou.add(gorge);

  const tete = new THREE.Group();
  tete.position.y = 0.2;
  cou.add(tete);

  const crane = new THREE.Mesh(new THREE.SphereGeometry(0.162, 36, 26), matPeau);
  crane.scale.set(0.93, 1.06, 0.97);
  crane.castShadow = true;
  tete.add(crane);

  // menton légèrement marqué
  const menton = new THREE.Mesh(new THREE.SphereGeometry(0.093, 20, 16), matPeau);
  menton.position.set(0, -0.082, 0.028);
  menton.scale.set(0.95, 0.72, 0.95);
  tete.add(menton);

  // cheveux : calotte courte, avec une mèche sur le front
  // Coiffure : une calotte légèrement basculée vers l'arrière. Le bord
  // avant passe au-dessus des sourcils, l'arrière descend sur la nuque.
  const cheveux = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, 36, 26, 0, Math.PI * 2, 0, Math.PI * 0.52), matCheveux);
  cheveux.scale.set(0.96, 1.1, 1.0);
  cheveux.position.set(0, 0.012, -0.016);
  cheveux.rotation.x = -0.2;
  cheveux.castShadow = true;
  tete.add(cheveux);

  if (feminin) {
    // chevelure mi-longue : deux masses de part et d'autre du visage
    [-1, 1].forEach(function (cote) {
      const meche = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), matCheveux);
      meche.position.set(cote * 0.126, -0.075, -0.02);
      meche.scale.set(0.62, 1.7, 0.95);
      meche.castShadow = true;
      tete.add(meche);
    });
    const arriere = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 18), matCheveux);
    arriere.position.set(0, -0.11, -0.1);
    arriere.scale.set(1.0, 1.5, 0.75);
    arriere.castShadow = true;
    tete.add(arriere);
  }

  // oreilles
  [-1, 1].forEach(function (cote) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), matPeau);
    o.position.set(cote * 0.15, -0.005, 0.005);
    o.scale.set(0.45, 1, 0.8);
    tete.add(o);
  });

  // nez
  const nez = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 12), matPeau);
  nez.position.set(0, -0.016, 0.147);
  nez.scale.set(0.85, 1.15, 0.9);
  tete.add(nez);

  // yeux : blanc + iris, pour un regard net à petite taille
  [-1, 1].forEach(function (cote) {
    const blanc = new THREE.Mesh(new THREE.SphereGeometry(0.028, 18, 14), mat(0xF7FAFD, 0.35));
    blanc.position.set(cote * 0.062, 0.020, 0.135);
    blanc.scale.set(1, 0.72, 0.5);
    tete.add(blanc);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0175, 14, 12), mat(0x1B2E40, 0.3));
    iris.position.set(cote * 0.062, 0.018, 0.148);
    iris.scale.set(1, 1, 0.45);
    tete.add(iris);
    const sourcil = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.013, 0.014), matCheveux);
    sourcil.position.set(cote * 0.063, 0.061, 0.136);
    sourcil.rotation.z = cote * 0.12;
    tete.add(sourcil);
  });

  // bouche
  const bouche = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.013, 0.012), mat(0xB06A5B, 0.6));
  bouche.position.set(0, -0.072, 0.135);
  tete.add(bouche);

  perso.userData = { bassin, torse, tete, cou, jambeG, jambeD, brasG, brasD };
  return perso;
}

/* ---------------------------------------------------------------------
   Pose de marche. phase ∈ [0,1[ ; repos = true pour la pose statique.
   --------------------------------------------------------------------- */
function poserPharmacien(perso, phase, repos) {
  const u = perso.userData;
  if (repos) {
    u.jambeG.rotation.x = 0.02; u.jambeD.rotation.x = -0.02;
    u.jambeG.userData.genou.rotation.x = 0.02;
    u.jambeD.userData.genou.rotation.x = 0.02;
    u.brasG.rotation.x = 0.12; u.brasD.rotation.x = -0.1;
    u.brasG.rotation.z = 0.09; u.brasD.rotation.z = -0.09;
    u.brasG.userData.coude.rotation.x = -0.28;
    u.brasD.userData.coude.rotation.x = -0.24;
    u.bassin.position.y = 0.92;
    u.torse.rotation.y = 0.0;
    return;
  }
  const a = phase * Math.PI * 2;
  const amp = 0.62;
  u.jambeG.rotation.x =  Math.sin(a) * amp;
  u.jambeD.rotation.x = -Math.sin(a) * amp;
  // le genou ne plie que pendant la phase arrière
  u.jambeG.userData.genou.rotation.x = Math.max(0, -Math.sin(a - 0.9)) * 0.85;
  u.jambeD.userData.genou.rotation.x = Math.max(0, Math.sin(a - 0.9)) * 0.85;

  u.brasG.rotation.x = -Math.sin(a) * 0.5;
  u.brasD.rotation.x =  Math.sin(a) * 0.5;
  u.brasG.rotation.z = 0.1; u.brasD.rotation.z = -0.1;
  u.brasG.userData.coude.rotation.x = -0.3 - Math.max(0, Math.sin(a)) * 0.35;
  u.brasD.userData.coude.rotation.x = -0.3 - Math.max(0, -Math.sin(a)) * 0.35;

  // ballant vertical du bassin, deux fois par cycle
  u.bassin.position.y = 0.92 + Math.abs(Math.cos(a)) * 0.035 - 0.017;
  u.torse.rotation.y = Math.sin(a) * 0.07;
  u.torse.rotation.z = Math.sin(a) * 0.02;
}
