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
	 */
	async checkPermission(toolName: string): Promise<PermissionLevel> {
		// Always allow safe tools
		if (ALWAYS_ALLOW_TOOLS.includes(toolName)) {
			return 'allow';
		}

		// Check stored decisions
		const stored = await this.store.checkPermission(toolName);
		if (stored === 'allow') return 'allow';
		if (stored === 'deny') return 'deny';

		return 'ask';
	}

	/**
	 * Request permission for a tool call
	 */
	async requestPermission(
		toolName: string,
		arguments_: Record<string, unknown>,
	): Promise<PermissionCheck> {
		// Check if we have a stored decision
		const stored = await this.store.checkPermission(toolName);
		if (stored) {
			return {
				allowed: stored === 'allow',
				reason:
					stored === 'allow' ? 'Previously approved' : 'Previously denied',
			};
		}

		// Classify risk
		const assessment = classifyRisk(toolName, arguments_);
		const recommended = getRecommendedAction(assessment.level);

		// Auto-allow low risk operations
		if (recommended === 'allow' && assessment.level === RiskLevel.LOW) {
			return {
				allowed: true,
				reason: 'Low-risk operation auto-approved',
			};
		}

		// Create pending request
		const requestId = `${toolName}-${Date.now()}`;
		const request: PermissionRequest = {
			id: requestId,
			toolName,
			arguments: arguments_,
			timestamp: Date.now(),
		};

		// Return a promise that resolves when UI responds
		return new Promise(resolve => {
			this.pendingRequests.set(requestId, {
				toolName,
				arguments: arguments_,
				resolve,
			});
			this.currentRequest = request;
		});
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
