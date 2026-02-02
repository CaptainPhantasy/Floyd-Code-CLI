/**
 * Floyd Agent API Handler
 *
 * Handles Floyd Agent API requests and routes them to the appropriate tools.
 * Maps the Floyd Agent API contract to the existing toolRegistry.
 */

import { toolRegistry } from '../tools/index.js';
import { logger } from '../utils/logger.js';
import type {
  FloydAgentRequest,
  FloydAgentResponse,
  FloydAgentMethod,
  FloydAgentErrorCode,
} from './floyd-agent-types.js';

// ============================================================================
// Method Name Mapping (Agent API → Tool Registry)
// ============================================================================

/**
 * Maps Floyd Agent API method names to tool registry names
 */
const METHOD_TO_TOOL: Record<string, string> = {
  // Git Operations
  'git_status': 'git_status',
  'git_diff': 'git_diff',
  'git_log': 'git_log',
  'git_commit': 'git_commit',
  'git_stage': 'git_stage',
  'git_unstage': 'git_unstage',
  'git_branch': 'git_branch',
  'is_protected_branch': 'is_protected_branch',
  'git_merge': 'git_merge',

  // Cache Operations
  'cache_store': 'cache_store',
  'cache_retrieve': 'cache_retrieve',
  'cache_delete': 'cache_delete',
  'cache_clear': 'cache_clear',
  'cache_list': 'cache_list',
  'cache_search': 'cache_search',
  'cache_stats': 'cache_stats',
  'cache_prune': 'cache_prune',
  'cache_store_pattern': 'cache_store_pattern',
  'cache_store_reasoning': 'cache_store_reasoning',
  'cache_load_reasoning': 'cache_load_reasoning',
  'cache_archive_reasoning': 'cache_archive_reasoning',

  // File Operations
  'read_file': 'read',
  'write': 'write',
  'edit_file': 'edit_file',
  'search_replace': 'search_replace',
  'list_directory': 'list_directory',
  'delete_file': 'delete_file',
  'move_file': 'move_file',

  // Browser Automation
  'browser_status': 'browser_status',
  'browser_navigate': 'browser_navigate',
  'browser_read_page': 'browser_read_page',
  'browser_screenshot': 'browser_screenshot',
  'browser_click': 'browser_click',
  'browser_type': 'browser_type',
  'browser_find': 'browser_find',
  'browser_get_tabs': 'browser_get_tabs',
  'browser_create_tab': 'browser_create_tab',

  // Search & Discovery
  'grep': 'grep',
  'codebase_search': 'codebase_search',

  // System Operations
  'run': 'run',
  'fetch': 'fetch',

  // Verification & Testing
  'verify': 'verify',
  'safe_refactor': 'safe_refactor',
  'impact_simulate': 'impact_simulate',
  'assess_patch_risk': 'assess_patch_risk',

  // Patch Operations
  'apply_unified_diff': 'apply_unified_diff',
  'edit_range': 'edit_range',
  'insert_at': 'insert_at',
  'delete_range': 'delete_range',
};

// ============================================================================
// Error Code Mapping
// ============================================================================

/**
 * Maps errors to Floyd Agent API error codes
 */
function getErrorCode(error: unknown): FloydAgentErrorCode {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('not found') || message.includes('enoent')) {
      return 'FILE_NOT_FOUND';
    }
    if (message.includes('permission') || message.includes('eacces') || message.includes('epERM')) {
      return 'PERMISSION_DENIED';
    }
    if (message.includes('timeout') || message.includes('etimedout')) {
      return 'TIMEOUT';
    }
    if (message.includes('git')) {
      return 'GIT_ERROR';
    }
  }

  return 'UNKNOWN_ERROR';
}

// ============================================================================
// Request Handler
// ============================================================================

/**
 * Handle a Floyd Agent API request
 *
 * @param request - Floyd Agent API request
 * @returns Promise<FloydAgentResponse>
 */
export async function handleFloydAgentRequest(
  request: FloydAgentRequest
): Promise<FloydAgentResponse> {
  const startTime = Date.now();

  logger.info('[FloydAgent] Received request', {
    id: request.id,
    method: request.method,
    params: Object.keys(request.params),
  });

  try {
    // Get tool from registry
    const toolName = METHOD_TO_TOOL[request.method];

    if (!toolName) {
      throw new Error(`Unknown method: ${request.method}`);
    }

    const tool = toolRegistry.get(toolName);

    if (!tool) {
      throw new Error(`Tool not found in registry: ${toolName}`);
    }

    // Execute tool with params
    logger.debug('[FloydAgent] Executing tool', {
      id: request.id,
      tool: toolName,
      params: request.params,
    });

    const result = await tool.execute(request.params);

    const completedTime = Date.now();

    logger.info('[FloydAgent] Request completed', {
      id: request.id,
      method: request.method,
      duration: completedTime - startTime,
    });

    // Return success response
    return {
      id: request.id,
      success: true,
      data: result,
      timing: {
        started: startTime,
        completed: completedTime,
        duration: completedTime - startTime,
      },
    };

  } catch (error) {
    const completedTime = Date.now();
    const errorCode = getErrorCode(error);

    logger.error('[FloydAgent] Request failed', {
      id: request.id,
      method: request.method,
      error: error instanceof Error ? error.message : String(error),
      code: errorCode,
    });

    // Determine if error is recoverable
    const recoverable =
      errorCode === 'TIMEOUT' ||
      errorCode === 'COMMAND_FAILED' ||
      errorCode === 'GIT_ERROR' ||
      errorCode === 'BROWSER_ERROR';

    // Return error response
    return {
      id: request.id,
      success: false,
      error: {
        code: errorCode,
        message: error instanceof Error ? error.message : String(error),
        details: error,
        recoverable,
      },
      timing: {
        started: startTime,
        completed: completedTime,
        duration: completedTime - startTime,
      },
    };
  }
}

// ============================================================================
// Tool List Helper
// ============================================================================

/**
 * Get list of available methods
 *
 * @returns Array of method names
 */
export function getAvailableMethods(): string[] {
  return Object.keys(METHOD_TO_TOOL);
}

/**
 * Get method info
 *
 * @param method - Method name
 * @returns Tool info or null
 */
export function getMethodInfo(method: FloydAgentMethod): any {
  const toolName = METHOD_TO_TOOL[method];
  return toolName ? toolRegistry.get(toolName) : null;
}
