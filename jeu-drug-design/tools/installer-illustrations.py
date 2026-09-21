# -*- coding: utf-8 -*-
"""
Installe dans images/ les illustrations rendues par tools/render, aux
formats et aux dimensions attendus par le jeu, puis met à jour les
références dans data/*.xml.

Les captures d'écran scientifiques (SwissADME, pkCSM, radars de
biodisponibilité, schémas de réaction, logos des outils) ne sont jamais
touchées : elles constituent le contenu pédagogique.

Usage : python3 tools/installer-illustrations.py
"""
import os, sys, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REND = os.path.join(ROOT, 'tools', 'render', 'out')
IMG = os.path.join(ROOT, 'images')

# (fichier rendu, fichier installé, format, qualité)
DECORS = [
    ('t2.png',   'transition-station2.jpg', 'JPEG', 92),
    ('t3.png',   'transition-station3.jpg', 'JPEG', 92),
    ('t4.png',   'transition-station4.jpg', 'JPEG', 92),
    ('labo.png',         'labo-accueil.jpg', 'JPEG', 92),
    ('labo-station.png', 'labo-station.jpg', 'JPEG', 92),
]
ICONES = [
    ('ico-objectifs.png',   'icone-objectifs.png'),
    ('ico-prerequis.png',   'icone-prerequis.png'),
    ('ico-stations.png',    'icone-stations.png'),
    ('ico-deroulement.png', 'icone-deroulement.png'),
    ('ico-message.png',     'icone-message.png'),
    ('ico-action.png',      'icone-action.png'),
]

# Remplacements appliqués à toutes les diapositives.
GLOBAUX = [
    ('images/man_bat_pose.png',  'images/pharmacien-pose.png'),
    ('images/man_bat_down.gif',  'images/pharmacien-bas.png'),
    ('images/man_bat_up.gif',    'images/pharmacien-haut.png'),
    ('images/man_bat_left.gif',  'images/pharmacien-gauche.png'),
    ('images/man_bat_right.gif', 'images/pharmacien-droite.png'),
    ('images/calltoaction.png',  'images/icone-action.png'),
    ('images/iso-campus-int-1.jpg', 'images/labo-accueil.jpg'),
    ('images/Women-0.gif',       'images/pharmacienne-presente.png'),
    ('images/cartoon-soft-06.jpg', 'images/labo-station.jpg'),
    ('images/imgvdkvpu669537.png',            'images/icone-objectifs.png'),
    ('images/checklistbovpth8emz1280v400.jpg','images/icone-prerequis.png'),
    ('images/imguhvlkb384994.png',            'images/icone-stations.png'),
    ('images/imgubsatv345696.png',            'images/icone-deroulement.png'),
    ('images/images.jpg',                     'images/icone-message.png'),
    ('images/imgdvmnvl144550.png',            'images/formule-acide-salicylique.png'),
]

# La même photo de bureau servait aux trois transitions : chacune reçoit
# désormais son illustration propre.
BUREAU = ('images/128189971interieurdebureauavecordinateurtableetchaise'
          'dessindaffairesalecranrendu3d.jpg')
PAR_PAGE = {
    15: [(BUREAU, 'images/transition-station2.jpg')],
    22: [(BUREAU, 'images/transition-station3.jpg')],
    30: [(BUREAU, 'images/transition-station4.jpg')],
}


# Fil d'Ariane des stations, incrusté dans les écrans de transition :
# l'étudiant voit d'un coup d'œil où il en est dans le parcours.
ETAPES = {'transition-station2.jpg': 2,
          'transition-station3.jpg': 3,
          'transition-station4.jpg': 4}


