import { getAllStations } from '../config/stationConfigs';
import './StationSelector.css';

const StationSelector = ({ selectedStation, onSelectStation }) => {
  const stations = getAllStations();

  return (
    <div className="station-selector">
      <h2>Sélectionner une station d'examen</h2>
      <div className="stations-grid">
        {stations.map(station => (
          <div
            key={station.id}
            className={`station-card ${selectedStation?.id === station.id ? 'selected' : ''}`}
            onClick={() => onSelectStation(station)}
          >
            <h3>{station.name}</h3>
            <div className="station-info">
              <p>
                <strong>{station.criteria.length}</strong> critères d'évaluation
              </p>
              <p>
                Note maximale: <strong>{station.maxScore}/20</strong>
              </p>
            </div>
            <div className="station-criteria-preview">
              {station.criteria.map(criterion => (
                <div key={criterion.id} className="criterion-preview">
                  <span>{criterion.name}</span>
                  <span className="points">/{criterion.maxPoints}</span>
                </div>
              ))}
            </div>
            {selectedStation?.id === station.id && (
              <div className="selected-indicator">Sélectionné</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StationSelector;
