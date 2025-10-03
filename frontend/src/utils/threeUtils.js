/**
 * 3D Utilities and Shader Materials for Project SolisCAN
 * Custom shaders for enhanced visual effects
 */

import * as THREE from 'three';

/**
 * Custom vertex shader for buildings with animated glow
 */
export const buildingVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vElevation;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vElevation = position.y;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Custom fragment shader for buildings with solar score coloring
 */
export const buildingFragmentShader = `
  uniform vec3 baseColor;
  uniform float opacity;
  uniform float glowIntensity;
  uniform float selected;
  uniform float hovered;
  uniform float time;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vElevation;
  
  void main() {
    // Calculate lighting
    vec3 lightDirection = normalize(vec3(1.0, 1.0, 1.0));
    float lightIntensity = max(dot(vNormal, lightDirection), 0.3);
    
    // Base color with lighting
    vec3 color = baseColor * lightIntensity;
    
    // Add edge glow effect
    float edgeGlow = pow(1.0 - abs(dot(vNormal, vec3(0.0, 1.0, 0.0))), 2.0);
    color += baseColor * edgeGlow * glowIntensity * 0.3;
    
    // Add selection highlight
    if (selected > 0.5) {
      vec3 selectColor = vec3(0.231, 0.510, 0.961); // Blue
      float pulse = sin(time * 3.0) * 0.2 + 0.8;
      color = mix(color, selectColor, 0.5) * pulse;
    }
    
    // Add hover highlight
    if (hovered > 0.5 && selected < 0.5) {
      vec3 hoverColor = vec3(0.376, 0.647, 0.980); // Light blue
      color = mix(color, hoverColor, 0.4);
    }
    
    // Add top face highlight (roof)
    float topFace = smoothstep(0.95, 1.0, abs(vNormal.y));
    color += vec3(1.0, 1.0, 1.0) * topFace * 0.2;
    
    gl_FragColor = vec4(color, opacity);
  }
`;

/**
 * Create enhanced building material with custom shaders
 */
export const createBuildingMaterial = (scoreColor, score) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Vector3(scoreColor.r, scoreColor.g, scoreColor.b) },
      opacity: { value: 0.9 },
      glowIntensity: { value: score / 100 },
      selected: { value: 0.0 },
      hovered: { value: 0.0 },
      time: { value: 0.0 }
    },
    vertexShader: buildingVertexShader,
    fragmentShader: buildingFragmentShader,
    transparent: true,
    side: THREE.DoubleSide
  });
};

/**
 * Create ground plane with grid pattern
 */
export const createStyledGround = (size = 500) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#e0f2fe');
  gradient.addColorStop(1, '#bae6fd');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Draw grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  
  const gridSize = 32;
  for (let i = 0; i <= 512; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  
  return ground;
};

/**
 * Create animated particle system for atmosphere
 */
export const createAtmosphericParticles = (count = 200) => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = Math.random() * 100;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    
    velocities[i * 3] = (Math.random() - 0.5) * 0.05;
    velocities[i * 3 + 1] = Math.random() * 0.02 + 0.01;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  
  const particles = new THREE.Points(geometry, material);
  particles.userData.velocities = velocities;
  
  return particles;
};

/**
 * Update particle positions for animation
 */
export const updateParticles = (particles) => {
  const positions = particles.geometry.attributes.position.array;
  const velocities = particles.userData.velocities;
  
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += velocities[i];
    positions[i + 1] += velocities[i + 1];
    positions[i + 2] += velocities[i + 2];
    
    // Reset particles that go too high
    if (positions[i + 1] > 100) {
      positions[i + 1] = 0;
    }
    
    // Wrap around horizontally
    if (Math.abs(positions[i]) > 100) {
      positions[i] = (Math.random() - 0.5) * 200;
    }
    if (Math.abs(positions[i + 2]) > 100) {
      positions[i + 2] = (Math.random() - 0.5) * 200;
    }
  }
  
  particles.geometry.attributes.position.needsUpdate = true;
};

/**
 * Create enhanced lighting setup
 */
export const createEnhancedLighting = (scene) => {
  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  // Main directional light (sun)
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
  sunLight.position.set(50, 80, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.camera.left = -150;
  sunLight.shadow.camera.right = 150;
  sunLight.shadow.camera.top = 150;
  sunLight.shadow.camera.bottom = -150;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);
  
  // Fill light from opposite side
  const fillLight = new THREE.DirectionalLight(0x88ccff, 0.5);
  fillLight.position.set(-50, 50, -50);
  scene.add(fillLight);
  
  // Hemisphere light for sky/ground gradient
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8fbc8f, 0.6);
  scene.add(hemiLight);
  
  return { ambientLight, sunLight, fillLight, hemiLight };
};

/**
 * Create animated gradient sky
 */
export const createGradientSky = (scene) => {
  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `;
  
  const uniforms = {
    topColor: { value: new THREE.Color(0x0077ff) },
    bottomColor: { value: new THREE.Color(0xffffff) },
    offset: { value: 33 },
    exponent: { value: 0.6 }
  };
  
  const skyGeo = new THREE.SphereGeometry(400, 32, 15);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.BackSide
  });
  
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
  
  return sky;
};
