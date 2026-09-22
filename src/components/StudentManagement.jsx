import { useState, useRef } from 'react';
import { importFromCSV, importFromExcel } from '../utils/exportUtils';
import { createStudent, importStudents, deleteStudent } from '../config/supabase';
import './StudentManagement.css';

const StudentManagement = ({ examId, students, onRefresh }) => {
  const [newStudent, setNewStudent] = useState({
    lastName: '',
    firstName: '',
    number: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Ajouter un étudiant manuellement
  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!newStudent.lastName || !newStudent.firstName) {
      alert('Veuillez remplir au moins le nom et le prénom');
      return;
    }

    try {
      await createStudent(
        examId,
        newStudent.firstName.trim(),
        newStudent.lastName.trim(),
        newStudent.number.trim() || `${students.length + 1}`
      );

      alert('✅ Étudiant ajouté avec succès !');
      setNewStudent({ lastName: '', firstName: '', number: '' });

      // Rafraîchir la liste
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('❌ Erreur lors de l\'ajout de l\'étudiant: ' + error.message);
    }
  };

  // Supprimer un étudiant
  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
      try {
        await deleteStudent(studentId);
        alert('✅ Étudiant supprimé avec succès !');

        // Rafraîchir la liste
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  // Import de fichier
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);

    try {
      let importedStudents = [];

      if (file.name.endsWith('.csv')) {
        importedStudents = await importFromCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        importedStudents = await importFromExcel(file);
      } else {
        alert('Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls)');
        setImporting(false);
        return;
      }

      if (importedStudents.length > 0) {
        // Importer dans Supabase
        await importStudents(examId, importedStudents);
        alert(`✅ ${importedStudents.length} étudiant(s) importé(s) avec succès`);

        // Rafraîchir la liste
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        alert('Aucun étudiant trouvé dans le fichier');
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import du fichier');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filtrer les étudiants par recherche
  const filteredStudents = students.filter(student => {
    const lastName = (student.last_name || student.lastName || '').toLowerCase();
    const firstName = (student.first_name || student.firstName || '').toLowerCase();
    const number = (student.student_number || student.number || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return lastName.includes(search) || firstName.includes(search) || number.includes(search);
  });

  // Exporter la liste des étudiants
  const handleExportStudents = () => {
    const csvContent = 'Nom,Prénom,Numéro\n' +
      students.map(s => {
        const lastName = s.last_name || s.lastName;
        const firstName = s.first_name || s.firstName;
        const number = s.student_number || s.number;
        return `${lastName},${firstName},${number}`;
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `etudiants_${new Date().toLocaleDateString('fr-FR')}.csv`;
    link.click();
  };

  return (
    <div className="student-management">
      <h2>Gestion des Étudiants</h2>

      {/* Formulaire d'ajout manuel */}
      <div className="add-student-form">
        <h3>Ajouter un étudiant</h3>
        <form onSubmit={handleAddStudent}>
          <input
            type="text"
            placeholder="Nom *"
            value={newStudent.lastName}
            onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Prénom *"
            value={newStudent.firstName}
            onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Numéro"
            value={newStudent.number}
            onChange={(e) => setNewStudent({ ...newStudent, number: e.target.value })}
          />
          <button type="submit" className="btn btn-primary">Ajouter</button>
        </form>
      </div>

      {/* Import depuis fichier */}
      <div className="import-section">
        <h3>Importer depuis un fichier</h3>
        <div className="import-controls">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current.click()}
            disabled={importing}
          >
            {importing ? 'Import en cours...' : 'Importer CSV/Excel'}
          </button>
          <small>Format: Nom, Prénom, Numéro (une ligne par étudiant)</small>
        </div>
      </div>

      {/* Liste des étudiants */}
      <div className="students-list">
        <div className="list-header">
          <h3>Liste des étudiants ({students.length})</h3>
          <div className="list-actions">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {students.length > 0 && (
              <button className="btn btn-secondary" onClick={handleExportStudents}>
                Exporter la liste
              </button>
            )}
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <p className="no-students">
            {students.length === 0
              ? 'Aucun étudiant enregistré. Ajoutez-en un ou importez une liste.'
              : 'Aucun étudiant trouvé pour cette recherche.'}
          </p>
        ) : (
          <table className="students-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>{student.student_number || student.number}</td>
                  <td>{student.last_name || student.lastName}</td>
                  <td>{student.first_name || student.firstName}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
