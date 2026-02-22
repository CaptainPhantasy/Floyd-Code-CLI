/**
 * Permission Manager Stub
 *
 * Stub for ask-ui.tsx to avoid JSX compilation issues in minimal build.
 * The full implementation is in ask-ui.tsx.
 *
 * @module permissions/ask-ui-stub
 */

// Stub types for permission scope
export enum PermissionScope {
	Global = 'global',
	Project = 'project',
	Session = 'session',
}

export const ALWAYS_ALLOW_TOOLS: string[] = ['read_file', 'list_directory'];

export type PermissionLevel = 'ask' | 'allow' | 'deny';

export interface PermissionCheck {
	allowed: boolean;
	reason?: string;
	scope?: PermissionScope;
}

export interface PermissionRequest {
	id: string;
	toolName: string;
	arguments: Record<string, unknown>;
	riskLevel: 'low' | 'medium' | 'high' | 'critical';
	recommendedAction: PermissionLevel;
}

export interface PermissionResponse {
	allowed: boolean;
	remember: boolean;
	scope?: PermissionScope;
}

/**
 * Permission Manager Stub
 *
 * Stub implementation for compilation. Full implementation in ask-ui.tsx.
 */
export class PermissionManager {
	constructor(private _allowedTools: string[] = [], private _cwd: string = process.cwd()) {}

	/**
	 * Check if a tool execution is allowed
	 */
	async checkPermission(toolName: string, args: Record<string, unknown>): Promise<PermissionCheck> {
		// Stub: always allow for now
		if (ALWAYS_ALLOW_TOOLS.includes(toolName)) {
			return {allowed: true, reason: 'Always allowed tool'};
		}
		return {allowed: true, reason: 'Stub - always allow'};
	}

	/**
	 * Request permission from user
	 */
	async requestPermission(request: PermissionRequest): Promise<PermissionResponse> {
		// Stub: auto-approve
		return {allowed: true, remember: false, scope: PermissionScope.Session};
	}

	/**
	 * Clear all stored permissions
	 */
	async clearPermissions(): Promise<void> {
		// Stub: no-op
	}

	/**
	 * Get stored permissions
	 */
	getStoredPermissions(): Map<string, PermissionLevel> {
		return new Map();
	}
}
