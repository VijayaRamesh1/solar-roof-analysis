# 🚀 Quick Test Guide

## Testing Your 3D Visualization Fixes

### Prerequisites
- Node.js installed
- Python 3 installed
- Project files at `/Users/pinaz.patel/solar roof`

---

## Step 1: Start Backend Server

```bash
cd "/Users/pinaz.patel/solar roof/backend"
python serve_api.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5001
 * Debugger is active!
```

**✅ Backend is ready when you see:** "Running on http://127.0.0.1:5001"

---

## Step 2: Start Frontend Development Server

Open a **new terminal window**:

```bash
cd "/Users/pinaz.patel/solar roof/frontend"
npm start
```

**Expected output:**
```
Compiled successfully!
webpack compiled with 0 warnings

You can now view solar-roof in the browser.
  Local:            http://localhost:3000
```

**✅ Frontend is ready when:** Browser opens automatically to http://localhost:3000

---

## Step 3: Visual Verification Checklist

### 🎨 **Immediate Visual Check** (within 5 seconds)

- [ ] **Loading Screen**: See "Loading Solar Data..." with spinner
- [ ] **Data Loads**: Progress changes to "Rendering 3D city..."
- [ ] **3D Scene Appears**: Beautiful gradient background visible
- [ ] **Buildings Render**: See 100 colorful buildings in 3D
- [ ] **Camera Animation**: Smooth zoom/pan to frame all buildings

### 🖱️ **Interaction Check** (30 seconds)

- [ ] **Mouse Hover**: Tooltip appears when hovering over buildings
- [ ] **Building Click**: Clicking opens analysis panel on the right
- [ ] **Drag to Rotate**: Left-click + drag rotates the view
- [ ] **Scroll to Zoom**: Mouse wheel zooms in/out
- [ ] **Pan View**: Right-click + drag (or Shift + drag) pans the view

### 🔍 **Detail Verification**

- [ ] **Building Colors**: Buildings colored by solar score (green=good, red=poor)
- [ ] **Building Heights**: Buildings have varying heights (realistic)
- [ ] **Roofs**: Flat roofs visible on top of each building
- [ ] **Shadows**: Buildings cast shadows on ground
- [ ] **Tooltip Info**: Shows address, solar score, annual kWh
- [ ] **Smooth Animations**: Hover effects are smooth and responsive

---

## Step 4: Debug Mode Test

1. Look for the controls in bottom-right corner
2. Click the "🔍 Show Debug" button
3. **Verify you see:**
   - Red/Green/Blue axes in the center
   - Grid lines on the ground
   4. Click again to hide debug helpers

---

## Step 5: Performance Check

Open Browser DevTools (F12):

### **Console Tab**
You should see logs like:
```
🎨 Initializing enhanced 3D scene...
📷 Initial camera position: Vector3 {x: 400, y: 300, z: 400}
🏢 Creating enhanced 3D buildings... 100
📍 Map center: 45.XXX -73.XXX
📏 Scale factor: XXXXX.XX units per degree
Building 0: {height: XX, position: {x: XX, z: XX}, ...}
✅ Created 100 buildings
📊 Height range: X.X - XX.X meters
📷 Scene bounds: {...}
📷 Camera positioned: {...}
```

### **Performance Tab**
1. Record for 10 seconds
2. Check FPS: Should be **55-60 FPS**
3. Check Memory: Should be stable (not constantly increasing)

---

## 🐛 Troubleshooting

### Problem: "Unable to Load Data" Error

**Cause:** Backend not running

**Fix:**
```bash
# Check if backend is running
curl http://localhost:5001/api/health

# If no response, start backend:
cd backend
python serve_api.py
```

---

### Problem: Buildings Not Visible

**Checks:**
1. Open browser console (F12)
2. Look for "✅ Created X buildings" message
3. Check if X > 0
4. Enable debug mode to see axes

**If count is 0:**
- Check `data/buildings.geojson` file exists
- Verify backend can read the file
- Check backend console for errors

**If count > 0 but nothing visible:**
- Enable debug mode
- Check if axes are visible
- Try zooming out (scroll mouse)
- Check console for camera position

---

### Problem: Low FPS / Laggy

