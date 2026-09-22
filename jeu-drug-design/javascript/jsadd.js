//
// EPOS — Initiation au Drug Design
// Couche d'ambiance « chimie computationnelle ».
//
// Ce fichier est le point d'extension prévu par Ludiscape : il est chargé
// après le moteur et n'en modifie aucune fonction. Il se contente
// d'ajouter un décor 3D derrière la scène et quelques classes d'habillage.
//

LUDIguid='pxzmzfc36860120241';

(function () {
  'use strict';

  var reduitLeMouvement = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =====================================================================
     1. Décor : molécule d'aspirine et hélice protéique en projection 3D
     ===================================================================== */

  // Aspirine (acide acétylsalicylique) — coordonnées approchées, en ångströms.
  var ASPIRINE = {
    atomes: [
      { e: 'C', p: [ 1.39,  0.00,  0.00] },  // 0  cycle
      { e: 'C', p: [ 0.70,  1.20,  0.00] },  // 1
      { e: 'C', p: [-0.70,  1.20,  0.05] },  // 2
      { e: 'C', p: [-1.39,  0.00,  0.05] },  // 3
      { e: 'C', p: [-0.70, -1.20,  0.02] },  // 4
      { e: 'C', p: [ 0.70, -1.20,  0.00] },  // 5
      { e: 'C', p: [ 2.52, -0.65, -0.12] },  // 6  carboxyle
      { e: 'O', p: [ 3.62, -0.12, -0.35] },  // 7  =O
      { e: 'O', p: [ 2.45, -1.95,  0.10] },  // 8  -OH
      { e: 'O', p: [ 1.35,  2.35,  0.18] },  // 9  ester -O-
      { e: 'C', p: [ 1.66,  3.36, -0.72] },  // 10 carbonyle
      { e: 'O', p: [ 2.36,  3.22, -1.72] },  // 11 =O
      { e: 'C', p: [ 1.06,  4.66, -0.32] },  // 12 méthyle
      { e: 'H', p: [-1.25,  2.14,  0.10] },  // 13 hydrogènes du cycle
      { e: 'H', p: [-2.47,  0.00,  0.09] },  // 14
      { e: 'H', p: [-1.25, -2.14,  0.03] },  // 15
      { e: 'H', p: [ 1.25, -2.14, -0.02] },  // 16
      { e: 'H', p: [ 3.25, -2.40,  0.02] }   // 17 hydroxyle
    ],
    liaisons: [
      [0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],
      [0,6,1],[6,7,2],[6,8,1],[8,17,1],
      [1,9,1],[9,10,1],[10,11,2],[10,12,1],
      [2,13,1],[3,14,1],[4,15,1],[5,16,1]
    ]
  };

  var COULEURS = {
    C: { noyau: '#7E93A8', bord: '#33475C', rayon: 0.50 },
    O: { noyau: '#E8686C', bord: '#8E2226', rayon: 0.47 },
    N: { noyau: '#5FA8F5', bord: '#1B4E8C', rayon: 0.47 },
    H: { noyau: '#E7EFF6', bord: '#93A6B6', rayon: 0.30 }
  };

  // Hélice alpha stylisée : évoque la cible protéique du docking.
  function construireHelice(tours, parPas, rayon, pas) {
    var pts = [], n = tours * parPas;
    for (var i = 0; i < n; i++) {
      var a = (i / parPas) * Math.PI * 2;
      pts.push({
        e: i % 4 === 0 ? 'O' : 'C',
        p: [Math.cos(a) * rayon, (i / parPas) * pas - tours * pas / 2, Math.sin(a) * rayon]
      });
    }
    var liens = [];
    for (var j = 0; j < pts.length - 1; j++) liens.push([j, j + 1, 1]);
    return { atomes: pts, liaisons: liens };
  }

  var HELICE = construireHelice(5, 9, 1.9, 0.62);

  function centre(modele) {
    var s = [0, 0, 0], n = modele.atomes.length;
    modele.atomes.forEach(function (a) { s[0] += a.p[0]; s[1] += a.p[1]; s[2] += a.p[2]; });
    return [s[0] / n, s[1] / n, s[2] / n];
  }

  function rotation(p, ax, ay) {
    var cx = Math.cos(ax), sx = Math.sin(ax),
        cy = Math.cos(ay), sy = Math.sin(ay);
    var y1 = p[1] * cx - p[2] * sx, z1 = p[1] * sx + p[2] * cx;
    var x2 = p[0] * cy + z1 * sy,   z2 = -p[0] * sy + z1 * cy;
    return [x2, y1, z2];
  }

  function dessinerModele(ctx, modele, cfg, t) {
    var c = cfg.centre;
    var ax = cfg.inclinaison + t * cfg.vitesseX;
    var ay = t * cfg.vitesseY;
    var focale = 9.5;

    var projetes = modele.atomes.map(function (a) {
      var r = rotation([a.p[0] - c[0], a.p[1] - c[1], a.p[2] - c[2]], ax, ay);
      var f = focale / (focale + r[2]);
      return {
        e: a.e,
        x: cfg.x + r[0] * cfg.echelle * f,
        y: cfg.y + r[1] * cfg.echelle * f,
        z: r[2],
        f: f
      };
    });

    // rendu du plus lointain au plus proche : c'est ce tri qui donne la
    // sensation de profondeur (les atomes proches masquent les liaisons)
    var elements = [];
    modele.liaisons.forEach(function (l) {
      elements.push({ type: 'l', z: (projetes[l[0]].z + projetes[l[1]].z) / 2,
                      a: projetes[l[0]], b: projetes[l[1]], ordre: l[2] });
    });
    projetes.forEach(function (p) { elements.push({ type: 'a', z: p.z, a: p }); });
    elements.sort(function (u, v) { return v.z - u.z; });

    elements.forEach(function (el) {
      var brume = Math.max(.45, Math.min(1, 1 - (el.z + 4.5) / 14));
      ctx.globalAlpha = cfg.opacite * brume;
      if (el.type === 'l') {
        var ep = Math.max(1, 2.9 * cfg.echelle / 26 * ((el.a.f + el.b.f) / 2));
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(203,224,240,.92)';
        ctx.lineWidth = ep * (el.ordre === 2 ? 1.25 : 1);
        ctx.beginPath();
        ctx.moveTo(el.a.x, el.a.y);
        ctx.lineTo(el.b.x, el.b.y);
        ctx.stroke();
        if (el.ordre === 2) {   // liaison double : filet clair au centre
          ctx.strokeStyle = 'rgba(12,34,54,.55)';
          ctx.lineWidth = Math.max(.6, ep * .34);
          ctx.stroke();
        }
      } else {
        var col = COULEURS[el.a.e] || COULEURS.C;
        var r = col.rayon * cfg.echelle * el.a.f;
        var g = ctx.createRadialGradient(
          el.a.x - r * .38, el.a.y - r * .42, r * .12,
          el.a.x, el.a.y, r);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(.28, col.noyau);
        g.addColorStop(1, col.bord);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(el.a.x, el.a.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  function installerDecor() {
    if (document.getElementById('epos-scene')) return;

    var toile = document.createElement('canvas');
    toile.id = 'epos-scene';
    var voile = document.createElement('div');
    voile.id = 'epos-voile';
    document.body.insertBefore(toile, document.body.firstChild);
    document.body.insertBefore(voile, toile.nextSibling);

    var ctx = toile.getContext('2d');
    if (!ctx) { toile.style.display = 'none'; return; }

    var L = 0, H = 0, dpr = 1;
    function redimensionner() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      L = window.innerWidth; H = window.innerHeight;
      toile.width = Math.round(L * dpr);
      toile.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    redimensionner();
    window.addEventListener('resize', redimensionner);

    var cAspirine = centre(ASPIRINE), cHelice = centre(HELICE);
    var depart = Date.now();

    // points scintillants : « nuage de conformations » très discret
    var poussiere = [];
    for (var i = 0; i < 46; i++) {
      poussiere.push({ x: Math.random(), y: Math.random(),
                       r: .6 + Math.random() * 1.5,
                       p: Math.random() * Math.PI * 2,
                       v: .00035 + Math.random() * .0009 });
    }

    function rendu() {
      var t = reduitLeMouvement ? 0 : (Date.now() - depart) / 1000;
      ctx.clearRect(0, 0, L, H);

      poussiere.forEach(function (d) {
        var y = ((d.y + (reduitLeMouvement ? 0 : t * d.v)) % 1 + 1) % 1;
        ctx.globalAlpha = .12 + .16 * (Math.sin(t * .8 + d.p) * .5 + .5);
        ctx.fillStyle = '#9FD9E6';
        ctx.beginPath();
        ctx.arc(d.x * L, y * H, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      var marge = Math.max(0, (L - 1056) / 2);
      var echelle = Math.max(22, Math.min(46, marge / 5.2));

      dessinerModele(ctx, HELICE, {
        centre: cHelice, x: marge * .5, y: H * .34,
        echelle: echelle * 1.05, opacite: .5,
        inclinaison: .32, vitesseX: .018, vitesseY: .10
      }, t);

      dessinerModele(ctx, ASPIRINE, {
        centre: cAspirine, x: L - marge * .5, y: H * .68,
        echelle: echelle * 1.25, opacite: .58,
        inclinaison: -.42, vitesseX: .026, vitesseY: -.13
      }, t);

      if (!reduitLeMouvement) window.requestAnimationFrame(rendu);
    }

    if (window.requestAnimationFrame) rendu();
    else toile.style.display = 'none';
  }

  /* =====================================================================
     2. Habillage des pages : papier de laboratoire sur les fonds unis
     ===================================================================== */

  function habillerPage() {
    var principal = document.getElementById('main');
    var fond = document.getElementById('colorfond');
    if (!principal) return;
    var image = fond ? (fond.style.backgroundImage || '') : '';
    var uni = image === '' || image.indexOf('fond-white') !== -1;
    principal.className = uni
      ? (principal.className.replace(/\bepos-plain\b/g, '').trim() + ' epos-plain').trim()
      : principal.className.replace(/\bepos-plain\b/g, '').trim();
  }

  // Les chaînes SMILES et les formules gagnent une police technique.
  var MOTIF_SMILES = /^[A-Za-z0-9@+\-\[\]\(\)=#$%\/\\.]{8,}$/;
  function marquerFormules() {
    var cellules = document.querySelectorAll('#main td.inner');
    for (var i = 0; i < cellules.length; i++) {
      var c = cellules[i];
      if (c.getAttribute('data-epos-vu')) continue;
      c.setAttribute('data-epos-vu', '1');
      var texte = (c.textContent || '').trim();
      if (texte && MOTIF_SMILES.test(texte) && /[=()#\[\]]/.test(texte)) {
        c.className += ' epos-mono';
      }
    }
  }

  // Le moteur recopie les propositions du QCM telles qu'elles sont saisies
  // dans l'auteur : l'astérisque qui marque les bonnes réponses n'a pas à
  // apparaître dans le résumé de parcours. Le libellé générique « TCM »
  // est remplacé par un intitulé compréhensible par l'étudiant.
  function nettoyerBilan() {
    var lignes = document.querySelectorAll('.blockbilan li');
    for (var i = 0; i < lignes.length; i++) {
      var li = lignes[i];
      if (li.getAttribute('data-epos-vu')) continue;
      li.setAttribute('data-epos-vu', '1');
      var premier = li.firstChild;
      if (premier && premier.nodeType === 3 && premier.nodeValue.charAt(0) === '*') {
        premier.nodeValue = premier.nodeValue.slice(1);
      }
    }
    var titres = document.querySelectorAll('.questbilan');
    for (var j = 0; j < titres.length; j++) {
      var t = titres[j];
      if (t.getAttribute('data-epos-vu')) continue;
      t.setAttribute('data-epos-vu', '1');
      var dernier = t.lastChild;
      if (dernier && dernier.nodeType === 3 && dernier.nodeValue.trim() === 'TCM') {
        dernier.nodeValue = dernier.nodeValue.replace('TCM', 'Texte à trous');
      }
    }
  }

  /* =====================================================================
     3. Mise en scène des questions
     Le moteur pose chaque bloc en absolu, à des coordonnées fixées par
     l'auteur. On ne déplace rien : on identifie les rôles (énoncé, zone
     de réponses) et on laisse la feuille de style les mettre en valeur.
     ===================================================================== */

  // Rang de chaque question dans sa station, relevé une fois pour toutes
  // sur les fichiers data/page*.xml : [station, rang, total].
  var CARTE_QUESTIONS = {
    7: [1, 1, 6],  8: [1, 2, 6], 10: [1, 3, 6], 11: [1, 4, 6],
    13: [1, 5, 6], 14: [1, 6, 6],
    17: [2, 1, 3], 19: [2, 2, 3], 21: [2, 3, 3],
    24: [3, 1, 4], 26: [3, 2, 4], 28: [3, 3, 4], 29: [3, 4, 4],
    32: [4, 1, 4], 33: [4, 2, 4], 35: [4, 3, 4], 37: [4, 4, 4]
  };

  function pageCourante() {
    var n = window.lastPage0;
    if (typeof n === 'number' && !isNaN(n)) return n;
    var f = window.menu_global || '';
    var m = /page(\d+)\.xml/.exec(f);
    return m ? parseInt(m[1], 10) : -1;
  }

  function ajouterClasse(el, nom) {
    if (!el) return;
    if ((' ' + el.className + ' ').indexOf(' ' + nom + ' ') === -1) {
      el.className = (el.className + ' ' + nom).trim();
    }
  }
  function retirerClasse(el, nom) {
    if (!el) return;
    el.className = el.className.replace(
      new RegExp('\\b' + nom + '\\b', 'g'), '').replace(/\s+/g, ' ').trim();
  }

  // Deux diapositives portent un bloc de texte à trous placé hors de
  // l'écran par l'auteur. Il ne doit pas entrer dans les calculs de mise
  // en page, sans quoi la zone de réponses remonterait au-dessus du
  // cadre et plus aucun énoncé ne serait reconnu.
  function dansLaScene(r) {
    var principal = document.getElementById('main');
    if (!principal) return false;
    var m = principal.getBoundingClientRect();
    return r.width > 0 && r.height > 0 &&
           r.top >= m.top - 2 && r.bottom <= m.bottom + 2 &&
           r.left >= m.left - 2 && r.right <= m.right + 2;
  }

  function celluleTexte(bloc) {
    return bloc.querySelector('td.inner, td[id^="innerbloctext"]');
  }

  // Enveloppe de tous les éléments par lesquels l'étudiant répond.
  function zoneReponses() {
    var sel = '#main table.barBody, #main td.linkddinner,' +
              ' #main select.selecttcm, #main select.reponseholetext';
    var els = document.querySelectorAll(sel), boite = null;
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (!dansLaScene(r)) continue;
      boite = boite
        ? { haut: Math.min(boite.haut, r.top), bas: Math.max(boite.bas, r.bottom),
            gauche: Math.min(boite.gauche, r.left), droite: Math.max(boite.droite, r.right) }
        : { haut: r.top, bas: r.bottom, gauche: r.left, droite: r.right };
    }
    return boite;
  }

  // L'énoncé est le bloc de texte qui précède immédiatement la zone de
  // réponses : c'est la règle qui vaut sur les dix-sept questions du jeu,
  // y compris celles précédées d'une consigne ou d'un tableau de données.
  function marquerEnonce(zone) {
    var blocs = document.querySelectorAll('#main > table');
    var choisi = null, aListe = null, candidats = [];

    for (var i = 0; i < blocs.length; i++) {
      var t = blocs[i];
      if (t.className.indexOf('barBody') !== -1) continue;
      var cellule = celluleTexte(t);
      if (!cellule || !(cellule.textContent || '').trim()) continue;
      var r = t.getBoundingClientRect();
      if (!dansLaScene(r) || r.width < 160) continue;   // étiquettes, blocs hors cadre
      if (t.querySelector('select.selecttcm, select.reponseholetext')) {
        if (!aListe) aListe = cellule;
        continue;
      }
      if (r.bottom > zone.haut + 6) continue;           // pas au-dessus des réponses
      candidats.push({ cellule: cellule, boite: r });
    }
    // L'énoncé est le bloc le plus bas — mais pas une légende de figure.
    // Une légende se reconnaît à ce qu'elle partage sa ligne avec une
    // autre légende, côte à côte ; un énoncé occupe sa ligne seul.
    var tousTextes = [];
    for (var u = 0; u < blocs.length; u++) {
      var cu = celluleTexte(blocs[u]);
      if (!cu || !(cu.textContent || '').trim()) continue;
      var ru = blocs[u].getBoundingClientRect();
      if (dansLaScene(ru)) tousTextes.push(ru);
    }
    function partageSaLigne(r) {
      for (var v = 0; v < tousTextes.length; v++) {
        var o = tousTextes[v];
        if (o === r) continue;
        var chevauche = Math.min(r.bottom, o.bottom) - Math.max(r.top, o.top);
        var cote = o.left >= r.right - 2 || o.right <= r.left + 2;
        if (chevauche > r.height * 0.6 && cote) return true;
      }
      return false;
    }
    var plusBas = -1e9;
    for (var q = 0; q < candidats.length; q++) {
      if (partageSaLigne(candidats[q].boite)) continue;
      if (candidats[q].boite.bottom > plusBas) {
        plusBas = candidats[q].boite.bottom;
        choisi = candidats[q].cellule;
      }
    }
    if (!choisi) {                       // toutes les lignes sont partagées
      for (var w = 0; w < candidats.length; w++) {
        if (candidats[w].boite.bottom > plusBas) {
          plusBas = candidats[w].boite.bottom;
          choisi = candidats[w].cellule;
        }
      }
    }
    // Question à liste déroulante sans phrase d'appel : c'est le bloc
    // qui contient les listes qui porte l'énoncé, donc le cartouche.
    if (!choisi && aListe) choisi = aListe;
    if (choisi) ajouterClasse(choisi, 'epos-enonce');

    // Certaines questions coupent l'énoncé en deux : une phrase au-dessus
    // de l'illustration, une amorce placée à gauche des propositions.
    // Cette amorce reçoit un traitement plus léger, sans cartouche.
    for (var k = 0; k < blocs.length; k++) {
      var b2 = blocs[k];
      if (b2.className.indexOf('barBody') !== -1) continue;
      var c2 = celluleTexte(b2);
      if (!c2 || c2 === choisi || !(c2.textContent || '').trim()) continue;
      var r2 = b2.getBoundingClientRect();
      if (!dansLaScene(r2) || r2.width < 100) continue;
      var memeHauteur = r2.bottom > zone.haut + 6 && r2.top < zone.bas - 6;
      // le bloc peut être large tout en portant un texte court aligné à
      // gauche : c'est son bord gauche qui dit s'il précède les réponses
      if (memeHauteur && r2.left < zone.gauche - 24) ajouterClasse(c2, 'epos-consigne');
    }
  }

  function tailleIndicateur() {
    var z = window.zoom;
    if (typeof z !== 'number' || !isFinite(z) || z <= 0) z = 1;
    return (11.5 * z).toFixed(2) + 'px';
  }

  /* Le minuteur n'est pas à la même hauteur sur toutes les questions :
     là où il remonte, l'indicateur se décale à sa gauche plutôt que de
     le recouvrir. */
  function eviterMinuteur(boite) {
    var principal = document.getElementById('main');
    if (!principal) return;
    boite.style.right = '';               // revenir au placement de la feuille de style
    var minuteur = document.querySelector('#main img[src*="fx/time"]');
    if (!minuteur) return;
    var rb = boite.getBoundingClientRect(), rt = minuteur.getBoundingClientRect();
    if (!rt.width || !rt.height) return;
    var chevauche = !(rb.right <= rt.left || rb.left >= rt.right ||
                      rb.bottom <= rt.top || rb.top >= rt.bottom);
    if (!chevauche) return;
    var rm = principal.getBoundingClientRect();
    boite.style.right = Math.round(rm.right - rt.left + 10) + 'px';
  }

  // Indicateur de progression, posé dans la bande libre du bandeau.
  function indicateurProgression(rang) {
    var principal = document.getElementById('main');
    if (!principal) return;
    var existant = document.getElementById('epos-progression');
    if (!rang) { if (existant) existant.parentNode.removeChild(existant); return; }
    if (existant && existant.getAttribute('data-rang') === rang.join('-')) {
      existant.style.fontSize = tailleIndicateur();
      eviterMinuteur(existant);
      return;
    }
    if (existant) existant.parentNode.removeChild(existant);

    var boite = document.createElement('div');
    boite.id = 'epos-progression';
    boite.setAttribute('data-rang', rang.join('-'));
    var etiquette = document.createElement('span');
    etiquette.className = 'epos-prog-texte';
    etiquette.appendChild(document.createTextNode('Question ' + rang[1] + ' / ' + rang[2]));
    boite.appendChild(etiquette);
    var jalons = document.createElement('span');
    jalons.className = 'epos-prog-jalons';
    for (var i = 1; i <= rang[2]; i++) {
      var j = document.createElement('i');
      j.className = i < rang[1] ? 'fait' : (i === rang[1] ? 'actif' : '');
      jalons.appendChild(j);
    }
    boite.appendChild(jalons);
    // le moteur dimensionne toute la scène par la variable `zoom` :
    // l'indicateur suit la même échelle, sinon il rétrécirait en plein écran
    boite.style.fontSize = tailleIndicateur();
    principal.appendChild(boite);
    eviterMinuteur(boite);
  }

  /* ---- écrans de passage d'une station à l'autre ----
     Le libellé de la station qui s'ouvre est repris mot pour mot du
     bandeau de la diapositive suivante : rien n'est reformulé. */
  var TRANSITIONS = {
    15: 'Détermination des propriétés pharmacocinétiques de l\u2019acide salicylique',
    22: 'Pharmacomodulation de l\u2019aspirine en acétylsalicylate de lysine',
    30: 'Notions de base du docking moléculaire'
  };

  function mettreEnSceneTransition(nom) {
    var principal = document.getElementById('main');
    if (!principal) return;
    var voile = document.getElementById('epos-transition');
    if (!nom) {
      retirerClasse(principal, 'epos-transition');
      if (voile) voile.parentNode.removeChild(voile);
      return;
    }
    ajouterClasse(principal, 'epos-transition');

    // l'énoncé de passage reçoit sa propre mise en scène
    var blocs = document.querySelectorAll('#main > table');
    for (var i = 0; i < blocs.length; i++) {
      var c = blocs[i].querySelector('td.inner');
      if (c && (c.textContent || '').trim()) ajouterClasse(c, 'epos-trans-titre');
    }

    if (voile && voile.getAttribute('data-nom') === nom) {
      voile.style.fontSize = tailleIndicateur();
      return;
    }
    if (voile) voile.parentNode.removeChild(voile);

    voile = document.createElement('div');
    voile.id = 'epos-transition';
    voile.setAttribute('data-nom', nom);
    var sous = document.createElement('div');
    sous.className = 'epos-trans-nom';
    sous.appendChild(document.createTextNode(nom));
    voile.appendChild(sous);
    var action = document.createElement('div');
    action.className = 'epos-trans-action';
    action.appendChild(document.createTextNode('Cliquez pour entrer dans la station'));
    voile.appendChild(action);
    voile.style.fontSize = tailleIndicateur();
    principal.appendChild(voile);
  }

  function mettreEnScene() {
    var principal = document.getElementById('main');
    if (!principal) return;
    mettreEnSceneTransition(TRANSITIONS[pageCourante()] || null);
    var zone = zoneReponses();
    if (!zone) {
      retirerClasse(principal, 'epos-question');
      indicateurProgression(null);
      return;
    }
    ajouterClasse(principal, 'epos-question');
    marquerEnonce(zone);

    // les rangées de réponses ne reçoivent les pastilles de lettre que si
    // le tableau est assez large pour que l'énoncé ne se replie pas
    var tables = document.querySelectorAll('#main table.barBody');
    for (var i = 0; i < tables.length; i++) {
      if (tables[i].offsetWidth >= 640) ajouterClasse(tables[i], 'epos-reponses-larges');
    }
    indicateurProgression(CARTE_QUESTIONS[pageCourante()] || null);
  }

  /* Les illustrations posées à même la diapositive paraissaient
     découpées. On encadre les visuels pleins (captures d'outils,
     schémas, photographies) et on laisse nus les logos détourés : un
     cadre blanc autour d'un logo transparent se verrait comme une
     vignette rapportée. La distinction se lit sur l'alpha des bords. */
  var memoireDetoure = {};

  function estDetoure(im, src) {
    if (memoireDetoure.hasOwnProperty(src)) return memoireDetoure[src];
    var reponse = false;
    try {
      var c = document.createElement('canvas');
      var L = Math.min(im.naturalWidth, 64), H = Math.min(im.naturalHeight, 64);
      c.width = L; c.height = H;
      var ctx = c.getContext('2d');
      ctx.drawImage(im, 0, 0, L, H);
      var d = ctx.getImageData(0, 0, L, H).data;
      var points = [[0, 0], [L - 1, 0], [0, H - 1], [L - 1, H - 1],
                    [(L / 2) | 0, 0], [(L / 2) | 0, H - 1],
                    [0, (H / 2) | 0], [L - 1, (H / 2) | 0]];
      for (var i = 0; i < points.length; i++) {
        var o = (points[i][1] * L + points[i][0]) * 4;
        if (d[o + 3] < 200) { reponse = true; break; }
      }
    } catch (e) { reponse = false; }
    memoireDetoure[src] = reponse;
    return reponse;
  }

  function integrerImages() {
    var images = document.querySelectorAll('#main img');
    for (var i = 0; i < images.length; i++) {
      var im = images[i];
      if (im.getAttribute('data-epos-vu')) continue;
      var src = im.getAttribute('src') || '';
      if (/fx\//.test(src) || im.className.indexOf('cocheimg') !== -1) continue;
      if (!im.complete || !im.naturalWidth) continue;   // on réessaie au tour suivant
      im.setAttribute('data-epos-vu', '1');
      if (im.offsetWidth < 120 || im.offsetHeight < 90) continue;
      if (/pharmacien|icone-|fond-white/.test(src)) continue;
      ajouterClasse(im, estDetoure(im, src) ? 'epos-visuel-detoure' : 'epos-visuel');
    }
  }

  function surveiller() {
    habillerPage();
    marquerFormules();
    nettoyerBilan();
    mettreEnScene();
    integrerImages();
  }

  /* =====================================================================
     4. Enchaînement des diapositives
     Le moteur reconstruit entièrement #main à chaque changement de page.
     On repère cette reconstruction et on relance une courte apparition
     en fondu : le passage d'une diapositive à l'autre devient continu,
     sans solliciter la transition native du moteur.
     ===================================================================== */
  var minuterieEntree = null;

  function jouerEntree(principal) {
    if (reduitLeMouvement) return;
    principal.className = principal.className.replace(/\bepos-entree\b/g, '').trim();
    // forcer un reflux pour que l'animation reparte à zéro
    void principal.offsetWidth;
    principal.className = (principal.className + ' epos-entree').trim();
    if (minuterieEntree) window.clearTimeout(minuterieEntree);
    // la classe reste en place le temps que la dernière animation de la
    // séquence (énoncé, réponses, bouton, indicateur) se termine
    minuterieEntree = window.setTimeout(function () {
      principal.className = principal.className.replace(/\bepos-entree\b/g, '').trim();
    }, 900);
  }

  function demarrer() {
    installerDecor();
    surveiller();
    // le moteur reconstruit #main à chaque diapositive : on se resynchronise
    if (window.MutationObserver) {
      var principal = document.getElementById('main');
      if (principal) {
        new MutationObserver(function (mutations) {
          surveiller();
          // une reconstruction de page ajoute plusieurs éléments d'un coup ;
          // un simple changement d'attribut n'en ajoute aucun
          var reconstruction = mutations.some(function (m) {
            return m.type === 'childList' && m.addedNodes.length >= 3;
          });
          if (reconstruction) jouerEntree(principal);
        }).observe(principal,
          { childList: true, subtree: false, attributes: true, attributeFilter: ['style'] });
      }
    }
    window.setInterval(surveiller, 700);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.setTimeout(demarrer, 0);
  } else {
    window.addEventListener('DOMContentLoaded', demarrer);
  }
})();
