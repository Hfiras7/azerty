# -*- coding: utf-8 -*-
"""
Resynchronise javascript/page.js avec les fichiers data/pageN.xml.

Le moteur Ludiscape embarque une copie de chaque diapositive dans page.js
(tableau `poff`) et l'utilise en priorité : toute correction apportée aux
fichiers XML doit donc y être répercutée, à l'identique.

Règle de conversion (vérifiée sur l'export d'origine) :
    poff[i] = contenu de data/page<i>.xml, sans BOM, retours à la ligne
              supprimés, guillemets doubles échappés.

Usage : python3 tools/sync-page-js.py
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def contenu_aplati(indice):
    chemin = os.path.join(ROOT, 'data', 'page%d.xml' % indice)
    with open(chemin, encoding='utf-8-sig') as f:
        brut = f.read()
    return brut.replace('\r\n', '\n').replace('\n', '')


def main():
    chemin = os.path.join(ROOT, 'javascript', 'page.js')
    with open(chemin, encoding='utf-8-sig') as f:
        lignes = f.read().split('\n')

    modifiees = 0
    for n, ligne in enumerate(lignes):
        m = re.match(r'^poff\[(\d+)\]="(.*)" ;$', ligne)
        if not m:
            continue
        i = int(m.group(1))
        try:
            plat = contenu_aplati(i)
        except FileNotFoundError:
            print('  ! data/page%d.xml introuvable, ligne laissée telle quelle' % i)
            continue
        nouvelle = 'poff[%d]="%s" ;' % (i, plat.replace('"', '\\"'))
        if nouvelle != ligne:
            lignes[n] = nouvelle
            modifiees += 1

    with open(chemin, 'w', encoding='utf-8-sig', newline='') as f:
        f.write('\n'.join(lignes))
    print('page.js resynchronisé : %d diapositive(s) mise(s) à jour.' % modifiees)


if __name__ == '__main__':
    sys.exit(main())
