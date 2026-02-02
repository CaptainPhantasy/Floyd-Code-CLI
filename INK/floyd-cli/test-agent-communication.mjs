#!/usr/bin/env node
/**
 * DIRECT AGENT COMMUNICATION TEST
 * Actually tests if Floyd can communicate with the API
 */

import { AgentEngine } from 'floyd-agent-core';
import { MCPClientManager } from 'floyd-agent-core';
import { PermissionManager } from 'floyd-agent-core';
import { SessionManager } from 'floyd-agent-core';
import { ConfigLoader } from './dist/utils/config.js';
import { BUILTIN_SERVERS } from './dist/config/builtin-servers.js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from multiple locations
dotenv.config({ path: '.env.local' });
// Try to load global env
try {
	const globalEnv = `${process.env.HOME}/.floyd/.env.local`;
	dotenv.config({ path: globalEnv });
} catch (e) {
	// Ignore if global env doesn't exist
}

const TEST_PROMPT = 'Say a short haiku about code. Then write it to a file called clipoem.md in the root directory.';

async function testAgentCommunication() {
	console.log('=== FLOYD AGENT COMMUNICATION TEST ===\n');

	try {
		// 1. Initialize components
		console.log('[1/7] Initializing components...');
		const mcpManager = new MCPClientManager(BUILTIN_SERVERS);
		const sessionManager = new SessionManager();
		const config = await ConfigLoader.loadProjectConfig();
		const permissionManager = new PermissionManager(['*']);

		// Start built-in MCP servers
		console.log('[2/7] Starting built-in MCP servers...');
		await mcpManager.startBuiltinServers();
		console.log('  ✅ Built-in servers started');

		// Connect to external servers (from .floyd/mcp.json)
		console.log('[3/7] Connecting to external MCP servers...');
		const extResult = await mcpManager.connectExternalServers(process.cwd());
		console.log(`  ✅ External: ${extResult.connected} connected, ${extResult.failed} failed`);

		// List available tools
		const tools = await mcpManager.listTools();
		console.log(`[4/7] 📦 Available tools: ${tools.length}`);
		tools.slice(0, 10).forEach(t => console.log(`     - ${t.name}`));
		if (tools.length > 10) console.log(`     ... and ${tools.length - 10} more`);

		// 5. Configure API
		console.log('[5/7] Configuring API...');
		const apiKey = process.env.FLOYD_GLM_API_KEY || process.env.GLM_API_KEY;
		const apiEndpoint = process.env.FLOYD_GLM_ENDPOINT || process.env.GLM_ENDPOINT || 'https://api.z.ai/api/anthropic';
		const apiModel = process.env.FLOYD_GLM_MODEL || process.env.GLM_MODEL || 'claude-sonnet-4-20250514';

		console.log(`  Endpoint: ${apiEndpoint}`);
		console.log(`  Model: ${apiModel}`);
		console.log(`  API Key: ${apiKey ? '✅ Present' : '❌ Missing'}`);

		if (!apiKey) {
			throw new Error('API key not found in environment');
		}

		// 6. Create agent engine
		console.log('[6/7] Creating AgentEngine...');
		const engine = new AgentEngine(
			{
				apiKey,
				baseURL: apiEndpoint,
				model: apiModel,
				enableThinkingMode: true,
				temperature: 0.7,
			},
			mcpManager,
			sessionManager,
			permissionManager,
			config,
		);

		// 7. Initialize session
		console.log('[7/7] Initializing session...');
		await engine.initSession(process.cwd());
		console.log('  ✅ Session initialized');

		// 8. Send test message
		console.log('[8/8] Sending test message...');
		console.log(`  Prompt: "${TEST_PROMPT}"\n`);
		console.log('  Response:');

		let response = '';
		let toolCalls = 0;

		for await (const chunk of engine.sendMessage(TEST_PROMPT)) {
			process.stdout.write(chunk);
			response += chunk;
		}

		console.log('\n');

		// 9. Verify file was created
		console.log('[9/9] Verifying output...');
		const fs = await import('fs-extra');
		const poemPath = resolve(process.cwd(), '../clipoem.md');

		if (await fs.pathExists(poemPath)) {
			const content = await fs.readFile(poemPath, 'utf-8');
			console.log('  ✅ File created: clipoem.md');
			console.log('  Content:');
			console.log('  ---');
			content.split('\n').forEach(line => console.log(`  ${line}`));
			console.log('  ---');
		} else {
			console.log('  ❌ File NOT created: clipoem.md');
			console.log(`  Expected path: ${poemPath}`);
		}

		console.log('\n=== TEST COMPLETE ===');
		console.log(`Response length: ${response.length} characters`);
		console.log(`Tool calls detected: ${toolCalls}`);

	} catch (error) {
		console.error('\n❌ TEST FAILED:');
		console.error(error.message);
		if (error.stack) {
			console.error('\nStack trace:');
			console.error(error.stack);
		}
		process.exit(1);
	}
}

testAgentCommunication();
