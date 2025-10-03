/**
 * Coordinate Conversion Utilities for Project SolisCAN
 * Handles conversion between geographic coordinates (lat/lng) and 3D world space
 */

/**
 * Convert geographic coordinates to 3D world coordinates
 * Uses Web Mercator projection for accurate positioning
 */
export const geoToWorld = (lon, lat, centerLon, centerLat, scale = 111320) => {
  // Convert to radians
  const centerLatRad = (centerLat * Math.PI) / 180;
  
  // Calculate x and z positions using Mercator projection
  const x = (lon - centerLon) * scale * Math.cos(centerLatRad);
  const z = -(lat - centerLat) * scale; // Negative for proper orientation
  
  return { x, z };
};

/**
 * Calculate the center point of a polygon
 */
export const getPolygonCenter = (coordinates) => {
  if (!coordinates || coordinates.length === 0) return { lon: 0, lat: 0 };
  
  let sumLon = 0;
  let sumLat = 0;
  let count = 0;
  
  coordinates.forEach(coord => {
    if (Array.isArray(coord) && coord.length >= 2) {
      sumLon += coord[0];
      sumLat += coord[1];
      count++;
    }
  });
  
  return {
    lon: sumLon / count,
    lat: sumLat / count
  };
};

/**
 * Calculate bounding box for a set of coordinates
 */
export const getBoundingBox = (features) => {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  
  features.forEach(feature => {
    if (feature.geometry && feature.geometry.coordinates) {
      const coords = feature.geometry.coordinates[0];
      coords.forEach(coord => {
        if (Array.isArray(coord) && coord.length >= 2) {
          const [lon, lat] = coord;
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      });
    }
  });
  
  return {
    minLon,
    maxLon,
    minLat,
    maxLat,
    centerLon: (minLon + maxLon) / 2,
    centerLat: (minLat + maxLat) / 2
  };
};

/**
 * Convert polygon coordinates to Three.js Shape points
 * @param {Array} coordinates - Array of [lon, lat] pairs
 * @param {number} centerLon - Center longitude for relative positioning
 * @param {number} centerLat - Center latitude for relative positioning  
 * @param {number} scale - Scale factor for coordinate conversion (meters per degree)
 * @param {number} footprintScale - Additional scaling factor (default: 1, no additional scaling)
 */
export const coordinatesToShape = (coordinates, centerLon, centerLat, scale = 111320, footprintScale = 1) => {
  const points = coordinates.map(coord => {
    const { x, z } = geoToWorld(coord[0], coord[1], centerLon, centerLat, scale);
    // Apply footprint scale only if needed (normally should be 1 for realistic dimensions)
    return { x: x * footprintScale, y: z * footprintScale };
  });
  
  return points;
};

/**
 * Get solar score color based on score value
 * Returns RGB values normalized to 0-1 range for Three.js
 */
export const getSolarScoreColor = (score) => {
  if (score >= 80) return { r: 0.063, g: 0.725, b: 0.506 }; // #10b981 - Excellent (green)
  if (score >= 60) return { r: 0.518, g: 0.8, b: 0.086 };   // #84cc16 - Good (lime)
  if (score >= 40) return { r: 0.961, g: 0.62, b: 0.043 };  // #f59e0b - Fair (amber)
  if (score >= 20) return { r: 0.976, g: 0.451, b: 0.086 }; // #f97316 - Poor (orange)
  return { r: 0.937, g: 0.267, b: 0.267 };                   // #ef4444 - Very Poor (red)
};

/**
 * Get solar score label
 */
export const getSolarScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
};

/**
 * Get hex color for solar score (for UI elements)
 */
export const getSolarScoreHex = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#84cc16';
  if (score >= 40) return '#f59e0b';
  if (score >= 20) return '#f97316';
  return '#ef4444';
};

/**
 * Lerp (Linear Interpolation) for smooth animations
 */
export const lerp = (start, end, alpha) => {
  return start + (end - start) * alpha;
};

/**
 * Ease out cubic function for smooth animations
 */
export const easeOutCubic = (t) => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Ease in out cubic for balanced animations
 */
export const easeInOutCubic = (t) => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Calculate distance between two geographic points (Haversine formula)
 * @returns distance in meters
 */
export const geoDistance = (lon1, lat1, lon2, lat2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Calculate polygon area in square meters
 */
export const calculatePolygonArea = (coordinates) => {
  if (!coordinates || coordinates.length < 3) return 0;
  
  // Use Shoelace formula with geographic coordinates
  // This is an approximation - for precise areas, use a proper GIS library
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    
    area += (lon1 * lat2) - (lon2 * lat1);
  }
  
  area = Math.abs(area / 2);
  
  // Convert to square meters (very rough approximation)
  // 1 degree ≈ 111km at equator
  const metersPerDegree = 111320;
  return area * metersPerDegree * metersPerDegree;
};
