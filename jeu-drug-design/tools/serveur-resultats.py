# -*- coding: utf-8 -*-
"""Service local d'enregistrement des résultats du jeu EPOS.

Le jeu est une application web statique : un navigateur ne peut pas
écrire dans « C:\\Users\\Public ». Ce petit service, lancé sur le poste
de l'enseignant, reçoit le résultat d'une partie terminée et l'ajoute au
classeur Excel d'historique.

    python3 tools/serveur-resultats.py

Il n'écoute que sur la boucle locale (127.0.0.1) : rien n'est exposé sur
le réseau. Aucune dépendance externe n'est nécessaire.

Options :
    --port     port d'écoute (8779 par défaut)
    --dossier  dossier du classeur (C:\\Users\\Public sous Windows)
    --fichier  nom du classeur (Resultats_Jeu_Pharmacie.xlsx)
"""

import argparse
import datetime
import json
import os
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import xlsx_simple as xlsx  # noqa: E402

NOM_FICHIER = 'Resultats_Jeu_Pharmacie.xlsx'
PORT = 8779
TAILLE_MAX = 64 * 1024

# Colonnes fixes, avant les stations. La date et l'heure suivent le nom,
# comme demandé, et précèdent les scores.
COLONNES_FIXES = [
    {'titre': "Nom de l'étudiant", 'type': xlsx.TEXTE, 'largeur': 28},
    {'titre': 'Date', 'type': xlsx.DATE, 'largeur': 12},
    {'titre': 'Heure', 'type': xlsx.HEURE, 'largeur': 10},
    {'titre': 'Score total (%)', 'type': xlsx.ENTIER, 'largeur': 15},
]

verrou = threading.Lock()


def dossier_par_defaut():
    """Dossier public du système, où le classeur est centralisé."""
    if os.name == 'nt':
        public = os.environ.get('PUBLIC') or r'C:\Users\Public'
        return public
    if sys.platform == 'darwin':
        return '/Users/Shared'
    # Sur les autres systèmes, aucun équivalent de « C:\Users\Public »
    # n'existe : on retient un dossier partagé lisible par tous.
    return os.path.join(os.path.expanduser('~'), 'EPOS-Resultats')


class ErreurEnregistrement(Exception):
    """Échec d'écriture présentable à l'utilisateur."""


# ---------------------------------------------------------------------------
# Classeur
# ---------------------------------------------------------------------------

def colonnes_pour(stations):
    """Colonnes du classeur pour la liste de stations reçue."""
    colonnes = [dict(c) for c in COLONNES_FIXES]
    for rang, station in enumerate(stations, start=1):
        libelle = (station.get('libelle') or '').strip()
        titre = 'Station %d' % rang
        if libelle:
            titre += ' — ' + libelle
        colonnes.append({'titre': titre + ' (%)', 'type': xlsx.ENTIER, 'largeur': 22})
    return colonnes


def fusionner_colonnes(stations_existantes, nouvelles):
    """En-tête conservant les colonnes déjà présentes dans le fichier.

    Le nombre de stations peut changer d'une version du jeu à l'autre :
    on garde le maximum des deux, pour qu'aucune colonne d'historique ne
    disparaisse, et on retient le libellé le plus récent quand il existe.

    stations_existantes ne contient que les colonnes de station du
    fichier, nouvelles contient l'en-tête complet : la comparaison porte
    donc sur le nombre de stations de part et d'autre.
    """
    if not stations_existantes:
        return nouvelles
    fusion = list(nouvelles)
    nouvelles_stations = len(nouvelles) - len(COLONNES_FIXES)
    for i in range(nouvelles_stations, len(stations_existantes)):
        fusion.append({'titre': str(stations_existantes[i]),
                       'type': xlsx.ENTIER, 'largeur': 22})
    return fusion


def lire_classeur(chemin):
    """(en-têtes, lignes) du classeur existant, ou ([], []) s'il n'y en a pas."""
    if not os.path.exists(chemin):
        return [], []
    lignes = xlsx.lire(chemin)
    if not lignes:
        return [], []
    return lignes[0], lignes[1:]


