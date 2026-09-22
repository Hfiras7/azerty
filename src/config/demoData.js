/**
 * Données de démonstration pour la Version 3.0
 * Simule la structure de données Supabase en localStorage
 */

// Initialiser les données de démonstration dans localStorage
export const initializeDemoData = () => {
  // Vérifier si les données existent déjà
  if (!localStorage.getItem('demo_initialized')) {
    // Matières
    const subjects = [
      {
        id: 'subject1',
        name: 'Pharmacologie',
        code: 'PHARM',
        description: 'Étude des médicaments et de leurs effets',
        createdBy: 'admin@ecole.fr',
        createdAt: '2025-01-15T10:00:00Z'
      },
      {
        id: 'subject2',
        name: 'Chimie Analytique',
        code: 'CHIM',
        description: 'Analyse et dosage de substances pharmaceutiques',
        createdBy: 'admin@ecole.fr',
        createdAt: '2025-01-15T10:05:00Z'
      },
      {
        id: 'subject3',
        name: 'Botanique',
        code: 'BOTA',
        description: 'Étude des plantes médicinales',
        createdBy: 'admin@ecole.fr',
        createdAt: '2025-01-15T10:10:00Z'
      }
    ];

    // Examens
    const exams = [
      {
        id: 'exam1',
        name: 'Examen Pharmacologie - Janvier 2025',
        subjectId: 'subject1',
        code: 'PHARM2025',
        adminId: 'prof.martin@ecole.fr',
        active: true,
        startDate: '2025-01-20',
        createdAt: '2025-01-15T11:00:00Z'
      },
      {
        id: 'exam2',
        name: 'Examen Chimie - Février 2025',
        subjectId: 'subject2',
        code: 'CHIM2025',
        adminId: 'admin@ecole.fr',
        active: false,
        startDate: '2025-02-15',
        createdAt: '2025-01-15T11:15:00Z'
      }
    ];

    // Stations pour l'examen de pharmacologie
    const stations = [
      {
        id: 'station1',
        examId: 'exam1',
        name: 'Station 3 - Dosage de la Vitamine C',
        maxScore: 20,
        order: 1,
        criteria: [
          {
            id: 'preparation',
            name: 'Préparation et manipulation',
            maxPoints: 4,
            items: [
              { id: 'materiel', label: 'Vérification du matériel', points: 1 },
              { id: 'proprete', label: 'Propreté et organisation', points: 1 },
              { id: 'securite', label: 'Respect des règles de sécurité', points: 2 }
            ]
          },
          {
            id: 'technique',
            name: 'Technique de dosage',
            maxPoints: 10,
            items: [
              { id: 'preparation_solution', label: 'Préparation de la solution', points: 3 },
              { id: 'titrage', label: 'Technique de titrage', points: 4 },
              { id: 'point_equivalence', label: 'Détermination du point d\'équivalence', points: 3 }
            ]
          },
          {
            id: 'calculs',
            name: 'Calculs et résultats',
            maxPoints: 4,
            items: [
              { id: 'calcul_concentration', label: 'Calcul de la concentration', points: 2 },
              { id: 'precision', label: 'Précision des résultats', points: 2 }
            ]
          },
          {
            id: 'communication',
            name: 'Communication',
            maxPoints: 2,
            items: [
              { id: 'explication', label: 'Explication claire de la démarche', points: 1 },
              { id: 'questions', label: 'Réponses aux questions', points: 1 }
            ]
          }
        ]
      },
      {
        id: 'station2',
        examId: 'exam1',
        name: 'Station 4A - Dosage de l\'Antipyrine',
        maxScore: 20,
        order: 2,
        criteria: [
          {
            id: 'preparation',
            name: 'Préparation',
            maxPoints: 5,
            items: [
              { id: 'materiel', label: 'Préparation du matériel', points: 2 },
              { id: 'reactifs', label: 'Préparation des réactifs', points: 3 }
            ]
          },
          {
            id: 'execution',
            name: 'Exécution',
            maxPoints: 12,
            items: [
              { id: 'protocole', label: 'Respect du protocole', points: 4 },
              { id: 'manipulation', label: 'Qualité de manipulation', points: 4 },
              { id: 'observations', label: 'Observations et relevés', points: 4 }
            ]
          },
          {
            id: 'resultats',
            name: 'Résultats',
            maxPoints: 3,
            items: [
              { id: 'calculs', label: 'Calculs corrects', points: 2 },
              { id: 'interpretation', label: 'Interprétation', points: 1 }
            ]
          }
        ]
      },
      {
        id: 'station3',
        examId: 'exam1',
        name: 'Station 4B - Dosage de l\'Acide Méfénamique',
        maxScore: 20,
        order: 3,
        criteria: [
          {
            id: 'preparation',
            name: 'Préparation',
            maxPoints: 6,
            items: [
              { id: 'organisation', label: 'Organisation du poste de travail', points: 2 },
              { id: 'solutions', label: 'Préparation des solutions', points: 4 }
            ]
          },
          {
            id: 'dosage',
            name: 'Réalisation du dosage',
            maxPoints: 11,
            items: [
              { id: 'technique', label: 'Technique opératoire', points: 5 },
              { id: 'precision', label: 'Précision des mesures', points: 3 },
              { id: 'proprete', label: 'Propreté et soin', points: 3 }
            ]
          },
          {
            id: 'analyse',
            name: 'Analyse',
            maxPoints: 3,
            items: [
              { id: 'resultats', label: 'Calculs et résultats', points: 2 },
              { id: 'discussion', label: 'Discussion critique', points: 1 }
            ]
          }
        ]
      }
    ];

    // Étudiants pour l'examen de pharmacologie
    const students = [
      { id: 'std1', examId: 'exam1', firstName: 'Ahmed', lastName: 'Benali', studentNumber: '2025001' },
      { id: 'std2', examId: 'exam1', firstName: 'Fatima', lastName: 'El Amrani', studentNumber: '2025002' },
      { id: 'std3', examId: 'exam1', firstName: 'Mohammed', lastName: 'Kassimi', studentNumber: '2025003' },
      { id: 'std4', examId: 'exam1', firstName: 'Salma', lastName: 'Idrissi', studentNumber: '2025004' },
      { id: 'std5', examId: 'exam1', firstName: 'Youssef', lastName: 'Bouazza', studentNumber: '2025005' },
      { id: 'std6', examId: 'exam1', firstName: 'Zineb', lastName: 'Tazi', studentNumber: '2025006' },
      { id: 'std7', examId: 'exam1', firstName: 'Amine', lastName: 'Fassi', studentNumber: '2025007' },
      { id: 'std8', examId: 'exam1', firstName: 'Khadija', lastName: 'Alami', studentNumber: '2025008' },
      { id: 'std9', examId: 'exam1', firstName: 'Omar', lastName: 'Berrada', studentNumber: '2025009' },
      { id: 'std10', examId: 'exam1', firstName: 'Meryem', lastName: 'Zaki', studentNumber: '2025010' }
    ];

    // Sauvegarder dans localStorage
    localStorage.setItem('demo_subjects', JSON.stringify(subjects));
    localStorage.setItem('demo_exams', JSON.stringify(exams));
    localStorage.setItem('demo_stations', JSON.stringify(stations));
    localStorage.setItem('demo_students', JSON.stringify(students));
    localStorage.setItem('demo_grades', JSON.stringify([])); // Pas de notes pour commencer
    localStorage.setItem('demo_initialized', 'true');
  }
};

