/**
 * Tool Types - Floyd Wrapper
 *
 * Standardized error and response interfaces for all tools.
 * These provide unified error handling across all tool implementations.
 * Aligned with src/types.ts ToolResult format (code/details).
 */

// ============================================================================
// Error Types
// ============================================================================

/**
 * Standardized error codes for tools (Phase 2, Item 6)
 * Aligned with ErrorCode from src/types.ts
 * Each error code maps to a specific category of failure
 */
export type ToolErrorCode =
	| 'FILE_NOT_FOUND'              // File doesn't exist at path
	| 'PERMISSION_DENIED'           // OS/file system permission denied
	| 'INVALID_INPUT'               // Input validation failed
	| 'COMMAND_NOT_FOUND'           // Executable/command not found
	| 'BROWSER_EXTENSION_UNAVAILABLE' // Browser extension not installed
	| 'NO_MATCH_FOUND'              // Search/replace found no matches
	| 'PROTECTED_BRANCH'            // Git operation on protected branch
	| 'PATH_TRAVERSAL_DETECTED'     // Security: path traversal attempt
	| 'VALIDATION_ERROR'            // Zod schema validation failed
	| 'TOOL_EXECUTION_FAILED'       // Tool threw uncaught error
	| 'DELETE_FILE_ERROR'           // Error deleting file
	| 'EDIT_RANGE_ERROR'            // Error editing line range
	| 'INSERT_AT_ERROR'             // Error inserting at line
	| 'DELETE_RANGE_ERROR'          // Error deleting line range
	| 'FILE_READ_ERROR'             // Error reading file
	| 'FILE_WRITE_ERROR'            // Error writing file
	| 'FILE_EDIT_ERROR'             // Error editing file
	| 'FILE_REPLACE_ERROR'          // Error replacing text
	| 'NOT_A_FILE'                  // Path is a directory, not a file
	| 'IS_DIRECTORY'                // Cannot delete directory with file tool
	| 'NO_VALID_DIFF'               // No valid diff found
	| 'NETWORK_ERROR'               // Network operation failed
	| 'PARSE_ERROR';                // Failed to parse response

/**
 * Node.js errno codes that map to tool error codes
 */
export type ErrnoCode =
	| 'ENOENT'     // No such file or directory -> FILE_NOT_FOUND
	| 'EACCES'     // Permission denied -> PERMISSION_DENIED
	| 'EPERM'      // Operation not permitted -> PERMISSION_DENIED
	| 'EISDIR'     // Is a directory -> NOT_A_FILE
	| 'ENOTDIR'    // Not a directory -> IS_DIRECTORY
	| 'EEXIST'     // File exists -> FILE_WRITE_ERROR
	| 'EBUSY'      // Resource busy -> FILE_WRITE_ERROR
	| 'ENOENT';    // Also covers missing file

/**
 * Map Node.js errno to ToolErrorCode
 */
export function errnoToErrorCode(errno: string | undefined): ToolErrorCode {
	switch (errno) {
		case 'ENOENT':
			return 'FILE_NOT_FOUND';
		case 'EACCES':
		case 'EPERM':
			return 'PERMISSION_DENIED';
		case 'EISDIR':
			return 'NOT_A_FILE';
		case 'ENOTDIR':
			return 'IS_DIRECTORY';
		case 'EEXIST':
		case 'EBUSY':
			return 'FILE_WRITE_ERROR';
		default:
			return 'TOOL_EXECUTION_FAILED';
	}
}

// ============================================================================
// Error Construction Helpers
// ============================================================================

/**
 * Create a standardized error object (Phase 2, Item 6)
 * Aligned with ToolResult.error format from src/types.ts
 */
export interface ToolError {
	/** Error code for programmatic handling */
	code: ToolErrorCode;
	/** Human-readable error message */
	message: string;
	/** Additional error details */
	details?: unknown;
}

/**
 * Create an error object
 */
export function createError(code: ToolErrorCode, message: string, details?: unknown): ToolError {
	return { code, message, details };
}

/**
 * Create a file not found error with errno detection
 */
export function createFileNotFoundError(filePath: string, errno?: string): ToolError {
	const code = errnoToErrorCode(errno);
	return {
		code,
		message: errno === 'ENOENT'
			? `File not found: ${filePath}`
			: `Cannot access file: ${filePath}`,
		details: { filePath, errno }
	};
}

/**
 * Create a permission denied error with errno detection
 */
export function createPermissionDeniedError(resource: string, errno?: string): ToolError {
	const code = errnoToErrorCode(errno);
	return {
		code,
		message: errno === 'EACCES' || errno === 'EPERM'
			? `Permission denied: ${resource}`
			: `Access denied: ${resource}`,
		details: { resource, errno }
	};
}

/**
 * Create a validation error
 */
export function createValidationError(message: string, details?: unknown): ToolError {
	return { code: 'VALIDATION_ERROR', message, details };
}

/**
 * Create a "not found" error
 */
export function createNotFoundError(resourceType: string, identifier: string): ToolError {
	return {
		code: 'FILE_NOT_FOUND',
		message: `${resourceType} not found: ${identifier}`,
		details: { resourceType, identifier }
	};
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if an error is a specific error code
 */
export function hasErrorCode(error: ToolError | undefined, code: ToolErrorCode): boolean {
	return error?.code === code;
}

/**
 * Check if error is a file not found error (includes ENOENT detection)
 */
export function isFileNotFound(error: ToolError | undefined): boolean {
	return error?.code === 'FILE_NOT_FOUND';
}

/**
 * Check if error is a permission denied error
 */
export function isPermissionDenied(error: ToolError | undefined): boolean {
	return error?.code === 'PERMISSION_DENIED';
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: ToolError | undefined): boolean {
	return error?.code === 'VALIDATION_ERROR';
}
