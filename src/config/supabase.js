import { createClient } from '@supabase/supabase-js';
import supabaseConfig from './supabaseConfig';

// Créer le client Supabase
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);

// Helper pour obtenir l'utilisateur actuel
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper pour obtenir les infos complètes de l'utilisateur (avec rôle)
export const getUserProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

// Helper pour vérifier le rôle
export const hasRole = async (role) => {
  const profile = await getUserProfile();
  return profile?.role === role;
};

// Helper pour se connecter
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
};

// Helper pour se déconnecter
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Helper pour créer un utilisateur (simplifié pour admin_master)
export const createUserAccount = async (email, password, displayName, role) => {
  try {
    // Créer un client temporaire pour l'inscription sans affecter la session actuelle
    const tempClient = createClient(supabaseConfig.url, supabaseConfig.anonKey);

    // 1. Créer l'utilisateur dans auth
    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Échec de la création du compte');

    // 2. Créer le profil dans la table users (avec le client principal)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email,
        display_name: displayName,
        role
      })
      .select()
      .single();

    if (userError) throw userError;

    return userData;
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    throw error;
  }
};

// Helper pour écouter les changements d'authentification
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// ============================================
// GESTION DES UTILISATEURS (pour admin_master)
// ============================================

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateUser = async (userId, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;
};

// ============================================
// MATIÈRES (SUBJECTS)
// ============================================

export const getSubjects = async () => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createSubject = async (name, code, description, createdBy) => {
  const { data, error } = await supabase
    .from('subjects')
    .insert([{ name, code, description, created_by: createdBy }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// EXAMENS (EXAMS)
// ============================================

export const getExams = async () => {
  const { data, error } = await supabase
    .from('exams')
    .select('*, subject:subjects(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getExamById = async (examId) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*, subject:subjects(*)')
    .eq('id', examId)
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// STATIONS
// ============================================

export const getStationsByExam = async (examId) => {
  const { data, error} = await supabase
    .from('stations')
    .select('*')
    .eq('exam_id', examId)
    .order('order');

  if (error) throw error;
  return data || [];
};

// ============================================
// ÉTUDIANTS (STUDENTS)
// ============================================

export const getStudentsByExam = async (examId) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('exam_id', examId)
    .order('last_name');

  if (error) throw error;
  return data || [];
};

export const createStudent = async (examId, firstName, lastName, studentNumber) => {
  const { data, error } = await supabase
    .from('students')
    .insert([{
      exam_id: examId,
      first_name: firstName,
      last_name: lastName,
      student_number: studentNumber
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const importStudents = async (examId, studentsArray) => {
  const studentsData = studentsArray.map(s => ({
    exam_id: examId,
    first_name: s.firstName,
    last_name: s.lastName,
    student_number: s.studentNumber
  }));

  const { data, error } = await supabase
    .from('students')
    .insert(studentsData)
    .select();

  if (error) throw error;
  return data;
};

export const deleteStudent = async (studentId) => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

  if (error) throw error;
};

// ============================================
// NOTES (GRADES)
// ============================================

export const getGradesByExam = async (examId) => {
  const { data, error } = await supabase
    .from('grades')
    .select('*, student:students(*), station:stations(*)')
    .eq('exam_id', examId);

  if (error) throw error;
  return data || [];
};

export const saveGrade = async (examId, stationId, studentId, userId, grades, totalScore) => {
  // Vérifier si une note existe déjà
  const { data: existing } = await supabase
    .from('grades')
    .select('id')
    .eq('student_id', studentId)
    .eq('station_id', stationId)
    .single();

  if (existing) {
    // Mettre à jour
    const { data, error } = await supabase
      .from('grades')
      .update({
        grades,
        total_score: totalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Créer
    const { data, error } = await supabase
      .from('grades')
      .insert([{
        exam_id: examId,
        station_id: stationId,
        student_id: studentId,
        user_id: userId,
        grades,
        total_score: totalScore
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ============================================
// CRUD COMPLET - MATIÈRES
// ============================================

export const updateSubject = async (subjectId, name, code, description) => {
  const { data, error } = await supabase
    .from('subjects')
    .update({ name, code, description })
    .eq('id', subjectId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSubject = async (subjectId) => {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId);

  if (error) throw error;
};

// ============================================
// CRUD COMPLET - EXAMENS
// ============================================

export const createExam = async (subjectId, name, code, active = true) => {
  const { data, error } = await supabase
    .from('exams')
    .insert([{
      subject_id: subjectId,
      name,
      code,
      active
    }])
    .select('*, subject:subjects(*)')
    .single();

  if (error) throw error;
  return data;
};

export const updateExam = async (examId, updates) => {
  const { data, error } = await supabase
    .from('exams')
    .update(updates)
    .eq('id', examId)
    .select('*, subject:subjects(*)')
    .single();

  if (error) throw error;
  return data;
};

export const deleteExam = async (examId) => {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId);

  if (error) throw error;
};

// ============================================
// CRUD COMPLET - STATIONS
// ============================================

export const createStation = async (examId, name, criteria, maxScore, order) => {
  const { data, error } = await supabase
    .from('stations')
    .insert([{
      exam_id: examId,
      name,
      criteria,
      max_score: maxScore,
      order
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateStation = async (stationId, updates) => {
  const { data, error } = await supabase
    .from('stations')
    .update(updates)
    .eq('id', stationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteStation = async (stationId) => {
  const { error } = await supabase
    .from('stations')
    .delete()
    .eq('id', stationId);

  if (error) throw error;
};

// ============================================
// CRUD COMPLET - ÉTUDIANTS (déjà implémenté ci-dessus)
// ============================================

// createStudent, importStudents, deleteStudent déjà définis

export const updateStudent = async (studentId, firstName, lastName, studentNumber) => {
  const { data, error } = await supabase
    .from('students')
    .update({
      first_name: firstName,
      last_name: lastName,
      student_number: studentNumber
    })
    .eq('id', studentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// TEMPS RÉEL (REAL-TIME)
// ============================================

export const subscribeToGrades = (examId, callback) => {
  const channel = supabase
    .channel('grades-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'grades',
        filter: `exam_id=eq.${examId}`
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return channel;
};

export const unsubscribe = async (channel) => {
  await supabase.removeChannel(channel);
};

export default supabase;
