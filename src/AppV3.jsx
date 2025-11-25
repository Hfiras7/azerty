import { useState, useEffect } from 'react';
import AuthLogin from './components/AuthLogin';
import { initializeDemoData, getSubjects, getExams } from './config/demoData';
import './App.css';

/**
 * Application Version 3.0 - Système Multi-Rôles
 *
 * Rôles:
 * - admin_master: Contrôle total, gère matières/examens/admins
 * - admin_teacher: Gère un examen spécifique
 * - user: Note uniquement les étudiants
 */
function AppV3() {
  const [currentUser, setCurrentUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  // Initialiser les données de démonstration au démarrage
  useEffect(() => {
    initializeDemoData();

    // Vérifier s'il y a un utilisateur connecté
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setCurrentUser(userData);
    }

    // Charger les données
    setSubjects(getSubjects());
    setExams(getExams());
  }, []);

  // Gérer la connexion
  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      localStorage.removeItem('current_user');
      setCurrentUser(null);
    }
  };

  // Si pas connecté, afficher l'écran de connexion
  if (!currentUser) {
    return <AuthLogin onLogin={handleLogin} />;
  }

  // Router vers le bon dashboard selon le rôle
  return (
    <div className="app">
      {/* En-tête */}
      <header className="app-header-v3">
        <div className="header-content">
          <div className="header-left">
            <h1>🎓 Système de Notation ECOS v3.0</h1>
            <div className="user-info">
              <span className="user-name">{currentUser.displayName}</span>
              <span className={`user-badge role-${currentUser.role}`}>
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          </div>
          <div className="header-right">
            <button className="btn btn-logout" onClick={handleLogout}>
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Contenu selon le rôle */}
      <main className="app-main-v3">
        {currentUser.role === 'admin_master' && (
          <AdminMasterDashboard
            user={currentUser}
            subjects={subjects}
            exams={exams}
          />
        )}

        {currentUser.role === 'admin_teacher' && (
          <AdminTeacherDashboard
            user={currentUser}
            subjects={subjects}
            exams={exams}
          />
        )}

        {currentUser.role === 'user' && (
          <UserDashboard
            user={currentUser}
            subjects={subjects}
            exams={exams}
          />
        )}
      </main>
    </div>
  );
}

// Helper function pour obtenir le label du rôle
function getRoleLabel(role) {
  const labels = {
    admin_master: '👑 Admin Master',
    admin_teacher: '🎓 Admin Enseignant',
    user: '✍️ Notateur'
  };
  return labels[role] || role;
}