def ecrire_classeur(chemin, colonnes, lignes):
    """Écriture atomique : le fichier n'est remplacé qu'une fois complet."""
    dossier = os.path.dirname(chemin) or '.'
    descripteur, provisoire = tempfile.mkstemp(suffix='.xlsx', dir=dossier)
    os.close(descripteur)
    try:
        xlsx.ecrire(provisoire, colonnes, lignes)
        os.replace(provisoire, chemin)
    except Exception:
        try:
            os.unlink(provisoire)
        except OSError:
            pass
        raise


def enregistrer(chemin, journal, resultat):
    """Ajoute une ligne au classeur, en conservant tout l'existant."""
    maintenant = datetime.datetime.now()
    nom = (resultat.get('nom') or '').strip() or 'Étudiant sans nom'
    stations = resultat.get('stations') or []

    ligne = [
        nom[:120],
        xlsx.serie_date(maintenant.date()),
        xlsx.serie_heure(maintenant.time()),
        int(resultat.get('scoreTotal') or 0),
    ]
    for station in stations:
        ligne.append(int(station.get('score') or 0))

    # Le journal est écrit d'abord : même si le classeur est verrouillé
    # par Excel, le résultat de l'étudiant n'est jamais perdu.
    consigner(journal, maintenant, nom, resultat, stations)

    with verrou:
        entetes, existantes = _relire_sans_perte(chemin)
        colonnes = fusionner_colonnes(entetes[len(COLONNES_FIXES):],
                                      colonnes_pour(stations))
        largeur = len(colonnes)
        lignes = [list(l) + [''] * (largeur - len(l)) for l in existantes]
        lignes.append(ligne + [''] * (largeur - len(ligne)))
        try:
            ecrire_classeur(chemin, colonnes, lignes)
        except PermissionError:
            raise ErreurEnregistrement(
                'Le classeur est ouvert dans Excel ou son accès est refusé. '
                'Fermez-le puis relancez l\'enregistrement.')
        except OSError as erreur:
            raise ErreurEnregistrement(
                'Le classeur n\'a pas pu être écrit (%s).' % erreur.strerror)
    return len(lignes)


def _relire_sans_perte(chemin):
    """Relit le classeur ; un fichier illisible est mis de côté, jamais effacé."""
    try:
        return lire_classeur(chemin)
    except Exception as erreur:
        if not os.path.exists(chemin):
            return [], []
        horodatage = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
        secours = '%s.illisible-%s.xlsx' % (os.path.splitext(chemin)[0], horodatage)
        try:
            os.replace(chemin, secours)
            journaliser('classeur illisible (%s) : conservé sous %s'
                        % (erreur, os.path.basename(secours)))
        except OSError:
            raise ErreurEnregistrement(
                'Le classeur existant est illisible et n\'a pas pu être mis de côté.')
        return [], []


def consigner(journal, maintenant, nom, resultat, stations):
    """Trace de sécurité, une ligne JSON par partie."""
    try:
        with open(journal, 'a', encoding='utf-8') as flux:
            flux.write(json.dumps({
                'horodatage': maintenant.isoformat(timespec='seconds'),
                'nom': nom,
                'scoreTotal': int(resultat.get('scoreTotal') or 0),
                'stations': [{'libelle': s.get('libelle', ''),
                              'score': int(s.get('score') or 0)} for s in stations],
                'partie': resultat.get('partie', ''),
            }, ensure_ascii=False) + '\n')
    except OSError as erreur:
        journaliser('journal non écrit : %s' % erreur)


def journaliser(message):
    print('[EPOS %s] %s' % (datetime.datetime.now().strftime('%H:%M:%S'), message),
          flush=True)


# ---------------------------------------------------------------------------
# Service HTTP
# ---------------------------------------------------------------------------

