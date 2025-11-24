import { useState, useEffect } from 'react';
import AuthLogin from './components/AuthLogin';
import ProfessorGradingInterface from './components/ProfessorGradingInterface';
import StudentManagement from './components/StudentManagement';
import ProgressDashboard from './components/ProgressDashboard';
import StationAdmin from './components/StationAdmin';
import ExportResults from './components/ExportResults';
import { useStudents, useGrades } from './hooks/useLocalStorage';
import {
  initializeDemoData,
  getSubjects,
  getExams,
  getStationsByExam,
  getStudentsByExam
} from './config/demoData';
import './App.css';

/**
 * CHAF - Système de Notation ECOS
 * Version 4.0 - Système Multi-Rôles Fonctionnel
 *
 * Rôles:
 * - admin_master: Contrôle total, gère matières/examens/admins
 * - admin_teacher: Gère un examen spécifique
 * - user: Note les étudiants
 */

// Logo Component
function ChafLogo({ size = '40px' }) {
  return (
    <div className="chaf-logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="url(#grad1)" />
        <text x="50" y="65" fontSize="45" fontWeight="800" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">
          C
        </text>
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function AppV4() {
  const [currentUser, setCurrentUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useStudents();
  const [grades, setGrades] = useGrades();

  // Navigation states
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedStation, setSelectedStation] = useState(null);
  const [showStationAdmin, setShowStationAdmin] = useState(false);

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
    setCurrentView('dashboard');
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      localStorage.removeItem('current_user');
      setCurrentUser(null);
      setCurrentView('dashboard');
      setSelectedStation(null);
    }
  };

  // Sélectionner une station pour la notation
  const handleSelectStation = (stationId) => {
    const stations = getStationsByExam(currentUser.examId);
    const station = stations.find(s => s.id === stationId);
    if (station) {
      setSelectedStation(station);
      setCurrentView('grading');
    }
  };

  // Retour au dashboard
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedStation(null);
  };

  // Si pas connecté, afficher l'écran de connexion
  if (!currentUser) {
    return <AuthLogin onLogin={handleLogin} />;
  }

  // Si en mode notation
  if (currentView === 'grading' && selectedStation) {
    return (
      <div className="app">
        <header className="app-header-v3">
          <div className="header-content">
            <div className="header-left">
              <ChafLogo />
              <div style={{ marginLeft: '15px' }}>
                <h1>CHAF - Notation ECOS</h1>
                <div className="user-info">
                  <span className="user-name">{currentUser.displayName}</span>
                  <span className={`user-badge role-${currentUser.role}`}>
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
              </div>
            </div>
            <div className="header-right">
              <button className="btn btn-secondary" onClick={handleBackToDashboard}>
                ← Retour au Dashboard
              </button>
              <button className="btn btn-logout" onClick={handleLogout}>
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </header>

        <main className="app-main">
          <ProfessorGradingInterface
            professor={currentUser}
            station={selectedStation}
            students={students}
            grades={grades}
            setGrades={setGrades}
          />
        </main>
      </div>
    );
  }

  // Router vers le bon dashboard selon le rôle
  return (
    <div className="app">
      {/* En-tête */}
      <header className="app-header-v3">
        <div className="header-content">
          <div className="header-left">
            <ChafLogo />
            <div style={{ marginLeft: '15px' }}>
              <h1>CHAF - Système de Notation ECOS</h1>
              <div className="user-info">
                <span className="user-name">{currentUser.displayName}</span>
                <span className={`user-badge role-${currentUser.role}`}>
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>
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
            onNavigate={setCurrentView}
          />
        )}

        {currentUser.role === 'admin_teacher' && (
          <AdminTeacherDashboard
            user={currentUser}
            subjects={subjects}
            exams={exams}
            students={students}
            setStudents={setStudents}
            grades={grades}
            currentView={currentView}
            onNavigate={setCurrentView}
            onShowStationAdmin={() => setShowStationAdmin(true)}
          />
        )}

        {currentUser.role === 'user' && (
          <UserDashboard
            user={currentUser}
            subjects={subjects}
            exams={exams}
            onSelectStation={handleSelectStation}
          />
        )}
      </main>

      {/* Modal d'administration des stations */}
      {showStationAdmin && (
        <StationAdmin onClose={() => setShowStationAdmin(false)} />
      )}
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
function AdminMasterDashboard({ user, subjects, exams, onNavigate }) {
  const handleCreateSubject = () => {
    alert('📚 Fonctionnalité "Créer une matière" sera disponible prochainement !');
  };

  const handleCreateExam = () => {
    alert('📝 Fonctionnalité "Créer un examen" sera disponible prochainement !');
  };

  const handleManageAdmins = () => {
    alert('👥 Fonctionnalité "Gérer les admins" sera disponible prochainement !');
  };

  const handleViewStats = () => {
    alert('📊 Fonctionnalité "Statistiques globales" sera disponible prochainement !');
  };

  const handleConfig = () => {
    alert('⚙️ Fonctionnalité "Configuration système" sera disponible prochainement !');
  };

  const handleExport = () => {
    alert('📥 Fonctionnalité "Export données" sera disponible prochainement !');
  };

  return (
    <div className="dashboard admin-master-dashboard">
      <div className="dashboard-header">
        <h2>👑 Dashboard Administrateur Principal</h2>
        <p>Vous avez un contrôle total sur le système CHAF</p>
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
            <button className="btn btn-primary btn-sm" onClick={handleCreateSubject}>
              + Nouvelle Matière
            </button>
          </div>
          <div className="list">
            {subjects.map(subject => (
              <div key={subject.id} className="list-item">
                <div className="list-item-info">
                  <strong>{subject.name}</strong>
                  <span className="badge">{subject.code}</span>
                </div>
                <div className="list-item-actions">
                  <button className="btn-icon" title="Modifier">✏️</button>
                  <button className="btn-icon" title="Supprimer">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Examens */}
        <div className="card exams-card">
          <div className="card-header">
            <h3>📝 Examens</h3>
            <button className="btn btn-primary btn-sm" onClick={handleCreateExam}>
              + Nouvel Examen
            </button>
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
            <button className="action-btn" onClick={handleManageAdmins}>
              <span className="action-icon">👥</span>
              <span className="action-label">Gérer Admins Enseignants</span>
            </button>
            <button className="action-btn" onClick={handleViewStats}>
              <span className="action-icon">📊</span>
              <span className="action-label">Voir Statistiques</span>
            </button>
            <button className="action-btn" onClick={handleConfig}>
              <span className="action-icon">⚙️</span>
              <span className="action-label">Configuration</span>
            </button>
            <button className="action-btn" onClick={handleExport}>
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
function AdminTeacherDashboard({ user, subjects, exams, students, setStudents, grades, currentView, onNavigate, onShowStationAdmin }) {
  const myExam = exams.find(e => e.id === user.examId);
  const subject = myExam ? subjects.find(s => s.id === myExam.subjectId) : null;

  // Si on est dans une sous-vue, afficher le composant approprié
  if (currentView === 'students') {
    return (
      <div>
        <div className="view-header">
          <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
            ← Retour au Dashboard
          </button>
          <h2>👥 Gestion des Étudiants</h2>
        </div>
        <StudentManagement students={students} setStudents={setStudents} />
      </div>
    );
  }

  if (currentView === 'progress') {
    return (
      <div>
        <div className="view-header">
          <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
            ← Retour au Dashboard
          </button>
          <h2>📊 Tableau de Bord</h2>
        </div>
        <ProgressDashboard students={students} grades={grades} />
      </div>
    );
  }

  if (currentView === 'export') {
    return (
      <div>
        <div className="view-header">
          <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
            ← Retour au Dashboard
          </button>
          <h2>📥 Export des Résultats</h2>
        </div>
        <ExportResults students={students} grades={grades} />
      </div>
    );
  }

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
            <button className="action-btn-list" onClick={onShowStationAdmin}>
              <span className="icon">🎯</span>
              <span className="text">
                <strong>Configurer les Stations</strong>
                <small>Définir les grilles d'évaluation</small>
              </span>
            </button>
            <button className="action-btn-list" onClick={() => onNavigate('students')}>
              <span className="icon">👥</span>
              <span className="text">
                <strong>Gérer les Étudiants</strong>
                <small>Importer/Modifier la liste</small>
              </span>
            </button>
            <button className="action-btn-list" onClick={() => alert('Fonctionnalité bientôt disponible !')}>
              <span className="icon">✍️</span>
              <span className="text">
                <strong>Créer Comptes Notateurs</strong>
                <small>Inviter des professeurs</small>
              </span>
            </button>
            <button className="action-btn-list" onClick={() => onNavigate('progress')}>
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
              <span className="stat-value">{getStationsByExam(user.examId).length}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Étudiants inscrits</span>
              <span className="stat-value">{students.length}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Notateurs actifs</span>
              <span className="stat-value">2</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Notes complétées</span>
              <span className="stat-value">{Object.keys(grades).filter(k => !k.endsWith('_meta')).length} / {students.length * 3}</span>
            </div>
          </div>
        </div>

        {/* Export rapide */}
        <div className="card">
          <h3>📥 Export Rapide</h3>
          <div className="actions-list">
            <button className="action-btn-list" onClick={() => onNavigate('export')}>
              <span className="icon">📊</span>
              <span className="text">
                <strong>Exporter les Résultats</strong>
                <small>Excel, PDF, CSV</small>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard User (Notation uniquement)
function UserDashboard({ user, subjects, exams, onSelectStation }) {
  const myExam = exams.find(e => e.id === user.examId);
  const subject = myExam ? subjects.find(s => s.id === myExam.subjectId) : null;
  const stations = myExam ? getStationsByExam(myExam.id) : [];
  const students = myExam ? getStudentsByExam(myExam.id) : [];

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
            {stations.map(station => (
              <button
                key={station.id}
                className="station-btn"
                onClick={() => onSelectStation(station.id)}
              >
                <span className="station-number">{station.name.split('-')[0]}</span>
                <span className="station-name">{station.name.split('-')[1] || station.name}</span>
                <span className="station-progress">0 / {students.length} étudiants</span>
              </button>
            ))}
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
                <span>{students.length} étudiants à noter</span>
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
              <strong>0 / {students.length}</strong>
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

export default AppV4;
