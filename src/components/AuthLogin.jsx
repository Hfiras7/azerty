import { useState } from 'react';
import { signIn, getUserProfile } from '../config/supabase';
import './AuthLogin.css';

/**
 * Composant d'authentification - Version 3.0
 * Permet la connexion avec email/mot de passe
 * Supporte les rôles: admin_master, admin_teacher, user
 */
function AuthLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);

  // Comptes de démonstration (en attendant Supabase)
  const demoAccounts = [
    {
      email: 'admin@ecole.fr',
      password: 'admin123',
      role: 'admin_master',
      displayName: 'Administrateur Principal',
      examId: null
    },
    {
      email: 'prof.martin@ecole.fr',
      password: 'prof123',
      role: 'admin_teacher',
      displayName: 'Prof. Martin',
      examId: 'exam1' // Assigné à l'examen "Examen Janvier 2025"
    },
    {
      email: 'prof.dupont@ecole.fr',
      password: 'user123',
      role: 'user',
      displayName: 'Prof. Dupont',
      examId: 'exam1'
    },
    {
      email: 'prof.bernard@ecole.fr',
      password: 'user123',
      role: 'user',
      displayName: 'Prof. Bernard',
      examId: 'exam1'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      // Tentative de connexion avec Supabase
      await signIn(email, password);

      // Récupérer le profil utilisateur
      const profile = await getUserProfile();

      if (!profile) {
        setError('Profil utilisateur introuvable');
        return;
      }

      // Connexion réussie
      const userData = {
        email: profile.email,
        role: profile.role,
        displayName: profile.display_name,
        examId: profile.exam_id,
        loginTime: new Date().toISOString()
      };

      // Sauvegarder dans localStorage
      localStorage.setItem('current_user', JSON.stringify(userData));

      // Appeler le callback
      onLogin(userData);
    } catch (error) {
      console.error('Erreur de connexion:', error);

      // Messages d'erreur personnalisés
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter');
      } else {
        setError('Erreur de connexion. Vérifiez votre connexion internet.');
      }
    }
  };

  const handleDemoLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin_master: { icon: '👑', label: 'Admin Master', color: '#e74c3c' },
      admin_teacher: { icon: '🎓', label: 'Admin Enseignant', color: '#3498db' },
      user: { icon: '✍️', label: 'Notateur', color: '#2ecc71' }
    };
    return badges[role] || badges.user;
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>🎓 CHAF - Notation ECOS</h1>
          <p>Version 4.5 - Authentification Supabase</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">📧 Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@ecole.fr"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">🔒 Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-login">
            🚀 Se connecter
          </button>
        </form>

        {showDemoAccounts && (
          <div className="demo-accounts">
            <div className="demo-header">
              <h3>💡 Comptes de démonstration</h3>
              <button
                className="btn-close-demo"
                onClick={() => setShowDemoAccounts(false)}
              >
                ✕
              </button>
            </div>
            <p className="demo-subtitle">
              Cliquez sur un compte pour tester les différents rôles :
            </p>

            <div className="demo-accounts-grid">
              {demoAccounts.map((account, index) => {
                const badge = getRoleBadge(account.role);
                return (
                  <div
                    key={index}
                    className="demo-account-card"
                    onClick={() => handleDemoLogin(account)}
                  >
                    <div className="demo-account-header">
                      <span className="demo-account-icon">{badge.icon}</span>
                      <span
                        className="demo-account-badge"
                        style={{ backgroundColor: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="demo-account-info">
                      <p className="demo-account-name">{account.displayName}</p>
                      <p className="demo-account-email">{account.email}</p>
                      <p className="demo-account-password">
                        🔑 {account.password}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="demo-info">
              <p>
                <strong>ℹ️ Authentification Supabase :</strong> Pour tester, créez
                ces comptes dans Supabase (Authentication → Users). L'authentification
                est maintenant réelle et sécurisée !
              </p>
            </div>
          </div>
        )}

        <div className="auth-footer">
          <p>
            🔒 Connexion sécurisée avec Supabase
            <span className="separator">•</span>
            CHAF v4.5 - Auth réelle + Données locales
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLogin;
