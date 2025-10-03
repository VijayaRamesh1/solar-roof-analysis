# 🔧 Troubleshooting Guide

## Quick Fixes for Common Issues

### Issue: Buildings Not Visible

**Check:**
1. Open browser console (F12)
2. Look for "Created X buildings" message
3. If X = 0: Backend data issue
4. If X > 0: Rendering issue

**Solution:**
```bash
# Enable debug mode
Click "Show Debug" button in bottom-right

# Check console for positions
buildingsRef.current.map(b => b.position)

# Adjust scale if needed in Map3D.js
const scale = metersPerDegree * Math.cos(...) * 2; // Increase multiplier
```

### Issue: CORS Error

**Error:** Access blocked by CORS policy

**Solution:**
Check `backend/serve_api.py` has:
```python
from flask_cors import CORS
CORS(app)
```

### Issue: Low Performance

**Solutions:**
- Close other browser tabs
- Update graphics drivers
- Reduce particles: `createAtmosphericParticles(100)`
- Disable shadows: `renderer.shadowMap.enabled = false`

---

## Debug Console Commands

```javascript
// Check scene
sceneRef.current.children.length

// Check buildings
buildingsRef.current.length

// Check camera
cameraRef.current.position
```
