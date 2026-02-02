# FLOYD Mobile Connectivity Plan
# FLOYD Mobile Connectivity Plan

**Version:** 1.1.0  
**Created:** 2026-02-02  
**Updated:** 2026-02-02 (CLI browser control added)  
**Status:** PLAN MODE - Read-Only Analysis  
**Author:** Claude Opus 4.5

---

## Executive Summary

This plan details three connectivity scenarios for the FLOYD mobile ecosystem:

| Scenario | Source | Target | Protocol | Status |
|----------|--------|--------|----------|--------|
| 1 | Mobile App | CLI | WebSocket Bridge | **PARTIAL** (bridge exists, mobile skeleton) |
| 2 | Mobile App | CLI → Browser | ChromeBridge relay | **EXISTS** (ChromeBridge implemented) |
| 3 | Mobile App | iPhone (remote) | NGROK Tunnel + QR | **NOT IMPLEMENTED** |

### CORRECTED: CLI Browser Control

The CLI can **already** control the browser via `ChromeBridge`:

```
┌─────────────┐      WebSocket       ┌─────────────┐      WebSocket       ┌─────────────┐
│   Mobile    │◄────────────────────►│    CLI      │◄────────────────────►│   Chrome    │
│    App      │    (Bridge Server)   │  (Floyd)    │    (ChromeBridge)    │  Extension  │
└─────────────┘      :3000           └─────────────┘     :3000-3009        └─────────────┘
                                            │                                     │
                                            │         MCP Protocol                │
                                            └─────────────────────────────────────┘
                                                   browser_navigate
                                                   browser_read_page
                                                   browser_screenshot
                                                   browser_click, etc.
```

**Key Insight:** Mobile controls browser THROUGH the CLI, not directly.

---

## Existing Infrastructure Analysis

### What Already Exists
    "express": "^5.2.1"            // ✅ Installed
  }
}
```

---

## SCENARIO 1: Mobile App ↔ CLI via Bridge

### Architecture

```
┌─────────────────────┐         WebSocket         ┌─────────────────────┐
│   FLOYD Mobile App  │◄──────────────────────────►│    Floyd CLI        │
│   (React Native)    │     ws://localhost:3000    │    (floyd --bridge) │
│                     │                            │                     │
│  ┌───────────────┐  │                            │  ┌───────────────┐  │
│  │ WebSocket     │  │    JSON-RPC 2.0 over WS    │  │ Bridge Server │  │
│  │ Client        │──┼───────────────────────────►│──│ (Express+WS)  │  │
│  └───────────────┘  │                            │  └───────────────┘  │
│                     │                            │         │           │
│  ┌───────────────┐  │                            │         ▼           │
│  │ Chat UI       │  │                            │  ┌───────────────┐  │
│  │ (React)       │  │                            │  │ Execution     │  │
│  └───────────────┘  │                            │  │ Engine        │  │
│                     │                            │  └───────────────┘  │
└─────────────────────┘                            └─────────────────────┘
      iPhone/iPad                                         Mac (localhost)
```

### Implementation Requirements

#### 1. Bridge Server (CLI Side) - PARTIAL EXISTS

**Location:** `/floyd-wrapper-main/src/bridge/server.ts`

**Current State:** Stub implementation exists  
**Required Changes:**

```typescript
// Required API Contract
interface BridgeMessage {
  jsonrpc: '2.0';
  id: number;
  method: 'chat' | 'tools/call' | 'status' | 'history';
  params: {
    message?: string;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    sessionId?: string;
  };
}

interface BridgeResponse {
  jsonrpc: '2.0';
  id: number;
  result?: {
    content?: string;
    toolResult?: unknown;
    status?: string;
    history?: Message[];
  };
  error?: {
    code: number;
    message: string;
  };
}
```

**Endpoints Required:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `ws://localhost:3000/agent` | WebSocket | Bi-directional chat |
| `POST /api/chat` | HTTP | Single request/response |
| `GET /api/status` | HTTP | Health check |
| `GET /api/sessions` | HTTP | List sessions |
| `POST /api/session/:id/resume` | HTTP | Resume session |

