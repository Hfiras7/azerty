import { useState } from 'react';
import './ProfessorLogin.css';

const ProfessorLogin = ({ onLogin }) => {
  const [professorName, setProfessorName] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [availableStations, setAvailableStations] = useState([]);

  // Charger les stations disponibles depuis localStorage
  useState(() => {
    const savedStations = JSON.parse(localStorage.getItem('custom_stations') || '[]');
    if (savedStations.length > 0) {
      setAvailableStations(savedStations);
    } else {
      // Stations par défaut
      setAvailableStations([
        { id: 'station3', name: 'Station 3 - Vitamine C' },
        { id: 'station4a', name: 'Station 4A - Antipyrine' },
        { id: 'station4b', name: 'Station 4B - Acide Méfénamique' },
        { id: 'station4c', name: 'Station 4C - Paracétamol' },
        { id: 'station4d', name: 'Station 4D - Aspirine' }
      ]);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!professorName.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }

    if (!selectedStation) {
      alert('Veuillez sélectionner une station');
      return;
    }

    // Enregistrer le professeur dans localStorage
    const professorData = {
      name: professorName.trim(),
      stationId: selectedStation,
      loginTime: new Date().toISOString(),
      sessionId: Date.now()
    };

    // Sauvegarder les informations du professeur
    localStorage.setItem('current_professor', JSON.stringify(professorData));

    // Ajouter à la liste des professeurs actifs
    const activeProfessors = JSON.parse(localStorage.getItem('active_professors') || '[]');
    activeProfessors.push(professorData);
    localStorage.setItem('active_professors', JSON.stringify(activeProfessors));

    onLogin(professorData);
  };

  return (
    <div className="professor-login">
      <div className="login-container">
        <div className="login-header">
          <h1>🎓 Système de Notation</h1>
          <h2>Identification du Professeur</h2>
          <p>Veuillez vous identifier avant de commencer la notation</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="professorName">
              <span className="label-icon">👤</span>
              Nom du Professeur *
            </label>
            <input
              type="text"
              id="professorName"
              value={professorName}
              onChange={(e) => setProfessorName(e.target.value)}
              placeholder="Entrez votre nom complet"
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="stationSelect">
              <span className="label-icon">📋</span>
              Station d'Examen *
            </label>
            <select
              id="stationSelect"
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="form-select"
              required
            >
              <option value="">-- Sélectionnez votre station --</option>
              {availableStations.map(station => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-info">
            <p>
              ℹ️ Vous allez noter les étudiants pour la station sélectionnée.
              Plusieurs professeurs peuvent travailler simultanément sur différentes stations.
            </p>
          </div>

          <button type="submit" className="btn-login">
            Commencer la Notation
          </button>
        </form>

        <div className="login-footer">
          <p>Les données sont sauvegardées automatiquement et localement</p>
        </div>
      </div>
    </div>
  );
};

export default ProfessorLogin;
