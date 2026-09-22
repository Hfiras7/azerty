# 🚀 Configuration Supabase - Guide Complet (SANS Carte Bancaire)

## ✨ Pourquoi Supabase ?

- ✅ **100% Gratuit** - Aucune carte bancaire requise
- ✅ **Backend réel** - Base de données PostgreSQL
- ✅ **Synchronisation temps réel** - WebSockets intégrés
- ✅ **Authentication** - Email, OAuth, etc.
- ✅ **Quotas généreux** :
  - 500 MB Base de données
  - 1 GB Transfert/mois
  - 2 GB Stockage fichiers
  - 50 MB Fichiers max
  - Illimité utilisateurs

---

## 📋 Étape 1 : Créer un Compte Supabase

1. Allez sur **https://supabase.com/**

2. Cliquez sur **"Start your project"** ou **"Sign Up"**

3. **Connexion** (choisissez une option) :
   ```
   ┌─────────────────────────────────┐
   │  Se connecter avec :            │
   │                                 │
   │  [GitHub]    ← Recommandé       │
   │  [Google]                       │
   │  [Email]                        │
   └─────────────────────────────────┘
   ```
   - **Recommandé** : GitHub (plus rapide)
   - Ou utilisez votre email

4. Si GitHub :
   - Cliquez sur "Continue with GitHub"
   - Autorisez Supabase
   - **AUCUNE carte bancaire demandée !**

---

## 🏗️ Étape 2 : Créer un Nouveau Projet

1. Sur le Dashboard Supabase, cliquez sur **"New Project"**

2. **Sélectionnez votre organisation** :
   - Si c'est votre première fois, une organisation sera créée automatiquement
   - Sinon, sélectionnez votre organisation

3. **Configuration du projet** :
   ```
   ┌──────────────────────────────────────────┐
   │ Nom du projet : exam-rating-system      │
   │                                          │
   │ Database Password : •••••••••••••       │
   │ (Créez un mot de passe FORT)            │
   │ ⚠️ NOTEZ-LE bien, vous en aurez besoin  │
   │                                          │
   │ Région : West Europe (Amsterdam)        │
   │ (Choisissez le plus proche de vous)     │
   │                                          │
   │ Plan : Free (0$/mois) ✓                 │
   └──────────────────────────────────────────┘
   ```

4. Cliquez sur **"Create new project"**

5. **Attendez 1-2 minutes** que le projet soit créé

---

## 🔑 Étape 3 : Récupérer les Clés API

Une fois le projet créé :

1. Allez dans **Settings** (⚙️) > **API**

2. **COPIEZ ces informations** :

   ```javascript
   Project URL : https://xxxxxxxxxxxxx.supabase.co

   anon public : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   (Clé publique - safe pour le frontend)

   service_role secret : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   (Clé privée - NE PAS exposer dans le frontend)
   ```

3. **Gardez ces clés en sécurité** (vous en aurez besoin)

---

## 🗄️ Étape 4 : Créer les Tables de la Base de Données

1. Allez dans **SQL Editor** (menu gauche)

2. Cliquez sur **"New Query"**

3. **COPIEZ et COLLEZ** ce SQL complet :

