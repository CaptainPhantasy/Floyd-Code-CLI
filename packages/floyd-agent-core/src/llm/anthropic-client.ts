/**
 * Anthropic Client
 *
 * Native Anthropic API client for Claude models.
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.5
 */

import Anthropic from '@anthropic-ai/sdk';
import type { LLMClient, LLMClientOptions, LLMMessage, LLMTool, StreamChunk, LLMChatCallbacks } from './types.js';

export interface AnthropicClientOptions extends LLMClientOptions {
  /** Anthropic API endpoint (default: https://api.anthropic.com) */
  baseURL?: string;
  /** Model name (default: claude-sonnet-4-20250514) */
  model?: string;
}

/**
 * AnthropicClient - Native Anthropic SDK client
 *
 * Uses the official Anthropic SDK for streaming chat completions.
 */
export class AnthropicClient implements LLMClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private baseURL: string;

  constructor(options: AnthropicClientOptions) {
    this.baseURL = options.baseURL ?? 'https://api.anthropic.com';
    this.model = options.model ?? 'claude-sonnet-4-20250514';
    this.maxTokens = options.maxTokens ?? 8192;

    this.client = new Anthropic({
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
      // Convert tools to Anthropic format
      const anthropicTools: Anthropic.Tool[] = tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
      }));

      // Convert messages to Anthropic format
      const systemMessage = messages.find(m => m.role === 'system');
      const nonSystemMessages = messages.filter(m => m.role !== 'system');

      const anthropicMessages: Anthropic.MessageParam[] = nonSystemMessages.map((msg) => {
        if (msg.role === 'tool') {
          return {
            role: 'user' as const,
            content: [{
              type: 'tool_result' as const,
              tool_use_id: msg.tool_call_id ?? '',
              content: msg.content,
            }],
          };
        }
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        };
      });

      const stream = await this.client.messages.stream({
        model: this.model,
        messages: anthropicMessages,
        tools: anthropicTools.length > 0 ? anthropicTools : undefined,
        max_tokens: this.maxTokens,
        system: systemMessage?.content,
      });

      let currentToolCall: {
        id: string;
        name: string;
        input: string;
      } | null = null;

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          const block = event.content_block;
          if (block.type === 'tool_use') {
            currentToolCall = {
              id: block.id,
              name: block.name,
              input: '',
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
          }
        } else if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if (delta.type === 'text_delta') {
            const streamChunk: StreamChunk = {
              token: delta.text,
            };
            callbacks?.onChunk?.(streamChunk);
            yield streamChunk;
          } else if (delta.type === 'input_json_delta' && currentToolCall) {
            currentToolCall.input += delta.partial_json;
          }
        } else if (event.type === 'content_block_stop') {
          if (currentToolCall) {
            let parsedInput: Record<string, unknown> = {};
            try {
              parsedInput = JSON.parse(currentToolCall.input || '{}');
            } catch {
              parsedInput = { _parseError: true, _raw: currentToolCall.input };
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
        } else if (event.type === 'message_stop') {
          const doneChunk: StreamChunk = {
            done: true,
            stop_reason: 'end_turn',
          };
          callbacks?.onDone?.();
          yield doneChunk;
        } else if (event.type === 'message_delta') {
          if (event.usage) {
            const usageChunk: StreamChunk = {
              usage: {
                inputTokens: 0, // Not available in delta
                outputTokens: event.usage.output_tokens,
              },
            };
            yield usageChunk;
          }
        }
      }

      // Get final message for usage
      const finalMessage = await stream.finalMessage();
      if (finalMessage.usage) {
        const usageChunk: StreamChunk = {
          usage: {
            inputTokens: finalMessage.usage.input_tokens,
            outputTokens: finalMessage.usage.output_tokens,
          },
        };
        yield usageChunk;
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
