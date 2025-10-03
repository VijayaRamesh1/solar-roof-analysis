import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Simple Three.js test - displays 3 colored cubes
 * Use this to verify Three.js is working properly
 */
const ThreeTest = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('🧪 Starting Three.js test...');

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 10);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create 3 test cubes
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    
    const cube1 = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0x10b981 }) // Green
    );
    cube1.position.set(-3, 0, 0);
    scene.add(cube1);

    const cube2 = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0xf59e0b }) // Orange
    );
    cube2.position.set(0, 0, 0);
    scene.add(cube2);

    const cube3 = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0xef4444 }) // Red
    );
    cube3.position.set(3, 0, 0);
    scene.add(cube3);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a4e,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.position.y = -0.99;
    scene.add(gridHelper);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate cubes
      cube1.rotation.x += 0.01;
      cube1.rotation.y += 0.01;
      cube2.rotation.x += 0.01;
      cube2.rotation.y += 0.01;
      cube3.rotation.x += 0.01;
      cube3.rotation.y += 0.01;
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    console.log('✅ Three.js test scene created successfully!');
    console.log('You should see 3 rotating cubes: Green, Orange, Red');

    // Cleanup
    return () => {
      const mountElement = mountRef.current;
      if (mountElement && renderer.domElement && mountElement.contains(renderer.domElement)) {
        mountElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '600px',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '2px solid rgba(96, 165, 250, 0.3)',
      background: '#1a1a2e'
    }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(15, 23, 42, 0.9)',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        🧪 Three.js Test - You should see 3 rotating cubes
      </div>
    </div>
  );
};

export default ThreeTest;
