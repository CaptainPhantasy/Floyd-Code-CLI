/**
 * Floyd Bridge - Module Index
 *
 * Re-exports all bridge components for easy importing.
 *
 * @example
 * import { BridgeServer, NgrokManager, createBridgeServer } from './bridge';
 *
 * @author OPUS1
 */

// Server
export { BridgeServer, createBridgeServer } from './server.js';
export type { BridgeServerConfig, BridgeClient } from './server.js';

// NGROK
export { NgrokManager, createNgrokManager, isNgrokAvailable, hasNgrokToken } from './ngrok-manager.js';
export type { NgrokConfig, NgrokStatus, TunnelInfo } from './ngrok-manager.js';

// QR Code
export {
  generateConnectionQR,
  generateQRFromUrl,
  createConnectionPayload,
  encodeDeepLink,
  decodeDeepLink,
  isPayloadExpired,
  displayTerminalQR,
  showConnectionQR,
  isQRCodeAvailable,
  generateTextConnectionDisplay,
} from './qr-generator.js';
export type { ConnectionPayload, QROptions } from './qr-generator.js';

// Session Router
export { SessionRouter, createSessionRouter } from './session-router.js';
export type {
  Session,
  SessionMetadata,
  SessionState,
  SessionMessage,
  ToolCall,
  SessionRouterConfig,
} from './session-router.js';

// Token Manager
export {
  TokenManager,
  createTokenManager,
  generateOneTimeToken,
  OneTimeTokenStore,
} from './token-manager.js';
export type {
  TokenPayload,
  TokenManagerConfig,
  TokenPair,
  TokenValidation,
  OneTimeToken,
} from './token-manager.js';

// Floyd Agent Handler (existing)
export { handleFloydAgentRequest, getAvailableMethods, getMethodInfo } from './floyd-agent-handler.js';
export type * from './floyd-agent-types.js';

// ============================================================================
// Convenience: Full Bridge Setup
// ============================================================================

import { BridgeServer, createBridgeServer, type BridgeServerConfig } from './server.js';
import { NgrokManager, createNgrokManager, isNgrokAvailable, hasNgrokToken } from './ngrok-manager.js';
import { SessionRouter, createSessionRouter } from './session-router.js';
import { TokenManager, createTokenManager, OneTimeTokenStore } from './token-manager.js';
import { showConnectionQR, isQRCodeAvailable } from './qr-generator.js';

export interface FullBridgeConfig {
  port?: number;
  enableNgrok?: boolean;
  enableAuth?: boolean;
  sessionPersistPath?: string;
}

export interface FullBridge {
  server: BridgeServer;
  sessions: SessionRouter;
  tokens: TokenManager;
  ottStore: OneTimeTokenStore;
  ngrok: NgrokManager | null;
  start(): Promise<{ localUrl: string; tunnelUrl?: string }>;
  stop(): Promise<void>;
}

/**
 * Create a fully configured bridge with all components
 */
export async function createFullBridge(config: FullBridgeConfig = {}): Promise<FullBridge> {
  const port = config.port ?? 3000;

  // Create components
  const server = createBridgeServer({
    port,
    authRequired: config.enableAuth ?? false,
  });

  const sessions = createSessionRouter({
    persistPath: config.sessionPersistPath,
  });

  const tokens = createTokenManager();
  const ottStore = new OneTimeTokenStore();

  let ngrok: NgrokManager | null = null;

  if (config.enableNgrok) {
    if (!(await isNgrokAvailable())) {
      console.warn('NGROK not available. Install with: npm install @ngrok/ngrok');
    } else if (!hasNgrokToken()) {
      console.warn('NGROK_AUTH_TOKEN not set. Tunnel will not be created.');
    } else {
      ngrok = createNgrokManager({ port });
    }
  }

  return {
    server,
    sessions,
    tokens,
    ottStore,
    ngrok,

    async start() {
      // Start session router
      await sessions.start();

      // Start bridge server
      await server.start();

      const result: { localUrl: string; tunnelUrl?: string } = {
        localUrl: `ws://localhost:${port}/agent`,
      };

      // Start NGROK if enabled
      if (ngrok) {
        try {
          const tunnelInfo = await ngrok.start();
          result.tunnelUrl = tunnelInfo.wsUrl;

          // Show QR code if available
          if (await isQRCodeAvailable()) {
            await showConnectionQR(tunnelInfo.publicUrl);
          }
        } catch (error) {
          console.error('Failed to start NGROK tunnel:', error);
        }
      }

      return result;
    },

    async stop() {
      if (ngrok) {
        await ngrok.stop();
      }
      await server.stop();
      await sessions.stop();
      ottStore.destroy();
    },
  };
}
