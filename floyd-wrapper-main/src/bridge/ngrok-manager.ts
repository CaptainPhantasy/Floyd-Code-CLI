/**
 * NGROK Tunnel Manager
 *
 * Manages NGROK tunnels for remote mobile connectivity.
 * Handles tunnel lifecycle, reconnection, and URL generation.
 *
 * @author OPUS1
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types
// ============================================================================

export interface NgrokConfig {
  authToken?: string;
  port: number;
  region?: 'us' | 'eu' | 'ap' | 'au' | 'sa' | 'jp' | 'in';
  hostname?: string;
  onStatusChange?: (status: NgrokStatus) => void;
}

export type NgrokStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface TunnelInfo {
  url: string;
  publicUrl: string;
  wsUrl: string;
  localPort: number;
  region: string;
  startedAt: Date;
}

interface NgrokSession {
  close(): Promise<void>;
}

interface NgrokListener {
  url(): string | null;
  close(): Promise<void>;
  on(event: 'close' | 'error', handler: (err?: Error) => void): void;
}

// ============================================================================
// NGROK Manager
// ============================================================================

export class NgrokManager extends EventEmitter {
  private tunnel: NgrokListener | null = null;
  private session: NgrokSession | null = null;
  private config: NgrokConfig;
  private status: NgrokStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 5000;

  constructor(config: NgrokConfig) {
    super();
    this.config = {
      ...config,
      authToken: config.authToken || process.env.NGROK_AUTH_TOKEN,
      region: config.region || 'us',
    };
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  async start(): Promise<TunnelInfo> {
    if (this.tunnel) {
      throw new Error('Tunnel already running');
    }

    this.setStatus('connecting');

    try {
      // Dynamic import to avoid loading ngrok if not needed
      const ngrok = await this.loadNgrok();

      if (!this.config.authToken) {
        throw new Error(
          'NGROK_AUTH_TOKEN not set. Get your token from https://dashboard.ngrok.com/get-started/your-authtoken'
        );
      }

      // Create NGROK session
      this.session = await ngrok.connect({
        authtoken: this.config.authToken,
      });

      // Create HTTP tunnel
      const listener = await (this.session as any).httpEndpoint().listenAndForward(
        `http://localhost:${this.config.port}`
      );

      this.tunnel = listener as NgrokListener;
      const tunnelUrl = this.tunnel.url();

      if (!tunnelUrl) {
        throw new Error('Failed to get tunnel URL');
      }

      // Build tunnel info
      const info: TunnelInfo = {
        url: tunnelUrl,
        publicUrl: tunnelUrl,
        wsUrl: tunnelUrl.replace('https://', 'wss://'),
        localPort: this.config.port,
        region: this.config.region || 'us',
        startedAt: new Date(),
      };

      // Handle tunnel events
      this.tunnel.on('close', () => {
        this.setStatus('disconnected');
        this.emit('close');
        this.maybeReconnect();
      });

      this.tunnel.on('error', (err) => {
        this.setStatus('error');
        this.emit('error', err);
      });

      this.setStatus('connected');
      this.reconnectAttempts = 0;
      this.emit('ready', info);

      return info;
    } catch (error) {
      this.setStatus('error');
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.tunnel) {
      try {
        await this.tunnel.close();
      } catch {
        // Ignore close errors
      }
      this.tunnel = null;
    }

    if (this.session) {
      try {
        await this.session.close();
      } catch {
        // Ignore close errors
      }
      this.session = null;
    }

    this.setStatus('disconnected');
    this.emit('stopped');
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private async loadNgrok(): Promise<typeof import('@ngrok/ngrok')> {
    try {
      return await import('@ngrok/ngrok');
    } catch {
      throw new Error(
        'NGROK not installed. Run: npm install @ngrok/ngrok'
      );
    }
  }

  private setStatus(status: NgrokStatus): void {
    this.status = status;
    this.config.onStatusChange?.(status);
    this.emit('status', status);
  }

  private maybeReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect-failed', {
        attempts: this.reconnectAttempts,
      });
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delayMs: this.reconnectDelay,
    });

    setTimeout(async () => {
      try {
        await this.start();
      } catch (error) {
        this.emit('reconnect-error', error);
        this.maybeReconnect();
      }
    }, this.reconnectDelay);
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  getUrl(): string | null {
    return this.tunnel?.url() || null;
  }

  getWsUrl(): string | null {
    const url = this.getUrl();
    return url ? url.replace('https://', 'wss://') : null;
  }

  getStatus(): NgrokStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.tunnel !== null;
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createNgrokManager(config: NgrokConfig): NgrokManager {
  return new NgrokManager(config);
}

// ============================================================================
// Utility: Check if NGROK is available
// ============================================================================

export async function isNgrokAvailable(): Promise<boolean> {
  try {
    await import('@ngrok/ngrok');
    return true;
  } catch {
    return false;
  }
}

export function hasNgrokToken(): boolean {
  return !!process.env.NGROK_AUTH_TOKEN;
}