// Obtenir toutes les matières
export const getSubjects = () => {
  return JSON.parse(localStorage.getItem('demo_subjects') || '[]');
};

// Obtenir une matière par ID
export const getSubjectById = (id) => {
  const subjects = getSubjects();
  return subjects.find(s => s.id === id);
};

// Obtenir tous les examens
export const getExams = () => {
  return JSON.parse(localStorage.getItem('demo_exams') || '[]');
};

// Obtenir les examens d'une matière
export const getExamsBySubject = (subjectId) => {
  const exams = getExams();
  return exams.filter(e => e.subjectId === subjectId);
};

// Obtenir un examen par ID
export const getExamById = (id) => {
  const exams = getExams();
  return exams.find(e => e.id === id);
};

// Vérifier le code d'un examen
export const verifyExamCode = (examId, code) => {
  const exam = getExamById(examId);
  return exam && exam.code === code;
};

// Obtenir les stations d'un examen
export const getStationsByExam = (examId) => {
  const stations = JSON.parse(localStorage.getItem('demo_stations') || '[]');
  return stations.filter(s => s.examId === examId).sort((a, b) => a.order - b.order);
};

// Obtenir une station par ID
export const getStationById = (id) => {
  const stations = JSON.parse(localStorage.getItem('demo_stations') || '[]');
  return stations.find(s => s.id === id);
};

