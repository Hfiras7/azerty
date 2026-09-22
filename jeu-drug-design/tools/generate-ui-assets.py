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
SS = 8   # suréchantillonnage pour un rendu lissé
NET = 2  # facteur de résolution des visuels du bilan : le moteur les
         # affiche à ~1,1x, les sortir à 2x les garde nets en plein écran

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
    """
    Case à cocher (carré arrondi pour un QCM, pastille pour un choix
    unique). Elle est affichée à 39 px par le moteur : on la dessine
    nettement plus grande pour rester nette sur un écran à forte densité.
    """
    T = 120
    im, d = toile(T, T)
    m = round(3 * SS * T / 50)      # marge
    box = [m, m, T * SS - m, T * SS - m]
    rayon = (T * SS - 2 * m) // 2 if ronde else round(13 * SS * T / 50)

    if cochee:
        fond = degrade_vertical(d, box, TEAL_CLAIR, TEAL, rayon)
        im.alpha_composite(fond, (m, m))
        d.rounded_rectangle(box, radius=rayon, outline=TEAL, width=round(2 * SS * T / 50))
        # coche
        k = SS * T / 50.0
        pts = [(16.5 * k, 25.5 * k), (22 * k, 31.5 * k), (34 * k, 18.5 * k)]
        d.line(pts, fill=BLANC, width=round(4 * k), joint="curve")
        for p in (pts[0], pts[2]):
            r = 2 * k
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=BLANC)
    else:
        e = round(2 * SS * T / 50)
        d.rounded_rectangle(box, radius=rayon, fill=BLANC, outline=BORDURE, width=e)
        d.rounded_rectangle([box[0] + e, box[1] + e, box[2] - e, box[3] - e],
                            radius=max(1, rayon - e), outline=(236, 242, 247),
                            width=max(1, round(SS * T / 50)))
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
    return reduire(im, L * NET, H * NET)

def barre_masque():
    L, H = 306, 20
    im = Image.new("RGBA", (L * SS, H * SS), TRACE + (255,))
    masque = Image.new("L", im.size, 255)
    ImageDraw.Draw(masque).rounded_rectangle([SS, SS, L * SS - SS, H * SS - SS],
                                             radius=9 * SS, fill=0)
    im.putalpha(masque)
    return reduire(im, L * NET, H * NET)


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
    return reduire(im, T * NET, T * NET)


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
    f = police(int(8.8 * SS), gras=False)
    encre_libelle = melange(ENCRE, (70, 92, 114), .15)
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
    return reduire(im, L * 3, H * 3)


