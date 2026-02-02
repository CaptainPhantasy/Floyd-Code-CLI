/**
 * WebSocket MCP Server for FloydDesktopWeb
 *
 * Provides WebSocket endpoint for Chrome extension to connect
 * Exposes browser automation tools via MCP protocol
 */
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createHttpServer } from 'http';
export class WebSocketMCPServer {
    wss;
    server;
    port;
    clients = new Set();
    messageId = 0;
    tools = [];
    constructor(port = 3005) {
        this.port = port;
        this.server = createHttpServer();
        this.wss = new WebSocketServer({ server: this.server });
        this.setupWebSocket();
    }
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('[MCP-WS] Chrome extension connected');
            this.clients.add(ws);
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(ws, message);
                }
                catch (error) {
                    console.error('[MCP-WS] Failed to parse message:', error);
                }
            });
            ws.on('close', () => {
                console.log('[MCP-WS] Chrome extension disconnected');
                this.clients.delete(ws);
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
    handleMessage(ws, message) {
        const { method, params, id, result, error } = message;
        // Handle results/errors from the extension
        if (id !== undefined && (result || error) && !method) {
            this.handleToolResult(ws, message);
            return;
        }
        switch (method) {
            case 'initialize':
                if (id !== undefined)
                    this.handleInitialize(ws, id, params);
                break;
            case 'tools/list':
                if (id !== undefined)
                    this.handleListTools(ws, id);
                break;
            case 'tools/call':
                if (id !== undefined)
                    this.handleToolCall(ws, id, params);
                break;
            default:
                if (id !== undefined)
                    this.sendError(ws, id, -32601, `Method not found: ${method}`);
        }
    }
    handleInitialize(ws, id, params) {
        console.log('[MCP-WS] Initializing connection');
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
    handleListTools(ws, id) {
        this.sendMessage(ws, {
            jsonrpc: '2.0',
            id,
            result: {
                tools: this.tools
            }
        });
    }
    handleToolCall(ws, id, params) {
        const { name, arguments: args } = params;
        // Check if this is a response to a request we sent (Floyd -> Browser)
        // Actually, in the current architecture, Floyd sends requests TO the extension.
        // So the extension will send messages WITH an ID that we need to resolve.
        // For now, if we receive a tools/call, it means the AGENT called a tool
        // and we need to broadcast it to the Chrome extension.
        console.log(`[MCP-WS] Tool called: ${name}`, args);
        // We send the tool call to the Chrome extension
        this.broadcast({
            jsonrpc: '2.0',
            id,
            method: 'tools/call',
            params: { name, arguments: args }
        });
    }
    // Add a way to handle results coming back from the extension
    handleToolResult(ws, message) {
        // If the extension sends a result for a call we forwarded
        console.log(`[MCP-WS] Received result from extension for id ${message.id}`);
        // In a full implementation, we'd route this back to the ToolExecutor
    }
    sendMessage(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    sendError(ws, id, code, message) {
        this.sendMessage(ws, {
            jsonrpc: '2.0',
            id,
            error: {
                code,
                message
            }
        });
    }
    registerTools(tools) {
        this.tools = tools;
        console.log(`[MCP-WS] Registered ${tools.length} tools`);
    }
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server.listen(this.port, () => {
                    console.log(`[MCP-WS] Server successfully started on ws://localhost:${this.port}`);
                    resolve(this.port);
                });
                this.server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        console.error(`[MCP-WS] Port ${this.port} already in use`);
                        reject(error);
                    }
                    else {
                        reject(error);
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    stop() {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        });
        this.wss.close();
        this.server.close();
        console.log('[MCP-WS] Server stopped');
    }
    broadcast(message) {
        this.clients.forEach(client => {
            this.sendMessage(client, message);
        });
    }
}