#### 2. Mobile App (React Native) - SKELETON EXISTS

**Location:** `/mobile/FloydMobile/`

**Required Implementation:**

```
mobile/FloydMobile/
├── src/
│   ├── App.tsx                    # Root app
│   ├── screens/
│   │   ├── ChatScreen.tsx         # Main chat UI
│   │   ├── SettingsScreen.tsx     # Config/provider selection
│   │   └── SessionsScreen.tsx     # Session history
│   ├── components/
│   │   ├── MessageBubble.tsx      # Chat message display
│   │   ├── InputArea.tsx          # Text input + send
│   │   ├── ToolStatus.tsx         # Inline tool status
│   │   └── ConnectionStatus.tsx   # Bridge connection indicator
│   ├── services/
│   │   ├── bridge-client.ts       # WebSocket client
│   │   ├── session-storage.ts     # Local persistence
│   │   └── notification-service.ts # Push notifications
│   └── hooks/
│       ├── useBridge.ts           # Bridge connection hook
│       └── useChat.ts             # Chat state management
├── package.json
└── app.json
```

### Verification Receipt Template

```markdown
## SCENARIO 1 VERIFICATION RECEIPT

### Test: Mobile ↔ CLI Bridge Connection

**Date:** YYYY-MM-DD HH:MM:SS TZ
**Tester:** [Agent/Human]

#### Prerequisites
- [ ] Floyd CLI running with `--bridge` flag
- [ ] Mobile app installed on device
- [ ] Same local network

#### Test Steps
1. [ ] Start CLI: `floyd --bridge`
2. [ ] Verify bridge listening: `curl http://localhost:3000/api/status`
3. [ ] Open mobile app
4. [ ] Verify connection indicator turns green
5. [ ] Send test message: "Hello from mobile"
6. [ ] Verify response received
7. [ ] Test tool execution: Request file listing
8. [ ] Verify tool result displayed in mobile

#### Expected Results
- Bridge server responds with `{"status": "ok"}`
- WebSocket connection established within 2s
- Messages round-trip in <500ms on localhost
- Tool results display correctly

#### Actual Results
[TO BE FILLED BY TESTER]

#### DIFF (Code Changes Applied)
[GIT DIFF OUTPUT]

#### Sign-Off
- [ ] All tests passed
- [ ] No regressions
- [ ] Ready for next phase
```

---

## SCENARIO 2: Mobile App ↔ Desktop Web via Browser Extension

### Architecture

```
┌─────────────────────┐    NGROK Tunnel      ┌─────────────────────┐
│   FLOYD Mobile App  │◄────────────────────►│  FloydDesktopWeb    │
│   (React Native)    │   wss://xxx.ngrok.io │  (React + Express)  │
│                     │                      │                     │
└─────────────────────┘                      │  ┌───────────────┐  │
         │                                   │  │ WS-MCP Server │  │
         │                                   │  │ (port 3005)   │  │
         │                                   │  └───────┬───────┘  │
         │                                   │          │          │
         │                                   │          ▼          │
         │                                   │  ┌───────────────┐  │
         │      WebSocket (local)            │  │ Chrome        │  │
         └───────────────────────────────────┼──│ Extension     │  │
                                             │  └───────────────┘  │
                                             └─────────────────────┘
                                                    Mac (local)
```

### Implementation Requirements

#### 1. WebSocket MCP Server Enhancement

**Location:** `/INK/floyd-agent-sandbox/FloydDesktopWeb/server/ws-mcp-server.ts`

**Current State:** Basic WebSocket server exists (port 3005)  
**Required Changes:**

```typescript
// Add mobile client authentication
interface MobileClientAuth {
  clientId: string;
  sessionToken: string;
  deviceType: 'ios' | 'android';
  appVersion: string;
}

