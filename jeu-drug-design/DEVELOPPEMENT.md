# EPOS — Initiation au Drug Design

Jeu sérieux de chimie thérapeutique (Faculté de Pharmacie de Monastir).
Parcours en 4 stations : propriétés physico-chimiques, propriétés
pharmacocinétiques prédites *in silico*, pharmacomodulation et docking
moléculaire, sur le cas de l'acide salicylique / de l'aspirine.

Cette version est **le jeu d'origine** (export Ludiscape), auquel ont été
appliqués une refonte visuelle et une relecture linguistique. Le moteur, le
déroulé, les questions, les réponses correctes et le barème sont inchangés.

## Lancer le jeu

Le jeu est une application web statique : `Lancer le jeu.bat` sous
Windows, ou l'ouverture directe de `index.html`. Le moteur embarque une
copie des diapositives dans `javascript/page.js` (tableau `poff`), il ne
lit donc pas `data/*.xml` par requête réseau et fonctionne en `file://`.

Pour le développement, servir le dossier reste commode :

```bash
python3 -m http.server 8000     # puis http://localhost:8000/
```

## Enregistrement des résultats

Le classeur `.xlsx` est fabriqué dans le navigateur par
`javascript/epos-xlsx.js` — une archive ZIP à entrées stockées et
quelques fichiers XML, sans bibliothèque externe ni réseau. Les parties
terminées sont conservées dans `localStorage` (clé `epos.resultats`,
500 parties au maximum) ; le bouton de l'écran de résultat fabrique le
fichier et le remet au navigateur, qui le dépose dans le dossier
Téléchargements.

Il n'y a plus de service local ni de dépendance à Python : les versions
antérieures passaient par `tools/serveur-resultats.py`, retiré de la
livraison.

## Organisation des fichiers

