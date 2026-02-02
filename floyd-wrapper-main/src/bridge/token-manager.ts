/**
 * Token Manager
 *
 * Handles JWT token generation and validation for bridge authentication.
 * Uses simple HMAC signing (no external JWT library required).
 *
 * @author OPUS1
 */

import { createHmac, randomBytes } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface TokenPayload {
  sub: string; // Subject (client ID)
  sid: string; // Session ID
  iat: number; // Issued at (Unix timestamp)
  exp: number; // Expiration (Unix timestamp)
  aud: string; // Audience
  iss: string; // Issuer
  device?: string; // Device type
  version?: string; // App version
}

export interface TokenManagerConfig {
  secret?: string;
  issuer?: string;
  audience?: string;
  expiresIn?: number; // Seconds
  refreshExpiresIn?: number; // Seconds
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
}

export interface TokenValidation {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

// ============================================================================
// Token Manager
// ============================================================================

export class TokenManager {
  private secret: string;
  private config: Required<Omit<TokenManagerConfig, 'secret'>>;

  constructor(config: TokenManagerConfig = {}) {
    // Generate random secret if not provided
    this.secret = config.secret || process.env.FLOYD_BRIDGE_SECRET || randomBytes(32).toString('hex');

    this.config = {
      issuer: config.issuer ?? 'floyd-bridge',
      audience: config.audience ?? 'floyd-mobile',
      expiresIn: config.expiresIn ?? 3600, // 1 hour
      refreshExpiresIn: config.refreshExpiresIn ?? 86400 * 7, // 7 days
    };
  }

  // --------------------------------------------------------------------------
  // Token Generation
  // --------------------------------------------------------------------------

  generateTokenPair(
    clientId: string,
    sessionId: string,
    metadata: { device?: string; version?: string } = {}
  ): TokenPair {
    const now = Math.floor(Date.now() / 1000);

    // Access token
    const accessPayload: TokenPayload = {
      sub: clientId,
      sid: sessionId,
      iat: now,
      exp: now + this.config.expiresIn,
      aud: this.config.audience,
      iss: this.config.issuer,
      device: metadata.device,
      version: metadata.version,
    };

    // Refresh token (longer lived, minimal payload)
    const refreshPayload: TokenPayload = {
      sub: clientId,
      sid: sessionId,
      iat: now,
      exp: now + this.config.refreshExpiresIn,
      aud: `${this.config.audience}-refresh`,
      iss: this.config.issuer,
    };

    return {
      accessToken: this.sign(accessPayload),
      refreshToken: this.sign(refreshPayload),
      expiresAt: new Date((now + this.config.expiresIn) * 1000),
      refreshExpiresAt: new Date((now + this.config.refreshExpiresIn) * 1000),
    };
  }

  refreshAccessToken(refreshToken: string): TokenPair | null {
    const validation = this.validate(refreshToken);

    if (!validation.valid || !validation.payload) {
      return null;
    }

    // Verify it's a refresh token
    if (!validation.payload.aud.endsWith('-refresh')) {
      return null;
    }

    // Generate new token pair
    return this.generateTokenPair(
      validation.payload.sub,
      validation.payload.sid,
      {
        device: validation.payload.device,
        version: validation.payload.version,
      }
    );
  }

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------

  validate(token: string): TokenValidation {
    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      const [headerB64, payloadB64, signature] = parts;

      // Verify signature
      const expectedSignature = this.createSignature(`${headerB64}.${payloadB64}`);

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Decode payload
      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf-8')
      ) as TokenPayload;

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return { valid: false, error: 'Token expired' };
      }

      // Check issuer
      if (payload.iss !== this.config.issuer) {
        return { valid: false, error: 'Invalid issuer' };
      }

      return { valid: true, payload };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private sign(payload: TokenPayload): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.createSignature(`${headerB64}.${payloadB64}`);

    return `${headerB64}.${payloadB64}.${signature}`;
  }

  private createSignature(data: string): string {
    return createHmac('sha256', this.secret)
      .update(data)
      .digest('base64url');
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  decodePayload(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      return JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8')
      );
    } catch {
      return null;
    }
  }

  isExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  getExpirationDate(token: string): Date | null {
    const payload = this.decodePayload(token);
    if (!payload) return null;

    return new Date(payload.exp * 1000);
  }

  getTimeUntilExpiration(token: string): number {
    const payload = this.decodePayload(token);
    if (!payload) return 0;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createTokenManager(config?: TokenManagerConfig): TokenManager {
  return new TokenManager(config);
}

// ============================================================================
// One-Time Token (for QR code pairing)
// ============================================================================

export interface OneTimeToken {
  token: string;
  sessionId: string;
  expiresAt: Date;
}

/**
 * Generate a one-time token for QR code pairing
 * These are short-lived (5 minutes) and can only be used once
 */
export function generateOneTimeToken(sessionId: string, expiresInSeconds: number = 300): OneTimeToken {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  return {
    token,
    sessionId,
    expiresAt,
  };
}

/**
 * Simple in-memory store for one-time tokens
 */
export class OneTimeTokenStore {
  private tokens: Map<string, { sessionId: string; expiresAt: Date }> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
  }

  store(ott: OneTimeToken): void {
    this.tokens.set(ott.token, {
      sessionId: ott.sessionId,
      expiresAt: ott.expiresAt,
    });
  }

  consume(token: string): string | null {
    const entry = this.tokens.get(token);

    if (!entry) {
      return null;
    }

    // Remove immediately (one-time use)
    this.tokens.delete(token);

    // Check expiration
    if (entry.expiresAt < new Date()) {
      return null;
    }

    return entry.sessionId;
  }

  private cleanup(): void {
    const now = new Date();
    for (const [token, entry] of this.tokens) {
      if (entry.expiresAt < now) {
        this.tokens.delete(token);
      }
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.tokens.clear();
  }
}