```sql
-- ============================================
-- TABLES POUR LE SYSTÈME DE NOTATION
-- ============================================

-- Table des utilisateurs (avec rôles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin_master', 'admin_teacher', 'user')),
  exam_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des matières
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des examens
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  admin_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des stations
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_score NUMERIC NOT NULL,
  criteria JSONB NOT NULL,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des étudiants
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  student_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, student_number)
);

-- Table des notes
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  grades JSONB NOT NULL,
  total_score NUMERIC NOT NULL,
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(station_id, student_id)
);

-- ============================================
-- INDEX POUR PERFORMANCES
-- ============================================

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_exams_subject_id ON exams(subject_id);
CREATE INDEX idx_stations_exam_id ON stations(exam_id);
CREATE INDEX idx_students_exam_id ON students(exam_id);
CREATE INDEX idx_grades_exam_id ON grades(exam_id);
CREATE INDEX idx_grades_station_id ON grades(station_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour obtenir le rôle de l'utilisateur actuel
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur est admin master
CREATE OR REPLACE FUNCTION is_admin_master()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND role = 'admin_master'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur est admin teacher
CREATE OR REPLACE FUNCTION is_admin_teacher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND role = 'admin_teacher'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

4. Cliquez sur **"Run"** (en bas à droite)

5. Vous devriez voir : **"Success. No rows returned"**

---

## 🔒 Étape 5 : Configurer la Sécurité (Row Level Security)

1. Toujours dans **SQL Editor**, créez une **nouvelle requête**

2. **COPIEZ et COLLEZ** ce SQL :

```sql
-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES POUR USERS
-- ============================================

-- Tout le monde peut lire les users (si authentifié)
CREATE POLICY "Users lisibles par tous authentifiés"
ON users FOR SELECT
TO authenticated
USING (true);

-- Seul admin master peut créer/modifier users
CREATE POLICY "Users modifiables par admin master"
ON users FOR ALL
TO authenticated
USING (is_admin_master())
WITH CHECK (is_admin_master());

-- ============================================
-- POLICIES POUR SUBJECTS
-- ============================================

-- Lecture pour tous authentifiés
CREATE POLICY "Subjects lisibles par tous"
ON subjects FOR SELECT
TO authenticated
USING (true);

-- Écriture pour admin master uniquement
CREATE POLICY "Subjects modifiables par admin master"
ON subjects FOR ALL
TO authenticated
USING (is_admin_master())
WITH CHECK (is_admin_master());

-- ============================================
-- POLICIES POUR EXAMS
-- ============================================

-- Lecture pour tous authentifiés
CREATE POLICY "Exams lisibles par tous"
ON exams FOR SELECT
TO authenticated
USING (true);

-- Création par admin master uniquement
CREATE POLICY "Exams créables par admin master"
ON exams FOR INSERT
TO authenticated
WITH CHECK (is_admin_master());

