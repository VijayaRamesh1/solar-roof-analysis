# 🎓 Advanced Usage Guide - Project SolisCAN

## 📊 Performance Monitoring

### **Enable Performance Monitoring**

The performance monitor tracks FPS, memory usage, render times, and user interactions.

#### **Method 1: In Browser Console**
```javascript
// Start monitoring
performanceMonitor.start();

// Monitor for a while...

// Get current snapshot
performanceMonitor.getSnapshot();

// Stop and get full report
performanceMonitor.stop();
```

#### **Method 2: In React Component**
```javascript
import performanceMonitor from './utils/performanceMonitor';

function MyComponent() {
  useEffect(() => {
    // Start monitoring when component mounts
    performanceMonitor.start();
    
    // Subscribe to updates
    const unsubscribe = performanceMonitor.subscribe((snapshot) => {
      console.log('Current FPS:', snapshot.currentFPS);
      console.log('Memory:', snapshot.currentMemoryMB + 'MB');
    });
    
    // Cleanup
    return () => {
      unsubscribe();
      performanceMonitor.stop();
    };
  }, []);
  
  return <div>Your component</div>;
}
```

### **Track Specific Operations**

#### **Track Render Performance**
```javascript
// Synchronous operation
const result = performanceMonitor.trackRender(
  'Building Creation',
  () => {
    // Your rendering code
    buildings.forEach(createBuilding);
    return buildings.length;
  }
);

// Async operation
const data = await performanceMonitor.trackRenderAsync(
  'Load Building Data',
  async () => {
    const response = await fetch('/api/buildings');
    return response.json();
  }
);
```

#### **Track User Interactions**
```javascript
// Track clicks
performanceMonitor.trackInteraction('building_click', {
  buildingId: building.id,
  solarScore: building.solar_score
});

// Track search
performanceMonitor.trackInteraction('search', {
  query: searchQuery,
  resultsCount: results.length
});

// Track camera movements
performanceMonitor.trackInteraction('camera_move', {
  distance: camera.position.length(),
  angle: controls.getAzimuthalAngle()
});
```

#### **Track API Calls**
```javascript
// Wrap fetch calls
const response = await performanceMonitor.trackAPICall(
  '/api/buildings',
  fetch('http://localhost:5001/api/buildings')
);
```

### **Interpret Performance Reports**

#### **Example Report**
```javascript
{
  duration: "120.00s",
  
  fps: {
    average: "58.5",
    min: "45.2",
    max: "60.0",
    p95: "59.8",  // 95% of frames
    p99: "60.0"   // 99% of frames
  },
  
  frameTime: {
    average: "16.50ms",
    max: "22.10ms",
    p95: "17.20ms"
  },
  
  memory: {
    current: "185.5MB",
    average: "175.2MB",
    max: "198.3MB",
    limit: "2048MB"
  },
  
  renders: {
    count: 15,
    totalTime: "2500.00ms",
    slowest: {
      name: "Building Creation",
      time: 1200.5
    }
  },
  
  api: {
    count: 8,
    averageTime: "250ms",
    failures: 0
  },
  
  interactions: {
    count: 45,
    types: {
      building_click: 12,
      camera_move: 25,
      search: 8
    }
  },
  
  health: {
    score: 92,
    grade: "A"
  }
}
```

#### **Health Score Interpretation**
```
Grade A (90-100): Excellent performance
Grade B (75-89):  Good performance
Grade C (60-74):  Acceptable with minor issues
Grade D (40-59):  Poor performance, needs optimization
Grade F (0-39):   Critical issues, major optimization needed
```

#### **What to Look For**
- **FPS < 45**: Enable debug mode, check if too many objects
- **Memory growing**: Potential memory leak, check cleanup
- **API > 1000ms**: Backend optimization needed
- **Slow renders**: Optimize building creation, reduce complexity

---

## 🐛 Debug Mode Usage

### **Enable Debug Mode**

Click the "🔍 Show Debug" button in the bottom-right controls, or:

```javascript
// In browser console
setShowDebug(true);
```

### **Debug Helpers**

#### **Axes Helper**
```
Red axis   = X (East-West)
Green axis = Y (Up-Down)
Blue axis  = Z (North-South)
```

#### **Grid Helper**
- Shows ground plane
- Grid size: 1000 units
- 50 divisions

### **Debug Information in Console**

Enable detailed logging:
```javascript
// In Map3D.js, set verbose logging
const DEBUG = true;

if (DEBUG) {
  console.log('Building positions:', buildingsRef.current.map(b => b.position));
  console.log('Camera:', cameraRef.current.position, cameraRef.current.rotation);
  console.log('Scene children:', sceneRef.current.children.length);
}
```

---

## 🎮 Advanced Camera Controls

### **Keyboard Shortcuts**

