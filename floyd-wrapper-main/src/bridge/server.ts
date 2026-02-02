/**
 * Floyd Bridge Server
 *
 * WebSocket + HTTP server for mobile/remote clients.
 * Protocol: JSON-RPC 2.0 over WebSocket
 * Port: 3000 (default)
 *
 * @author OPUS1
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { handleFloydAgentRequest, getAvailableMethods } from './floyd-agent-handler.js';
import type { FloydAgentRequest, FloydAgentResponse } from './floyd-agent-types.js';

// ============================================================================
// Types
// ============================================================================

export interface BridgeServerConfig {
  port: number;
  host?: string;
  pingInterval?: number;
  authRequired?: boolean;
}

export interface BridgeClient {
  id: string;
  socket: WebSocket;
  sessionId: string | null;
  authenticated: boolean;
  connectedAt: Date;
  lastPing: Date;
  metadata: {
    deviceType?: 'ios' | 'android' | 'web' | 'cli';
    appVersion?: string;
    clientIp?: string;
  };
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// JSON-RPC 2.0 Error Codes
const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Custom codes (-32000 to -32099)
  AUTH_REQUIRED: -32000,
  SESSION_EXPIRED: -32001,
  RATE_LIMITED: -32002,
};

// ============================================================================
// Bridge Server
// ============================================================================

export class BridgeServer extends EventEmitter {
  private httpServer: ReturnType<typeof createServer> | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, BridgeClient> = new Map();
  private config: BridgeServerConfig;
  private pingTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: Partial<BridgeServerConfig> = {}) {
    super();
    this.config = {
      port: config.port ?? 3000,
      host: config.host ?? '0.0.0.0',
      pingInterval: config.pingInterval ?? 30000,
      authRequired: config.authRequired ?? false,
    };
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Bridge server already running');
    }

    return new Promise((resolve, reject) => {
      // Create HTTP server for health endpoints
      this.httpServer = createServer((req, res) => this.handleHttpRequest(req, res));

      // Create WebSocket server attached to HTTP server
      this.wss = new WebSocketServer({
        server: this.httpServer,
        path: '/agent',
      });

      // WebSocket connection handler
      this.wss.on('connection', (socket, request) => {
        this.handleConnection(socket, request);
      });

      // Error handler
      this.wss.on('error', (error) => {
        this.emit('error', error);
      });

      // Start HTTP server
      this.httpServer.listen(this.config.port, this.config.host, () => {
        this.isRunning = true;
        this.startPingLoop();
        this.emit('ready', {
          port: this.config.port,
          host: this.config.host,
          wsPath: '/agent',
        });
        resolve();
      });

      this.httpServer.on('error', (error) => {
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    // Stop ping loop
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      client.socket.close(1001, 'Server shutting down');
    }
    this.clients.clear();

    // Close WebSocket server
    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve());
      });
      this.wss = null;
    }

    // Close HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
      this.httpServer = null;
    }

    this.isRunning = false;
    this.emit('stopped');
  }

  // --------------------------------------------------------------------------
  // HTTP Request Handler
  // --------------------------------------------------------------------------

  private handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Route handling
    switch (url.pathname) {
      case '/api/status':
        this.handleStatusEndpoint(req, res);
        break;
      case '/api/sessions':
        this.handleSessionsEndpoint(req, res);
        break;
      case '/api/methods':
        this.handleMethodsEndpoint(req, res);
        break;
      case '/api/chat':
        if (req.method === 'POST') {
          this.handleChatEndpoint(req, res);
        } else {
          this.sendJsonResponse(res, 405, { error: 'Method not allowed' });
        }
        break;
      default:
        this.sendJsonResponse(res, 404, { error: 'Not found' });
    }
  }

  private handleStatusEndpoint(_req: IncomingMessage, res: ServerResponse): void {
    this.sendJsonResponse(res, 200, {
      status: 'ok',
      version: '1.0.0',
      uptime: process.uptime(),
      clients: this.clients.size,
      timestamp: new Date().toISOString(),
    });
  }

  private handleSessionsEndpoint(_req: IncomingMessage, res: ServerResponse): void {
    const sessions = Array.from(this.clients.values()).map((client) => ({
      id: client.id,
      sessionId: client.sessionId,
      connectedAt: client.connectedAt.toISOString(),
      deviceType: client.metadata.deviceType,
      authenticated: client.authenticated,
    }));

    this.sendJsonResponse(res, 200, { sessions });
  }

  private handleMethodsEndpoint(_req: IncomingMessage, res: ServerResponse): void {
    this.sendJsonResponse(res, 200, {
      methods: getAvailableMethods(),
    });
  }

  private async handleChatEndpoint(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        if (!data.message) {
          this.sendJsonResponse(res, 400, { error: 'Missing message field' });
          return;
        }

        // TODO: Route to chat handler when implemented
        this.sendJsonResponse(res, 200, {
          id: uuidv4(),
          response: 'Chat endpoint ready - handler not yet implemented',
          timestamp: new Date().toISOString(),
        });
      } catch {
        this.sendJsonResponse(res, 400, { error: 'Invalid JSON' });
      }
    });
  }

  private sendJsonResponse(res: ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  // --------------------------------------------------------------------------
  // WebSocket Connection Handler
  // --------------------------------------------------------------------------

  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    const clientId = uuidv4();
    const clientIp = request.socket.remoteAddress || 'unknown';

    const client: BridgeClient = {
      id: clientId,
      socket,
      sessionId: null,
      authenticated: !this.config.authRequired,
      connectedAt: new Date(),
      lastPing: new Date(),
      metadata: {
        clientIp,
      },
    };

    this.clients.set(clientId, client);

    this.emit('client-connected', {
      clientId,
      clientIp,
      totalClients: this.clients.size,
    });

    // Send welcome message
    this.sendToClient(client, {
      jsonrpc: '2.0',
      id: null,
      result: {
        type: 'welcome',
        clientId,
        serverVersion: '1.0.0',
        authRequired: this.config.authRequired,
        methods: getAvailableMethods(),
      },
    });

    // Message handler
    socket.on('message', (data) => {
      this.handleMessage(client, data);
    });

    // Pong handler (for ping/pong keepalive)
    socket.on('pong', () => {
      client.lastPing = new Date();
    });

    // Close handler
    socket.on('close', (code, reason) => {
      this.clients.delete(clientId);
      this.emit('client-disconnected', {
        clientId,
        code,
        reason: reason.toString(),
        totalClients: this.clients.size,
      });
    });

    // Error handler
    socket.on('error', (error) => {
      this.emit('client-error', { clientId, error });
    });
  }

  // --------------------------------------------------------------------------
  // Message Handler
  // --------------------------------------------------------------------------

  private async handleMessage(client: BridgeClient, data: RawData): Promise<void> {
    let request: JsonRpcRequest;

    // Parse JSON
    try {
      request = JSON.parse(data.toString());
    } catch {
      this.sendError(client, null, JSON_RPC_ERRORS.PARSE_ERROR, 'Parse error');
      return;
    }

    // Validate JSON-RPC 2.0 structure
    if (
      request.jsonrpc !== '2.0' ||
      typeof request.method !== 'string' ||
      (request.id !== undefined && typeof request.id !== 'number' && typeof request.id !== 'string')
    ) {
      this.sendError(client, request.id ?? null, JSON_RPC_ERRORS.INVALID_REQUEST, 'Invalid request');
      return;
    }

    // Handle built-in methods
    switch (request.method) {
      case 'ping':
        this.sendToClient(client, {
          jsonrpc: '2.0',
          id: request.id,
          result: { pong: Date.now() },
        });
        return;

      case 'auth':
        await this.handleAuth(client, request);
        return;

      case 'session.create':
        await this.handleSessionCreate(client, request);
        return;

      case 'session.resume':
        await this.handleSessionResume(client, request);
        return;
    }

    // Check authentication for tool methods
    if (this.config.authRequired && !client.authenticated) {
      this.sendError(client, request.id, JSON_RPC_ERRORS.AUTH_REQUIRED, 'Authentication required');
      return;
    }

    // Route to Floyd Agent handler
    await this.handleToolRequest(client, request);
  }

  // --------------------------------------------------------------------------
  // Method Handlers
  // --------------------------------------------------------------------------

  private async handleAuth(client: BridgeClient, request: JsonRpcRequest): Promise<void> {
    const params = request.params as { token?: string; deviceType?: string; appVersion?: string } | undefined;

    if (!params?.token) {
      this.sendError(client, request.id, JSON_RPC_ERRORS.INVALID_PARAMS, 'Missing token');
      return;
    }

    // TODO: Implement actual token validation
    // For now, accept any non-empty token
    client.authenticated = true;
    client.metadata.deviceType = (params.deviceType as BridgeClient['metadata']['deviceType']) || 'web';
    client.metadata.appVersion = params.appVersion;

    this.sendToClient(client, {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        authenticated: true,
        clientId: client.id,
      },
    });

    this.emit('client-authenticated', {
      clientId: client.id,
      deviceType: client.metadata.deviceType,
    });
  }

  private async handleSessionCreate(client: BridgeClient, request: JsonRpcRequest): Promise<void> {
    const sessionId = uuidv4();
    client.sessionId = sessionId;

    this.sendToClient(client, {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        sessionId,
        createdAt: new Date().toISOString(),
      },
    });

    this.emit('session-created', {
      clientId: client.id,
      sessionId,
    });
  }

  private async handleSessionResume(client: BridgeClient, request: JsonRpcRequest): Promise<void> {
    const params = request.params as { sessionId?: string } | undefined;

    if (!params?.sessionId) {
      this.sendError(client, request.id, JSON_RPC_ERRORS.INVALID_PARAMS, 'Missing sessionId');
      return;
    }

    // TODO: Implement session persistence/lookup
    client.sessionId = params.sessionId;

    this.sendToClient(client, {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        sessionId: params.sessionId,
        resumed: true,
      },
    });

    this.emit('session-resumed', {
      clientId: client.id,
      sessionId: params.sessionId,
    });
  }

  private async handleToolRequest(client: BridgeClient, request: JsonRpcRequest): Promise<void> {
    try {
      // Convert JSON-RPC request to Floyd Agent request
      const agentRequest: FloydAgentRequest = {
        id: String(request.id),
        method: request.method as FloydAgentRequest['method'],
        params: (request.params as Record<string, any>) || {},
      };

      // Execute via Floyd Agent handler
      const result: FloydAgentResponse = await handleFloydAgentRequest(agentRequest);

      if (result.success) {
        this.sendToClient(client, {
          jsonrpc: '2.0',
          id: request.id,
          result: result.data,
        });
      } else {
        this.sendError(
          client,
          request.id,
          JSON_RPC_ERRORS.INTERNAL_ERROR,
          result.error?.message || 'Tool execution failed',
          result.error
        );
      }
    } catch (error) {
      this.sendError(
        client,
        request.id,
        JSON_RPC_ERRORS.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Internal error',
        error
      );
    }
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private sendToClient(client: BridgeClient, response: JsonRpcResponse): void {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(response));
    }
  }

  private sendError(
    client: BridgeClient,
    id: number | string | null,
    code: number,
    message: string,
    data?: unknown
  ): void {
    this.sendToClient(client, {
      jsonrpc: '2.0',
      id,
      error: { code, message, data },
    });
  }

  private startPingLoop(): void {
    this.pingTimer = setInterval(() => {
      const now = Date.now();
      const timeout = this.config.pingInterval! * 2;

      for (const [clientId, client] of this.clients) {
        // Check for stale connections
        if (now - client.lastPing.getTime() > timeout) {
          client.socket.terminate();
          this.clients.delete(clientId);
          this.emit('client-timeout', { clientId });
          continue;
        }

        // Send ping
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.ping();
        }
      }
    }, this.config.pingInterval);
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  getClientCount(): number {
    return this.clients.size;
  }

  getClients(): BridgeClient[] {
    return Array.from(this.clients.values());
  }

  broadcast(message: unknown): void {
    const data = JSON.stringify(message);
    for (const client of this.clients.values()) {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(data);
      }
    }
  }

  disconnectClient(clientId: string, reason?: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    client.socket.close(1000, reason || 'Disconnected by server');
    this.clients.delete(clientId);
    return true;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createBridgeServer(config?: Partial<BridgeServerConfig>): BridgeServer {
  return new BridgeServer(config);
}

// ============================================================================
// CLI Entry (when run directly)
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.BRIDGE_PORT || '3000', 10);
  const server = createBridgeServer({ port });

  server.on('ready', (info) => {
    console.log(`\n🌉 Floyd Bridge Server`);
    console.log(`   WebSocket: ws://${info.host}:${info.port}${info.wsPath}`);
    console.log(`   HTTP:      http://${info.host}:${info.port}/api/status`);
    console.log(`\n   Press Ctrl+C to stop\n`);
  });

  server.on('client-connected', ({ clientId, totalClients }) => {
    console.log(`[Bridge] Client connected: ${clientId} (total: ${totalClients})`);
  });

  server.on('client-disconnected', ({ clientId, totalClients }) => {
    console.log(`[Bridge] Client disconnected: ${clientId} (total: ${totalClients})`);
  });

  server.on('error', (error) => {
    console.error('[Bridge] Error:', error);
  });

  server.start().catch((err) => {
    console.error('Failed to start bridge server:', err);
    process.exit(1);
  });

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await server.stop();
    process.exit(0);
  });
}