| Chemin | Rôle |
| --- | --- |
| `index.html` | page hôte : chargement du moteur et des feuilles de style |
| `data/pageN.xml` | contenu d'une diapositive (énoncés, propositions, barème) |
| `javascript/page.js` | **copie hors ligne** des mêmes diapositives, utilisée en priorité par le moteur |
| `javascript/ludiscape.js` | moteur Ludiscape (non modifié, hors une faute d'accord corrigée) |
| `javascript/jsadd.js` | point d'extension : décor moléculaire 3D et retouches d'affichage |
| `css/ludiscape.css` | feuille de style du moteur (non modifiée) |
| `css/cssadd.css` | surcouche visuelle « chimie computationnelle » |
| `css/fonts/` | polices Instrument Sans et JetBrains Mono (licence OFL, incluses) |
| `fx/`, `images/` | éléments graphiques (cases à cocher, minuteur, illustrations) |
| `javascript/epos-resultats.js` | relevé du résultat et transmission au service d'enregistrement |
| `Lancer le jeu.bat`, `Lancer le jeu.sh` | ouverture du jeu dans le navigateur |
| `javascript/epos-xlsx.js` | fabrication du classeur `.xlsx` dans le navigateur |

| `tools/` | scripts de régénération des éléments d'interface et des illustrations |
| `tools/render/` | chaîne de rendu 3D (three.js + Chromium) des illustrations |

### Règle importante : `data/` et `page.js` vont par paire

Le moteur embarque une copie de chaque diapositive dans `javascript/page.js`
et **l'utilise en priorité** sur les fichiers `data/pageN.xml`. Toute
modification d'un XML doit donc être répercutée :

```bash
python3 tools/sync-page-js.py
```

Le script vérifie la correspondance et ne réécrit que les entrées modifiées.

### Régénérer les éléments d'interface

```bash
python3 tools/generate-ui-assets.py      # nécessite Pillow
```

Ce script reconstruit, aux mêmes noms et aux mêmes dimensions que les
fichiers d'origine :

* `fx/qcm/carre0|carre1|check0|check1.png` — cases à cocher ;
* `fx/time/time[b|c]0..24.png` — anneau de minuteur (25 images pour 60 s,
  avec affichage du temps restant) ;
* `images/progress-bar-fond.png`, `images/progress-bar-mask.png` — barre de
  score final ;
* `images/bilan.png` — pictogramme du résumé de parcours ;
* `images/LibellesDomaines.png` — étiquettes sous l'histogramme du bilan.

> Le minuteur affiche un décompte en secondes calculé pour une durée de
> **60 s**, valeur utilisée par toutes les questions du jeu (`<text>60000</text>`
> dans les blocs `timer`). Si une durée différente était introduite, il
> faudrait régénérer les images avec le paramètre `duree` correspondant.

### Régénérer les illustrations 3D

Les décors, le personnage et les vignettes sont des rendus three.js
exécutés hors ligne dans Chromium, puis exportés en PNG. Un seul banc
d'éclairage sert à toutes les scènes : c'est ce qui leur donne une
identité commune.

```bash
cd tools/render
curl -o vendor/three.min.js https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
node render.mjs '[["transition-2",1920,1440,"tools/render/out/t2.png",false]]'
node perso.mjs 482 742 8            # pharmacien : pose + cycles de marche
cd ..
python3 tools/assembler-personnage.py      # assemble les PNG animés
python3 tools/installer-illustrations.py   # installe dans images/ et met à jour data/
python3 tools/sync-page-js.py              # répercute dans la copie hors ligne
python3 tools/formule-acide-salicylique.py # formule développée haute résolution
```

### Scripts de correction

| Script | Rôle |
| --- | --- |
| `tools/retirer-filigrane.py` | retire le bloc « version demo » des diapositives |
| `tools/corriger-contraste.py` | éclaircit les titres posés sur un fond devenu sombre |
| `tools/corriger-scene-accueil.py` | zone d'action au sol, collision, repère d'entrée |
| `tools/transitions.py` | remet les diapositives en transition « Direct » |

Tous sont idempotents : les relancer après une modification des données ne
produit pas d'effet de bord. Penser à `tools/sync-page-js.py` ensuite.

Scènes disponibles dans `tools/render/scenes.js` : `transition-2`,
`transition-3`, `transition-4`, `labo-accueil`, `icone-objectifs`,
`icone-prerequis`, `icone-stations`, `icone-deroulement`,
`icone-message`, `icone-action`.

Les cycles de marche sont enregistrés en **PNG animé (APNG)** et non en
GIF : le GIF ne gère qu'une transparence binaire, ce qui produit un liseré
visible aussi bien sur les fonds clairs que sur les fonds sombres.

## Identité visuelle

* Décor : bleu nuit de laboratoire, hélice protéique et molécule d'aspirine
  en projection 3D animée (canvas, sans bibliothèque externe), derrière la
  scène de jeu.
* Scène : « papier de paillasse » très légèrement quadrillé d'un motif
  hexagonal, pour rester parfaitement lisible.
* Accent principal : le turquoise `#0097A9` déjà présent dans le jeu
  d'origine, complété par un violet `#6D5FE0`, un ambre et un vert.
* Typographie : Instrument Sans pour l'interface, JetBrains Mono pour les
  chaînes SMILES et les valeurs chiffrées.
* Illustrations : rendus 3D maison (molécules en boules-et-bâtons, surface
  protéique, bicouche lipidique, paillasse), tous éclairés par le même banc
  — lumière principale haut-gauche, contre-jour turquoise, appoint violet.
* Personnages : un pharmacien et une pharmacienne en blouse, modélisés et
  animés en 3D, qui remplacent l'ouvrier au casque jaune et la scène
  isométrique d'origine.
* Enchaînement : l'apparition de chaque diapositive est animée par la
  surcouche (`#main.epos-entree`). La transition native du moteur n'est
  pas utilisée : elle emprunte un chemin de code qui appelle `amplify`,
  bibliothèque absente de cet export.
* Lisibilité : aucun texte du jeu ne descend sous un écart de luminance de
  60 niveaux avec son fond, mesuré sur le rendu réel des 40 diapositives.
* L'animation du décor s'arrête si le système déclare
  `prefers-reduced-motion`.

## Ce qui n'a pas été modifié

* Les questions, leur formulation, leur ordre et leurs propositions (hors
  fautes d'orthographe et de typographie).
* Les réponses correctes, les barèmes (`note`, `negnote`) et le rattachement
  des questions aux domaines évalués.
* Le minutage (60 s par question), la navigation, le déplacement du
  personnage et le calcul du score.
* Le filigrane « Ludiscape version demo » a été retiré des diapositives à
  la demande de l'auteur du jeu. Il signalait que l'export provenait d'une
  version de démonstration de l'outil auteur : la conformité vis-à-vis de
  la licence Ludiscape relève de l'auteur.
* Les captures d'écran scientifiques (SwissADME, pkCSM, radars de
  biodisponibilité, schéma de la réaction de pharmacomodulation, logos des
  outils) : ce sont les données sur lesquelles portent les questions.
