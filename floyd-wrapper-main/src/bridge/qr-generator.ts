/**
 * QR Code Generator for Mobile Bridge
 *
 * Generates QR codes for mobile app pairing.
 * Supports terminal, SVG, and data URL output.
 *
 * @author OPUS1
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface ConnectionPayload {
  url: string;
  sessionId: string;
  timestamp: number;
  expiresIn: number;
  version: string;
}

export interface QROptions {
  type: 'terminal' | 'svg' | 'png' | 'dataurl';
  width?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

interface QRCodeLib {
  toString(
    data: string,
    options: {
      type: 'terminal' | 'svg' | 'utf8';
      small?: boolean;
      errorCorrectionLevel?: string;
      width?: number;
      margin?: number;
    }
  ): Promise<string>;
  toDataURL(
    data: string,
    options?: {
      type?: string;
      width?: number;
      margin?: number;
      errorCorrectionLevel?: string;
    }
  ): Promise<string>;
}

// ============================================================================
// Constants
// ============================================================================

const FLOYD_DEEP_LINK_SCHEME = 'floyd';
const FLOYD_CONNECT_HOST = 'connect';
const DEFAULT_EXPIRY_SECONDS = 300; // 5 minutes
const PROTOCOL_VERSION = '1.0.0';

// ============================================================================
// QR Code Generator
// ============================================================================

/**
 * Create a connection payload for QR encoding
 */
export function createConnectionPayload(
  tunnelUrl: string,
  options: {
    sessionId?: string;
    expiresIn?: number;
  } = {}
): ConnectionPayload {
  return {
    url: tunnelUrl,
    sessionId: options.sessionId || randomUUID(),
    timestamp: Math.floor(Date.now() / 1000),
    expiresIn: options.expiresIn || DEFAULT_EXPIRY_SECONDS,
    version: PROTOCOL_VERSION,
  };
}

/**
 * Encode payload as deep link URL
 */
export function encodeDeepLink(payload: ConnectionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${FLOYD_DEEP_LINK_SCHEME}://${FLOYD_CONNECT_HOST}?data=${encoded}`;
}

/**
 * Decode deep link URL to payload
 */
export function decodeDeepLink(url: string): ConnectionPayload | null {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== `${FLOYD_DEEP_LINK_SCHEME}:`) {
      return null;
    }

    if (parsed.hostname !== FLOYD_CONNECT_HOST) {
      return null;
    }

    const data = parsed.searchParams.get('data');
    if (!data) {
      return null;
    }

    return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Check if a connection payload has expired
 */
export function isPayloadExpired(payload: ConnectionPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now > payload.timestamp + payload.expiresIn;
}

/**
 * Generate QR code from connection payload
 */
export async function generateConnectionQR(
  payload: ConnectionPayload,
  options: QROptions = { type: 'terminal' }
): Promise<string> {
  const qrcode = await loadQRCode();
  const deepLink = encodeDeepLink(payload);

  switch (options.type) {
    case 'terminal':
      return qrcode.toString(deepLink, {
        type: 'terminal',
        small: true,
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        margin: options.margin ?? 1,
      });

    case 'svg':
      return qrcode.toString(deepLink, {
        type: 'svg',
        width: options.width || 256,
        margin: options.margin ?? 2,
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      });

    case 'png':
    case 'dataurl':
      return qrcode.toDataURL(deepLink, {
        type: 'image/png',
        width: options.width || 256,
        margin: options.margin ?? 2,
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      });

    default:
      throw new Error(`Unsupported QR type: ${options.type}`);
  }
}

/**
 * Generate QR from URL directly (simpler API)
 */
export async function generateQRFromUrl(
  url: string,
  options: QROptions = { type: 'terminal' }
): Promise<string> {
  const payload = createConnectionPayload(url);
  return generateConnectionQR(payload, options);
}

// ============================================================================
// Terminal Display
// ============================================================================

/**
 * Display QR code in terminal with styled border
 */
export function displayTerminalQR(
  qrString: string,
  tunnelUrl: string,
  sessionId: string,
  expiresIn: number = DEFAULT_EXPIRY_SECONDS
): void {
  const divider = '═'.repeat(48);
  const expireMinutes = Math.floor(expiresIn / 60);

  console.log('');
  console.log(`  ╔${divider}╗`);
  console.log(`  ║${'FLOYD Mobile Connection Ready'.padStart(36).padEnd(48)}║`);
  console.log(`  ╚${divider}╝`);
  console.log('');
  
  // Print QR code with indentation
  const lines = qrString.split('\n');
  for (const line of lines) {
    console.log(`  ${line}`);
  }
  
  console.log('');
  console.log('  Scan this QR code with the FLOYD Mobile app');
  console.log('  or manually enter:');
  console.log('');
  console.log(`  URL:     ${tunnelUrl}`);
  console.log(`  Session: ${sessionId}`);
  console.log('');
  console.log(`  ⚠ QR code expires in ${expireMinutes} minutes`);
  console.log('  Press Ctrl+C to cancel');
  console.log('');
}

/**
 * Generate and display QR code (all-in-one)
 */
export async function showConnectionQR(
  tunnelUrl: string,
  options: {
    sessionId?: string;
    expiresIn?: number;
  } = {}
): Promise<ConnectionPayload> {
  const payload = createConnectionPayload(tunnelUrl, options);
  const qrString = await generateConnectionQR(payload, { type: 'terminal' });
  
  displayTerminalQR(
    qrString,
    tunnelUrl,
    payload.sessionId,
    payload.expiresIn
  );
  
  return payload;
}

// ============================================================================
// Helpers
// ============================================================================

async function loadQRCode(): Promise<QRCodeLib> {
  try {
    const module = await import('qrcode');
    return module.default || module;
  } catch {
    throw new Error(
      'QRCode library not installed. Run: npm install qrcode'
    );
  }
}

/**
 * Check if qrcode library is available
 */
export async function isQRCodeAvailable(): Promise<boolean> {
  try {
    await import('qrcode');
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Fallback ASCII QR (if qrcode not installed)
// ============================================================================

/**
 * Generate a simple text-based connection display (fallback)
 */
export function generateTextConnectionDisplay(
  tunnelUrl: string,
  sessionId: string
): string {
  const lines = [
    '',
    '┌────────────────────────────────────────────────┐',
    '│          FLOYD Mobile Connection               │',
    '├────────────────────────────────────────────────┤',
    '│                                                │',
    '│  QR code unavailable (install qrcode package)  │',
    '│                                                │',
    '│  Connect manually:                             │',
    `│  URL: ${tunnelUrl.padEnd(40)}│`,
    `│  Session: ${sessionId.padEnd(36)}│`,
    '│                                                │',
    '└────────────────────────────────────────────────┘',
    '',
  ];
  
  return lines.join('\n');
}
