import { useState } from 'react';
import { useStudents, useGrades } from './hooks/useLocalStorage';
import StudentManagement from './components/StudentManagement';
import StationSelector from './components/StationSelector';
import GradingInterface from './components/GradingInterface';
import ExportResults from './components/ExportResults';
import './App.css';

function App() {
  const [students, setStudents] = useStudents();
  const [grades, setGrades] = useGrades();
  const [activeTab, setActiveTab] = useState('students');
  const [selectedStation, setSelectedStation] = useState(null);

  // Changer d'onglet
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Sélectionner une station et passer à l'onglet de notation
  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setActiveTab('grading');
  };

  // Réinitialiser toutes les données
  const handleResetAllData = () => {
    if (window.confirm('⚠️ ATTENTION: Voulez-vous vraiment supprimer TOUTES les données (étudiants et notes) ? Cette action est irréversible !')) {
      if (window.confirm('Êtes-vous ABSOLUMENT sûr ? Toutes les données seront perdues définitivement.')) {
        setStudents([]);
        setGrades({});
        setSelectedStation(null);
        setActiveTab('students');
        alert('✅ Toutes les données ont été supprimées');
      }
    }
  };

  return (
    <div className="app">
      {/* En-tête de l'application */}
      <header className="app-header">
        <div className="header-content">
          <h1>🎓 Application de Notation - Stations d'Examen</h1>
          <div className="header-info">
            <span className="info-badge">
              {students.length} étudiant(s)
            </span>
            <span className="info-badge">
              {Object.keys(grades).length} notation(s)
            </span>
          </div>
        </div>
      </header>

      {/* Navigation par onglets */}
      <nav className="app-nav">
        <button
          className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => handleTabChange('students')}
        >
          👥 Gestion des Étudiants
        </button>
        <button
          className={`nav-tab ${activeTab === 'stations' ? 'active' : ''}`}
          onClick={() => handleTabChange('stations')}
        >
          📋 Sélection de Station
        </button>
        <button
          className={`nav-tab ${activeTab === 'grading' ? 'active' : ''}`}
          onClick={() => handleTabChange('grading')}
          disabled={!selectedStation}
        >
          ✍️ Notation
          {selectedStation && <span className="tab-subtitle">{selectedStation.name}</span>}
        </button>
        <button
          className={`nav-tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => handleTabChange('export')}
        >
          📊 Export des Résultats
        </button>
        <button
          className="nav-tab danger"
          onClick={handleResetAllData}
        >
          🗑️ Réinitialiser
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

        {activeTab === 'stations' && (
          <StationSelector
            selectedStation={selectedStation}
            onSelectStation={handleStationSelect}
          />
        )}

        {activeTab === 'grading' && selectedStation && (
          <GradingInterface
            station={selectedStation}
            students={students}
            grades={grades}
            setGrades={setGrades}
          />
        )}

        {activeTab === 'grading' && !selectedStation && (
          <div className="no-station-selected">
            <h2>Aucune station sélectionnée</h2>
            <p>Veuillez d'abord sélectionner une station d'examen dans l'onglet "Sélection de Station"</p>
            <button
              className="btn btn-primary"
              onClick={() => handleTabChange('stations')}
            >
              Sélectionner une station
            </button>
          </div>
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
          Application de notation pour stations d'examen pharmaceutiques
          <span className="separator">•</span>
          Les données sont sauvegardées localement dans votre navigateur
        </p>
      </footer>
    </div>
  );
}

export default App;
