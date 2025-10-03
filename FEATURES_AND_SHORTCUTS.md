# ⚡ Keyboard Shortcuts & Enhanced Features

## 🎹 Keyboard Shortcuts (Coming Soon)

These keyboard shortcuts will enhance navigation and control:

### **Navigation**
- `Esc` - Close analysis panel
- `F` - Toggle fullscreen mode
- `D` - Toggle debug mode
- `L` - Toggle labels
- `Space` - Toggle auto-rotate

### **Camera Controls**
- `R` - Reset camera to default view
- `1-5` - Jump to preset camera angles
- `+/-` - Zoom in/out
- `Arrow Keys` - Pan camera

### **Selection**
- `Tab` - Next building
- `Shift + Tab` - Previous building
- `Enter` - Select focused building
- `/` - Focus search bar

### **View Options**
- `T` - Cycle through time of day
- `W` - Toggle weather effects
- `G` - Toggle ground grid
- `S` - Take screenshot

## 🎮 Mouse/Touch Controls

### **Desktop (Mouse)**
- **Left Click** - Select building
- **Left Click + Drag** - Rotate view
- **Right Click + Drag** - Pan view
- **Scroll Wheel** - Zoom in/out
- **Hover** - Show building tooltip
- **Double Click** - Focus on building

### **Touch (Mobile/Tablet)**
- **Single Tap** - Select building
- **One Finger Drag** - Rotate view
- **Two Finger Drag** - Pan view
- **Pinch** - Zoom in/out
- **Long Press** - Show detailed info
- **Double Tap** - Focus on building

## 🎨 Visual Enhancements

### **Glassmorphic Design**
All UI elements now feature:
- Frosted glass effect with backdrop blur
- Semi-transparent backgrounds
- Layered depth with shadows
- Smooth transitions and animations
- Premium color gradients

### **3D Scene Effects**
- **Atmospheric Particles**: 400 floating points for depth
- **Dynamic Shadows**: Real-time shadow casting
- **Gradient Sky**: Beautiful blue-to-white gradient
- **Ground Reflections**: Subtle reflectivity
- **Fog Distance**: Atmospheric depth cueing

### **Building Materials**
- **Window Textures**: Procedurally generated with random lighting
- **Solar Panel Roofs**: High-scoring buildings show blue panels
- **Score-Based Colors**: Green (excellent) to red (poor)
- **Emissive Glow**: Subtle nighttime illumination
- **Hover Effects**: 2-unit elevation with smooth easing

### **Animation System**
- **Camera Transitions**: 1.5s ease-out cubic
- **Building Selection**: Scale to 1.05x with pulse
- **Hover States**: Smooth elevation and color shifts
- **Loading Progress**: Animated gradient bar
- **Particle System**: Continuous upward motion

## 🔧 Advanced Features

### **Debug Mode**
Toggle with the debug button to see:
- **Axes Helper**: RGB arrows showing coordinate system
  - Red = X axis (East-West)
  - Green = Y axis (Vertical)
  - Blue = Z axis (North-South)
- **Grid Helper**: Ground reference grid (50x50 units)
- **Console Logs**: Detailed position and dimension data
- **Performance Stats**: FPS counter and memory usage

### **Performance Optimization**
The app automatically optimizes based on device:
- **High-End Devices**: Full quality (2x pixel ratio, shadows, particles)
- **Mid-Range Devices**: Balanced (1.5x pixel ratio, reduced particles)
- **Low-End Devices**: Performance mode (1x pixel ratio, minimal effects)
- **Mobile Devices**: Touch-optimized with reduced particle count

### **Responsive Design**
Adapts to screen size:
- **Desktop (>1024px)**: Full sidebar, all features visible
- **Tablet (768-1024px)**: Modified layout, compact controls
- **Mobile (<768px)**: Bottom sheet panel, simplified UI
- **Print**: Simplified view for documentation

## 🎯 Tips & Tricks

### **Better Navigation**
1. **Use Debug Mode** when first loading to understand the scene
2. **Reset Camera** if you get lost (click debug button twice)
3. **Hover First** before clicking to preview building info
4. **Use Search** for specific addresses instead of browsing

### **Visual Optimization**
1. **Disable Shadows** on older devices (edit Map3D.js)
2. **Reduce Particles** for better FPS (edit Map3D.js, line ~85)
3. **Lower Pixel Ratio** if screen looks blurry (edit Map3D.js, line ~61)
4. **Use Chrome** for best WebGL performance

