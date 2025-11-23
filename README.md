# 🎓 Application de Notation - Stations d'Examen

Application web complète pour la notation des étudiants lors d'examens pratiques en stations (type ECOS - Examen Clinique Objectif Structuré). Développée en React avec Vite.

## 🌟 Fonctionnalités Principales

### 1. Gestion des Étudiants
- ✅ Ajout manuel d'étudiants (nom, prénom, numéro)
- ✅ Import depuis fichiers CSV ou Excel (.xlsx, .xls)
- ✅ Recherche et filtrage des étudiants
- ✅ Export de la liste des étudiants en CSV
- ✅ Suppression individuelle des étudiants

### 2. Stations d'Examen
L'application inclut 5 stations d'examen pré-configurées :

#### Station 3 - Dosage de la Vitamine C
- Préparation et manipulation (4 pts)
- Réalisation du titrage (6 pts)
- Calculs et résultats (6 pts)
- Interprétation et discussion (4 pts)

#### Station 4A - Antipyrine
- Identification du principe actif (5 pts)
- Dosage spectrophotométrique (7 pts)
- Calculs et résultats (5 pts)
- Compte rendu (3 pts)

#### Station 4B - Acide Méfénamique
- Identification du principe actif (5 pts)
- Dosage par titrimétrie (7 pts)
- Calculs et résultats (5 pts)
- Compte rendu (3 pts)

#### Station 4C - Paracétamol
- Identification du principe actif (5 pts)
- Dosage par HPLC (7 pts)
- Calculs et résultats (5 pts)
- Compte rendu (3 pts)

#### Station 4D - Aspirine
- Identification du principe actif (5 pts)
- Dosage acido-basique (7 pts)
- Calculs et résultats (5 pts)
- Compte rendu (3 pts)

