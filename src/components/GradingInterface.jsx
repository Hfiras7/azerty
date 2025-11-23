import { useState, useEffect } from 'react';
import { calculateTotalScore, calculateCriterionScore } from '../config/stationConfigs';
import './GradingInterface.css';

const GradingInterface = ({ station, students, grades, setGrades }) => {
  const [selectedStudents, setSelectedStudents] = useState([null, null, null, null]);
  const [currentGrades, setCurrentGrades] = useState({});
  const [autoSave, setAutoSave] = useState(true);

  // Initialiser les notes pour les étudiants sélectionnés
  useEffect(() => {
    const initialGrades = {};
    selectedStudents.forEach((student, index) => {
      if (student) {
        const key = `${station.id}_${student.id}`;
        initialGrades[index] = grades[key] || {};
      }
    });
    setCurrentGrades(initialGrades);
  }, [selectedStudents, station, grades]);

  // Sauvegarder automatiquement
  useEffect(() => {
    if (autoSave) {
      const saveTimer = setTimeout(() => {
        saveAllGrades();
      }, 500);
      return () => clearTimeout(saveTimer);
    }
  }, [currentGrades, autoSave]);

  // Sélectionner un étudiant pour une colonne
  const handleSelectStudent = (columnIndex, studentId) => {
    const student = students.find(s => s.id === parseInt(studentId));
    const newSelectedStudents = [...selectedStudents];
    newSelectedStudents[columnIndex] = student || null;
    setSelectedStudents(newSelectedStudents);
  };

  // Mettre à jour une note
  const handleGradeChange = (columnIndex, itemId, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    setCurrentGrades(prev => ({
      ...prev,
      [columnIndex]: {
        ...prev[columnIndex],
        [itemId]: numValue
      }
    }));
  };

  // Sauvegarder toutes les notes
  const saveAllGrades = () => {
    const newGrades = { ...grades };
    selectedStudents.forEach((student, index) => {
      if (student && currentGrades[index]) {
        const key = `${station.id}_${student.id}`;
        newGrades[key] = currentGrades[index];
      }
    });
    setGrades(newGrades);
  };

  // Réinitialiser les notes d'un étudiant
  const resetStudentGrades = (columnIndex) => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les notes de cet étudiant ?')) {
      setCurrentGrades(prev => ({
        ...prev,
        [columnIndex]: {}
      }));
    }
  };

  // Calculer le score d'un critère pour un étudiant
  const getCriterionScore = (columnIndex, criterion) => {
    if (!currentGrades[columnIndex]) return 0;
    return calculateCriterionScore(currentGrades[columnIndex], criterion);
  };

  // Calculer le score total pour un étudiant
  const getTotalScore = (columnIndex) => {
    if (!currentGrades[columnIndex]) return 0;
    return calculateTotalScore(currentGrades[columnIndex], station.id);
  };

  // Obtenir les étudiants disponibles pour une colonne
  const getAvailableStudents = (currentColumnIndex) => {
    const selectedIds = selectedStudents
      .map((s, idx) => idx !== currentColumnIndex ? s?.id : null)
      .filter(id => id !== null);
    return students.filter(s => !selectedIds.includes(s.id));
  };

  return (
    <div className="grading-interface">
      <div className="grading-header">
        <div>
          <h2>{station.name}</h2>
          <p className="station-description">
            Notation sur {station.maxScore} points - {station.criteria.length} critères d'évaluation
          </p>
        </div>
        <div className="header-controls">
          <label className="auto-save-toggle">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
            />
            Sauvegarde automatique
          </label>
          <button className="btn btn-primary" onClick={saveAllGrades}>
            💾 Sauvegarder
          </button>
        </div>
      </div>

      <div className="grading-grid">
        {/* En-têtes des colonnes */}
        <div className="grid-row header-row">
          <div className="criteria-column">
            <h3>Critères d'évaluation</h3>
          </div>
          {[0, 1, 2, 3].map(columnIndex => (
            <div key={columnIndex} className="student-column">
              <div className="student-selector">
                <select
                  value={selectedStudents[columnIndex]?.id || ''}
                  onChange={(e) => handleSelectStudent(columnIndex, e.target.value)}
                  className="student-select"
                >
                  <option value="">-- Sélectionner un étudiant --</option>
                  {getAvailableStudents(columnIndex).map(student => (
                    <option key={student.id} value={student.id}>
                      {student.number} - {student.lastName} {student.firstName}
                    </option>
                  ))}
                </select>
                {selectedStudents[columnIndex] && (
                  <button
                    className="btn-reset"
                    onClick={() => resetStudentGrades(columnIndex)}
                    title="Réinitialiser les notes"
                  >
                    🔄
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Critères et notation */}
        {station.criteria.map((criterion, criterionIndex) => (
          <div key={criterion.id} className="criterion-section">
            {/* En-tête du critère */}
            <div className="grid-row criterion-header-row">
              <div className="criteria-column criterion-name">
                <strong>{criterion.name}</strong>
                <span className="criterion-max">/{criterion.maxPoints} pts</span>
              </div>
              {[0, 1, 2, 3].map(columnIndex => (
                <div key={columnIndex} className="student-column criterion-total">
                  {selectedStudents[columnIndex] && (
                    <span className="score">
                      {getCriterionScore(columnIndex, criterion).toFixed(2)}/{criterion.maxPoints}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Items du critère */}
            {criterion.items.map(item => (
              <div key={item.id} className="grid-row item-row">
                <div className="criteria-column item-label">
                  <span>{item.label}</span>
                  <span className="item-points">/{item.points}</span>
                </div>
                {[0, 1, 2, 3].map(columnIndex => (
                  <div key={columnIndex} className="student-column">
                    {selectedStudents[columnIndex] && (
                      <input
                        type="number"
                        min="0"
                        max={item.points}
                        step="0.25"
                        value={currentGrades[columnIndex]?.[item.id] || 0}
                        onChange={(e) => handleGradeChange(columnIndex, item.id, e.target.value)}
                        className="grade-input"
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

        {/* Total final */}
        <div className="grid-row total-row">
          <div className="criteria-column total-label">
            <strong>NOTE FINALE</strong>
            <span className="criterion-max">/{station.maxScore}</span>
          </div>
          {[0, 1, 2, 3].map(columnIndex => (
            <div key={columnIndex} className="student-column total-score">
              {selectedStudents[columnIndex] && (
                <span className="final-score">
                  {getTotalScore(columnIndex).toFixed(2)}/{station.maxScore}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grading-stats">
        <h3>Statistiques de notation</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Étudiants notés</span>
            <span className="stat-value">
              {selectedStudents.filter(s => s !== null).length}/4
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Moyenne de la session</span>
            <span className="stat-value">
              {(() => {
                const validScores = selectedStudents
                  .map((s, idx) => s ? getTotalScore(idx) : null)
                  .filter(score => score !== null);
                if (validScores.length === 0) return '---';
                const avg = validScores.reduce((a, b) => a + b, 0) / validScores.length;
                return `${avg.toFixed(2)}/${station.maxScore}`;
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingInterface;
