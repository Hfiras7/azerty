import { useState, useEffect } from 'react';
import StudentManagement from './StudentManagement';
import StationAdmin from './StationAdmin';
import ProgressDashboard from './ProgressDashboard';
import { getStationsByExam, getStudentsByExam, getGradesByExam } from '../config/supabase';
import './ExamManagement.css';

/**
 * Interface de gestion complète d'un examen pour admin_master
 * Permet de gérer : Stations, Étudiants, Tableau de bord
 */
const ExamManagement = ({ exam, onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('stations');
  const [stations, setStations] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStationModal, setShowStationModal] = useState(false);

  // Charger les données de l'examen
  useEffect(() => {
    loadExamData();
  }, [exam.id]);

  const loadExamData = async () => {
    try {
      setLoading(true);
      const [stationsData, studentsData, gradesData] = await Promise.all([
        getStationsByExam(exam.id),
        getStudentsByExam(exam.id),
        getGradesByExam(exam.id)
      ]);
      setStations(stationsData);
      setStudents(studentsData);
      setGrades(gradesData);
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadExamData();
    if (onRefresh) await onRefresh();
  };

  if (loading) {
    return (
      <div className="exam-management loading">
        <p>Chargement des données de l'examen...</p>
      </div>
    );
  }

  return (
    <div className="exam-management">
      {/* En-tête avec retour */}
      <div className="exam-management-header">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Retour aux Examens
        </button>
        <div className="exam-info">
          <h2>📝 {exam.name}</h2>
          <p>
            Code: <strong>{exam.code}</strong> •
            {stations.length} station(s) •
            {students.length} étudiant(s)
          </p>
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'stations' ? 'active' : ''}`}
          onClick={() => setActiveTab('stations')}
        >
          🎯 Stations ({stations.length})
        </button>
        <button
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 Étudiants ({students.length})
        </button>
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Tableau de Bord
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      <div className="tab-content">
        {activeTab === 'stations' && (
          <div className="stations-tab">
            <div className="tab-header">
              <h3>🎯 Gestion des Stations</h3>
              <button
                className="btn btn-primary"
                onClick={() => setShowStationModal(true)}
              >
                + Nouvelle Station
              </button>
            </div>

            {stations.length === 0 ? (
              <div className="empty-state">
                <p>Aucune station configurée pour cet examen.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowStationModal(true)}
                >
                  Créer la première station
                </button>
              </div>
            ) : (
              <div className="stations-list">
                {stations.map((station, index) => (
                  <div key={station.id} className="station-card">
                    <div className="station-header">
                      <h4>Station {index + 1}: {station.name}</h4>
                      <span className="station-score">Max: {station.max_score} pts</span>
                    </div>
                    <div className="station-info">
                      <p>Critères: {station.criteria?.length || 0}</p>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setShowStationModal(true)}
                      >
                        ✏️ Modifier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal de gestion des stations */}
            {showStationModal && (
              <div className="modal-overlay" onClick={() => setShowStationModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <StationAdmin
                    examId={exam.id}
                    onClose={() => {
                      setShowStationModal(false);
                      handleRefresh();
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="students-tab">
            <StudentManagement
              examId={exam.id}
              students={students}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
            <ProgressDashboard
              students={students}
              grades={grades}
              stations={stations}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamManagement;
