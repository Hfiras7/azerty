# -*- coding: utf-8 -*-
"""
Génération des éléments d'interface du jeu EPOS (cases à cocher, minuteur,
barre de score final). Les fichiers produits remplacent les images d'origine
du moteur Ludiscape, en conservant strictement leurs noms et leurs dimensions
afin de ne modifier aucun comportement du jeu.

Usage : python3 tools/generate-ui-assets.py
"""
import math, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SS = 4  # suréchantillonnage pour un rendu lissé

# ---------------------------------------------------------------- palette
ENCRE       = (11, 34, 57)       # bleu nuit « laboratoire »
ENCRE_CLAIR = (31, 63, 94)
TRACE       = (223, 233, 241)    # gris-bleu très clair
BORDURE     = (148, 169, 188)
TEAL        = (0, 151, 169)      # accent principal (identité d'origine)
TEAL_CLAIR  = (34, 197, 214)
AMBRE       = (232, 151, 26)
ROUGE       = (219, 62, 68)
VERT        = (35, 165, 114)
BLANC       = (255, 255, 255)

FONT_DIR = "/usr/share/fonts/truetype/dejavu"

def police(taille, gras=True):
    nom = "DejaVuSans-Bold.ttf" if gras else "DejaVuSans.ttf"
    return ImageFont.truetype(os.path.join(FONT_DIR, nom), taille)

def melange(c1, c2, t):
    return tuple(int(round(a + (b - a) * t)) for a, b in zip(c1, c2))

def toile(w, h):
    im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)

def reduire(im, w, h):
    return im.resize((w, h), Image.LANCZOS)

def degrade_vertical(draw, box, haut, bas, rayon=0):
    """Remplit une zone d'un dégradé vertical (approximé ligne par ligne)."""
    x0, y0, x1, y1 = box
    calque = Image.new("RGBA", (int(x1 - x0), int(y1 - y0)), (0, 0, 0, 0))
    d = ImageDraw.Draw(calque)
    hauteur = int(y1 - y0)
    for i in range(hauteur):
        d.line([(0, i), (int(x1 - x0), i)], fill=melange(haut, bas, i / max(1, hauteur - 1)))
    if rayon:
        masque = Image.new("L", calque.size, 0)
        ImageDraw.Draw(masque).rounded_rectangle([0, 0, calque.size[0] - 1, calque.size[1] - 1],
                                                 radius=rayon, fill=255)
        calque.putalpha(masque)
    return calque


# ------------------------------------------------------- cases à cocher
def case(cochee, ronde=False):
    """Case à cocher 50x50 : carré arrondi (QCM) ou pastille (choix unique)."""
    T = 50
    im, d = toile(T, T)
    m = 3 * SS                      # marge
    box = [m, m, T * SS - m, T * SS - m]
    rayon = (T * SS - 2 * m) // 2 if ronde else 13 * SS

    if cochee:
        fond = degrade_vertical(d, box, TEAL_CLAIR, TEAL, rayon)
        im.alpha_composite(fond, (m, m))
        d.rounded_rectangle(box, radius=rayon, outline=TEAL, width=2 * SS)
        # coche
        pts = [(16.5 * SS, 25.5 * SS), (22 * SS, 31.5 * SS), (34 * SS, 18.5 * SS)]
        d.line(pts, fill=BLANC, width=4 * SS, joint="curve")
        for p in (pts[0], pts[2]):
            r = 2 * SS
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=BLANC)
    else:
        d.rounded_rectangle(box, radius=rayon, fill=BLANC, outline=BORDURE, width=2 * SS)
        d.rounded_rectangle([box[0] + 2 * SS, box[1] + 2 * SS, box[2] - 2 * SS, box[3] - 2 * SS],
                            radius=max(1, rayon - 2 * SS), outline=(236, 242, 247), width=SS)
    return reduire(im, T, T)


