# 🏛️ Project SolisCAN - System Architecture

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (React + Three.js Frontend)                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ HTTP/REST API
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                      BACKEND SERVER                             │
│                    (Python Flask API)                           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ File I/O
                        │
┌───────────────────────▼─────────────────────────────────────────┐
│                       DATA LAYER                                │
│                  (GeoJSON + JSON Files)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Architecture

### **Component Hierarchy**
```
App.js (Root)
├── ThemeToggle
├── SearchBar
│   └── Search Results Dropdown
├── Map3D (Main 3D Visualization)
│   ├── Three.js Scene
│   │   ├── Camera
│   │   ├── Renderer
│   │   ├── Lighting System
│   │   ├── Sky Sphere
│   │   ├── Ground Plane
│   │   ├── Particle System
│   │   └── Building Meshes (100+)
│   ├── OrbitControls
│   ├── Raycaster (for interactions)
│   ├── Building Tooltip
│   ├── Control Hints
│   └── Stats Display
├── AnalysisPanel (Side Panel)
│   ├── Building Details
│   ├── Solar Score
│   ├── Key Metrics
│   ├── Monthly Chart
│   ├── Contributing Factors
│   └── Environmental Impact
└── MapLegend
```

### **Data Flow**
```
User Action
    ↓
Event Handler (onClick, onHover)
    ↓
State Update (React State)
    ↓
Component Re-render
    ↓
Three.js Scene Update
    ↓
GPU Rendering
```

### **State Management**
```javascript
App.js (Main State Container)
├── selectedBuilding: Object | null
├── buildings: GeoJSON FeatureCollection
├── loading: boolean
├── error: string | null
└── theme: 'light' | 'dark'

Map3D.js (Component State)
├── isLoading: boolean
├── hoveredBuilding: Object | null
├── loadingProgress: number
├── timeOfDay: number (0-24)
└── showDebug: boolean

Refs (for Three.js objects)
├── sceneRef: THREE.Scene
├── rendererRef: THREE.WebGLRenderer
├── cameraRef: THREE.PerspectiveCamera
├── controlsRef: OrbitControls
├── buildingsRef: Array<THREE.Mesh>
└── particlesRef: THREE.Points
```

---

## 🔧 Backend Architecture

### **API Structure**
```
Flask Application
├── CORS Configuration
├── Route Handlers
│   ├── GET /api/buildings          # All buildings
│   ├── GET /api/buildings/:id      # Single building
│   ├── GET /api/search?q=          # Search addresses
│   ├── GET /api/metadata           # Dataset info
│   └── GET /api/health             # Health check
├── Data Processing Functions
│   ├── load_geojson_data()
│   ├── calculate_monthly_production()
│   ├── calculate_environmental_impact()
│   └── build_address_index()
└── Error Handlers
```

### **Request/Response Flow**
```
Client Request
    ↓
Flask Route Handler
    ↓
Read GeoJSON from disk
    ↓
Process/Filter Data
    ↓
Calculate Derived Metrics
    ↓
Format Response
    ↓
Send JSON Response
    ↓
Client receives & renders
```

---

## 🗺️ 3D Rendering Pipeline

### **Initialization Phase**
```
1. Create Scene
   └── Set fog, background
   
2. Create Camera
   └── PerspectiveCamera(45°, aspect, near, far)
   
3. Create Renderer
   ├── WebGLRenderer with antialiasing
   ├── Enable shadows
   ├── Set tone mapping
   └── Attach to DOM
   
4. Add Lighting
   ├── Ambient Light (40%)
   ├── Directional Light (Sun)
   ├── Fill Light
   └── Hemisphere Light
   
5. Add Environment
   ├── Gradient Sky Sphere
   ├── Ground Plane
   └── Particle System
   
6. Setup Controls
   └── OrbitControls with constraints
   
7. Start Animation Loop
   └── requestAnimationFrame()
```

### **Building Creation Pipeline**
```
Load GeoJSON
    ↓
Calculate Bounding Box
    ↓
Determine Center Point (lat, lon)
    ↓
For Each Building:
    ↓
    Extract Coordinates
    ↓
    Convert lat/lng → 3D World Space
    │   └── Mercator Projection
    │       └── Scale by latitude
    ↓
    Create 2D Shape from Footprint
    ↓
    Extrude to 3D (building height)
    ↓
    Create Materials
    │   ├── Wall Material (with windows)
    │   └── Roof Material (based on score)
    ↓
    Create Mesh
    ↓
    Position in 3D space
    ↓
    Add to Scene
    ↓
    Store reference
    
After All Buildings:
    ↓
Calculate Optimal Camera Position
    ↓
Animate Camera to Position
```

