import React from 'react';
import { Info } from 'lucide-react';
import './MapLegend.css';

const MapLegend = () => {
  const scoreRanges = [
    { min: 80, max: 100, label: 'Excellent', color: '#10b981' },
    { min: 60, max: 79, label: 'Good', color: '#84cc16' },
    { min: 40, max: 59, label: 'Fair', color: '#f59e0b' },
    { min: 20, max: 39, label: 'Poor', color: '#f97316' },
    { min: 0, max: 19, label: 'Very Poor', color: '#ef4444' }
  ];

  return (
    <div className="map-legend">
      <div className="legend-header">
        <h3>Solar Potential Score</h3>
        <div className="legend-info">
          <Info size={14} />
          <span className="tooltip-text">
            Color-coded by solar potential score (0-100). Higher scores indicate better conditions for solar installation.
          </span>
        </div>
      </div>
      
      <div className="legend-items">
        {scoreRanges.map((range, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color" 
              style={{ backgroundColor: range.color }}
            />
            <span className="legend-label">
              {range.label} ({range.min}-{range.max})
            </span>
          </div>
        ))}
      </div>
      
      <div className="legend-footer">
        <p>Click any building to view detailed analysis</p>
      </div>
    </div>
  );
};

export default MapLegend;

