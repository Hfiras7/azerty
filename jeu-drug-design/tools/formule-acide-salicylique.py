# -*- coding: utf-8 -*-
"""
Redessine la formule développée de l'acide salicylique.

L'image d'origine (images/imgdvmnvl144550.png, 200x200) est affichée en
235x235 dans le jeu : elle est donc agrandie et floue. On la reproduit à
l'identique — même molécule, même disposition — en haute résolution.

Usage : python3 tools/formule-acide-salicylique.py
"""
import math, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SS = 4
TAILLE = 700

TRAIT = (18, 34, 52)
ROUGE = (198, 40, 46)
FONT_DIR = "/usr/share/fonts/truetype/dejavu"


def police(taille, gras=False):
    nom = "DejaVuSans-Bold.ttf" if gras else "DejaVuSans.ttf"
    return ImageFont.truetype(os.path.join(FONT_DIR, nom), taille)


def main():
    T = TAILLE * SS
    im = Image.new("RGBA", (T, T), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    ep = int(5.5 * SS)
    f = police(int(42 * SS), gras=True)

    # cycle benzénique, sommets pointe en haut
    cx, cy, R = T * 0.46, T * 0.64, T * 0.215
    sommets = []
    for i in range(6):
        a = math.radians(90 + i * 60)
        sommets.append((cx + R * math.cos(a), cy - R * math.sin(a)))
    # S0 haut, S1 haut-gauche, S2 bas-gauche, S3 bas, S4 bas-droite, S5 haut-droite

    for i in range(6):
        d.line([sommets[i], sommets[(i + 1) % 6]], fill=TRAIT, width=ep)

    # doubles liaisons internes (alternées), en retrait vers le centre
    def interne(a, b, retrait=0.16, raccourci=0.18):
        ax, ay = a; bx, by = b
        ax += (cx - ax) * retrait; ay += (cy - ay) * retrait
        bx += (cx - bx) * retrait; by += (cy - by) * retrait
        dx, dy = bx - ax, by - ay
        return ((ax + dx * raccourci, ay + dy * raccourci),
                (bx - dx * raccourci, by - dy * raccourci))

    # Acide salicylique : l'hydroxyle et le carboxyle sont portés par deux
    # carbones ADJACENTS (position ortho). Le carboxyle est sur le sommet
    # haut, l'hydroxyle sur le sommet haut-gauche.
    for i in (1, 3, 5):
        p, q = interne(sommets[i], sommets[(i + 1) % 6])
        d.line([p, q], fill=TRAIT, width=ep)

    def texte(xy, s, couleur, ancre="mm"):
        d.text(xy, s, font=f, fill=couleur, anchor=ancre)

    # --- hydroxyle phénolique, sur le sommet haut-gauche
    hg = sommets[1]
    oh = (hg[0] - T * 0.175, hg[1] - T * 0.048)
    d.line([hg, (oh[0] + T * 0.052, oh[1] + T * 0.014)], fill=TRAIT, width=ep)
    texte(oh, "HO", ROUGE)

    # --- carboxyle, sur le sommet haut
    haut = sommets[0]
    cc = (haut[0] + T * 0.005, haut[1] - T * 0.175)
    d.line([haut, (cc[0], cc[1] + T * 0.02)], fill=TRAIT, width=ep)

    # double liaison C=O, vers le haut-gauche
    o_haut = (cc[0] - T * 0.125, cc[1] - T * 0.105)
    dx0, dy0 = o_haut[0] - cc[0], o_haut[1] - cc[1]
    long0 = math.hypot(dx0, dy0)
    nx, ny = -dy0 / long0, dx0 / long0
    ecart = 9 * SS   # écartement des deux traits de la double liaison
    for k in (-1, 1):
        d.line([(cc[0] + nx * ecart * k + dx0 * 0.10, cc[1] + ny * ecart * k + dy0 * 0.10),
                (o_haut[0] + nx * ecart * k - dx0 * 0.30, o_haut[1] + ny * ecart * k - dy0 * 0.30)],
               fill=TRAIT, width=ep)
    texte(o_haut, "O", ROUGE)

    # liaison simple C-OH, vers le haut-droite
    oh2 = (cc[0] + T * 0.135, cc[1] - T * 0.100)
    d.line([(cc[0] + T * 0.022, cc[1] - T * 0.016),
            (oh2[0] - T * 0.045, oh2[1] + T * 0.032)], fill=TRAIT, width=ep)
    texte(oh2, "OH", ROUGE)

    sortie = os.path.join(ROOT, 'images', 'formule-acide-salicylique.png')
    im.resize((TAILLE, TAILLE), Image.LANCZOS).save(sortie, optimize=True)
    print('écrit :', os.path.relpath(sortie, ROOT), TAILLE, 'x', TAILLE)


if __name__ == '__main__':
    main()
