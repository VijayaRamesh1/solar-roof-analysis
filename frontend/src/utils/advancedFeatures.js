/**
 * Advanced 3D Utilities for Future Enhancements
 * These functions can be imported and used for additional features
 */

import * as THREE from 'three';

/**
 * Create a fly-to animation for the camera
 * Smoothly animates camera from current position to target
 */
export const flyToPosition = (camera, controls, targetPos, targetLookAt, duration = 2000) => {
  return new Promise((resolve) => {
    const startPos = camera.position.clone();
    const startLookAt = controls.target.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Interpolate position
      camera.position.lerpVectors(startPos, targetPos, eased);
      controls.target.lerpVectors(startLookAt, targetLookAt, eased);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };

    animate();
  });
};

/**
 * Calculate ideal camera position to focus on a specific building
 */
export const getCameraPositionForBuilding = (building, distance = 100) => {
  const buildingPos = building.position.clone();
  const buildingHeight = building.userData.height || 20;
  
  // Position camera at 45° angle
  const angle = Math.PI / 4;
  const offset = new THREE.Vector3(
    Math.cos(angle) * distance,
    buildingHeight + distance * 0.5,
    Math.sin(angle) * distance
  );
  
  return {
    position: buildingPos.clone().add(offset),
    target: buildingPos.clone().add(new THREE.Vector3(0, buildingHeight / 2, 0))
  };
};

/**
 * Create a screenshot of the current view
 */
export const captureScreenshot = (renderer, filename = 'solar-view.png') => {
  renderer.render(renderer.scene, renderer.camera);
  
  const canvas = renderer.domElement;
  const dataURL = canvas.toDataURL('image/png');
  
  // Create download link
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  link.click();
};

/**
 * Calculate sun position based on time of day and date
 */
export const calculateSunPosition = (hour, date, latitude, longitude) => {
  // Simplified solar position algorithm
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
  );
  
  // Solar declination
  const declination = 23.45 * Math.sin(
    (2 * Math.PI / 365) * (dayOfYear - 81)
  ) * (Math.PI / 180);
  
  // Hour angle
  const hourAngle = ((hour - 12) * 15) * (Math.PI / 180);
  
  // Latitude in radians
  const lat = latitude * (Math.PI / 180);
  
  // Solar elevation angle
  const elevation = Math.asin(
    Math.sin(lat) * Math.sin(declination) +
    Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle)
  );
  
  // Solar azimuth angle
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(lat) - Math.tan(declination) * Math.cos(lat)
  );
  
  // Convert to 3D position (100 units from origin)
  const distance = 100;
  const x = distance * Math.cos(elevation) * Math.sin(azimuth);
  const y = distance * Math.sin(elevation);
  const z = distance * Math.cos(elevation) * Math.cos(azimuth);
  
  return new THREE.Vector3(x, Math.max(y, 10), z);
};

/**
 * Update sun light position based on time of day
 */
export const updateSunLight = (sunLight, hour, date = new Date(), latitude = 45.5, longitude = -73.56) => {
  const sunPos = calculateSunPosition(hour, date, latitude, longitude);
  sunLight.position.copy(sunPos);
  
  // Update sun color based on time
  if (hour < 6 || hour > 20) {
    // Night - cool blue
    sunLight.color.setHex(0x4169e1);
    sunLight.intensity = 0.2;
  } else if (hour < 8 || hour > 18) {
    // Dawn/Dusk - warm orange
    sunLight.color.setHex(0xffa500);
    sunLight.intensity = 0.6;
  } else {
    // Day - bright white
    sunLight.color.setHex(0xffffff);
    sunLight.intensity = 1.0;
  }
  
  return sunPos;
};

/**
 * Create a heatmap texture for the ground based on solar scores
 */
