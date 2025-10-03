# 🏢 How to Use Real Building Data

You have **3 options** to get real data for your solar visualization:

---

## ⚡ **Option 1: OpenStreetMap (FREE, RECOMMENDED)**

### **What You Get:**
- ✅ Real building footprints from OpenStreetMap
- ✅ Actual coordinates for Montreal buildings
- ✅ Some real addresses (where available in OSM)
- ✅ 50-200 buildings depending on area

### **How to Use:**

1. **Install required library:**
```bash
cd "solar roof/backend"
pip install requests
```

2. **Run the fetch script:**
```bash
python fetch_real_data.py
```

3. **Select area size:**
   - Option 1: Small (50-100 buildings) - Fast
   - Option 2: Medium (100-200 buildings) - **RECOMMENDED**
   - Option 3: Large (200+ buildings) - Slow

4. **Wait for download** (30-60 seconds)

5. **Restart backend:**
```bash
python serve_api.py
```

6. **Refresh your browser!** 🎉

### **Note:**
- Addresses will be partially real (some from OSM, others generated)
- Building heights estimated from OSM data
- Solar scores calculated based on actual roof sizes

---

## 🗺️ **Option 2: Google Solar API (MOST ACCURATE)**

### **What You Get:**
- ✅ Google's actual solar data
- ✅ Real addresses with geocoding
- ✅ Accurate solar calculations
- ❌ Requires Google Cloud API key ($$$)

### **How to Use:**

1. **Get API Key:**
   - Go to: https://console.cloud.google.com
   - Enable "Solar API"
   - Create API key

2. **Create config file:**
```bash
cd "solar roof/backend"
nano config.py
```

Add:
```python
GOOGLE_SOLAR_API_KEY = "your-api-key-here"
```

3. **I'll create a script for you** - Just say "create Google Solar API script"

---

## 🎲 **Option 3: Better Sample Data (QUICK FIX)**

### **What You Get:**
- ✅ More realistic addresses
- ✅ Better variety of buildings
- ✅ Instant setup
- ❌ Still fake data

### **How to Use:**

I can generate better sample data with:
- Real Montreal street names
- Varied building types
- More realistic solar scores
- Better distribution

**Just say:** "generate better sample data"

---

## 📊 **Comparison:**

| Feature | OSM (Free) | Google API | Better Sample |
|---------|-----------|------------|---------------|
| Real Footprints | ✅ | ✅ | ❌ |
| Real Addresses | Partial | ✅ | Better names |
| Accurate Solar | ❌ | ✅ | ❌ |
| Cost | FREE | $$$ | FREE |
| Setup Time | 2 min | 15 min | 30 sec |
| **Recommended** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🚀 **Recommended: Start with OpenStreetMap**

For most users, **Option 1 (OpenStreetMap)** is perfect because:
- ✅ FREE
- ✅ Real building footprints
- ✅ Quick setup
- ✅ Good enough for demos/presentations

You can always upgrade to Google Solar API later if you need exact solar data.

---

## 💡 **Quick Start Command:**

```bash
cd "solar roof/backend"
pip install requests
python fetch_real_data.py
```

Choose option 2 (Medium area), wait 30 seconds, restart backend, refresh browser! 🎉

---

## ❓ **Need Help?**

Just tell me:
- "fetch osm data" - I'll walk you through Option 1
- "use google api" - I'll help set up Option 2  
- "better sample data" - I'll generate Option 3

**Which option do you want to try?** 🎯
