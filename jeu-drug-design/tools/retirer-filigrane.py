# -*- coding: utf-8 -*-
"""
Retire le bloc de filigrane « Ludiscape version demo » des diapositives.

Ce bloc est un <bloc type="text"> autonome, inséré à l'identique dans
chaque fichier data/pageN.xml. Le moteur ne le régénère pas : le supprimer
des données suffit. Le filigrane relève de la licence de l'outil auteur :
son retrait est une décision de l'auteur du jeu.

Usage : python3 tools/retirer-filigrane.py
"""
import glob, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOTIF = re.compile(r'<bloc>(?:(?!</bloc>).)*?ludiscape\.com/tarifs\.php.*?</bloc>\s*',
                   re.S | re.I)


def main():
    total = 0
    for chemin in sorted(glob.glob(os.path.join(ROOT, 'data', 'page*.xml'))):
        with open(chemin, encoding='utf-8-sig') as f:
            s = f.read()
        neuf, n = MOTIF.subn('', s)
        if n:
            with open(chemin, 'w', encoding='utf-8-sig') as f:
                f.write(neuf)
            total += n
        reste = neuf.lower().count('version demo') + neuf.lower().count('tarifs.php')
        if reste:
            raise SystemExit('mention résiduelle dans ' + chemin)
    print(f'{total} bloc(s) de filigrane retiré(s).')


if __name__ == '__main__':
    main()
