# 🔧 Maintenance & Operations Guide - Project SolisCAN

## 📅 Regular Maintenance Tasks

### **Daily Monitoring** (5 minutes)

```bash
# 1. Check application health
curl http://localhost:5001/api/health

# 2. Check error logs
tail -n 50 backend/logs/error.log

# 3. Monitor performance
# In browser console:
performanceMonitor.start()
# ... after 1 minute ...
console.log(performanceMonitor.getSnapshot())
```

**What to look for:**
- ✅ API responding (< 500ms)
- ✅ No errors in logs
- ✅ FPS > 55
- ✅ Memory < 300MB

---

### **Weekly Maintenance** (30 minutes)

#### **1. Performance Audit**
```javascript
// Run full performance test
performanceMonitor.start();

// Test all interactions:
// - Hover 10 buildings
// - Click 5 buildings
// - Search 3 addresses
// - Rotate camera 360°
// - Zoom in/out 5 times

// After 5 minutes:
const report = performanceMonitor.generateReport();
console.log('Health Score:', report.health.score);

// Save report
localStorage.setItem(
  `perf-report-${Date.now()}`,
  JSON.stringify(report)
);
```

**Expected Results:**
- Health Score: > 85
- Average FPS: > 55
- Memory stable (not increasing)
- No API failures

#### **2. Data Validation**
```bash
# Check data files
cd data
ls -lh buildings.geojson
# Should be ~500KB

# Validate GeoJSON
python -c "import json; json.load(open('buildings.geojson'))"

# Check building count
python -c "import json; data=json.load(open('buildings.geojson')); print(f'Buildings: {len(data[\"features\"])}')"
# Should output: Buildings: 100
```

#### **3. Dependency Updates**
```bash
# Check for outdated packages
cd frontend
npm outdated

# Check for security vulnerabilities
npm audit

# Update if needed (be careful!)
npm update --save
```

---

### **Monthly Maintenance** (2 hours)

#### **1. Full System Test**
```bash
# Run test suite (when implemented)
cd frontend
npm test

# Manual testing checklist:
# □ All 100 buildings visible
# □ Hover tooltips work
# □ Click selection works
# □ Search finds buildings
# □ Analysis panel opens
# □ Charts render correctly
# □ Theme toggle works
# □ Mobile responsive
# □ No console errors
```

#### **2. Performance Optimization**
```javascript
// Analyze bundle size
cd frontend
npm run build -- --stats

// Check for:
// - Large chunks (> 500KB)
// - Duplicate dependencies
// - Unused code
```

#### **3. Code Quality Review**
```bash
# Run linter
npm run lint

# Check for issues:
# - Unused imports
# - Console.logs
# - TODO comments
# - Code duplication
```

#### **4. Database Cleanup** (if using database)
```sql
-- Remove old logs
DELETE FROM logs WHERE created_at < NOW() - INTERVAL 90 DAYS;

-- Vacuum database
VACUUM ANALYZE;

-- Check size
SELECT pg_size_pretty(pg_database_size('solar_roof_db'));
```

---

## 📊 Monitoring & Alerts

### **Key Metrics to Track**

#### **Performance Metrics**
```javascript
// Setup monitoring
const THRESHOLDS = {
  fps: {
    critical: 30,
    warning: 45,
    target: 60
  },
  memory: {
    critical: 500,  // MB
    warning: 350,
    target: 200
  },
  loadTime: {
    critical: 5000,  // ms
    warning: 3000,
    target: 2000
  },
  apiResponse: {
    critical: 2000,  // ms
    warning: 1000,
    target: 500
  }
};

// Check metrics
function checkHealth() {
  const snapshot = performanceMonitor.getSnapshot();
  
  if (snapshot.currentFPS < THRESHOLDS.fps.critical) {
    console.error('🚨 CRITICAL: FPS below 30!');
  } else if (snapshot.currentFPS < THRESHOLDS.fps.warning) {
    console.warn('⚠️ WARNING: FPS below 45');
  }
  
  if (snapshot.currentMemoryMB > THRESHOLDS.memory.critical) {
    console.error('🚨 CRITICAL: Memory above 500MB!');
  } else if (snapshot.currentMemoryMB > THRESHOLDS.memory.warning) {
    console.warn('⚠️ WARNING: Memory above 350MB');
  }
}

// Run every minute
setInterval(checkHealth, 60000);
```

#### **Error Tracking**
```javascript
// Track errors
window.addEventListener('error', (event) => {
  const errorData = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
    timestamp: new Date().toISOString()
  };
  
  // Log to console
  console.error('Error caught:', errorData);
  
  // Send to monitoring service (if configured)
  if (window.errorTracking) {
    window.errorTracking.logError(errorData);
  }
});
```