Implement custom keyboard controls:

```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    switch(e.key) {
      case 'r':
        // Reset camera
        camera.position.set(400, 300, 400);
        controls.target.set(0, 0, 0);
        break;
        
      case 'f':
        // Fly to selected building
        if (selectedBuilding) {
          flyToBuilding(selectedBuilding);
        }
        break;
        
      case 't':
        // Top-down view
        camera.position.set(0, 500, 0);
        controls.target.set(0, 0, 0);
        break;
        
      case 'a':
        // Toggle auto-rotate
        controls.autoRotate = !controls.autoRotate;
        break;
    }
  };
  
  window.addEventListener('keypress', handleKeyPress);
  return () => window.removeEventListener('keypress', handleKeyPress);
}, [selectedBuilding]);
```

### **Fly-to Animation**

```javascript
const flyToBuilding = (building) => {
  const buildingMesh = buildingsRef.current.find(
    m => m.userData.building.properties.id === building.properties.id
  );
  
  if (!buildingMesh) return;
  
  const targetPos = buildingMesh.position.clone();
  const height = buildingMesh.userData.height;
  
  // Calculate camera position (45° angle, 100 units away)
  const angle = Math.PI / 4;
  const distance = 100;
  
  const newCameraPos = new THREE.Vector3(
    targetPos.x + Math.cos(angle) * distance,
    targetPos.y + height + 50,
    targetPos.z + Math.sin(angle) * distance
  );
  
  // Animate
  const startPos = cameraRef.current.position.clone();
  const startTarget = controlsRef.current.target.clone();
  const duration = 1500;
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    
    cameraRef.current.position.lerpVectors(startPos, newCameraPos, eased);
    controlsRef.current.target.lerpVectors(startTarget, targetPos, eased);
    controlsRef.current.update();
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};
```

---

## 🎨 Custom Visualizations

### **Heat Map Overlay**

Show solar potential on the ground:

```javascript
const createHeatMap = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Create gradient
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.6)');   // Green center
  gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)'); // Yellow mid
  gradient.addColorStop(1, 'rgba(239, 68, 68, 0.2)');    // Red edge
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.5
  });
  
  const geometry = new THREE.PlaneGeometry(1000, 1000);
  const heatMap = new THREE.Mesh(geometry, material);
  heatMap.rotation.x = -Math.PI / 2;
  heatMap.position.y = 0.1; // Slightly above ground
  
  sceneRef.current.add(heatMap);
};
```

### **Building Labels**

Add floating labels above buildings:

```javascript
const createLabel = (text, position) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.roundRect(0, 0, 256, 64, 8);
  ctx.fill();
  
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });
  
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(30, 7.5, 1);
  sprite.position.copy(position);
  sprite.position.y += 20; // Above building
  
  return sprite;
};

// Add labels to high-scoring buildings
buildingsRef.current
  .filter(b => b.userData.building.properties.solar_score >= 80)
  .forEach(building => {
    const label = createLabel(
      `★ ${building.userData.building.properties.solar_score}`,
      building.position
    );
    sceneRef.current.add(label);
  });
```

---

## 📸 Screenshot & Export

### **Capture Screenshot**

```javascript
const captureScreenshot = () => {
  const renderer = rendererRef.current;
  const camera = cameraRef.current;
  const scene = sceneRef.current;
  
  // Render at higher resolution
  const originalSize = renderer.getSize(new THREE.Vector2());
  const scale = 2; // 2x resolution
  
  renderer.setSize(
    originalSize.x * scale,
    originalSize.y * scale
  );
  
  // Render
  renderer.render(scene, camera);
  
  // Get image data
  const dataURL = renderer.domElement.toDataURL('image/png');
  
  // Restore original size
  renderer.setSize(originalSize.x, originalSize.y);
  
  // Download
  const link = document.createElement('a');
  link.download = `solar-analysis-${Date.now()}.png`;
  link.href = dataURL;
  link.click();
};

// Add button
<button onClick={captureScreenshot}>
  📸 Capture Screenshot
</button>
```

### **Export Analysis Data**

```javascript
const exportAnalysis = (building) => {
  const data = {
    address: building.properties.address,
    solarScore: building.properties.solar_score,
    annualProduction: building.properties.annual_kwh,
    paybackYears: building.properties.payback_years,
    co2Savings: building.properties.co2_savings,
    monthlyProduction: building.properties.monthly_production,
    exportDate: new Date().toISOString()
  };
  
  // Convert to CSV
  const csv = Object.entries(data)
    .map(([key, value]) => `${key},${JSON.stringify(value)}`)
    .join('\n');
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `solar-analysis-${building.properties.id}.csv`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};
```

---

## 🎬 Advanced Animations

### **Sunrise/Sunset Simulation**

