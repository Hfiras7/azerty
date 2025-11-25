# 🚀 Prototype Version 3.0 - Firebase + PWA + Système de Rôles

## 📝 Vue d'Ensemble

Ce prototype démontre les nouvelles fonctionnalités demandées :

### ✅ Fonctionnalités Implémentées

1. **🔥 Backend Firebase**
   - Synchronisation temps réel via Internet
   - Base de données Firestore
   - Authentication sécurisée

2. **👥 Système de Rôles Hiérarchique**
   - **Admin Master** : Contrôle total du système
   - **Admin Enseignant** : Gère un examen spécifique
   - **Utilisateur** : Note uniquement les étudiants

3. **📚 Gestion Matières/Examens**
   - Sélection de la matière
   - Sélection de l'examen
   - Protection par code d'accès

4. **🔐 Sécurité**
   - Authentification email/mot de passe
   - Code de protection par examen
   - Règles de sécurité Firestore

5. **📱 PWA (Progressive Web App)**
   - Installable sur Android
   - Fonctionne offline (données en cache)
   - Icônes et splash screens

## 🎯 Scénarios d'Utilisation

### Scénario 1 : Admin Master

1. **Connexion** : Email + Mot de passe
2. **Créer une Matière** : "Pharmacologie", "Chimie", etc.
3. **Créer un Examen** : "Examen Janvier 2025"
4. **Générer un Code** : "PHARM2025"
5. **Assigner un Admin Enseignant** : Créer un compte pour un prof
6. **Voir le Dashboard Global** : Tous les examens, toutes les matières

### Scénario 2 : Admin Enseignant

1. **Recevoir les Identifiants** : De l'Admin Master
2. **Connexion** : Email + Mot de passe
3. **Sélectionner l'Examen** : Celui qui lui est assigné
4. **Entrer le Code** : "PHARM2025"
5. **Créer des Utilisateurs Notateurs** : Inviter des profs pour noter
6. **Configurer les Stations** : Définir les grilles d'évaluation
7. **Gérer les Étudiants** : Importer la liste

### Scénario 3 : Utilisateur (Notateur)

1. **Recevoir les Identifiants** : De l'Admin Enseignant
2. **Connexion** : Email + Mot de passe
3. **Sélectionner la Matière** : "Pharmacologie"
4. **Sélectionner l'Examen** : "Examen Janvier 2025"
5. **Entrer le Code** : "PHARM2025"
6. **Choisir sa Station** : Station 3
7. **Noter les Étudiants** : Interface de notation

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│           FRONTEND (React + PWA)             │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Admin   │  │  Admin   │  │   User   │  │
│  │  Master  │  │ Teacher  │  │ Notateur │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│       │              │              │       │
│       └──────────────┼──────────────┘       │
│                      │                      │
└──────────────────────┼──────────────────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │   FIREBASE BACKEND    │
           ├───────────────────────┤
           │ • Authentication      │
           │ • Firestore Database  │
           │ • Real-time Sync      │
           │ • Security Rules      │
           └───────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    [Android]      [iOS]        [Web]
```

## 🗄️ Structure Firestore

```
📁 Firestore Database
├── 👥 users
│   ├── {userId}
│   │   ├── email
│   │   ├── role (admin_master | admin_teacher | user)
│   │   ├── displayName
│   │   ├── examId (si admin_teacher ou user)
│   │   └── createdAt
│
├── 📚 subjects
│   ├── {subjectId}
│   │   ├── name
│   │   ├── code
│   │   ├── description
│   │   └── createdBy
│
├── 📝 exams
│   ├── {examId}
│   │   ├── name
│   │   ├── subjectId
│   │   ├── code (protection)
│   │   ├── adminId (admin enseignant)
│   │   ├── active
│   │   └── createdAt
│
├── 🎯 stations
│   ├── {stationId}
│   │   ├── examId
│   │   ├── name
│   │   ├── criteria[]
│   │   └── maxScore
│
├── 🎓 students
│   ├── {studentId}
│   │   ├── examId
│   │   ├── firstName
│   │   ├── lastName
│   │   └── number
│
└── 📊 grades
    ├── {gradeId}
    │   ├── examId
    │   ├── stationId
    │   ├── studentId
    │   ├── userId (qui a noté)
    │   ├── grades{}
    │   ├── totalScore
    │   └── gradedAt