#### **User Analytics**
```javascript
// Track key user actions
function trackEvent(category, action, label) {
  if (window.gtag) {
    gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }
  
  console.log('Event:', category, action, label);
}

// Example usage:
// trackEvent('Building', 'Select', buildingId);
// trackEvent('Search', 'Query', searchTerm);
// trackEvent('Performance', 'FPS_Drop', currentFPS);
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: Buildings Disappear After Some Time**

**Symptoms:**
- Buildings render initially
- After 5-10 minutes, some disappear
- Console shows WebGL warnings

**Diagnosis:**
```javascript
// Check memory
console.log(performance.memory.usedJSHeapSize / (1024 * 1024) + 'MB');

// Check scene children count
console.log(sceneRef.current.children.length);

// Should be: 100 buildings + ground + sky + lights + particles ≈ 105
```

**Solution:**
```javascript
// Memory leak - ensure proper cleanup
// Check Map3D.js useEffect cleanup:
return () => {
  if (animationRef.current) {
    cancelAnimationFrame(animationRef.current);
  }
  
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
  
  renderer.dispose();
};
```

---

### **Issue 2: FPS Drops Over Time**

**Symptoms:**
- Starts at 60 FPS
- Gradually drops to 30-40 FPS
- Continues dropping over time

**Diagnosis:**
```javascript
// Check if animation loop is being called multiple times
let frameCount = 0;
const checkFrameRate = () => {
  frameCount++;
  setTimeout(() => {
    console.log('Frames in 1 second:', frameCount);
    frameCount = 0;
    checkFrameRate();
  }, 1000);
};
checkFrameRate();

// Should be: ~60 frames per second
// If higher (120, 180): Multiple animation loops running!
```

**Solution:**
```javascript
// Ensure only one animation loop
useEffect(() => {
  const animate = () => {
    animationRef.current = requestAnimationFrame(animate);
    // ... render logic ...
  };
  animate();
  
  return () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);  // ← Critical!
      animationRef.current = null;
    }
  };
}, []); // ← Empty dependency array!
```

---

### **Issue 3: Camera Position Resets Unexpectedly**

**Symptoms:**
- Camera jumps to different position
- Happens when selecting buildings
- Controls become unresponsive

**Diagnosis:**
```javascript
// Check if camera position is being set elsewhere
console.log('Camera position:', cameraRef.current.position);
console.log('Controls target:', controlsRef.current.target);
```

**Solution:**
```javascript
// Don't set camera position in render loop
// Only set in:
// 1. Initial setup
// 2. Explicit user action (fly-to)
// 3. Building data load (adjustCameraToFitBuildings)

// Always use lerp for smooth transitions:
const targetPos = new THREE.Vector3(x, y, z);
cameraRef.current.position.lerp(targetPos, 0.1);
```

---

### **Issue 4: Search Not Finding Buildings**

**Symptoms:**
- Search returns no results
- Address exists in data
- API returns 200 but empty array

**Diagnosis:**
```bash
# Check if address index exists
cd data
ls -l address_index.json

# Check content
head -n 20 address_index.json

# Test API directly
curl "http://localhost:5001/api/search?q=rue"
```

**Solution:**
```python
# Rebuild address index
# In backend/serve_api.py, add endpoint:

@app.route('/api/rebuild-index', methods=['POST'])
def rebuild_index():
    global ADDRESS_INDEX
    ADDRESS_INDEX = {}
    
    buildings = load_buildings()
    for feature in buildings['features']:
        building_id = feature['properties']['id']
        address = feature['properties'].get('address', '')
        
        ADDRESS_INDEX[building_id] = {
            'address': address,
            'solar_score': feature['properties'].get('solar_score', 0),
            'searchable': address.lower()
        }
    
    return jsonify({'success': True, 'count': len(ADDRESS_INDEX)})

# Call: curl -X POST http://localhost:5001/api/rebuild-index
```

---

## 🔄 Update Procedures

### **Updating Building Data**

```bash
# 1. Backup current data
cp data/buildings.geojson data/buildings.geojson.backup

# 2. Update with new data
cp /path/to/new/buildings.geojson data/buildings.geojson

# 3. Validate
python -c "import json; json.load(open('data/buildings.geojson'))"

# 4. Restart backend
# Kill existing process
pkill -f serve_api.py

# Start fresh
cd backend
python serve_api.py

# 5. Clear browser cache and reload
# In browser: Ctrl+Shift+R (hard reload)
```

### **Updating Frontend Dependencies**

```bash
# 1. Review changes
cd frontend
npm outdated

# 2. Test updates in development
npm update --save

# 3. Test application
npm start
# Manually test all features

# 4. Run build
npm run build

# 5. If successful, commit
git add package.json package-lock.json
git commit -m "Update frontend dependencies"
```

### **Updating Backend Dependencies**

```bash
# 1. Review changes
cd backend
pip list --outdated

# 2. Update requirements
pip install --upgrade flask flask-cors

# 3. Update requirements.txt
pip freeze > requirements.txt

# 4. Test
python serve_api.py
# Test all endpoints

