/**
 * Enhanced 3D Building Materials
 * Includes textures, windows, roofs, and advanced visual effects
 */

import * as THREE from 'three';

/**
 * Create building material with windows and textures
 */
export const createEnhancedBuildingMaterial = (scoreColor, score, height) => {
  // Create canvas for window texture
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Base building color (slightly darker than score color)
  const baseColor = `rgb(${scoreColor.r * 200}, ${scoreColor.g * 200}, ${scoreColor.b * 200})`;
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 512);
  
  // Add windows pattern
  const windowSize = 16;
  const spacing = 24;
  const margin = 20;
  
  for (let y = margin; y < 512 - margin; y += spacing) {
    for (let x = margin; x < 512 - margin; x += spacing) {
      // Random lit windows (30% lit during day, 70% at night)
      const isLit = Math.random() > 0.7;
      
      if (isLit) {
        // Lit window - warm yellow
        ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
      } else {
        // Dark window
        ctx.fillStyle = 'rgba(30, 40, 60, 0.6)';
      }
      
      // Draw window
      ctx.fillRect(x, y, windowSize, windowSize);
      
      // Window frame
      ctx.strokeStyle = 'rgba(50, 60, 80, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, windowSize, windowSize);
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, Math.max(1, height / 50));
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: new THREE.Color(scoreColor.r, scoreColor.g, scoreColor.b),
    roughness: 0.7,
    metalness: 0.3,
    emissive: new THREE.Color(scoreColor.r * 0.1, scoreColor.g * 0.1, scoreColor.b * 0.1),
    emissiveIntensity: 0.2
  });
};

/**
 * Create roof material with solar panel texture
 */
export const createRoofMaterial = (score) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Base roof color - darker for low scores, bluer for high scores
  if (score >= 70) {
    // High score - solar panels (dark blue/black)
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, 256, 256);
    
    // Draw solar panel grid
    ctx.strokeStyle = '#2d3e5c';
    ctx.lineWidth = 2;
    
    const panelSize = 32;
    for (let y = 0; y < 256; y += panelSize) {
      for (let x = 0; x < 256; x += panelSize) {
        ctx.strokeRect(x, y, panelSize, panelSize);
        
        // Panel cells
        ctx.strokeStyle = '#3a4d6e';
        ctx.lineWidth = 1;
        for (let py = 0; py < panelSize; py += 8) {
          for (let px = 0; px < panelSize; px += 8) {
            ctx.strokeRect(x + px, y + py, 8, 8);
          }
        }
        ctx.strokeStyle = '#2d3e5c';
        ctx.lineWidth = 2;
      }
    }
  } else {
    // Regular roof (grey with texture)
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add roof tile pattern
    ctx.strokeStyle = '#52565e';
    ctx.lineWidth = 1;
    for (let y = 0; y < 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
    metalness: score >= 70 ? 0.5 : 0.2
  });
};

/**
 * Create floating label for building
 */
export const createBuildingLabel = (text, score) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.roundRect(0, 0, 256, 64, 8);
  ctx.fill();
  
  // Border based on score
  ctx.strokeStyle = score >= 80 ? '#10b981' : score >= 60 ? '#84cc16' : '#f59e0b';
  ctx.lineWidth = 3;
  ctx.roundRect(0, 0, 256, 64, 8);
  ctx.stroke();
  
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(50, 12.5, 1);
  
  return sprite;
};

/**
 * Enhanced vertex shader for buildings with animation
 */
export const enhancedBuildingVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vElevation;
  
  uniform float time;
  uniform float selected;
  uniform float hovered;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    vElevation = position.y;
    
    vec3 pos = position;
    
    // Subtle breathing animation for selected
    if (selected > 0.5) {
      float pulse = sin(time * 2.0) * 0.02 + 1.0;
      pos *= pulse;
    }
    
    // Gentle hover lift
    if (hovered > 0.5 && selected < 0.5) {
      pos.y += sin(time * 3.0) * 2.0;
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/**
 * Enhanced fragment shader for buildings
 */
export const enhancedBuildingFragmentShader = `
  uniform vec3 baseColor;
  uniform float opacity;
  uniform float selected;
  uniform float hovered;
  uniform float time;
  uniform sampler2D texture;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying float vElevation;
  
  void main() {
    // Sample texture
    vec4 texColor = texture2D(texture, vUv);
    
    // Calculate lighting
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float lightIntensity = max(dot(vNormal, lightDirection), 0.3);
    
    // Base color with lighting
    vec3 color = texColor.rgb * baseColor * lightIntensity;
    
    // Rim lighting for edges
    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    rim = pow(rim, 3.0);
    color += vec3(0.3, 0.5, 0.8) * rim * 0.3;
    
    // Selection highlight with pulse
    if (selected > 0.5) {
      vec3 selectColor = vec3(0.231, 0.510, 0.961);
      float pulse = sin(time * 3.0) * 0.3 + 0.7;
      color = mix(color, selectColor, 0.4) * pulse;
      
      // Add glow
      color += selectColor * rim * pulse * 0.5;
    }
    
    // Hover highlight
    if (hovered > 0.5 && selected < 0.5) {
      vec3 hoverColor = vec3(0.376, 0.647, 0.980);
      color = mix(color, hoverColor, 0.3);
      color += hoverColor * rim * 0.3;
    }
    
    // Top face highlight (roof)
    float topFace = smoothstep(0.95, 1.0, abs(vNormal.y));
    color += vec3(0.8, 0.9, 1.0) * topFace * 0.3;
    
    gl_FragColor = vec4(color, opacity);
  }
`;

/**
 * Create advanced building with separate roof
 */
export const createAdvancedBuilding = (geometry, wallMaterial, roofMaterial, height) => {
  const group = new THREE.Group();
  
  // Main building body
  const building = new THREE.Mesh(geometry, wallMaterial);
  building.castShadow = true;
  building.receiveShadow = true;
  group.add(building);
  
  // Roof (top cap)
  const roofGeometry = new THREE.BoxGeometry(1, 0.1, 1);
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.y = height / 2;
  roof.scale.set(1.1, 1, 1.1); // Slightly larger than building
  roof.castShadow = true;
  group.add(roof);
  
  return group;
};

/**
 * Create time-of-day sun light
 */
export const createDynamicSunLight = (scene, timeOfDay = 12) => {
  // timeOfDay: 0-24 hours
  const hour = timeOfDay % 24;
  
  // Calculate sun position based on time
  const sunAngle = (hour - 6) * (Math.PI / 12); // -90° at 6am, 90° at 6pm
  const sunHeight = Math.sin(sunAngle) * 100;
  const sunDistance = Math.cos(sunAngle) * 100;
  
  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(sunDistance, Math.max(sunHeight, 10), 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.camera.left = -150;
  sunLight.shadow.camera.right = 150;
  sunLight.shadow.camera.top = 150;
  sunLight.shadow.camera.bottom = -150;
  
  // Sun color changes with time
  if (hour < 6 || hour > 20) {
    // Night - blue tint
    sunLight.color.setHex(0x4169e1);
    sunLight.intensity = 0.3;
  } else if (hour < 8 || hour > 18) {
    // Dawn/Dusk - orange tint
    sunLight.color.setHex(0xffa500);
    sunLight.intensity = 0.7;
  } else {
    // Day - bright white
    sunLight.color.setHex(0xffffff);
    sunLight.intensity = 1.2;
  }
  
  return sunLight;
};

// Add roundRect to canvas context if not available
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}
