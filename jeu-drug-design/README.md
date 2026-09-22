# EPOS — Initiation au Drug Design

Jeu sérieux de chimie thérapeutique — Faculté de Pharmacie de Monastir.
Parcours en 4 stations : propriétés physico-chimiques, propriétés
pharmacocinétiques prédites *in silico*, pharmacomodulation et docking
moléculaire, sur le cas de l'acide salicylique / de l'aspirine.

## 1. Lancer le jeu

**Double-cliquez sur `Lancer le jeu.bat`.**

Le jeu s'ouvre dans votre navigateur. C'est tout.

*(macOS et Linux : `Lancer le jeu.sh`, ou ouvrez `index.html`.)*

## 2. Télécharger les résultats

À la fin du parcours, l'écran de résultat affiche un bouton
**« Télécharger les résultats »**.

Un clic suffit : le fichier Excel est créé et téléchargé aussitôt.

Le fichier contient une ligne par partie :

| Nom de l'étudiant | Date | Heure | Score total (%) | Station 1 … | Station 2 … | Station 3 … | Station 4 … |
| --- | --- | --- | --- | --- | --- | --- | --- |

Les parties jouées sur le même ordinateur s'accumulent : un seul
téléchargement en fin de séance rassemble tous les étudiants passés sur
ce poste. Le nom n'est jamais un identifiant — un étudiant qui rejoue
produit une nouvelle ligne.

## 3. Où trouver le fichier

Dans le dossier **Téléchargements** de Windows, sous un nom de la forme :

```
Resultats_Jeu_Pharmacie_Nom_Etudiant_20260922-1435.xlsx
```

Ouvrez-le avec Excel, LibreOffice Calc ou Google Sheets.

## 4. Prérequis

**Aucun.** Un navigateur récent (Edge, Chrome ou Firefox), déjà présent
sur tout PC Windows.

- Pas d'installation
- Pas de Python
- Pas de serveur
- **Pas de connexion Internet** : tout est local

## 5. Distribution

Copiez le dossier entier (clé USB, réseau, dossier partagé). Le jeu
fonctionne depuis n'importe quel emplacement.

---

Le dossier `tools/` ne sert qu'à régénérer les illustrations 3D lors du
développement ; il n'est pas nécessaire pour jouer. Les détails
techniques (organisation des fichiers, moteur, chaîne de rendu) sont
dans [`DEVELOPPEMENT.md`](DEVELOPPEMENT.md).