def incruster_fil_ariane(im, station, total=4):
    from PIL import ImageDraw, ImageFont
    S = 4                       # suréchantillonnage du calque
    L, H = im.size
    calque = Image.new('RGBA', (L * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(calque)
    police = ImageFont.truetype(
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', int(26 * S * L / 1920))

    marge_x, base_y = int(L * 0.052 * S), int(H * 0.875 * S)
    pas = int(L * 0.052 * S)
    r_actif, r_autre = int(L * 0.0132 * S), int(L * 0.0088 * S)

    for i in range(1, total + 1):
        cx = marge_x + (i - 1) * pas
        if i < station:                      # étapes franchies
            d.ellipse([cx - r_autre, base_y - r_autre, cx + r_autre, base_y + r_autre],
                      fill=(34, 197, 214, 210))
        elif i == station:                   # étape en cours
            d.ellipse([cx - r_actif - int(5 * S), base_y - r_actif - int(5 * S),
                       cx + r_actif + int(5 * S), base_y + r_actif + int(5 * S)],
                      outline=(34, 197, 214, 150), width=int(2 * S))
            d.ellipse([cx - r_actif, base_y - r_actif, cx + r_actif, base_y + r_actif],
                      fill=(34, 197, 214, 255))
            d.text((cx, base_y), str(i), font=police, fill=(6, 22, 34, 255), anchor='mm')
        else:                                # étapes à venir
            d.ellipse([cx - r_autre, base_y - r_autre, cx + r_autre, base_y + r_autre],
                      outline=(150, 190, 210, 130), width=int(2 * S))
        if i < total:                        # trait de liaison
            d.line([(cx + r_actif + int(9 * S), base_y), (cx + pas - r_actif - int(9 * S), base_y)],
                   fill=(120, 170, 195, 90), width=int(2 * S))

    petite = ImageFont.truetype(
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', int(17 * S * L / 1920))
    d.text((marge_x - r_autre, base_y - r_actif - int(26 * S)),
           f'STATION {station} SUR {total}', font=petite, fill=(190, 218, 232, 220), anchor='ls')

    calque = calque.resize((L, H), Image.LANCZOS)
    fusion = im.convert('RGBA')
    fusion.alpha_composite(calque)
    return fusion.convert('RGB')


def installer():
    for src, dst, fmt, q in DECORS:
        chemin = os.path.join(REND, src)
        if not os.path.exists(chemin):
            raise SystemExit('rendu manquant : ' + chemin)
        im = Image.open(chemin).convert('RGB')
        if dst in ETAPES:
            im = incruster_fil_ariane(im, ETAPES[dst])
        sortie = os.path.join(IMG, dst)
        im.save(sortie, fmt, quality=q, optimize=True, progressive=True)
        print(f'{dst:30s} {im.size[0]}x{im.size[1]}  {os.path.getsize(sortie)//1024} Kio')

        # Le moteur affiche d'abord une vignette basse définition pendant le
        # chargement du fond (images/low-<nom>.jpg) : sans elle, la
        # transition entre diapositives montre un cadre vide.
        if dst.endswith('.jpg'):
            basse = im.resize((256, 256), Image.LANCZOS)
            chemin_basse = os.path.join(IMG, 'low-' + dst)
            basse.save(chemin_basse, 'JPEG', quality=62, optimize=True)
            print(f"{'low-' + dst:30s} 256x256  {os.path.getsize(chemin_basse)//1024} Kio")

    for src, dst in ICONES:
        chemin = os.path.join(REND, src)
        if not os.path.exists(chemin):
            raise SystemExit('rendu manquant : ' + chemin)
        im = Image.open(chemin).convert('RGBA')
        sortie = os.path.join(IMG, dst)
        im.save(sortie, 'PNG', optimize=True)
        print(f'{dst:30s} {im.size[0]}x{im.size[1]}  {os.path.getsize(sortie)//1024} Kio')


def reecrire_xml():
    total = {}
    for fichier in sorted(glob.glob(os.path.join(ROOT, 'data', 'page*.xml'))):
        num = int(os.path.basename(fichier)[4:-4])
        with open(fichier, encoding='utf-8-sig') as f:
            s = f.read()
        avant = s
        for ancien, nouveau in GLOBAUX + PAR_PAGE.get(num, []):
            if ancien in s:
                total[ancien] = total.get(ancien, 0) + s.count(ancien)
                s = s.replace(ancien, nouveau)
        if s != avant:
            with open(fichier, 'w', encoding='utf-8-sig') as f:
                f.write(s)
    print('\n== références réécrites ==')
    for ancien, _ in GLOBAUX + [p for v in PAR_PAGE.values() for p in v]:
        n = total.get(ancien, 0)
        marque = '' if n else '   <-- AUCUNE OCCURRENCE'
        print(f'{n:4d}  {ancien}{marque}')


if __name__ == '__main__':
    installer()
    reecrire_xml()
