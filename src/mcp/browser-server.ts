/**
 * MCP Browser Server
 *
 * Provides browser automation tools via the FloydChrome extension.
 * Connects to the extension via WebSocket (ws://localhost:3000) and
 * exposes browser tools as MCP tools for the Floyd CLI agent.
 *
 * Tools:
 * - browser_navigate: Navigate to a URL
 * - browser_read_page: Get accessibility tree of page
 * - browser_screenshot: Capture screenshot for Computer Use
 * - browser_click: Click element at coordinates or by selector
 * - browser_type: Type text into focused element
 * - browser_find: Find element by natural language query
 * - browser_get_tabs: List all open tabs
 * - browser_create_tab: Create new tab
 *
 * Architecture:
 * Floyd CLI (AgentEngine)
 *   ↓
 * MCP Browser Server (this file)
 *   ↓
 * WebSocket (ws://localhost:3000)
 *   ↓
 * FloydChrome Extension
 *   ↓
 * Chrome APIs (Debugger, Tabs, Scripting)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { WebSocket } from 'ws';

interface JSONRPCMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * MCP Browser Server that connects to FloydChrome extension
 */
export class MCPBrowserServer {
  private server: Server;
  private ws: WebSocket | null = null;
  private messageId = 0;
  private pendingRequests: Map<number | string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 3000;

  private extensionUrl = 'ws://localhost:3000';

  constructor() {
    this.server = new Server(
      {
        name: 'floyd-browser-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupHandlers();
  }

  /**
   * Set up request handlers
   */
  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'browser_navigate',
            description: 'Navigate to a URL in the browser',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to navigate to',
                },
                tabId: {
                  type: 'number',
                  description: 'Tab ID (optional, uses active tab if not provided)',
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'browser_read_page',
            description: 'Get semantic accessibility tree of the current page',
            inputSchema: {
              type: 'object',
              properties: {
                tabId: {
                  type: 'number',
                  description: 'Tab ID (optional, uses active tab if not provided)',
                },
              },
            },
          },
          {
            name: 'browser_screenshot',
            description:
              'Capture screenshot of page, element, or viewport. Returns base64-encoded image data for Computer Use/vision models.',
            inputSchema: {
              type: 'object',
              properties: {
                fullPage: {
                  type: 'boolean',
                  description: 'Capture full scrollable page (default: false)',
                },
                selector: {
                  type: 'string',
                  description: 'CSS selector to capture specific element',
                },
                tabId: {
                  type: 'number',
                  description: 'Tab ID (optional, uses active tab if not provided)',
                },
              },
            },
          },
          {
            name: 'browser_click',
            description: 'Click element at coordinates or by CSS selector',
            inputSchema: {
              type: 'object',
              properties: {
                x: {
                  type: 'number',
                  description: 'X coordinate',
                },
                y: {
                  type: 'number',
                  description: 'Y coordinate',
                },
                selector: {
                  type: 'string',
                  description: 'CSS selector (alternative to coordinates)',
                },
                tabId: {
                  type: 'number',
                  description: 'Tab ID (optional, uses active tab if not provided)',
                },
              },
            },
          },
          {
            name: 'browser_type',
            description: 'Type text into the focused element',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Text to type',
                },
                tabId: {
                  type: 'number',
                  description: 'Tab ID (optional, uses active tab if not provided)',
                },
              },
              required: ['text'],
            },
          },
          {
            name: 'browser_find',
            description: 'Find element by natural language query',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Natural language description of element to find',
                },
                tabId: {
                  type: 'number',
                  description: 'Tab ID (optional, uses active tab if not provided)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'browser_get_tabs',
            description: 'List all open browser tabs',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'browser_create_tab',
            description: 'Open a new browser tab',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to open (optional)',
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Ensure connected to extension
      if (!this.connected) {
        await this.connect();
      }

      if (!this.connected) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Not connected to FloydChrome extension',
                message: 'Please ensure the FloydChrome extension is installed and connected',
              }),
            },
          ],
          isError: true,
        };
      }

      try {
        // Map tool names to extension tool names
        const toolMapping: Record<string, string> = {
          browser_navigate: 'navigate',
          browser_read_page: 'read_page',
          browser_screenshot: 'screenshot',
          browser_click: 'click',
          browser_type: 'type',
          browser_find: 'find',
          browser_get_tabs: 'get_tabs',
          browser_create_tab: 'tabs_create',
        };

        const extensionTool = toolMapping[name];
        if (!extensionTool) {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Call extension tool
        const result = await this.callExtensionTool(extensionTool, args || {});

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: (error as Error).message,
                tool: name,
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Connect to FloydChrome extension via WebSocket
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.extensionUrl);

        this.ws.on('open', () => {
          console.error(`[MCP Browser] Connected to FloydChrome extension at ${this.extensionUrl}`);
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', (data: Buffer) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('error', (error) => {
          console.error('[MCP Browser] WebSocket error:', error);
          this.connected = false;
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('[MCP Browser] Disconnected from extension');
          this.connected = false;
          this.attemptReconnect();
        });

        // Connection timeout
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message: JSONRPCMessage = JSON.parse(data);

      // Handle response to a request
      if (message.id !== undefined && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)!;
        this.pendingRequests.delete(message.id);

        if (message.error) {
          reject(new Error(message.error.message));
        } else {
          resolve(message.result);
        }
        return;
      }
    } catch (error) {
      console.error('[MCP Browser] Error handling message:', error);
    }
  }

  /**
   * Attempt to reconnect to the extension
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[MCP Browser] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[MCP Browser] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[MCP Browser] Reconnection failed:', error);
      });
    }, this.reconnectInterval);
  }

  /**
   * Send a request to the extension and wait for response
   */
  private async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.ws || !this.connected) {
      throw new Error('WebSocket not connected');
    }

    const id = ++this.messageId;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);

      this.pendingRequests.set(id, {
        resolve: (value: any) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      const message: JSONRPCMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.ws!.send(JSON.stringify(message));
    });
  }

  /**
   * Call a tool in the extension
   */
  private async callExtensionTool(
    toolName: string,
    args: Record<string, any>,
  ): Promise<any> {
    try {
      const response = await this.sendRequest('tools/call', {
        name: toolName,
        arguments: args,
      });

      return response.result || response;
    } catch (error) {
      throw new Error(
        `Extension tool call failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    // Try to connect to extension (non-blocking)
    this.connect()
      .then(() => {
        console.error('[MCP Browser] Extension connection established');
      })
      .catch((error) => {
        console.error('[MCP Browser] Extension not available:', error);
        console.error('[MCP Browser] Will attempt to reconnect on tool calls');
      });

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Floyd MCP Browser Server started');
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    await this.server.close();
  }
}

/**
 * Create and start the browser server (for standalone execution)
 */
export async function createBrowserServer(): Promise<MCPBrowserServer> {
  const server = new MCPBrowserServer();
  await server.start();
  return server;
}

/**
 * Start the browser server (for standalone execution)
 */
export async function startBrowserServer(): Promise<void> {
  const server = new MCPBrowserServer();
  await server.start();
}

// Run server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startBrowserServer().catch(console.error);
}
