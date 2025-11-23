import { useState } from 'react';
import { getAllStations } from '../config/stationConfigs';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { calculateTotalScore } from '../config/stationConfigs';
import './ExportResults.css';

const ExportResults = ({ students, grades }) => {
  const [selectedStation, setSelectedStation] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const [exporting, setExporting] = useState(false);

  const stations = getAllStations();

  // Obtenir les étudiants avec notes pour une station
  const getStudentsWithGrades = (stationId) => {
    return students.filter(student => {
      const key = `${stationId}_${student.id}`;
      return grades[key] && Object.keys(grades[key]).length > 0;
    });
  };

  // Filtrer les étudiants selon l'option
  const getFilteredStudents = (stationId) => {
    const studentsWithGrades = getStudentsWithGrades(stationId);

    if (filterOption === 'all') {
      return students;
    } else if (filterOption === 'graded') {
      return studentsWithGrades;
    } else if (filterOption === 'ungraded') {
      const gradedIds = studentsWithGrades.map(s => s.id);
      return students.filter(s => !gradedIds.includes(s.id));
    }
    return students;
  };

  // Export vers Excel
  const handleExportExcel = async () => {
    if (!selectedStation) {
      alert('Veuillez sélectionner une station');
      return;
    }

    const filteredStudents = getFilteredStudents(selectedStation);
    if (filteredStudents.length === 0) {
      alert('Aucun étudiant à exporter avec ces filtres');
      return;
    }

    setExporting(true);
    try {
      exportToExcel(filteredStudents, grades, selectedStation);
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  // Export vers PDF
  const handleExportPDF = async () => {
    if (!selectedStation) {
      alert('Veuillez sélectionner une station');
      return;
    }

    const filteredStudents = getFilteredStudents(selectedStation);
    if (filteredStudents.length === 0) {
      alert('Aucun étudiant à exporter avec ces filtres');
      return;
    }

    setExporting(true);
    try {
      exportToPDF(filteredStudents, grades, selectedStation);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  // Obtenir les statistiques pour une station
  const getStationStats = (stationId) => {
    const studentsWithGrades = getStudentsWithGrades(stationId);
    if (studentsWithGrades.length === 0) return null;

    const scores = studentsWithGrades.map(student => {
      const key = `${stationId}_${student.id}`;
      return calculateTotalScore(grades[key], stationId);
    });

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    return { average, max, min, count: studentsWithGrades.length };
  };

  const stats = selectedStation ? getStationStats(selectedStation) : null;

  return (
    <div className="export-results">
      <h2>Export des Résultats</h2>

      <div className="export-config">
        <div className="config-section">
          <label>Station d'examen:</label>
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="config-select"
          >
            <option value="">-- Sélectionner une station --</option>
            {stations.map(station => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        </div>

        <div className="config-section">
          <label>Étudiants à exporter:</label>
          <div className="filter-options">
            <label className="filter-option">
              <input
                type="radio"
                value="all"
                checked={filterOption === 'all'}
                onChange={(e) => setFilterOption(e.target.value)}
              />
              Tous les étudiants
            </label>
            <label className="filter-option">
              <input
                type="radio"
                value="graded"
                checked={filterOption === 'graded'}
                onChange={(e) => setFilterOption(e.target.value)}
              />
              Uniquement les étudiants notés
            </label>
            <label className="filter-option">
              <input
                type="radio"
                value="ungraded"
                checked={filterOption === 'ungraded'}
                onChange={(e) => setFilterOption(e.target.value)}
              />
              Uniquement les étudiants non notés
            </label>
          </div>
        </div>
      </div>

      {selectedStation && (
        <>
          {/* Statistiques */}
          {stats && (
            <div className="export-stats">
              <h3>Statistiques de la station</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Étudiants notés</span>
                  <span className="stat-value">{stats.count}/{students.length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Moyenne</span>
                  <span className="stat-value">{stats.average.toFixed(2)}/20</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Note maximale</span>
                  <span className="stat-value">{stats.max.toFixed(2)}/20</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Note minimale</span>
                  <span className="stat-value">{stats.min.toFixed(2)}/20</span>
                </div>
              </div>
            </div>
          )}

          {/* Preview des étudiants */}
          <div className="export-preview">
            <h3>Aperçu des résultats à exporter</h3>
            <p className="preview-info">
              {getFilteredStudents(selectedStation).length} étudiant(s) sera(ont) exporté(s)
            </p>
            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Note</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredStudents(selectedStation).map(student => {
                    const key = `${selectedStation}_${student.id}`;
                    const hasGrades = grades[key] && Object.keys(grades[key]).length > 0;
                    const score = hasGrades ? calculateTotalScore(grades[key], selectedStation) : 0;

                    return (
                      <tr key={student.id}>
                        <td>{student.number}</td>
                        <td>{student.lastName}</td>
                        <td>{student.firstName}</td>
                        <td>
                          {hasGrades ? (
                            <span className="score-display">{score.toFixed(2)}/20</span>
                          ) : (
                            <span className="no-score">Non noté</span>
                          )}
                        </td>
                        <td>
                          {hasGrades ? (
                            <span className="status-badge graded">Noté</span>
                          ) : (
                            <span className="status-badge ungraded">Non noté</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Boutons d'export */}
          <div className="export-actions">
            <button
              className="btn btn-success"
              onClick={handleExportExcel}
              disabled={exporting}
            >
              {exporting ? '⏳ Export en cours...' : '📊 Exporter vers Excel'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleExportPDF}
              disabled={exporting}
            >
              {exporting ? '⏳ Export en cours...' : '📄 Exporter vers PDF'}
            </button>
          </div>
        </>
      )}

      {!selectedStation && (
        <div className="no-selection">
          <p>Sélectionnez une station d'examen pour exporter les résultats</p>
        </div>
      )}
    </div>
  );
};

export default ExportResults;
