# 🔥 Configuration Firebase - Guide Complet

## Étape 1 : Créer un Projet Firebase

1. Allez sur https://console.firebase.google.com/
2. Cliquez sur "Ajouter un projet"
3. Nommez votre projet (ex: "exam-rating-system")
4. Acceptez les conditions et créez le projet

## Étape 2 : Activer l'Authentication

1. Dans le menu Firebase, allez dans **Authentication**
2. Cliquez sur "Commencer"
3. Dans l'onglet "Sign-in method" :
   - Activez **E-mail/Mot de passe**
   - Cliquez sur "Activer" puis "Enregistrer"

## Étape 3 : Créer Firestore Database

1. Dans le menu Firebase, allez dans **Firestore Database**
2. Cliquez sur "Créer une base de données"
3. Choisissez "Démarrer en mode test" (nous configurerons les règles après)
4. Sélectionnez un emplacement (ex: europe-west1)
5. Cliquez sur "Activer"

## Étape 4 : Obtenir la Configuration

1. Dans les paramètres du projet (⚙️ à côté de "Vue d'ensemble du projet")
2. Faites défiler jusqu'à "Vos applications"
3. Cliquez sur l'icône Web (</>) pour créer une app web
4. Donnez un nom à votre app (ex: "exam-rating-web")
5. Cochez "Configurer Firebase Hosting" (optionnel)
6. Cliquez sur "Enregistrer l'application"
7. **COPIEZ** la configuration affichée

## Étape 5 : Configurer l'Application

1. Ouvrez le fichier `src/config/firebaseConfig.js`
2. Remplacez les valeurs par celles de votre configuration :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

## Étape 6 : Configurer les Règles de Sécurité Firestore

1. Dans Firestore Database, allez dans l'onglet "Règles"
2. Copiez le contenu du fichier `firestore.rules`
3. Collez-le dans l'éditeur de règles
4. Cliquez sur "Publier"

## Étape 7 : Créer le Premier Admin Master

### Option A : Via Console Firebase (Recommandé)

1. Allez dans **Authentication** > Onglet "Users"
2. Cliquez sur "Ajouter un utilisateur"
3. Email : `admin@example.com` (ou votre email)
4. Mot de passe : Créez un mot de passe sécurisé
5. Cliquez sur "Ajouter un utilisateur"
6. **COPIEZ** l'UID de l'utilisateur créé

7. Allez dans **Firestore Database**
8. Créez une nouvelle collection nommée `users`
9. Ajoutez un document avec l'ID = UID copié précédemment
10. Ajoutez les champs suivants :
    ```
    email: "admin@example.com"
    role: "admin_master"
    displayName: "Administrateur Principal"
    createdAt: [Horodatage actuel]
    ```

### Option B : Via Script (Après premier lancement)

Une fois l'app lancée, utilisez la console du navigateur :

```javascript
// Dans la console du navigateur (F12)
// Remplacez USER_UID par l'UID de votre utilisateur
await setDoc(doc(db, 'users', 'USER_UID'), {
  email: 'admin@example.com',
  role: 'admin_master',
  displayName: 'Administrateur Principal',
  createdAt: new Date()
});
```

## Étape 8 : Structure de Données Firestore

Le système créera automatiquement ces collections :

### Collection `users`
```javascript
{
  email: string,
  role: "admin_master" | "admin_teacher" | "user",
  displayName: string,
  createdAt: timestamp,
  examId?: string  // Pour admin_teacher et user
}
```

### Collection `subjects`
```javascript
{
  name: string,
  code: string,
  description: string,
  createdBy: string,  // UID admin master
  createdAt: timestamp
}
```

### Collection `exams`
```javascript
{
  name: string,
  subjectId: string,
  code: string,  // Code de protection
  adminId: string,  // UID admin enseignant
  createdBy: string,  // UID admin master
  createdAt: timestamp,
  active: boolean
}
```

### Collection `stations`
```javascript
{
  examId: string,
  name: string,
  maxScore: number,
  criteria: array,
  order: number
}
```

### Collection `students`
```javascript
{
  examId: string,
  firstName: string,
  lastName: string,
  number: string,
  createdAt: timestamp
}
```

### Collection `grades`
```javascript
{
  examId: string,
  stationId: string,
  studentId: string,
  userId: string,  // Qui a noté
  grades: object,  // {itemId: points}
  totalScore: number,
  gradedAt: timestamp
}
```

## Étape 9 : Tester la Configuration

1. Lancez l'application : `npm run dev`
2. Ouvrez `http://localhost:5173`
3. Connectez-vous avec l'admin master créé
4. Vous devriez voir l'interface admin

## Étape 10 : Déploiement (Optionnel)

### Firebase Hosting

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser Firebase dans le projet
firebase init

# Sélectionner : Hosting, Firestore
# Build directory: dist
# Single-page app: Yes

# Build de l'application
npm run build

# Déployer
firebase deploy
```

## 🔒 Sécurité

- **NE JAMAIS** commiter `firebaseConfig.js` avec les vraies clés
- Utilisez des variables d'environnement en production
- Gardez les règles Firestore strictes
- Utilisez HTTPS uniquement

## 🐛 Dépannage

### Erreur : "Permission denied"
- Vérifiez que les règles Firestore sont publiées
- Vérifiez que l'utilisateur a le bon rôle dans Firestore

### Erreur : "Firebase not initialized"
- Vérifiez que firebaseConfig.js est correctement rempli
- Vérifiez que le projet Firebase existe

### Erreur : "Auth domain mismatch"
- Ajoutez votre domaine dans Authentication > Settings > Authorized domains

## 📞 Support

Pour toute question sur Firebase :
- Documentation : https://firebase.google.com/docs
- Support : https://firebase.google.com/support