// Obtenir les étudiants d'un examen
export const getStudentsByExam = (examId) => {
  const students = JSON.parse(localStorage.getItem('demo_students') || '[]');
  return students.filter(s => s.examId === examId);
};

// Obtenir les notes d'un examen
export const getGradesByExam = (examId) => {
  const grades = JSON.parse(localStorage.getItem('demo_grades') || '[]');
  return grades.filter(g => g.examId === examId);
};

// Sauvegarder une note
export const saveGrade = (gradeData) => {
  const grades = JSON.parse(localStorage.getItem('demo_grades') || '[]');

  // Vérifier si une note existe déjà pour cet étudiant/station
  const existingIndex = grades.findIndex(
    g => g.examId === gradeData.examId &&
         g.stationId === gradeData.stationId &&
         g.studentId === gradeData.studentId
  );

  if (existingIndex >= 0) {
    // Mettre à jour
    grades[existingIndex] = { ...gradeData, updatedAt: new Date().toISOString() };
  } else {
    // Ajouter
    grades.push({ ...gradeData, createdAt: new Date().toISOString() });
  }

  localStorage.setItem('demo_grades', JSON.stringify(grades));
  return true;
};

// Ajouter une nouvelle matière (Admin Master seulement)
export const createSubject = (subjectData) => {
  const subjects = getSubjects();
  const newSubject = {
    id: 'subject' + Date.now(),
    ...subjectData,
    createdAt: new Date().toISOString()
  };
  subjects.push(newSubject);
  localStorage.setItem('demo_subjects', JSON.stringify(subjects));
  return newSubject;
};

// Ajouter un nouvel examen (Admin Master ou Teacher)
export const createExam = (examData) => {
  const exams = getExams();
  const newExam = {
    id: 'exam' + Date.now(),
    ...examData,
    createdAt: new Date().toISOString()
  };
  exams.push(newExam);
  localStorage.setItem('demo_exams', JSON.stringify(exams));
  return newExam;
};

// Ajouter une nouvelle station (Admin Teacher)
export const createStation = (stationData) => {
  const stations = JSON.parse(localStorage.getItem('demo_stations') || '[]');
  const newStation = {
    id: 'station' + Date.now(),
    ...stationData
  };
  stations.push(newStation);
  localStorage.setItem('demo_stations', JSON.stringify(stations));
  return newStation;
};

// Ajouter un étudiant
export const createStudent = (studentData) => {
  const students = JSON.parse(localStorage.getItem('demo_students') || '[]');
  const newStudent = {
    id: 'std' + Date.now(),
    ...studentData
  };
  students.push(newStudent);
  localStorage.setItem('demo_students', JSON.stringify(students));
  return newStudent;
};

// Importer plusieurs étudiants
export const importStudents = (studentsArray, examId) => {
  const students = JSON.parse(localStorage.getItem('demo_students') || '[]');
  const newStudents = studentsArray.map((s, index) => ({
    id: 'std' + Date.now() + index,
    examId,
    ...s
  }));
  students.push(...newStudents);
  localStorage.setItem('demo_students', JSON.stringify(students));
  return newStudents;
};

export default {
  initializeDemoData,
  getSubjects,
  getSubjectById,
  getExams,
  getExamsBySubject,
  getExamById,
  verifyExamCode,
  getStationsByExam,
  getStationById,
  getStudentsByExam,
  getGradesByExam,
  saveGrade,
  createSubject,
  createExam,
  createStation,
  createStudent,
  importStudents
};
