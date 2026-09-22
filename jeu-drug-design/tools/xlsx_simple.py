# -*- coding: utf-8 -*-
"""Lecture et écriture de classeurs .xlsx, sans dépendance externe.

Un .xlsx est une archive ZIP de fichiers XML. Le sous-ensemble utilisé ici
— une seule feuille, une ligne d'en-tête, des cellules texte, entières,
date et heure — se décrit en quelques centaines de lignes et évite
d'imposer l'installation d'openpyxl sur le poste de l'enseignant.

Le fichier produit s'ouvre directement dans Microsoft Excel, LibreOffice
Calc ou Google Sheets.
"""

import datetime
import re
import zipfile

# Excel compte les jours depuis le 30/12/1899 (le décalage de deux jours
# par rapport au 01/01/1900 reproduit un défaut historique de Lotus 1-2-3
# qu'Excel a conservé).
ORIGINE = datetime.date(1899, 12, 30)

NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

# Types de colonne reconnus par l'écriture.
TEXTE, ENTIER, DATE, HEURE = 'texte', 'entier', 'date', 'heure'

# Index des styles déclarés dans styles.xml (voir _STYLES).
_STYLE = {TEXTE: 0, ENTIER: 3, DATE: 1, HEURE: 2}
_STYLE_ENTETE = 4


# ---------------------------------------------------------------------------
# Conversions
# ---------------------------------------------------------------------------

def serie_date(valeur):
    """Numéro de série Excel d'une date."""
    if isinstance(valeur, datetime.datetime):
        valeur = valeur.date()
    return (valeur - ORIGINE).days


def serie_heure(valeur):
    """Fraction de journée correspondant à une heure."""
    secondes = valeur.hour * 3600 + valeur.minute * 60 + valeur.second
    return secondes / 86400.0


def colonne_en_lettres(index):
    """0 -> A, 25 -> Z, 26 -> AA."""
    lettres = ''
    index += 1
    while index:
        index, reste = divmod(index - 1, 26)
        lettres = chr(65 + reste) + lettres
    return lettres


