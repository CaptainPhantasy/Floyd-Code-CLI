/**
 * DeepSeek Client
 *
 * OpenAI-compatible client configured for DeepSeek API.
 * 
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.5 (DeepSeek Support)
 */

import { OpenAICompatibleClient, OpenAIClientOptions } from './openai-client.js';

/**
 * DeepSeek Client implementation
 */
export class DeepSeekClient extends OpenAICompatibleClient {
  constructor(options: OpenAIClientOptions) {
    super({
      ...options,
      baseURL: options.baseURL ?? 'https://api.deepseek.com',
      model: options.model ?? 'deepseek-chat',
    });
  }
}

/**
 * Factory function to create a DeepSeek client
 */
export function createDeepSeekClient(options: OpenAIClientOptions): DeepSeekClient {
  return new DeepSeekClient(options);
}
