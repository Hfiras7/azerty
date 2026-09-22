//
// EPOS — Initiation au Drug Design
// Enregistrement des résultats dans le classeur d'historique.
//
// Ce module ne calcule rien. Il relit le score que le moteur a établi,
// les scores par station que le moteur a déjà agrégés, et le nom saisi à
// la Phase 4, puis transmet l'ensemble au service local qui tient le
// fichier Excel. Aucune note, aucune pondération, aucune bonne réponse
// n'est touchée.
//
// Le jeu étant une application web, le navigateur ne peut pas écrire
// lui-même dans « C:\Users\Public » : c'est le service local
// tools/serveur-resultats.py qui s'en charge.
//

(function () {
  'use strict';

  var SERVICE = 'http://127.0.0.1:8779';
  var DELAI = 6000;

  // Une partie est identifiée par un jeton : il garantit qu'une même
  // partie ne produit qu'une seule ligne, même si l'écran de résultat
  // est quitté puis réaffiché.
  var partie = null;
  var enregistrees = {};
  var enCours = false;

  function adresseService() {
    try {
      var explicite = window.EPOS_SERVICE_RESULTATS;
      if (typeof explicite === 'string' && explicite) return explicite.replace(/\/$/, '');
      var parametre = /[?&]service=([^&]+)/.exec(window.location.search || '');
      if (parametre) return decodeURIComponent(parametre[1]).replace(/\/$/, '');
    } catch (e) { /* valeur par défaut */ }
    return SERVICE;
  }

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
     2. Transmission au service local
     ===================================================================== */

  function envoyer(charge) {
    return new Promise(function (resoudre) {
      var abandon = null, minuterie = null;
      try {
        if (typeof window.AbortController === 'function') {
          abandon = new window.AbortController();
          minuterie = window.setTimeout(function () { abandon.abort(); }, DELAI);
        }
      } catch (e) { abandon = null; }

      var options = {
        method: 'POST',
        // text/plain évite la requête préalable CORS : le service
        // répond ainsi aussi bien depuis http:// que depuis file://
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(charge)
      };
      if (abandon) options.signal = abandon.signal;

      if (typeof window.fetch !== 'function') {
        resoudre({ ok: false, message: 'Ce navigateur ne permet pas la transmission automatique.' });
        return;
      }
      window.fetch(adresseService() + '/resultat', options).then(function (reponse) {
        return reponse.json().catch(function () { return { ok: reponse.ok }; });
      }).then(function (corps) {
        if (minuterie) window.clearTimeout(minuterie);
        resoudre(corps && corps.ok
          ? { ok: true, fichier: corps.fichier }
          : { ok: false, message: (corps && corps.message) || 'Le classeur n’a pas pu être mis à jour.' });
      }).catch(function () {
        if (minuterie) window.clearTimeout(minuterie);
        resoudre({ ok: false, message: 'Le service d’enregistrement n’est pas accessible.' });
      });
    });
  }

  /* =====================================================================
     3. Information de l'étudiant
     Le score reste visible en toutes circonstances : la zone ci-dessous
     s'ajoute au panneau sans rien lui retirer.
     ===================================================================== */

  function zone() {
    var panneau = document.getElementById('epos-resultat');
    if (!panneau) return null;
    var boite = panneau.querySelector('.epos-res-sauvegarde');
    if (!boite) {
      boite = document.createElement('p');
      boite.className = 'epos-res-sauvegarde';
      boite.setAttribute('role', 'status');
      panneau.appendChild(boite);
    }
    return boite;
  }

  function bouton(libelle, action) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'epos-res-reessayer';
    b.appendChild(document.createTextNode(libelle));
    b.onclick = action;
    return b;
  }

  function fermerAlerte() {
    var panneau = document.getElementById('epos-resultat');
    if (panneau) panneau.setAttribute('data-alerte', 'non');
  }

  /* L'échec mérite mieux qu'une ligne discrète : une alerte centrée, de
     la même facture que la demande de reprise, porte le message et les
     recours. Elle se referme, et la ligne du bas garde la trace de
     l'échec : le résultat n'est jamais perdu en silence. */
  function alerter(message, charge) {
    var panneau = document.getElementById('epos-resultat');
    if (!panneau) return;
    var voile = panneau.querySelector('.epos-res-alerte');
    if (voile) voile.parentNode.removeChild(voile);

    voile = document.createElement('div');
    voile.className = 'epos-res-alerte';
    var carte = document.createElement('div');
    carte.className = 'epos-res-carte-alerte';
    carte.setAttribute('role', 'alertdialog');

    var titre = document.createElement('p');
    titre.className = 'epos-res-alerte-titre';
    titre.appendChild(document.createTextNode(
      'Le résultat a été calculé, mais l’enregistrement automatique ' +
      'n’a pas pu être effectué.'));
    carte.appendChild(titre);

    if (message) {
      var detail = document.createElement('p');
      detail.className = 'epos-res-alerte-detail';
      detail.appendChild(document.createTextNode(message));
      carte.appendChild(detail);
    }

    var choix = document.createElement('div');
    choix.className = 'epos-res-alerte-choix';
    choix.appendChild(bouton('Réessayer', function () {
      fermerAlerte(); lancer(charge, true);
    }));
    choix.appendChild(bouton('Télécharger ce résultat', function () { telecharger(charge); }));
    choix.appendChild(bouton('Fermer', fermerAlerte));
    carte.appendChild(choix);

    voile.appendChild(carte);
    voile.onclick = function (ev) { if (ev.target === voile) fermerAlerte(); };
    voile.onkeydown = function (ev) { if (ev.keyCode === 27) fermerAlerte(); };
    panneau.appendChild(voile);
    panneau.setAttribute('data-alerte', 'oui');
    window.setTimeout(function () {
      var premier = carte.querySelector('button');
      if (premier) premier.focus();
    }, 40);
  }

  function afficher(etat, texte, charge) {
    var boite = zone();
    if (!boite) return;
    while (boite.firstChild) boite.removeChild(boite.firstChild);
    boite.setAttribute('data-etat', etat);
    boite.appendChild(document.createTextNode(texte));
    if (etat !== 'echec') fermerAlerte();
  }

  /* Filet de sécurité : si le service est absent, l'étudiant repart
     malgré tout avec son résultat sous forme de fichier lisible. */
  function telecharger(charge) {
    try {
      var entetes = ['Nom de l\u2019étudiant', 'Date', 'Heure', 'Score total (%)'];
      var valeurs = [charge.nom, new Date().toLocaleDateString('fr-FR'),
                     new Date().toLocaleTimeString('fr-FR'), charge.scoreTotal];
      for (var i = 0; i < charge.stations.length; i++) {
        entetes.push('Station ' + (i + 1) + ' — ' + charge.stations[i].libelle + ' (%)');
        valeurs.push(charge.stations[i].score);
      }
      var csv = '\uFEFF' + [entetes, valeurs].map(function (ligne) {
        return ligne.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(';');
      }).join('\r\n') + '\r\n';
      var lien = document.createElement('a');
      lien.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      lien.download = 'Resultat_' + (charge.nom || 'etudiant').replace(/[^\w\u00C0-\u017F -]/g, '')
        .replace(/\s+/g, '_') + '.csv';
      document.body.appendChild(lien);
      lien.click();
      document.body.removeChild(lien);
      window.setTimeout(function () { URL.revokeObjectURL(lien.href); }, 4000);
    } catch (e) { /* le résultat reste affiché à l'écran */ }
  }

  /* =====================================================================
     4. Déclenchement — une seule fois par partie
     ===================================================================== */

  function lancer(charge, forcer) {
    if (enCours) return;
    if (!forcer && enregistrees[charge.partie]) return;
    enCours = true;
    afficher('attente', 'Enregistrement du résultat…');
    envoyer(charge).then(function (reponse) {
      enCours = false;
      if (reponse.ok) {
        enregistrees[charge.partie] = true;
        afficher('succes', 'Résultat enregistré dans le classeur de la promotion.');
      } else {
        afficher('echec', 'Enregistrement automatique impossible — résultat non consigné.');
        alerter(reponse.message || '', charge);
      }
    });
  }

  /* Le score est définitif dès que le moteur a terminé son calcul, mais
     le panneau se construit par sondage : on laisse la valeur se
     stabiliser avant d'enregistrer, pour n'écrire qu'une ligne. */
  var attente = null, scoreAttendu = null, dernierReleve = null;

  function programmer(scoreTotal) {
    var jeton = partieCourante();
    if (enregistrees[jeton]) {
      // le panneau vient d'être reconstruit (retour depuis le « take home
      // message ») : la partie est déjà consignée, on le redit sans
      // réécrire de ligne
      afficher('succes', 'Résultat enregistré dans le classeur de la promotion.');
      return;
    }
    if (attente && scoreAttendu === scoreTotal) return;
    if (attente) window.clearTimeout(attente);
    scoreAttendu = scoreTotal;
    attente = window.setTimeout(function () {
      attente = null;
      dernierReleve = collecter(scoreTotal);
      lancer(dernierReleve);
    }, 1200);
  }

  /* L'écran de résultat est quitté (« Continuer »). Si l'enregistrement
     n'avait pas encore eu lieu, il part maintenant : les réponses du
     moteur sont toujours en place, et l'étudiant pourrait ne jamais
     revenir sur cet écran. */
  function quitterEcran() {
    if (attente === null) { scoreAttendu = null; return; }
    window.clearTimeout(attente);
    attente = null;
    var score = scoreAttendu;
    scoreAttendu = null;
    if (score === null || enregistrees[partieCourante()]) return;
    dernierReleve = collecter(score);
    lancer(dernierReleve);
  }

  /* Reprise du parcours : la partie qui s'achève doit être enregistrée
     avant que la progression ne soit remise à zéro. Le relevé est fait
     ici, tant que les données du moteur existent encore ; un
     enregistrement resté en échec bénéficie d'une dernière tentative. */
  function cloturer() {
    var jeton = partieCourante();
    quitterEcran();
    if (!enregistrees[jeton] && dernierReleve && dernierReleve.partie === jeton && !enCours) {
      lancer(dernierReleve, true);
    }
    dernierReleve = null;
    nouvellePartie();
  }

  window.EPOS = window.EPOS || {};
  window.EPOS.programmerEnregistrement = programmer;
  window.EPOS.quitterEcranResultat = quitterEcran;
  window.EPOS.cloturerPartie = cloturer;
  window.EPOS.nouvellePartie = nouvellePartie;
  window.EPOS.resultatCourant = collecter;
  nouvellePartie();
})();
