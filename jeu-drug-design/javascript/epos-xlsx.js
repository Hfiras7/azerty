//
// EPOS — Initiation au Drug Design
// Génération d'un classeur .xlsx dans le navigateur, sans bibliothèque
// externe et sans réseau.
//
// Un .xlsx est une archive ZIP de fichiers XML. Les pièces nécessaires
// ici — une feuille, une ligne d'en-tête, des cellules texte, entières,
// date et heure — tiennent en quelques centaines de lignes. Les entrées
// sont stockées sans compression : les fichiers font quelques kilo-octets,
// et cela évite d'embarquer un compresseur. Excel, LibreOffice Calc et
// Google Sheets ouvrent l'archive telle quelle.
//

(function () {
  'use strict';

  // Excel compte les jours depuis le 30/12/1899 (décalage hérité de
  // Lotus 1-2-3 qu'Excel a conservé).
  var ORIGINE = Date.UTC(1899, 11, 30);

  var TEXTE = 'texte', ENTIER = 'entier', DATE = 'date', HEURE = 'heure';
  // index des styles déclarés dans styles.xml
  var STYLE = { texte: 0, date: 1, heure: 2, entier: 3 };
  var STYLE_ENTETE = 4;

  function serieDate(d) {
    var jour = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((jour - ORIGINE) / 86400000);
  }

  function serieHeure(d) {
    return (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
  }

  function colonneEnLettres(index) {
    var lettres = '';
    index += 1;
    while (index > 0) {
      var reste = (index - 1) % 26;
      lettres = String.fromCharCode(65 + reste) + lettres;
      index = (index - 1 - reste) / 26;
    }
    return lettres;
  }

  function echapper(v) {
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ===================================================================
     1. Pièces XML du classeur
     =================================================================== */

  var CONTENT_TYPES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    '</Types>';

  var RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  var RELS_CLASSEUR =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '</Relationships>';

  // cellXfs : 0 texte, 1 date, 2 heure, 3 entier, 4 en-tête
  var STYLES =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="2">' +
    '<numFmt numFmtId="164" formatCode="dd/mm/yyyy"/>' +
    '<numFmt numFmtId="165" formatCode="hh:mm:ss"/>' +
    '</numFmts>' +
    '<fonts count="2">' +
    '<font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
    '</fonts>' +
    '<fills count="3">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FF02515E"/><bgColor indexed="64"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="5">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">' +
    '<alignment vertical="center" wrapText="1"/></xf>' +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';

  function classeurXml(nomFeuille) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="' + echapper(nomFeuille) + '" sheetId="1" r:id="rId1"/></sheets>' +
      '</workbook>';
  }

  function cellule(reference, valeur, typeColonne) {
    if (valeur === null || valeur === undefined || valeur === '') return '';
    if (valeur instanceof Date) {
      var s = typeColonne === HEURE ? serieHeure(valeur) : serieDate(valeur);
      return '<c r="' + reference + '" s="' + (STYLE[typeColonne] || 0) + '"><v>' + s + '</v></c>';
    }
    if (typeof valeur === 'number' && isFinite(valeur)) {
      return '<c r="' + reference + '" s="' + (STYLE[typeColonne] || 0) + '"><v>' + valeur + '</v></c>';
    }
    // une valeur textuelle reste du texte, quel que soit le type déclaré
    return '<c r="' + reference + '" t="inlineStr"><is><t xml:space="preserve">' +
      echapper(valeur) + '</t></is></c>';
  }

  function feuilleXml(colonnes, lignes) {
    var nb = colonnes.length, m = [], i, j;
    var derniere = colonneEnLettres(nb - 1);
    m.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
    m.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">');
    m.push('<dimension ref="A1:' + derniere + (lignes.length + 1) + '"/>');
    // la ligne d'en-tête reste visible au défilement
    m.push('<sheetViews><sheetView workbookViewId="0">' +
      '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
      '</sheetView></sheetViews>');
    m.push('<sheetFormatPr defaultRowHeight="15"/>');
    m.push('<cols>');
    for (i = 0; i < nb; i++) {
      m.push('<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' +
        (colonnes[i].largeur || 14) + '" customWidth="1"/>');
    }
    m.push('</cols><sheetData>');

    m.push('<row r="1" ht="30" customHeight="1">');
    for (i = 0; i < nb; i++) {
      m.push('<c r="' + colonneEnLettres(i) + '1" s="' + STYLE_ENTETE +
        '" t="inlineStr"><is><t xml:space="preserve">' +
        echapper(colonnes[i].titre) + '</t></is></c>');
    }
    m.push('</row>');

    for (j = 0; j < lignes.length; j++) {
      var numero = j + 2;
      m.push('<row r="' + numero + '">');
      for (i = 0; i < nb; i++) {
        m.push(cellule(colonneEnLettres(i) + numero, lignes[j][i],
          colonnes[i].type || TEXTE));
      }
      m.push('</row>');
    }
    m.push('</sheetData>');
    // filtre automatique sur l'en-tête : tri et filtrage immédiats
    m.push('<autoFilter ref="A1:' + derniere + (lignes.length + 1) + '"/>');
    m.push('</worksheet>');
    return m.join('');
  }

  /* ===================================================================
     2. Archive ZIP (entrées stockées, sans compression)
     =================================================================== */

  var TABLE_CRC = (function () {
    var t = new Int32Array(256), c, n, k;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c;
    }
    return t;
  })();

  function crc32(octets) {
    var c = -1;
    for (var i = 0; i < octets.length; i++) {
      c = TABLE_CRC[(c ^ octets[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ -1) >>> 0;
  }

  function enOctets(texte) {
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(texte);
    // repli : encodage UTF-8 manuel
    var s = unescape(encodeURIComponent(texte));
    var o = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) o[i] = s.charCodeAt(i) & 0xFF;
    return o;
  }

  function ecrire16(vue, pos, v) { vue.setUint16(pos, v, true); }
  function ecrire32(vue, pos, v) { vue.setUint32(pos, v >>> 0, true); }

  function horodatageDos(d) {
    var heure = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    return { heure: heure & 0xFFFF, date: date & 0xFFFF };
  }

  function archiver(entrees) {
    var maintenant = horodatageDos(new Date());
    var morceaux = [], central = [], decalage = 0, i;

    for (i = 0; i < entrees.length; i++) {
      var nom = enOctets(entrees[i].nom);
      var donnees = entrees[i].donnees;
      var somme = crc32(donnees);

      var entete = new Uint8Array(30 + nom.length);
      var ve = new DataView(entete.buffer);
      ecrire32(ve, 0, 0x04034B50);
      ecrire16(ve, 4, 20);            // version minimale
      ecrire16(ve, 6, 0x0800);        // noms en UTF-8
      ecrire16(ve, 8, 0);             // méthode : stocké
      ecrire16(ve, 10, maintenant.heure);
      ecrire16(ve, 12, maintenant.date);
      ecrire32(ve, 14, somme);
      ecrire32(ve, 18, donnees.length);
      ecrire32(ve, 22, donnees.length);
      ecrire16(ve, 26, nom.length);
      ecrire16(ve, 28, 0);
      entete.set(nom, 30);
      morceaux.push(entete, donnees);

      var cd = new Uint8Array(46 + nom.length);
      var vc = new DataView(cd.buffer);
      ecrire32(vc, 0, 0x02014B50);
      ecrire16(vc, 4, 20);            // version d'écriture
      ecrire16(vc, 6, 20);
      ecrire16(vc, 8, 0x0800);
      ecrire16(vc, 10, 0);
      ecrire16(vc, 12, maintenant.heure);
      ecrire16(vc, 14, maintenant.date);
      ecrire32(vc, 16, somme);
      ecrire32(vc, 20, donnees.length);
      ecrire32(vc, 24, donnees.length);
      ecrire16(vc, 28, nom.length);
      ecrire16(vc, 30, 0);            // extra
      ecrire16(vc, 32, 0);            // commentaire
      ecrire16(vc, 34, 0);            // disque
      ecrire16(vc, 36, 0);            // attributs internes
      ecrire32(vc, 38, 0);            // attributs externes
      ecrire32(vc, 42, decalage);
      cd.set(nom, 46);
      central.push(cd);

      decalage += entete.length + donnees.length;
    }

    var tailleCentral = 0;
    for (i = 0; i < central.length; i++) tailleCentral += central[i].length;

    var fin = new Uint8Array(22);
    var vf = new DataView(fin.buffer);
    ecrire32(vf, 0, 0x06054B50);
    ecrire16(vf, 4, 0);
    ecrire16(vf, 6, 0);
    ecrire16(vf, 8, entrees.length);
    ecrire16(vf, 10, entrees.length);
    ecrire32(vf, 12, tailleCentral);
    ecrire32(vf, 16, decalage);
    ecrire16(vf, 20, 0);

    return new Blob(morceaux.concat(central, [fin]),
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /* ===================================================================
     3. Façade
     =================================================================== */

  function creer(colonnes, lignes, nomFeuille) {
    var parties = [
      { nom: '[Content_Types].xml', donnees: enOctets(CONTENT_TYPES) },
      { nom: '_rels/.rels', donnees: enOctets(RELS) },
      { nom: 'xl/workbook.xml', donnees: enOctets(classeurXml(nomFeuille || 'Résultats')) },
      { nom: 'xl/_rels/workbook.xml.rels', donnees: enOctets(RELS_CLASSEUR) },
      { nom: 'xl/styles.xml', donnees: enOctets(STYLES) },
      { nom: 'xl/worksheets/sheet1.xml', donnees: enOctets(feuilleXml(colonnes, lignes)) }
    ];
    return archiver(parties);
  }

  window.EPOS = window.EPOS || {};
  window.EPOS.xlsx = {
    creer: creer,
    TEXTE: TEXTE, ENTIER: ENTIER, DATE: DATE, HEURE: HEURE
  };
})();
