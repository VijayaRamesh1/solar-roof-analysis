/**
 * Camera Animation Utilities for 3D Scene
 * Provides smooth camera transitions and cinematic movements
 */

import * as THREE from 'three';

/**
 * Animate camera to look at a specific building
 * @param {THREE.Camera} camera - The camera to animate
 * @param {THREE.Controls} controls - OrbitControls instance
 * @param {THREE.Vector3} targetPosition - Building position
 * @param {number} buildingHeight - Building height for proper framing
 * @param {number} duration - Animation duration in ms
 */
export const flyToBuilding = (camera, controls, targetPosition, buildingHeight = 15, duration = 1500) => {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  
  // Calculate ideal camera position (45° angle, elevated view)
  const distance = Math.max(buildingHeight * 3, 80); // At least 80 units away
  const angle = Math.PI / 4; // 45 degrees
  const height = buildingHeight * 1.5;
  
  const endPos = new THREE.Vector3(
    targetPosition.x + Math.cos(angle) * distance,
    targetPosition.y + height,
    targetPosition.z + Math.sin(angle) * distance
  );
  
  const endTarget = new THREE.Vector3(
    targetPosition.x,
    targetPosition.y + buildingHeight / 2,
    targetPosition.z
  );
  
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Use ease-in-out cubic for smooth acceleration and deceleration
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    // Interpolate camera position and target
    camera.position.lerpVectors(startPos, endPos, eased);
    controls.target.lerpVectors(startTarget, endTarget, eased);
    controls.update();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};

/**
 * Smooth zoom to fit all buildings
 * @param {THREE.Camera} camera - The camera to animate
 * @param {THREE.Controls} controls - OrbitControls instance
 * @param {THREE.Box3} boundingBox - Scene bounding box
 * @param {number} duration - Animation duration in ms
 */
export const fitSceneToView = (camera, controls, boundingBox, duration = 1500) => {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  
  // Calculate ideal distance
  const fov = camera.fov * (Math.PI / 180);
  const cameraDistance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;
  
  // Position at 45° angle for nice oblique view
  const angle = Math.PI / 4;
  const height = cameraDistance * 0.6;
  
  const endPos = new THREE.Vector3(
    center.x + Math.cos(angle) * cameraDistance,
    center.y + height,
    center.z + Math.sin(angle) * cameraDistance
  );
  
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    
    camera.position.lerpVectors(startPos, endPos, eased);
    controls.target.lerpVectors(startTarget, center, eased);
    controls.update();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};

/**
 * Orbit around a target point
 * @param {THREE.Camera} camera - The camera to animate
 * @param {THREE.Controls} controls - OrbitControls instance
 * @param {THREE.Vector3} target - Center point to orbit around
 * @param {number} radius - Distance from target
 * @param {number} duration - Full rotation duration in ms
 * @param {boolean} continuous - Whether to loop continuously
 */
export const orbitAround = (camera, controls, target, radius, duration = 10000, continuous = false) => {
  const startTime = Date.now();
  const startAngle = Math.atan2(
    camera.position.z - target.z,
    camera.position.x - target.x
  );
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = (elapsed % duration) / duration;
    const angle = startAngle + (progress * Math.PI * 2);
    
    camera.position.x = target.x + Math.cos(angle) * radius;
    camera.position.z = target.z + Math.sin(angle) * radius;
    camera.lookAt(target);
    controls.target.copy(target);
    controls.update();
    
    if (continuous || progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};

/**
 * Smooth pan to a position without changing zoom
 * @param {THREE.Camera} camera - The camera to animate
 * @param {THREE.Controls} controls - OrbitControls instance
 * @param {THREE.Vector3} targetPosition - New target position
 * @param {number} duration - Animation duration in ms
 */
export const panTo = (camera, controls, targetPosition, duration = 1000) => {
  const startTarget = controls.target.clone();
  const offset = camera.position.clone().sub(startTarget);
  
  const endTarget = targetPosition.clone();
  const endPos = endTarget.clone().add(offset);
  
  const startPos = camera.position.clone();
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 2); // Ease out quadratic
    
    camera.position.lerpVectors(startPos, endPos, eased);
    controls.target.lerpVectors(startTarget, endTarget, eased);
    controls.update();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};

