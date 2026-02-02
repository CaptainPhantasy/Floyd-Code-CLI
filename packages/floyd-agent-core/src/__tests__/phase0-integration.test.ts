/**
 * PHASE 0: Architectural Foundation - Integration Tests
 *
 * Verifies:
 * Item A: Unified Permission System
 * Item B: Configuration Standardization
 * Item C: Provider Abstraction Layer
 * Item D: State Management Unification
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Item A: Unified Permission System
import {
  UnifiedPermissionManager,
  createYoloManager,
  createAskManager,
  createPlanManager,
  type PermissionMode,
  type PermissionRequest,
} from '../permissions/unified-permission.js';

// Item B: Configuration Standardization
import {
  ConfigManager,
  initializeConfig,
  getConfig,
  setConfigValue,
  type FloydConfig,
  type SafetyMode,
} from '../config/floyd-config.js';

// Item C: Provider Abstraction Layer
import {
  createLLMClient,
  GLMClient,
  AnthropicClient,
  OpenAICompatibleClient,
} from '../llm/index.js';

// Item D: State Management Unification
import {
  StateManager,
  getState,
  onStateChange,
  onMessageAdded,
  type AgentStatus,
  type FloydState,
} from '../state/floyd-state.js';

describe('PHASE 0: Architectural Foundation', () => {
  describe('Item A: Unified Permission System', () => {
    it('should create YOLO manager that auto-approves', async () => {
      const manager = createYoloManager();
      const request: PermissionRequest = {
        toolName: 'write_file',
        arguments: { file_path: '/tmp/test.txt', content: 'hello' },
        cwd: '/tmp',
      };

      const response = await manager.checkPermission(request);

      assert.equal(response.granted, true);
      assert.equal(response.mode, 'yolo');
      assert.equal(response.requiredConfirmation, false);
    });

    it('should create PLAN manager that denies writes', async () => {
      const manager = createPlanManager();
      const request: PermissionRequest = {
        toolName: 'write_file',
        arguments: { file_path: '/tmp/test.txt', content: 'hello' },
        cwd: '/tmp',
      };

      const response = await manager.checkPermission(request);

      assert.equal(response.granted, false);
      assert.equal(response.mode, 'plan');
    });

    it('should create ASK manager with custom prompt', async () => {
      const manager = createAskManager(async () => true);
      const request: PermissionRequest = {
        toolName: 'delete_file',
        arguments: { file_path: '/tmp/test.txt' },
        cwd: '/tmp',
      };

      const response = await manager.checkPermission(request);

      assert.equal(response.granted, true);
      assert.equal(response.mode, 'ask');
      assert.equal(response.requiredConfirmation, true);
    });

    it('should switch permission modes dynamically', async () => {
      const manager = new UnifiedPermissionManager({ mode: 'yolo' });

      assert.equal(manager.getMode(), 'yolo');

      manager.setMode('plan');

      assert.equal(manager.getMode(), 'plan');
    });

    it('should track audit history', async () => {
      const manager = createYoloManager();
      const request: PermissionRequest = {
        toolName: 'read_file',
        arguments: { file_path: '/tmp/test.txt' },
        cwd: '/tmp',
      };

      await manager.checkPermission(request);

      const history = manager.getAuditHistory();

      assert.equal(history.length, 1);
      assert.equal(history[0].decision, 'GRANTED');
      assert.equal(history[0].toolName, 'read_file');
    });
  });

  describe('Item B: Configuration Standardization', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    it('should load default configuration', async () => {
      const config = getConfig();

      assert.equal(config.llm.provider, 'zai');
      assert.equal(config.llm.model, 'claude-sonnet-4-20250514');
      assert.equal(config.permissions.mode, 'ask');
      assert.equal(config.cache.enabled, true);
    });

    it('should respect environment variable overrides', async () => {
      process.env.FLOYD_MODE = 'yolo';
      process.env.FLOYD_API_KEY = 'test-key';

      await ConfigManager.initialize();

      const config = getConfig();

      assert.equal(config.permissions.mode, 'yolo');
      assert.equal(config.llm.apiKey, 'test-key');

      process.env = originalEnv;
    });

    it('should update configuration values', async () => {
      await setConfigValue('permissions', {
        mode: 'fuckit',
        showWarnings: false,
        alwaysAllowTools: [],
        alwaysPromptTools: [],
        rememberDecisions: true,
        rememberUntil: 'session',
      });

      const config = getConfig();

      assert.equal(config.permissions.mode, 'fuckit');
    });

    it('should emit config change events', async (t) => {
      let changed = false;

      const listener = () => { changed = true; };
      ConfigManager.on('config:changed', listener);

      await setConfigValue('llm', { ...getConfig().llm, model: 'test-model' });

      assert.equal(changed, true);

      ConfigManager.off('config:changed', listener);
    });
  });

  describe('Item C: Provider Abstraction Layer', () => {
    it('should create Anthropic client for anthropic provider', () => {
      const client = createLLMClient({
        apiKey: 'test-key',
        provider: 'anthropic',
      });

      assert.ok(client instanceof AnthropicClient);
    });

    it('should create OpenAI-compatible client for zai provider', () => {
      const client = createLLMClient({
        apiKey: 'test-key',
        provider: 'zai',
      });

      assert.ok(client instanceof OpenAICompatibleClient);
    });

    it('should create GLM client with explicit options', () => {
      const client = new GLMClient({
        apiKey: 'test-key',
        baseURL: 'https://api.z.ai/api/coding/paas/v4',
        model: 'glm-4.7-flash',
      });

      assert.equal(client.getModel(), 'glm-4.7-flash');
      assert.equal(client.getBaseURL(), 'https://api.z.ai/api/coding/paas/v4');
    });

    it('should infer provider from endpoint URL', () => {
      const client = createLLMClient({
        apiKey: 'test-key',
        baseURL: 'https://api.anthropic.com',
      });

      assert.ok(client instanceof AnthropicClient);
    });
  });

  describe('Item D: State Management Unification', () => {
    it('should get default state', () => {
      const state = getState();

      assert.equal(state.session.id.length > 0, true);
      assert.equal(state.messages.length, 0);
      assert.equal(state.execution.status, 'idle');
      assert.equal(Object.keys(state.toolStats).length, 0);
    });

    it('should update execution status', () => {
      StateManager.setExecutionStatus('thinking');

      assert.equal(StateManager.get('execution').status, 'thinking');

      StateManager.resetExecution();
    });

    it('should add messages to conversation', () => {
      StateManager.addMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Hello, Floyd!',
        timestamp: Date.now(),
      });

      const messages = StateManager.get('messages');

      assert.equal(messages.length, 1);
      assert.equal(messages[0].content, 'Hello, Floyd!');

      StateManager.clearMessages();
    });

    it('should record tool executions', () => {
      StateManager.recordToolExecution({
        toolName: 'read_file',
        duration: 100,
        success: true,
      });

      const stats = StateManager.getToolStats('read_file');

      assert.equal(stats?.calls, 1);
      assert.equal(stats?.successes, 1);
      assert.equal(stats?.avgDuration, 100);
    });

    it('should emit state change events', (t) => {
      let changed = false;

      const unsubscribe = onStateChange('execution', () => {
        changed = true;
      });

      StateManager.setExecutionStatus('streaming');

      assert.equal(changed, true);

      StateManager.resetExecution();
      unsubscribe();
    });

    it('should emit message added events', (t) => {
      let added = false;

      const unsubscribe = onMessageAdded(() => {
        added = true;
      });

      StateManager.addMessage({
        id: 'msg-2',
        role: 'assistant',
        content: 'Hello!',
        timestamp: Date.now(),
      });

      assert.equal(added, true);

      StateManager.clearMessages();
      unsubscribe();
    });

    it('should export and import state', () => {
      StateManager.addMessage({
        id: 'msg-3',
        role: 'user',
        content: 'Test message',
        timestamp: Date.now(),
      });

      const exported = StateManager.export();

      assert.equal((exported.messages as unknown[]).length, 1);

      StateManager.clearMessages();
      assert.equal(StateManager.get('messages').length, 0);

      StateManager.import(exported);
      assert.equal(StateManager.get('messages').length, 1);

      StateManager.clearMessages();
    });
  });

  describe('Integration: All Items Working Together', () => {
    it('should coordinate permission, config, and state', async () => {
      // Setup config
      await setConfigValue('permissions', {
        mode: 'yolo',
        showWarnings: false,
        alwaysAllowTools: [],
        alwaysPromptTools: [],
        rememberDecisions: true,
        rememberUntil: 'session',
      });

      // Setup permission manager with config mode
      const config = getConfig();
      const manager = new UnifiedPermissionManager({
        mode: config.permissions.mode,
      });

      // Check permission
      const response = await manager.checkPermission({
        toolName: 'write_file',
        arguments: { file_path: '/tmp/test.txt', content: 'test' },
        cwd: '/tmp',
      });

      assert.equal(response.granted, true);

      // Record in state
      StateManager.recordToolExecution({
        toolName: 'write_file',
        duration: 50,
        success: response.granted,
      });

      const stats = StateManager.getToolStats('write_file');
      assert.equal(stats?.successes, 1);
    });
  });
});
