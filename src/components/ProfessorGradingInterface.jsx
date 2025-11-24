import { useState, useEffect } from 'react';
import { calculateTotalScore, calculateCriterionScore } from '../config/stationConfigs';
import { saveGrade } from '../config/supabase';
import './ProfessorGradingInterface.css';

const ProfessorGradingInterface = ({ professor, station, students, grades, onGradesSaved }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentGrades, setCurrentGrades] = useState({});
  const [autoSave, setAutoSave] = useState(true);
  const [gradedStudents, setGradedStudents] = useState([]);

  // Charger les notes de l'étudiant sélectionné
  useEffect(() => {
    if (selectedStudent) {
      // Trouver les notes de cet étudiant pour cette station dans l'array Supabase
      const existingGrade = grades.find(
        g => g.student_id === selectedStudent.id && g.station_id === station.id
      );
      setCurrentGrades(existingGrade?.grades || {});

      // Vérifier quels étudiants ont été notés pour cette station
      updateGradedStudents();
    }
  }, [selectedStudent, station, grades]);

  // Mettre à jour la liste des étudiants notés
  const updateGradedStudents = () => {
    const graded = students.filter(student => {
      const existingGrade = grades.find(
        g => g.student_id === student.id && g.station_id === station.id
      );
      return existingGrade && Object.keys(existingGrade.grades || {}).length > 0;
    });
    setGradedStudents(graded);
  };

  // Sauvegarder automatiquement
  useEffect(() => {
    if (autoSave && selectedStudent) {
      const saveTimer = setTimeout(() => {
        saveCurrentGrades();
      }, 500);
      return () => clearTimeout(saveTimer);
    }
  }, [currentGrades, autoSave]);

  // Sélectionner un étudiant
  const handleSelectStudent = (studentId) => {
    // Sauvegarder les notes actuelles avant de changer d'étudiant
    if (selectedStudent) {
      saveCurrentGrades();
    }

    const student = students.find(s => s.id === parseInt(studentId));
    setSelectedStudent(student || null);
  };

  // Aller au prochain étudiant non noté
  const goToNextStudent = () => {
    const ungradedStudents = students.filter(s => {
      const existingGrade = grades.find(
        g => g.student_id === s.id && g.station_id === station.id
      );
      return !existingGrade || Object.keys(existingGrade.grades || {}).length === 0;
    });

    if (ungradedStudents.length > 0) {
      setSelectedStudent(ungradedStudents[0]);
    } else {
      alert('Tous les étudiants ont été notés pour cette station !');
    }
  };

  // Mettre à jour une note
  const handleGradeChange = (itemId, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    // Trouver l'item pour vérifier le max
    let maxPoints = 0;
    station.criteria.forEach(criterion => {
      const item = criterion.items.find(i => i.id === itemId);
      if (item) maxPoints = item.points;
    });

    // Limiter la note au maximum
    const finalValue = Math.min(numValue, maxPoints);

    setCurrentGrades(prev => ({
      ...prev,
      [itemId]: finalValue
    }));
  };

  // Sauvegarder les notes actuelles
  const saveCurrentGrades = async () => {
    if (!selectedStudent) return;

    try {
      // Calculer le score total
      const totalScore = getTotalScore();

      // Sauvegarder dans Supabase
      await saveGrade(
        professor.examId,
        station.id,
        selectedStudent.id,
        professor.email,
        currentGrades,
        totalScore
      );

      // Rafraîchir les données si callback fourni
      if (onGradesSaved) {
        await onGradesSaved();
      }

      updateGradedStudents();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde des notes. Vérifiez votre connexion.');
    }
  };

  // Réinitialiser les notes de l'étudiant actuel
  const resetCurrentGrades = () => {
    const firstName = selectedStudent.first_name || selectedStudent.firstName;
    const lastName = selectedStudent.last_name || selectedStudent.lastName;
    if (window.confirm(`Êtes-vous sûr de vouloir réinitialiser toutes les notes de ${firstName} ${lastName} ?`)) {
      setCurrentGrades({});
    }
  };

  // Marquer comme terminé et passer au suivant
  const finishAndNext = () => {
    saveCurrentGrades();
    goToNextStudent();
  };

  // Calculer le score d'un critère
  const getCriterionScore = (criterion) => {
    return calculateCriterionScore(currentGrades, criterion);
  };

  // Calculer le score total
  const getTotalScore = () => {
    return calculateTotalScore(currentGrades, station.id);
  };

  // Calculer la progression
  const getProgress = () => {
    const graded = gradedStudents.length;
    const total = students.length;
    return { graded, total, percentage: total > 0 ? (graded / total) * 100 : 0 };
  };

  const progress = getProgress();

  return (
    <div className="professor-grading">
      {/* En-tête avec informations du professeur */}
      <div className="grading-header">
        <div className="professor-info">
          <h2>{station.name}</h2>
          <p>
            Professeur: <strong>{professor.name}</strong>
          </p>
        </div>
        <div className="progress-info">
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress.percentage}%` }}></div>
          </div>
          <p>
            <strong>{progress.graded}</strong> / {progress.total} étudiants notés
            ({progress.percentage.toFixed(0)}%)
          </p>
        </div>
      </div>

      {/* Sélection d'étudiant */}
      <div className="student-selector-bar">
        <div className="selector-group">
          <label>
            <span className="selector-icon">👤</span>
            Étudiant à noter:
          </label>
          <select
            value={selectedStudent?.id || ''}
            onChange={(e) => handleSelectStudent(e.target.value)}
            className="student-select-large"
          >
            <option value="">-- Sélectionnez un étudiant --</option>
            {students.map(student => {
              const existingGrade = grades.find(
                g => g.student_id === student.id && g.station_id === station.id
              );
              const isGraded = existingGrade && Object.keys(existingGrade.grades || {}).length > 0;
              const firstName = student.first_name || student.firstName;
              const lastName = student.last_name || student.lastName;
              const number = student.student_number || student.number;
              return (
                <option key={student.id} value={student.id}>
                  {isGraded ? '✓ ' : '○ '}
                  {number} - {lastName} {firstName}
                </option>
              );
            })}
          </select>
        </div>

        <div className="quick-actions">
          <button
            className="btn btn-primary"
            onClick={goToNextStudent}
            title="Passer au prochain étudiant non noté"
          >
            ⏭️ Prochain Non Noté
          </button>
          <label className="auto-save-toggle">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
            />
            Sauvegarde auto
          </label>
          <button className="btn btn-success" onClick={saveCurrentGrades}>
            💾 Sauvegarder
          </button>
        </div>
      </div>

      {selectedStudent ? (
        <div className="grading-content">
          {/* Carte de l'étudiant */}
          <div className="student-card">
            <div className="student-card-header">
              <h3>
                {selectedStudent.first_name || selectedStudent.firstName} {selectedStudent.last_name || selectedStudent.lastName}
              </h3>
              <span className="student-number">N° {selectedStudent.student_number || selectedStudent.number}</span>
            </div>
            <div className="student-card-body">
              <div className="total-score-display">
                <span className="score-label">Note Totale:</span>
                <span className="score-value">
                  {getTotalScore().toFixed(2)} / {station.maxScore}
                </span>
              </div>
              <div className="student-actions">
                <button className="btn btn-warning" onClick={resetCurrentGrades}>
                  🔄 Réinitialiser
                </button>
                <button className="btn btn-success" onClick={finishAndNext}>
                  ✅ Terminer & Suivant
                </button>
              </div>
            </div>
          </div>

          {/* Grille de notation */}
          <div className="grading-form">
            {station.criteria.map((criterion, criterionIndex) => (
              <div key={criterion.id} className="criterion-section">
                <div className="criterion-header">
                  <h4>{criterion.name}</h4>
                  <span className="criterion-score">
                    {getCriterionScore(criterion).toFixed(2)} / {criterion.maxPoints}
                  </span>
                </div>

                <div className="items-grid">
                  {criterion.items.map((item, itemIndex) => (
                    <div key={item.id} className="grading-item">
                      <label className="item-label">
                        <span className="item-number">{itemIndex + 1}.</span>
                        {item.label}
                        <span className="item-max">/ {item.points}</span>
                      </label>
                      <div className="item-input-group">
                        <input
                          type="number"
                          min="0"
                          max={item.points}
                          step="0.25"
                          value={currentGrades[item.id] || 0}
                          onChange={(e) => handleGradeChange(item.id, e.target.value)}
                          className="grade-input-large"
                        />
                        <div className="quick-buttons">
                          <button
                            className="quick-btn"
                            onClick={() => handleGradeChange(item.id, 0)}
                            title="0 points"
                          >
                            0
                          </button>
                          <button
                            className="quick-btn"
                            onClick={() => handleGradeChange(item.id, item.points / 2)}
                            title="50%"
                          >
                            ½
                          </button>
                          <button
                            className="quick-btn"
                            onClick={() => handleGradeChange(item.id, item.points)}
                            title="Maximum"
                          >
                            Max
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Récapitulatif */}
          <div className="grading-summary">
            <h4>Récapitulatif de la Notation</h4>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Critère</th>
                  <th>Points Max</th>
                  <th>Points Obtenus</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {station.criteria.map(criterion => {
                  const score = getCriterionScore(criterion);
                  const percentage = (score / criterion.maxPoints) * 100;
                  return (
                    <tr key={criterion.id}>
                      <td>{criterion.name}</td>
                      <td>{criterion.maxPoints}</td>
                      <td>{score.toFixed(2)}</td>
                      <td>{percentage.toFixed(0)}%</td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td><strong>TOTAL</strong></td>
                  <td><strong>{station.maxScore}</strong></td>
                  <td><strong>{getTotalScore().toFixed(2)}</strong></td>
                  <td><strong>{((getTotalScore() / station.maxScore) * 100).toFixed(0)}%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-student-selected">
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <h3>Aucun étudiant sélectionné</h3>
            <p>Sélectionnez un étudiant dans la liste ci-dessus pour commencer la notation</p>
            <button className="btn btn-primary btn-large" onClick={goToNextStudent}>
              Commencer avec le Premier Étudiant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorGradingInterface;
