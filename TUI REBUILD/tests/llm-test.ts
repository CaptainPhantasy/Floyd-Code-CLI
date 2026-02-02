/**
 * LLM Integration Tests
 *
 * Tests for:
 * - Factory client creation
 * - Error handling and retry logic
 * - Message history tracking
 * - Streaming response parsing (mocked)
 *
 * Run with: npx tsx tests/llm-test.ts
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import {
  createLLMClient,
  LLMError,
  type LLMProvider,
  type ChatMessage,
  type RetryConfig,
} from '../src/llm/factory.ts';

// Mock Response type
interface MockResponse {
  ok: boolean;
  status?: number;
  body?: ReadableStream | null;
  json?: () => unknown;
  text?: () => string;
}

function mockFetch(response: MockResponse): Promise<Response> {
  return Promise.resolve({
    ok: response.ok,
    status: response.status || 200,
    body: response.body || null,
    async json() {
      return response.json?.() || {};
    },
    async text() {
      return response.text?.() || '';
    },
  } as Response);
}

const originalFetch = globalThis.fetch;

describe('LLM Factory', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should create GLM client with valid config', () => {
    const client = createLLMClient('glm', {
      apiKey: 'test-key',
      model: 'glm-4-plus',
    });

    assert.ok(client);
    assert.strictEqual(typeof client.sendMessage, 'function');
  });

  it('should create OpenAI client with valid config', () => {
    const client = createLLMClient('openai', {
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
    });

    assert.ok(client);
    assert.strictEqual(typeof client.sendMessage, 'function');
  });

  it('should throw LLMError for unsupported provider', () => {
    assert.throws(
      () => createLLMClient('anthropic' as LLMProvider, { apiKey: 'test' }),
      LLMError
    );
  });

  it('should throw LLMError for GLM without API key', () => {
    assert.throws(
      () => createLLMClient('glm', {}),
      LLMError
    );
  });
});

describe('GLM Client', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should handle non-streaming response', async () => {
    const client = createLLMClient('glm', {
      apiKey: 'test-key',
    });

    globalThis.fetch = () =>
      mockFetch({
        ok: true,
        json: () => ({
          choices: [{ message: { content: 'Hello, world!' } }],
        }),
      });

    const response = await client.sendMessage('test message');
    assert.strictEqual(response, 'Hello, world!');
  });

  it('should handle streaming response', async () => {
    const client = createLLMClient('glm', {
      apiKey: 'test-key',
    });

    const chunks = ['Hello', ', ', 'world', '!'];

    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          const data = JSON.stringify({
            choices: [{ delta: { content: chunk } }],
          });
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    globalThis.fetch = () =>
      mockFetch({
        ok: true,
        body: stream,
      });

    const receivedChunks: string[] = [];
    const response = await client.sendMessage('test message', (chunk) => {
      receivedChunks.push(chunk);
    });

    assert.strictEqual(response, 'Hello, world!');
    assert.deepStrictEqual(receivedChunks, chunks);
  });

  it('should maintain message history', async () => {
    const client = createLLMClient('glm', {
      apiKey: 'test-key',
    }) as unknown as { getHistory: () => ChatMessage[] };

    globalThis.fetch = () =>
      mockFetch({
        ok: true,
        json: () => ({
          choices: [{ message: { content: 'Response 1' } }],
        }),
      });

    await client.sendMessage('Message 1');

    globalThis.fetch = () =>
      mockFetch({
        ok: true,
        json: () => ({
          choices: [{ message: { content: 'Response 2' } }],
        }),
      });

    await client.sendMessage('Message 2');

    const history = (client as unknown as { getHistory: () => ChatMessage[] }).getHistory();
    assert.strictEqual(history.length, 5); // system + user1 + assistant1 + user2 + assistant2
    assert.deepStrictEqual(history[1], { role: 'user', content: 'Message 1' });
    assert.deepStrictEqual(history[2], { role: 'assistant', content: 'Response 1' });
  });

  it('should clear history', async () => {
    const client = createLLMClient('glm', {
      apiKey: 'test-key',
    });

    globalThis.fetch = () =>
      mockFetch({
        ok: true,
        json: () => ({
          choices: [{ message: { content: 'Response' } }],
        }),
      });

    await client.sendMessage('Message');

    const clientWithHistory = client as unknown as {
      getHistory: () => ChatMessage[];
      clearHistory: () => void;
    };

    assert.ok(clientWithHistory.getHistory().length > 1);

    clientWithHistory.clearHistory();

    assert.strictEqual(clientWithHistory.getHistory().length, 1);
    assert.strictEqual(clientWithHistory.getHistory()[0].role, 'system');
  });

  it('should handle API errors', async () => {
    const client = createLLMClient('glm', {
      apiKey: 'test-key',
    });

    globalThis.fetch = () =>
      mockFetch({
        ok: false,
        status: 401,
        text: () => 'Unauthorized',
      });

    await assert.rejects(async () => client.sendMessage('test'), LLMError);
  });

  it('should retry on rate limit (429)', async () => {
    const client = createLLMClient('glm', {
      apiKey: 'test-key',
      retryConfig: {
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 100,
      },
    });

    let attemptCount = 0;

    globalThis.fetch = () => {
      attemptCount++;
      if (attemptCount < 2) {
        return mockFetch({
          ok: false,
          status: 429,
          text: () => 'Rate limited',
        });
      }
      return mockFetch({
        ok: true,
        json: () => ({
          choices: [{ message: { content: 'Success after retry' } }],
        }),
      });
    };

    const response = await client.sendMessage('test');
    assert.strictEqual(response, 'Success after retry');
    assert.strictEqual(attemptCount, 2);
  });

  it('should not retry on auth errors (401)', async () => {
    const client = createLLMClient('glm', {
      apiKey: 'test-key',
      retryConfig: { maxRetries: 3 },
    });

    let attemptCount = 0;

    globalThis.fetch = () => {
      attemptCount++;
      return mockFetch({
        ok: false,
        status: 401,
        text: () => 'Unauthorized',
      });
    };

    await assert.rejects(async () => client.sendMessage('test'));
    assert.strictEqual(attemptCount, 1);
  });
});

describe('OpenAI Client', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should handle non-streaming response', async () => {
    const client = createLLMClient('openai', {
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
    });

    globalThis.fetch = () =>
      mockFetch({
        ok: true,
        json: () => ({
          choices: [{ message: { content: 'OpenAI response' } }],
        }),
      });

    const response = await client.sendMessage('test');
    assert.strictEqual(response, 'OpenAI response');
  });

  it('should work without API key for local providers', async () => {
    const client = createLLMClient('openai', {
      apiKey: '',
      baseURL: 'http://localhost:11434/v1/chat/completions',
    });

    globalThis.fetch = () =>
      mockFetch({
        ok: true,
        json: () => ({
          choices: [{ message: { content: 'Local model response' } }],
        }),
      });

    const response = await client.sendMessage('test');
    assert.strictEqual(response, 'Local model response');
  });
});

describe('LLMError', () => {
  it('should create error with code and status', () => {
    const error = new LLMError('Test error', 'TEST_CODE', 500);
    assert.strictEqual(error.message, 'Test error');
    assert.strictEqual(error.code, 'TEST_CODE');
    assert.strictEqual(error.statusCode, 500);
    assert.strictEqual(error.name, 'LLMError');
  });

  it('should indicate if retryable', () => {
    const error = new LLMError('Test', 'TEST', 429);
    error.retryable = true;
    assert.strictEqual(error.retryable, true);
  });
});

console.log('✓ LLM Integration Tests loaded successfully');
console.log('Run with: npx tsx tests/llm-test.ts');
