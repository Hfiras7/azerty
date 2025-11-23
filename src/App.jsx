import { useState, useEffect } from 'react';
import { useStudents, useGrades } from './hooks/useLocalStorage';
import { stationConfigs } from './config/stationConfigs';
import ProfessorLogin from './components/ProfessorLogin';
import StudentManagement from './components/StudentManagement';
import ProfessorGradingInterface from './components/ProfessorGradingInterface';
import ExportResults from './components/ExportResults';
import ProgressDashboard from './components/ProgressDashboard';
import StationAdmin from './components/StationAdmin';
import './App.css';

function App() {
  const [students, setStudents] = useStudents();
  const [grades, setGrades] = useGrades();
  const [activeTab, setActiveTab] = useState('students');
  const [professor, setProfessor] = useState(null);
  const [currentStation, setCurrentStation] = useState(null);
  const [showStationAdmin, setShowStationAdmin] = useState(false);

  // Vérifier s'il y a un professeur connecté au démarrage
  useEffect(() => {
    const savedProfessor = localStorage.getItem('current_professor');
    if (savedProfessor) {
      const professorData = JSON.parse(savedProfessor);
      setProfessor(professorData);

      // Charger la station du professeur
      loadProfessorStation(professorData.stationId);

      // Aller directement à la notation
      setActiveTab('grading');
    }
  }, []);

  // Charger la station du professeur
  const loadProfessorStation = (stationId) => {
    // Essayer de charger depuis les stations personnalisées
    const customStations = JSON.parse(localStorage.getItem('custom_stations') || 'null');

    if (customStations) {
      const station = customStations.find(s => s.id === stationId);
      if (station) {
        setCurrentStation(station);
        return;
      }
    }

    // Sinon charger depuis les stations par défaut
    const defaultStation = stationConfigs[stationId];
    if (defaultStation) {
      setCurrentStation(defaultStation);
    }
  };

  // Gérer la connexion du professeur
  const handleProfessorLogin = (professorData) => {
    setProfessor(professorData);
    loadProfessorStation(professorData.stationId);
    setActiveTab('grading');
  };

  // Déconnexion du professeur
  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      // Supprimer les données de session
      localStorage.removeItem('current_professor');

      // Retirer des professeurs actifs
      const activeProfessors = JSON.parse(localStorage.getItem('active_professors') || '[]');
      const updatedProfessors = activeProfessors.filter(p => p.sessionId !== professor.sessionId);
      localStorage.setItem('active_professors', JSON.stringify(updatedProfessors));

      setProfessor(null);
      setCurrentStation(null);
      setActiveTab('students');
    }
  };

  // Réinitialiser toutes les données
  const handleResetAllData = () => {
    if (window.confirm('⚠️ ATTENTION: Voulez-vous vraiment supprimer TOUTES les données (étudiants, notes, professeurs) ? Cette action est irréversible !')) {
      if (window.confirm('Êtes-vous ABSOLUMENT sûr ? Toutes les données seront perdues définitivement.')) {
        setStudents([]);
        setGrades({});
        localStorage.removeItem('active_professors');
        localStorage.removeItem('current_professor');
        setProfessor(null);
        setCurrentStation(null);
        setActiveTab('students');
        alert('✅ Toutes les données ont été supprimées');
      }
    }
  };

  // Si pas de professeur connecté, afficher l'écran de connexion
  if (!professor) {
    return <ProfessorLogin onLogin={handleProfessorLogin} />;
  }

  return (
    <div className="app">
      {/* En-tête de l'application */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎓 Système de Notation Multi-Professeurs</h1>
            <p className="professor-name">
              Connecté en tant que: <strong>{professor.name}</strong>
              {currentStation && <> • Station: <strong>{currentStation.name}</strong></>}
            </p>
          </div>
          <div className="header-right">
            <div className="header-info">
              <span className="info-badge">
                {students.length} étudiant(s)
              </span>
              <span className="info-badge">
                {Object.keys(grades).filter(k => !k.endsWith('_meta')).length} notation(s)
              </span>
            </div>
            <button className="btn btn-logout" onClick={handleLogout}>
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Navigation par onglets */}
      <nav className="app-nav">
        <button
          className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 Gestion des Étudiants
        </button>
        <button
          className={`nav-tab ${activeTab === 'grading' ? 'active' : ''}`}
          onClick={() => setActiveTab('grading')}
        >
          ✍️ Notation
          {currentStation && <span className="tab-subtitle">Ma Station</span>}
        </button>
        <button
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Tableau de Bord
        </button>
        <button
          className={`nav-tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          📥 Export des Résultats
        </button>
        <button
          className="nav-tab"
          onClick={() => setShowStationAdmin(true)}
        >
          ⚙️ Configuration
        </button>
        <button
          className="nav-tab danger"
          onClick={handleResetAllData}
        >
          🗑️ Réinitialiser Tout
        </button>
      </nav>

      {/* Contenu principal */}
      <main className="app-main">
        {activeTab === 'students' && (
          <StudentManagement
            students={students}
            setStudents={setStudents}
          />
        )}

        {activeTab === 'grading' && currentStation && (
          <ProfessorGradingInterface
            professor={professor}
            station={currentStation}
            students={students}
            grades={grades}
            setGrades={setGrades}
          />
        )}

        {activeTab === 'dashboard' && (
          <ProgressDashboard
            students={students}
            grades={grades}
          />
        )}

        {activeTab === 'export' && (
          <ExportResults
            students={students}
            grades={grades}
          />
        )}
      </main>

      {/* Pied de page */}
      <footer className="app-footer">
        <p>
          Système de notation multi-professeurs pour examens ECOS
          <span className="separator">•</span>
          Les données sont sauvegardées localement et synchronisées automatiquement
          <span className="separator">•</span>
          Session: {professor.name} - {new Date(professor.loginTime).toLocaleString('fr-FR')}
        </p>
      </footer>

      {/* Modal d'administration des stations */}
      {showStationAdmin && (
        <StationAdmin onClose={() => setShowStationAdmin(false)} />
      )}
    </div>
  );
}

export default App;
