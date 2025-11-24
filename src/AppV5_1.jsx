import { useState, useEffect } from 'react';
import AuthLogin from './components/AuthLogin';
import ProfessorGradingInterface from './components/ProfessorGradingInterface';
import StudentManagement from './components/StudentManagement';
import ProgressDashboard from './components/ProgressDashboard';
import StationAdmin from './components/StationAdmin';
import ExportResults from './components/ExportResults';
import {
  getSubjects,
  getExams,
  getStationsByExam,
  getStudentsByExam,
  getGradesByExam,
  createSubject,
  updateSubject,
  deleteSubject,
  createExam,
  updateExam,
  deleteExam,
  subscribeToGrades,
  unsubscribe
} from './config/supabase';
import './App.css';

/**
 * CHAF - Système de Notation EPOS
 * Version 5.1 - Intégration Supabase Complète + CRUD Complet
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
      <img
        src="/logo-chaf.png"
        alt="CHAF Logo"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}

function AppV5_1() {
  const [currentUser, setCurrentUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation states
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedStation, setSelectedStation] = useState(null);
  const [showStationAdmin, setShowStationAdmin] = useState(false);

  // Charger les données depuis Supabase au démarrage
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Vérifier s'il y a un utilisateur connecté
        const savedUser = localStorage.getItem('current_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setCurrentUser(userData);

          // Charger les données depuis Supabase
          const [subjectsData, examsData] = await Promise.all([
            getSubjects(),
            getExams()
          ]);

          setSubjects(subjectsData);
          setExams(examsData);

          // Si l'utilisateur a un examId, charger les étudiants et notes
          if (userData.examId) {
            const [studentsData, gradesData] = await Promise.all([
              getStudentsByExam(userData.examId),
              getGradesByExam(userData.examId)
            ]);

            setStudents(studentsData);
            setGrades(gradesData);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données. Vérifiez votre connexion.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Souscrire aux changements de notes en temps réel
  useEffect(() => {
    if (!currentUser?.examId) return;

    const channel = subscribeToGrades(currentUser.examId, (payload) => {
      console.log('Changement de notes détecté:', payload);
      // Recharger les notes
      getGradesByExam(currentUser.examId).then(setGrades);
    });

    return () => {
      unsubscribe(channel);
    };
  }, [currentUser?.examId]);

  // Recharger les données après modification
  const refreshData = async () => {
    try {
      const [subjectsData, examsData] = await Promise.all([
        getSubjects(),
        getExams()
      ]);

      setSubjects(subjectsData);
      setExams(examsData);

      if (currentUser?.examId) {
        const [studentsData, gradesData] = await Promise.all([
          getStudentsByExam(currentUser.examId),
          getGradesByExam(currentUser.examId)
        ]);

        setStudents(studentsData);
        setGrades(gradesData);
      }
    } catch (err) {
      console.error('Erreur lors du rechargement:', err);
      setError('Erreur lors du rechargement des données');
    }
  };

  // Gérer la connexion
  const handleLogin = async (userData) => {
    setCurrentUser(userData);
    setCurrentView('dashboard');

    // Charger les données pour cet utilisateur
    try {
      const [subjectsData, examsData] = await Promise.all([
        getSubjects(),
        getExams()
      ]);

      setSubjects(subjectsData);
      setExams(examsData);

      if (userData.examId) {
        const [studentsData, gradesData] = await Promise.all([
          getStudentsByExam(userData.examId),
          getGradesByExam(userData.examId)
        ]);

        setStudents(studentsData);
        setGrades(gradesData);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données utilisateur:', err);
    }
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      localStorage.removeItem('current_user');
      setCurrentUser(null);
      setCurrentView('dashboard');
      setSelectedStation(null);
      setSubjects([]);
      setExams([]);
      setStudents([]);
      setGrades([]);
    }
  };

  // Sélectionner une station pour la notation
  const handleSelectStation = async (stationId) => {
    try {
      const stations = await getStationsByExam(currentUser.examId);
      const station = stations.find(s => s.id === stationId);
      if (station) {
        setSelectedStation(station);
        setCurrentView('grading');
      }
    } catch (err) {
      console.error('Erreur lors de la sélection de la station:', err);
      setError('Impossible de charger la station');
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

  // Afficher un message de chargement
  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <ChafLogo size="80px" />
          <h2>Chargement des données...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <div className="app error-screen">
        <div className="error-content">
          <h2>⚠️ Erreur</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={refreshData}>
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
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
                <h1>CHAF - Système de Notation EPOS</h1>
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
            onGradesSaved={refreshData}
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
              <h1>CHAF - Système de Notation EPOS</h1>
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
            onRefresh={refreshData}
          />
        )}

        {currentUser.role === 'admin_teacher' && (
          <AdminTeacherDashboard
            user={currentUser}
            subjects={subjects}
            exams={exams}
            students={students}
            grades={grades}
            currentView={currentView}
            onNavigate={setCurrentView}
            onShowStationAdmin={() => setShowStationAdmin(true)}
            onRefresh={refreshData}
          />
        )}

        {currentUser.role === 'user' && (
          <UserDashboard
            user={currentUser}
            subjects={subjects}
            exams={exams}
            students={students}
            onSelectStation={handleSelectStation}
          />
        )}
      </main>

      {/* Modal d'administration des stations */}
      {showStationAdmin && (
        <StationAdmin
          examId={currentUser.examId}
          onClose={() => {
            setShowStationAdmin(false);
            refreshData();
          }}
        />
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

// Dashboard Admin Master (Contrôle total) - Version 5.1
function AdminMasterDashboard({ user, subjects, exams, onNavigate, onRefresh }) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingExam, setEditingExam] = useState(null);

  // CRUD MATIÈRES
  const handleCreateSubject = async () => {
    const name = prompt('Nom de la matière:');
    if (!name) return;

    const code = prompt('Code de la matière (ex: PHAR101):');
    if (!code) return;

    const description = prompt('Description (optionnelle):') || '';

    try {
      setIsCreating(true);
      await createSubject(name, code, description, user.email);
      alert('✅ Matière créée avec succès !');
      await onRefresh();
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la création de la matière: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubject = async (subject) => {
    const name = prompt('Nom de la matière:', subject.name);
    if (!name) return;

    const code = prompt('Code de la matière:', subject.code);
    if (!code) return;

    const description = prompt('Description:', subject.description || '') || '';

    try {
      await updateSubject(subject.id, name, code, description);
      alert('✅ Matière modifiée avec succès !');
      await onRefresh();
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la modification: ' + error.message);
    }
  };

  const handleDeleteSubject = async (subject) => {
    const subjectExams = exams.filter(e => e.subject_id === subject.id);
    if (subjectExams.length > 0) {
      alert(`❌ Impossible de supprimer cette matière car elle contient ${subjectExams.length} examen(s).`);
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la matière "${subject.name}" ?`)) {
      try {
        await deleteSubject(subject.id);
        alert('✅ Matière supprimée avec succès !');
        await onRefresh();
      } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  // CRUD EXAMENS
  const handleCreateExam = async () => {
    if (!selectedSubject) {
      alert('⚠️ Sélectionnez d\'abord une matière pour créer un examen.');
      return;
    }

    const name = prompt('Nom de l\'examen:');
    if (!name) return;

    const code = prompt('Code d\'accès (utilisé par les notateurs):');
    if (!code) return;

    try {
      setIsCreating(true);
      await createExam(selectedSubject.id, name, code, true);
      alert('✅ Examen créé avec succès ! Vous pouvez maintenant ajouter des stations et des étudiants.');
      await onRefresh();
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la création de l\'examen: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditExam = async (exam) => {
    const name = prompt('Nom de l\'examen:', exam.name);
    if (!name) return;

    const code = prompt('Code d\'accès:', exam.code);
    if (!code) return;

    const active = window.confirm('Examen actif ?');

    try {
      await updateExam(exam.id, { name, code, active });
      alert('✅ Examen modifié avec succès !');
      await onRefresh();
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la modification: ' + error.message);
    }
  };

  const handleDeleteExam = async (exam) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'examen "${exam.name}" ?\n\n⚠️ Toutes les données associées (stations, étudiants, notes) seront également supprimées.`)) {
      try {
        await deleteExam(exam.id);
        alert('✅ Examen supprimé avec succès !');
        await onRefresh();
      } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
    }
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

  // Si une matière est sélectionnée, afficher ses examens
  if (selectedSubject) {
    const subjectExams = exams.filter(e => e.subject_id === selectedSubject.id);

    return (
      <div className="dashboard admin-master-dashboard">
        <div className="dashboard-header">
          <button className="btn btn-secondary" onClick={() => setSelectedSubject(null)}>
            ← Retour aux Matières
          </button>
          <h2>📚 {selectedSubject.name}</h2>
          <p>Code: {selectedSubject.code} | {subjectExams.length} examen(s)</p>
        </div>

        <div className="dashboard-grid">
          {/* Statistiques de la matière */}
          <div className="card stats-card">
            <h3>📊 Statistiques</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{subjectExams.length}</div>
                <div className="stat-label">Examens</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{subjectExams.filter(e => e.active).length}</div>
                <div className="stat-label">Actifs</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{subjectExams.filter(e => !e.active).length}</div>
                <div className="stat-label">Inactifs</div>
              </div>
            </div>
          </div>

          {/* Liste des examens */}
          <div className="card exams-card" style={{ gridColumn: 'span 3' }}>
            <div className="card-header">
              <h3>📝 Examens EPOS - {selectedSubject.name}</h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCreateExam}
                disabled={isCreating}
              >
                {isCreating ? '⏳ Création...' : '+ Nouvel Examen'}
              </button>
            </div>
            <div className="list">
              {subjectExams.length === 0 ? (
                <p className="empty-message">Aucun examen pour cette matière. Créez-en un !</p>
              ) : (
                subjectExams.map(exam => (
                  <div key={exam.id} className="list-item">
                    <div className="list-item-info">
                      <strong>{exam.name}</strong>
                      <span className="text-sm">
                        Code: {exam.code}
                      </span>
                    </div>
                    <div className="list-item-actions">
                      <span className={`badge ${exam.active ? 'badge-success' : 'badge-secondary'}`}>
                        {exam.active ? 'Actif' : 'Inactif'}
                      </span>
                      <button
                        className="btn btn-sm btn-primary"
                        title="Gérer cet examen (stations, étudiants, notation)"
                        onClick={() => alert(`🚧 Vue de gestion complète pour "${exam.name}" en construction...\n\nCette vue contiendra:\n- Gestion des stations\n- Gestion des étudiants\n- Tableau de bord des notes\n\nEn attendant, connectez-vous en tant qu'admin_teacher pour gérer l'examen.`)}
                        style={{ marginRight: '5px' }}
                      >
                        ⚙️ Gérer
                      </button>
                      <button
                        className="btn-icon"
                        title="Modifier"
                        onClick={() => handleEditExam(exam)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon"
                        title="Supprimer"
                        onClick={() => handleDeleteExam(exam)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue par défaut: liste des matières
  return (
    <div className="dashboard admin-master-dashboard">
      <div className="dashboard-header">
        <h2>👑 Dashboard Administrateur Principal</h2>
        <p>Vous avez un contrôle total sur le système CHAF - Version 5.1</p>
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
        <div className="card subjects-card" style={{ gridColumn: 'span 3' }}>
          <div className="card-header">
            <h3>📚 Matières</h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCreateSubject}
              disabled={isCreating}
            >
              {isCreating ? '⏳ Création...' : '+ Nouvelle Matière'}
            </button>
          </div>
          <div className="list">
            {subjects.length === 0 ? (
              <p className="empty-message">Aucune matière. Créez-en une !</p>
            ) : (
              subjects.map(subject => {
                const subjectExamCount = exams.filter(e => e.subject_id === subject.id).length;
                return (
                  <div
                    key={subject.id}
                    className="list-item clickable"
                    onClick={() => setSelectedSubject(subject)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="list-item-info">
                      <strong>{subject.name}</strong>
                      <span className="text-sm">
                        Code: {subject.code} • {subjectExamCount} examen(s)
                      </span>
                    </div>
                    <div className="list-item-actions">
                      <span className="badge">{subjectExamCount} examen(s)</span>
                      <button
                        className="btn-icon"
                        title="Modifier"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSubject(subject);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon"
                        title="Supprimer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(subject);
                        }}
                      >
                        🗑️
                      </button>
                      <button
                        className="btn-icon"
                        title="Voir examens"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubject(subject);
                        }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
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
function AdminTeacherDashboard({ user, subjects, exams, students, grades, currentView, onNavigate, onShowStationAdmin, onRefresh }) {
  const myExam = exams.find(e => e.id === user.examId);
  const subject = myExam?.subject || subjects.find(s => s.id === myExam?.subject_id);
  const [stations, setStations] = useState([]);

  // Charger les stations
  useEffect(() => {
    if (user.examId) {
      getStationsByExam(user.examId).then(setStations);
    }
  }, [user.examId]);

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
        <StudentManagement
          examId={user.examId}
          students={students}
          onRefresh={onRefresh}
        />
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
        <ProgressDashboard students={students} grades={grades} stations={stations} />
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
        <ExportResults
          examId={user.examId}
          students={students}
          grades={grades}
          stations={stations}
        />
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
              <span className="stat-value">{stations.length}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Étudiants inscrits</span>
              <span className="stat-value">{students.length}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Notateurs actifs</span>
              <span className="stat-value">-</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Notes complétées</span>
              <span className="stat-value">{grades.length} / {students.length * stations.length}</span>
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
function UserDashboard({ user, subjects, exams, students, onSelectStation }) {
  const myExam = exams.find(e => e.id === user.examId);
  const subject = myExam?.subject || subjects.find(s => s.id === myExam?.subject_id);
  const [stations, setStations] = useState([]);

  // Charger les stations
  useEffect(() => {
    if (user.examId) {
      getStationsByExam(user.examId).then(setStations);
    }
  }, [user.examId]);

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
            {stations.length === 0 ? (
              <p className="empty-message">Aucune station configurée pour cet examen.</p>
            ) : (
              stations.map(station => (
                <button
                  key={station.id}
                  className="station-btn"
                  onClick={() => onSelectStation(station.id)}
                >
                  <span className="station-number">{station.name.split('-')[0]}</span>
                  <span className="station-name">{station.name.split('-')[1] || station.name}</span>
                  <span className="station-progress">0 / {students.length} étudiants</span>
                </button>
              ))
            )}
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
                <span>{myExam?.start_date || 'Non définie'}</span>
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

export default AppV5_1;
