# ✈️ Pre-Flight Checklist - Project SolisCAN

Run through this checklist before launching the application to ensure everything is properly configured.

---

## 📋 System Requirements

### **Minimum Requirements**
- [ ] **Operating System**: macOS 10.15+, Windows 10+, or Linux
- [ ] **Python**: Version 3.8 or higher
- [ ] **Node.js**: Version 16.x or higher
- [ ] **RAM**: 4GB minimum (8GB recommended)
- [ ] **Storage**: 500MB free space
- [ ] **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

### **Recommended Setup**
- [ ] **RAM**: 8GB or more
- [ ] **GPU**: Dedicated graphics card (for better 3D performance)
- [ ] **Display**: 1920x1080 or higher resolution
- [ ] **Internet**: For initial data fetching (if needed)
- [ ] **Browser**: Chrome (best WebGL performance)

---

## 🔧 Installation Verification

### **Step 1: Verify Python Installation**
```bash
python3 --version
# Expected: Python 3.8.x or higher
```
- [ ] Python 3.8+ is installed
- [ ] `pip3` command works

### **Step 2: Verify Node.js Installation**
```bash
node --version
# Expected: v16.x.x or higher

npm --version
# Expected: 8.x.x or higher
```
- [ ] Node.js 16+ is installed
- [ ] npm is available

### **Step 3: Check Project Structure**
Verify these directories exist:
```
/Users/pinaz.patel/solar roof/
├── backend/
│   ├── serve_api.py
│   ├── fetch_data_auto.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── data/
    ├── buildings.geojson
    ├── address_index.json
    └── metadata.json
```

- [ ] `backend/` directory exists
- [ ] `frontend/` directory exists
- [ ] `data/` directory exists
- [ ] All key files present

---

## 📦 Dependencies Installation

### **Step 4: Install Backend Dependencies**
```bash
cd "/Users/pinaz.patel/solar roof/backend"
pip3 install -r requirements.txt
```

**Expected packages:**
- [ ] Flask
- [ ] Flask-CORS
- [ ] requests
- [ ] geojson

**Verification:**
```bash
python3 -c "import flask, flask_cors; print('✅ Backend dependencies installed')"
```
- [ ] No import errors

### **Step 5: Install Frontend Dependencies**
```bash
cd "/Users/pinaz.patel/solar roof/frontend"
npm install
```

**Expected packages:**
- [ ] react
- [ ] three
- [ ] framer-motion
- [ ] chart.js
- [ ] lucide-react

**Verification:**
```bash
npm list react three
# Should show installed versions
```
- [ ] node_modules/ directory created
- [ ] No critical warnings during install

---

## 📊 Data Verification

### **Step 6: Check Building Data**
```bash
cd "/Users/pinaz.patel/solar roof"
ls -lh data/buildings.geojson
```

- [ ] File exists and is > 100KB
- [ ] File is valid JSON (check with: `python3 -m json.tool data/buildings.geojson`)
- [ ] Contains 100 building features

### **Step 7: Verify Data Structure**
```bash
cd data
python3 << EOF
import json
with open('buildings.geojson') as f:
    data = json.load(f)
print(f"Features: {len(data['features'])}")
print(f"First building has solar_score: {'solar_score' in data['features'][0]['properties']}")
EOF
```

- [ ] Returns "Features: 100"
- [ ] Returns "True" for solar_score

---

## 🚀 Backend Launch Test

### **Step 8: Test Backend Startup**
```bash
cd "/Users/pinaz.patel/solar roof/backend"
python3 serve_api.py &
BACKEND_PID=$!
sleep 3
```

- [ ] Server starts without errors
- [ ] See "Running on http://127.0.0.1:5001"
- [ ] No Python tracebacks

### **Step 9: Test API Endpoints**
```bash
# Health check
curl http://localhost:5001/api/health
# Expected: {"status":"healthy"}

# Buildings endpoint
curl http://localhost:5001/api/buildings | head -c 200
# Expected: JSON starting with {"type":"FeatureCollection"

# Search endpoint
curl "http://localhost:5001/api/search?q=rue"
# Expected: JSON array with search results
```

- [ ] Health endpoint returns healthy status
- [ ] Buildings endpoint returns GeoJSON
- [ ] Search endpoint returns results

### **Step 10: Stop Test Backend**
```bash
kill $BACKEND_PID
```
- [ ] Backend stops cleanly

---

## 🎨 Frontend Launch Test

### **Step 11: Test Frontend Build**
```bash
cd "/Users/pinaz.patel/solar roof/frontend"
npm run build
```

- [ ] Build completes successfully
- [ ] `build/` directory created
- [ ] No TypeScript or ESLint errors

### **Step 12: Test Development Server**
```bash
BROWSER=none npm start &
FRONTEND_PID=$!
sleep 10
```

- [ ] Dev server starts on port 3000
- [ ] See "webpack compiled successfully"
- [ ] No critical warnings

### **Step 13: Test Frontend Access**
```bash
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK
```

- [ ] Frontend accessible
- [ ] Returns 200 status

### **Step 14: Stop Test Frontend**
```bash
kill $FRONTEND_PID
```
- [ ] Frontend stops cleanly

---

## 🌐 Browser Verification

### **Step 15: Check Browser Capabilities**
Open Chrome and navigate to:
```
chrome://gpu
```

**Verify:**
- [ ] WebGL: Hardware accelerated
- [ ] WebGL2: Supported
- [ ] Canvas: Hardware accelerated

### **Step 16: Test WebGL Support**
Open browser console and run:
```javascript
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
console.log('WebGL supported:', !!gl);
```

- [ ] Returns "WebGL supported: true"

---

## 🎯 Full Integration Test

