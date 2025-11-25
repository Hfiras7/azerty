# 🎓 Système de Notation Multi-Professeurs - Stations d'Examen

Application web complète pour la notation collaborative des étudiants lors d'examens pratiques en stations (type ECOS - Examen Clinique Objectif Structuré). Système multi-professeurs avec synchronisation en temps réel. Développée en React avec Vite.

## 🌟 Fonctionnalités Principales

### 1. Système Multi-Professeurs 🆕
- ✅ Authentification des professeurs avant utilisation
- ✅ Chaque professeur se voit attribuer UNE station spécifique
- ✅ Plusieurs professeurs peuvent travailler simultanément sur différentes stations
- ✅ Synchronisation automatique des données via localStorage
- ✅ Tableau de bord en temps réel pour suivre la progression globale
- ✅ Gestion des sessions professeur avec déconnexion sécurisée

### 2. Configuration Flexible des Stations 🆕
- ✅ Interface d'administration intuitive pour gérer les stations
- ✅ Ajout/Modification/Suppression facile des stations
- ✅ Édition complète des critères et pondérations
- ✅ Import/Export de configurations JSON
- ✅ Réinitialisation aux valeurs par défaut
- ✅ 5 stations pré-configurées incluses

### 3. Gestion des Étudiants
- ✅ Ajout manuel d'étudiants (nom, prénom, numéro)
- ✅ Import depuis fichiers CSV ou Excel (.xlsx, .xls)
- ✅ Recherche et filtrage des étudiants
- ✅ Export de la liste des étudiants en CSV
- ✅ Suppression individuelle des étudiants

### 4. Stations d'Examen
L'application inclut 5 stations d'examen pré-configurées (personnalisables via l'interface d'administration) :

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

### 5. Interface de Notation Professeur 🆕
- ✅ Chaque professeur note les étudiants pour SA station assignée
- ✅ Interface optimisée pour noter un étudiant à la fois
- ✅ Barre de progression personnelle (X/Y étudiants notés)
- ✅ Grilles d'évaluation détaillées avec tous les critères
- ✅ Calcul automatique des scores par critère en temps réel
- ✅ Calcul automatique de la note finale /20
- ✅ Boutons rapides de notation (0, 50%, Max)
- ✅ Navigation rapide vers le prochain étudiant non noté
- ✅ Sauvegarde automatique ou manuelle
- ✅ Fonction "Terminer & Suivant" pour un workflow fluide
- ✅ Récapitulatif détaillé par critère et pourcentage

### 6. Tableau de Bord Global 🆕
- ✅ Vue d'ensemble de la progression totale
- ✅ Statistiques par station (progression, moyenne)
- ✅ Compteurs : étudiants terminés, en cours, non commencés
- ✅ Liste des professeurs actifs avec leurs stations
- ✅ Matrice détaillée étudiant × station
- ✅ Indicateurs visuels de progression (barres de progression)

### 7. Export des Résultats
- ✅ Export vers Excel (.xlsx) avec détails complets
- ✅ Export vers PDF avec tableau récapitulatif et fiches individuelles
- ✅ Filtres : tous les étudiants, uniquement notés, uniquement non notés
- ✅ Statistiques détaillées (moyenne, min, max)
- ✅ Aperçu avant export

### 8. Sauvegarde et Synchronisation
- ✅ Sauvegarde automatique locale (localStorage)
- ✅ Synchronisation automatique entre professeurs
- ✅ Métadonnées de notation (qui a noté, quand)
- ✅ Gestion des sessions professeurs
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

### Configuration Initiale (Administrateur)

#### Étape 0 : Configuration des Stations (Optionnel)
1. Connectez-vous en tant que professeur
2. Cliquez sur l'onglet **"⚙️ Configuration"**
3. Gérez vos stations :
   - ➕ Ajouter de nouvelles stations
   - ✏️ Modifier les critères et pondérations
   - 🗑️ Supprimer des stations
   - 📥 Exporter votre configuration
   - 📤 Importer une configuration existante
   - 🔄 Réinitialiser aux valeurs par défaut

