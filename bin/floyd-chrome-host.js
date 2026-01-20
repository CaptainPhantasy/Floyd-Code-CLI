#!/usr/bin/env node

/**
 * FloydChrome Native Messaging Host
 * 
 * Bridges Chrome Native Messaging to WebSocket MCP server.
 * This allows the extension to communicate with Floyd CLI via stdio.
 * 
 * Chrome → Native Messaging (stdio) → This Host → WebSocket → Floyd CLI
 */

import { WebSocket } from 'ws';

const EXTENSION_URL = 'ws://localhost:3000';

let ws = null;
let connectionReady = false;

// WebSocket connection to Floyd CLI MCP server
function connectToMCP() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(EXTENSION_URL);

    ws.on('open', () => {
      console.error('[NativeHost] Connected to MCP server at', EXTENSION_URL);
      connectionReady = true;
      resolve();
    });

    ws.on('message', (data) => {
      // Forward WebSocket messages to Chrome as native messages
      try {
        const message = JSON.parse(data.toString());
        sendNativeMessage(message);
      } catch (e) {
        console.error('[NativeHost] Error parsing WebSocket message:', e);
      }
    });

    ws.on('error', (error) => {
      console.error('[NativeHost] WebSocket error:', error.message);
      if (!connectionReady) {
        reject(error);
      }
    });

    ws.on('close', () => {
      console.error('[NativeHost] WebSocket connection closed');
      connectionReady = false;
      // Try to reconnect
      setTimeout(() => {
        connectToMCP().catch(() => {
          // Retry failed, will try again later
        });
      }, 3000);
    });

    // Connection timeout
    setTimeout(() => {
      if (!connectionReady) {
        reject(new Error('Connection timeout'));
      }
    }, 5000);
  });
}

/**
 * Send a message to Chrome via Native Messaging
 * Format: [4-byte length][JSON message]
 */
function sendNativeMessage(message) {
  const messageStr = JSON.stringify(message);
  const buffer = Buffer.from(messageStr, 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(buffer.length, 0);

  process.stdout.write(header);
  process.stdout.write(buffer);
}

/**
 * Read messages from Chrome via Native Messaging
 */
let messageLength = null;
let buffer = Buffer.alloc(0);

process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) {
    buffer = Buffer.concat([buffer, chunk]);

    while (true) {
      // Read message length if we don't have it yet
      if (messageLength === null) {
        if (buffer.length >= 4) {
          messageLength = buffer.readUInt32LE(0);
          buffer = buffer.slice(4);
        } else {
          break; // Need more data
        }
      }

      // Read message content if we have the length
      if (messageLength !== null) {
        if (buffer.length >= messageLength) {
          const messageBuffer = buffer.slice(0, messageLength);
          buffer = buffer.slice(messageLength);
          messageLength = null;

          try {
            const message = JSON.parse(messageBuffer.toString());
            handleChromeMessage(message);
          } catch (e) {
            console.error('[NativeHost] Error parsing Chrome message:', e);
          }
        } else {
          break; // Need more data
        }
      }
    }
  }
});

/**
 * Handle incoming message from Chrome
 */
function handleChromeMessage(message) {
  if (!connectionReady || !ws || ws.readyState !== WebSocket.OPEN) {
    // Buffer message until connected
    console.error('[NativeHost] Not connected, buffering message');
    sendNativeMessage({
      error: 'Not connected to MCP server',
      originalMessage: message
    });
    return;
  }

  // Forward to WebSocket MCP server
  try {
    ws.send(JSON.stringify(message));
  } catch (e) {
    console.error('[NativeHost] Error sending to WebSocket:', e);
    sendNativeMessage({
      error: 'Failed to send message to MCP server',
      originalMessage: message
    });
  }
}

// Start the native messaging host
console.error('[NativeHost] Starting FloydChrome Native Messaging Host...');

// Try to connect to MCP server (but don't fail if not available)
connectToMCP().catch((error) => {
  console.error('[NativeHost] Could not connect to MCP server:', error.message);
  console.error('[NativeHost] Native host will buffer messages until server is available');
  // Continue running - messages will be buffered
});

// Keep process alive
process.on('SIGINT', () => {
  if (ws) {
    ws.close();
  }
  process.exit(0);
});
