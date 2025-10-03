/**
 * Example: Using Telemetry in Components
 * 
 * This shows how to access the session token and use it in your components
 */

import React, { useState } from 'react';
import { useTelemetry } from '../telemetry';

/**
 * Example 1: Simple component that displays session info
 */
export function TelemetryStatus() {
  const { sessionToken, isReady } = useTelemetry();

  if (!isReady) {
    return <div>Initializing telemetry...</div>;
  }

  return (
    <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
      <h4>Telemetry Status</h4>
      <p>Session Token: <code>{sessionToken}</code></p>
      <p>Status: <span style={{ color: 'green' }}>✓ Active</span></p>
    </div>
  );
}

/**
 * Example 2: Search component with DRS integration
 */
export function SearchWithTelemetry({ onSearch }) {
  const { sessionToken } = useTelemetry();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    try {
      // Call your backend with session token
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken, // ← Pass session token
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      // Backend should:
      // 1. Call DRS /recommend
      // 2. Enforce decision (ALLOW/CHALLENGE/DENY)
      // 3. Return results or challenge

      if (data.requiresChallenge) {
        alert('Additional verification required');
      } else {
        onSearch(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}

/**
 * Example 3: Login form with DRS risk assessment
 */
export function LoginFormWithTelemetry() {
  const { sessionToken } = useTelemetry();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requiresMFA, setRequiresMFA] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken, // ← Session token for DRS
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.status === 403) {
        // DENY - Access blocked
        setError('Access denied for security reasons');
      } else if (data.requiresMFA) {
        // CHALLENGE - Trigger MFA
        setRequiresMFA(true);
      } else {
        // ALLOW - Success
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (requiresMFA) {
    return (
      <div>
        <h3>Additional Verification Required</h3>
        <p>Please enter the code sent to your device</p>
        {/* MFA component here */}
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <input
        type="text"
        placeholder="Username"
        value={credentials.username}
        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
        disabled={loading}
      />
      
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        disabled={loading}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

/**
 * Example 4: Manual event tracking
 */
export function CustomEventExample() {
  const { sdk } = useTelemetry();

  const handleImportantAction = () => {
    // Manually add a custom event
    if (sdk) {
      sdk.addEvent({
        type: 'custom',
        timestamp: Date.now(),
        data: {
          action: 'important_button_clicked',
          context: 'dashboard',
        },
      });
    }

    // Your action logic
    console.log('Important action executed');
  };

  return (
    <button onClick={handleImportantAction}>
      Perform Important Action
    </button>
  );
}

/**
 * Example 5: Conditional telemetry (only on sensitive pages)
 */
export function ConditionalTelemetryWrapper({ children, requiresTelemetry = true }) {
  const { isReady } = useTelemetry();

  // Wait for telemetry to be ready before showing sensitive content
  if (requiresTelemetry && !isReady) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