# 5. If successful, commit
git add requirements.txt
git commit -m "Update backend dependencies"
```

---

## 📈 Performance Optimization

### **When to Optimize**

Optimize if you see:
- FPS < 45 consistently
- Memory > 300MB
- Load time > 3 seconds
- User complaints about slowness

### **Quick Wins**

#### **1. Reduce Particle Count**
```javascript
// In Map3D.js
const particles = createAtmosphericParticles(100); // Was 400
```

#### **2. Lower Shadow Quality**
```javascript
// In Map3D.js
sunLight.shadow.mapSize.width = 1024;  // Was 2048
sunLight.shadow.mapSize.height = 1024; // Was 2048
```

#### **3. Disable Shadows on Mobile**
```javascript
if (/Mobi|Android/i.test(navigator.userAgent)) {
  renderer.shadowMap.enabled = false;
  buildingsRef.current.forEach(b => {
    b.castShadow = false;
    b.receiveShadow = false;
  });
}
```

#### **4. Implement LOD (Level of Detail)**
```javascript
// For scenes with 500+ buildings
import { LOD } from 'three';

const createBuildingLOD = (building) => {
  const lod = new LOD();
  
  // Detailed mesh (close)
  const detailedMesh = createDetailedBuilding(building);
  lod.addLevel(detailedMesh, 0);
  
  // Simplified mesh (medium)
  const simpleMesh = createSimpleBuilding(building);
  lod.addLevel(simpleMesh, 100);
  
  // Very simple mesh (far)
  const verySimpleMesh = createBoxBuilding(building);
  lod.addLevel(verySimpleMesh, 300);
  
  return lod;
};
```

---

## 🔐 Security Maintenance

### **Monthly Security Audit**

```bash
# 1. Check for vulnerabilities
cd frontend
npm audit

# Fix if found
npm audit fix

# 2. Check backend dependencies
cd backend
pip install safety
safety check

# 3. Review CORS settings
# In backend/serve_api.py
# Ensure only production domains allowed:
CORS(app, origins=[
    'http://localhost:3000',      # Development
    'https://your-domain.com'     # Production
])

# 4. Check SSL certificate (production)
curl -vI https://your-domain.com 2>&1 | grep "expire date"

# 5. Review server logs for suspicious activity
grep "404" backend/logs/access.log | wc -l
grep "500" backend/logs/error.log | wc -l
```

### **Security Checklist**

- [ ] No API keys in client code
- [ ] CORS restricted to known domains
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced (production)
- [ ] Security headers set
- [ ] Dependencies up to date
- [ ] No exposed .env files
- [ ] Backups encrypted
- [ ] Logs rotated regularly

---

## 📚 Documentation Maintenance

### **Keep Documentation Updated**

When you make changes:

1. **Update ARCHITECTURE.md** if:
   - Adding new components
   - Changing data flow
   - Modifying API endpoints

2. **Update ADVANCED_USAGE.md** if:
   - Adding new features
   - Changing keyboard shortcuts
   - Adding utilities

3. **Update DEPLOYMENT_CHECKLIST.md** if:
   - Changing deployment process
   - Adding environment variables
   - Updating dependencies

4. **Update README.md** if:
   - Changing setup steps
   - Adding requirements
   - Modifying project scope

---

## 🎓 Training New Developers

### **Onboarding Checklist**

New team member? Have them:

1. **Read Documentation** (Day 1)
   - [ ] README_TRANSFORMATION.md (overview)
   - [ ] QUICK_TEST.md (setup)
   - [ ] ARCHITECTURE.md (system design)

2. **Setup Environment** (Day 1-2)
   - [ ] Clone repository
   - [ ] Install dependencies
   - [ ] Run locally
   - [ ] Complete QUICK_TEST.md

3. **Understand Code** (Week 1)
   - [ ] Review Map3D.js
   - [ ] Understand coordinate system
   - [ ] Study data flow
   - [ ] Read utils files

4. **Make First Change** (Week 2)
   - [ ] Fix a small bug
   - [ ] Add a feature
   - [ ] Write tests
   - [ ] Submit pull request

---

## 📞 Support Contacts

### **When Things Go Wrong**

1. **Check Documentation First**
   - Review relevant .md files
   - Search for error messages
   - Check troubleshooting sections

2. **Use Debug Tools**
   - Enable debug mode
   - Check browser console
   - Run performance monitor
   - Review network tab

3. **Community Resources**
   - Three.js Discourse: https://discourse.threejs.org/
   - React Community: https://react.dev/community
   - Stack Overflow: Tag with `three.js` and `react`

4. **Professional Support**
   - Consider hiring Three.js expert
   - React consulting services
   - DevOps support for deployment

---

## ✅ Maintenance Checklist

Print this and check monthly:

```
Monthly Maintenance Checklist
─────────────────────────────────────
Date: _______________

□ Performance audit completed
□ Health score > 85
□ No memory leaks detected
□ Dependencies updated
□ Security scan passed
□ Documentation updated
□ Backups verified
□ Logs reviewed
□ Error rate < 1%
□ Uptime > 99%

Notes:
_____________________________________
_____________________________________
_____________________________________

Next review: _______________
```

---

**Keep your application healthy with regular maintenance! 🏥**
