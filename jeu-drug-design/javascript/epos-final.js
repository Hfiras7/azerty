//
// EPOS — Initiation au Drug Design
// Écran de résultat.
//
// Ce module met en scène le résultat déjà calculé par le moteur : il ne
// recalcule rien, ne modifie aucune note et ne touche à aucun contenu.
// Il lit le pourcentage que le moteur a établi, en déduit le niveau,
// affiche le nom retenu à la Phase 4, le message correspondant et
// l'illustration du personnage choisi.
//

(function () {
  'use strict';

  var reduitLeMouvement = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =====================================================================
     1. Niveaux de résultat
     Bornes strictes : 100 / 80-99 / 60-79 / 45-59 / moins de 45.
     ===================================================================== */

  var NIVEAUX = {
    '100': {
      titre: 'Résultat exceptionnel',
      texte: 'Vous maîtrisez l’ensemble des notions évaluées, des propriétés ' +
             'physico-chimiques au docking moléculaire, et votre raisonnement ' +
             'scientifique est conduit avec rigueur. Poursuivez sur cette voie.'
    },
    '80': {
      titre: 'Très bonne maîtrise',
      texte: 'Vos connaissances en drug design sont solidement établies et ' +
             'votre démarche est rigoureuse. Quelques notions méritent encore ' +
             'd’être affinées : reprenez-les pour atteindre la maîtrise ' +
             'complète du parcours.'
    },
    '60': {
      titre: 'Maîtrise satisfaisante',
      texte: 'Les bases du drug design sont acquises et votre progression est ' +
             'réelle. Consolidez les notions encore fragiles en reprenant les ' +
             'stations concernées : vos résultats s’en trouveront nettement ' +
             'renforcés.'
    },
    '45': {
      titre: 'Notions en cours d’acquisition',
      texte: 'Les fondamentaux se mettent en place. Reprenez posément les ' +
             'notions abordées dans chaque station, puis refaites le parcours : ' +
             'la progression vient avec la révision.'
    },
    '0': {
      titre: 'Notions à consolider',
      texte: 'Ce parcours vous indique les points à travailler en priorité. ' +
             'Reprenez les notions station par station, à votre rythme : il peut ' +
             'être refait autant de fois que nécessaire.'
    }
  };

  function niveauDuScore(score) {
    if (score >= 100) return '100';
    if (score >= 80) return '80';
    if (score >= 60) return '60';
    if (score >= 45) return '45';
    return '0';
  }

  /* =====================================================================
     2. Lecture du score établi par le moteur
     Le moteur calcule parseInt((N_F / N_T) * 100) et range le résultat
     dans l'objet de la barre finale. On relit cette valeur telle quelle.
     ===================================================================== */

  function objetBarreFinale() {
    var objets = window.CObjets;
    if (!objets || !objets.length) return null;
    for (var i = 0; i < objets.length; i++) {
      if (objets[i] && objets[i].type === 'finalprogressbar') return objets[i];
    }
    return null;
  }

  function scoreMoteur(objet) {
    if (objet && typeof objet.objx === 'number' && !isNaN(objet.objx)) return objet.objx;
    if (typeof window.scormProcessScore === 'number' && !isNaN(window.scormProcessScore)) {
      return window.scormProcessScore;
    }
    try {
      if (window.N_T) {
        var v = parseInt((window.N_F / window.N_T) * 100, 10);
        return isNaN(v) ? 0 : Math.max(0, v);
      }
    } catch (e) { /* rien */ }
    return 0;
  }

  /* =====================================================================
     3. Reprise du parcours
     Le moteur décrit lui-même, dans getXmlInteractions(), l'état qui
     constitue une progression : les réponses mémorisées et une poignée
     d'indicateurs de session. On remet exactement cet ensemble à son
     état de départ, puis on laisse le moteur recalculer. Le nom de
     l'étudiant et le personnage choisi, eux, appartiennent à
     window.EPOS et ne sont pas touchés.
     ===================================================================== */

  var PAGE_DEPART = 'data/page0.xml';

  function reinitialiserProgression() {
    try {
      // réponses mémorisées, d'où découlent le score et tous les bilans
      window.CObjetMems = [];
      window.CObjetMems_count = 0;

      // indicateurs de session listés par le moteur
      window.ViewerAfterBilan = false;
      window.ViewerAfterBilanList = '';
      window.initExam = 0;
      window.actualExamId = -1;
      window.actualExamIdScreen = -1;
      window.lastExamId = 0;
      window.lastAfterExamId = 0;
      window.LUDIlife = 0;
      window.LUDImoney = 0;
      window.LUDIscore = 0;
      window.attemptProcess = 0;
      window.scormProcessScore = 0;

      // totaux dérivés : le moteur les reconstruit, on les remet à zéro
      // pour qu'aucun reste ne s'affiche entre-temps
      window.N_T = 0;
      window.N_F = 0;
      window.remarques = '';
      window.fullBilanResult = '';
      window.BilanXML = '';
      if (typeof window.initializeDomaines === 'function') window.initializeDomaines();

      // le rapport détaillé est reconstruit à chaque bilan : on retire
      // celui de la partie précédente
      var rapport = document.getElementById('bilanresult');
      if (rapport && rapport.parentNode) rapport.parentNode.removeChild(rapport);
      return true;
    } catch (e) {
      return false;
    }
  }

  function recommencer() {
    if (!reinitialiserProgression()) return;
    scoreAffiche = null;
    retirer();
    if (typeof window.loaddata === 'function') {
      window.haveANAvigation = true;
      window.loaddata(PAGE_DEPART, '');
    }
  }

  /* =====================================================================
     4. Mise en scène
     ===================================================================== */

  var panneau = null, scoreAffiche = null, animation = null;

  function el(balise, classe, texte) {
    var n = document.createElement(balise);
    if (classe) n.className = classe;
    if (texte !== undefined && texte !== null) n.appendChild(document.createTextNode(texte));
    return n;
  }

  function personnageChoisi() {
    var e = window.EPOS || {};
    return e.selectedCharacter === 'pharmacienne' ? 'f' : 'h';
  }

  function construire(score) {
    var niveau = niveauDuScore(score);
    var modele = NIVEAUX[niveau];
    var nom = (window.EPOS && window.EPOS.studentName) || '';

    panneau = el('div');
    panneau.id = 'epos-resultat';
    panneau.setAttribute('data-niveau', niveau);

    /* ---- colonne de gauche ---- */
    var gauche = el('div', 'epos-res-gauche');

    if (nom) gauche.appendChild(el('p', 'epos-res-nom', nom));
    gauche.appendChild(el('p', 'epos-res-titre', 'Votre résultat'));

    var carte = el('div', 'epos-res-carte');
    carte.appendChild(el('p', 'epos-res-legende', 'Score total du parcours'));

    var ligne = el('div', 'epos-res-ligne');
    var valeur = el('span', 'epos-res-valeur', '0');
    ligne.appendChild(valeur);
    ligne.appendChild(el('span', 'epos-res-unite', '%'));
    carte.appendChild(ligne);

    var piste = el('div', 'epos-res-piste');
    var jauge = el('div', 'epos-res-jauge');
    piste.appendChild(jauge);
    carte.appendChild(piste);

    carte.appendChild(el('p', 'epos-res-niveau', modele.titre));
    gauche.appendChild(carte);

    gauche.appendChild(el('p', 'epos-res-message', modele.texte));
    panneau.appendChild(gauche);
    // calé sur le panneau, juste au-dessus de l'histogramme du moteur
    panneau.appendChild(el('p', 'epos-res-domaines', 'Résultat par domaine'));

    /* ---- colonne de droite : l'illustration du niveau ---- */
    var droite = el('div', 'epos-res-droite');
    var cadre = el('div', 'epos-res-cadre');
    var image = document.createElement('img');
    image.className = 'epos-res-image';
    image.src = 'images/resultat-' + niveau + '-' + personnageChoisi() + '.jpg';
    image.alt = '';
    cadre.appendChild(image);
    droite.appendChild(cadre);
    panneau.appendChild(droite);

    /* ---- libellés des deux commandes du moteur ---- */
    var detail = el('p', 'epos-res-detail', 'Voir le détail de vos réponses');
    panneau.appendChild(detail);
    var suite = el('p', 'epos-res-suite', 'Continuer');
    panneau.appendChild(suite);

    /* ---- reprise du parcours ---- */
    var reprise = el('button', 'epos-res-reprise', 'Recommencer le parcours');
    reprise.type = 'button';
    panneau.appendChild(reprise);

    // Le voile porte le fond assombri ; la carte blanche est un véritable
    // élément, pour que question, précision et boutons s'empilent dedans.
    var demande = el('div', 'epos-res-demande');
    var carte = el('div', 'epos-res-carte-demande');
    carte.setAttribute('role', 'dialog');
    carte.setAttribute('aria-modal', 'true');
    var question = el('p', 'epos-res-question', 'Voulez-vous recommencer le parcours ?');
    question.id = 'epos-res-question';
    carte.setAttribute('aria-labelledby', 'epos-res-question');
    carte.appendChild(question);
    carte.appendChild(el('p', 'epos-res-precision',
      'Vos réponses et votre score seront remis à zéro. Votre nom et votre ' +
      'personnage sont conservés.'));
    var choix = el('div', 'epos-res-choix');
    var oui = el('button', 'epos-res-oui', 'Oui, recommencer');
    oui.type = 'button';
    var non = el('button', 'epos-res-non', 'Annuler');
    non.type = 'button';
    choix.appendChild(non);
    choix.appendChild(oui);
    carte.appendChild(choix);
    demande.appendChild(carte);
    panneau.appendChild(demande);

    function ouvrirDemande(ouverte) {
      panneau.setAttribute('data-demande', ouverte ? 'oui' : 'non');
      if (ouverte) window.setTimeout(function () { non.focus(); }, 40);
      else window.setTimeout(function () { reprise.focus(); }, 40);
    }
    ouvrirDemande(false);
    reprise.onclick = function () { ouvrirDemande(true); };
    non.onclick = function () { ouvrirDemande(false); };
    oui.onclick = function () { recommencer(); };
    demande.onkeydown = function (ev) {
      if (ev.keyCode === 27) { ouvrirDemande(false); return; }
      // la tabulation reste entre les deux réponses tant que la
      // question est posée : rien d'autre n'est actionnable
      if (ev.keyCode !== 9) return;
      var premier = non, dernier = oui;
      if (ev.shiftKey && document.activeElement === premier) {
        dernier.focus(); ev.preventDefault();
      } else if (!ev.shiftKey && document.activeElement === dernier) {
        premier.focus(); ev.preventDefault();
      }
    };
    // un clic à côté de la carte annule, comme dans tout dialogue simple
    demande.onclick = function (ev) { if (ev.target === demande) ouvrirDemande(false); };

    panneau.__valeur = valeur;
    panneau.__jauge = jauge;
    return panneau;
  }

  // Le score monte progressivement : c'est la mise en valeur demandée,
  // sans effet superflu. La valeur d'arrivée est exactement celle du
  // moteur, quelle que soit la durée de l'animation.
  function animerScore(score) {
    var valeur = panneau.__valeur, jauge = panneau.__jauge;
    if (reduitLeMouvement) {
      valeur.firstChild.nodeValue = String(score);
      jauge.style.width = Math.max(0, Math.min(100, score)) + '%';
      return;
    }
    var duree = 900 + Math.min(score, 100) * 4;
    var depart = null;
    if (animation) window.cancelAnimationFrame(animation);
    function pas(t) {
      if (depart === null) depart = t;
      var k = Math.min(1, (t - depart) / duree);
      var adouci = 1 - Math.pow(1 - k, 3);
      valeur.firstChild.nodeValue = String(Math.round(score * adouci));
      jauge.style.width = (Math.max(0, Math.min(100, score)) * adouci) + '%';
      if (k < 1) { animation = window.requestAnimationFrame(pas); }
      else { valeur.firstChild.nodeValue = String(score); animation = null; }
    }
    animation = window.requestAnimationFrame(pas);
  }

  function taillePanneau() {
    var z = window.zoom;
    if (typeof z !== 'number' || !isFinite(z) || z <= 0) z = 1;
    return (15 * z).toFixed(2) + 'px';
  }

  function retirer() {
    var principal = document.getElementById('main');
    if (principal) {
      principal.className = principal.className
        .replace(/\bepos-final\b/g, '').replace(/\s+/g, ' ').trim();
    }
    if (panneau && panneau.parentNode) panneau.parentNode.removeChild(panneau);
    panneau = null;
    scoreAffiche = null;
    if (animation) { window.cancelAnimationFrame(animation); animation = null; }
  }

  /* Les trois éléments du moteur que l'écran conserve sont repérés une
     fois pour toutes ; la feuille de style les replace dans la
     composition. Ceux qui font double emploi avec le panneau — la
     petite barre de score et la silhouette décorative — sont seulement
     masqués : rien n'est supprimé du moteur. */
  function baliser(principal) {
    function marquer(el, classe) {
      if (!el) return;
      if ((' ' + el.className + ' ').indexOf(' ' + classe + ' ') === -1) {
        el.className = (el.className + ' ' + classe).trim();
      }
    }
    marquer(principal.querySelector('img[src$="images/bilan.png"]'), 'epos-res-bilan');
    marquer(principal.querySelector('button.mat-button, a.mat-button'), 'epos-res-suivant');

    var barre = principal.querySelector('div[id^="RptvertiBar"], div[class^="RptvertiBar"]');
    if (barre) {
      var conteneur = barre.parentNode;
      while (conteneur && conteneur.parentNode !== principal) conteneur = conteneur.parentNode;
      marquer(conteneur, 'epos-res-histo');
    }

    // barre de score du moteur : elle reste en place et continue
    // d'alimenter le suivi SCORM, mais c'est le panneau qui l'affiche
    var imgs = principal.querySelectorAll('img[src$="progress-bar-fond.png"], img[src$="progress-bar-mask.png"]');
    for (var i = 0; i < imgs.length; i++) marquer(imgs[i], 'epos-res-masque');
    marquer(principal.querySelector('div[id^="bloc-progress"]'), 'epos-res-masque');
    var cellule = principal.querySelector('td[id^="table-inner"]');
    if (cellule) {
      var t = cellule.closest ? cellule.closest('table') : null;
      marquer(t, 'epos-res-masque');
    }
    var cellules = principal.querySelectorAll('td.inner');
    for (var k = 0; k < cellules.length; k++) {
      if (/^\s*Score\s*:/.test(cellules[k].textContent || '')) {
        var tb = cellules[k].closest ? cellules[k].closest('table') : null;
        marquer(tb, 'epos-res-masque');
      }
    }
    var silhouettes = principal.querySelectorAll('img[class*="herotarget"]');
    for (var j = 0; j < silhouettes.length; j++) marquer(silhouettes[j], 'epos-res-masque');
  }

  function surveiller() {
    var principal = document.getElementById('main');
    if (!principal) return;
    var objet = objetBarreFinale();
    if (!objet) { if (panneau) retirer(); return; }

    var score = scoreMoteur(objet);
    if (panneau && panneau.parentNode === principal && scoreAffiche === score) {
      panneau.style.fontSize = taillePanneau();
      return;
    }
    if (panneau) retirer();

    scoreAffiche = score;
    baliser(principal);
    var p = construire(score);
    p.style.fontSize = taillePanneau();
    principal.appendChild(p);
    if ((' ' + principal.className + ' ').indexOf(' epos-final ') === -1) {
      principal.className = (principal.className + ' epos-final').trim();
    }
    animerScore(score);
  }

  function demarrer() {
    window.setInterval(surveiller, 400);
    surveiller();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.setTimeout(demarrer, 0);
  } else {
    window.addEventListener('DOMContentLoaded', demarrer);
  }

  // façade de test : niveau attendu pour un score donné
  window.EPOS = window.EPOS || {};
  window.EPOS.niveauDuScore = niveauDuScore;
  window.EPOS.recommencer = recommencer;
})();