// Add mobile-specific message types
type MobileMessage = 
  | { type: 'connect'; auth: MobileClientAuth }
  | { type: 'chat'; content: string; sessionId?: string }
  | { type: 'subscribe'; events: ('tool' | 'message' | 'status')[] }
  | { type: 'getHistory'; sessionId: string; limit: number };
```

#### 2. Chrome Extension Bridge

**Location:** `/FloydChromeBuild/floydchrome/src/`

**Required Enhancement:**

```typescript
// Add mobile relay capability
class MobileRelay {
  private desktopWs: WebSocket;      // Connection to FloydDesktopWeb
  private mobileClients: Map<string, WebSocket>;
  
  async relayToDesktop(message: MobileMessage): Promise<void> {
    // Forward mobile requests to desktop web app
  }
  
  async relayToMobile(clientId: string, response: DesktopResponse): Promise<void> {
    // Forward desktop responses back to mobile
  }
}
```

### Connection Flow

```
1. Mobile App starts
   │
   ▼
2. Mobile connects to NGROK tunnel URL
   │   wss://abc123.ngrok.io/mobile
   │
   ▼
3. Request routed to FloydDesktopWeb
   │   ws://localhost:3005
   │
   ▼
4. WS-MCP Server authenticates mobile client
   │
   ▼
5. Messages relayed to Chrome Extension
   │   Native Messaging / WebSocket
   │
   ▼
6. Extension executes browser tools
   │
   ▼
7. Results flow back through chain
```

### Verification Receipt Template

```markdown
## SCENARIO 2 VERIFICATION RECEIPT

### Test: Mobile ↔ Desktop Web via Extension

**Date:** YYYY-MM-DD HH:MM:SS TZ

#### Prerequisites
- [ ] FloydDesktopWeb running
- [ ] Chrome extension installed and active
- [ ] Mobile app with NGROK tunnel URL configured

#### Test Steps
1. [ ] Start desktop web: `npm run dev` (FloydDesktopWeb)
2. [ ] Verify WS-MCP server: `wscat -c ws://localhost:3005`
3. [ ] Start NGROK: `ngrok http 3005`
4. [ ] Copy tunnel URL to mobile app settings
5. [ ] Connect from mobile
6. [ ] Verify browser automation:
   - [ ] Request page navigation
   - [ ] Request screenshot
   - [ ] Request element click

#### Expected Results
- WebSocket handshake completes
- Mobile receives browser status
- Tool calls execute in browser
- Screenshots transmit to mobile

#### DIFF
[GIT DIFF OUTPUT]
```

---

## SCENARIO 3: Mobile App ↔ iPhone via NGROK Tunnel + QR Code

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Mac (Development Machine)                  │
│                                                                  │
│  ┌─────────────────┐        ┌─────────────────┐                  │
│  │  Floyd CLI      │        │  NGROK Client   │                  │
│  │  (--bridge)     │───────►│  (tunnel)       │──────┐           │
│  │                 │        │                 │      │           │
│  │  ┌───────────┐  │        │  wss://xxx.ngrok.io    │           │
│  │  │ Bridge    │  │        └─────────────────┘      │           │
│  │  │ Server    │  │                                 │           │
│  │  │ :3000     │  │                                 │           │
│  │  └───────────┘  │                                 │           │
│  │        │        │                                 │           │
│  │        ▼        │                                 │           │
│  │  ┌───────────┐  │        ┌─────────────────┐      │           │
│  │  │ QR Code   │──┼───────►│ Terminal/Web    │      │           │
│  │  │ Generator │  │        │ Display QR      │      │           │
│  │  └───────────┘  │        └─────────────────┘      │           │
│  └─────────────────┘                                 │           │
└──────────────────────────────────────────────────────┼───────────┘
                                                       │
                                                       │ Internet
                                                       │
                                                       ▼
                                          ┌─────────────────────┐
                                          │     iPhone          │
                                          │                     │
                                          │  ┌───────────────┐  │
                                          │  │ FLOYD Mobile  │  │
                                          │  │ App           │  │
                                          │  │               │  │
                                          │  │ Scan QR ──────┼──┼─► Connect
                                          │  └───────────────┘  │
                                          │                     │
                                          └─────────────────────┘
```