### **Coordinate Transformation**
```
Geographic Coordinates (WGS84)
    ↓
    Longitude: -73.5° (example)
    Latitude:   45.5° (example)
    ↓
Web Mercator Projection
    ↓
    x = (lon - centerLon) × scale × cos(centerLat)
    z = -(lat - centerLat) × scale
    ↓
    scale = 111,320 × cos(45°) ≈ 78,847 meters/degree
    ↓
3D World Space
    ↓
    x: -50 to +50 (example range)
    y:   0 to +50 (height)
    z: -50 to +50 (example range)
```

### **Rendering Loop (60 FPS)**
```
requestAnimationFrame()
    ↓
Update Controls (damped rotation)
    ↓
Update Particles (float upward)
    ↓
Update Building Animations
│   ├── Hover effects
│   ├── Selection highlights
│   └── Material uniforms
    ↓
Render Scene
│   ├── Clear buffers
│   ├── Compute frustum culling
│   ├── Render opaque objects
│   ├── Render transparent objects
│   └── Render shadows
    ↓
Request next frame
```

### **Interaction Pipeline**
```
Mouse Move Event
    ↓
Convert to Normalized Device Coordinates
│   x: -1 to +1
│   y: -1 to +1
    ↓
Create Raycaster
│   origin: camera position
│   direction: through mouse point
    ↓
Test Intersection with Buildings
    ↓
IF Hit:
│   └── Set hoveredBuilding
│       ├── Update cursor to pointer
│       ├── Show tooltip
│       └── Animate building (lift up)
ELSE:
│   └── Clear hoveredBuilding
│       ├── Update cursor to default
│       └── Hide tooltip
    
Mouse Click Event
    ↓
Raycaster Test
    ↓
IF Hit:
    └── Select Building
        ├── Update selectedBuilding state
        ├── Animate building (scale up)
        ├── Open AnalysisPanel
        └── Fetch detailed data
```

---

## 💾 Data Architecture

### **GeoJSON Structure**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-73.556, 45.504],  // lon, lat pairs
            [-73.555, 45.504],
            [-73.555, 45.503],
            [-73.556, 45.503],
            [-73.556, 45.504]   // Close polygon
          ]
        ]
      },
      "properties": {
        "id": "building_0",
        "address": "123 Rue Example",
        "solar_score": 85.5,
        "annual_kwh": 12500,
        "roof_area": 150.2,
        "height": 12.5,
        "azimuth": 180,
        "shading": 15.3,
        "building_type": "residential",
        "payback_years": 8.5,
        "co2_savings": 6250
      }
    }
  ]
}
```

### **Address Index Structure**
```json
{
  "building_0": {
    "address": "123 Rue Example, Montreal, QC",
    "solar_score": 85.5,
    "searchable": "123 rue example montreal qc"
  }
}
```

### **Metadata Structure**
```json
{
  "dataset_name": "Montreal Solar Potential",
  "building_count": 100,
  "coverage_area": "Downtown + Plateau",
  "date_created": "2024-01-15",
  "data_source": "OpenStreetMap",
  "coordinate_system": "WGS84"
}
```

---

## 🎨 Material System

### **Building Wall Material**
```javascript
Canvas Texture (512×512)
    ↓
Draw Base Color (from solar score)
    ↓
Draw Window Grid
│   ├── Window size: 16×16px
│   ├── Spacing: 24px
│   ├── Random lit/unlit (30%/70%)
│   └── Window frames
    ↓
Create THREE.Texture
    ↓
Apply to MeshStandardMaterial
    ├── map: texture
    ├── color: score color
    ├── roughness: 0.7
    ├── metalness: 0.3
    └── emissive: subtle glow
```

### **Roof Material**
```javascript
IF solar_score >= 70:
    Draw Solar Panels
    │   ├── Dark blue/black base
    │   ├── Panel grid (32×32px)
    │   └── Cell details (8×8px)
ELSE:
    Draw Regular Roof
    │   ├── Grey base
    │   └── Tile pattern
    ↓
Create THREE.Texture
    ↓
