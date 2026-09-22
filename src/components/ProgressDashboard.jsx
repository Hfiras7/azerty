import { useState, useEffect } from 'react';
import { calculateTotalScore } from '../config/stationConfigs';
import './ProgressDashboard.css';

const ProgressDashboard = ({ students, grades }) => {
  const [stations, setStations] = useState([]);
  const [activeProfessors, setActiveProfessors] = useState([]);

  useEffect(() => {
    loadStations();
    loadActiveProfessors();
  }, []);

  const loadStations = () => {
    const customStations = JSON.parse(localStorage.getItem('custom_stations') || 'null');
    if (customStations) {
      setStations(customStations);
    }
  };

  const loadActiveProfessors = () => {
    const profs = JSON.parse(localStorage.getItem('active_professors') || '[]');
    setActiveProfessors(profs);
  };

  // Obtenir les statistiques pour une station
  const getStationStats = (stationId) => {
    const gradedStudents = students.filter(student => {
      const key = `${stationId}_${student.id}`;
      return grades[key] && Object.keys(grades[key]).length > 0;
    });

    const total = students.length;
    const graded = gradedStudents.length;
    const percentage = total > 0 ? (graded / total) * 100 : 0;

    // Calculer les scores
    let totalScore = 0;
    let maxScore = 0;

    gradedStudents.forEach(student => {
      const key = `${stationId}_${student.id}`;
      const station = stations.find(s => s.id === stationId);
      if (station) {
        totalScore += calculateTotalScore(grades[key], stationId);
        maxScore = station.maxScore;
      }
    });

    const average = graded > 0 ? totalScore / graded : 0;

    return {
      graded,
      total,
      percentage,
      average,
      maxScore
    };
  };

  // Obtenir la progression globale
  const getGlobalProgress = () => {
    const totalSlots = students.length * stations.length;
    let gradedSlots = 0;

    stations.forEach(station => {
      const stats = getStationStats(station.id);
      gradedSlots += stats.graded;
    });

    const percentage = totalSlots > 0 ? (gradedSlots / totalSlots) * 100 : 0;

    return {
      gradedSlots,
      totalSlots,
      percentage
    };
  };

  // Obtenir les étudiants complètement notés
  const getCompletedStudents = () => {
    return students.filter(student => {
      return stations.every(station => {
        const key = `${station.id}_${student.id}`;
        return grades[key] && Object.keys(grades[key]).length > 0;
      });
    });
  };

  // Obtenir les étudiants non commencés
  const getNotStartedStudents = () => {
    return students.filter(student => {
      return stations.every(station => {
        const key = `${station.id}_${student.id}`;
        return !grades[key] || Object.keys(grades[key]).length === 0;
      });
    });
  };

  const globalProgress = getGlobalProgress();
  const completedStudents = getCompletedStudents();
  const notStartedStudents = getNotStartedStudents();

  return (
    <div className="progress-dashboard">
      <h2>📊 Tableau de Bord - Progression Globale</h2>

      {/* Progression globale */}
      <div className="global-progress-card">
        <h3>Progression Générale</h3>
        <div className="big-progress-bar">
          <div
            className="big-progress-fill"
            style={{ width: `${globalProgress.percentage}%` }}
          ></div>
        </div>
        <p className="progress-text">
          <strong>{globalProgress.gradedSlots}</strong> / {globalProgress.totalSlots} évaluations
          complétées ({globalProgress.percentage.toFixed(1)}%)
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="quick-stats">
        <div className="stat-box success">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-number">{completedStudents.length}</span>
            <span className="stat-label">Étudiants Terminés</span>
          </div>
        </div>

        <div className="stat-box warning">
          <span className="stat-icon">⏳</span>
          <div className="stat-content">
            <span className="stat-number">
              {students.length - completedStudents.length - notStartedStudents.length}
            </span>
            <span className="stat-label">En Cours</span>
          </div>
        </div>

        <div className="stat-box info">
          <span className="stat-icon">○</span>
          <div className="stat-content">
            <span className="stat-number">{notStartedStudents.length}</span>
            <span className="stat-label">Non Commencés</span>
          </div>
        </div>

        <div className="stat-box primary">
          <span className="stat-icon">📋</span>
          <div className="stat-content">
            <span className="stat-number">{stations.length}</span>
            <span className="stat-label">Stations Actives</span>
          </div>
        </div>
      </div>

      {/* Progression par station */}
      <div className="stations-progress">
        <h3>Progression par Station</h3>
        <div className="stations-grid">
          {stations.map(station => {
            const stats = getStationStats(station.id);
            return (
              <div key={station.id} className="station-progress-card">
                <div className="station-header">
                  <h4>{station.name}</h4>
                </div>
                <div className="station-stats">
                  <div className="stat-row">
                    <span className="stat-label">Progression:</span>
                    <span className="stat-value">
                      {stats.graded} / {stats.total} ({stats.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="station-progress-bar">
                    <div
                      className="station-progress-fill"
                      style={{ width: `${stats.percentage}%` }}
                    ></div>
                  </div>
                  {stats.graded > 0 && (
                    <div className="stat-row">
                      <span className="stat-label">Moyenne:</span>
                      <span className="stat-value average">
                        {stats.average.toFixed(2)} / {stats.maxScore}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Professeurs actifs */}
      {activeProfessors.length > 0 && (
        <div className="active-professors">
          <h3>👥 Professeurs Actifs</h3>
          <div className="professors-list">
            {activeProfessors.map((prof, index) => (
              <div key={index} className="professor-badge">
                <span className="prof-icon">👤</span>
                <div className="prof-info">
                  <strong>{prof.name}</strong>
                  <span className="prof-station">
                    {stations.find(s => s.id === prof.stationId)?.name || prof.stationId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matrice de progression */}
      <div className="progress-matrix">
        <h3>Matrice de Progression Détaillée</h3>
        <div className="matrix-container">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                {stations.map(station => (
                  <th key={station.id} className="station-col">
                    {station.name.replace('Station ', 'S')}
                  </th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                let completedCount = 0;
                return (
                  <tr key={student.id}>
                    <td className="student-name">
                      {student.number} - {student.lastName} {student.firstName}
                    </td>
                    {stations.map(station => {
                      const key = `${station.id}_${student.id}`;
                      const isGraded = grades[key] && Object.keys(grades[key]).length > 0;
                      if (isGraded) completedCount++;
                      const score = isGraded ? calculateTotalScore(grades[key], station.id) : null;

                      return (
                        <td key={station.id} className={`status-cell ${isGraded ? 'graded' : 'not-graded'}`}>
                          {isGraded ? (
                            <span className="score-badge" title={`${score?.toFixed(2)} / ${station.maxScore}`}>
                              ✓ {score?.toFixed(1)}
                            </span>
                          ) : (
                            <span className="pending-badge">○</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="total-cell">
                      {completedCount} / {stations.length}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
