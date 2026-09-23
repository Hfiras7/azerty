# -*- coding: utf-8 -*-
"""Icône Windows du jeu (images/epos.ico).

Le motif est celui que le jeu porte déjà dans son bandeau de station :
un hexagone et trois atomes. Chaque taille est dessinée séparément, avec
une épaisseur de trait qui lui est propre — un simple sous-échantillon
d'une grande image rendrait le trait illisible en 16x16.
"""

import io
import math
import os
from PIL import Image, ImageDraw

TAILLES = [16, 24, 32, 48, 64, 128, 256]
SS = 8                      # sur-échantillonnage pour l'anticrénelage

NUIT = (7, 35, 56)
TEAL = (10, 98, 116)
TEAL_CLAIR = (34, 197, 214)
BLANC = (255, 255, 255)


def fond(taille):
    """Carré à coins arrondis, dégradé diagonal nuit -> teal."""
    c = Image.new('RGB', (taille, taille))
    px = c.load()
    for y in range(taille):
        for x in range(taille):
            t = (x + y) / (2.0 * (taille - 1))
            px[x, y] = tuple(int(NUIT[i] + (TEAL[i] - NUIT[i]) * t) for i in range(3))
    masque = Image.new('L', (taille, taille), 0)
    ImageDraw.Draw(masque).rounded_rectangle(
        [0, 0, taille - 1, taille - 1], radius=int(taille * 0.22), fill=255)
    sortie = Image.new('RGBA', (taille, taille), (0, 0, 0, 0))
    sortie.paste(c, (0, 0), masque)
    return sortie


def hexagone(centre, rayon):
    """Six sommets, pointe en haut."""
    cx, cy = centre
    return [(cx + rayon * math.sin(math.pi / 3 * i),
             cy - rayon * math.cos(math.pi / 3 * i)) for i in range(6)]


def icone(taille):
    grand = taille * SS
    im = fond(grand)
    d = ImageDraw.Draw(im)

    cx = cy = grand / 2.0
    rayon = grand * 0.285
    # le trait s'épaissit aux petites tailles, sinon il disparaît
    epaisseur = max(SS, int(grand * (0.085 if taille <= 32 else 0.062)))
    rayon_atome = grand * (0.115 if taille <= 32 else 0.098)

    sommets = hexagone((cx, cy), rayon)
    d.line(sommets + [sommets[0]], fill=BLANC, width=epaisseur, joint='curve')

    # trois atomes sur les sommets : haut, bas-droite, bas-gauche
    for i in (0, 2, 4):
        x, y = sommets[i]
        # en dessous de 32 px, le teal se confond avec le fond : tout en blanc
        couleur = BLANC if (i == 0 or taille <= 24) else TEAL_CLAIR
        d.ellipse([x - rayon_atome, y - rayon_atome, x + rayon_atome, y + rayon_atome],
                  fill=couleur)

    return im.resize((taille, taille), Image.LANCZOS)


def ecrire_ico(chemin, images):
    """Assemble le conteneur .ico à la main.

    Pillow, à qui l'on passe une seule image et une liste de tailles,
    rééchantillonne la plus grande pour toutes les autres : le dessin
    calibré pour le 16x16 serait perdu. On écrit donc l'en-tête et le
    répertoire nous-mêmes, une image PNG par taille (accepté par Windows
    depuis Vista).
    """
    import struct
    blocs = []
    for im in images:
        tampon = io.BytesIO()
        im.save(tampon, format='PNG', optimize=True)
        blocs.append(tampon.getvalue())

    entete = struct.pack('<HHH', 0, 1, len(images))
    decalage = len(entete) + 16 * len(images)
    repertoire = b''
    for im, donnees in zip(images, blocs):
        L, H = im.size
        repertoire += struct.pack('<BBBBHHII',
                                  0 if L == 256 else L, 0 if H == 256 else H,
                                  0, 0, 1, 32, len(donnees), decalage)
        decalage += len(donnees)

    with open(chemin, 'wb') as f:
        f.write(entete + repertoire + b''.join(blocs))


def main():
    racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    images = [icone(t) for t in TAILLES]
    chemin = os.path.join(racine, 'images', 'epos.ico')
    ecrire_ico(chemin, images)
    print('epos.ico  %s  %d Kio' % (TAILLES, os.path.getsize(chemin) // 1024))


if __name__ == '__main__':
    main()
