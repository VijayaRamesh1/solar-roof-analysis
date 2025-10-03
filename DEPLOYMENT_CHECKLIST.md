# 🚀 Deployment Checklist - Project SolisCAN

## 📋 Pre-Deployment Verification

### **1. Local Testing** ✅
- [ ] Backend server runs without errors
- [ ] Frontend dev server compiles successfully
- [ ] All 100 buildings are visible in 3D
- [ ] Camera positions correctly on load
- [ ] Hover interactions work smoothly
- [ ] Click selection opens analysis panel
- [ ] Search functionality finds buildings
- [ ] No console errors (check DevTools)
- [ ] 60 FPS performance maintained
- [ ] Memory doesn't leak over 5 minutes
- [ ] Mobile responsive layout works
- [ ] Dark/light theme toggle functions

### **2. Code Quality** ✅
- [ ] No ESLint warnings
- [ ] No TypeScript errors (if applicable)
- [ ] All imports are used
- [ ] No commented-out code blocks
- [ ] Console.logs removed/conditionalized
- [ ] Proper error handling everywhere
- [ ] Loading states for all async operations

### **3. Data Validation** ✅
- [ ] `buildings.geojson` is valid GeoJSON
- [ ] All buildings have required properties:
  - `id`
  - `address`
  - `solar_score`
  - `annual_kwh`
  - `coordinates`
- [ ] No buildings with missing coordinates
- [ ] Solar scores in valid range (0-100)
- [ ] Heights are positive numbers

### **4. Dependencies** ✅
- [ ] `package.json` has all dependencies
- [ ] `requirements.txt` has all Python packages
- [ ] No unused dependencies
- [ ] Versions pinned appropriately
- [ ] Security vulnerabilities checked (`npm audit`)

---

## 🏗️ Build Process

### **Frontend Build**
```bash
cd frontend
npm run build
```

**Verify:**
- [ ] Build completes without errors
- [ ] `build/` directory created
- [ ] Bundle size is reasonable (<2MB)
- [ ] No warnings about large chunks
- [ ] Source maps generated (if enabled)

### **Build Optimization**
```bash
# Check bundle size
npm run build -- --stats

# Analyze bundle
npx webpack-bundle-analyzer build/bundle-stats.json
```

**Optimize if needed:**
- [ ] Code splitting implemented
- [ ] Tree shaking working
- [ ] Images optimized
- [ ] Fonts subset
- [ ] Three.js tree-shaken

---

## 🌐 Production Environment Setup

### **Backend Configuration**
```python
# Update serve_api.py for production:

# 1. Disable debug mode
app.run(debug=False, port=5001)

# 2. Configure CORS for production domain
CORS(app, origins=['https://your-domain.com'])

# 3. Add rate limiting
from flask_limiter import Limiter
limiter = Limiter(app, default_limits=["100 per minute"])

# 4. Add security headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

# 5. Use production WSGI server
# gunicorn serve_api:app --bind 0.0.0.0:5001 --workers 4
```

### **Frontend Configuration**
```javascript
// Update API endpoints in production build
// Create .env.production file:

REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_ENV=production
```

### **Environment Variables**
```bash
# Backend (.env)
FLASK_ENV=production
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=https://your-domain.com

# Frontend (.env.production)
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_MAPBOX_TOKEN=your-token  # if using Mapbox
```

---

## 🔒 Security Checklist

### **Backend Security**
- [ ] CORS restricted to production domain
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (if using DB)
- [ ] XSS protection headers
- [ ] HTTPS enforced
- [ ] API keys not in code
- [ ] Error messages don't leak info
- [ ] File upload validation (if any)

### **Frontend Security**
- [ ] No API keys in client code
- [ ] XSS prevention in user inputs
- [ ] Content Security Policy configured
- [ ] HTTPS only resources
- [ ] Cookies are HttpOnly/Secure (if any)
- [ ] No sensitive data in localStorage
- [ ] Third-party scripts from CDN with integrity checks

### **Infrastructure Security**
- [ ] SSL/TLS certificate installed
- [ ] Firewall rules configured
- [ ] Database credentials secured
- [ ] Server hardened
- [ ] Backups configured
- [ ] Monitoring alerts set up

---

## 🖥️ Server Setup

### **Option 1: Traditional Server (VPS)**

**Requirements:**
- Ubuntu 20.04+ or similar
- 2GB RAM minimum
- 20GB storage
- Python 3.8+
- Node.js 16+

**Setup Steps:**
```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Python
sudo apt install python3 python3-pip python3-venv -y

# 3. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs -y

# 4. Install Nginx
sudo apt install nginx -y

# 5. Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# 6. Clone repository
cd /var/www
git clone https://github.com/yourusername/solar-roof.git
cd solar-roof

# 7. Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# 8. Setup frontend
cd ../frontend
npm install
npm run build

# 9. Configure Nginx (see below)

# 10. Setup SSL
sudo certbot --nginx -d your-domain.com

# 11. Start services
# Backend with gunicorn
gunicorn serve_api:app --bind 127.0.0.1:5001 --workers 4 --daemon

# Frontend served by Nginx (configured below)
```

