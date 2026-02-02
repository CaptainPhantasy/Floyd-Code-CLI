/**
 * LLM Client Types
 *
 * Type definitions for the LLM abstraction layer.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.1
 */

/**
 * LLM message role
 */
export type LLMRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * LLM message
 */
export interface LLMMessage {
  /** Message role */
  role: LLMRole;
  /** Message content */
  content: string;
  /** Tool call ID (for tool responses) */
  tool_call_id?: string;
  /** Tool name (for tool responses) */
  name?: string;
}

/**
 * Tool definition for LLM
 */
export interface LLMTool {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** JSON Schema for input parameters */
  inputSchema: Record<string, unknown>;
}

/**
 * Tool call from LLM
 */
export interface LLMToolCall {
  /** Tool call ID */
  id: string;
  /** Tool name */
  name: string;
  /** Tool input arguments */
  input: Record<string, unknown>;
}

/**
 * Stream chunk from LLM
 */
export interface StreamChunk {
  /** Text token */
  token?: string;
  /** Tool call ID */
  tool_call_id?: string;
  /** Tool call details */
  tool_call?: LLMToolCall;
  /** Tool use complete flag */
  tool_use_complete?: boolean;
  /** Stream done flag */
  done?: boolean;
  /** Stop reason */
  stop_reason?: string;
  /** Error message */
  error?: string;
  /** Token usage */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Stream event types
 */
export type StreamEventType = 'text' | 'tool_use' | 'tool_result' | 'error' | 'done';

/**
 * Stream event
 */
export interface StreamEvent {
  /** Event type */
  type: StreamEventType;
  /** Text content */
  content?: string;
  /** Tool call details */
  toolCall?: LLMToolCall;
  /** Error message */
  error?: string;
}

/**
 * LLM client options
 */
export interface LLMClientOptions {
  /** API key */
  apiKey: string;
  /** API endpoint URL */
  baseURL?: string;
  /** Model name */
  model?: string;
  /** Max tokens */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
  /** Default headers */
  defaultHeaders?: Record<string, string>;
  /** Provider type */
  provider?: 'anthropic' | 'openai' | 'zai' | 'glm' | 'deepseek' | 'custom';
}

/**
 * LLM chat callbacks
 */
export interface LLMChatCallbacks {
  /** Called on each chunk */
  onChunk?: (chunk: StreamChunk) => void;
  /** Called when tool starts */
  onToolStart?: (toolCall: LLMToolCall) => void;
  /** Called when done */
  onDone?: () => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * LLM client interface
 */
export interface LLMClient {
  /** Get the model name */
  getModel(): string;
  /** Get the base URL */
  getBaseURL(): string;
  /** Stream chat completion */
  chat(
    messages: LLMMessage[],
    tools: LLMTool[],
    callbacks?: LLMChatCallbacks
  ): AsyncGenerator<StreamChunk, void, unknown>;
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  /** Input tokens */
  inputTokens: number;
  /** Output tokens */
  outputTokens: number;
  /** Total tokens */
  total: number;
  /** Cost estimate (if available) */
  cost?: number;
}
