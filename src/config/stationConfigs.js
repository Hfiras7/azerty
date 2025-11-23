// Configuration complète des grilles d'évaluation pour les 5 stations

export const stationConfigs = {
  station3: {
    id: 'station3',
    name: 'Station 3 - Dosage de la Vitamine C',
    maxScore: 20,
    criteria: [
      {
        id: 'preparation',
        name: 'Préparation et manipulation',
        maxPoints: 4,
        items: [
          { id: 'materiel', label: 'Vérification du matériel', points: 1 },
          { id: 'proprete', label: 'Propreté et organisation', points: 1 },
          { id: 'securite', label: 'Respect des consignes de sécurité', points: 1 },
          { id: 'technique', label: 'Technique de manipulation', points: 1 }
        ]
      },
      {
        id: 'titrage',
        name: 'Réalisation du titrage',
        maxPoints: 6,
        items: [
          { id: 'burette', label: 'Remplissage correct de la burette', points: 1 },
          { id: 'indicateur', label: 'Ajout de l\'indicateur coloré', points: 1 },
          { id: 'titrage_technique', label: 'Technique de titrage appropriée', points: 2 },
          { id: 'detection', label: 'Détection du point d\'équivalence', points: 1 },
          { id: 'lecture', label: 'Lecture correcte du volume', points: 1 }
        ]
      },
      {
        id: 'calculs',
        name: 'Calculs et résultats',
        maxPoints: 6,
        items: [
          { id: 'formule', label: 'Utilisation de la formule correcte', points: 2 },
          { id: 'precision', label: 'Précision des calculs', points: 2 },
          { id: 'unites', label: 'Unités appropriées', points: 1 },
          { id: 'resultat_final', label: 'Résultat final correct', points: 1 }
        ]
      },
      {
        id: 'interpretation',
        name: 'Interprétation et discussion',
        maxPoints: 4,
        items: [
          { id: 'analyse', label: 'Analyse critique des résultats', points: 2 },
          { id: 'erreurs', label: 'Identification des sources d\'erreur', points: 1 },
          { id: 'conclusion', label: 'Conclusion appropriée', points: 1 }
        ]
      }
    ]
  },

  station4a: {
    id: 'station4a',
    name: 'Station 4A - Antipyrine',
    maxScore: 20,
    criteria: [
      {
        id: 'identification',
        name: 'Identification du principe actif',
        maxPoints: 5,
        items: [
          { id: 'aspect', label: 'Description de l\'aspect physique', points: 1 },
          { id: 'point_fusion', label: 'Détermination du point de fusion', points: 2 },
          { id: 'tests_chimiques', label: 'Tests d\'identification chimique', points: 2 }
        ]
      },
      {
        id: 'dosage',
        name: 'Dosage spectrophotométrique',
        maxPoints: 7,
        items: [
          { id: 'preparation_solution', label: 'Préparation de la solution', points: 2 },
          { id: 'dilution', label: 'Dilutions appropriées', points: 1 },
          { id: 'mesure_absorbance', label: 'Mesure de l\'absorbance', points: 2 },
          { id: 'exploitation', label: 'Exploitation de la courbe d\'étalonnage', points: 2 }
        ]
      },
      {
        id: 'calculs',
        name: 'Calculs et résultats',
        maxPoints: 5,
        items: [
          { id: 'concentration', label: 'Calcul de la concentration', points: 2 },
          { id: 'teneur', label: 'Calcul de la teneur', points: 2 },
          { id: 'conformite', label: 'Vérification de la conformité', points: 1 }
        ]
      },
      {
        id: 'compte_rendu',
        name: 'Compte rendu',
        maxPoints: 3,
        items: [
          { id: 'organisation', label: 'Organisation et clarté', points: 1 },
          { id: 'precision', label: 'Précision des données', points: 1 },
          { id: 'interpretation', label: 'Interprétation des résultats', points: 1 }
        ]
      }
    ]
  },

  station4b: {
    id: 'station4b',
    name: 'Station 4B - Acide Méfénamique',
    maxScore: 20,
    criteria: [
      {
        id: 'identification',
        name: 'Identification du principe actif',
        maxPoints: 5,
        items: [
          { id: 'solubilite', label: 'Tests de solubilité', points: 1 },
          { id: 'ccm', label: 'Chromatographie sur couche mince (CCM)', points: 2 },
          { id: 'tests_specifiques', label: 'Tests d\'identification spécifiques', points: 2 }
        ]
      },
      {
        id: 'dosage',
        name: 'Dosage par titrimétrie',
        maxPoints: 7,
        items: [
          { id: 'dissolution', label: 'Dissolution de l\'échantillon', points: 1 },
          { id: 'preparation_titrant', label: 'Préparation de la solution titrante', points: 2 },
          { id: 'titrage', label: 'Réalisation du titrage', points: 2 },
          { id: 'point_equivalence', label: 'Détermination du point d\'équivalence', points: 2 }
        ]
      },
      {
        id: 'calculs',
        name: 'Calculs et résultats',
        maxPoints: 5,
        items: [
          { id: 'masse', label: 'Calcul de la masse théorique', points: 2 },
          { id: 'purete', label: 'Calcul de la pureté', points: 2 },
          { id: 'validation', label: 'Validation selon pharmacopée', points: 1 }
        ]
      },
      {
        id: 'compte_rendu',
        name: 'Compte rendu',
        maxPoints: 3,
        items: [
          { id: 'redaction', label: 'Qualité de la rédaction', points: 1 },
          { id: 'rigueur', label: 'Rigueur scientifique', points: 1 },
          { id: 'conclusion', label: 'Conclusion pertinente', points: 1 }
        ]
      }
    ]
  },

  station4c: {
    id: 'station4c',
    name: 'Station 4C - Paracétamol',
    maxScore: 20,
    criteria: [
      {
        id: 'identification',
        name: 'Identification du principe actif',
        maxPoints: 5,
        items: [
          { id: 'aspect', label: 'Caractères organoleptiques', points: 1 },
          { id: 'ir', label: 'Spectrométrie infrarouge (IR)', points: 2 },
          { id: 'reactions', label: 'Réactions d\'identification', points: 2 }
        ]
      },
      {
        id: 'dosage',
        name: 'Dosage par HPLC',
        maxPoints: 7,
        items: [
          { id: 'preparation_echantillon', label: 'Préparation de l\'échantillon', points: 2 },
          { id: 'injection', label: 'Injection et paramètres HPLC', points: 1 },
          { id: 'chromatogramme', label: 'Acquisition du chromatogramme', points: 2 },
          { id: 'integration', label: 'Intégration des pics', points: 2 }
        ]
      },
      {
        id: 'calculs',
        name: 'Calculs et résultats',
        maxPoints: 5,
        items: [
          { id: 'surface', label: 'Calcul à partir des surfaces', points: 2 },
          { id: 'teneur', label: 'Détermination de la teneur', points: 2 },
          { id: 'specifications', label: 'Conformité aux spécifications', points: 1 }
        ]
      },
      {
        id: 'compte_rendu',
        name: 'Compte rendu',
        maxPoints: 3,
        items: [
          { id: 'presentation', label: 'Présentation des résultats', points: 1 },
          { id: 'analyse', label: 'Analyse critique', points: 1 },
          { id: 'synthese', label: 'Synthèse et conclusion', points: 1 }
        ]
      }
    ]
  },

  station4d: {
    id: 'station4d',
    name: 'Station 4D - Aspirine',
    maxScore: 20,
    criteria: [
      {
        id: 'identification',
        name: 'Identification du principe actif',
        maxPoints: 5,
        items: [
          { id: 'point_fusion', label: 'Point de fusion', points: 1 },
          { id: 'uv', label: 'Spectrométrie UV-Visible', points: 2 },
          { id: 'reactions_caracteristiques', label: 'Réactions caractéristiques', points: 2 }
        ]
      },
      {
        id: 'dosage',
        name: 'Dosage acido-basique',
        maxPoints: 7,
        items: [
          { id: 'pesee', label: 'Pesée précise de l\'échantillon', points: 1 },
          { id: 'dissolution', label: 'Dissolution dans solvant approprié', points: 1 },
          { id: 'titrage_naoh', label: 'Titrage par NaOH', points: 3 },
          { id: 'reperage', label: 'Repérage de l\'équivalence', points: 2 }
        ]
      },
      {
        id: 'calculs',
        name: 'Calculs et résultats',
        maxPoints: 5,
        items: [
          { id: 'quantite', label: 'Calcul de la quantité de matière', points: 2 },
          { id: 'pourcentage', label: 'Pourcentage en principe actif', points: 2 },
          { id: 'norme', label: 'Comparaison à la norme', points: 1 }
        ]
      },
      {
        id: 'compte_rendu',
        name: 'Compte rendu',
        maxPoints: 3,
        items: [
          { id: 'structure', label: 'Structure et organisation', points: 1 },
          { id: 'precision_donnees', label: 'Précision des données expérimentales', points: 1 },
          { id: 'discussion', label: 'Discussion des résultats', points: 1 }
        ]
      }
    ]
  }
};

// Fonction utilitaire pour obtenir toutes les stations
export const getAllStations = () => {
  return Object.values(stationConfigs);
};

// Fonction utilitaire pour obtenir une station spécifique
export const getStation = (stationId) => {
  return stationConfigs[stationId];
};

// Fonction pour calculer le score total d'une évaluation
export const calculateTotalScore = (grades, stationId) => {
  const station = stationConfigs[stationId];
  if (!station) return 0;

  let total = 0;
  station.criteria.forEach(criterion => {
    criterion.items.forEach(item => {
      const grade = grades[item.id];
      if (grade !== undefined && grade !== null) {
        total += parseFloat(grade) || 0;
      }
    });
  });

  return Math.min(total, station.maxScore);
};

// Fonction pour calculer le score par critère
export const calculateCriterionScore = (grades, criterion) => {
  let total = 0;
  criterion.items.forEach(item => {
    const grade = grades[item.id];
    if (grade !== undefined && grade !== null) {
      total += parseFloat(grade) || 0;
    }
  });
  return Math.min(total, criterion.maxPoints);
};
