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


def main():
    pose = charger('pose.png')
    pose.save(os.path.join(DST, 'pharmacien-pose.png'), optimize=True)
    print('pharmacien-pose.png', pose.size)

    for direction, sortie in (('bas', 'pharmacien-bas.png'),
                              ('haut', 'pharmacien-haut.png'),
                              ('gauche', 'pharmacien-gauche.png'),
                              ('droite', 'pharmacien-droite.png')):
        fichiers = sorted(glob.glob(os.path.join(SRC, direction + '-*.png')))
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