class Gestionnaire(BaseHTTPRequestHandler):
    server_version = 'EPOS-Resultats/1.0'
    chemin_classeur = ''
    chemin_journal = ''

    def _entetes_communes(self):
        # Le jeu peut être ouvert depuis un fichier local (origine « null »)
        # ou depuis un petit serveur statique : les deux sont acceptés, le
        # service n'écoutant de toute façon que sur la boucle locale.
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store')

    def _repondre(self, code, charge):
        corps = json.dumps(charge, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(corps)))
        self._entetes_communes()
        self.end_headers()
        self.wfile.write(corps)

    def do_OPTIONS(self):
        self.send_response(204)
        self._entetes_communes()
        self.end_headers()

    def do_GET(self):
        if self.path.split('?')[0] != '/etat':
            self._repondre(404, {'ok': False, 'message': 'route inconnue'})
            return
        existe = os.path.exists(self.chemin_classeur)
        parties = 0
        if existe:
            try:
                parties = max(0, len(xlsx.lire(self.chemin_classeur)) - 1)
            except Exception:
                parties = -1
        self._repondre(200, {'ok': True, 'service': 'EPOS', 'version': 1,
                             'fichier': self.chemin_classeur,
                             'existe': existe, 'parties': parties})

    def do_POST(self):
        if self.path.split('?')[0] != '/resultat':
            self._repondre(404, {'ok': False, 'message': 'route inconnue'})
            return
        try:
            taille = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            taille = 0
        if taille <= 0 or taille > TAILLE_MAX:
            self._repondre(400, {'ok': False, 'message': 'requête vide ou trop volumineuse'})
            return
        try:
            resultat = json.loads(self.rfile.read(taille).decode('utf-8'))
            if not isinstance(resultat, dict):
                raise ValueError('objet attendu')
        except (ValueError, UnicodeDecodeError):
            self._repondre(400, {'ok': False, 'message': 'données illisibles'})
            return

        try:
            parties = enregistrer(self.chemin_classeur, self.chemin_journal, resultat)
        except ErreurEnregistrement as erreur:
            journaliser('échec : %s' % erreur)
            self._repondre(503, {'ok': False, 'message': str(erreur)})
            return
        except Exception as erreur:  # filet de sécurité : le jeu ne doit pas rester sans réponse
            journaliser('échec inattendu : %r' % erreur)
            self._repondre(500, {'ok': False,
                                 'message': 'Le classeur n\'a pas pu être mis à jour.'})
            return

        journaliser('%s — %s%% enregistré (ligne %d)'
                    % (resultat.get('nom', '?'), resultat.get('scoreTotal', '?'), parties))
        self._repondre(200, {'ok': True, 'fichier': self.chemin_classeur, 'parties': parties})

    def log_message(self, *args):
        pass  # le service tient son propre journal, plus lisible


def principal(argv=None):
    analyseur = argparse.ArgumentParser(description=__doc__)
    analyseur.add_argument('--port', type=int, default=PORT)
    analyseur.add_argument('--dossier', default=None)
    analyseur.add_argument('--fichier', default=NOM_FICHIER)
    options = analyseur.parse_args(argv)

    dossier = options.dossier or dossier_par_defaut()
    try:
        os.makedirs(dossier, exist_ok=True)
    except OSError as erreur:
        print('Dossier inaccessible : %s (%s)' % (dossier, erreur), file=sys.stderr)
        return 2
    if not os.access(dossier, os.W_OK):
        print('Dossier non inscriptible : %s' % dossier, file=sys.stderr)
        return 2

    Gestionnaire.chemin_classeur = os.path.join(dossier, options.fichier)
    Gestionnaire.chemin_journal = os.path.join(dossier, 'Resultats_Jeu_Pharmacie.journal.jsonl')

    service = ThreadingHTTPServer(('127.0.0.1', options.port), Gestionnaire)
    journaliser('service prêt sur http://127.0.0.1:%d' % options.port)
    journaliser('classeur : %s' % Gestionnaire.chemin_classeur)
    try:
        service.serve_forever()
    except KeyboardInterrupt:
        journaliser('arrêt demandé')
    finally:
        service.server_close()
    return 0


if __name__ == '__main__':
    sys.exit(principal())
