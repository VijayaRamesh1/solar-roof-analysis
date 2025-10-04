import React, { useState, useEffect, useRef } from 'react';
import Map3D from './components/Map3D';
import SearchBar from './components/SearchBar';
import AnalysisPanel from './components/AnalysisPanel';
import ThemeToggle from './components/ThemeToggle';
import MapLegend from './components/MapLegend';
import LoadingSpinner from './components/LoadingSpinner';
import { MapPin, Sun, Zap, Sparkles, Home } from 'lucide-react';
import TelemetrySDK from './telemetry/TelemetrySDK.v2';
import './App.css';

// Initialize Telemetry SDK (singleton pattern - only once per app lifetime)
const telemetrySDK = new TelemetrySDK({
  apiUrl: 'http://localhost:8080',
  debug: true, // Set to false in production
  consentRequired: false, // Set to true if GDPR compliance needed
});

function App() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildings, setBuildings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const map3DRef = useRef(null);

  // Initialize Telemetry SDK
  useEffect(() => {
    console.log('[App] Initializing DRS Telemetry SDK...');
    telemetrySDK.initialize();
    console.log('[App] Session Token:', telemetrySDK.getSessionToken());

    // Cleanup on unmount
    return () => {
      console.log('[App] Shutting down Telemetry SDK...');
      telemetrySDK.shutdown();
    };
  }, []);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('solar-roof-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Load building data
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        setLoading(true);
        
        // Get session token for DRS
        const sessionToken = telemetrySDK.getSessionToken();
        
        const response = await fetch('http://localhost:5001/api/buildings', {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken || '', // Attach session token
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to load building data');
        }
        const data = await response.json();
        setBuildings(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error loading buildings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBuildings();
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('solar-roof-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleBuildingSelect = async (building) => {
    setSelectedBuilding(building);
    console.log('Building selected:', building);
    
    // If building has an ID, fetch full details with DRS protection
    if (building?.properties?.id) {
      try {
        const sessionToken = telemetrySDK.getSessionToken();
        
        const response = await fetch(`http://localhost:5001/api/buildings/${building.properties.id}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken || '',
          },
        });

        if (response.status === 403) {
          // DRS blocked the request
          const errorData = await response.json();
          alert(`Access denied: ${errorData.message}`);
          console.error('[DRS] Access denied:', errorData);
          setSelectedBuilding(null);
          return;
        }

        if (response.ok) {
          const detailedBuilding = await response.json();
          setSelectedBuilding(detailedBuilding);
        }
      } catch (err) {
        console.error('Error fetching building details:', err);
      }
    }
  };

  const handleSearchResult = (building) => {
    setSelectedBuilding(building);
    // Trigger fly-to animation via the Map3D ref
    if (map3DRef.current && building.properties?.id) {
      map3DRef.current.flyToBuilding(building.properties.id);
    }
  };

  const handleResetView = () => {
    if (map3DRef.current) {
      map3DRef.current.resetView();
    }
    setSelectedBuilding(null);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container">
          <LoadingSpinner />
          <h2>Loading Solar Data...</h2>
          <p>Preparing stunning 3D visualization and building analysis</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-container">
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>⚠️</div>
          <h2>Unable to Load Data</h2>
          <p>{error}</p>
          <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-2)' }}>
            Make sure the backend server is running on port 5001
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Sun className="logo-icon" />
            <h1>Project SolisCAN</h1>
          </div>
          <div className="header-actions">
            {selectedBuilding && (
              <button 
                onClick={handleResetView}
                className="reset-view-button"
                title="Reset view to show all buildings"
              >
                <Home size={18} />
                Reset View
              </button>
            )}
            <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Search Bar */}
        <div className="search-container">
          <SearchBar onResult={handleSearchResult} />
        </div>

        {/* Map Container */}
        <div className="map-container">
          {buildings && buildings.features ? (
            <Map3D 
              ref={map3DRef}
              buildings={buildings}
              selectedBuilding={selectedBuilding}
              onBuildingSelect={handleBuildingSelect}
            />
          ) : (
            <div className="map-loading">
              <LoadingSpinner />
              <p>Loading building data...</p>
            </div>
          )}
          
          {/* Map Legend */}
          <MapLegend />
        </div>

        {/* Analysis Panel */}
        {selectedBuilding && (
          <AnalysisPanel 
            building={selectedBuilding}
            onClose={() => setSelectedBuilding(null)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>
            <MapPin className="footer-icon" />
            Interactive Solar Potential Analyzer for Canadian Rooftops
          </p>
          <div className="footer-stats">
            <span>
              <Zap className="footer-icon" />
              {buildings?.features?.length || 0} Buildings Analyzed
            </span>
            <span>
              <Sparkles className="footer-icon" />
              Enhanced 3D Visualization with Fly-To
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Export both the component and the SDK instance for use in other components
export default App;
export { telemetrySDK };
