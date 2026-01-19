/**
 * Monitor Command
 *
 * Launches the Monitor dashboard layout for real-time system monitoring.
 * Connects to IPC for live updates from the main FLOYD CLI session.
 *
 * Usage:
 *   floyd-cli --monitor          # Full monitor dashboard
 *   floyd-cli --monitor --compact # Compact layout
 *   floyd-cli --monitor --minimal # Minimal layout
 *   floyd-cli --tmux             # Dual-screen mode (Main + Monitor)
 *
 * Features:
 * - Real-time event streaming
 * - Worker state visualization
 * - System metrics display
 * - Tool execution timeline
 * - Git activity monitoring
 * - Browser state tracking
 * - Alert ticker
 *
 * @module commands/monitor
 */

import {render} from 'ink';
import {useState, useEffect} from 'react';
import {WebSocket} from 'ws';
import {v4 as uuidv4} from 'uuid';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import {
	MonitorLayout,
	CompactMonitorLayout,
	MinimalMonitorLayout,
	type MonitorData,
} from '../ui/layouts/MonitorLayout.js';
import type {IPCMessage} from '../ipc/message-types.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface MonitorCommandOptions {
	/** Use compact layout */
	compact?: boolean;

	/** Use minimal layout */
	minimal?: boolean;

	/** IPC connection path (auto-detected if not specified) */
	ipcPath?: string;

	/** IPC connection port */
	port?: number;

	/** Update interval in milliseconds */
	updateInterval?: number;

	/** Session ID to connect to */
	sessionId?: string;

	/** Enable verbose logging */
	verbose?: boolean;
}

const DEFAULT_MONITOR_PORT = 3100;
const DEFAULT_UPDATE_INTERVAL = 1500;
const IPC_SOCKET_PATH =
	process.platform === 'win32'
		? `\\\\.\\pipe\\floyd-monitor`
		: path.join(os.tmpdir(), 'floyd-monitor.sock');

// ============================================================================
// IPC CLIENT
// ============================================================================

/**
 * MonitorIPCClient - WebSocket client for receiving real-time updates
 *
 * Connects to the main FLOYD CLI session and receives:
 * - Event streams
 * - Worker state updates
 * - System metrics
 * - Tool executions
 * - Git status changes
 * - Browser state updates
 * - Alerts
 */
class MonitorIPCClient {
	private ws: WebSocket | null = null;
	private connected = false;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10;
	private reconnectDelay = 1000;

	private onDataCallback?: (data: MonitorData) => void;
	private onStatusCallback?: (connected: boolean) => void;
	private onErrorCallback?: (error: Error) => void;

	private messageBuffer: Map<string, any> = new Map();

	constructor(private options: MonitorCommandOptions) {}

	/**
	 * Connect to the IPC server
	 */
	async connect(): Promise<boolean> {
		const connectionString = this.getConnectionString();

		if (this.options.verbose) {
			console.error(`[Monitor] Connecting to: ${connectionString}`);
		}

		try {
			this.ws = new WebSocket(connectionString);

			this.ws.on('open', () => {
				this.connected = true;
				this.reconnectAttempts = 0;
				this.onStatusCallback?.(true);

				if (this.options.verbose) {
					console.error('[Monitor] Connected to IPC server');
				}

				// Send hello message with client info
				this.send({
					type: 'config',
					data: {
						clientType: 'monitor',
						clientId: uuidv4(),
						timestamp: Date.now(),
					},
				});
			});

			this.ws.on('message', (data: Buffer) => {
				try {
					const message: IPCMessage = JSON.parse(data.toString());
					this.handleMessage(message);
				} catch (error) {
					if (this.options.verbose) {
						console.error('[Monitor] Failed to parse message:', error);
					}
				}
			});

			this.ws.on('close', () => {
				this.connected = false;
				this.onStatusCallback?.(false);

				if (this.options.verbose) {
					console.error('[Monitor] Connection closed');
				}

				// Attempt to reconnect
				this.scheduleReconnect();
			});

			this.ws.on('error', (error: Error) => {
				this.onErrorCallback?.(error);

				if (this.options.verbose) {
					console.error('[Monitor] WebSocket error:', error.message);
				}
			});

			// Wait for connection
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new Error('Connection timeout'));
				}, 5000);

				this.ws?.once('open', () => {
					clearTimeout(timeout);
					resolve();
				});

				this.ws?.once('error', () => {
					clearTimeout(timeout);
					reject(new Error('Connection failed'));
				});
			});

			return true;
		} catch (error) {
			if (this.options.verbose) {
				console.error('[Monitor] Connection failed:', error);
			}
			return false;
		}
	}

	/**
	 * Disconnect from the IPC server
	 */
	disconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.connected = false;
		this.onStatusCallback?.(false);
	}

	/**
	 * Send a message to the IPC server
	 */
	private send(message: IPCMessage): void {
		if (this.ws && this.connected) {
			this.ws.send(JSON.stringify(message));
		}
	}

	/**
	 * Handle incoming IPC messages
	 */
	private handleMessage(message: IPCMessage): void {
		if (!message.type) return;

		// Store message data in buffer by type
		if (message.data !== undefined) {
			this.messageBuffer.set(message.type, message.data);
		}

		// Trigger data callback with accumulated data
		this.onDataCallback?.(this.getMonitorData());
	}

	/**
	 * Get accumulated monitor data from buffer
	 */
	private getMonitorData(): MonitorData {
		return {
			events: this.messageBuffer.get('events'),
			metrics: this.messageBuffer.get('metrics'),
			toolExecutions: this.messageBuffer.get('tools'),
			gitStatus: this.messageBuffer.get('git'),
			browserState: this.messageBuffer.get('browser'),
			workers: this.messageBuffer.get('workers'),
			alerts: this.messageBuffer.get('alerts'),
		};
	}

	/**
	 * Schedule reconnection attempt
	 */
	private scheduleReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			if (this.options.verbose) {
				console.error('[Monitor] Max reconnection attempts reached');
			}
			return;
		}

		this.reconnectAttempts++;
		const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

		if (this.options.verbose) {
			console.error(
				`[Monitor] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
			);
		}

		this.reconnectTimer = setTimeout(() => {
			this.connect().catch(() => {
				// Connection failed, schedule next attempt
			});
		}, delay);
	}

	/**
	 * Get the IPC connection string
	 */
	private getConnectionString(): string {
		if (this.options.ipcPath) {
			return this.options.ipcPath;
		}

		// Check for socket file first
		if (fs.existsSync(IPC_SOCKET_PATH)) {
			return `ws+unix://${IPC_SOCKET_PATH}`;
		}

		// Fall back to port-based connection
		const port = this.options.port || DEFAULT_MONITOR_PORT;
		return `ws://localhost:${port}`;
	}

	/**
	 * Register callback for data updates
	 */
	onData(callback: (data: MonitorData) => void): void {
		this.onDataCallback = callback;
	}

	/**
	 * Register callback for connection status changes
	 */
	onStatus(callback: (connected: boolean) => void): void {
		this.onStatusCallback = callback;
	}

	/**
	 * Register callback for errors
	 */
	onError(callback: (error: Error) => void): void {
		this.onErrorCallback = callback;
	}

	/**
	 * Check if currently connected
	 */
	isConnected(): boolean {
		return this.connected;
	}
}

