# -*- coding: utf-8 -*-
"""
Assemble les images rendues du pharmacien en fichiers utilisables par le jeu.

Les cycles de marche sont enregistrés en PNG animé (APNG) plutôt qu'en GIF :
le GIF ne gère qu'une transparence binaire, ce qui crée un liseré disgracieux
sur les fonds clairs comme sur les fonds sombres du jeu.

Usage : python3 tools/assembler-personnage.py
"""
import os, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'render', 'out', 'perso')
DST = os.path.join(ROOT, 'images')
CYCLE = 960  # durée d'un cycle de marche (ms), valeur d'origine du jeu


def charger(nom):
    return Image.open(os.path.join(SRC, nom)).convert('RGBA')


def assembler(prefixe, nom):
    """Assemble la pose et les quatre cycles de marche d'un personnage."""
    pose = charger(prefixe + 'pose.png')
    pose.save(os.path.join(DST, nom + '-pose.png'), optimize=True)
    print(f'{nom}-pose.png', pose.size)

    for direction in ('bas', 'haut', 'gauche', 'droite'):
        sortie = f'{nom}-{direction}.png'
        fichiers = sorted(glob.glob(os.path.join(SRC, prefixe + direction + '-*.png')))
        if not fichiers:
            raise SystemExit('images manquantes pour la direction ' + direction)
        images = [Image.open(f).convert('RGBA') for f in fichiers]
        chemin = os.path.join(DST, sortie)
        # optimize=True découpe chaque image en sous-rectangle ; combiné à
        # disposal=2 (effacement du fond), les parties immobiles — les
        # jambes — disparaissaient dès la deuxième image. On écrit donc des
        # images pleines qui remplacent intégralement la précédente.
        # la cadence s'adapte au nombre d'images : le cycle garde la même
        # durée, quel que soit le nombre de poses rendues
        duree = max(40, round(CYCLE / len(images)))
        images[0].save(chemin, save_all=True, append_images=images[1:],
                       duration=duree, loop=0, optimize=False,
                       disposal=1, blend=0)
        taille = os.path.getsize(chemin)
        print(f'{sortie:24s} {len(images)} images, {images[0].size}, {taille//1024} Kio')


def vignette_choix(prefixe, nom):
    """
    Portrait détouré pour l'écran de choix du personnage : la pose de
    repos recadrée au plus près, sans la marge transparente du cadre de
    jeu, sinon la silhouette paraît minuscule dans sa vignette.
    """
    im = charger(prefixe + 'pose.png')
    boite = im.split()[-1].getbbox()
    if boite:
        marge = 6
        g, h, d, b = boite
        g = max(0, g - marge); h = max(0, h - marge)
        d = min(im.width, d + marge); b = min(im.height, b + marge)
        im = im.crop((g, h, d, b))
    hauteur = 560
    im = im.resize((max(1, round(im.width * hauteur / im.height)), hauteur),
                   Image.LANCZOS)
    chemin = os.path.join(DST, 'choix-' + nom + '.png')
    im.save(chemin, optimize=True)
    print(f'choix-{nom}.png{"":13s} {im.size}, {os.path.getsize(chemin)//1024} Kio')


def main():
    assembler('', 'pharmacien')
    assembler('f-', 'pharmacienne')
    vignette_choix('', 'pharmacien')
    vignette_choix('f-', 'pharmacienne')
    presentation()


def presentation():
    fichiers = sorted(glob.glob(os.path.join(SRC, 'presente-*.png')))
    if not fichiers:
        raise SystemExit('images de présentation manquantes')
    images = [Image.open(f).convert('RGBA') for f in fichiers]
    chemin = os.path.join(DST, 'pharmacienne-presente.png')
    images[0].save(chemin, save_all=True, append_images=images[1:],
                   duration=max(40, round(1400 / len(images))), loop=0,
                   optimize=False, disposal=1, blend=0)
    print(f"pharmacienne-presente.png {len(images)} images, {images[0].size}, "
          f"{os.path.getsize(chemin)//1024} Kio")


if __name__ == '__main__':
    main()
