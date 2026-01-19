/**
 * IPC Event Definitions
 * Structured events for communication between Main and Monitor
 */

export type EventType =
	// Agent events
	| 'agent.status'
	| 'agent.thinking'
	| 'agent.streaming'
	| 'agent.error'
	// Tool events
	| 'tool.start'
	| 'tool.progress'
	| 'tool.complete'
	| 'tool.error'
	// Permission events
	| 'perm.request'
	| 'perm.approved'
	| 'perm.denied'
	// Git events
	| 'git.status'
	| 'git.diff'
	// System events
	| 'sys.metrics'
	| 'sys.error';

export interface BaseEvent {
	type: EventType;
	timestamp: number;
	sessionId: string;
}

export interface AgentStatusEvent extends BaseEvent {
	type: 'agent.status';
	status: 'idle' | 'thinking' | 'streaming' | 'tooling' | 'error';
	task?: string;
}

export interface ToolEvent extends BaseEvent {
	type: 'tool.start' | 'tool.progress' | 'tool.complete' | 'tool.error';
	toolName: string;
	toolArgs?: unknown;
	duration?: number;
	error?: string;
}

export interface PermissionEvent extends BaseEvent {
	type: 'perm.request' | 'perm.approved' | 'perm.denied';
	toolName: string;
	risk: 'low' | 'medium' | 'high';
	decision?: 'approve' | 'deny';
	scope?: 'once' | 'session' | 'always';
}

export interface GitEvent extends BaseEvent {
	type: 'git.status' | 'git.diff';
	branch?: string;
	dirty?: boolean;
	changed?: number;
	staged?: number;
	diff?: string;
}

export interface SystemMetricsEvent extends BaseEvent {
	type: 'sys.metrics';
	cpu: number;
	memory: number;
	rss: number;
	heapUsed: number;
	heapTotal: number;
	eventLoopLag?: number;
}

export type FloydEvent =
	| AgentStatusEvent
	| ToolEvent
	| PermissionEvent
	| GitEvent
	| SystemMetricsEvent;

export function createEvent(
	type: EventType,
	sessionId: string,
	data: Omit<FloydEvent, keyof BaseEvent>,
): FloydEvent {
	return {
		type,
		timestamp: Date.now(),
		sessionId,
		...data,
	} as FloydEvent;
}