export const createSolarHeatmap = (buildings, width = 512, height = 512) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Clear with transparent background
  ctx.clearRect(0, 0, width, height);
  
  // Draw heat circles for each building
  buildings.forEach(building => {
    const pos = building.position;
    const score = building.userData.building.properties.solar_score;
    
    // Map position to canvas coordinates (simplified)
    const x = (pos.x + width / 4) % width;
    const z = (pos.z + height / 4) % height;
    
    // Create radial gradient
    const gradient = ctx.createRadialGradient(x, z, 0, x, z, 30);
    
    // Color based on score
    if (score >= 80) {
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
    } else if (score >= 60) {
      gradient.addColorStop(0, 'rgba(132, 204, 22, 0.6)');
      gradient.addColorStop(1, 'rgba(132, 204, 22, 0)');
    } else if (score >= 40) {
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.6)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
  
  return new THREE.CanvasTexture(canvas);
};

/**
 * Create LOD (Level of Detail) system for buildings
 */
export const createLODBuilding = (detailedMesh, position, height) => {
  const lod = new THREE.LOD();
  
  // High detail (close)
  lod.addLevel(detailedMesh.clone(), 0);
  
  // Medium detail (medium distance)
  const mediumGeometry = new THREE.BoxGeometry(
    detailedMesh.geometry.parameters?.width || 10,
    height,
    detailedMesh.geometry.parameters?.depth || 10
  );
  const mediumMesh = new THREE.Mesh(mediumGeometry, detailedMesh.material);
  lod.addLevel(mediumMesh, 100);
  
  // Low detail (far)
  const lowGeometry = new THREE.BoxGeometry(5, height, 5);
  const lowMesh = new THREE.Mesh(lowGeometry, detailedMesh.material);
  lod.addLevel(lowMesh, 300);
  
  lod.position.copy(position);
  return lod;
};

/**
 * Measure distance between two buildings
 */
export const measureDistance = (building1, building2) => {
  const pos1 = building1.position;
  const pos2 = building2.position;
  
  const distance = pos1.distanceTo(pos2);
  
  // Create measurement line
  const geometry = new THREE.BufferGeometry().setFromPoints([pos1, pos2]);
  const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const line = new THREE.Line(geometry, material);
  
  return {
    distance,
    line,
    formatted: `${distance.toFixed(2)} meters`
  };
};

/**
 * Create animated path between two points (for tour mode)
 */
export const createAnimatedPath = (startPos, endPos, height = 50) => {
  // Create arc path
  const curve = new THREE.QuadraticBezierCurve3(
    startPos,
    new THREE.Vector3(
      (startPos.x + endPos.x) / 2,
      Math.max(startPos.y, endPos.y) + height,
      (startPos.z + endPos.z) / 2
    ),
    endPos
  );
  
  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x3b82f6,
    linewidth: 2
  });
  
  return new THREE.Line(geometry, material);
};

/**
 * Calculate optimal building orientation for solar panels
 */
export const calculateOptimalOrientation = (latitude) => {
  // In Northern hemisphere, south-facing is optimal
  // Tilt angle approximately equals latitude
  const tiltAngle = Math.abs(latitude);
  const azimuthAngle = latitude > 0 ? 180 : 0; // South in Northern, North in Southern
  
  return {
    tiltAngle,
    azimuthAngle,
    description: `${tiltAngle.toFixed(1)}° tilt, ${azimuthAngle}° azimuth (${latitude > 0 ? 'South' : 'North'}-facing)`
  };
};

/**
 * Estimate shadow length at given time
 */
export const estimateShadowLength = (buildingHeight, hour, latitude = 45.5) => {
  const date = new Date();
  const sunPos = calculateSunPosition(hour, date, latitude, 0);
  
  // Simple shadow calculation based on sun elevation
  const elevation = Math.atan2(sunPos.y, Math.sqrt(sunPos.x * sunPos.x + sunPos.z * sunPos.z));
  
  if (elevation <= 0) {
    return { length: Infinity, description: 'Sun below horizon' };
  }
  
  const shadowLength = buildingHeight / Math.tan(elevation);
  
  return {
    length: shadowLength,
    formatted: `${shadowLength.toFixed(2)} meters`,
    direction: new THREE.Vector3(-sunPos.x, 0, -sunPos.z).normalize()
  };
};