**Nginx Configuration:**
```nginx
# /etc/nginx/sites-available/solar-roof

upstream backend {
    server 127.0.0.1:5001;
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/solar-roof/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Systemd Service (Backend):**
```ini
# /etc/systemd/system/solar-roof-api.service

[Unit]
Description=Solar Roof API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/solar-roof/backend
Environment="PATH=/var/www/solar-roof/backend/venv/bin"
ExecStart=/var/www/solar-roof/backend/venv/bin/gunicorn serve_api:app --bind 127.0.0.1:5001 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable solar-roof-api
sudo systemctl start solar-roof-api
sudo systemctl status solar-roof-api
```

---

### **Option 2: Docker Deployment**

**Dockerfile (Backend):**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY backend/ .
COPY data/ ./data/

EXPOSE 5001

CMD ["gunicorn", "serve_api:app", "--bind", "0.0.0.0:5001", "--workers", "4"]
```

**Dockerfile (Frontend):**
```dockerfile
FROM node:16 AS build

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "5001:5001"
    environment:
      - FLASK_ENV=production
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped
    volumes:
      - ./ssl:/etc/nginx/ssl
```

**Deploy with Docker:**
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

### **Option 3: Cloud Platforms**

#### **Vercel (Frontend)**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Configure vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-url.com/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}

# 3. Deploy
cd frontend
vercel --prod
```

#### **Heroku (Backend)**
```bash
# 1. Create Procfile
web: gunicorn serve_api:app

# 2. Create runtime.txt
python-3.9.10

# 3. Deploy
heroku create solar-roof-api
git push heroku main
```

#### **AWS (Full Stack)**
- **Frontend:** S3 + CloudFront
- **Backend:** EC2 or Elastic Beanstalk
- **Database:** RDS (if needed)

#### **Google Cloud (Full Stack)**
- **Frontend:** Cloud Storage + Cloud CDN
- **Backend:** Cloud Run or App Engine
- **Database:** Cloud SQL (if needed)

---

## 📊 Monitoring & Analytics

### **Performance Monitoring**
```javascript
// Add to frontend (index.js or App.js)

// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### **Error Tracking**
```javascript
// Sentry integration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### **Analytics**
```javascript
// Google Analytics 4
// Add to public/index.html:
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### **Uptime Monitoring**
- [ ] Set up Uptime Robot or Pingdom
- [ ] Monitor API endpoints
- [ ] Alert on downtime
- [ ] Track response times

---

## 🧪 Post-Deployment Testing

### **Smoke Tests**
- [ ] Homepage loads
- [ ] 3D visualization appears
- [ ] Search works
- [ ] Building selection works
- [ ] Analysis panel displays
- [ ] No 404 errors in console
- [ ] SSL certificate valid
- [ ] Mobile version works

### **Performance Tests**
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 5s
- [ ] Total page size < 3MB
- [ ] API response time < 500ms

### **Browser Testing**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### **Load Testing**
```bash
# Using Apache Bench
ab -n 1000 -c 10 https://your-domain.com/

# Using Artillery
npm install -g artillery
artillery quick --count 10 --num 100 https://your-domain.com/api/buildings
```

---

## 📝 Documentation Updates

### **Update README.md**
- [ ] Add production URL
- [ ] Update setup instructions
- [ ] Add API documentation
- [ ] Include screenshots
- [ ] Add troubleshooting section

### **Create User Guide**
- [ ] How to search for buildings
- [ ] How to interpret solar scores
- [ ] How to read the analysis
- [ ] FAQ section

### **Technical Documentation**
- [ ] API endpoints documented
- [ ] Data schema documented
- [ ] Deployment guide
- [ ] Maintenance procedures

---

## 🔄 Backup & Recovery

### **Data Backup**
```bash
# Automated daily backup
0 2 * * * /usr/bin/tar -czf /backups/solar-roof-$(date +\%Y\%m\%d).tar.gz /var/www/solar-roof/data/
```

### **Database Backup** (if applicable)
```bash
# PostgreSQL example
0 2 * * * /usr/bin/pg_dump dbname > /backups/db-$(date +\%Y\%m\%d).sql
```

### **Recovery Plan**
- [ ] Documented recovery procedures
- [ ] Tested backup restoration
- [ ] Offsite backup storage
- [ ] RTO/RPO defined

---

## ✅ Final Checklist

### **Before Going Live**
- [ ] All tests pass
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Error tracking enabled
- [ ] Analytics installed
- [ ] Documentation complete
- [ ] Stakeholders notified

### **Launch Day**
- [ ] Final smoke test
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Test all critical paths
- [ ] Be ready for hotfixes

### **Post-Launch**
- [ ] Monitor performance 24h
- [ ] Check error rates
- [ ] Review analytics
- [ ] Gather user feedback
- [ ] Plan iterations

---

## 🎉 You're Ready to Deploy!

**Remember:**
- Start with staging environment
- Test thoroughly before production
- Have rollback plan ready
- Monitor closely after launch
- Iterate based on real usage

**Good luck! 🚀**
