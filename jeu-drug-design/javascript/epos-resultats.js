//
// EPOS — Initiation au Drug Design
// Résultats : relevé de la partie et téléchargement du classeur Excel.
//
// Ce module ne calcule rien. Il relit le score que le moteur a établi,
// les scores par station que le moteur a déjà agrégés, et le nom saisi à
// la Phase 4. Aucune note, aucune pondération, aucune bonne réponse
// n'est touchée.
//
// Le classeur est fabriqué dans le navigateur (epos-xlsx.js) puis
// téléchargé : ni Python, ni serveur, ni réseau. Les parties jouées sur
// le poste sont conservées dans le stockage local, de sorte qu'un seul
// téléchargement en fin de séance rassemble toute la promotion.
//

(function () {
  'use strict';

  var CLE_HISTORIQUE = 'epos.resultats';
  var MAX_PARTIES = 500;

  // Une partie est identifiée par un jeton : il garantit qu'une même
  // partie n'est consignée qu'une fois, même si l'écran de résultat est
  // quitté puis réaffiché.
  var partie = null;
  var consignees = {};

  function nouvellePartie() {
    partie = 'p' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    return partie;
  }

  function partieCourante() {
    return partie || nouvellePartie();
  }

  /* =====================================================================
     1. Lecture des résultats établis par le moteur
     ===================================================================== */

  // domainesliste arrive encodé en entités HTML (mol&eacute;culaire).
  function decoder(texte) {
    var zone = document.createElement('textarea');
    zone.innerHTML = String(texte || '');
    return (zone.value || '').replace(/\s+/g, ' ').replace(/^ | $/g, '');
  }

  function libellesDomaines() {
    var brut = window.domainesliste;
    if (typeof brut !== 'string' || !brut) return [];
    var parts = brut.split('|');
    var libelles = [];
    for (var i = 0; i < parts.length; i++) libelles.push(decoder(parts[i]));
    return libelles;
  }

  /* Ordre des stations.

     Le moteur ne range pas les domaines dans l'ordre du parcours : il les
     numérote dans l'ordre où l'auteur les a déclarés. L'ordre réellement
     joué se retrouve dans les réponses mémorisées, chacune portant son
     domaine et son numéro de diapositive. On classe les domaines sur la
     diapositive médiane de leurs questions : une question isolée posée en
     avance ne déplace pas la station à laquelle elle appartient. */
  function ordreDesStations() {
    var mems = window.CObjetMems;
    if (!mems || !mems.length) return [];
    var pages = {};
    for (var i = 0; i < mems.length; i++) {
      var objet = mems[i];
      if (!objet || !objet.note_T || parseFloat(objet.note_T) === 0) continue;
      var domaine = parseInt(objet.domaine, 10);
      var page = parseInt(objet.numPage, 10);
      if (isNaN(domaine) || isNaN(page)) continue;
      (pages[domaine] = pages[domaine] || []).push(page);
    }
    var domaines = [];
    for (var cle in pages) {
      if (!Object.prototype.hasOwnProperty.call(pages, cle)) continue;
      var liste = pages[cle].sort(function (a, b) { return a - b; });
      domaines.push({ indice: parseInt(cle, 10), mediane: liste[Math.floor(liste.length / 2)] });
    }
    domaines.sort(function (a, b) { return a.mediane - b.mediane || a.indice - b.indice; });
    return domaines;
  }

  /* Score d'une station : exactement l'expression du moteur, appliquée
     aux totaux que le moteur a lui-même agrégés par domaine. */
  function scoreDomaine(indice) {
    var total = window.domainesN_T, obtenu = window.domainesN_F;
    if (!total || !obtenu) return 0;
    var t = parseFloat(total[indice]), f = parseFloat(obtenu[indice]);
    if (!t || isNaN(t) || isNaN(f)) return 0;
    var valeur = parseInt((f / t) * 100, 10);
    return isNaN(valeur) ? 0 : Math.max(0, valeur);
  }

  function stations() {
    var libelles = libellesDomaines();
    var ordre = ordreDesStations();
    var liste = [];
    for (var i = 0; i < ordre.length; i++) {
      liste.push({
        libelle: libelles[ordre[i].indice] || ('Domaine ' + (ordre[i].indice + 1)),
        score: scoreDomaine(ordre[i].indice)
      });
    }
    return liste;
  }

  function collecter(scoreTotal) {
    var identite = window.EPOS || {};
    return {
      nom: identite.studentName || '',
      scoreTotal: scoreTotal,
      stations: stations(),
      partie: partieCourante()
    };
  }

  /* =====================================================================
     2. Historique local des parties
     Sans serveur, le stockage du navigateur est le seul endroit où une
     partie terminée peut survivre à la suivante. Tout est encadré : un
     stockage indisponible ne doit jamais empêcher un téléchargement.
     ===================================================================== */

  function lireHistorique() {
    try {
      var brut = window.localStorage.getItem(CLE_HISTORIQUE);
      var liste = brut ? JSON.parse(brut) : [];
      return Object.prototype.toString.call(liste) === '[object Array]' ? liste : [];
    } catch (e) {
      return [];
    }
  }

  function consigner(releve) {
    var jeton = releve.partie;
    if (consignees[jeton]) return;
    consignees[jeton] = true;
    var d = new Date();
    var ligne = {
      nom: releve.nom, scoreTotal: releve.scoreTotal,
      stations: releve.stations, horodatage: d.getTime(), partie: jeton
    };
    dernierReleve = ligne;
    try {
      var liste = lireHistorique();
      liste.push(ligne);
      if (liste.length > MAX_PARTIES) liste = liste.slice(liste.length - MAX_PARTIES);
      window.localStorage.setItem(CLE_HISTORIQUE, JSON.stringify(liste));
    } catch (e) {
      // stockage refusé (navigation privée, quota) : la partie en cours
      // reste téléchargeable, seul l'historique est perdu
    }
  }

  /* =====================================================================
     3. Fabrication et téléchargement du classeur
     ===================================================================== */

  var COLONNES_FIXES = [
    { titre: 'Nom de l’étudiant', cle: 'texte', largeur: 28 },
    { titre: 'Date', cle: 'date', largeur: 12 },
    { titre: 'Heure', cle: 'heure', largeur: 10 },
    { titre: 'Score total (%)', cle: 'entier', largeur: 15 }
  ];

  /* Les colonnes de station suivent le nombre de stations réellement
     jouées ; si plusieurs parties n'en ont pas le même nombre, on retient
     le maximum et les cases absentes restent vides. */
  function colonnes(parties) {
    var X = window.EPOS.xlsx;
    var cols = [];
    for (var i = 0; i < COLONNES_FIXES.length; i++) {
      cols.push({ titre: COLONNES_FIXES[i].titre, type: X[COLONNES_FIXES[i].cle.toUpperCase()],
                  largeur: COLONNES_FIXES[i].largeur });
    }
    var libelles = [];
    for (var j = 0; j < parties.length; j++) {
      var st = parties[j].stations || [];
      for (var k = 0; k < st.length; k++) {
        if (!libelles[k] && st[k].libelle) libelles[k] = st[k].libelle;
      }
      while (libelles.length < st.length) libelles.push('');
    }
    for (var n = 0; n < libelles.length; n++) {
      cols.push({ titre: 'Station ' + (n + 1) + (libelles[n] ? ' — ' + libelles[n] : '') + ' (%)',
                  type: X.ENTIER, largeur: 22 });
    }
    return cols;
  }

  function lignes(parties, nbColonnes) {
    var out = [];
    for (var i = 0; i < parties.length; i++) {
      var p = parties[i];
      var d = new Date(p.horodatage || Date.now());
      var ligne = [p.nom || 'Étudiant sans nom', d, d, parseInt(p.scoreTotal, 10) || 0];
      var st = p.stations || [];
      for (var j = 0; j < st.length; j++) ligne.push(parseInt(st[j].score, 10) || 0);
      while (ligne.length < nbColonnes) ligne.push('');
      out.push(ligne);
    }
    return out;
  }

  function nomFichier(nom) {
    var d = new Date();
    function n2(v) { return (v < 10 ? '0' : '') + v; }
    var horodatage = d.getFullYear() + n2(d.getMonth() + 1) + n2(d.getDate()) +
                     '-' + n2(d.getHours()) + n2(d.getMinutes());
    // Le nom de fichier reste en ASCII : le navigateur abandonne le nom
    // demandé et enregistre un fichier « download » sans extension dès
    // qu'il contient des caractères accentués.
    var brut = String(nom || 'Etudiant');
    try {
      if (String.prototype.normalize) {
        brut = brut.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }
    } catch (e) { /* le repli ci-dessous suffit */ }
    var propre = brut
      .replace(/[^0-9A-Za-z]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Etudiant';
    return 'Resultats_Jeu_Pharmacie_' + propre.slice(0, 40) + '_' + horodatage + '.xlsx';
  }

  function enregistrerFichier(blob, nom) {
    // Internet Explorer et les anciens Edge passent par msSaveBlob
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, nom);
      return;
    }
    var url = URL.createObjectURL(blob);
    var lien = document.createElement('a');
    lien.href = url;
    lien.download = nom;
    lien.setAttribute('type', blob.type);
    lien.style.display = 'none';
    document.body.appendChild(lien);
    lien.click();
    // Le lien n'est retiré qu'ensuite : supprimé dans la foulée du clic,
    // le navigateur perd parfois le nom demandé et enregistre un fichier
    // « download » sans extension.
    window.setTimeout(function () {
      if (lien.parentNode) lien.parentNode.removeChild(lien);
      URL.revokeObjectURL(url);
    }, 10000);
  }

  function telecharger() {
    try {
      var parties = lireHistorique();
      // une partie non consignée (stockage refusé) reste téléchargeable
      if (dernierReleve) {
        var presente = false;
        for (var i = 0; i < parties.length; i++) {
          if (parties[i].partie === dernierReleve.partie) { presente = true; break; }
        }
        if (!presente) parties = parties.concat([dernierReleve]);
      }
      if (!parties.length) {
        afficher('echec', 'Aucun résultat à télécharger pour le moment.');
        return false;
      }
      var cols = colonnes(parties);
      var blob = window.EPOS.xlsx.creer(cols, lignes(parties, cols.length));
      enregistrerFichier(blob, nomFichier(dernierReleve ? dernierReleve.nom :
        parties[parties.length - 1].nom));
      afficher('succes', parties.length > 1
        ? 'Résultats téléchargés avec succès (' + parties.length + ' parties).'
        : 'Résultats téléchargés avec succès.');
      return true;
    } catch (e) {
      afficher('echec', 'Impossible de télécharger les résultats. Veuillez réessayer.');
      return false;
    }
  }

  /* =====================================================================
     4. Commande et message sur l'écran de résultat
     Le score reste visible en toutes circonstances : ce qui suit s'ajoute
     au panneau sans rien lui retirer.
     ===================================================================== */

  var dernierReleve = null;

  function panneauResultat() {
    return document.getElementById('epos-resultat');
  }

  function installer() {
    var panneau = panneauResultat();
    if (!panneau || panneau.querySelector('.epos-res-telecharger')) return;
    var bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'epos-res-telecharger';
    bouton.appendChild(document.createTextNode('Télécharger les résultats'));
    bouton.onclick = telecharger;
    panneau.appendChild(bouton);
  }

  function afficher(etat, texte) {
    var panneau = panneauResultat();
    if (!panneau) return;
    var boite = panneau.querySelector('.epos-res-sauvegarde');
    if (!boite) {
      boite = document.createElement('p');
      boite.className = 'epos-res-sauvegarde';
      boite.setAttribute('role', 'status');
      panneau.appendChild(boite);
    }
    while (boite.firstChild) boite.removeChild(boite.firstChild);
    boite.setAttribute('data-etat', etat);
    boite.appendChild(document.createTextNode(texte));
  }

  /* =====================================================================
     5. Déclenchement â une seule consignation par partie
     ===================================================================== */

  var attente = null, scoreAttendu = null;

  /* Le score est définitif dès que le moteur a terminé son calcul, mais
     le panneau se construit par sondage : on laisse la valeur se
     stabiliser avant de consigner la partie. */
  function programmer(scoreTotal) {
    installer();
    var jeton = partieCourante();
    if (consignees[jeton]) { pret(); return; }
    if (attente && scoreAttendu === scoreTotal) return;
    if (attente) window.clearTimeout(attente);
    scoreAttendu = scoreTotal;
    attente = window.setTimeout(function () {
      attente = null;
      consigner(collecter(scoreTotal));
      pret();
    }, 1200);
  }

  function pret() {
    var n = lireHistorique().length;
    afficher('attente', n > 1
      ? 'Résultat enregistré sur ce poste : ' + n + ' parties prêtes à télécharger.'
      : 'Résultat prêt : téléchargez le fichier Excel.');
  }

  /* L'écran de résultat est quitté : si la partie n'a pas encore été
     consignée, elle l'est maintenant, tant que les réponses du moteur
     sont en place. */
  function quitterEcran() {
    if (attente === null) { scoreAttendu = null; return; }
    window.clearTimeout(attente);
    attente = null;
    var score = scoreAttendu;
    scoreAttendu = null;
    if (score !== null && !consignees[partieCourante()]) consigner(collecter(score));
  }

  /* Reprise du parcours : la partie qui s'achève est consignée avant la
     remise à zéro, puis un nouveau jeton ouvre la partie suivante. */
  function cloturer() {
    quitterEcran();
    nouvellePartie();
  }

  window.EPOS = window.EPOS || {};
  window.EPOS.programmerEnregistrement = programmer;
  window.EPOS.quitterEcranResultat = quitterEcran;
  window.EPOS.cloturerPartie = cloturer;
  window.EPOS.nouvellePartie = nouvellePartie;
  window.EPOS.resultatCourant = collecter;
  window.EPOS.telechargerResultats = telecharger;
  nouvellePartie();
})();