### Implementation Requirements

#### 1. NGROK Manager - STUB EXISTS

**Location:** `/floyd-wrapper-main/src/bridge/ngrok-manager.ts`

**Current State:** File exists but minimal implementation

**Required Implementation:**

```typescript
// ngrok-manager.ts - Complete Implementation
import ngrok from '@ngrok/ngrok';
import { EventEmitter } from 'events';

interface NgrokConfig {
  authToken?: string;      // From NGROK_AUTH_TOKEN env
  port: number;            // Local bridge port (3000)
  region?: string;         // 'us', 'eu', 'ap', 'au', 'sa', 'jp', 'in'
  hostname?: string;       // Custom domain (paid plans)
}

interface TunnelInfo {
  url: string;             // wss://xxx.ngrok.io
  publicUrl: string;       // https://xxx.ngrok.io
  localPort: number;
  region: string;
  startedAt: Date;
}

export class NgrokManager extends EventEmitter {
  private tunnel: ngrok.Listener | null = null;
  private config: NgrokConfig;
  
  constructor(config: NgrokConfig) {
    super();
    this.config = config;
  }
  
  async start(): Promise<TunnelInfo> {
    // 1. Create NGROK session
    const session = await ngrok.connect({
      authtoken: this.config.authToken || process.env.NGROK_AUTH_TOKEN,
    });
    
    // 2. Start HTTP tunnel
    this.tunnel = await session.httpEndpoint()
      .listenAndForward(`http://localhost:${this.config.port}`);
    
    const tunnelUrl = this.tunnel.url();
    
    // 3. Emit ready event
    const info: TunnelInfo = {
      url: tunnelUrl!.replace('https://', 'wss://'),
      publicUrl: tunnelUrl!,
      localPort: this.config.port,
      region: this.config.region || 'us',
      startedAt: new Date(),
    };
    
    this.emit('ready', info);
    
    // 4. Handle tunnel events
    this.tunnel.on('close', () => this.emit('close'));
    
    return info;
  }
  
  async stop(): Promise<void> {
    if (this.tunnel) {
      await this.tunnel.close();
      this.tunnel = null;
      this.emit('stopped');
    }
  }
  
  getUrl(): string | null {
    return this.tunnel?.url() || null;
  }
}
```

#### 2. QR Code Generator - STUB EXISTS

**Location:** `/floyd-wrapper-main/src/bridge/qr-generator.ts`

**Required Implementation:**

```typescript
// qr-generator.ts - Complete Implementation
import QRCode from 'qrcode';
import chalk from 'chalk';

