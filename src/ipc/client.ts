/**
 * IPC WebSocket Client
 * Connects Monitor to Main's IPC server
 */

import {WebSocket} from 'ws';
import {EventEmitter} from 'events';
import type {FloydEvent} from './events.js';

export class IPCClient extends EventEmitter {
	private ws?: WebSocket;
	private url: string;
	private reconnectDelay = 1000;
	private maxReconnectDelay = 30000;
	private reconnectTimer?: NodeJS.Timeout;

	constructor(port = 3456, host = 'localhost') {
		super();
		this.url = `ws://${host}:${port}`;
	}

	connect(): void {
		this.ws = new WebSocket(this.url);

		this.ws.on('open', () => {
			console.log(`Connected to IPC server at ${this.url}`);
			this.reconnectDelay = 1000;
			this.emit('connected');
		});

		this.ws.on('message', data => {
			try {
				const event: FloydEvent = JSON.parse(data.toString());
				this.emit('event', event);
			} catch (err) {
				console.error('Invalid IPC event:', err);
			}
		});

		this.ws.on('close', () => {
			console.log('Disconnected from IPC server');
			this.emit('disconnected');
			this.scheduleReconnect();
		});

		this.ws.on('error', error => {
			console.error('IPC client error:', error);
			this.emit('error', error);
		});
	}

	private scheduleReconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}

		this.reconnectTimer = setTimeout(() => {
			console.log(`Reconnecting to IPC server in ${this.reconnectDelay}ms...`);
			this.connect();
			this.reconnectDelay = Math.min(
				this.reconnectDelay * 2,
				this.maxReconnectDelay,
			);
		}, this.reconnectDelay);
	}

	disconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}
		this.ws?.close();
	}

	sendCommand(command: unknown): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(command));
		}
	}
}