def _echapper(texte):
    return (str(texte).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


# ---------------------------------------------------------------------------
# Lecture
# ---------------------------------------------------------------------------

_BALISE = re.compile(r'<([a-zA-Z0-9:]+)([^>]*?)(/?)>|</([a-zA-Z0-9:]+)>')
_ATTR = re.compile(r'([a-zA-Z0-9:]+)="([^"]*)"')
_REF = re.compile(r'([A-Z]+)([0-9]+)')


def _sans_prefixe(nom):
    return nom.split(':')[-1]


def _detexter(texte):
    return (texte.replace('&lt;', '<').replace('&gt;', '>')
            .replace('&quot;', '"').replace('&apos;', "'")
            .replace('&amp;', '&'))


def _chaines_partagees(archive):
    """Table sharedStrings.xml, indexée par position."""
    try:
        brut = archive.read('xl/sharedStrings.xml').decode('utf-8')
    except KeyError:
        return []
    chaines, courante, dans_si, dans_t = [], [], False, False
    for element in _BALISE.finditer(brut):
        ouvrante, _, auto_fermante, fermante = element.groups()
        if ouvrante:
            nom = _sans_prefixe(ouvrante)
            if nom == 'si':
                courante, dans_si = [], True
            elif nom == 't' and dans_si and not auto_fermante:
                dans_t = True
                debut = element.end()
                suite = brut.find('<', debut)
                courante.append(_detexter(brut[debut:suite]))
        elif fermante:
            nom = _sans_prefixe(fermante)
            if nom == 'si' and dans_si:
                chaines.append(''.join(courante))
                dans_si = False
            elif nom == 't':
                dans_t = False
    return chaines


def _nom_feuille_principale(archive):
    """Chemin de la première feuille du classeur."""
    for chemin in ('xl/worksheets/sheet1.xml',):
        if chemin in archive.namelist():
            return chemin
    for nom in archive.namelist():
        if nom.startswith('xl/worksheets/') and nom.endswith('.xml'):
            return nom
    raise ValueError('aucune feuille de calcul dans le classeur')


def lire(chemin):
    """Renvoie la liste des lignes du classeur, en-tête compris.

    Chaque ligne est une liste de valeurs (str, int ou float). Les lignes
    sont alignées sur les références de cellule (A, B, C...), de sorte
    qu'une cellule vide au milieu d'une ligne ne décale pas les suivantes.
    """
    with zipfile.ZipFile(chemin, 'r') as archive:
        chaines = _chaines_partagees(archive)
        brut = archive.read(_nom_feuille_principale(archive)).decode('utf-8')

    lignes, ligne, colonne, type_cellule = [], {}, 0, ''
    largeur_max = 0
    position = 0
    while True:
        element = _BALISE.search(brut, position)
        if not element:
            break
        position = element.end()
        ouvrante, attributs, auto_fermante, fermante = element.groups()
        if ouvrante:
            nom = _sans_prefixe(ouvrante)
            if nom == 'row':
                ligne, colonne = {}, 0
            elif nom == 'c':
                attrs = dict(_ATTR.findall(attributs))
                type_cellule = attrs.get('t', 'n')
                reference = attrs.get('r', '')
                correspondance = _REF.match(reference)
                if correspondance:
                    lettres = correspondance.group(1)
                    colonne = 0
                    for lettre in lettres:
                        colonne = colonne * 26 + (ord(lettre) - 64)
                    colonne -= 1
            elif nom in ('v', 't') and not auto_fermante:
                suite = brut.find('<', position)
                contenu = _detexter(brut[position:suite])
                if nom == 'v' and type_cellule == 's':
                    indice = int(contenu)
                    valeur = chaines[indice] if indice < len(chaines) else ''
                elif nom == 'v' and type_cellule in ('n', ''):
                    valeur = _nombre(contenu)
                elif nom == 'v' and type_cellule == 'b':
                    valeur = contenu == '1'
                else:
                    valeur = contenu
                if nom == 't' and colonne in ligne and ligne[colonne] != '':
                    ligne[colonne] = str(ligne[colonne]) + valeur
                else:
                    ligne[colonne] = valeur
                largeur_max = max(largeur_max, colonne + 1)
                colonne += 1
                position = suite
        elif fermante and _sans_prefixe(fermante) == 'row':
            lignes.append(ligne)

    resultat = []
    for ligne in lignes:
        taille = max(ligne) + 1 if ligne else 0
        resultat.append([ligne.get(i, '') for i in range(max(taille, largeur_max))])
    return resultat


def _nombre(texte):
    try:
        if '.' in texte or 'e' in texte.lower():
            return float(texte)
        return int(texte)
    except ValueError:
        return texte


# ---------------------------------------------------------------------------
# Écriture
# ---------------------------------------------------------------------------

_CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
    '</Types>'
)

_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
    '</Relationships>'
)

_RELS_CLASSEUR = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    '</Relationships>'
)

# Les index de cellXfs sont ceux de _STYLE : 0 texte, 1 date, 2 heure,
# 3 entier, 4 en-tête.
_STYLES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    '<numFmts count="2">'
    '<numFmt numFmtId="164" formatCode="dd/mm/yyyy"/>'
    '<numFmt numFmtId="165" formatCode="hh:mm:ss"/>'
    '</numFmts>'
    '<fonts count="2">'
    '<font><sz val="11"/><name val="Calibri"/></font>'
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
    '</fonts>'
    '<fills count="3">'
    '<fill><patternFill patternType="none"/></fill>'
    '<fill><patternFill patternType="gray125"/></fill>'
    '<fill><patternFill patternType="solid"><fgColor rgb="FF02515E"/><bgColor indexed="64"/></patternFill></fill>'
    '</fills>'
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    '<cellXfs count="5">'
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
    '<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">'
    '<alignment vertical="center" wrapText="1"/></xf>'
    '</cellXfs>'
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
    '</styleSheet>'
)