interface QROptions {
  type: 'terminal' | 'svg' | 'png' | 'dataurl';
  width?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

interface ConnectionPayload {
  url: string;           // wss://xxx.ngrok.io
  sessionId: string;     // UUID for pairing
  timestamp: number;     // Unix timestamp
  expiresIn: number;     // Seconds until expiry (300 = 5min)
}

export async function generateConnectionQR(
  payload: ConnectionPayload,
  options: QROptions = { type: 'terminal' }
): Promise<string> {
  // Encode payload as JSON, then base64
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const qrData = `floyd://connect?data=${encoded}`;
  
  switch (options.type) {
    case 'terminal':
      return await QRCode.toString(qrData, {
        type: 'terminal',
        small: true,
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      });
      
    case 'svg':
      return await QRCode.toString(qrData, {
        type: 'svg',
        width: options.width || 256,
      });
      
    case 'png':
      return await QRCode.toDataURL(qrData, {
        type: 'image/png',
        width: options.width || 256,
      });
      
    case 'dataurl':
      return await QRCode.toDataURL(qrData);
      
    default:
      throw new Error(`Unsupported QR type: ${options.type}`);
  }
}

export function displayTerminalQR(
  qrString: string,
  tunnelUrl: string,
  sessionId: string
): void {
  console.log('\n');
  console.log(chalk.cyan.bold('  ╔══════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('  ║') + chalk.white.bold('     FLOYD Mobile Connection Ready      ') + chalk.cyan.bold('║'));
  console.log(chalk.cyan.bold('  ╚══════════════════════════════════════════╝'));
  console.log('\n');
  console.log(qrString);
  console.log('\n');
  console.log(chalk.gray('  Scan this QR code with FLOYD Mobile app'));
  console.log(chalk.gray('  or manually enter:'));
  console.log(chalk.green(`  ${tunnelUrl}`));
  console.log(chalk.gray(`  Session: ${sessionId}`));
  console.log('\n');
  console.log(chalk.yellow('  ⚠ QR code expires in 5 minutes'));
  console.log(chalk.gray('  Press Ctrl+C to cancel\n'));
}
```

#### 3. Mobile App Deep Link Handler

**Location:** `/mobile/FloydMobile/src/services/deep-link-handler.ts`

```typescript
// deep-link-handler.ts
import { Linking } from 'react-native';

interface ConnectionPayload {
  url: string;
  sessionId: string;
  timestamp: number;
  expiresIn: number;
}

export async function parseFloydDeepLink(url: string): Promise<ConnectionPayload | null> {
  try {
    const parsed = new URL(url);
    
    if (parsed.protocol !== 'floyd:') return null;
    if (parsed.hostname !== 'connect') return null;
    
    const data = parsed.searchParams.get('data');
    if (!data) return null;
    
    const decoded = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf-8')
    );
    
    // Validate expiry
    const now = Math.floor(Date.now() / 1000);
    if (now > decoded.timestamp + decoded.expiresIn) {
      throw new Error('Connection expired');
    }
    
    return decoded as ConnectionPayload;
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
}

export function setupDeepLinkListener(
  onConnect: (payload: ConnectionPayload) => void
): () => void {
  const handler = async (event: { url: string }) => {
    const payload = await parseFloydDeepLink(event.url);
    if (payload) {
      onConnect(payload);
    }
  };
  
  Linking.addEventListener('url', handler);
  
  // Check if app was opened via deep link
  Linking.getInitialURL().then(url => {
    if (url) handler({ url });
  });
  
  return () => {
    Linking.removeEventListener('url', handler);
  };
}
```

#### 4. CLI Bridge Mode Enhancement

**Changes to:** `/floyd-wrapper-main/src/cli.ts`

```typescript
// Add --bridge flag handling with NGROK + QR
async function startBridgeMode(options: BridgeOptions): Promise<void> {
  const bridgeServer = new BridgeServer({ port: options.port || 3000 });
  const ngrokManager = new NgrokManager({ port: options.port || 3000 });
  
  // Start local bridge
  await bridgeServer.start();
  console.log(chalk.green(`Bridge server listening on port ${options.port || 3000}`));
  
  // Start NGROK tunnel
  console.log(chalk.gray('Starting NGROK tunnel...'));
  const tunnelInfo = await ngrokManager.start();
  
  // Generate session ID
  const sessionId = crypto.randomUUID();
  
  // Generate QR code
  const payload: ConnectionPayload = {
    url: tunnelInfo.url,
    sessionId,
    timestamp: Math.floor(Date.now() / 1000),
    expiresIn: 300, // 5 minutes
  };
  
  const qrString = await generateConnectionQR(payload, { type: 'terminal' });
  displayTerminalQR(qrString, tunnelInfo.publicUrl, sessionId);
  
  // Wait for mobile connection
  bridgeServer.on('mobile-connected', (client) => {
    console.log(chalk.green('✓ Mobile client connected!'));
    // Clear QR display, show chat interface
  });
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    await ngrokManager.stop();
    await bridgeServer.stop();
    process.exit(0);
  });
}
```

### Complete Connection Flow

```
STEP 1: User runs `floyd --bridge`
        │
        ▼
STEP 2: Bridge server starts on localhost:3000
        │
        ▼
STEP 3: NGROK tunnel established
        │   URL: wss://abc123.ngrok.io
        │
        ▼
STEP 4: QR code displayed in terminal
        │   Contains: { url, sessionId, timestamp, expiresIn }
        │
        ▼
STEP 5: User scans QR with iPhone camera
        │
        ▼
STEP 6: FLOYD Mobile app opens via deep link
        │   floyd://connect?data=...
        │
        ▼
STEP 7: App parses payload, validates expiry
        │
        ▼
STEP 8: WebSocket connection established
        │   wss://abc123.ngrok.io/agent
        │
        ▼
STEP 9: Handshake with sessionId verification
        │
        ▼
STEP 10: Ready for chat!
```

### Verification Receipt Template

```markdown
## SCENARIO 3 VERIFICATION RECEIPT

### Test: Mobile ↔ iPhone via NGROK + QR

**Date:** YYYY-MM-DD HH:MM:SS TZ
**Environment:** 
- Mac: macOS [version]
- iPhone: iOS [version]
- Network: [same WiFi / cellular]

#### Prerequisites
- [ ] NGROK_AUTH_TOKEN set in environment
- [ ] FLOYD Mobile app installed on iPhone
- [ ] iPhone camera access enabled

#### Test Steps
1. [ ] Start bridge: `floyd --bridge`
2. [ ] Verify NGROK tunnel starts
3. [ ] QR code displays in terminal
4. [ ] Scan QR with iPhone camera
5. [ ] App opens via deep link
6. [ ] Connection indicator shows green
7. [ ] Send test message from iPhone
8. [ ] Verify response received

#### Network Tests
- [ ] Latency test: Round-trip < 500ms
- [ ] Reconnect test: Disconnect WiFi, reconnect
- [ ] Timeout test: Wait 5 min, verify QR expires

#### Expected Results
- Tunnel URL is valid wss:// URL
- QR code scannable from 30cm distance
- Connection survives network changes
- Session persists after app background

#### Actual Results
[TO BE FILLED]

#### DIFF (All code changes)
```diff
[GIT DIFF OUTPUT]
```

#### Sign-Off
- [ ] All tests passed
- [ ] Security review complete
- [ ] Ready for production
```

---

## Implementation Phases

### Phase 1: Core Bridge (Week 1)

| Task | File | Effort | Status |
|------|------|--------|--------|
| Complete BridgeServer | `bridge/server.ts` | 2 days | **TODO** |
| Implement session routing | `bridge/session-router.ts` | 1 day | **TODO** |
| Add authentication | `bridge/token-manager.ts` | 1 day | **TODO** |
| Unit tests | `bridge/__tests__/` | 1 day | **TODO** |

**Verification:** Bridge server accepts WebSocket connections

### Phase 2: NGROK Integration (Week 2)

| Task | File | Effort | Status |
|------|------|--------|--------|
| Implement NgrokManager | `bridge/ngrok-manager.ts` | 2 days | **TODO** |
| Implement QR generator | `bridge/qr-generator.ts` | 1 day | **TODO** |
| CLI --bridge flag | `cli.ts` | 1 day | **TODO** |
| Integration tests | `bridge/__tests__/` | 1 day | **TODO** |

**Verification:** QR code displays, tunnel URL works externally

### Phase 3: Mobile App (Weeks 3-4)

| Task | File | Effort | Status |
|------|------|--------|--------|
| React Native setup | `mobile/FloydMobile/` | 1 day | **TODO** |
| WebSocket client | `services/bridge-client.ts` | 2 days | **TODO** |
| Deep link handler | `services/deep-link-handler.ts` | 1 day | **TODO** |
| Chat UI | `screens/ChatScreen.tsx` | 3 days | **TODO** |
| Settings UI | `screens/SettingsScreen.tsx` | 1 day | **TODO** |
| iOS build | Xcode project | 1 day | **TODO** |
| TestFlight deploy | CI/CD | 1 day | **TODO** |

**Verification:** Full end-to-end QR scan → chat working

### Phase 4: Desktop Web Integration (Week 5)

| Task | File | Effort | Status |
|------|------|--------|--------|
| Mobile client support in WS-MCP | `ws-mcp-server.ts` | 2 days | **TODO** |
| Chrome extension relay | `floydchrome/` | 2 days | **TODO** |
| Integration tests | `__tests__/` | 1 day | **TODO** |

**Verification:** Mobile can trigger browser automation

---

## Security Considerations

### Authentication Flow

```
1. QR code contains single-use sessionId
2. sessionId expires in 5 minutes
3. First connection claims sessionId
4. Subsequent connections rejected
5. JWT token issued after successful auth
6. Token refreshed every 24 hours
```

### Network Security

```
✅ All connections over WSS (TLS)
✅ NGROK provides TLS termination
✅ Session tokens are signed JWTs
✅ Rate limiting on bridge endpoints
⚠️ Consider IP allowlisting for production
```

### Data Privacy

```
✅ No conversation data stored on NGROK servers
✅ All processing happens on local Mac
✅ Mobile app can wipe local cache
⚠️ Add option to disable logging
```

---

## Dependencies Summary

```json
{
  "production": {
    "@ngrok/ngrok": "^1.7.0",
    "qrcode": "^1.5.4",
    "ws": "^8.19.0",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "uuid": "^13.0.0"
  },
  "mobile (React Native)": {
    "react-native": "^0.73.0",
    "react-native-websocket": "^1.0.0",
    "react-native-camera": "^4.0.0",
    "@react-navigation/native": "^6.0.0"
  }
}
```

---

## File Checklist

### Files to CREATE

- [ ] `mobile/FloydMobile/src/App.tsx`
- [ ] `mobile/FloydMobile/src/screens/ChatScreen.tsx`
- [ ] `mobile/FloydMobile/src/screens/SettingsScreen.tsx`
- [ ] `mobile/FloydMobile/src/services/bridge-client.ts`
- [ ] `mobile/FloydMobile/src/services/deep-link-handler.ts`
- [ ] `mobile/FloydMobile/src/hooks/useBridge.ts`
- [ ] `mobile/FloydMobile/src/hooks/useChat.ts`
- [ ] `mobile/FloydMobile/package.json`
- [ ] `mobile/FloydMobile/app.json`

### Files to MODIFY

- [ ] `floyd-wrapper-main/src/bridge/server.ts` - Complete implementation
- [ ] `floyd-wrapper-main/src/bridge/ngrok-manager.ts` - Complete implementation
- [ ] `floyd-wrapper-main/src/bridge/qr-generator.ts` - Complete implementation
- [ ] `floyd-wrapper-main/src/cli.ts` - Add bridge mode
- [ ] `INK/floyd-agent-sandbox/FloydDesktopWeb/server/ws-mcp-server.ts` - Mobile support

### Files to TEST

- [ ] `floyd-wrapper-main/src/bridge/__tests__/server.test.ts`
- [ ] `floyd-wrapper-main/src/bridge/__tests__/ngrok-manager.test.ts`
- [ ] `floyd-wrapper-main/src/bridge/__tests__/qr-generator.test.ts`
- [ ] `mobile/FloydMobile/__tests__/bridge-client.test.ts`

---

## Success Criteria

### Minimum Viable Product (MVP)

1. ✅ `floyd --bridge` starts server and displays QR
2. ✅ iPhone can scan QR and connect
3. ✅ Bidirectional chat works over NGROK
4. ✅ Tool results display on mobile
5. ✅ Session survives app backgrounding

### Full Release

1. ✅ All MVP criteria
2. ✅ Desktop Web integration
3. ✅ Browser automation from mobile
4. ✅ Push notifications for responses
5. ✅ Session history persistence
6. ✅ Multiple device support

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-02-02  
**Status:** PLAN MODE - Ready for Implementation  
**Next Action:** Begin Phase 1 (Core Bridge)