# ------------------------------------------------------------- minuteur
def minuteur(indice, total_frames=25, duree=60, taille=100, accent_froid=TEAL):
    """
    Anneau de progression du temps restant.
    L'image `time*<i>.png` est affichée après i intervalles de (duree/total_frames).
    """
    im, d = toile(taille, taille)
    T = taille * SS
    restant = max(0.0, 1.0 - indice / float(total_frames))
    secondes = int(math.ceil(duree * restant))

    if restant > 0.5:
        couleur = accent_froid
    elif restant > 0.2:
        couleur = melange(AMBRE, accent_froid, (restant - 0.2) / 0.3 * 0.35)
    else:
        couleur = ROUGE

    marge = 7 * SS
    box = [marge, marge, T - marge, T - marge]
    epaisseur = 9 * SS

    # disque de fond
    d.ellipse([marge - 3 * SS, marge - 3 * SS, T - marge + 3 * SS, T - marge + 3 * SS],
              fill=(255, 255, 255, 240))
    # piste
    d.ellipse(box, outline=TRACE, width=epaisseur)
    # arc de temps restant (sens horaire depuis midi)
    if restant > 0.001:
        d.arc(box, start=-90, end=-90 + 360 * restant, fill=couleur, width=epaisseur)
    # liseré interne
    d.ellipse([box[0] + epaisseur, box[1] + epaisseur, box[2] - epaisseur, box[3] - epaisseur],
              outline=(240, 245, 249), width=SS)

    # compteur
    f = police(int(30 * SS * taille / 100))
    txt = str(secondes)
    bb = d.textbbox((0, 0), txt, font=f)
    d.text(((T - (bb[2] - bb[0])) / 2 - bb[0], T / 2 - (bb[3] - bb[1]) / 2 - bb[1] - 4 * SS),
           txt, font=f, fill=ENCRE)
    fs = police(int(11 * SS * taille / 100), gras=False)
    bb2 = d.textbbox((0, 0), "sec", font=fs)
    d.text(((T - (bb2[2] - bb2[0])) / 2 - bb2[0], T / 2 + 12 * SS * taille / 100),
           "sec", font=fs, fill=melange(ENCRE, BLANC, 0.45))
    return reduire(im, taille, taille)


# --------------------------------------------------- barre de score final
def barre_fond():
    L, H = 395, 46
    im, d = toile(L, H)
    pilule = [0, 0, L * SS, H * SS]
    fond = degrade_vertical(d, pilule, ENCRE_CLAIR, ENCRE, 23 * SS)
    im.alpha_composite(fond, (0, 0))
    d.rounded_rectangle(pilule, radius=23 * SS, outline=(70, 108, 141), width=SS)
    # piste interne, alignée sur le masque (15,13) 306x20
    d.rounded_rectangle([15 * SS, 13 * SS, 321 * SS, 33 * SS], radius=10 * SS, fill=TRACE)
    d.rounded_rectangle([15 * SS, 13 * SS, 321 * SS, 33 * SS], radius=10 * SS,
                        outline=(196, 211, 224), width=SS)
    return reduire(im, L, H)

def barre_masque():
    L, H = 306, 20
    im = Image.new("RGBA", (L * SS, H * SS), TRACE + (255,))
    masque = Image.new("L", im.size, 255)
    ImageDraw.Draw(masque).rounded_rectangle([SS, SS, L * SS - SS, H * SS - SS],
                                             radius=9 * SS, fill=0)
    im.putalpha(masque)
    return reduire(im, L, H)


