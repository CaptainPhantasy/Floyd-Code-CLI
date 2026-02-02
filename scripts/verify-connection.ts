
import { AgentEngine } from '../packages/floyd-agent-core/src/agent/AgentEngine';
import { MCPClientManager } from '../packages/floyd-agent-core/src/mcp/client-manager';
import { SessionManager } from '../packages/floyd-agent-core/src/store/index';
import { PermissionManager } from '../packages/floyd-agent-core/src/permissions/index';
import { Config } from '../packages/floyd-agent-core/src/utils/index';
import { AnthropicClient } from '../packages/floyd-agent-core/src/llm/anthropic-client';
import path from 'path';
import fs from 'fs';

// Mock required dependencies
const mcpManager = new MCPClientManager();
const sessionManager = new SessionManager({ sessionsDir: './.temp_sessions' });
const permissionManager = new PermissionManager();
const config = new Config({ workingDirectory: process.cwd() });

// Configuration to test (MATCHING USER REQUEST)
const TEST_CONFIG = {
  provider: 'anthropic',
  apiKey: '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',
  baseURL: 'https://api.anthropic.com',
  model: 'claude-sonnet-4-5-20250929',
};

async function verifyConnection() {
  console.log('🚀 Starting Verification...');
  console.log(`Provider: ${TEST_CONFIG.provider}`);
  console.log(`Endpoint: ${TEST_CONFIG.baseURL}`);
  console.log(`Model:    ${TEST_CONFIG.model}`);

  try {
    // Manually instantiate the client to test exact logic used in factory
    console.log('\n1. Testing Client Initialization...');
    const client = new AnthropicClient({
      apiKey: TEST_CONFIG.apiKey,
      baseURL: TEST_CONFIG.baseURL,
      model: TEST_CONFIG.model,
    });
    console.log('✅ Client created successfully');

    // Test AgentEngine flow
    console.log('\n2. Testing AgentEngine Flow...');
    const agent = new AgentEngine(
      {
        apiKey: TEST_CONFIG.apiKey,
        baseURL: TEST_CONFIG.baseURL,
        model: TEST_CONFIG.model,
        provider: 'anthropic', // Explicitly set provider
      },
      mcpManager,
      sessionManager,
      permissionManager,
      config
    );

    await agent.initSession(process.cwd());
    console.log('✅ Agent Session Initialized');

    console.log('\n3. Sending Test Message ("Hello")...');
    const response = await agent.sendMessageComplete('Hello');
    
    console.log('\n🎉 SUCCESS! Received Response:');
    console.log('---------------------------------------------------');
    console.log(response);
    console.log('---------------------------------------------------');

  } catch (error) {
    console.error('\n❌ FAILURE:', error);
    if (error instanceof Error) {
        console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Ensure temp dir exists
if (!fs.existsSync('./.temp_sessions')) fs.mkdirSync('./.temp_sessions');

verifyConnection();
