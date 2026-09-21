# -*- coding: utf-8 -*-
"""
Améliore le passage d'une diapositive à l'autre.

Le moteur propose bien un effet de fondu natif (« Classic »), mais il
emprunte un chemin de code qui appelle amplify.store() — une bibliothèque
que cet export ne contient pas : la transition levait une exception à
chaque changement de diapositive.

Le fondu est donc réalisé par la surcouche (css/cssadd.css et
javascript/jsadd.js), qui anime l'apparition de la scène sans solliciter
le moteur. Ce script remet les diapositives en « Direct », au cas où une
version antérieure les aurait basculées.

Usage : python3 tools/transitions.py
"""
import glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANCIEN = '<transition><data><![CDATA[Classic]]></data></transition>'
NOUVEAU = '<transition><data><![CDATA[Direct]]></data></transition>'


def main():
    total = 0
    for chemin in sorted(glob.glob(os.path.join(ROOT, 'data', 'page*.xml'))):
        with open(chemin, encoding='utf-8-sig') as f:
            s = f.read()
        if ANCIEN not in s:
            continue
        with open(chemin, 'w', encoding='utf-8-sig') as f:
            f.write(s.replace(ANCIEN, NOUVEAU))
        total += 1
    print(f'{total} diapositive(s) remise(s) en Direct.')


if __name__ == '__main__':
    main()