// ============================================================================
// MONITOR APP COMPONENT
// ============================================================================

interface MonitorAppState {
	data: MonitorData;
	connected: boolean;
}

/**
 * MonitorApp - Ink component for the Monitor dashboard
 *
 * Wraps the MonitorLayout with IPC client for real-time updates.
 */
function MonitorApp({
	options,
	ipcClient,
}: {
	options: MonitorCommandOptions;
	ipcClient: MonitorIPCClient;
}) {
	const [state, setState] = useState<MonitorAppState>({
		data: {},
		connected: false,
	});

	useEffect(() => {
		// Set up IPC client callbacks
		ipcClient.onData(data => {
			setState(prev => ({...prev, data}));
		});

		ipcClient.onStatus(connected => {
			setState(prev => ({...prev, connected}));
		});

		ipcClient.onError(error => {
			if (options.verbose) {
				console.error('[Monitor] Error:', error.message);
			}
		});

		// Connect to IPC
		ipcClient.connect().catch(error => {
			if (options.verbose) {
				console.error('[Monitor] Initial connection failed:', error);
			}
		});

		// Cleanup on unmount
		return () => {
			ipcClient.disconnect();
		};
	}, []);

	// Select layout variant based on options
	const updateInterval = options.updateInterval || DEFAULT_UPDATE_INTERVAL;

	if (options.minimal) {
		return (
			<MinimalMonitorLayout data={state.data} updateInterval={updateInterval} />
		);
	}

	if (options.compact) {
		return (
			<CompactMonitorLayout data={state.data} updateInterval={updateInterval} />
		);
	}

	return (
		<MonitorLayout
			data={state.data}
			compact={false}
			updateInterval={updateInterval}
			ipcPath={options.ipcPath}
		/>
	);
}

// ============================================================================
// COMMAND EXPORTS
// ============================================================================

export interface MonitorCommandResult {
	/** Exit code */
	exitCode: number;

	/** Error message if failed */
	error?: string;
}

/**
 * Start the Monitor dashboard
 *
 * @param options - Monitor command options
 * @returns Promise with result
 */
export async function monitorCommand(
	options: MonitorCommandOptions = {},
): Promise<MonitorCommandResult> {
	const ipcClient = new MonitorIPCClient(options);

	const {unmount} = render(
		<MonitorApp options={options} ipcClient={ipcClient} />,
	);

	// Handle graceful shutdown
	const handleShutdown = () => {
		ipcClient.disconnect();
		unmount();
		process.exit(0);
	};

	process.on('SIGINT', handleShutdown);
	process.on('SIGTERM', handleShutdown);

	return new Promise(resolve => {
		// Keep the process running until interrupted
		// Resolution happens on shutdown
		process.on('beforeExit', () => {
			resolve({exitCode: 0});
		});
	});
}

/**
 * Start the Monitor in standalone mode
 *
 * This is the main entry point for running the monitor
 * as a separate process.
 */
export async function startMonitor(
	options: MonitorCommandOptions = {},
): Promise<void> {
	try {
		await monitorCommand(options);
	} catch (error: any) {
		console.error('Monitor failed to start:', error.message);
		process.exit(1);
	}
}

// For compatibility with existing code structure
export {monitorCommand as default};
