/**
 * LLM Module Index
 *
 * Exports all LLM clients and the factory function for creating clients.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.5
 */

// Re-export types
export * from './types.js';

// Export individual clients
export { GLMClient, type GLMClientOptions } from './glm-client.js';
export { AnthropicClient, type AnthropicClientOptions } from './anthropic-client.js';
export { OpenAICompatibleClient, type OpenAIClientOptions } from './openai-client.js';

import type { LLMClient, LLMClientOptions } from './types.js';
import { GLMClient } from './glm-client.js';
import { AnthropicClient } from './anthropic-client.js';
import { OpenAICompatibleClient } from './openai-client.js';

/**
 * Provider endpoints for auto-detection
 */
const PROVIDER_ENDPOINTS: Record<string, string> = {
  anthropic: 'api.anthropic.com',
  openai: 'api.openai.com',
  zai: 'api.z.ai',
  glm: 'open.bigmodel.cn',
  deepseek: 'api.deepseek.com',
};

/**
 * Detect provider from base URL
 */
function detectProviderFromURL(baseURL?: string): LLMClientOptions['provider'] | undefined {
  if (!baseURL) return undefined;

  for (const [provider, domain] of Object.entries(PROVIDER_ENDPOINTS)) {
    if (baseURL.includes(domain)) {
      return provider as LLMClientOptions['provider'];
    }
  }
  return undefined;
}

/**
 * Create an LLM client based on provider configuration
 *
 * @param options - Client options including apiKey, provider, baseURL, model
 * @returns Configured LLM client
 *
 * @example
 * ```typescript
 * // Anthropic client
 * const anthropic = createLLMClient({
 *   apiKey: process.env.ANTHROPIC_API_KEY!,
 *   provider: 'anthropic',
 * });
 *
 * // Z.ai / GLM client
 * const glm = createLLMClient({
 *   apiKey: process.env.GLM_API_KEY!,
 *   provider: 'zai',
 * });
 *
 * // Auto-detect from URL
 * const client = createLLMClient({
 *   apiKey: 'key',
 *   baseURL: 'https://api.anthropic.com',
 * });
 * ```
 */
export function createLLMClient(options: LLMClientOptions): LLMClient {
  // Determine provider (explicit > detected from URL > default)
  let provider = options.provider;

  if (!provider && options.baseURL) {
    provider = detectProviderFromURL(options.baseURL);
  }

  if (!provider) {
    // Default to zai/glm if no provider specified
    provider = 'zai';
  }

  switch (provider) {
    case 'anthropic':
      return new AnthropicClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL ?? 'https://api.anthropic.com',
        model: options.model ?? 'claude-sonnet-4-20250514',
        maxTokens: options.maxTokens,
        defaultHeaders: options.defaultHeaders,
      });

    case 'openai':
      return new OpenAICompatibleClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL ?? 'https://api.openai.com/v1',
        model: options.model ?? 'gpt-4o',
        maxTokens: options.maxTokens,
        defaultHeaders: options.defaultHeaders,
      });

    case 'zai':
    case 'glm':
      return new GLMClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL ?? 'https://api.z.ai/api/coding/paas/v4',
        model: options.model ?? 'glm-4.7-flash',
        maxTokens: options.maxTokens,
        defaultHeaders: options.defaultHeaders,
      });

    case 'deepseek':
      return new OpenAICompatibleClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL ?? 'https://api.deepseek.com/v1',
        model: options.model ?? 'deepseek-chat',
        maxTokens: options.maxTokens,
        defaultHeaders: options.defaultHeaders,
      });

    case 'custom':
    default:
      // For custom providers, use OpenAI-compatible client
      return new OpenAICompatibleClient({
        apiKey: options.apiKey,
        baseURL: options.baseURL ?? 'https://api.openai.com/v1',
        model: options.model ?? 'gpt-4o',
        maxTokens: options.maxTokens,
        defaultHeaders: options.defaultHeaders,
      });
  }
}

/**
 * Create an Anthropic client (convenience function)
 */
export function createAnthropicClient(apiKey: string, model?: string): AnthropicClient {
  return new AnthropicClient({
    apiKey,
    model: model ?? 'claude-sonnet-4-20250514',
  });
}

/**
 * Create a GLM/Z.ai client (convenience function)
 */
export function createGLMClient(apiKey: string, model?: string): GLMClient {
  return new GLMClient({
    apiKey,
    model: model ?? 'glm-4.7-flash',
  });
}

/**
 * Create an OpenAI client (convenience function)
 */
export function createOpenAIClient(apiKey: string, model?: string): OpenAICompatibleClient {
  return new OpenAICompatibleClient({
    apiKey,
    model: model ?? 'gpt-4o',
  });
}