**Quick Fixes:**
1. Close other browser tabs
2. Update graphics drivers
3. Try Chrome (better WebGL performance)

**Code Fixes:**
Edit `Map3D.js`:
```javascript
// Reduce particle count
const particles = createAtmosphericParticles(100); // Was 400

// Disable shadows
renderer.shadowMap.enabled = false;

// Lower pixel ratio
renderer.setPixelRatio(1); // Was Math.min(devicePixelRatio, 2)
```

---

### Problem: CORS Error

**Error in console:**
```
Access to fetch at 'http://localhost:5001/api/buildings' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Fix:**
Check `backend/serve_api.py` has CORS enabled:
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
```

---

### Problem: Buildings Appear at Wrong Scale

**Too Small:**
```javascript
// In Map3D.js, increase scale:
const scale = metersPerDegree * Math.cos((centerLat * Math.PI) / 180) * 2;
```

**Too Large:**
```javascript
// In Map3D.js, decrease scale:
const scale = metersPerDegree * Math.cos((centerLat * Math.PI) / 180) * 0.5;
```

---

## 📊 Expected Results

### **Visual Quality**
- ✨ Crisp, antialiased edges
- 🎨 Vibrant colors (green/lime/amber/orange/red based on solar scores)
- 💡 Realistic lighting and shadows
- 🌥️ Atmospheric particles floating
- 🏗️ Detailed window textures on buildings
- 🔵 Blue gradient sky

### **Performance**
- **FPS:** 55-60 (smooth)
- **Load Time:** 2-3 seconds
- **Memory:** ~150-250 MB
- **CPU:** 20-40% usage

### **Interactions**
- **Hover Response:** < 16ms (instant)
- **Click Response:** < 50ms (immediate)
- **Camera Rotation:** Smooth, damped
- **Zoom:** Responsive, no lag

---

## 🎯 Success Criteria

### ✅ **All Systems Go** if you can:

1. **See 100 buildings** rendered in 3D
2. **Rotate the view** smoothly with mouse
3. **Hover over buildings** to see tooltips
4. **Click buildings** to open analysis panel
5. **Read building details** in the analysis panel
6. **Search for addresses** and find buildings
7. **Maintain 60 FPS** during all interactions
8. **See proper shadows** cast by buildings

---

## 📸 Screenshot Test

Take a screenshot and verify:
- [ ] Buildings are clearly visible
- [ ] Colors are vibrant and distinguishable
- [ ] Shadows appear realistic
- [ ] Sky gradient is smooth
- [ ] No visual artifacts or z-fighting
- [ ] Buildings have proper proportions

---

## 🔄 Restart After Changes

If you modify code:

### Frontend Changes (JS/CSS):
- **Auto-refresh**: Changes reflect immediately
- No restart needed (hot reload enabled)

### Backend Changes (Python):
1. Stop backend (Ctrl+C)
2. Restart: `python serve_api.py`

### Data Changes (buildings.geojson):
1. Just refresh browser (F5)
2. Backend automatically reads new data

---

## 🎉 Celebration Time!

If all checks pass, you now have:
- ✅ Beautiful 3D visualization
- ✅ Real Montreal buildings
- ✅ Accurate solar scoring
- ✅ Smooth interactions
- ✅ Professional UX

**Share a screenshot and celebrate! 🎊**

---

## 📞 Still Having Issues?

### Check These Files:
1. `/Users/pinaz.patel/solar roof/data/buildings.geojson` exists
2. `/Users/pinaz.patel/solar roof/frontend/src/components/Map3D.js` updated
3. `/Users/pinaz.patel/solar roof/frontend/src/utils/coordinateUtils.js` updated

### Browser Console Commands:
```javascript
// Check if scene has buildings
window.scene = sceneRef.current;
scene.children.length; // Should be > 100

// Check building positions
buildingsRef.current.map(b => b.position);

// Check camera position
cameraRef.current.position;
```

### Get Help:
1. Check console for error messages
2. Enable debug mode
3. Review `3D_FIXES_GUIDE.md` for detailed explanations
4. Check network tab for API failures

---

**Good luck! 🚀 Your visualization should be stunning!**