```javascript
const animateTimeOfDay = () => {
  const duration = 10000; // 10 seconds for full day
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = (elapsed % duration) / duration;
    const hour = progress * 24;
    
    // Update sun position
    const sunAngle = (hour - 6) * (Math.PI / 12);
    const sunHeight = Math.sin(sunAngle) * 100;
    const sunDistance = Math.cos(sunAngle) * 100;
    
    const sunLight = sceneRef.current.getObjectByName('sunLight');
    if (sunLight) {
      sunLight.position.set(sunDistance, Math.max(sunHeight, 10), 50);
      
      // Update sun color
      if (hour < 6 || hour > 20) {
        // Night - blue
        sunLight.color.setHex(0x4169e1);
        sunLight.intensity = 0.3;
      } else if (hour < 8 || hour > 18) {
        // Dawn/Dusk - orange
        sunLight.color.setHex(0xffa500);
        sunLight.intensity = 0.7;
      } else {
        // Day - white
        sunLight.color.setHex(0xffffff);
        sunLight.intensity = 1.2;
      }
    }
    
    requestAnimationFrame(animate);
  };
  
  animate();
};
```

### **Building Growth Animation**

```javascript
const animateBuildingGrowth = () => {
  const duration = 2000;
  const startTime = Date.now();
  
  buildingsRef.current.forEach((building, index) => {
    const delay = index * 50; // Stagger by 50ms
    const targetHeight = building.userData.height;
    
    building.scale.y = 0; // Start flat
    
    const animate = () => {
      const elapsed = Date.now() - startTime - delay;
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }
      
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out
      
      building.scale.y = eased;
      building.position.y = (targetHeight / 2) * eased;
      
      // Update roof too
      if (building.userData.roof) {
        building.userData.roof.position.y = targetHeight * eased + 1;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  });
};
```

---

## 🔍 Advanced Search Features

### **Fuzzy Search**

Implement more forgiving search:

```javascript
const fuzzyMatch = (str, pattern) => {
  pattern = pattern.toLowerCase();
  str = str.toLowerCase();
  
  let patternIdx = 0;
  let strIdx = 0;
  let score = 0;
  
  while (strIdx < str.length && patternIdx < pattern.length) {
    if (str[strIdx] === pattern[patternIdx]) {
      score += 10;
      patternIdx++;
    } else {
      score -= 1;
    }
    strIdx++;
  }
  
  return patternIdx === pattern.length ? score : -1;
};

// Use in search
const searchResults = addresses.map(addr => ({
  ...addr,
  score: fuzzyMatch(addr.address, query)
}))
.filter(r => r.score > 0)
.sort((a, b) => b.score - a.score);
```

### **Search Filters**

Add advanced filters:

```javascript
const [filters, setFilters] = useState({
  minScore: 0,
  maxScore: 100,
  buildingType: 'all',
  minArea: 0
});

const filteredResults = results.filter(building => {
  return (
    building.solar_score >= filters.minScore &&
    building.solar_score <= filters.maxScore &&
    (filters.buildingType === 'all' || 
     building.building_type === filters.buildingType) &&
    building.roof_area >= filters.minArea
  );
});
```

---

## 📱 Mobile Optimizations

### **Touch Gestures**

```javascript
let touchStartDistance = 0;

const handleTouchStart = (e) => {
  if (e.touches.length === 2) {
    // Pinch to zoom
    touchStartDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
};

const handleTouchMove = (e) => {
  if (e.touches.length === 2) {
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    
    const scale = currentDistance / touchStartDistance;
    const camera = cameraRef.current;
    
    camera.position.multiplyScalar(2 - scale);
    touchStartDistance = currentDistance;
  }
};

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
```

### **Performance Mode**

```javascript
const enablePerformanceMode = () => {
  const renderer = rendererRef.current;
  
  // Reduce quality on mobile
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = false;
  particlesRef.current.visible = false;
  
  // Simplify buildings
  buildingsRef.current.forEach(building => {
    building.material.roughness = 1;
    building.material.metalness = 0;
  });
};

// Detect mobile
if (/Mobi|Android/i.test(navigator.userAgent)) {
  enablePerformanceMode();
}
```

---

## 🎯 Best Practices

### **Performance**
✅ Monitor FPS regularly
✅ Profile with Chrome DevTools
✅ Test on low-end devices
✅ Optimize textures (power of 2 dimensions)
✅ Dispose of unused objects

### **Code Quality**
✅ Use TypeScript for better type safety
✅ Write unit tests for utilities
✅ Document complex functions
✅ Follow React best practices
✅ Keep components focused

### **User Experience**
✅ Provide loading feedback
✅ Handle errors gracefully
✅ Test on real devices
✅ Gather user feedback
✅ Iterate based on usage

---

**Happy developing! 🚀**
