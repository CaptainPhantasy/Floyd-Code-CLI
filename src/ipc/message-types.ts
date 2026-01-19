/**
 * IPC Message Types
 *
 * Shared type definitions for IPC communication between
 * Main process, Monitor dashboard, and other IPC clients.
 *
 * @module ipc/message-types
 */

// ============================================================================
// BASE MESSAGE TYPE
// ============================================================================

/**
 * Base IPC message type
 * All messages have a type and optional data payload
 */
export interface IPCMessage {
	/** Message type identifier */
	type: IPCMessageType;

	/** Message payload */
	data?: unknown;

	/** Timestamp when message was created */
	timestamp?: number;

	/** Unique message ID */
	id?: string;
}

/**
 * All possible IPC message types
 */
export type IPCMessageType =
	| 'config' // Configuration messages (client info, server info)
	| 'events' // Event stream updates
	| 'metrics' // System metrics updates
	| 'tools' // Tool execution updates
	| 'git' // Git status updates
	| 'browser' // Browser state updates
	| 'workers' // Worker state updates
	| 'alerts' // Alert notifications
	| 'command' // Command messages
	| 'response' // Command responses
	| 'error' // Error messages
	| 'heartbeat'; // Connection heartbeat

// ============================================================================
// CONFIG MESSAGES
// ============================================================================

/**
 * Config message - sent during connection handshake
 */
export interface ConfigMessage extends IPCMessage {
	type: 'config';
	data: ConfigData;
}

export interface ConfigData {
	/** Client type (monitor, main, etc.) */
	clientType?: string;

	/** Client ID */
	clientId?: string;

	/** Server ID */
	serverId?: string;

	/** Timestamp */
	timestamp: number;

	/** Additional config options */
	options?: Record<string, unknown>;
}

// ============================================================================
// EVENT MESSAGES
// ============================================================================

/**
 * Events message - stream event updates
 */
export interface EventsMessage extends IPCMessage {
	type: 'events';
	data: StreamEvent[];
}

export interface StreamEvent {
	/** Unique event ID */
	id: string;

	/** Event type */
	type: 'tool_call' | 'tool_response' | 'agent_message' | 'system' | 'error';

	/** Event severity */
	severity: 'info' | 'success' | 'warning' | 'error';

	/** Timestamp */
	timestamp: Date | string;

	/** Event message */
	message: string;

	/** Tool name (if applicable) */
	toolName?: string;

	/** Duration in ms (if applicable) */
	duration?: number;

	/** Additional metadata */
	metadata?: Record<string, unknown>;
}

// ============================================================================
// METRICS MESSAGES
// ============================================================================

/**
 * Metrics message - system metrics updates
 */
export interface MetricsMessage extends IPCMessage {
	type: 'metrics';
	data: SystemMetricsData;
}

export interface SystemMetricsData {
	/** CPU usage percentage (0-100) */
	cpu: number;

	/** Memory usage in MB */
	memory: {
		used: number;
		total: number;
		percentage: number;
	};

	/** Event loop lag in ms */
	eventLoopLag?: number;

	/** Active workers count */
	activeWorkers?: number;

	/** Timestamp */
	timestamp: Date;
}

// ============================================================================
// TOOL MESSAGES
// ============================================================================

/**
 * Tools message - tool execution updates
 */
export interface ToolsMessage extends IPCMessage {
	type: 'tools';
	data: ToolExecution[];
}

export interface ToolExecution {
	/** Unique execution ID */
	id: string;

	/** Tool name */
	toolName: string;

	/** Execution status */
	status: 'pending' | 'running' | 'completed' | 'failed';

	/** Start time */
	startTime: Date;

	/** End time (if completed) */
	endTime?: Date;

	/** Duration in ms */
	duration?: number;

	/** Tool arguments */
	args?: Record<string, unknown>;

	/** Result (if completed) */
	result?: unknown;

	/** Error (if failed) */
	error?: string;
}

// ============================================================================
// GIT MESSAGES
// ============================================================================

/**
 * Git message - git status updates
 */
export interface GitMessage extends IPCMessage {
	type: 'git';
	data: GitStatus;
}

export interface GitStatus {
	/** Current branch */
	branch: string;

	/** Current commit SHA */
	commit?: string;

	/** Modified files */
	modified: string[];

	/** Staged files */
	staged: string[];

	/** Untracked files */
	untracked: string[];

	/** Number of commits ahead/behind */
	ahead?: number;
	behind?: number;

	/** Timestamp */
	timestamp: Date;
}

// ============================================================================
// BROWSER MESSAGES
// ============================================================================

/**
 * Browser message - browser state updates
 */
export interface BrowserMessage extends IPCMessage {
	type: 'browser';
	data: BrowserState;
}

export interface BrowserState {
	/** Number of owned tabs */
	ownedTabs: number;

	/** Number of active safety rules */
	rules: number;

	/** Current browser status */
	status: 'idle' | 'active' | 'blocked' | 'error';

	/** Last action performed */
	lastAction?: string;

	/** Timestamp */
	timestamp: Date;
}

// ============================================================================
// WORKER MESSAGES
// ============================================================================

/**
 * Workers message - worker state updates
 */
export interface WorkersMessage extends IPCMessage {
	type: 'workers';
	data: WorkerState[];
}

export interface WorkerState {
	/** Worker ID */
	id: string;

	/** Worker name */
	name: string;

	/** Worker type */
	type: 'agent' | 'tool' | 'system';

	/** Worker status */
	status: 'idle' | 'working' | 'waiting' | 'blocked' | 'offline';

