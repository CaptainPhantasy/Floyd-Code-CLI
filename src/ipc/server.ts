/**
 * IPC WebSocket Server
 * Broadcasts events from Main to Monitor
 */

import {WebSocketServer, WebSocket} from 'ws';
import {EventEmitter} from 'events';
import type {FloydEvent} from './events.js';

export class IPCServer extends EventEmitter {
	private wss?: WebSocketServer;
	private port: number;
	private clients: Set<WebSocket> = new Set();

	constructor(port = 3456) {
		super();
		this.port = port;
	}

	start(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.wss = new WebSocketServer({port: this.port});

				this.wss.on('listening', () => {
					console.log(`IPC server listening on port ${this.port}`);
					resolve();
				});

				this.wss.on('connection', ws => {
					this.clients.add(ws);
					this.emit('client.connected', ws);

					ws.on('close', () => {
						this.clients.delete(ws);
						this.emit('client.disconnected', ws);
					});

					ws.on('message', data => {
						try {
							const message = JSON.parse(data.toString());
							this.emit('command', message);
						} catch (err) {
							console.error('Invalid IPC message:', err);
						}
					});

					// Send welcome message
					this.sendTo(ws, {type: 'connected', timestamp: Date.now()});
				});

				this.wss.on('error', error => {
					this.emit('error', error);
					reject(error);
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	stop(): void {
		for (const client of this.clients) {
			client.close();
		}
		this.clients.clear();
		this.wss?.close();
	}

	broadcast(event: FloydEvent): void {
		const message = JSON.stringify(event);
		for (const client of this.clients) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		}
	}

	private sendTo(ws: WebSocket, data: unknown): void {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(data));
		}
	}

	getClientCount(): number {
		return this.clients.size;
	}
}
