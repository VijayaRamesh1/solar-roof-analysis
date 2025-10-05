# 🏗️ System Architecture Diagrams

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                       │
│                                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐ │
│  │   React Frontend    │    │   Telemetry SDK     │    │   DRS Dashboard     │ │
│  │   (Port 3000)       │    │   (Integrated)      │    │   (Port 8080)       │ │
│  │                     │    │                     │    │                     │ │
│  │ • Map3D.js          │    │ • TelemetrySDK.js   │    │ • telemetry-        │ │
│  │ • AnalysisPanel.js  │    │ • TelemetryContext  │    │   dashboard.html    │ │
│  │ • SearchBar.js      │    │ • Event Collection  │    │ • Real-time         │ │
│  │ • Three.js Scene    │    │ • Session Management│    │   Analytics         │ │
│  └─────────────────────┘    └─────────────────────┘    └─────────────────────┘ │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      │ HTTP/REST API + WebSocket
                      │ X-Session-Token Headers
                      │
┌─────────────────────▼───────────────────────────────────────────────────────────┐
│                              API LAYER                                         │
│                                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐ │
│  │   Flask Backend     │    │   DRS Middleware    │    │   DRS Server        │ │
│  │   (Port 5001)       │    │   (Integrated)      │    │   (Port 8080)       │ │
│  │                     │    │                     │    │                     │ │
│  │ • serve_api.py      │    │ • drs_middleware.py │    │ • /collect          │ │
│  │ • Building Data     │    │ • Risk Assessment   │    │ • /recommend        │ │
│  │ • Solar Analysis    │    │ • Decision Engine   │    │ • /report           │ │
│  │ • Search Engine     │    │ • Outcome Reporting │    │ • Session Storage   │ │
│  └─────────────────────┘    └─────────────────────┘    └─────────────────────┘ │
└─────────────────────┬───────────────────────────────────────────────────────────┘
                      │
                      │ Data Access & File I/O
                      │