def chargeur():
    """
    Visuel affiché pendant le chargement (css/ludiScapeLoad.*).

    L'export affichait le logo de l'outil auteur ; on le remplace par un
    repère neutre aux couleurs du jeu. Mêmes dimensions que l'original.
    """
    L, H = 157, 51
    im, d = toile(L, H)
    T = H * SS

    # molécule : trois atomes reliés
    cx, cy = int(24 * SS), T // 2
    noeuds = [(cx, cy - int(11 * SS)), (cx + int(13 * SS), cy + int(5 * SS)),
              (cx - int(13 * SS), cy + int(5 * SS))]
    for i in range(3):
        d.line([noeuds[i], noeuds[(i + 1) % 3]], fill=melange(TEAL, BLANC, .25),
               width=int(2.4 * SS))
    for i, n in enumerate(noeuds):
        r = int(5 * SS) if i == 0 else int(4 * SS)
        d.ellipse([n[0] - r, n[1] - r, n[0] + r, n[1] + r],
                  fill=TEAL if i != 1 else AMBRE)

    f = police(int(22 * SS))
    d.text((int(46 * SS), T // 2), "EPOS", font=f, fill=ENCRE, anchor="lm")
    fp = police(int(8 * SS), gras=False)
    d.text((int(47 * SS), T // 2 + int(13 * SS)), "DRUG DESIGN", font=fp,
           fill=melange(ENCRE, BLANC, .45), anchor="lm")
    return reduire(im, L, H)


# ------------------------------------------------- annotation « à la main »
def fleche_annotation(indice, total=4):
    """
    Flèche d'annotation tracée progressivement (4 images).
    Le moteur l'affiche à 100x50 : on la dessine à 400x200 pour rester
    nette, et dans l'ambre de la charte plutôt que dans un rouge vif
    étranger à la palette.
    """
    L, H = 100, 50
    im, d = toile(L, H)
    T = SS
    couleur = (176, 107, 5)          # ambre sombre : lisible sur fond clair
    # tracé légèrement irrégulier, comme une annotation à main levée
    axe = [(6, 34), (24, 31), (46, 29.4), (68, 28.2), (86, 27.4)]
    part = (indice + 1) / float(total)
    n = max(2, int(round(len(axe) * min(1.0, part * 1.25))))
    pts = [(x * T, y * T) for x, y in axe[:n]]
    if len(pts) >= 2:
        d.line(pts, fill=couleur, width=int(5.2 * T), joint="curve")
        for p in (pts[0], pts[-1]):
            r = 2.6 * T
            d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=couleur)
    # pointe : seulement sur les deux dernières images, comme un tracé
    if indice >= total - 2:
        ouverture = 1.0 if indice == total - 1 else 0.55
        bout = (88 * T, 27 * T)
        for dx, dy in ((-17, -13), (-17, 15)):
            d.line([bout, (bout[0] + dx * T * ouverture, bout[1] + dy * T * ouverture)],
                   fill=couleur, width=int(5.2 * T), joint="curve")
    return reduire(im, L * 4, H * 4)


def stylet():
    """
    Repère d'annotation qui accompagne le tracé de la flèche.

    L'export d'origine utilisait une main de dessin animé, très éloignée
    du reste du jeu et assez grande pour recouvrir un bouton. Elle est
    remplacée par un stylet aux couleurs de la charte, dont la pointe
    occupe le même angle de l'image : l'animation du moteur reste calée.
    """
    T = 800
    im, d = toile(T, T)
    S = SS

    def seg(p0, p1, largeur, couleur):
        d.line([(p0[0] * S, p0[1] * S), (p1[0] * S, p1[1] * S)],
               fill=couleur, width=int(largeur * S), joint="curve")

    # axe du stylet : pointe en haut à gauche, comme dans l'image d'origine
    pointe = (26, 104)
    talon = (486, 296)
    ux, uy = talon[0] - pointe[0], talon[1] - pointe[1]
    lon = (ux * ux + uy * uy) ** 0.5
    ux, uy = ux / lon, uy / lon
    def le(t): return (pointe[0] + ux * t, pointe[1] + uy * t)

    # ombre portée douce
    ombre = Image.new("RGBA", im.size, (0, 0, 0, 0))
    do = ImageDraw.Draw(ombre)
    do.line([((pointe[0] + 10) * S, (pointe[1] + 16) * S), ((talon[0] + 10) * S, (talon[1] + 16) * S)],
            fill=(11, 34, 57, 60), width=int(30 * S), joint="curve")
    im.alpha_composite(ombre)

    seg(le(0), le(34), 9, (44, 58, 72))                 # nib
    seg(le(30), le(58), 19, (150, 168, 184))            # cône métal
    seg(le(54), le(150), 27, TEAL_CLAIR)                # zone de préhension
    seg(le(146), le(360), 29, ENCRE_CLAIR)              # corps
    seg(le(352), le(lon), 27, ENCRE)                    # talon
    # liserés
    seg(le(148), le(156), 30, TEAL)
    seg(le(352), le(360), 30, TEAL)
    # clip
    a1, a2 = le(250), le(340)
    d.line([(a1[0] * S - 13 * S, a1[1] * S + 12 * S), (a2[0] * S - 13 * S, a2[1] * S + 12 * S)],
           fill=(178, 194, 208), width=int(7 * S), joint="curve")
    # reflet longitudinal
    b1, b2 = le(60), le(350)
    d.line([(b1[0] * S, b1[1] * S - 8 * S), (b2[0] * S, b2[1] * S - 8 * S)],
           fill=(255, 255, 255, 70), width=int(5 * S), joint="curve")
    return reduire(im, T, T)


def main():
    os.chdir(ROOT)
    os.makedirs("fx/qcm", exist_ok=True)
    case(False).save("fx/qcm/carre0.png")
    case(True).save("fx/qcm/carre1.png")
    case(False, ronde=True).save("fx/qcm/check0.png")
    case(True, ronde=True).save("fx/qcm/check1.png")

    for prefixe, taille, accent in (("", 260, TEAL), ("b", 240, TEAL), ("c", 240, VERT)):
        for i in range(25):
            minuteur(i, taille=taille, accent_froid=accent).save(f"fx/time/time{prefixe}{i}.png")

    ch = chargeur()
    ch.save("css/ludiScapeLoad.png")
    ch.convert("P", palette=Image.ADAPTIVE, colors=255).save(
        "css/ludiScapeLoad.gif", transparency=255)
    # le jeu n'utilise que la flèche horizontale : on s'en tient au jeu
    # d'images présent dans l'export d'origine
    for i in range(4):
        fleche_annotation(i).save(f"images/hand-arrow-right{i}.png")
    stylet().save("images/hand-cartoon.png")
    bilan_icone().save("images/bilan.png")
    libelles_domaines().save("images/LibellesDomaines.png")
    barre_fond().save("images/progress-bar-fond.png")
    barre_masque().save("images/progress-bar-mask.png")
    print("Éléments d'interface régénérés.")


if __name__ == "__main__":
    main()
