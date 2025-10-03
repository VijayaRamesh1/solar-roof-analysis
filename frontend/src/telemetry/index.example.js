/**
 * Modified index.js with Telemetry Integration
 * 
 * Copy this content to replace your current index.js
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { TelemetryProvider } from './telemetry';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <TelemetryProvider
      config={{
        apiUrl: 'http://localhost:8080',
        batchSize: 10,
        flushInterval: 5000,
        throttleMs: 100,
        debug: process.env.NODE_ENV === 'development', // Debug in dev only
      }}
    >
      <App />
    </TelemetryProvider>
  </React.StrictMode>
);
