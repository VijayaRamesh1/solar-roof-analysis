import React, { useRef, useEffect, useState } from 'react';
import './SimpleMap.css';

const SimpleMap = ({ buildings, selectedBuilding, onBuildingSelect }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!buildings || !buildings.features || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw buildings
    buildings.features.forEach((building, index) => {
      // Validate building data
      if (!building || !building.geometry || !building.geometry.coordinates || !building.properties) {
        console.warn('Invalid building data:', building);
        return;
      }

      const properties = building.properties;
      const coordinates = building.geometry.coordinates[0];
      
      // Validate coordinates
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
        console.warn('Invalid coordinates for building:', building);
        return;
      }
      
      // Convert coordinates to canvas position (simplified)
      const centerLon = -73.5673;
      const centerLat = 45.5017;
      const scale = 100000; // Scale factor
      
      ctx.beginPath();
      coordinates.forEach((coord, i) => {
        const x = (coord[0] - centerLon) * scale + canvas.width / 2;
        const y = (centerLat - coord[1]) * scale + canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();

      // Color based on solar score
      const score = properties.solar_score;
      let color = '#ef4444'; // Red for very poor
      if (score >= 80) color = '#10b981'; // Green for excellent
      else if (score >= 60) color = '#84cc16'; // Lime for good
      else if (score >= 40) color = '#f59e0b'; // Amber for fair
      else if (score >= 20) color = '#f97316'; // Orange for poor

      ctx.fillStyle = color;
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw selected building highlight
    if (selectedBuilding && selectedBuilding.geometry && selectedBuilding.geometry.coordinates) {
      const coordinates = selectedBuilding.geometry.coordinates[0];
      
      // Validate coordinates
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
        console.warn('Invalid coordinates for selected building:', selectedBuilding);
        return;
      }
      
      const centerLon = -73.5673;
      const centerLat = 45.5017;
      const scale = 100000;
      
      ctx.beginPath();
      coordinates.forEach((coord, i) => {
        const x = (coord[0] - centerLon) * scale + canvas.width / 2;
        const y = (centerLat - coord[1]) * scale + canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();

      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fill();
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    setMapLoaded(true);
  }, [buildings, selectedBuilding]);

  const handleCanvasClick = (e) => {
    if (!buildings || !onBuildingSelect) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked building (simplified hit detection)
    const centerLon = -73.5673;
    const centerLat = 45.5017;
    const scale = 100000;

    for (const building of buildings.features) {
      // Validate building data
      if (!building || !building.geometry || !building.geometry.coordinates) {
        continue;
      }
      
      const coordinates = building.geometry.coordinates[0];
      
      // Validate coordinates
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
        continue;
      }
      
      const buildingX = (coordinates[0][0] - centerLon) * scale + canvas.width / 2;
      const buildingY = (centerLat - coordinates[0][1]) * scale + canvas.height / 2;
      
      // Simple distance check
      const distance = Math.sqrt((x - buildingX) ** 2 + (y - buildingY) ** 2);
      if (distance < 20) {
        onBuildingSelect(building);
        break;
      }
    }
  };

  return (
    <div className="simple-map">
      {buildings && buildings.features && buildings.features.length > 0 ? (
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="map-canvas"
          style={{ cursor: 'pointer' }}
        />
      ) : (
        <div className="map-loading">
          <div className="loading-spinner" />
          <p>Loading building data...</p>
        </div>
      )}
    </div>
  );
};

export default SimpleMap;
