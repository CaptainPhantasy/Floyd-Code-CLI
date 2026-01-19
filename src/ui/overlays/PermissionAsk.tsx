/**
 * Permission Ask Overlay (UI Layer)
 *
 * Re-exports the AskOverlay component from the permissions module.
 * This file serves as the UI layer bridge for the overlay system.
 */

export {
	AskOverlay,
	PermissionRequest,
	PermissionResponse,
} from '../../permissions/ask-overlay.js';
export type {
	PermissionScope,
	PermissionDecision,
} from '../../permissions/policies.js';
