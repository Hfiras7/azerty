import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { stationConfigs, calculateTotalScore, calculateCriterionScore } from '../config/stationConfigs';

// Export vers Excel
export const exportToExcel = (students, grades, stationId) => {
  const station = stationConfigs[stationId];
  if (!station) {
    alert('Station non trouvée');
    return;
  }

  // Préparer les données pour Excel
  const data = students.map(student => {
    const studentGrades = grades[`${stationId}_${student.id}`] || {};
    const row = {
      'Nom': student.lastName,
      'Prénom': student.firstName,
      'Numéro': student.number
    };

    // Ajouter les notes par critère
    station.criteria.forEach(criterion => {
      const criterionScore = calculateCriterionScore(studentGrades, criterion);
      row[criterion.name] = `${criterionScore.toFixed(2)}/${criterion.maxPoints}`;

      // Ajouter le détail des items
      criterion.items.forEach(item => {
        const itemGrade = studentGrades[item.id] || 0;
        row[`  ${item.label}`] = `${itemGrade}/${item.points}`;
      });
    });

    // Ajouter le total
    const total = calculateTotalScore(studentGrades, stationId);
    row['Note Finale'] = `${total.toFixed(2)}/${station.maxScore}`;

    return row;
  });

  // Créer le classeur Excel
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, station.name);

  // Télécharger le fichier
  const fileName = `${station.name}_${new Date().toLocaleDateString('fr-FR')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Export vers PDF
export const exportToPDF = (students, grades, stationId) => {
  const station = stationConfigs[stationId];
  if (!station) {
    alert('Station non trouvée');
    return;
  }

  const doc = new jsPDF('landscape');

  // Titre
  doc.setFontSize(16);
  doc.text(station.name, 14, 15);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);

  // Préparer les données pour le tableau
  const headers = ['Nom', 'Prénom', 'N°'];

  // Ajouter les critères aux en-têtes
  station.criteria.forEach(criterion => {
    headers.push(`${criterion.name}\n(/${criterion.maxPoints})`);
  });
  headers.push(`Total\n(/${station.maxScore})`);

  const data = students.map(student => {
    const studentGrades = grades[`${stationId}_${student.id}`] || {};
    const row = [
      student.lastName,
      student.firstName,
      student.number
    ];

    // Ajouter les scores par critère
    station.criteria.forEach(criterion => {
      const criterionScore = calculateCriterionScore(studentGrades, criterion);
      row.push(criterionScore.toFixed(2));
    });

    // Ajouter le total
    const total = calculateTotalScore(studentGrades, stationId);
    row.push(total.toFixed(2));

    return row;
  });

  // Générer le tableau
  doc.autoTable({
    head: [headers],
    body: data,
    startY: 28,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [66, 139, 202], halign: 'center' },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 30 },
      2: { cellWidth: 15, halign: 'center' }
    }
  });

  // Ajouter une page détaillée pour chaque étudiant
  students.forEach((student, index) => {
    doc.addPage();
    doc.setFontSize(14);
    doc.text(`Détail de l'évaluation - ${student.firstName} ${student.lastName}`, 14, 15);

    const studentGrades = grades[`${stationId}_${student.id}`] || {};

    // Préparer le tableau détaillé
    const detailData = [];

    station.criteria.forEach(criterion => {
      // Ligne de critère
      detailData.push([
        { content: criterion.name, styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } },
        { content: `/${criterion.maxPoints}`, styles: { fontStyle: 'bold', fillColor: [230, 230, 230], halign: 'center' } },
        { content: calculateCriterionScore(studentGrades, criterion).toFixed(2), styles: { fontStyle: 'bold', fillColor: [230, 230, 230], halign: 'center' } }
      ]);

      // Lignes des items
      criterion.items.forEach(item => {
        const itemGrade = studentGrades[item.id] || 0;
        detailData.push([
          `  ${item.label}`,
          `/${item.points}`,
          itemGrade
        ]);
      });
    });

    // Ligne du total
    const total = calculateTotalScore(studentGrades, stationId);
    detailData.push([
      { content: 'NOTE FINALE', styles: { fontStyle: 'bold', fillColor: [66, 139, 202], textColor: [255, 255, 255] } },
      { content: `/${station.maxScore}`, styles: { fontStyle: 'bold', fillColor: [66, 139, 202], textColor: [255, 255, 255], halign: 'center' } },
      { content: total.toFixed(2), styles: { fontStyle: 'bold', fillColor: [66, 139, 202], textColor: [255, 255, 255], halign: 'center' } }
    ]);

    doc.autoTable({
      head: [['Critère', 'Points max', 'Note obtenue']],
      body: detailData,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { cellWidth: 140 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' }
      }
    });
  });

  // Télécharger le PDF
  const fileName = `${station.name}_${new Date().toLocaleDateString('fr-FR')}.pdf`;
  doc.save(fileName);
};

// Import depuis CSV
export const importFromCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const students = [];

        // Ignorer la première ligne si c'est un en-tête
        const startIndex = lines[0].toLowerCase().includes('nom') ||
                          lines[0].toLowerCase().includes('prénom') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(/[,;]/); // Support virgule et point-virgule
          if (parts.length >= 2) {
            students.push({
              id: Date.now() + i,
              lastName: parts[0].trim(),
              firstName: parts[1].trim(),
              number: parts[2] ? parts[2].trim() : `${i}`
            });
          }
        }

        resolve(students);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Import depuis Excel
export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const students = [];
        const startIndex = 1; // Ignorer la première ligne (en-têtes)

        for (let i = startIndex; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.length >= 2 && row[0] && row[1]) {
            students.push({
              id: Date.now() + i,
              lastName: String(row[0]).trim(),
              firstName: String(row[1]).trim(),
              number: row[2] ? String(row[2]).trim() : `${i}`
            });
          }
        }

        resolve(students);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