/**
 * Create comparison view for two buildings side by side
 */
export const createComparisonLayout = (camera, controls, building1, building2) => {
  // Calculate midpoint
  const midpoint = new THREE.Vector3()
    .addVectors(building1.position, building2.position)
    .multiplyScalar(0.5);
  
  // Calculate distance to fit both buildings
  const distance = building1.position.distanceTo(building2.position);
  const cameraDistance = distance * 1.5;
  
  // Position camera to view both
  const cameraPos = midpoint.clone().add(
    new THREE.Vector3(cameraDistance * 0.5, cameraDistance * 0.4, cameraDistance * 0.5)
  );
  
  return {
    position: cameraPos,
    target: midpoint.clone().add(new THREE.Vector3(0, 20, 0)),
    duration: 1500
  };
};

/**
 * Export building data as CSV
 */
export const exportBuildingsAsCSV = (buildings) => {
  const headers = ['ID', 'Address', 'Solar Score', 'Annual kWh', 'Roof Area', 'Height', 'Latitude', 'Longitude'];
  
  const rows = buildings.map(building => {
    const props = building.userData.building.properties;
    const coords = building.userData.building.geometry.coordinates[0][0];
    
    return [
      props.id,
      props.address || 'N/A',
      props.solar_score,
      props.annual_kwh,
      props.roof_area,
      props.height,
      coords[1], // lat
      coords[0]  // lon
    ].join(',');
  });
  
  const csv = [headers.join(','), ...rows].join('\n');
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'solar-buildings-data.csv';
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Create ambient audio based on time of day
 */
export const createAmbientAudio = (hour) => {
  // This would require audio files, but here's the structure
  const audioFiles = {
    dawn: 'birds-chirping.mp3',
    day: 'city-ambience.mp3',
    dusk: 'evening-sounds.mp3',
    night: 'night-ambience.mp3'
  };
  
  let soundFile;
  if (hour >= 5 && hour < 8) soundFile = audioFiles.dawn;
  else if (hour >= 8 && hour < 18) soundFile = audioFiles.day;
  else if (hour >= 18 && hour < 21) soundFile = audioFiles.dusk;
  else soundFile = audioFiles.night;
  
  return soundFile;
};

/**
 * Calculate energy savings comparison
 */
export const compareEnergySavings = (building1, building2) => {
  const kwh1 = building1.userData.building.properties.annual_kwh;
  const kwh2 = building2.userData.building.properties.annual_kwh;
  
  const costPerKwh = 0.13; // Average Canadian electricity cost
  const savings1 = kwh1 * costPerKwh;
  const savings2 = kwh2 * costPerKwh;
  const difference = Math.abs(savings1 - savings2);
  
  return {
    building1: {
      kwh: kwh1,
      savings: savings1,
      formatted: `$${savings1.toFixed(2)}/year`
    },
    building2: {
      kwh: kwh2,
      savings: savings2,
      formatted: `$${savings2.toFixed(2)}/year`
    },
    difference: {
      value: difference,
      formatted: `$${difference.toFixed(2)}/year`,
      percentage: ((difference / Math.max(savings1, savings2)) * 100).toFixed(1) + '%'
    },
    winner: savings1 > savings2 ? 'building1' : 'building2'
  };
};

export default {
  flyToPosition,
  getCameraPositionForBuilding,
  captureScreenshot,
  calculateSunPosition,
  updateSunLight,
  createSolarHeatmap,
  createLODBuilding,
  measureDistance,
  createAnimatedPath,
  calculateOptimalOrientation,
  estimateShadowLength,
  createComparisonLayout,
  exportBuildingsAsCSV,
  createAmbientAudio,
  compareEnergySavings
};