_CLASSEUR = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
    '<sheets><sheet name="{nom}" sheetId="1" r:id="rId1"/></sheets>'
    '</workbook>'
)


def _cellule(reference, valeur, type_colonne):
    """Fragment XML d'une cellule, typée selon la colonne."""
    if valeur is None or valeur == '':
        return ''
    if isinstance(valeur, bool):
        return '<c r="%s" t="b"><v>%d</v></c>' % (reference, 1 if valeur else 0)
    if isinstance(valeur, (int, float)):
        style = _STYLE.get(type_colonne, 0)
        nombre = repr(valeur) if isinstance(valeur, float) else str(valeur)
        return '<c r="%s" s="%d"><v>%s</v></c>' % (reference, style, nombre)
    # Une valeur textuelle reste du texte, quel que soit le type déclaré
    # de la colonne : mieux vaut une date lisible qu'une cellule vide.
    return ('<c r="%s" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>'
            % (reference, _echapper(valeur)))


def ecrire(chemin, colonnes, lignes, nom_feuille='Résultats'):
    """Écrit le classeur.

    colonnes : liste de dictionnaires {titre, type, largeur}.
    lignes   : liste de listes de valeurs, alignées sur colonnes.
    """
    nb = len(colonnes)
    morceaux = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<worksheet xmlns="%s">' % NS,
        '<sheetPr><outlinePr summaryBelow="1" summaryRight="1"/></sheetPr>',
        '<dimension ref="A1:%s%d"/>' % (colonne_en_lettres(nb - 1), len(lignes) + 1),
        # la ligne d'en-tête reste visible au défilement
        '<sheetViews><sheetView workbookViewId="0">'
        '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>'
        '</sheetView></sheetViews>',
        '<sheetFormatPr defaultRowHeight="15"/>',
        '<cols>',
    ]
    for i, colonne in enumerate(colonnes):
        morceaux.append('<col min="%d" max="%d" width="%s" customWidth="1"/>'
                        % (i + 1, i + 1, colonne.get('largeur', 14)))
    morceaux.append('</cols><sheetData>')

    morceaux.append('<row r="1" ht="30" customHeight="1">')
    for i, colonne in enumerate(colonnes):
        reference = '%s1' % colonne_en_lettres(i)
        morceaux.append('<c r="%s" s="%d" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>'
                        % (reference, _STYLE_ENTETE, _echapper(colonne['titre'])))
    morceaux.append('</row>')

    for numero, ligne in enumerate(lignes, start=2):
        morceaux.append('<row r="%d">' % numero)
        for i in range(nb):
            valeur = ligne[i] if i < len(ligne) else ''
            morceaux.append(_cellule('%s%d' % (colonne_en_lettres(i), numero),
                                     valeur, colonnes[i].get('type', TEXTE)))
        morceaux.append('</row>')

    morceaux.append('</sheetData>')
    # filtre automatique sur l'en-tête : tri et filtrage immédiats
    morceaux.append('<autoFilter ref="A1:%s%d"/>'
                    % (colonne_en_lettres(nb - 1), len(lignes) + 1))
    morceaux.append('</worksheet>')
    feuille = ''.join(morceaux)

    with zipfile.ZipFile(chemin, 'w', zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('[Content_Types].xml', _CONTENT_TYPES)
        archive.writestr('_rels/.rels', _RELS)
        archive.writestr('xl/workbook.xml', _CLASSEUR.format(nom=_echapper(nom_feuille)))
        archive.writestr('xl/_rels/workbook.xml.rels', _RELS_CLASSEUR)
        archive.writestr('xl/styles.xml', _STYLES)
        archive.writestr('xl/worksheets/sheet1.xml', feuille)