### 3. Interface de Notation
- ✅ Notation simultanée de 4 étudiants en parallèle
- ✅ Grilles d'évaluation détaillées avec tous les critères
- ✅ Calcul automatique des scores par critère
- ✅ Calcul automatique de la note finale /20
- ✅ Sauvegarde automatique des notes
- ✅ Statistiques en temps réel (moyenne, nombre d'étudiants notés)
- ✅ Réinitialisation des notes par étudiant

### 4. Export des Résultats
- ✅ Export vers Excel (.xlsx) avec détails complets
- ✅ Export vers PDF avec tableau récapitulatif et fiches individuelles
- ✅ Filtres : tous les étudiants, uniquement notés, uniquement non notés
- ✅ Statistiques détaillées (moyenne, min, max)
- ✅ Aperçu avant export

### 5. Sauvegarde Locale
- ✅ Toutes les données sont sauvegardées automatiquement dans le navigateur (localStorage)
- ✅ Persistance entre les sessions
- ✅ Synchronisation entre onglets du même navigateur

## 🚀 Installation et Lancement

### Prérequis
- Node.js (version 14 ou supérieure)
- npm ou yarn

### Installation
```bash
# Installer les dépendances
npm install
```

### Lancement en mode développement
```bash
# Démarrer le serveur de développement
npm run dev
```
L'application sera accessible sur `http://localhost:5173/`

### Build pour production
```bash
# Créer la version de production
npm run build

# Prévisualiser la version de production
npm run preview
```

## 📖 Guide d'Utilisation

### Étape 1 : Ajouter des Étudiants
1. Allez dans l'onglet **"Gestion des Étudiants"**
2. Option A : Ajoutez manuellement les étudiants via le formulaire
3. Option B : Importez une liste depuis un fichier CSV/Excel
   - Format attendu : `Nom, Prénom, Numéro` (une ligne par étudiant)

### Étape 2 : Sélectionner une Station
1. Allez dans l'onglet **"Sélection de Station"**
2. Cliquez sur la carte de la station que vous souhaitez utiliser
3. Vous serez automatiquement redirigé vers l'interface de notation

### Étape 3 : Noter les Étudiants
1. Dans l'onglet **"Notation"**, sélectionnez jusqu'à 4 étudiants dans les menus déroulants
2. Pour chaque critère, attribuez une note selon la grille d'évaluation
3. Les scores sont calculés automatiquement
4. Les notes sont sauvegardées automatiquement (ou manuellement avec le bouton)

### Étape 4 : Exporter les Résultats
1. Allez dans l'onglet **"Export des Résultats"**
2. Sélectionnez la station d'examen
3. Choisissez le filtre (tous / notés / non notés)
4. Consultez les statistiques et l'aperçu
5. Cliquez sur "Exporter vers Excel" ou "Exporter vers PDF"

## 🛠️ Technologies Utilisées

- **React 18** - Framework JavaScript
- **Vite** - Build tool et dev server
- **XLSX** - Import/Export Excel
- **jsPDF** + **jsPDF-AutoTable** - Génération de PDF
- **PapaParse** - Parsing CSV
- **localStorage** - Sauvegarde locale des données

## 📁 Structure du Projet

```
exam-rating-app/
├── src/
│   ├── components/          # Composants React
│   │   ├── StudentManagement.jsx
│   │   ├── StationSelector.jsx
│   │   ├── GradingInterface.jsx
│   │   └── ExportResults.jsx
│   ├── config/              # Configuration
│   │   └── stationConfigs.js
│   ├── hooks/               # Custom hooks
│   │   └── useLocalStorage.js
│   ├── utils/               # Utilitaires
│   │   └── exportUtils.js
│   ├── App.jsx              # Composant principal
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## ⚙️ Personnalisation

### Modifier les Grilles d'Évaluation
Les grilles sont définies dans `src/config/stationConfigs.js`. Vous pouvez :
- Modifier les critères existants
- Ajouter de nouveaux critères
- Ajuster les pondérations
- Ajouter de nouvelles stations

### Exemple de structure d'une station :
```javascript
stationX: {
  id: 'stationX',
  name: 'Nom de la Station',
  maxScore: 20,
  criteria: [
    {
      id: 'criterion1',
      name: 'Nom du Critère',
      maxPoints: 5,
      items: [
        { id: 'item1', label: 'Description', points: 2 },
        { id: 'item2', label: 'Description', points: 3 }
      ]
    }
  ]
}
```

## 🔒 Sécurité et Confidentialité

- **Toutes les données restent locales** : Aucune donnée n'est envoyée à un serveur externe
- Les données sont stockées uniquement dans le localStorage du navigateur
- Pour effacer toutes les données : utilisez le bouton "Réinitialiser" ou videz le cache du navigateur

## 📊 Format des Fichiers d'Import

### CSV
```csv
Nom,Prénom,Numéro
Dupont,Jean,001
Martin,Sophie,002
Bernard,Pierre,003
```

### Excel
| Nom | Prénom | Numéro |
|-----|--------|--------|
| Dupont | Jean | 001 |
| Martin | Sophie | 002 |
| Bernard | Pierre | 003 |

## 🐛 Dépannage

### Problème : Les données ne se sauvegardent pas
- Vérifiez que le localStorage est activé dans votre navigateur
- Vérifiez que vous n'êtes pas en navigation privée
- Vérifiez l'espace disponible dans le localStorage

### Problème : L'import CSV/Excel ne fonctionne pas
- Vérifiez le format du fichier (virgule ou point-virgule comme séparateur)
- Assurez-vous que la première ligne contient les en-têtes
- Vérifiez l'encodage du fichier (UTF-8 recommandé)

## 📝 Licence

Ce projet est libre d'utilisation à des fins éducatives et non commerciales.

## 👥 Contribution

Pour toute suggestion ou amélioration, n'hésitez pas à créer une issue ou une pull request.

## 📞 Support

Pour toute question ou problème, veuillez consulter la documentation ou contacter l'équipe de développement.

---

Développé avec ❤️ pour faciliter l'évaluation des étudiants en pharmacie
