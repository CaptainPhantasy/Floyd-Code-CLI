/**
 * IPC Command Definitions
 * Commands sent from Monitor to Main
 */

export type CommandType =
	| 'control.pause'
	| 'control.resume'
	| 'control.approve'
	| 'control.deny'
	| 'control.focus'
	| 'query.status'
	| 'query.metrics'
	| 'nav.switch';

export interface BaseCommand {
	type: CommandType;
	id: string;
	timestamp: number;
}

export interface ControlCommand extends BaseCommand {
	type: 'control.pause' | 'control.resume' | 'control.approve' | 'control.deny';
	toolId?: string;
}

export interface QueryCommand extends BaseCommand {
	type: 'query.status' | 'query.metrics';
}

export interface NavigationCommand extends BaseCommand {
	type: 'nav.switch';
	target: 'main' | 'monitor';
}

export type FloydCommand = ControlCommand | QueryCommand | NavigationCommand;

export function createCommand(
	type: CommandType,
	data: Partial<Omit<FloydCommand, keyof BaseCommand>> = {},
): FloydCommand {
	return {
		type,
		id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
		timestamp: Date.now(),
		...data,
	} as FloydCommand;
}