### **Data Analysis**
1. **Compare Buildings** by clicking different ones
2. **Check Monthly Data** in the production chart
3. **Review Factors** to understand score calculations
4. **Use Search** to find high-scoring buildings quickly

### **Sharing Results**
1. **Take Screenshots** using browser tools (Cmd/Ctrl + Shift + 4)
2. **Share Links** by copying URL (coming soon: deep linking)
3. **Export Data** (coming soon: PDF reports)
4. **Bookmark Buildings** (coming soon: favorites system)

## 🚀 Coming Soon

### **Phase 1: Enhanced Interaction**
- [ ] Keyboard shortcuts implementation
- [ ] Building comparison mode
- [ ] Favorites/bookmark system
- [ ] Deep linking to specific buildings
- [ ] Screenshot capture button

### **Phase 2: Advanced Visualization**
- [ ] Time-of-day sun simulation
- [ ] Shadow analysis overlay
- [ ] Heat map mode
- [ ] Building labels/names
- [ ] Camera preset positions

### **Phase 3: Data Features**
- [ ] PDF report export
- [ ] CSV data download
- [ ] Historical data charts
- [ ] Weather overlay
- [ ] Cost calculator

### **Phase 4: Multi-User**
- [ ] User accounts
- [ ] Saved analyses
- [ ] Shared comparisons
- [ ] Comments/notes
- [ ] Team collaboration

## 💡 Performance Tips

### **If FPS is Low (<30):**
```javascript
// In Map3D.js, reduce visual quality:

// Line ~85 - Reduce particles
const particles = createAtmosphericParticles(100); // Was 400

// Line ~61 - Lower pixel ratio
renderer.setPixelRatio(1); // Was Math.min(devicePixelRatio, 2)

// Line ~59 - Disable shadows
renderer.shadowMap.enabled = false;
```

### **If Scene Appears Blurry:**
```javascript
// In Map3D.js, increase pixel ratio:

// Line ~61
renderer.setPixelRatio(window.devicePixelRatio); // Remove cap
```

### **If Buildings Too Small/Large:**
```javascript
// In Map3D.js, adjust scale:

// Line ~163 - Modify multiplier
const scale = metersPerDegree * Math.cos(...) * 1.5; // Increase for larger
```

## 🐛 Troubleshooting

### **Buildings Not Appearing**
1. Check browser console for errors
2. Enable debug mode to see coordinate system
3. Verify backend API is running (http://localhost:5001/api/health)
4. Check if buildings.geojson exists in data folder

### **Performance Issues**
1. Close other browser tabs
2. Update graphics drivers
3. Try Chrome (best WebGL support)
4. Reduce visual quality (see tips above)
5. Check if hardware acceleration is enabled

### **Interaction Not Working**
1. Ensure mouse is over the 3D canvas
2. Check if analysis panel is covering the canvas
3. Try closing and reopening the panel
4. Refresh the page

### **Visual Glitches**
1. Clear browser cache
2. Disable browser extensions
3. Check for GPU driver updates
4. Try incognito/private mode

## 📞 Getting Help

### **Quick Checks**
- [ ] Backend server running on port 5001?
- [ ] Frontend server running on port 3000?
- [ ] Browser console showing any errors?
- [ ] Graphics drivers up to date?
- [ ] Using Chrome/Firefox/Safari?

### **Useful Console Commands**
```javascript
// Check if scene has buildings
scene.children.length; // Should be > 100

// Check camera position
camera.position;

// Check building count
buildingsRef.current.length; // Should be 100

// Force camera reset
adjustCameraToFitBuildings();
```

### **Log Files**
- Backend: `logs/backend.log`
- Frontend: `logs/frontend.log`
- Browser Console: F12 → Console tab

## 🎓 Learning Resources

### **Three.js**
- Official Docs: https://threejs.org/docs/
- Examples: https://threejs.org/examples/
- Journey Course: https://threejs-journey.com/

### **WebGL**
- MDN Guide: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
- WebGL Fundamentals: https://webglfundamentals.org/

### **React**
- Official Docs: https://react.dev/
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber/

---

**🌟 Enjoy the enhanced Project SolisCAN experience!**

*Last Updated: September 30, 2025*
