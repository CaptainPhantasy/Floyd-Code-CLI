/**
 * Chrome Extension Bridge
 * WebSocket client that connects to Chrome extension's MCP server
 */

import WebSocket from 'ws';

export interface BridgeOptions {
  ports?: number[];
  timeout?: number;
}

export class ChromeBridge {
  private ws: WebSocket | null = null;
  private connected = false;
  private messageId = 0;
  private pendingRequests: Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = new Map();

  async connect(options: BridgeOptions = {}): Promise<boolean> {
    const ports = options.ports ?? [3005, 3000, 3001, 3002, 3003, 3004, 3006, 3007, 3008, 3009];
    const timeout = options.timeout ?? 5000;

    for (const port of ports) {
      try {
        const success = await this.tryConnect(`ws://localhost:${port}`, timeout);
        if (success) {
          console.log(`[ChromeBridge] Connected on port ${port}`);
          return true;
        }
      } catch {
        // Try next port
      }
    }
    return false;
  }

  private tryConnect(url: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => { ws.close(); resolve(false); }, timeout);

      ws.on('open', () => {
        clearTimeout(timer);
        this.ws = ws;
        this.connected = true;
        this.setupHandlers();
        resolve(true);
      });

      ws.on('error', () => { clearTimeout(timer); resolve(false); });
    });
  }

  private setupHandlers(): void {
    if (!this.ws) return;

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          this.pendingRequests.delete(message.id);
          if (message.error) {
            pending.reject(new Error(message.error.message));
          } else {
            pending.resolve(message.result);
          }
        }
      } catch { /* ignore */ }
    });

    this.ws.on('close', () => { this.connected = false; this.ws = null; });
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.ws || !this.connected) throw new Error('Not connected');
    const id = ++this.messageId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.ws!.send(JSON.stringify({
        jsonrpc: '2.0', id, method: 'tools/call',
        params: { name, arguments: args },
      }));
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Timeout'));
        }
      }, 30000);
    });
  }

  isConnected(): boolean { return this.connected; }
  disconnect(): void { this.ws?.close(); this.ws = null; this.connected = false; }
}

export default ChromeBridge;