#### Étape 1 : Ajouter des Étudiants
1. Allez dans l'onglet **"👥 Gestion des Étudiants"**
2. Option A : Ajoutez manuellement les étudiants via le formulaire
3. Option B : Importez une liste depuis un fichier CSV/Excel
   - Format attendu : `Nom, Prénom, Numéro` (une ligne par étudiant)

### Utilisation par les Professeurs

#### Étape 2 : Connexion du Professeur
1. À l'ouverture de l'application, un écran de connexion s'affiche
2. Entrez votre **nom complet**
3. Sélectionnez **votre station** d'examen
4. Cliquez sur "Commencer la Notation"
5. Vous êtes automatiquement dirigé vers l'interface de notation de votre station

#### Étape 3 : Noter les Étudiants
1. Dans l'onglet **"✍️ Notation"** :
   - Sélectionnez un étudiant dans la liste déroulante
   - OU cliquez sur "Prochain Non Noté" pour passer au suivant automatiquement
2. Pour chaque critère, attribuez une note :
   - Saisissez manuellement la note
   - OU utilisez les boutons rapides (0, ½, Max)
3. Les scores sont calculés automatiquement en temps réel
4. Visualisez le récapitulatif détaillé en bas de page
5. Cliquez sur "✅ Terminer & Suivant" pour sauvegarder et passer à l'étudiant suivant
6. La sauvegarde est automatique ou manuelle selon vos préférences

#### Étape 4 : Suivre la Progression
1. Allez dans l'onglet **"📊 Tableau de Bord"**
2. Consultez :
   - La progression globale de tous les professeurs
   - Les statistiques par station
   - La matrice complète étudiant × station
   - Les professeurs actuellement actifs

#### Étape 5 : Exporter les Résultats
1. Allez dans l'onglet **"📥 Export des Résultats"**
2. Sélectionnez la station d'examen
3. Choisissez le filtre (tous / notés / non notés)
4. Consultez les statistiques et l'aperçu
5. Cliquez sur "📊 Exporter vers Excel" ou "📄 Exporter vers PDF"

#### Étape 6 : Déconnexion
1. Cliquez sur le bouton "🚪 Déconnexion" en haut à droite
2. Confirmez la déconnexion
3. Vous revenez à l'écran de connexion

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
│   │   ├── ProfessorLogin.jsx         # 🆕 Authentification
│   │   ├── StationAdmin.jsx           # 🆕 Administration stations
│   │   ├── ProfessorGradingInterface.jsx  # 🆕 Notation professeur
│   │   ├── ProgressDashboard.jsx      # 🆕 Tableau de bord
│   │   ├── StudentManagement.jsx
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

**Méthode 1 : Interface d'Administration (Recommandée)** 🆕
1. Connectez-vous à l'application
2. Cliquez sur "⚙️ Configuration" dans la barre de navigation
3. Utilisez l'interface visuelle pour :
   - Ajouter/Modifier/Supprimer des stations
   - Éditer les critères et items
   - Ajuster les pondérations
   - Exporter/Importer des configurations

**Méthode 2 : Modification du Code**
Les grilles par défaut sont définies dans `src/config/stationConfigs.js`. Vous pouvez :
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

## 🆕 Nouvelles Fonctionnalités (Version 2.0)

- **Système Multi-Professeurs** : Plusieurs professeurs peuvent noter simultanément
- **Authentification** : Identification obligatoire avant notation
- **Administration des Stations** : Interface graphique pour configurer les stations
- **Tableau de Bord** : Suivi en temps réel de la progression globale
- **Interface Optimisée** : Notation fluide avec boutons rapides et navigation intelligente
- **Synchronisation** : Partage automatique des données entre professeurs

---

Développé avec ❤️ pour faciliter l'évaluation collaborative des étudiants en pharmacie