// Dashboard Admin Master (Contrôle total)
function AdminMasterDashboard({ user, subjects, exams }) {
  return (
    <div className="dashboard admin-master-dashboard">
      <div className="dashboard-header">
        <h2>👑 Dashboard Administrateur Principal</h2>
        <p>Vous avez un contrôle total sur le système</p>
      </div>

      <div className="dashboard-grid">
        {/* Statistiques */}
        <div className="card stats-card">
          <h3>📊 Statistiques Globales</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{subjects.length}</div>
              <div className="stat-label">Matières</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{exams.length}</div>
              <div className="stat-label">Examens</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{exams.filter(e => e.active).length}</div>
              <div className="stat-label">Actifs</div>
            </div>
          </div>
        </div>

        {/* Matières */}
        <div className="card subjects-card">
          <div className="card-header">
            <h3>📚 Matières</h3>
            <button className="btn btn-primary btn-sm">+ Nouvelle Matière</button>
          </div>
          <div className="list">
            {subjects.map(subject => (
              <div key={subject.id} className="list-item">
                <div className="list-item-info">
                  <strong>{subject.name}</strong>
                  <span className="badge">{subject.code}</span>
                </div>
                <div className="list-item-actions">
                  <button className="btn-icon">✏️</button>
                  <button className="btn-icon">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Examens */}
        <div className="card exams-card">
          <div className="card-header">
            <h3>📝 Examens</h3>
            <button className="btn btn-primary btn-sm">+ Nouvel Examen</button>
          </div>
          <div className="list">
            {exams.map(exam => {
              const subject = subjects.find(s => s.id === exam.subjectId);
              return (
                <div key={exam.id} className="list-item">
                  <div className="list-item-info">
                    <strong>{exam.name}</strong>
                    <span className="text-sm">
                      {subject?.name} • Code: {exam.code}
                    </span>
                  </div>
                  <div className="list-item-meta">
                    <span className={`badge ${exam.active ? 'badge-success' : 'badge-secondary'}`}>
                      {exam.active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="card actions-card">
          <h3>⚡ Actions Rapides</h3>
          <div className="actions-grid">
            <button className="action-btn">
              <span className="action-icon">👥</span>
              <span className="action-label">Gérer Admins Enseignants</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">📊</span>
              <span className="action-label">Voir Statistiques</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">⚙️</span>
              <span className="action-label">Configuration</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">📥</span>
              <span className="action-label">Exporter Données</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Admin Teacher (Gère un examen)
function AdminTeacherDashboard({ user, subjects, exams }) {
  const myExam = exams.find(e => e.id === user.examId);
  const subject = myExam ? subjects.find(s => s.id === myExam.subjectId) : null;

  return (
    <div className="dashboard admin-teacher-dashboard">
      <div className="dashboard-header">
        <h2>🎓 Dashboard Admin Enseignant</h2>
        {myExam && (
          <p>Vous gérez l'examen : <strong>{myExam.name}</strong> ({subject?.name})</p>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Info Examen */}
        {myExam && (
          <div className="card exam-info-card">
            <h3>📝 Examen Assigné</h3>
            <div className="exam-details">
              <div className="detail-row">
                <span className="label">Nom:</span>
                <span className="value">{myExam.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Matière:</span>
                <span className="value">{subject?.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Code d'accès:</span>
                <span className="value code">{myExam.code}</span>
              </div>
              <div className="detail-row">
                <span className="label">Statut:</span>
                <span className={`badge ${myExam.active ? 'badge-success' : 'badge-secondary'}`}>
                  {myExam.active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card actions-card">
          <h3>⚙️ Gestion de l'Examen</h3>
          <div className="actions-list">
            <button className="action-btn-list">
              <span className="icon">🎯</span>
              <span className="text">
                <strong>Configurer les Stations</strong>
                <small>Définir les grilles d'évaluation</small>
              </span>
            </button>
            <button className="action-btn-list">
              <span className="icon">👥</span>
              <span className="text">
                <strong>Gérer les Étudiants</strong>
                <small>Importer/Modifier la liste</small>
              </span>
            </button>
            <button className="action-btn-list">
              <span className="icon">✍️</span>
              <span className="text">
                <strong>Créer Comptes Notateurs</strong>
                <small>Inviter des professeurs</small>
              </span>
            </button>
            <button className="action-btn-list">
              <span className="icon">📊</span>
              <span className="text">
                <strong>Tableau de Bord</strong>
                <small>Suivi de la progression</small>
              </span>
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="card stats-card">
          <h3>📊 Statistiques</h3>
          <div className="stats-grid-vertical">
            <div className="stat-row">
              <span className="stat-label">Stations configurées</span>
              <span className="stat-value">3</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Étudiants inscrits</span>
              <span className="stat-value">10</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Notateurs actifs</span>
              <span className="stat-value">2</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Notes complétées</span>
              <span className="stat-value">0 / 30</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard User (Notation uniquement)
function UserDashboard({ user, subjects, exams }) {
  const myExam = exams.find(e => e.id === user.examId);
  const subject = myExam ? subjects.find(s => s.id === myExam.subjectId) : null;

  return (
    <div className="dashboard user-dashboard">
      <div className="dashboard-header">
        <h2>✍️ Dashboard Notateur</h2>
        {myExam && (
          <p>Examen : <strong>{myExam.name}</strong> ({subject?.name})</p>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Sélection Station */}
        <div className="card select-station-card">
          <h3>🎯 Sélectionner une Station</h3>
          <p className="instruction">
            Choisissez la station que vous allez noter aujourd'hui :
          </p>
          <div className="station-list">
            <button className="station-btn">
              <span className="station-number">Station 3</span>
              <span className="station-name">Dosage de la Vitamine C</span>
              <span className="station-progress">0 / 10 étudiants</span>
            </button>
            <button className="station-btn">
              <span className="station-number">Station 4A</span>
              <span className="station-name">Dosage de l'Antipyrine</span>
              <span className="station-progress">0 / 10 étudiants</span>
            </button>
            <button className="station-btn">
              <span className="station-number">Station 4B</span>
              <span className="station-name">Dosage de l'Acide Méfénamique</span>
              <span className="station-progress">0 / 10 étudiants</span>
            </button>
          </div>
        </div>

        {/* Informations */}
        <div className="card info-card">
          <h3>ℹ️ Informations</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-icon">📅</span>
              <div className="info-content">
                <strong>Date de l'examen</strong>
                <span>{myExam?.startDate || 'Non définie'}</span>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">⏱️</span>
              <div className="info-content">
                <strong>Durée par étudiant</strong>
                <span>10 minutes</span>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">📝</span>
              <div className="info-content">
                <strong>Nombre d'étudiants</strong>
                <span>10 étudiants à noter</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mes Statistiques */}
        <div className="card mystats-card">
          <h3>📊 Mes Statistiques</h3>
          <div className="progress-ring">
            <div className="ring-value">0%</div>
            <div className="ring-label">Complété</div>
          </div>
          <div className="stats-list">
            <div className="stat-line">
              <span>Étudiants notés</span>
              <strong>0 / 10</strong>
            </div>
            <div className="stat-line">
              <span>Temps moyen</span>
              <strong>-</strong>
            </div>
            <div className="stat-line">
              <span>Dernière note</span>
              <strong>-</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppV3;
