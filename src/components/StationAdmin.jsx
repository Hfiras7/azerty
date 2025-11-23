import { useState, useEffect } from 'react';
import { stationConfigs } from '../config/stationConfigs';
import './StationAdmin.css';

const StationAdmin = ({ onClose }) => {
  const [stations, setStations] = useState([]);
  const [editingStation, setEditingStation] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Charger les stations au démarrage
  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = () => {
    const customStations = JSON.parse(localStorage.getItem('custom_stations') || 'null');

    if (customStations && customStations.length > 0) {
      setStations(customStations);
    } else {
      // Charger les stations par défaut
      const defaultStations = Object.values(stationConfigs).map(station => ({
        id: station.id,
        name: station.name,
        maxScore: station.maxScore,
        criteria: station.criteria,
        isDefault: true
      }));
      setStations(defaultStations);
    }
  };

  const saveStations = (updatedStations) => {
    localStorage.setItem('custom_stations', JSON.stringify(updatedStations));
    setStations(updatedStations);
  };

  const handleAddStation = () => {
    const newStation = {
      id: `station_${Date.now()}`,
      name: 'Nouvelle Station',
      maxScore: 20,
      criteria: [
        {
          id: 'criterion1',
          name: 'Critère 1',
          maxPoints: 10,
          items: [
            { id: 'item1', label: 'Item 1', points: 5 },
            { id: 'item2', label: 'Item 2', points: 5 }
          ]
        }
      ],
      isDefault: false
    };

    const updatedStations = [...stations, newStation];
    saveStations(updatedStations);
    setEditingStation(newStation);
    setShowAddForm(false);
  };

  const handleDeleteStation = (stationId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette station ?')) {
      const updatedStations = stations.filter(s => s.id !== stationId);
      saveStations(updatedStations);
    }
  };

  const handleUpdateStation = (updatedStation) => {
    const updatedStations = stations.map(s =>
      s.id === updatedStation.id ? updatedStation : s
    );
    saveStations(updatedStations);
    setEditingStation(null);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Voulez-vous vraiment restaurer les stations par défaut ? Cela supprimera toutes vos modifications.')) {
      localStorage.removeItem('custom_stations');
      loadStations();
      setEditingStation(null);
    }
  };

  const exportStations = () => {
    const dataStr = JSON.stringify(stations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stations_config_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importStations = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedStations = JSON.parse(e.target.result);
        if (Array.isArray(importedStations)) {
          saveStations(importedStations);
          alert('Stations importées avec succès !');
        } else {
          alert('Format de fichier invalide');
        }
      } catch (error) {
        alert('Erreur lors de l\'import : ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="station-admin-overlay">
      <div className="station-admin">
        <div className="admin-header">
          <h2>⚙️ Administration des Stations</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="admin-toolbar">
          <button className="btn btn-primary" onClick={handleAddStation}>
            ➕ Ajouter une Station
          </button>
          <button className="btn btn-secondary" onClick={exportStations}>
            📥 Exporter la Config
          </button>
          <label className="btn btn-secondary">
            📤 Importer la Config
            <input
              type="file"
              accept=".json"
              onChange={importStations}
              style={{ display: 'none' }}
            />
          </label>
          <button className="btn btn-warning" onClick={handleResetToDefaults}>
            🔄 Réinitialiser
          </button>
        </div>

        <div className="stations-list">
          {stations.map(station => (
            <div key={station.id} className="station-card">
              <div className="station-card-header">
                <h3>{station.name}</h3>
                <div className="station-card-actions">
                  <button
                    className="btn-icon"
                    onClick={() => setEditingStation(station)}
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  {!station.isDefault && (
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDeleteStation(station.id)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              <div className="station-card-body">
                <p>
                  <strong>Note maximale:</strong> {station.maxScore} points
                </p>
                <p>
                  <strong>Critères:</strong> {station.criteria.length}
                </p>
                <div className="criteria-preview">
                  {station.criteria.map(criterion => (
                    <span key={criterion.id} className="criterion-tag">
                      {criterion.name} ({criterion.maxPoints} pts)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {editingStation && (
          <StationEditor
            station={editingStation}
            onSave={handleUpdateStation}
            onCancel={() => setEditingStation(null)}
          />
        )}
      </div>
    </div>
  );
};

// Composant d'édition de station
const StationEditor = ({ station, onSave, onCancel }) => {
  const [editedStation, setEditedStation] = useState(JSON.parse(JSON.stringify(station)));

  const handleChange = (field, value) => {
    setEditedStation({ ...editedStation, [field]: value });
  };

  const handleCriterionChange = (criterionIndex, field, value) => {
    const updatedCriteria = [...editedStation.criteria];
    updatedCriteria[criterionIndex] = {
      ...updatedCriteria[criterionIndex],
      [field]: value
    };
    setEditedStation({ ...editedStation, criteria: updatedCriteria });
  };

  const handleItemChange = (criterionIndex, itemIndex, field, value) => {
    const updatedCriteria = [...editedStation.criteria];
    const updatedItems = [...updatedCriteria[criterionIndex].items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      [field]: value
    };
    updatedCriteria[criterionIndex] = {
      ...updatedCriteria[criterionIndex],
      items: updatedItems
    };
    setEditedStation({ ...editedStation, criteria: updatedCriteria });
  };

  const addCriterion = () => {
    const newCriterion = {
      id: `criterion_${Date.now()}`,
      name: 'Nouveau Critère',
      maxPoints: 5,
      items: []
    };
    setEditedStation({
      ...editedStation,
      criteria: [...editedStation.criteria, newCriterion]
    });
  };

  const addItem = (criterionIndex) => {
    const newItem = {
      id: `item_${Date.now()}`,
      label: 'Nouvel Item',
      points: 1
    };
    const updatedCriteria = [...editedStation.criteria];
    updatedCriteria[criterionIndex].items.push(newItem);
    setEditedStation({ ...editedStation, criteria: updatedCriteria });
  };

  return (
    <div className="station-editor-overlay">
      <div className="station-editor">
        <div className="editor-header">
          <h3>Édition de la Station</h3>
          <button className="btn-close" onClick={onCancel}>✕</button>
        </div>

        <div className="editor-body">
          <div className="form-group">
            <label>Nom de la Station</label>
            <input
              type="text"
              value={editedStation.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Note Maximale</label>
            <input
              type="number"
              value={editedStation.maxScore}
              onChange={(e) => handleChange('maxScore', parseFloat(e.target.value))}
            />
          </div>

          <div className="criteria-editor">
            <div className="section-header">
              <h4>Critères d'Évaluation</h4>
              <button className="btn btn-sm btn-primary" onClick={addCriterion}>
                ➕ Ajouter un Critère
              </button>
            </div>

            {editedStation.criteria.map((criterion, cIndex) => (
              <div key={criterion.id} className="criterion-editor">
                <div className="criterion-header">
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) => handleCriterionChange(cIndex, 'name', e.target.value)}
                    placeholder="Nom du critère"
                  />
                  <input
                    type="number"
                    value={criterion.maxPoints}
                    onChange={(e) => handleCriterionChange(cIndex, 'maxPoints', parseFloat(e.target.value))}
                    placeholder="Points max"
                    style={{ width: '100px' }}
                  />
                </div>

                <div className="items-editor">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => addItem(cIndex)}
                  >
                    ➕ Ajouter un Item
                  </button>

                  {criterion.items.map((item, iIndex) => (
                    <div key={item.id} className="item-editor">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleItemChange(cIndex, iIndex, 'label', e.target.value)}
                        placeholder="Description de l'item"
                      />
                      <input
                        type="number"
                        value={item.points}
                        onChange={(e) => handleItemChange(cIndex, iIndex, 'points', parseFloat(e.target.value))}
                        placeholder="Points"
                        style={{ width: '80px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="editor-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={() => onSave(editedStation)}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default StationAdmin;
