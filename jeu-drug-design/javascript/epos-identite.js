//
// EPOS — Initiation au Drug Design
// Identité de l'étudiant et choix du personnage.
//
// Ce module insère une étape d'identification entre l'écran d'accueil et
// la première diapositive du parcours : nom de l'étudiant, puis choix du
// personnage. Il ne touche à aucun contenu pédagogique — il retient deux
// informations et fait charger par le moteur le jeu d'images du
// personnage retenu.
//
// L'état est exposé sur window.EPOS pour les étapes suivantes du projet
// (écran final, export des résultats) :
//   EPOS.studentName        nom saisi, espaces de bord retirés
//   EPOS.selectedCharacter  'pharmacien' ou 'pharmacienne'
//

(function () {
  'use strict';

  var CLE = 'epos.identite';
  var HEROS_M = 'images/pharmacien-';
  var HEROS_F = 'images/pharmacienne-';
  var NOM_MAX = 80;

  var PERSONNAGES = [
    { id: 'pharmacien',   libelle: 'Pharmacien',
      image: 'images/choix-pharmacien.png' },
    { id: 'pharmacienne', libelle: 'Pharmacienne',
      image: 'images/choix-pharmacienne.png' }
  ];

  /* =====================================================================
     1. État de la session
     ===================================================================== */

  window.EPOS = window.EPOS || {};
  var etat = window.EPOS;
  if (typeof etat.studentName !== 'string') etat.studentName = '';
  if (typeof etat.selectedCharacter !== 'string') etat.selectedCharacter = '';

  function identiteComplete() {
    return etat.studentName !== '' && etat.selectedCharacter !== '';
  }

  function memoriser() {
    // sessionStorage : l'identité survit à un rechargement de la page,
    // sans persister d'une session de travail à l'autre.
    try {
      window.sessionStorage.setItem(CLE, JSON.stringify({
        studentName: etat.studentName,
        selectedCharacter: etat.selectedCharacter
      }));
    } catch (e) { /* navigation privée, quota : sans conséquence */ }
  }

  function relire() {
    try {
      var brut = window.sessionStorage.getItem(CLE);
      if (!brut) return;
      var o = JSON.parse(brut);
      if (o && typeof o.studentName === 'string') etat.studentName = o.studentName;
      if (o && typeof o.selectedCharacter === 'string') {
        etat.selectedCharacter = o.selectedCharacter;
      }
    } catch (e) { /* donnée illisible : on repart d'une identité vide */ }
  }

  function personnage() {
    for (var i = 0; i < PERSONNAGES.length; i++) {
      if (PERSONNAGES[i].id === etat.selectedCharacter) return PERSONNAGES[i];
    }
    return null;
  }

  /* =====================================================================
     2. Jeu d'images du personnage
     Les diapositives désignent le personnage joué par
     images/pharmacien-*.png. Le moteur change lui-même cette source
     pendant la marche : remplacer les balises après coup ne tiendrait
     pas. On réécrit donc une seule fois le tableau poff[], d'où le
     moteur relit chaque diapositive à chaque navigation.
     ===================================================================== */

  var imagesAppliquees = false;

  function appliquerPersonnage() {
    if (imagesAppliquees) return;
    if (etat.selectedCharacter !== 'pharmacienne') { imagesAppliquees = true; return; }
    if (typeof window.poff === 'undefined' || !window.poff.length) return;
    var touchees = 0;
    for (var i = 0; i < window.poff.length; i++) {
      var d = window.poff[i];
      if (typeof d !== 'string' || d.indexOf(HEROS_M) === -1) continue;
      // « images/pharmacien- » ne peut pas rencontrer
      // « images/pharmacienne-presente.png » : le tiret suit directement
      // « pharmacien », ce qui n'est pas le cas du nom féminin.
      window.poff[i] = d.split(HEROS_M).join(HEROS_F);
      touchees++;
    }
    imagesAppliquees = true;
    if (window.console && window.console.log) {
      window.console.log('EPOS : personnage « ' + etat.selectedCharacter +
        ' » appliqué à ' + touchees + ' diapositive(s).');
    }
    remplacerImagesAffichees();
  }

  // Filet de sécurité : si une diapositive est déjà à l'écran au moment
  // du choix, ses images sont échangées directement.
  function remplacerImagesAffichees() {
    if (etat.selectedCharacter !== 'pharmacienne') return;
    var imgs = document.querySelectorAll('#main img');
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].getAttribute('src') || '';
      if (src.indexOf(HEROS_M) === 0 || src.indexOf('/' + HEROS_M) !== -1) {
        imgs[i].setAttribute('src', src.split(HEROS_M).join(HEROS_F));
      }
    }
  }

  function publierVariablesMoteur() {
    // Le moteur substitue {Variable1}..{Variable9} dans ses messages.
    // Aucune diapositive n'en utilise aujourd'hui : on les renseigne
    // pour que les écrans des phases suivantes puissent s'en servir.
    try {
      window.Variable1 = etat.studentName;
      window.Variable2 = personnage() ? personnage().libelle : '';
    } catch (e) { /* sans conséquence */ }
  }

  /* =====================================================================
     3. Panneau d'identification
     ===================================================================== */

  var panneau = null, suite = null, etape = 1;

  function el(balise, classe, texte) {
    var n = document.createElement(balise);
    if (classe) n.className = classe;
    if (texte !== undefined && texte !== null) {
      n.appendChild(document.createTextNode(texte));
    }
    return n;
  }

  function nomNettoye(brut) {
    // On retire seulement les espaces de bord et on replie les espaces
    // multiples : les lettres accentuées, les traits d'union et les
    // apostrophes d'un nom propre sont conservés tels quels.
    return String(brut || '').replace(/\s+/g, ' ').replace(/^ | $/g, '');
  }

  function construire() {
    if (panneau) return panneau;

    panneau = el('div');
    panneau.id = 'epos-identite';
    panneau.setAttribute('role', 'dialog');
    panneau.setAttribute('aria-modal', 'true');
    panneau.setAttribute('aria-labelledby', 'epos-id-titre');

    var carte = el('div', 'epos-id-carte');
    panneau.appendChild(carte);

    var entete = el('div', 'epos-id-entete');
    entete.appendChild(el('span', 'epos-id-pastille'));
    var titres = el('div', 'epos-id-titres');
    var h = el('p', 'epos-id-titre', 'EPOS');
    h.id = 'epos-id-titre';
    titres.appendChild(h);
    titres.appendChild(el('p', 'epos-id-soustitre', 'Initiation au Drug Design'));
    entete.appendChild(titres);
    carte.appendChild(entete);

    var fil = el('ol', 'epos-id-fil');
    var f1 = el('li', 'epos-id-fil-1', 'Nom de l’étudiant');
    var f2 = el('li', 'epos-id-fil-2', 'Personnage');
    fil.appendChild(f1); fil.appendChild(f2);
    carte.appendChild(fil);

    /* ---- étape 1 : le nom ---- */
    var e1 = el('div', 'epos-id-etape epos-id-etape1');
    var lab = el('label', 'epos-id-label', 'Nom de l’étudiant');
    lab.setAttribute('for', 'epos-id-nom');
    e1.appendChild(lab);
    var champ = el('input', 'epos-id-champ');
    champ.id = 'epos-id-nom';
    champ.type = 'text';
    champ.autocomplete = 'name';
    champ.spellcheck = false;
    champ.maxLength = NOM_MAX;
    champ.setAttribute('aria-describedby', 'epos-id-aide');
    e1.appendChild(champ);
    var aide = el('p', 'epos-id-aide',
      'Votre nom accompagnera votre score à la fin du parcours.');
    aide.id = 'epos-id-aide';
    e1.appendChild(aide);
    var erreur = el('p', 'epos-id-erreur', 'Merci de saisir votre nom pour continuer.');
    erreur.id = 'epos-id-erreur';
    erreur.setAttribute('role', 'alert');
    e1.appendChild(erreur);
    var suivant = el('button', 'epos-id-bouton', 'Continuer');
    suivant.type = 'button';
    e1.appendChild(suivant);
    carte.appendChild(e1);

    /* ---- étape 2 : le personnage ---- */
    var e2 = el('div', 'epos-id-etape epos-id-etape2');
    e2.appendChild(el('p', 'epos-id-label', 'Choisissez votre personnage'));
    var choix = el('div', 'epos-id-choix');
    var boutonsPerso = [];
    PERSONNAGES.forEach(function (p) {
      var b = el('button', 'epos-id-perso');
      b.type = 'button';
      b.setAttribute('data-perso', p.id);
      b.setAttribute('aria-pressed', 'false');
      var vign = el('span', 'epos-id-vignette');
      var im = document.createElement('img');
      im.src = p.image;
      im.alt = '';
      vign.appendChild(im);
      b.appendChild(vign);
      b.appendChild(el('span', 'epos-id-perso-nom', p.libelle));
      b.onclick = function () {
        etat.selectedCharacter = p.id;
        boutonsPerso.forEach(function (autre) {
          var choisi = autre.getAttribute('data-perso') === p.id;
          autre.className = 'epos-id-perso' + (choisi ? ' epos-id-perso-choisi' : '');
          autre.setAttribute('aria-pressed', choisi ? 'true' : 'false');
        });
        demarrer.disabled = false;
      };
      boutonsPerso.push(b);
      choix.appendChild(b);
    });
    e2.appendChild(choix);

    var rappel = el('p', 'epos-id-rappel');
    rappel.id = 'epos-id-rappel';
    e2.appendChild(rappel);

    var demarrer = el('button', 'epos-id-bouton', 'Commencer le parcours');
    demarrer.type = 'button';
    demarrer.disabled = true;
    e2.appendChild(demarrer);

    var retour = el('button', 'epos-id-lien', 'Modifier le nom');
    retour.type = 'button';
    retour.onclick = function () { allerEtape(1); };
    e2.appendChild(retour);
    carte.appendChild(e2);

    /* ---- enchaînement ---- */
    function validerNom() {
      var v = nomNettoye(champ.value);
      champ.value = v;
      if (v === '') {
        panneau.className = panneau.className.replace(/ epos-id-invalide/g, '') +
          ' epos-id-invalide';
        champ.setAttribute('aria-invalid', 'true');
        champ.focus();
        return false;
      }
      panneau.className = panneau.className.replace(/ epos-id-invalide/g, '');
      champ.removeAttribute('aria-invalid');
      etat.studentName = v;
      memoriser();
      return true;
    }

    suivant.onclick = function () { if (validerNom()) allerEtape(2); };
    champ.onkeydown = function (ev) {
      if (ev.keyCode === 13) { ev.preventDefault(); suivant.onclick(); }
    };
    champ.oninput = function () {
      if (nomNettoye(champ.value) !== '') {
        panneau.className = panneau.className.replace(/ epos-id-invalide/g, '');
      }
    };

    demarrer.onclick = function () {
      if (!etat.studentName || !etat.selectedCharacter) return;
      memoriser();
      publierVariablesMoteur();
      appliquerPersonnage();
      var reprise = suite;
      suite = null;
      fermer();
      if (typeof reprise === 'function') reprise();
    };

    panneau.__aller = function (n) {
      etape = n;
      panneau.setAttribute('data-etape', String(n));
      if (n === 1) {
        window.setTimeout(function () { champ.focus(); champ.select(); }, 40);
      } else {
        rappel.textContent = 'Nom retenu : ' + etat.studentName;
        var actuel = etat.selectedCharacter;
        boutonsPerso.forEach(function (b) {
          var choisi = b.getAttribute('data-perso') === actuel;
          b.className = 'epos-id-perso' + (choisi ? ' epos-id-perso-choisi' : '');
          b.setAttribute('aria-pressed', choisi ? 'true' : 'false');
        });
        demarrer.disabled = !actuel;
        window.setTimeout(function () {
          (actuel ? demarrer : boutonsPerso[0]).focus();
        }, 40);
      }
    };
    panneau.__champ = champ;
    return panneau;
  }

  function allerEtape(n) {
    if (panneau && panneau.__aller) panneau.__aller(n);
  }

  function ouvrir(reprise) {
    suite = reprise || null;
    var principal = document.getElementById('main');
    if (!principal) { if (suite) { var s = suite; suite = null; s(); } return; }
    var p = construire();
    if (p.parentNode !== principal) principal.appendChild(p);
    // le moteur dimensionne la scène par la variable `zoom` : le panneau
    // suit la même échelle, sinon il rétrécirait en plein écran
    var z = window.zoom;
    if (typeof z !== 'number' || !isFinite(z) || z <= 0) z = 1;
    p.style.fontSize = (15 * z).toFixed(2) + 'px';
    p.className = 'epos-id-ouvert';
    allerEtape(etat.studentName ? 2 : 1);
  }

  function fermer() {
    if (panneau && panneau.parentNode) panneau.parentNode.removeChild(panneau);
  }

  /* =====================================================================
     4. Garde au démarrage
     Le bouton « Commencer » de l'écran d'accueil appelle loaddata().
     Tant que l'identité n'est pas renseignée, cet appel ouvre le
     panneau ; il est ensuite relayé tel quel. Le moteur lui-même n'est
     pas modifié : sa fonction est seulement enveloppée.
     ===================================================================== */

  function numeroPage(f) {
    var m = /page(\d+)\.xml/.exec(String(f || ''));
    return m ? parseInt(m[1], 10) : -1;
  }

  function installerGarde() {
    if (typeof window.loaddata !== 'function') return false;
    if (window.loaddata.__eposGarde) return true;
    var original = window.loaddata;
    var enveloppe = function (f, d) {
      if (!identiteComplete() && numeroPage(f) > 0) {
        ouvrir(function () { original.call(window, f, d); });
        return false;
      }
      return original.apply(this, arguments);
    };
    enveloppe.__eposGarde = true;
    window.loaddata = enveloppe;
    return true;
  }

  function demarrer() {
    relire();
    if (identiteComplete()) {          // rechargement en cours de session
      publierVariablesMoteur();
      appliquerPersonnage();
    }
    installerGarde();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.setTimeout(demarrer, 0);
  } else {
    window.addEventListener('DOMContentLoaded', demarrer);
  }

  // Petite façade, utile aux tests et aux phases suivantes.
  window.EPOS.ouvrirIdentite = function () { ouvrir(null); };
  window.EPOS.estComplete = identiteComplete;
})();