def bilan_icone():
    """Icône du résumé de parcours : fiche d'analyse + molécule."""
    T = 250
    im, d = toile(T, T)
    S = T * SS

    # fiche
    fiche = [30 * SS, 24 * SS, 196 * SS, 226 * SS]
    d.rounded_rectangle([fiche[0] + 5 * SS, fiche[1] + 7 * SS, fiche[2] + 5 * SS, fiche[3] + 5 * SS],
                        radius=14 * SS, fill=(11, 34, 57, 36))
    d.rounded_rectangle(fiche, radius=14 * SS, fill=BLANC, outline=(206, 220, 232), width=2 * SS)
    entete = degrade_vertical(d, [fiche[0], fiche[1], fiche[2], fiche[1] + 44 * SS],
                              ENCRE_CLAIR, ENCRE, 12 * SS)
    im.alpha_composite(entete, (fiche[0], fiche[1]))
    d.rectangle([fiche[0], fiche[1] + 32 * SS, fiche[2], fiche[1] + 44 * SS], fill=ENCRE)
    for i, l in enumerate((110, 76, 96)):
        y = fiche[1] + (62 + i * 17) * SS
        d.rounded_rectangle([fiche[0] + 16 * SS, y, fiche[0] + (16 + l) * SS, y + 7 * SS],
                            radius=4 * SS, fill=(216, 228, 238))

    # histogramme
    base = fiche[3] - 22 * SS
    for i, (h, c) in enumerate(((44, TEAL), (72, (109, 95, 224)), (58, AMBRE), (86, VERT))):
        x = fiche[0] + (20 + i * 39) * SS
        d.rounded_rectangle([x, base - h * SS, x + 26 * SS, base], radius=6 * SS, fill=c)
    d.line([fiche[0] + 14 * SS, base + 4 * SS, fiche[2] - 14 * SS, base + 4 * SS],
           fill=(196, 211, 224), width=2 * SS)

    # molécule en médaillon
    cx, cy, r = 188 * SS, 74 * SS, 46 * SS
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BLANC, outline=(206, 220, 232), width=2 * SS)
    noeuds = [(cx, cy - 24 * SS), (cx + 22 * SS, cy - 10 * SS), (cx + 22 * SS, cy + 16 * SS),
              (cx, cy + 28 * SS), (cx - 22 * SS, cy + 16 * SS), (cx - 22 * SS, cy - 10 * SS)]
    for i in range(6):
        d.line([noeuds[i], noeuds[(i + 1) % 6]], fill=(120, 146, 170), width=3 * SS)
    for i, n in enumerate(noeuds):
        col = TEAL if i % 3 == 0 else (ROUGE if i == 2 else (140, 162, 184))
        d.ellipse([n[0] - 7 * SS, n[1] - 7 * SS, n[0] + 7 * SS, n[1] + 7 * SS], fill=col)
    return reduire(im, T, T)


def libelles_domaines():
    """
    Étiquettes des quatre domaines sous l'histogramme du bilan.

    Ce visuel est une image pré-calculée par l'outil auteur : il doit donc
    être régénéré pour refléter les libellés corrigés. Les graduations sont
    alignées sur le centre des barres (23,5 % + 16 % x k de la largeur).
    """
    L, H = 300, 85
    im, d = toile(L, H)
    libelles = [
        (("Docking", "moléculaire"), TEAL),
        (("Propriétés", "physico-chimiques"), (109, 95, 224)),
        (("Propriétés", "pharmacocinétiques"), AMBRE),
        (("Pharmaco-", "modulation"), VERT),
    ]
    f = police(int(8 * SS), gras=False)
    encre_libelle = melange(ENCRE, (96, 116, 136), .2)
    for k, (lignes, couleur) in enumerate(libelles):
        x = (70.9 + 47.9 * k) * SS
        d.line([(x, 0), (x, 5 * SS)], fill=couleur, width=int(1.6 * SS))
        d.ellipse([x - 2.4 * SS, 5 * SS, x + 2.4 * SS, 9.8 * SS], fill=couleur)

        mesure = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
        boites = [mesure.textbbox((0, 0), t, font=f) for t in lignes]
        larg = max(b[2] - b[0] for b in boites) + 3 * SS
        interligne = int(10.5 * SS)
        vignette = Image.new("RGBA", (int(larg), interligne * len(lignes) + 2 * SS), (0, 0, 0, 0))
        dv = ImageDraw.Draw(vignette)
        for j, t in enumerate(lignes):
            dv.text((0 - boites[j][0], j * interligne - boites[j][1] + SS), t,
                    font=f, fill=encre_libelle)
        tournee = vignette.rotate(45, expand=True, resample=Image.BICUBIC)
        im.alpha_composite(tournee, (int(x - tournee.width + 7 * SS), int(10 * SS)))
    return reduire(im, L, H)


def main():
    os.chdir(ROOT)
    os.makedirs("fx/qcm", exist_ok=True)
    case(False).save("fx/qcm/carre0.png")
    case(True).save("fx/qcm/carre1.png")
    case(False, ronde=True).save("fx/qcm/check0.png")
    case(True, ronde=True).save("fx/qcm/check1.png")

    for prefixe, taille, accent in (("", 220, TEAL), ("b", 100, TEAL), ("c", 100, VERT)):
        for i in range(25):
            minuteur(i, taille=taille, accent_froid=accent).save(f"fx/time/time{prefixe}{i}.png")

    bilan_icone().save("images/bilan.png")
    libelles_domaines().save("images/LibellesDomaines.png")
    barre_fond().save("images/progress-bar-fond.png")
    barre_masque().save("images/progress-bar-mask.png")
    print("Éléments d'interface régénérés.")


if __name__ == "__main__":
    main()
