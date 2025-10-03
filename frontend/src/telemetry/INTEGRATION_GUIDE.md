# Telemetry SDK - Integration Guide

## 🎯 Overview

The Telemetry SDK automatically collects behavioral signals and streams them to your DRS server. It's designed to be:
- **Zero friction**: Initialize once and forget
- **Privacy-first**: NO PII capture, only behavioral patterns
- **Lightweight**: Passive listeners with throttling
- **Non-blocking**: Async batched streaming

## 📦 What's Included

```
frontend/src/telemetry/
├── TelemetrySDK.js          # Core SDK engine
├── TelemetryContext.js      # React Context & Provider
└── index.js                 # Clean exports
```

## 🚀 Quick Integration (3 Steps)

### Step 1: Wrap Your App with TelemetryProvider

Open `frontend/src/index.js` and wrap your app:

```javascript
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
        debug: true, // Set to false in production
      }}
    >
      <App />
    </TelemetryProvider>
  </React.StrictMode>
);
```

### Step 2: Access Session Token in Components

Use the `useTelemetry` hook to get the session token:

```javascript
import { useTelemetry } from './telemetry';

function LoginForm() {
  const { sessionToken, isReady } = useTelemetry();

  const handleSubmit = async (credentials) => {
    // Pass session token to your backend
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,  // ← Add this header
      },
      body: JSON.stringify(credentials),
    });

    // Your backend can now call DRS /recommend
  };

  return (
    // Your form JSX
  );
}
```

### Step 3: Backend Integration

In your backend API, extract the session token and call DRS:

```javascript
app.post('/api/login', async (req, res) => {
  const sessionToken = req.headers['x-session-token'];
  const credentials = req.body;

  // 1. Call DRS /recommend
  const drsResponse = await fetch('http://localhost:8080/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionToken,
      action: 'login',
    }),
  });

  const decision = await drsResponse.json();

  // 2. Enforce decision
  if (decision.recommendation === 'DENY') {
    return res.status(403).json({
      error: 'Access denied for security reasons',
      sessionId: decision.sessionId,
    });
  }

  if (decision.recommendation === 'CHALLENGE') {
    return res.json({
      requiresMFA: true,
      sessionId: decision.sessionId,
    });
  }

  // 3. ALLOW - proceed with normal flow
  const user = await authenticateUser(credentials);

  // 4. Report outcome
  await fetch('http://localhost:8080/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: decision.sessionId,
      outcome: user ? 'success' : 'failure',
    }),
  });

  return res.json({ user });
});
```

## 🎛️ Configuration Options

```javascript
<TelemetryProvider
  config={{
    apiUrl: 'http://localhost:8080',  // DRS server URL
    batchSize: 10,                     // Events per batch
    flushInterval: 5000,               // Flush every 5 seconds
    throttleMs: 100,                   // Throttle event capture
    debug: true,                       // Console logging
  }}
>
```

## 📊 What Events Are Captured?

| Event Type | Data Captured | Privacy |
|------------|---------------|---------|
| **mouse** | x, y coordinates | ✅ No PII |
| **scroll** | scroll position, page height | ✅ No PII |
| **keystroke** | timing intervals ONLY | ✅ No key values |
| **focus/blur** | window activity | ✅ No content |
| **device** | fingerprint, user agent, screen res | ✅ Technical only |

### ⚠️ What's NEVER Captured
- Keystroke values (what you type)
- Input field content
- Passwords or sensitive data
- Personal information
- URLs or page content

## 🧪 Testing the Integration

### 1. Start DRS Server

```bash
cd ~/drs-server
npm run dev
```

### 2. Start Your Frontend

```bash
cd "~/solar roof/frontend"
npm start
```

### 3. Check Browser Console

You should see:
```
[TelemetryProvider] SDK initialized with session: 550e8400-e29b-41d4...
[TelemetrySDK] Event queued: device (1/10)
[TelemetrySDK] Event queued: mouse (2/10)
[TelemetrySDK] Flushing 10 events to DRS server
[TelemetrySDK] Successfully sent 10 events
```

### 4. Verify DRS Server Logs

In your DRS server terminal:
```
[info]: Telemetry collected { sessionToken: '550e8400...', eventCount: 10 }
```

### 5. Test Risk Decision

Open browser DevTools > Network, and look for calls to `/collect`.

Then simulate a "gated action" (e.g., search) and check if backend calls `/recommend`.

## 🔧 Advanced Usage

### Manual Flush

```javascript
const { sdk } = useTelemetry();
sdk.flush(); // Force immediate flush
```

### Conditional Initialization

Only enable telemetry on certain pages:

```javascript
function App() {
  const location = useLocation();
  const isRiskRelevantView = ['/login', '/profile', '/transfer'].includes(location.pathname);

  return (
    <>
      {isRiskRelevantView && <TelemetryProvider>...</TelemetryProvider>}
      {!isRiskRelevantView && <>{children}</>}
    </>
  );
}
```

### Custom Events

Add your own custom events:

```javascript
const { sdk } = useTelemetry();

sdk.addEvent({
  type: 'custom',
  timestamp: Date.now(),
  data: { action: 'button_click', element: 'submit' },
});
```

## 🐛 Troubleshooting

### SDK Not Initialized

**Error**: `useTelemetry must be used within a TelemetryProvider`

**Fix**: Make sure `<TelemetryProvider>` wraps your app in `index.js`

### Events Not Sending

**Check**:
1. DRS server is running on port 8080
2. CORS is enabled in DRS server (should be by default)
3. Network tab shows 202 responses from `/collect`
4. Browser console shows no errors

### Session Token Null

**Fix**: Wait for `isReady` before using session token:

```javascript
const { sessionToken, isReady } = useTelemetry();

if (!isReady) {
  return <LoadingSpinner />;
}
```

## 📈 Monitoring

### Check Telemetry Stats

```bash
curl http://localhost:8080/stats
```

Response:
```json
{
  "totalSessions": 5,
  "activeSessions": 3
}
```

### View Session Events

Add to your SDK:

```javascript
console.log('Total events captured:', sdk.eventQueue.length);
```

## 🎯 Best Practices

1. **Enable early**: Initialize TelemetryProvider at the app root
2. **Debug in dev**: Set `debug: true` during development
3. **Disable in test**: Conditionally disable for E2E tests
4. **Monitor performance**: Check flush times in production
5. **Tune thresholds**: Adjust batchSize and flushInterval based on traffic

## 🔐 Security Notes

- Session tokens are opaque UUIDs (not JWTs)
- No localStorage or cookies used
- All data sent over HTTPS (in production)
- DRS server validates all payloads
- Rate limiting prevents abuse

## 📚 API Reference

### TelemetryProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| config.apiUrl | string | 'http://localhost:8080' | DRS server URL |
| config.batchSize | number | 10 | Events per batch |
| config.flushInterval | number | 5000 | Flush interval (ms) |
| config.throttleMs | number | 100 | Event throttle (ms) |
| config.debug | boolean | false | Console logging |

### useTelemetry() Returns

| Property | Type | Description |
|----------|------|-------------|
| sdk | TelemetrySDK | SDK instance |
| sessionToken | string | UUID session token |
| isReady | boolean | SDK initialization state |
| getSessionToken | function | Getter for session token |

## 🚀 Next Steps

1. ✅ SDK created and integrated
2. ⬜ Test end-to-end flow
3. ⬜ Add backend DRS integration
4. ⬜ Monitor events in DRS dashboard
5. ⬜ Tune risk thresholds

---

**You're all set!** The SDK will automatically start collecting telemetry as soon as you wrap your app with `<TelemetryProvider>`.
