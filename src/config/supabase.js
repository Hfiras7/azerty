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

// Helper pour créer un utilisateur
export const createUser = async (email, password, displayName, role, examId = null) => {
  // 1. Créer l'utilisateur dans auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) throw authError;

  // 2. Créer le profil dans la table users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      auth_id: authData.user.id,
      email,
      display_name: displayName,
      role,
      exam_id: examId
    })
    .select()
    .single();

  if (userError) throw userError;

  return userData;
};

// Helper pour écouter les changements d'authentification
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

export default supabase;