-- Modification par admin master ou admin teacher de l'examen
CREATE POLICY "Exams modifiables par admin concerné"
ON exams FOR UPDATE
TO authenticated
USING (
  is_admin_master() OR
  (is_admin_teacher() AND admin_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
);

-- ============================================
-- POLICIES POUR STATIONS
-- ============================================

-- Lecture pour tous
CREATE POLICY "Stations lisibles par tous"
ON stations FOR SELECT
TO authenticated
USING (true);

-- Écriture par admin master ou admin teacher de l'examen
CREATE POLICY "Stations modifiables par admin"
ON stations FOR ALL
TO authenticated
USING (
  is_admin_master() OR
  (is_admin_teacher() AND exam_id IN (
    SELECT id FROM exams WHERE admin_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  ))
);

-- ============================================
-- POLICIES POUR STUDENTS
-- ============================================

-- Lecture pour tous
CREATE POLICY "Students lisibles par tous"
ON students FOR SELECT
TO authenticated
USING (true);

-- Écriture par admin master ou admin teacher
CREATE POLICY "Students modifiables par admins"
ON students FOR ALL
TO authenticated
USING (is_admin_master() OR is_admin_teacher());

-- ============================================
-- POLICIES POUR GRADES
-- ============================================

-- Lecture pour tous
CREATE POLICY "Grades lisibles par tous"
ON grades FOR SELECT
TO authenticated
USING (true);

-- Écriture par tous authentifiés (pour noter)
CREATE POLICY "Grades modifiables par tous"
ON grades FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

3. Cliquez sur **"Run"**

4. Vous devriez voir : **"Success. No rows returned"**

---

## 🔐 Étape 6 : Activer l'Authentification Email

1. Allez dans **Authentication** > **Providers**

2. **Email** devrait déjà être activé par défaut

3. Si ce n'est pas le cas :
   - Cliquez sur **Email**
   - Activez **"Enable Email provider"**
   - Cliquez sur **"Save"**

4. **Désactivez la confirmation d'email** (pour faciliter les tests) :
   - Allez dans **Authentication** > **Settings**
   - Trouvez **"Enable email confirmations"**
   - **Désactivez-le** (pour les tests)
   - Cliquez sur **"Save"**

---

## 👤 Étape 7 : Créer le Premier Utilisateur (Admin Master)

### Option A : Via SQL (Recommandé)

1. Dans **SQL Editor**, nouvelle requête :

```sql
-- Créer un utilisateur dans auth.users (NE PAS EXÉCUTER - juste pour info)
-- Utilisez plutôt l'interface Authentication

-- Après avoir créé l'utilisateur dans Authentication,
-- créez l'entrée dans la table users avec ce SQL :
-- (Remplacez AUTH_USER_ID par l'ID de l'utilisateur créé)

INSERT INTO users (auth_id, email, display_name, role)
VALUES (
  'AUTH_USER_ID',  -- Remplacez par l'UUID de auth.users
  'admin@example.com',
  'Administrateur Principal',
  'admin_master'
);
```

### Option B : Via Interface (Plus Simple)

1. Allez dans **Authentication** > **Users**

2. Cliquez sur **"Add user"** > **"Create new user"**

3. Remplissez :
   ```
   Email : admin@example.com
   Password : VotreMotDePasseSecurisé123!

   ☑ Auto Confirm User
   ```

4. Cliquez sur **"Create user"**

5. **COPIEZ l'ID** de l'utilisateur créé (UUID)

6. Retournez dans **SQL Editor** et exécutez :
   ```sql
   INSERT INTO users (auth_id, email, display_name, role)
   VALUES (
     'PASTE_USER_UUID_HERE',
     'admin@example.com',
     'Administrateur Principal',
     'admin_master'
   );
   ```

---

## ✅ Étape 8 : Vérification

Vérifiez que tout est en place :

```
✅ Projet Supabase créé
✅ Tables créées (users, subjects, exams, stations, students, grades)
✅ Index créés
✅ Row Level Security activé
✅ Policies configurées
✅ Email authentication activé
✅ Premier admin master créé
```

---

## 📋 Étape 9 : Me Transmettre les Informations

**Envoyez-moi** :

```javascript
const supabaseConfig = {
  url: "https://xxxxx.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};

// Credentials admin
email: "admin@example.com"
password: "VotreMotDePasse"
```

---

## 🎯 Prochaines Étapes

Une fois configuré, je vais créer :

1. ✅ Interface de connexion avec Supabase Auth
2. ✅ Dashboard selon rôle (Master/Teacher/User)
3. ✅ Gestion matières/examens
4. ✅ Protection par code
5. ✅ Interface de notation avec sync temps réel
6. ✅ PWA pour Android

---

## 🆚 Supabase vs Firebase

```
┌──────────────────┬─────────────┬─────────────┐
│                  │  Supabase   │  Firebase   │
├──────────────────┼─────────────┼─────────────┤
│ Carte bancaire   │     ❌      │     ✅      │
│ Gratuit réel     │     ✅      │ Limité      │
│ Base données     │ PostgreSQL  │ Firestore   │
│ Temps réel       │     ✅      │     ✅      │
│ Open source      │     ✅      │     ❌      │
│ SQL natif        │     ✅      │     ❌      │
└──────────────────┴─────────────┴─────────────┘
```

---

## 📞 Besoin d'Aide ?

- Documentation : https://supabase.com/docs
- Discord : https://discord.supabase.com/
- Forum : https://github.com/supabase/supabase/discussions

---

**Suivez ce guide et partagez-moi les clés Supabase !** 🚀