┌─────────────────────▼───────────────────────────────────────────────────────────┐
│                              DATA LAYER                                        │
│                                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐ │
│  │   Building Data     │    │   Session Storage   │    │   Telemetry Events  │ │
│  │                     │    │                     │    │                     │ │
│  │ • buildings.geojson │    │ • In-Memory Cache  │    │ • Event Queues      │ │
│  │ • address_index.json│    │ • Redis (Future)   │    │ • Batch Processing  │ │
│  │ • metadata.json     │    │ • Session Tokens   │    │ • Event Analytics   │ │
│  │ • 100 Buildings     │    │ • Risk Scores      │    │ • Behavioral Data   │ │
│  └─────────────────────┘    └─────────────────────┘    └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Solar Analysis System Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SOLAR ANALYSIS PIPELINE                                 │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   GeoJSON   │    │   Building  │    │   Solar     │    │   3D        │     │
│  │   Data      │───▶│   Geometry  │───▶│   Analysis  │───▶│   Render    │     │
│  │   Loading   │    │   Processing│    │   Engine    │    │   Engine    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │                   │         │
│         ▼                   ▼                   ▼                   ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Building  │    │   Coordinate │    │   Roof Area │    │   Material  │     │
│  │   Features  │    │   Transform  │    │   Calc      │    │   System    │     │
│  │   (100)     │    │   (Lat/Lng)  │    │   (m²)      │    │   (Colors)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Address   │    │   Azimuth   │    │   Shading   │    │   Economic  │     │
│  │   Index     │    │   Analysis  │    │   Factors   │    │   Analysis  │     │
│  │   (Search)  │    │   (180°)    │    │   (%)       │    │   (ROI)     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Telemetry & DRS Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        TELEMETRY & DRS PIPELINE                               │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   User      │    │   Telemetry │    │   DRS       │    │   Risk      │     │
│  │   Action    │───▶│   Capture   │───▶│   Server    │───▶│   Decision  │     │
│  │   (Click)   │    │   (SDK)     │    │   (Port     │    │   Engine    │     │
│  └─────────────┘    └─────────────┘    │   8080)     │    └─────────────┘     │
│         │                   │           └─────────────┘             │         │
│         ▼                   ▼                   │                   ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Session   │    │   Event     │    │   Telemetry │    │   ALLOW/    │     │
│  │   Token     │    │   Queue     │    │   Analysis  │    │   CHALLENGE │     │
│  │   (UUID)    │    │   (Batch)   │    │   (ML)      │    │   /DENY     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Backend   │    │   DRS       │    │   Outcome   │    │   Action    │     │
│  │   Middleware│    │   /recommend│    │   Reporting │    │   Execution │     │
│  │   (Flask)   │    │   (API)     │    │   /report   │    │   (Result)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW PIPELINE                               │
│                                                                                 │
│  Frontend (React)                    Backend (Flask)                    DRS    │
│  ┌─────────────┐                    ┌─────────────┐                   ┌─────────┐ │
│  │   User      │                    │   API       │                   │   Risk  │ │
│  │   Interface │                    │   Server    │                   │   Engine│ │
│  └─────────────┘                    └─────────────┘                   └─────────┘ │
│         │                                   │                               │     │
│         │ 1. User Action                    │                               │     │
│         ▼                                   │                               │     │
│  ┌─────────────┐                           │                               │     │
│  │ TelemetrySDK│                           │                               │     │
│  │ Collection  │                           │                               │     │
│  └─────────────┘                           │                               │     │
│         │                                   │                               │     │
│         │ 2. Session Token                  │                               │     │
│         ▼                                   │                               │     │
│  ┌─────────────┐                           │                               │     │
│  │   HTTP      │──────────────────────────▶│                               │     │
│  │   Request   │                           │                               │     │
│  └─────────────┘                           │                               │     │
│                                            │ 3. DRS Check                  │     │
│                                            ▼                               │     │
│                                     ┌─────────────┐                       │     │
│                                     │   DRS       │──────────────────────▶│     │
│                                     │ Middleware  │                       │     │
│                                     └─────────────┘                       │     │
│                                            │                               │     │
│                                            │ 4. Risk Decision              │     │
│                                            ◀───────────────────────────────│     │
│                                            │                               │     │
│                                            │ 5. Action Execution           │     │
│                                            ▼                               │     │
│                                     ┌─────────────┐                       │     │
│                                     │   Business  │                       │     │
│                                     │   Logic     │                       │     │
│                                     └─────────────┘                       │     │
│                                            │                               │     │
│                                            │ 6. Response                  │     │
│                                            ▼                               │     │
│  ┌─────────────┐                           │                               │     │
│  │   UI        │◀──────────────────────────│                               │     │
│  │   Update    │                           │                               │     │
│  └─────────────┘                           │                               │     │
│                                            │ 7. Outcome Report             │     │
│                                            └──────────────────────────────▶│     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMPONENT INTERACTIONS                               │
│                                                                                 │
│  App.js (Root)                                                                  │
│  ├── ThemeToggle                                                                │
│  ├── SearchBar ──────────────┐                                                 │
│  │   └── Search Results      │                                                 │
│  │                           │                                                 │
│  ├── Map3D (Main 3D) ───────┼─────────────────────────────────────────────┐   │
│  │   ├── Three.js Scene     │                                                 │   │
│  │   │   ├── Camera         │                                                 │   │
│  │   │   ├── Renderer       │                                                 │   │
│  │   │   ├── Lighting       │                                                 │   │
│  │   │   ├── Sky Sphere     │                                                 │   │
│  │   │   ├── Ground Plane   │                                                 │   │
│  │   │   ├── Particles      │                                                 │   │
│  │   │   └── Building Meshes│                                                 │   │
│  │   ├── OrbitControls      │                                                 │   │
│  │   ├── Raycaster          │                                                 │   │
│  │   ├── Building Tooltip   │                                                 │   │
│  │   └── Control Hints      │                                                 │   │
│  │                           │                                                 │   │
│  ├── AnalysisPanel ─────────┼─────────────────────────────────────────────┐   │   │
│  │   ├── Building Details   │                                                 │   │   │
│  │   ├── Solar Score        │                                                 │   │   │
│  │   ├── Key Metrics        │                                                 │   │   │
│  │   ├── Monthly Chart      │                                                 │   │   │
│  │   ├── Contributing       │                                                 │   │   │
│  │   │   Factors            │                                                 │   │   │
│  │   └── Environmental      │                                                 │   │   │
│  │       Impact             │                                                 │   │   │
│  │                           │                                                 │   │   │
│  └── MapLegend               │                                                 │   │   │
│                              │                                                 │   │   │
│  TelemetryProvider ──────────┼─────────────────────────────────────────────┐   │   │   │
│  ├── TelemetrySDK            │                                                 │   │   │   │
│  │   ├── Event Collection    │                                                 │   │   │   │
│  │   ├── Session Management  │                                                 │   │   │   │
│  │   ├── Device Snapshot     │                                                 │   │   │   │
│  │   └── Batch Streaming     │                                                 │   │   │   │
│  └── TelemetryContext        │                                                 │   │   │   │
│                              │                                                 │   │   │   │
│                              │                                                 │   │   │   │
│  ┌───────────────────────────▼─────────────────────────────────────────────▼───▼───▼───┐ │
│  │                           Backend API (Flask)                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │ │
│  │  │   Building  │  │   Search    │  │   Metadata  │  │   Health    │           │ │
│  │  │   Endpoints │  │   Engine    │  │   Service   │  │   Check     │           │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │ │
│  │                                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    DRS Middleware Integration                          │ │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │ │
│  │  │  │   Session   │  │   Risk      │  │   Decision  │  │   Outcome   │   │ │ │
│  │  │  │   Token     │  │   Assessment│  │   Engine    │  │   Reporting │   │ │ │
│  │  │  │   Handler   │  │   (ML)      │  │   (Rules)   │  │   (Feedback)│   │ │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Security & Privacy Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY & PRIVACY LAYERS                             │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           PRIVACY LAYER                                    │ │
│  │                                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │   Zero PII  │  │   Consent   │  │   Data      │  │   Session   │       │ │
│  │  │   Capture   │  │   Management│  │   Minimization│  │   Rotation │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  │                                                                             │ │
│  │  ✅ Captured: Behavioral patterns, technical characteristics                │ │
│  │  ❌ Never: Personal info, content, passwords, URLs                         │ │
│  │                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           SECURITY LAYER                                   │ │
│  │                                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │   CORS      │  │   Rate      │  │   Input     │  │   Error     │       │ │
│  │  │   Protection│  │   Limiting  │  │   Validation│  │   Handling  │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  │                                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │   HTTPS     │  │   Session   │  │   DRS       │  │   Audit     │       │ │
│  │  │   Encryption│  │   Security  │  │   Integration│  │   Logging   │       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  │                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           INFRASTRUCTURE LAYER                             │ │
│  │                                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │ │
│  │  │   Load      │  │   Auto      │  │   Monitoring│  │   Backup    │       │ │
│  │  │   Balancing │  │   Scaling   │  │   & Alerting│  │   & Recovery│       │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │ │
│  │                                                                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Performance & Scalability Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PERFORMANCE & SCALABILITY                              │
│                                                                                 │
│  Current Scale (100 Buildings)              Future Scale (10,000+ Buildings)   │
│  ┌─────────────────────────────┐            ┌─────────────────────────────────┐ │
│  │   Performance Metrics       │            │   Scaling Architecture          │ │
│  │                             │            │                                 │ │
│  │  • Load Time: ~3s           │            │  ┌─────────────┐               │ │
│  │  • Memory: 150-250MB        │            │  │   LOD       │               │ │
│  │  • FPS: 55-60               │            │  │   System    │               │ │
│  │  • Hover: ~16ms             │            │  └─────────────┘               │ │
│  │  • Click: ~50ms             │            │                                 │ │
│  │  • Search: ~300ms           │            │  ┌─────────────┐               │ │
│  └─────────────────────────────┘            │  │   Chunked   │               │ │
│                                             │  │   Loading   │               │ │
│  Optimization Techniques                     │  └─────────────┘               │ │
│  ┌─────────────────────────────┐            │                                 │ │
│  │  • Frustum Culling          │            │  ┌─────────────┐               │ │
│  │  • Pixel Ratio Capped       │            │  │   Vector    │               │ │
│  │  • Shadow Map: 2048×2048    │            │  │   Tiles     │               │ │
│  │  • PCF Soft Shadows         │            │  └─────────────┘               │ │
│  │  • Damped Controls          │            │                                 │ │
│  │  • Efficient Raycasting     │            │  ┌─────────────┐               │ │
│  │  • Object Pooling           │            │  │   Database  │               │ │
│  └─────────────────────────────┘            │  │   Backend   │               │ │
│                                             │  └─────────────┘               │ │
│                                             │                                 │ │
│                                             │  ┌─────────────┐               │ │
│                                             │  │   Server-   │               │ │
│                                             │  │   Side      │               │ │
│                                             │  │   Rendering │               │ │
│                                             │  └─────────────┘               │ │
│                                             └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT ARCHITECTURE                             │
│                                                                                 │
│  Development Environment                     Production Environment             │
│  ┌─────────────────────────┐                ┌─────────────────────────────────┐ │
│  │  Local Development      │                │  Production Deployment          │ │
│  │                         │                │                                 │ │
│  │  Frontend: localhost:3000│                │  Frontend: Vercel/Netlify      │ │
│  │  Backend: localhost:5001 │                │  • CDN Distribution            │ │
│  │  DRS: localhost:8080     │                │  • Auto-scaling                │ │
│  │                         │                │  • Global Edge Locations       │ │
│  └─────────────────────────┘                │                                 │ │
│                                             │  Backend: Railway/Heroku        │ │
│  Testing Environment                        │  • Auto-deployment             │ │
│  ┌─────────────────────────┐                │  • Load balancing              │ │
│  │  Automated Testing      │                │  • Health monitoring           │ │
│  │                         │                │                                 │ │
│  │  • Unit Tests           │                │  DRS: Dedicated Server          │ │
│  │  • Integration Tests    │                │  • Redis Session Store         │ │
│  │  • E2E Tests            │                │  • Multiple Instances          │ │
│  │  • Performance Tests    │                │  • Session Affinity            │ │
│  └─────────────────────────┘                │                                 │ │
│                                             │  Monitoring: Prometheus +       │ │
│                                             │  Grafana                        │ │
│                                             │  • Metrics Collection           │ │
│                                             │  • Alerting                     │ │
│                                             │  • Dashboards                   │ │
│                                             └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## API Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            API INTEGRATION FLOW                               │
│                                                                                 │
│  Frontend Client                    Backend API                    DRS Server   │
│  ┌─────────────────┐               ┌─────────────────┐            ┌─────────────┐│
│  │   React App     │               │   Flask API     │            │   Risk      ││
│  │                 │               │                 │            │   Engine    ││
│  │ 1. User Action  │               │ 2. Extract      │            │             ││
│  │    (Click       │               │    Session      │            │ 3. Risk     ││
│  │     Building)   │               │    Token        │            │    Assessment││
│  └─────────────────┘               └─────────────────┘            │             ││
│         │                                   │                     │ 4. Decision ││
│         │ HTTP Request                      │                     │    (ALLOW/  ││
│         │ X-Session-Token: abc123           │                     │    CHALLENGE││
│         ▼                                   │                     │    /DENY)   ││
│  ┌─────────────────┐                       │                     └─────────────┘│
│  │   HTTP Client   │──────────────────────▶│                                │   │
│  │   (Fetch)       │                       │                                │   │
│  └─────────────────┘                       │                                │   │
│                                            │ DRS /recommend                 │   │
│                                            ▼                                │   │
│                                     ┌─────────────────┐                     │   │
│                                     │   DRS           │────────────────────▶│   │
│                                     │   Middleware    │                     │   │
│                                     └─────────────────┘                     │   │
│                                            │                                │   │
│                                            │ Risk Decision                  │   │
│                                            ◀────────────────────────────────│   │
│                                            │                                │   │
│                                            │ 5. Execute Action              │   │
│                                            ▼                                │   │
│                                     ┌─────────────────┐                     │   │
│                                     │   Business      │                     │   │
│                                     │   Logic         │                     │   │
│                                     │   (Building     │                     │   │
│                                     │    Analysis)    │                     │   │
│                                     └─────────────────┘                     │   │
│                                            │                                │   │
│                                            │ 6. Response                    │   │
│                                            ▼                                │   │
│  ┌─────────────────┐                       │                                │   │
│  │   UI Update     │◀──────────────────────│                                │   │
│  │   (Building     │                       │                                │   │
│  │    Details)     │                       │                                │   │
│  └─────────────────┘                       │                                │   │
│                                            │ 7. Outcome Report              │   │
│                                            └────────────────────────────────▶│   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

These diagrams provide a comprehensive visual representation of the Project SolisCAN system architecture, showing the relationships between components, data flows, security layers, and deployment strategies. Each diagram focuses on a specific aspect of the system to provide clarity on how the different parts work together to deliver the complete solar roof analysis and telemetry monitoring solution.