```

## 🚦 Workflow Complet

### 1. Configuration Initiale (Admin Master)

```
Admin Master
    │
    ├── Créer Matière "Pharmacologie"
    │
    ├── Créer Examen "Examen Janvier 2025"
    │   └── Générer Code: "PHARM2025"
    │
    ├── Créer Admin Enseignant
    │   ├── Email: prof.martin@univ.fr
    │   ├── Password: ********
    │   └── Assigner à l'examen
    │
    └── Dashboard: Vue globale
```

### 2. Configuration Examen (Admin Enseignant)

```
Admin Enseignant (Prof. Martin)
    │
    ├── Connexion avec code examen
    │
    ├── Configurer Stations
    │   ├── Station 1: Vitamine C
    │   ├── Station 2: Antipyrine
    │   └── Station 3: Paracétamol
    │
    ├── Importer Étudiants (50 étudiants)
    │
    ├── Créer Utilisateurs Notateurs
    │   ├── prof.dupont@univ.fr (Station 1)
    │   ├── prof.bernard@univ.fr (Station 2)
    │   └── prof.durand@univ.fr (Station 3)
    │
    └── Partager Code: "PHARM2025"
```

### 3. Notation (Utilisateur)

```
Utilisateur (Prof. Dupont)
    │
    ├── Connexion
    │
    ├── Entrer Code: "PHARM2025"
    │
    ├── Sélectionner Station 1
    │
    ├── Noter Étudiants
    │   ├── Étudiant 1: 18/20
    │   ├── Étudiant 2: 16/20
    │   └── ... (48 autres)
    │
    └── Synchronisation Auto ✓
```

## 📱 Installation sur Android

### Méthode 1 : Via Navigateur

1. Ouvrez Chrome sur Android
2. Allez sur l'URL de l'app
3. Menu (⋮) > "Ajouter à l'écran d'accueil"
4. L'icône apparaît comme une app native

### Méthode 2 : Via PWA

1. L'app détecte Android
2. Bannière "Installer l'application"
3. Cliquez sur "Installer"
4. L'app s'installe comme native

## 🧪 Tester le Prototype

### Étape 1 : Configuration Firebase

Voir `FIREBASE_SETUP.md` pour la configuration complète

### Étape 2 : Lancer l'Application

```bash
npm run dev
```

### Étape 3 : Créer le Premier Admin

1. Créez un utilisateur dans Firebase Authentication
2. Ajoutez-le dans Firestore avec role: "admin_master"

### Étape 4 : Tester les Fonctionnalités

**Test Admin Master:**
- ✅ Créer une matière
- ✅ Créer un examen
- ✅ Créer un admin enseignant
- ✅ Voir le dashboard global

**Test Admin Enseignant:**
- ✅ Se connecter avec le code
- ✅ Configurer les stations
- ✅ Importer des étudiants
- ✅ Créer des utilisateurs

**Test Utilisateur:**
- ✅ Se connecter avec le code
- ✅ Choisir une station
- ✅ Noter des étudiants
- ✅ Voir la synchronisation

## 🔐 Sécurité du Prototype

### Règles Firestore Implémentées

- Admin Master : Accès total
- Admin Enseignant : Accès limité à son examen
- Utilisateur : Lecture de tout, écriture des notes uniquement

### Protection par Code

- Chaque examen a un code unique
- Vérification à la connexion
- Code requis pour accéder aux données

## 📊 Avantages de Cette Architecture

1. **Scalabilité** : Firebase gère automatiquement la charge
2. **Temps Réel** : Synchronisation instantanée entre utilisateurs
3. **Offline** : Fonctionne sans connexion (cache local)
4. **Sécurité** : Règles granulaires par rôle
5. **Multi-plateforme** : Android, iOS, Web
6. **Gratuit** : Plan gratuit Firebase suffisant pour ~10,000 utilisateurs/mois

## 🎨 Prochaines Étapes

Après validation du prototype :

1. **Phase 1** : Finaliser l'UI pour chaque rôle
2. **Phase 2** : Optimiser les performances
3. **Phase 3** : Ajouter notifications push
4. **Phase 4** : Déploiement production
5. **Phase 5** : Tests utilisateurs réels

## 📞 Feedback

Testez le prototype et donnez votre feedback sur :
- La navigation entre rôles
- La sélection matière/examen
- La protection par code
- L'installation Android
- La synchronisation temps réel

---

**Status** : ✨ Prototype Fonctionnel Prêt à Tester
