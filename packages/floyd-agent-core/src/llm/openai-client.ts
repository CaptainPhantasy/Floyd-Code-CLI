/**
 * OpenAI-Compatible Client
 *
 * Generic OpenAI-compatible API client for various providers:
 * - OpenAI
 * - Z.ai / GLM
 * - DeepSeek
 * - Other OpenAI-compatible APIs
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.5
 */

import OpenAI from 'openai';
import type { LLMClient, LLMClientOptions, LLMMessage, LLMTool, StreamChunk, LLMChatCallbacks } from './types.js';

export interface OpenAIClientOptions extends LLMClientOptions {
  /** API endpoint URL */
  baseURL?: string;
  /** Model name */
  model?: string;
}

/**
 * OpenAICompatibleClient - Generic OpenAI SDK client
 *
 * Works with any OpenAI-compatible API endpoint.
 */
export class OpenAICompatibleClient implements LLMClient {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private baseURL: string;

  constructor(options: OpenAIClientOptions) {
    this.baseURL = options.baseURL ?? 'https://api.openai.com/v1';
    this.model = options.model ?? 'gpt-4o';
    this.maxTokens = options.maxTokens ?? 8192;

    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: this.baseURL,
      defaultHeaders: options.defaultHeaders,
    });
  }

  getModel(): string {
    return this.model;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  async *chat(
    messages: LLMMessage[],
    tools: LLMTool[],
    callbacks?: LLMChatCallbacks
  ): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      // Convert tools to OpenAI format
      const openaiTools: OpenAI.ChatCompletionTool[] = tools.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));

      // Convert messages to OpenAI format
      const openaiMessages: OpenAI.ChatCompletionMessageParam[] = messages.map((msg) => {
        if (msg.role === 'tool') {
          return {
            role: 'tool' as const,
            tool_call_id: msg.tool_call_id ?? '',
            content: msg.content,
          };
        }
        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        };
      });

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: openaiMessages,
        tools: openaiTools.length > 0 ? openaiTools : undefined,
        max_tokens: this.maxTokens,
        stream: true,
      });

      let currentToolCall: {
        id: string;
        name: string;
        arguments: string;
      } | null = null;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        // Handle text content
        if (delta?.content) {
          const streamChunk: StreamChunk = {
            token: delta.content,
          };
          callbacks?.onChunk?.(streamChunk);
          yield streamChunk;
        }

        // Handle tool calls (OpenAI format)
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            if (toolCall.function?.name) {
              // New tool call starting
              currentToolCall = {
                id: toolCall.id || `call_${Date.now()}`,
                name: toolCall.function.name,
                arguments: toolCall.function.arguments || '',
              };

              const toolStartChunk: StreamChunk = {
                tool_call_id: currentToolCall.id,
                tool_call: {
                  id: currentToolCall.id,
                  name: currentToolCall.name,
                  input: {},
                },
              };
              callbacks?.onToolStart?.(toolStartChunk.tool_call!);
              yield toolStartChunk;
            } else if (toolCall.function?.arguments && currentToolCall) {
              // Accumulate arguments
              currentToolCall.arguments += toolCall.function.arguments;
            }
          }
        }

        // Handle finish reason
        if (chunk.choices[0]?.finish_reason) {
          // If we have a pending tool call, finalize it
          if (currentToolCall) {
            let parsedInput: Record<string, unknown> = {};
            try {
              parsedInput = JSON.parse(currentToolCall.arguments || '{}');
            } catch {
              parsedInput = { _parseError: true, _raw: currentToolCall.arguments };
            }

            const toolCompleteChunk: StreamChunk = {
              tool_call_id: currentToolCall.id,
              tool_call: {
                id: currentToolCall.id,
                name: currentToolCall.name,
                input: parsedInput,
              },
              tool_use_complete: true,
            };
            yield toolCompleteChunk;
            currentToolCall = null;
          }

          const doneChunk: StreamChunk = {
            done: true,
            stop_reason: chunk.choices[0].finish_reason,
          };

          // Include usage if available
          if (chunk.usage) {
            doneChunk.usage = {
              inputTokens: chunk.usage.prompt_tokens,
              outputTokens: chunk.usage.completion_tokens,
            };
          }

          callbacks?.onDone?.();
          yield doneChunk;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorChunk: StreamChunk = {
        error: errorMessage,
        done: true,
      };
      callbacks?.onError?.(new Error(errorMessage));
      yield errorChunk;
    }
  }
}
