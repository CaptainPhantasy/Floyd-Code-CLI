/**
 * LLM Provider Factory
 * Creates and configures LLM clients based on provider type
 */

export type LLMProvider = 'glm' | 'openai' | 'anthropic' | 'local';

export type ChunkCallback = (chunk: string) => void;

export interface LLMClient {
  sendMessage(message: string, onChunk?: ChunkCallback): Promise<string>;
}

export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  messages?: ChatMessage[];
  retryConfig?: RetryConfig;
}

export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public retryable?: boolean
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateRetryDelay(attempt: number, config: Required<RetryConfig>): number {
  const delay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );
  // Add jitter to avoid thundering herd
  return delay + Math.random() * 500;
}

/**
 * Check if an error is retryable based on status code
 */
function isRetryableError(error: unknown, config: Required<RetryConfig>): boolean {
  if (error instanceof LLMError) {
    if (error.code === 'MISSING_API_KEY' || error.code === 'NOT_IMPLEMENTED') {
      return false;
    }
    if (error.statusCode && config.retryableStatuses.includes(error.statusCode)) {
      return true;
    }
  }
  if (error instanceof TypeError) {
    // Network errors are usually retryable
    return true;
  }
  return false;
}

/**
 * Wrap a function with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
  context: string
): Promise<T> {
  const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (attempt < mergedConfig.maxRetries && isRetryableError(error, mergedConfig)) {
        const delay = calculateRetryDelay(attempt, mergedConfig);
        console.warn(`${context} failed, retrying in ${delay.toFixed(0)}ms (attempt ${attempt + 1}/${mergedConfig.maxRetries})`);
        await sleep(delay);
        continue;
      }

      // Not retryable or out of retries
      if (error instanceof LLMError) {
        error.retryable = isRetryableError(error, mergedConfig);
      }
      throw error;
    }
  }

  throw lastError;
}

export function createLLMClient(provider: LLMProvider, config: ProviderConfig): LLMClient {
  switch (provider) {
    case 'glm':
      return new GLMClientWrapper(config);

    case 'openai':
      return new OpenAIClientWrapper(config);

    case 'anthropic':
      throw new LLMError('Anthropic provider not yet implemented', 'NOT_IMPLEMENTED');

    case 'local':
      throw new LLMError('Local provider not yet implemented', 'NOT_IMPLEMENTED');

    default:
      throw new LLMError(`Unsupported provider: ${provider}`, 'UNSUPPORTED_PROVIDER');
  }
}

/**
 * OpenAI-compatible client (works with OpenAI, Ollama, LM Studio, etc.)
 */
class OpenAIClientWrapper implements LLMClient {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private messages: ChatMessage[] = [];
  private retryConfig: RetryConfig;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.baseURL = config.baseURL || 'https://api.openai.com/v1/chat/completions';
    this.model = config.model || 'gpt-4o-mini';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 4000;
    this.retryConfig = config.retryConfig || {};

    this.messages = [
      { role: 'system', content: 'You are FLOYD, a helpful AI assistant.' }
    ];

    if (config.messages) {
      this.messages.push(...config.messages);
    }
  }

  async sendMessage(message: string, onChunk?: ChunkCallback): Promise<string> {
    this.messages.push({ role: 'user', content: message });

    const shouldStream = onChunk !== undefined;

    const fullResponse = await withRetry(
      async () => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: this.model,
            messages: this.messages,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            stream: shouldStream,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new LLMError(
            `OpenAI API error: ${response.status} - ${errorText}`,
            'API_ERROR',
            response.status
          );
        }

        let responseText = '';

        if (shouldStream) {
          responseText = await this.handleStreaming(response, onChunk!);
        } else {
          const data = await response.json();
          responseText = data.choices?.[0]?.message?.content || '';
        }

        return responseText;
      },
      this.retryConfig,
      'OpenAI API request'
    );

    this.messages.push({ role: 'assistant', content: fullResponse });
    return fullResponse;
  }

  private async handleStreaming(response: Response, onChunk: ChunkCallback): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new LLMError('Response body is not readable', 'STREAM_ERROR');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const jsonStr = trimmed.slice(6);
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content;

            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch {
            // Skip invalid JSON - SSE parsing tolerance
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }

  getHistory(): ChatMessage[] {
    return [...this.messages];
  }

  clearHistory(): void {
    this.messages = [
      { role: 'system', content: 'You are FLOYD, a helpful AI assistant.' }
    ];
  }

  setHistory(messages: ChatMessage[]): void {
    this.messages = [...messages];
  }
}

class GLMClientWrapper implements LLMClient {
  private apiKey: string;
  private baseURL: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private messages: ChatMessage[] = [];
  private retryConfig: RetryConfig;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new LLMError('GLM API key is required', 'MISSING_API_KEY');
    }
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.z.ai/api/anthropic';
    this.model = config.model === 'claude-opus-4' ? 'GLM-4.7' : (config.model || 'GLM-4.7');
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 8192;
    this.retryConfig = config.retryConfig || {};

    // Initialize with system message
    this.messages = [
      { role: 'system', content: 'You are FLOYD, a helpful AI assistant.' }
    ];

    // Add any provided messages (for conversation history)
    if (config.messages) {
      this.messages.push(...config.messages);
    }
  }

  /**
   * Send a message and optionally stream the response
   */
  async sendMessage(message: string, onChunk?: ChunkCallback): Promise<string> {
    // Add user message to history
    this.messages.push({ role: 'user', content: message });

    const shouldStream = onChunk !== undefined;

    const fullResponse = await withRetry(
      async () => {
        const response = await fetch(this.baseURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.apiKey,
          },
          body: JSON.stringify({
            model: this.model,
            messages: this.messages,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            stream: shouldStream,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new LLMError(
            `GLM API error: ${response.status} - ${errorText}`,
            'API_ERROR',
            response.status
          );
        }

        let responseText = '';

        if (shouldStream) {
          // Handle streaming response
          responseText = await this.handleStreaming(response, onChunk!);
        } else {
          // Handle non-streaming response
          const data = await response.json();
          responseText = data.choices[0]?.message?.content || '';
        }

        return responseText;
      },
      this.retryConfig,
      'GLM API request'
    );

    // Add assistant response to history
    this.messages.push({ role: 'assistant', content: fullResponse });

    return fullResponse;
  }

  /**
   * Handle Server-Sent Events (SSE) streaming response
   */
  private async handleStreaming(response: Response, onChunk: ChunkCallback): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new LLMError('Response body is not readable', 'STREAM_ERROR');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const jsonStr = trimmed.slice(6); // Remove 'data: ' prefix
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content;

            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch {
            // Skip invalid JSON lines
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }

  /**
   * Get current message history
   */
  getHistory(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Clear message history (except system prompt)
   */
  clearHistory(): void {
    this.messages = [
      { role: 'system', content: 'You are FLOYD, a helpful AI assistant.' }
    ];
  }

  /**
   * Reset message history with custom messages
   */
  setHistory(messages: ChatMessage[]): void {
    this.messages = [...messages];
  }
}
