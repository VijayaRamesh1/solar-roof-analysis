import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  geoToWorld,
  getPolygonCenter,
  getBoundingBox,
  coordinatesToShape,
  getSolarScoreColor,
  lerp
} from '../utils/coordinateUtils';
import {
  createStyledGround,
  createAtmosphericParticles,
  updateParticles,
  createEnhancedLighting,
  createGradientSky
} from '../utils/threeUtils';
import {
  createEnhancedBuildingMaterial,
  createRoofMaterial
} from '../utils/buildingMaterials';
import { flyToBuilding, fitSceneToView, createTour } from '../utils/cameraAnimations';
import './Map3D.css';

const Map3D = forwardRef(({ buildings, selectedBuilding, onBuildingSelect }, ref) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const buildingsRef = useRef([]);
  const particlesRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const debugHelpersRef = useRef([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [isTourMode, setIsTourMode] = useState(false);
  const animationRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const tourRef = useRef(null);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    flyToBuilding: (buildingId) => {
      const buildingMesh = buildingsRef.current.find(
        b => b.userData.building.properties.id === buildingId
      );
      if (buildingMesh && cameraRef.current && controlsRef.current) {
        flyToBuilding(
          cameraRef.current,
          controlsRef.current,
          buildingMesh.position,
          buildingMesh.userData.height,
          1500
        );
      }
    },
    resetView: () => {
      if (buildingsRef.current.length > 0 && cameraRef.current && controlsRef.current) {
        const box = new THREE.Box3();
        buildingsRef.current.forEach(building => box.expandByObject(building));
        fitSceneToView(cameraRef.current, controlsRef.current, box, 1500);
      }
    },
    startTour: () => {
      if (buildingsRef.current.length > 0 && !isTourMode) {
        setIsTourMode(true);
        createTour(cameraRef.current, controlsRef.current, buildingsRef.current, 3000);
      }
    },
    stopTour: () => {
      setIsTourMode(false);
      if (tourRef.current) {
        clearTimeout(tourRef.current);
      }
    }
  }));

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    console.log('🎨 Initializing enhanced 3D scene...');

    // Create scene with better fog settings
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xdbeafe, 500, 2000);

    // Create camera with better FOV
    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      1,
      10000
    );
    camera.position.set(400, 300, 400);
    camera.lookAt(0, 0, 0);

    // Create renderer with enhanced settings
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0xdbeafe, 1);

    mountRef.current.appendChild(renderer.domElement);

    // Create beautiful gradient sky
    createGradientSky(scene);

    // Add enhanced lighting
    createEnhancedLighting(scene);

    // Add large ground plane
    const ground = createStyledGround(3000);
    scene.add(ground);

    // Add atmospheric particles
    const particles = createAtmosphericParticles(400);
    scene.add(particles);
    particlesRef.current = particles;

    // Add debug helpers (initially hidden)
    const axesHelper = new THREE.AxesHelper(100);
    axesHelper.visible = false;
    scene.add(axesHelper);
    debugHelpersRef.current.push(axesHelper);

    const gridHelper = new THREE.GridHelper(1000, 50, 0x3b82f6, 0x94a3b8);
    gridHelper.visible = false;
    scene.add(gridHelper);
    debugHelpersRef.current.push(gridHelper);

    // Setup orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 50;
    controls.maxDistance = 1500;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 1.0;

    // Store references
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      const elapsed = clockRef.current.getElapsedTime();
      
      // Update controls
      controls.update();
      
      // Update particles
      if (particlesRef.current) {
        updateParticles(particlesRef.current);
      }
      
      // Update building animations
      buildingsRef.current.forEach(buildingMesh => {
        if (buildingMesh.material.uniforms) {
          buildingMesh.material.uniforms.time.value = elapsed;
        }
      });
      
      renderer.render(scene, camera);
    };
    animate();

    console.log('✅ 3D scene initialized successfully');

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Cleanup
      scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      const mountElement = mountRef.current;
      if (mountElement && renderer.domElement && mountElement.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Create 3D buildings with PROPER SCALING
  useEffect(() => {
    if (!sceneRef.current || !buildings || !buildings.features || buildings.features.length === 0) {
      return;
    }

    console.log('🏢 Creating enhanced 3D buildings...', buildings.features.length);
    setIsLoading(true);
    setLoadingProgress(0);

    // Clear existing buildings
    buildingsRef.current.forEach(building => {
      sceneRef.current.remove(building);
      if (building.geometry) building.geometry.dispose();
      if (building.material) {
        if (Array.isArray(building.material)) {
          building.material.forEach(m => m.dispose());
        } else {
          building.material.dispose();
        }
      }
      if (building.userData.roof) {
        sceneRef.current.remove(building.userData.roof);
        building.userData.roof.geometry.dispose();
        building.userData.roof.material.dispose();
      }
    });
    buildingsRef.current = [];

    // Calculate bounding box for proper centering
    const bbox = getBoundingBox(buildings.features);
    const { centerLon, centerLat } = bbox;

    // PROPER SCALING: Use realistic meter-based conversion
    const metersPerDegree = 111320;
    const scale = metersPerDegree * Math.cos((centerLat * Math.PI) / 180);

    console.log('📍 Map center:', centerLat, centerLon);
    console.log('📏 Scale factor:', scale.toFixed(2), 'units per degree');

    // Create buildings with proper dimensions
    const totalBuildings = buildings.features.length;
    let processedBuildings = 0;

    buildings.features.forEach((building, index) => {
      try {
        if (!building.geometry || !building.geometry.coordinates) return;

        const properties = building.properties;
        const coordinates = building.geometry.coordinates[0];

        if (!coordinates || coordinates.length < 3) return;

        // Get building center
        const center = getPolygonCenter(coordinates);
        const centerPos = geoToWorld(center.lon, center.lat, centerLon, centerLat, scale);

        // Create building footprint shape with proper scaling
        const shape = new THREE.Shape();
        const shapePoints = coordinatesToShape(coordinates, centerLon, centerLat, scale, 1);

        if (shapePoints.length < 3) return;

        // Move to first point (relative to building center)
        shape.moveTo(shapePoints[0].x - centerPos.x, shapePoints[0].y - centerPos.z);

        // Draw remaining points
        for (let i = 1; i < shapePoints.length; i++) {
          shape.lineTo(shapePoints[i].x - centerPos.x, shapePoints[i].y - centerPos.z);
        }
        shape.closePath();

        // Calculate realistic height (in meters)
        const baseHeight = properties.height || 15;
        const height = Math.max(baseHeight, 8);

        // Extrude settings
        const extrudeSettings = {
          depth: height,
          bevelEnabled: true,
          bevelThickness: 0.5,
          bevelSize: 0.3,
          bevelSegments: 1
        };

        // Create geometry
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(Math.PI / 2);
        geometry.translate(0, height / 2, 0);

        // Create enhanced materials
        const score = properties.solar_score || 50;
        const scoreColor = getSolarScoreColor(score);
        const wallMaterial = createEnhancedBuildingMaterial(scoreColor, score, height);
        const roofMaterial = createRoofMaterial(score);

        // Create building mesh
        const buildingMesh = new THREE.Mesh(geometry, wallMaterial);
        buildingMesh.position.set(centerPos.x, 0, centerPos.z);
        buildingMesh.castShadow = true;
        buildingMesh.receiveShadow = true;

        // Calculate roof dimensions from shape bounds
        const shapeXs = shapePoints.map(p => p.x - centerPos.x);
        const shapeZs = shapePoints.map(p => p.y - centerPos.z);
        const roofWidth = Math.max(...shapeXs) - Math.min(...shapeXs);
        const roofDepth = Math.max(...shapeZs) - Math.min(...shapeZs);

        // Create roof with proper dimensions
        const roofGeometry = new THREE.BoxGeometry(
          roofWidth * 1.05,
          2,
          roofDepth * 1.05
        );
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(centerPos.x, height + 1, centerPos.z);
        roof.castShadow = true;
        roof.receiveShadow = true;
        sceneRef.current.add(roof);

        // Store building data
        buildingMesh.userData = {
          building: building,
          index: index,
          originalColor: scoreColor,
          height: height,
          roof: roof
        };

        sceneRef.current.add(buildingMesh);
        buildingsRef.current.push(buildingMesh);

        processedBuildings++;
        setLoadingProgress(Math.floor((processedBuildings / totalBuildings) * 100));

      } catch (error) {
        console.error('Error creating building:', error);
      }
    });

    console.log('✅ Created', buildingsRef.current.length, 'buildings');

    setIsLoading(false);

    // Adjust camera to fit all buildings with a nice view
    if (buildingsRef.current.length > 0) {
      setTimeout(() => adjustCameraToFitBuildings(), 100);
    }

  }, [buildings]);

  // Adjust camera to fit all buildings with beautiful framing
  const adjustCameraToFitBuildings = useCallback(() => {
    if (!buildingsRef.current.length || !cameraRef.current || !controlsRef.current) return;

    const box = new THREE.Box3();
    buildingsRef.current.forEach(building => box.expandByObject(building));

    fitSceneToView(cameraRef.current, controlsRef.current, box, 1500);

    console.log('📷 Camera automatically positioned for optimal view');

  }, []);

  // Handle building selection with smooth animations + fly-to
  useEffect(() => {
    if (!buildingsRef.current.length) return;

    buildingsRef.current.forEach(buildingMesh => {
      const isSelected = selectedBuilding &&
        buildingMesh.userData.building.properties.id === selectedBuilding.properties.id;

      // If newly selected, fly to it
      if (isSelected && cameraRef.current && controlsRef.current) {
        flyToBuilding(
          cameraRef.current,
          controlsRef.current,
          buildingMesh.position,
          buildingMesh.userData.height,
          1500
        );
      }

      // Scale animation for selection
      const targetScale = isSelected ? 1.05 : 1.0;
      buildingMesh.scale.x = lerp(buildingMesh.scale.x, targetScale, 0.15);
      buildingMesh.scale.y = lerp(buildingMesh.scale.y, targetScale, 0.15);
      buildingMesh.scale.z = lerp(buildingMesh.scale.z, targetScale, 0.15);

      // Update roof scale too
      if (buildingMesh.userData.roof) {
        buildingMesh.userData.roof.scale.x = lerp(
          buildingMesh.userData.roof.scale.x,
          targetScale,
          0.15
        );
        buildingMesh.userData.roof.scale.z = lerp(
          buildingMesh.userData.roof.scale.z,
          targetScale,
          0.15
        );
      }
    });
  }, [selectedBuilding]);

  // Handle hover effects
  useEffect(() => {
    if (!buildingsRef.current.length) return;

    buildingsRef.current.forEach(buildingMesh => {
      const isHovered = hoveredBuilding &&
        buildingMesh.userData.building.properties.id === hoveredBuilding.properties.id;

      // Subtle elevation for hover
      const targetY = isHovered && !selectedBuilding ? 2 : 0;
      buildingMesh.position.y = lerp(buildingMesh.position.y, targetY, 0.2);

      if (buildingMesh.userData.roof) {
        const roofY = buildingMesh.userData.height + 1 + targetY;
        buildingMesh.userData.roof.position.y = lerp(
          buildingMesh.userData.roof.position.y,
          roofY,
          0.2
        );
      }
    });
  }, [hoveredBuilding, selectedBuilding]);

  // Mouse interaction handlers
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return;

    const handleMouseMove = (event) => {
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(buildingsRef.current);

      if (intersects.length > 0) {
        const building = intersects[0].object.userData.building;
        setHoveredBuilding(building);
        rendererRef.current.domElement.style.cursor = 'pointer';
      } else {
        setHoveredBuilding(null);
        rendererRef.current.domElement.style.cursor = 'default';
      }
    };

    const handleClick = (event) => {
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(buildingsRef.current);

      if (intersects.length > 0) {
        const building = intersects[0].object.userData.building;
        onBuildingSelect(building);
      }
    };

    const canvas = rendererRef.current.domElement;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [onBuildingSelect]);

  // Toggle debug helpers
  const toggleDebug = () => {
    const newState = !showDebug;
    setShowDebug(newState);
    debugHelpersRef.current.forEach(helper => {
      helper.visible = newState;
    });
  };

  return (
    <div className="map-3d-container">
      <div ref={mountRef} className="map-3d-canvas" />

      {isLoading && (
        <div className="map-3d-loading">
          <div className="loading-spinner-3d">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p>Rendering 3D city... {loadingProgress}%</p>
          <div className="loading-bar">
            <div 
              className="loading-bar-fill" 
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      )}

      {hoveredBuilding && !isLoading && (
        <div className="building-tooltip">
          <h4>{hoveredBuilding.properties.address || 'Building'}</h4>
          <p className="tooltip-score">
            <span className="score-badge" style={{
              backgroundColor: hoveredBuilding.properties.solar_score >= 60 ? '#10b981' : 
                               hoveredBuilding.properties.solar_score >= 40 ? '#f59e0b' : '#ef4444'
            }}>
              {hoveredBuilding.properties.solar_score}/100
            </span>
            Solar Score
          </p>
          <p>Annual: {hoveredBuilding.properties.annual_kwh?.toLocaleString() || 'N/A'} kWh</p>
          <p className="tooltip-hint">Click to view details</p>
        </div>
      )}

      <div className="map-3d-controls">
        <div className="control-hint">
          <span>🖱️ Click to analyze building</span>
          <span>🔄 Drag to rotate view</span>
          <span>🔍 Scroll to zoom in/out</span>
          <span>⇧ Right-click + drag to pan</span>
        </div>
        
        <button 
          className="toggle-button debug-toggle"
          onClick={toggleDebug}
          title="Toggle debug helpers"
          style={{ marginTop: 'var(--space-3)' }}
        >
          {showDebug ? '🔍 Hide Debug' : '🔍 Show Debug'}
        </button>
      </div>

      {!isLoading && buildingsRef.current.length > 0 && (
        <div className="map-stats">
          <div className="stat-item">
            <span className="stat-value">{buildingsRef.current.length}</span>
            <span className="stat-label">Buildings</span>
          </div>
        </div>
      )}
    </div>
  );
});

Map3D.displayName = 'Map3D';

export default Map3D;
