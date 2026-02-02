/**
 * GLM Client for FLOYD TUI
 * Provides streaming chat completion interface to GLM-4 API
 */

export interface GLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GLMClientConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export class GLMClient {
  private config: GLMClientConfig;
  public baseURL: string;

  constructor(config: GLMClientConfig) {
    this.config = {
      ...config,
      baseURL: config.baseURL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: config.model || 'glm-4',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000,
      stream: config.stream !== false,
    };
    this.baseURL = this.config.baseURL!;
  }

  async *streamChatCompletion(messages: GLMMessage[]): AsyncIterable<string> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.config.apiKey,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
      }),
    });

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
