/**
 * Permission Manager Integration
 *
 * Integrates the permission system with the agent engine.
 * Manages permission requests, responses, and UI state.
 */

import {PermissionStore} from './store.js';
import {
	classifyRisk,
	RiskLevel,
	getRecommendedAction,
} from './risk-classifier.js';
import {PermissionScope, ALWAYS_ALLOW_TOOLS} from './policies.js';
import {
	AskOverlay,
	type PermissionRequest,
	type PermissionResponse,
} from './ask-overlay.js';

export type PermissionLevel = 'ask' | 'allow' | 'deny';

export interface PermissionCheck {
	allowed: boolean;
	reason?: string;
	scope?: PermissionScope;
}

export interface PendingRequest {
	toolName: string;
	arguments: Record<string, unknown>;
	resolve: (decision: PermissionCheck) => void;
}

/**
 * Permission Manager
 *
 * Orchestrates permission checking, storage, and UI display.
 */
export class PermissionManager {
	private store: PermissionStore;
	private pendingRequests: Map<string, PendingRequest>;
	private currentRequest: PermissionRequest | null = null;

	constructor(_allowedTools: string[] = [], cwd: string = process.cwd()) {
		this.store = new PermissionStore(cwd);
		this.pendingRequests = new Map();

		// Initialize store
		this.store.load().catch(error => {
			console.error('Failed to initialize permission store:', error);
		});
	}

	/**
	 * Check if a tool needs permission
	 * UNRESTRICTED YOLO MODE - ALWAYS ALLOW EVERYTHING
	 */
	async checkPermission(_toolName: string): Promise<PermissionLevel> {
		// UNRESTRICTED: All tools auto-approved, no prompts, no restrictions
		return 'allow';
	}

	/**
	 * Request permission for a tool call
	 * UNRESTRICTED YOLO MODE - ALWAYS ALLOW, NO PROMPTS
	 */
	async requestPermission(
		_toolName: string,
		_arguments_: Record<string, unknown>,
	): Promise<PermissionCheck> {
		// UNRESTRICTED: Auto-approve ALL operations immediately
		return {
			allowed: true,
			reason: 'YOLO mode - all operations auto-approved',
		};
	}

	/**
	 * Handle permission response from UI
	 */
	handleResponse(response: PermissionResponse): void {
		const pending = this.pendingRequests.get(response.id);
		if (!pending) return;

		// Store the decision
		this.store
			.recordDecision(pending.toolName, response.decision, response.scope)
			.catch(error => {
				console.error('Failed to save permission decision:', error);
			});

		// Resolve the pending request
		const allowed = response.decision === 'allow';
		pending.resolve({
			allowed,
			reason: allowed ? 'User approved' : 'User denied',
			scope: response.scope,
		});

		// Clean up
		this.pendingRequests.delete(response.id);
		if (this.currentRequest?.id === response.id) {
			this.currentRequest = null;
		}
	}

	/**
	 * Get the current pending request for UI display
	 */
	getCurrentRequest(): PermissionRequest | null {
		return this.currentRequest;
	}

	/**
	 * Check if there's a pending request
	 */
	hasPendingRequest(): boolean {
		return this.currentRequest !== null;
	}

	/**
	 * Cancel a pending request (e.g., on timeout)
	 */
	cancelRequest(requestId: string): void {
		const pending = this.pendingRequests.get(requestId);
		if (pending) {
			pending.resolve({
				allowed: false,
				reason: 'Request cancelled',
			});
			this.pendingRequests.delete(requestId);
		}
		if (this.currentRequest?.id === requestId) {
			this.currentRequest = null;
		}
	}

	/**
	 * Clear all stored permissions
	 */
	async clearAll(): Promise<void> {
		await this.store.clearAll();
	}

	/**
	 * Get risk assessment for a tool call
	 */
	getRiskAssessment(toolName: string, arguments_: Record<string, unknown>) {
		return classifyRisk(toolName, arguments_);
	}

	// Legacy methods for backward compatibility
	grantPermission(toolName: string) {
		this.store.recordDecision(toolName, 'allow', 'session').catch(error => {
			console.error('Failed to grant permission:', error);
		});
	}

	denyPermission(toolName: string) {
		this.store.recordDecision(toolName, 'deny', 'session').catch(error => {
			console.error('Failed to deny permission:', error);
		});
	}
}

export {AskOverlay, PermissionRequest, PermissionResponse};
export * from './risk-classifier.js';
export * from './policies.js';
export * from './store.js';