### **Step 17: Launch Both Servers**
```bash
cd "/Users/pinaz.patel/solar roof"
./start.sh
# Or on Windows: start.bat
```

- [ ] Backend starts on port 5001
- [ ] Frontend starts on port 3000
- [ ] Browser opens automatically
- [ ] No errors in startup script

### **Step 18: Visual Verification**
In the browser at http://localhost:3000:

**Loading Phase (0-5 seconds):**
- [ ] See "Loading Solar Data..." spinner
- [ ] Progress bar animates smoothly
- [ ] No console errors

**3D Scene Phase (5-10 seconds):**
- [ ] 3D scene loads with gradient background
- [ ] See "Rendering 3D city..." progress
- [ ] Camera animates smoothly to frame buildings

**Interactive Phase (10+ seconds):**
- [ ] 100 buildings visible and colored by score
- [ ] Buildings cast shadows on ground
- [ ] Atmospheric particles floating
- [ ] Ground grid visible

### **Step 19: Interaction Testing**

**Mouse Controls:**
- [ ] Left-click + drag rotates view smoothly
- [ ] Scroll wheel zooms in/out
- [ ] Right-click + drag pans view
- [ ] Hover over building shows tooltip
- [ ] Click building opens analysis panel

**Search Functionality:**
- [ ] Search bar accepts input
- [ ] Typing shows dropdown results
- [ ] Clicking result selects building
- [ ] Selected building highlights in 3D

**Analysis Panel:**
- [ ] Shows building address
- [ ] Displays solar score with color
- [ ] Shows metrics (kWh, payback, CO₂)
- [ ] Monthly production chart renders
- [ ] Environmental impact calculated
- [ ] Close button works

### **Step 20: Performance Testing**
Open DevTools (F12) → Performance tab:

- [ ] FPS: 55-60 (smooth animations)
- [ ] Memory: Stable (~150-250 MB)
- [ ] CPU: Reasonable (20-40%)
- [ ] No memory leaks after 5 minutes

---

## 🔍 Debug Mode Verification

### **Step 21: Enable Debug Mode**
Click "🔍 Show Debug" button in bottom-right:

- [ ] Red/Green/Blue axes appear at center
- [ ] Grid appears on ground
- [ ] Console shows building dimensions
- [ ] No errors in console

### **Step 22: Console Verification**
Check browser console for these logs:

- [ ] "🎨 Initializing enhanced 3D scene..."
- [ ] "✅ 3D scene initialized successfully"
- [ ] "🏢 Creating enhanced 3D buildings... 100"
- [ ] "✅ Created 100 buildings"
- [ ] "📷 Camera positioned: ..."
- [ ] No red error messages

---

## ✅ Final Checklist

### **Core Functionality**
- [ ] Backend API responding
- [ ] Frontend loads without errors
- [ ] 3D scene renders correctly
- [ ] All 100 buildings visible
- [ ] Buildings properly colored
- [ ] Camera positioned correctly
- [ ] Shadows rendering
- [ ] Particles animating

### **User Interactions**
- [ ] Mouse controls working
- [ ] Hover tooltips showing
- [ ] Building selection working
- [ ] Analysis panel opening/closing
- [ ] Search functionality working
- [ ] Smooth 60 FPS performance

### **Visual Quality**
- [ ] Glassmorphic UI elements
- [ ] Premium materials on buildings
- [ ] Gradient sky background
- [ ] Atmospheric depth effects
- [ ] Smooth animations
- [ ] Professional appearance

### **Documentation**
- [ ] README.md reviewed
- [ ] 3D_FIXES_GUIDE.md available
- [ ] QUICK_TEST.md available
- [ ] FEATURES_AND_SHORTCUTS.md available
- [ ] All docs up to date

---

## 🎉 Ready for Launch!

If all checkboxes are checked, you're ready to use Project SolisCAN!

### **Recommended First Steps:**

1. **Explore the 3D Scene**
   - Rotate, zoom, and pan to familiarize yourself
   - Hover over different buildings to compare scores
   - Use debug mode to understand the coordinate system

2. **Test Search**
   - Try searching for "rue", "avenue", or specific addresses
   - Click results to see selection in 3D
   - Notice how camera focuses on selected building

3. **Analyze Buildings**
   - Click several buildings to compare their metrics
   - Review the monthly production charts
   - Check environmental impact calculations

4. **Performance Check**
   - Monitor FPS in DevTools
   - Test on different browsers
   - Try on different devices if available

---

## 🐛 If Something Fails

### **Backend Issues**
1. Check `logs/backend.log` for errors
2. Verify Python dependencies installed
3. Check if port 5001 is available
4. Ensure data files exist and are valid

### **Frontend Issues**
1. Check `logs/frontend.log` for errors
2. Clear browser cache and reload
3. Check console for JavaScript errors
4. Verify Node dependencies installed

### **3D Scene Issues**
1. Enable debug mode to see coordinate system
2. Check console for WebGL errors
3. Update graphics drivers
4. Try a different browser

### **Performance Issues**
1. Close other browser tabs
2. Reduce visual quality (see FEATURES_AND_SHORTCUTS.md)
3. Check GPU utilization in system monitor
4. Try lowering particle count

---

## 📞 Support Resources

- **Quick Test Guide**: `QUICK_TEST.md`
- **Technical Details**: `3D_FIXES_GUIDE.md`
- **Feature Documentation**: `FEATURES_AND_SHORTCUTS.md`
- **Implementation Details**: `IMPLEMENTATION_GUIDE.md`

---

**✈️ Pre-Flight Complete!**  
*You're cleared for takeoff. Enjoy Project SolisCAN!* 🚀

*Last Updated: September 30, 2025*
