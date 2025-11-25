# 📝 CODE SQL À COPIER - Étape par Étape

## PARTIE 1 : Création des Tables (à copier dans SQL Editor)

```sql
-- ============================================
-- TABLES POUR LE SYSTÈME DE NOTATION
-- ============================================

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (avec rôles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE,
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

-- Index pour performances
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_exams_subject_id ON exams(subject_id);
CREATE INDEX idx_stations_exam_id ON stations(exam_id);
CREATE INDEX idx_students_exam_id ON students(exam_id);
CREATE INDEX idx_grades_exam_id ON grades(exam_id);
CREATE INDEX idx_grades_station_id ON grades(station_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
```

**Instructions :**
1. SÉLECTIONNEZ TOUT ce code (du début "CREATE EXTENSION" jusqu'à la fin)
2. COPIEZ-LE (Ctrl+C ou Cmd+C)
3. COLLEZ-LE dans SQL Editor
4. CLIQUEZ sur "Run" (en bas à droite)

Vous devriez voir : ✅ "Success. No rows returned"

---

## PARTIE 2 : Row Level Security (Sécurité)

**Créez une NOUVELLE requête** (cliquez sur + New query)

**COPIEZ et COLLEZ ce code** :

```sql
-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Fonctions helper
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_master()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND role = 'admin_master'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_teacher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
    AND role = 'admin_teacher'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- POLICIES
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_all" ON users FOR ALL TO authenticated USING (is_admin_master()) WITH CHECK (is_admin_master());

CREATE POLICY "subjects_select" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "subjects_all" ON subjects FOR ALL TO authenticated USING (is_admin_master()) WITH CHECK (is_admin_master());

CREATE POLICY "exams_select" ON exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "exams_insert" ON exams FOR INSERT TO authenticated WITH CHECK (is_admin_master());
CREATE POLICY "exams_update" ON exams FOR UPDATE TO authenticated USING (
  is_admin_master() OR (is_admin_teacher() AND admin_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
);

CREATE POLICY "stations_select" ON stations FOR SELECT TO authenticated USING (true);
CREATE POLICY "stations_all" ON stations FOR ALL TO authenticated USING (
  is_admin_master() OR is_admin_teacher()
);

CREATE POLICY "students_select" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "students_all" ON students FOR ALL TO authenticated USING (is_admin_master() OR is_admin_teacher());

CREATE POLICY "grades_select" ON grades FOR SELECT TO authenticated USING (true);
CREATE POLICY "grades_all" ON grades FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**CLIQUEZ sur "Run"**

Vous devriez voir : ✅ "Success. No rows returned"

---

✅ **C'EST FAIT ! Vos tables sont créées !**