Apply to MeshStandardMaterial
```

---

## ⚡ Performance Optimizations

### **Rendering Optimizations**
```
✓ Frustum Culling (built-in Three.js)
✓ Pixel Ratio Capped at 2×
✓ Shadow Map Size: 2048×2048
✓ PCF Soft Shadows (quality vs. performance)
✓ Damped Controls (reduce render calls)
✓ Efficient Raycasting (only against buildings)
✓ Object Pooling (particles)
```

### **Memory Management**
```
✓ Proper disposal of geometries
✓ Proper disposal of materials
✓ Proper disposal of textures
✓ Clear event listeners
✓ Cancel animation frames
✓ Remove DOM elements
```

### **Bundle Optimizations**
```
✓ Code splitting (React.lazy if needed)
✓ Tree shaking (Three.js modules)
✓ Minification in production
✓ Gzip compression
✓ Asset optimization
```

---

## 🔄 Update Flow

### **Building Selection Update**
```
User clicks building
    ↓
handleClick() in Map3D
    ↓
onBuildingSelect(building)
    ↓
setSelectedBuilding() in App
    ↓
React re-renders
    ↓
    ├→ AnalysisPanel receives building prop
    │   └── Fetches detailed data
    │       └── Displays analysis
    │
    └→ Map3D receives selectedBuilding prop
        └── useEffect triggers
            └── Updates building materials
                ├── Highlighted (scale 1.05)
                └── Selection shader active
```

### **Search Update**
```
User types in SearchBar
    ↓
handleInputChange()
    ↓
Debounced API call
    ↓
/api/search?q=query
    ↓
Backend searches address index
    ↓
Returns matching results
    ↓
Display dropdown
    ↓
User clicks result
    ↓
handleResultClick()
    ↓
Fetch building details
    ↓
onResult(building)
    ↓
setSelectedBuilding() in App
    ↓
Building highlighted + panel opens
```

---

## 🧩 Module Dependencies

### **Frontend Dependencies**
```
react: UI framework
three: 3D rendering engine
├── OrbitControls: Camera controls
├── ExtrudeGeometry: Building shapes
└── Various materials & lights

framer-motion: UI animations
chart.js: Data visualization
lucide-react: Icons
```

### **Backend Dependencies**
```
flask: Web framework
flask-cors: Cross-origin support
json: Data handling
os: File system operations
```

---

## 🔐 Security Architecture

### **API Security**
```
CORS Configuration
    ↓
Whitelist Origins
    └── localhost:3000 (dev)
    └── production-domain.com (prod)
    
Rate Limiting
    └── 100 requests/minute per IP
    
Input Validation
    └── Sanitize query parameters
    
Error Handling
    └── Don't expose internal errors
```

### **Client Security**
```
No API keys in client code
    └── All keys server-side
    
XSS Prevention
    └── React auto-escapes
    
HTTPS Only
    └── Force SSL in production
```

---

## 📊 Monitoring Points

### **Performance Metrics**
```
✓ FPS (target: 60)
✓ Frame time (target: <16.67ms)
✓ Memory usage
✓ Render time
✓ API response time
✓ Loading time
```

### **Error Tracking**
```
✓ JavaScript errors
✓ API failures
✓ Resource loading errors
✓ WebGL context loss
✓ Out of memory errors
```

### **User Analytics**
```
✓ Page views
✓ Building selections
✓ Search queries
✓ Time on site
✓ Device types
✓ Browser versions
```

---

## 🔮 Scalability Considerations

### **Horizontal Scaling**
```
Frontend
    └── Serve from CDN
        └── CloudFront, CloudFlare, etc.
        
Backend
    └── Load balancer
        ├── Server 1 (read-only)
        ├── Server 2 (read-only)
        └── Server N (read-only)
```

### **Data Scaling**
```
Current: 100 buildings
    └── 2-3 second load time
    
1,000 buildings
    └── Implement LOD system
    └── Load buildings in chunks
    └── Index spatial data
    
10,000+ buildings
    └── Vector tiles
    └── Database backend
    └── Server-side rendering
    └── Progressive loading
```

---

## 🎯 Critical Paths

### **Initial Load**
```
1. HTML/CSS/JS Download (<1s)
2. React Bootstrap (<0.5s)
3. API /buildings request (<0.5s)
4. GeoJSON parsing (<0.2s)
5. Building mesh creation (<1s)
6. Camera positioning (<0.1s)
7. First render (<0.1s)
---
Total: ~3 seconds target
```

### **Interaction**
```
Hover: <16ms (instant)
Click: <50ms (immediate)
Search: <300ms (responsive)
Panel open: <100ms (smooth)
```

---

This architecture provides a solid foundation for:
- ✅ Scalability (1000+ buildings)
- ✅ Performance (60 FPS target)
- ✅ Maintainability (clear separation)
- ✅ Extensibility (easy to add features)
- ✅ Reliability (proper error handling)