/**
 * Create a cinematic tour through multiple buildings
 * @param {THREE.Camera} camera - The camera to animate
 * @param {THREE.Controls} controls - OrbitControls instance
 * @param {Array<Object>} buildings - Array of building meshes
 * @param {number} durationPerBuilding - Time at each building in ms
 */
export const createTour = (camera, controls, buildings, durationPerBuilding = 3000) => {
  let currentIndex = 0;
  
  const visitNextBuilding = () => {
    if (currentIndex >= buildings.length) {
      currentIndex = 0; // Loop back to start
    }
    
    const building = buildings[currentIndex];
    const position = building.position.clone();
    const height = building.userData.height || 15;
    
    flyToBuilding(camera, controls, position, height, 1500);
    
    currentIndex++;
    setTimeout(visitNextBuilding, durationPerBuilding);
  };
  
  visitNextBuilding();
};

/**
 * Shake camera for impact effect (e.g., when selecting building)
 * @param {THREE.Camera} camera - The camera to shake
 * @param {number} intensity - Shake intensity (0-1)
 * @param {number} duration - Shake duration in ms
 */
export const shakeCamera = (camera, intensity = 0.1, duration = 300) => {
  const startPos = camera.position.clone();
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const remainingIntensity = intensity * (1 - progress);
    
    camera.position.x = startPos.x + (Math.random() - 0.5) * remainingIntensity * 10;
    camera.position.y = startPos.y + (Math.random() - 0.5) * remainingIntensity * 10;
    camera.position.z = startPos.z + (Math.random() - 0.5) * remainingIntensity * 10;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      camera.position.copy(startPos);
    }
  };
  
  animate();
};

/**
 * Smooth zoom in or out
 * @param {THREE.Camera} camera - The camera to animate
 * @param {THREE.Controls} controls - OrbitControls instance
 * @param {number} zoomFactor - Zoom factor (> 1 = zoom in, < 1 = zoom out)
 * @param {number} duration - Animation duration in ms
 */
export const smoothZoom = (camera, controls, zoomFactor, duration = 800) => {
  const startPos = camera.position.clone();
  const direction = startPos.clone().sub(controls.target).normalize();
  const currentDistance = startPos.distanceTo(controls.target);
  const targetDistance = currentDistance / zoomFactor;
  
  const endPos = controls.target.clone().add(
    direction.multiplyScalar(targetDistance)
  );
  
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    
    camera.position.lerpVectors(startPos, endPos, eased);
    controls.update();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};

/**
 * Get optimal camera position for a building
 * @param {THREE.Vector3} buildingPosition - Building position
 * @param {number} buildingHeight - Building height
 * @param {string} angle - 'front', 'side', 'top', or 'oblique'
 * @returns {Object} {position, target}
 */
export const getOptimalCameraPosition = (buildingPosition, buildingHeight, angle = 'oblique') => {
  const distance = Math.max(buildingHeight * 3, 80);
  const target = new THREE.Vector3(
    buildingPosition.x,
    buildingPosition.y + buildingHeight / 2,
    buildingPosition.z
  );
  
  let position;
  
  switch (angle) {
    case 'front':
      position = new THREE.Vector3(
        buildingPosition.x,
        buildingPosition.y + buildingHeight,
        buildingPosition.z + distance
      );
      break;
    case 'side':
      position = new THREE.Vector3(
        buildingPosition.x + distance,
        buildingPosition.y + buildingHeight,
        buildingPosition.z
      );
      break;
    case 'top':
      position = new THREE.Vector3(
        buildingPosition.x,
        buildingPosition.y + distance,
        buildingPosition.z
      );
      break;
    case 'oblique':
    default:
      position = new THREE.Vector3(
        buildingPosition.x + Math.cos(Math.PI / 4) * distance,
        buildingPosition.y + buildingHeight * 1.5,
        buildingPosition.z + Math.sin(Math.PI / 4) * distance
      );
      break;
  }
  
  return { position, target };
};
