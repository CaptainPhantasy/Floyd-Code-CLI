/**
 * WebSocket MCP Server for FloydDesktopWeb
 *
 * Provides WebSocket endpoint for Chrome extension and Floyd CLI to connect
 * Routes browser automation tool calls and responses between clients
 *
 * Architecture:
 * - Floyd CLI connects here to call browser tools
 * - FloydChrome extension connects here to execute browser tools
 * - Server routes tool calls from CLI → extension
 * - Server routes responses from extension → CLI
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createHttpServer, Server as HttpServer } from 'http';

interface MCPMessage {
  jsonrpc: '2.0';
  id?: number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface PendingRequest {
  callerWs: WebSocket;
  timestamp: number;
}

interface ClientInfo {
  type: 'extension' | 'cli' | 'unknown';
  connectedAt: number;
}

export class WebSocketMCPServer {
  private wss: WebSocketServer;
  private server: HttpServer;
  private port: number;
  private clients: Set<WebSocket> = new Set();
  private clientInfo: Map<WebSocket, ClientInfo> = new Map();
  private messageId = 0;
  private tools: MCPTool[] = [];

  // Track pending requests: when CLI calls a tool, we wait for extension response
  private pendingRequests: Map<number, PendingRequest> = new Map();

  // Reference to the extension client (the one that executes browser tools)
  private extensionClient: WebSocket | null = null;

  constructor(port: number = 3005) {
    this.port = port;
    this.server = createHttpServer();
    this.wss = new WebSocketServer({ server: this.server });

    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[MCP-WS] Client connected');
      this.clients.add(ws);
      this.clientInfo.set(ws, { type: 'unknown', connectedAt: Date.now() });

      ws.on('message', (data: Buffer) => {
        try {
          const message: MCPMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('[MCP-WS] Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        console.log('[MCP-WS] Client disconnected');
        this.clients.delete(ws);
        this.clientInfo.delete(ws);

        // If extension disconnected, clear reference
        if (ws === this.extensionClient) {
          console.log('[MCP-WS] Extension disconnected');
          this.extensionClient = null;
        }

        // Clean up pending requests from this client
        for (const [id, pending] of this.pendingRequests.entries()) {
          if (pending.callerWs === ws) {
            this.pendingRequests.delete(id);
          }
        }
      });

      ws.on('error', (error) => {
        console.error('[MCP-WS] WebSocket error:', error);
      });

      // Send initialization confirmation
      this.sendMessage(ws, {
        jsonrpc: '2.0',
        method: 'notification',
        params: {
          type: 'connected',
          message: 'FloydDesktopWeb MCP Server connected'
        }
      });
    });
  }

  private handleMessage(ws: WebSocket, message: MCPMessage): void {
    const { method, params, id, result, error } = message;

    // Handle results/errors from the extension (tool execution results)
    if (id !== undefined && (result !== undefined || error !== undefined) && !method) {
      this.handleToolResult(ws, message);
      return;
    }

    // Handle requests
    switch (method) {
      case 'initialize':
        if (id !== undefined) this.handleInitialize(ws, id, params);
        break;

      case 'notifications/initialized':
        // Client finished initializing
        console.log('[MCP-WS] Client finished initializing');
        break;

      case 'tools/list':
        if (id !== undefined) this.handleListTools(ws, id);
        break;

      case 'tools/call':
        if (id !== undefined) this.handleToolCall(ws, id, params);
        break;

      case 'extension/register':
        // Extension registers itself as the browser tool executor
        if (id !== undefined) this.handleExtensionRegister(ws, id, params);
        break;

      default:
        if (id !== undefined) this.sendError(ws, id, -32601, `Method not found: ${method}`);
    }
  }

  private handleInitialize(ws: WebSocket, id: number, params: any): void {
    console.log('[MCP-WS] Initializing connection');

    // Detect client type from clientInfo name
    const clientName = params?.clientInfo?.name || '';
    if (clientName.includes('floydchrome') || clientName.includes('extension')) {
      this.clientInfo.set(ws, { type: 'extension', connectedAt: Date.now() });
      this.extensionClient = ws;
      console.log('[MCP-WS] Registered as extension client');
    } else if (clientName.includes('floyd') || clientName.includes('cli')) {
      this.clientInfo.set(ws, { type: 'cli', connectedAt: Date.now() });
      console.log('[MCP-WS] Registered as CLI client');
    }

    this.sendMessage(ws, {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'floyd-desktop-web',
          version: '0.1.0'
        }
      }
    });
  }

  private handleExtensionRegister(ws: WebSocket, id: number, params: any): void {
    this.clientInfo.set(ws, { type: 'extension', connectedAt: Date.now() });
    this.extensionClient = ws;
    console.log('[MCP-WS] Extension registered as browser tool executor');

    this.sendMessage(ws, {
      jsonrpc: '2.0',
      id,
      result: { success: true, message: 'Extension registered' }
    });
  }

  private handleListTools(ws: WebSocket, id: number): void {
    this.sendMessage(ws, {
      jsonrpc: '2.0',
      id,
      result: {
        tools: this.tools
      }
    });
  }

  private handleToolCall(ws: WebSocket, id: number, params: any): void {
    const { name, arguments: args } = params;

    console.log(`[MCP-WS] Tool called: ${name}`, JSON.stringify(args).substring(0, 100));

    // Check if we have an extension to execute the tool
    if (!this.extensionClient || this.extensionClient.readyState !== WebSocket.OPEN) {
      console.log('[MCP-WS] No extension connected, returning error');
      this.sendError(ws, id, -32000, 'No browser extension connected. Please ensure FloydChrome extension is loaded.');
      return;
    }

    // Map CLI tool names to extension tool names
    const toolMapping: Record<string, string> = {
      'browser_navigate': 'navigate',
      'browser_read_page': 'read_page',
      'browser_screenshot': 'screenshot',
      'browser_click': 'click',
      'browser_type': 'type',
      'browser_find': 'find',
      'browser_get_tabs': 'get_tabs',
      'browser_create_tab': 'tabs_create',
    };

    const extensionTool = toolMapping[name] || name;

    // Track this request so we can route the response back
    this.pendingRequests.set(id, {
      callerWs: ws,
      timestamp: Date.now()
    });

    // Forward to extension with mapped tool name
    this.sendMessage(this.extensionClient, {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: { name: extensionTool, arguments: args }
    });

    console.log(`[MCP-WS] Forwarded tool call ${name} → ${extensionTool} to extension (id: ${id})`);

    // Set timeout to clean up if no response
    setTimeout(() => {
      if (this.pendingRequests.has(id)) {
        console.log(`[MCP-WS] Tool call ${id} timed out`);
        this.pendingRequests.delete(id);
      }
    }, 30000);
  }

  private handleToolResult(ws: WebSocket, message: MCPMessage): void {
    const { id, result, error } = message;

    // Check if this is a response to a pending request
    const pending = this.pendingRequests.get(id!);

    if (pending) {
      console.log(`[MCP-WS] Routing result for request ${id} back to caller`);

      // Send the result back to the original caller
      this.sendMessage(pending.callerWs, {
        jsonrpc: '2.0',
        id,
        result: result,
        error: error
      });

      // Clean up
      this.pendingRequests.delete(id!);
    } else {
      console.log(`[MCP-WS] Received result for unknown request ${id}`);
    }
  }

  private sendMessage(ws: WebSocket, message: MCPMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, id: number, code: number, message: string): void {
    this.sendMessage(ws, {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    });
  }

  registerTools(tools: MCPTool[]): void {
    this.tools = tools;
    console.log(`[MCP-WS] Registered ${tools.length} tools`);
  }

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.port, () => {
          console.log(`[MCP-WS] Server successfully started on ws://localhost:${this.port}`);
          resolve(this.port);
        });

        this.server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`[MCP-WS] Port ${this.port} already in use`);
            reject(error);
          } else {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  stop(): void {
    // Clean up pending requests
    this.pendingRequests.clear();

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.wss.close();
    this.server.close();
    console.log('[MCP-WS] Server stopped');
  }

  broadcast(message: MCPMessage): void {
    this.clients.forEach(client => {
      this.sendMessage(client, message);
    });
  }

  // Get status info
  getStatus(): { clients: number; extensionConnected: boolean; pendingRequests: number } {
    return {
      clients: this.clients.size,
      extensionConnected: this.extensionClient !== null && this.extensionClient.readyState === WebSocket.OPEN,
      pendingRequests: this.pendingRequests.size
    };
  }
}
