# -*- coding: utf-8 -*-
"""
Assure un contraste suffisant entre le texte et son arrière-plan.

Les diapositives dont le fond est devenu sombre (laboratoire 3D, écrans de
transition) portaient encore des titres en noir ou en gris foncé, hérités
du fond clair d'origine : ils se confondaient avec le mur bleu. Ces titres
passent en blanc, avec une ombre portée qui garantit la lisibilité même
au-dessus d'une zone claire de l'image.

Le libellé lui-même n'est jamais modifié.

Usage : python3 tools/corriger-contraste.py
"""
import glob, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONDS_SOMBRES = ('labo-station.jpg', 'labo-accueil.jpg')
IMAGES_PLEIN_ECRAN = re.compile(r'<src>images/transition-station\d\.jpg</src>')

OMBRE = ('text-shadow:0 2px 12px rgba(2,14,26,.92), 0 1px 3px rgba(2,14,26,.9);')


def page_sombre(contenu):
    fond = re.search(r'<fond><data><!\[CDATA\[(.*?)\]\]>', contenu)
    if fond and any(k in fond.group(1) for k in FONDS_SOMBRES):
        return True
    return bool(IMAGES_PLEIN_ECRAN.search(contenu))


def main():
    total = 0
    for chemin in sorted(glob.glob(os.path.join(ROOT, 'data', 'page*.xml')),
                         key=lambda p: int(os.path.basename(p)[4:-4])):
        with open(chemin, encoding='utf-8-sig') as f:
            s = f.read()
        if not page_sombre(s):
            continue
        avant = s

        # titres de section : <tx> contenant un style color:#000000
        def eclaircir(m):
            bloc = m.group(0)
            if 'color:#000000;' not in bloc or 'text-shadow' in bloc:
                return bloc
            return bloc.replace('color:#000000;', 'color:#FFFFFF;' + OMBRE)

        s = re.sub(r'<tx><!\[CDATA\[.*?\]\]></tx>', eclaircir, s, flags=re.S)
        # la couleur de repli du bloc suit
        s = s.replace('<color>#393939</color>', '<color>#FFFFFF</color>')

        if s != avant:
            with open(chemin, 'w', encoding='utf-8-sig') as f:
                f.write(s)
            total += 1
            print('contraste corrigé :', os.path.basename(chemin))
    print(f'{total} diapositive(s) traitée(s).')


if __name__ == '__main__':
    main()
