# 📱 CHAF - Instructions d'Installation

## 🖼️ Étape 1 : Placer le Logo

**IMPORTANT** : Placez votre image de logo CHAF avec le nom `logo-chaf.png` dans le dossier :
```
/home/user/azerty/public/logo-chaf.png
```

Le logo sera automatiquement utilisé pour :
- ✅ L'icône du navigateur (favicon)
- ✅ L'icône de l'application PWA (Android)
- ✅ Le logo dans l'interface
- ✅ L'icône pour iOS (Apple Touch Icon)

---

## 📱 Installation sur Android (PWA)

### Option 1 : Via Navigateur Chrome/Edge

1. Ouvrez l'application dans **Chrome** ou **Edge** sur votre téléphone Android
2. L'URL sera quelque chose comme : `https://votre-domaine.com` ou `http://localhost:5173`
3. Appuyez sur le menu ⋮ (trois points en haut à droite)
4. Sélectionnez **"Ajouter à l'écran d'accueil"** ou **"Installer l'application"**
5. Une icône **CHAF** avec votre logo apparaîtra sur l'écran d'accueil
6. Cliquez sur l'icône pour lancer l'application en mode plein écran !

### Option 2 : Via Firefox

1. Ouvrez l'application dans **Firefox** sur Android
2. Appuyez sur le menu ⋮
3. Sélectionnez **"Installer"** ou **"Ajouter à l'écran d'accueil"**
4. Confirmez l'installation

### ✨ Avantages de l'application Android (PWA)

- 🚀 Lance comme une application native
- 📱 Icône sur l'écran d'accueil avec votre logo
- 🎨 Plein écran (pas de barre d'adresse)
- ⚡ Fonctionne hors ligne (une fois chargée)
- 🔄 Se met à jour automatiquement

---

## 💻 Installation sur Desktop (Windows/Mac/Linux)

### Option 1 : Installation PWA via Chrome/Edge

1. Ouvrez l'application dans **Chrome** ou **Edge** sur votre ordinateur
2. Dans la barre d'adresse, cherchez l'icône d'installation (➕ ou 💻)
3. Cliquez sur **"Installer CHAF"**
4. L'application s'installe comme une application Windows/Mac/Linux
5. Un raccourci **CHAF** avec votre logo apparaît sur le bureau
6. Double-cliquez pour lancer l'application !

### Option 2 : Créer un Raccourci Manuel

**Windows :**
1. Créez un fichier `CHAF.bat` sur le bureau :
```batch
@echo off
start chrome --app=http://localhost:5173
```

2. Créez un raccourci de ce fichier
3. Cliquez droit sur le raccourci → Propriétés
4. Changez l'icône : Parcourir → Sélectionnez `/public/logo-chaf.png`

**Mac :**
1. Ouvrez **Automator**
2. Créez une nouvelle **Application**
3. Ajoutez l'action **"Exécuter un script Shell"**
4. Entrez :
```bash
open -a "Google Chrome" --args --app=http://localhost:5173
```
5. Sauvegardez comme **"CHAF.app"** sur le bureau
6. Cliquez droit → Obtenir des informations → Glissez votre logo sur l'icône

**Linux :**
1. Créez un fichier `CHAF.desktop` dans `~/.local/share/applications/` :
```desktop
[Desktop Entry]
Name=CHAF
Comment=Système de Notation EPOS
Exec=google-chrome --app=http://localhost:5173
Icon=/home/user/azerty/public/logo-chaf.png
Type=Application
Categories=Education;Medical;
```
2. Rendez-le exécutable : `chmod +x ~/.local/share/applications/CHAF.desktop`
3. Le raccourci apparaîtra dans le menu des applications

---

## 🚀 Déploiement en Production

### Pour Android/iOS en ligne

1. Déployez l'application sur un serveur HTTPS (requis pour PWA)
2. Les utilisateurs pourront installer l'application depuis n'importe quel navigateur
3. L'icône CHAF avec votre logo apparaîtra automatiquement

### Hébergement Recommandé

- **Vercel** : `vercel --prod`
- **Netlify** : `netlify deploy --prod`
- **Firebase** : `firebase deploy`

Après déploiement, votre application sera accessible via :
```
https://chaf-votre-nom.vercel.app
```

Et installable sur **tous les appareils** (Android, iOS, Desktop) !

---

## 🔧 Build de Production

```bash
npm run build
```

Les fichiers optimisés seront dans le dossier `dist/`.

---

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. **Logo visible** : Le logo CHAF apparaît dans l'interface
2. **PWA détectée** : Chrome affiche l'icône d'installation
3. **Manifest valide** : Ouvrez DevTools → Application → Manifest
4. **Icône correcte** : L'icône utilise votre logo

---

## 📞 Support

En cas de problème :
- Vérifiez que `/public/logo-chaf.png` existe
- Vérifiez que le serveur est en HTTPS (pour PWA en production)
- Videz le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
- Réinstallez l'application PWA

---

## 🎉 Résultat Final

Vous aurez :
- ✅ Application web complète
- ✅ Application Android avec icône CHAF sur l'écran d'accueil
- ✅ Application Desktop avec raccourci et logo
- ✅ Fonctionne hors ligne
- ✅ Installation en un clic

**Professionnel et pratique !** 🚀
