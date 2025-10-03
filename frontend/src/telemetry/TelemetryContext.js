/**
 * TelemetryContext - React Context for telemetry SDK
 * 
 * Provides SDK instance and session token to all components
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import TelemetrySDK from './TelemetrySDK';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children, config = {} }) => {
  const [sessionToken, setSessionToken] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const sdkRef = useRef(null);

  useEffect(() => {
    // Initialize SDK once on mount
    const sdk = new TelemetrySDK({
      apiUrl: config.apiUrl || 'http://localhost:8080',
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000,
      debug: config.debug || false,
    });

    // Initialize and get session token
    const token = sdk.initialize();
    setSessionToken(token);
    setIsReady(true);
    sdkRef.current = sdk;

    console.log('[TelemetryProvider] SDK initialized with session:', token);

    // Cleanup on unmount
    return () => {
      if (sdkRef.current) {
        sdkRef.current.shutdown();
      }
    };
  }, []); // Empty dependency array = run once

  const value = {
    sdk: sdkRef.current,
    sessionToken,
    isReady,
    getSessionToken: () => sessionToken,
  };

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
};

/**
 * Hook to access telemetry context
 */
export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  
  return context;
};

export default TelemetryContext;