	/** Current task description */
	currentTask?: string;

	/** Progress percentage (0-100) */
	progress?: number;

	/** Last update timestamp */
	lastUpdate: Date;

	/** Completed tasks count */
	completedTasks: number;

	/** Failed tasks count */
	failedTasks: number;
}

// ============================================================================
// ALERT MESSAGES
// ============================================================================

/**
 * Alerts message - alert notifications
 */
export interface AlertsMessage extends IPCMessage {
	type: 'alerts';
	data: Alert[];
}

export interface Alert {
	/** Unique alert ID */
	id: string;

	/** Alert severity */
	severity: 'info' | 'warning' | 'error' | 'success';

	/** Alert type */
	type: 'system' | 'network' | 'performance' | 'security';

	/** Alert message */
	message: string;

	/** Timestamp */
	timestamp: Date;

	/** Whether alert is still active */
	active?: boolean;
}

// ============================================================================
// COMMAND MESSAGES
// ============================================================================

/**
 * Command message - command request
 */
export interface CommandMessage extends IPCMessage {
	type: 'command';
	data: CommandData;
}

export interface CommandData {
	/** Command name */
	command: string;

	/** Command arguments */
	args?: Record<string, unknown>;

	/** Request ID */
	requestId: string;

	/** Source client ID */
	sourceId?: string;
}

/**
 * Response message - command response
 */
export interface ResponseMessage extends IPCMessage {
	type: 'response';
	data: ResponseData;
}

export interface ResponseData {
	/** Request ID this responds to */
	requestId: string;

	/** Response status */
	status: 'success' | 'error';

	/** Response result (if success) */
	result?: unknown;

	/** Error message (if error) */
	error?: string;
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Error message - error notification
 */
export interface ErrorMessage extends IPCMessage {
	type: 'error';
	data: ErrorData;
}

export interface ErrorData {
	/** Error type */
	errorType: string;

	/** Error message */
	message: string;

	/** Stack trace (optional) */
	stack?: string;

	/** Source of error */
	source?: string;

	/** Timestamp */
	timestamp: Date;
}

// ============================================================================
// HEARTBEAT MESSAGES
// ============================================================================

/**
 * Heartbeat message - connection heartbeat
 */
export interface HeartbeatMessage extends IPCMessage {
	type: 'heartbeat';
	data?: {
		/** Timestamp */
		timestamp: number;

		/** Client ID */
		clientId?: string;
	};
}

// ============================================================================
// MESSAGE GUARDS
// ============================================================================

/**
 * Type guard for config messages
 */
export function isConfigMessage(message: IPCMessage): message is ConfigMessage {
	return message.type === 'config';
}

/**
 * Type guard for events messages
 */
export function isEventsMessage(message: IPCMessage): message is EventsMessage {
	return message.type === 'events';
}

/**
 * Type guard for metrics messages
 */
export function isMetricsMessage(
	message: IPCMessage,
): message is MetricsMessage {
	return message.type === 'metrics';
}

/**
 * Type guard for tools messages
 */
export function isToolsMessage(message: IPCMessage): message is ToolsMessage {
	return message.type === 'tools';
}

/**
 * Type guard for git messages
 */
export function isGitMessage(message: IPCMessage): message is GitMessage {
	return message.type === 'git';
}

/**
 * Type guard for browser messages
 */
export function isBrowserMessage(
	message: IPCMessage,
): message is BrowserMessage {
	return message.type === 'browser';
}

/**
 * Type guard for workers messages
 */
export function isWorkersMessage(
	message: IPCMessage,
): message is WorkersMessage {
	return message.type === 'workers';
}

/**
 * Type guard for alerts messages
 */
export function isAlertsMessage(message: IPCMessage): message is AlertsMessage {
	return message.type === 'alerts';
}

/**
 * Type guard for command messages
 */
export function isCommandMessage(
	message: IPCMessage,
): message is CommandMessage {
	return message.type === 'command';
}

/**
 * Type guard for response messages
 */
export function isResponseMessage(
	message: IPCMessage,
): message is ResponseMessage {
	return message.type === 'response';
}

/**
 * Type guard for error messages
 */
export function isErrorMessage(message: IPCMessage): message is ErrorMessage {
	return message.type === 'error';
}

/**
 * Type guard for heartbeat messages
 */
export function isHeartbeatMessage(
	message: IPCMessage,
): message is HeartbeatMessage {
	return message.type === 'heartbeat';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a new IPC message
 */
export function createMessage<T extends IPCMessage>(
	type: T['type'],
	data?: T['data'],
	timestamp: number = Date.now(),
): T {
	const message: IPCMessage = {
		type,
		timestamp,
	};

	if (data !== undefined) {
		message.data = data;
	}

	return message as T;
}

/**
 * Create a config message
 */
export function createConfigMessage(data: ConfigData): ConfigMessage {
	return createMessage('config', data);
}

/**
 * Create an events message
 */
export function createEventsMessage(events: StreamEvent[]): EventsMessage {
	return createMessage('events', events);
}

/**
 * Create a metrics message
 */
export function createMetricsMessage(
	metrics: SystemMetricsData,
): MetricsMessage {
	return createMessage('metrics', metrics);
}

/**
 * Create an error message
 */
export function createErrorMessage(error: ErrorData): ErrorMessage {
	return createMessage('error', error);
}

/**
 * Create a response message
 */
export function createResponseMessage(response: ResponseData): ResponseMessage {
	return createMessage('response', response);
}

// Re-export the base IPCMessage type for backward compatibility
export type {IPCMessage as default};
