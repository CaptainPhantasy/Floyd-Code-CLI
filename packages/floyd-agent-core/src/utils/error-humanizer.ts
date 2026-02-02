/**
 * Error Humanizer
 *
 * Converts technical errors into human-readable messages.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Utility
 */

/**
 * Humanized error result
 */
export interface HumanizedError {
  /** User-friendly error message */
  message: string;
  /** Original error message */
  originalMessage: string;
  /** Error category */
  category: 'network' | 'auth' | 'rate_limit' | 'server' | 'client' | 'unknown';
  /** Suggested action */
  suggestion?: string;
  /** Whether the error is retryable */
  retryable: boolean;
}

/**
 * Error patterns for classification
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  category: HumanizedError['category'];
  message: string;
  suggestion?: string;
  retryable: boolean;
}> = [
  // Network errors
  {
    pattern: /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|network/i,
    category: 'network',
    message: 'Unable to connect to the API server',
    suggestion: 'Check your internet connection and try again',
    retryable: true,
  },
  // Auth errors
  {
    pattern: /401|unauthorized|invalid.*key|authentication/i,
    category: 'auth',
    message: 'Authentication failed',
    suggestion: 'Check your API key is valid and has not expired',
    retryable: false,
  },
  {
    pattern: /403|forbidden|permission denied/i,
    category: 'auth',
    message: 'Access denied',
    suggestion: 'Check your API key has the required permissions',
    retryable: false,
  },
  // Rate limit errors
  {
    pattern: /429|rate.?limit|too many requests|quota/i,
    category: 'rate_limit',
    message: 'Rate limit exceeded',
    suggestion: 'Wait a moment and try again, or upgrade your API plan',
    retryable: true,
  },
  // Server errors
  {
    pattern: /500|502|503|504|internal.*error|server.*error|overloaded/i,
    category: 'server',
    message: 'The API server is experiencing issues',
    suggestion: 'Try again in a few moments',
    retryable: true,
  },
  // Client errors
  {
    pattern: /400|bad request|invalid.*request|malformed/i,
    category: 'client',
    message: 'Invalid request',
    suggestion: 'Check your request parameters',
    retryable: false,
  },
  {
    pattern: /404|not found/i,
    category: 'client',
    message: 'Resource not found',
    suggestion: 'Check the API endpoint URL',
    retryable: false,
  },
  {
    pattern: /413|payload.*large|content.*length/i,
    category: 'client',
    message: 'Request too large',
    suggestion: 'Reduce the size of your request',
    retryable: false,
  },
];

/**
 * Humanize an error into a user-friendly format
 *
 * @param error - Error object or string
 * @returns Humanized error with category and suggestions
 */
export function humanizeError(error: Error | string): HumanizedError {
  const originalMessage = error instanceof Error ? error.message : error;

  // Check against known patterns
  for (const { pattern, category, message, suggestion, retryable } of ERROR_PATTERNS) {
    if (pattern.test(originalMessage)) {
      return {
        message,
        originalMessage,
        category,
        suggestion,
        retryable,
      };
    }
  }

  // Unknown error
  return {
    message: 'An unexpected error occurred',
    originalMessage,
    category: 'unknown',
    suggestion: 'Try again or check the logs for more details',
    retryable: true,
  };
}

/**
 * Format humanized error for display
 *
 * @param error - Humanized error
 * @param includeDetails - Whether to include technical details
 * @returns Formatted error string
 */
export function formatHumanizedError(error: HumanizedError, includeDetails = false): string {
  let result = error.message;

  if (error.suggestion) {
    result += `. ${error.suggestion}`;
  }

  if (includeDetails && error.originalMessage !== error.message) {
    result += ` (${error.originalMessage})`;
  }

  return result;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error | string): boolean {
  return humanizeError(error).retryable;
}

/**
 * Get error category
 */
export function getErrorCategory(error: Error | string): HumanizedError['category'] {
  return humanizeError(error).category;
}
