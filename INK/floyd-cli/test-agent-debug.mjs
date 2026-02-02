#!/usr/bin/env node
/**
 * DEBUG AGENT ENGINE STREAM
 * See what chunks AgentEngine actually receives from LLM client
 */

import { AgentEngine } from 'floyd-agent-core';
import { MCPClientManager } from 'floyd-agent-core';
import { PermissionManager } from 'floyd-agent-core';
import { SessionManager } from 'floyd-agent-core';
import { ConfigLoader } from './dist/utils/config.js';
import { BUILTIN_SERVERS } from './dist/config/builtin-servers.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
try {
	const globalEnv = `${process.env.HOME}/.floyd/.env.local`;
	dotenv.config({ path: globalEnv });
} catch (e) {}

const TEST_PROMPT = 'Write "test" to a file called debug.txt';

async function testAgentDebug() {
	console.log('=== AGENT ENGINE STREAM DEBUG ===\n');

	try {
		const mcpManager = new MCPClientManager(BUILTIN_SERVERS);
		const sessionManager = new SessionManager();
		const config = await ConfigLoader.loadProjectConfig();
		const permissionManager = new PermissionManager(['*']);

		await mcpManager.startBuiltinServers();
		await mcpManager.connectExternalServers(process.cwd());

		const tools = await mcpManager.listTools();
		console.log(`Available tools: ${tools.length}\n`);

		const apiKey = process.env.FLOYD_GLM_API_KEY || process.env.GLM_API_KEY;
		const apiEndpoint = process.env.FLOYD_GLM_ENDPOINT || process.env.GLM_ENDPOINT;
		const apiModel = process.env.FLOYD_GLM_MODEL || process.env.GLM_MODEL;

		const engine = new AgentEngine(
			{ apiKey, baseURL: apiEndpoint, model: apiModel, enableThinkingMode: true },
			mcpManager,
			sessionManager,
			permissionManager,
			config,
		);
		await engine.initSession(process.cwd());

		console.log('Sending message...');
		console.log(`Prompt: "${TEST_PROMPT}"\n`);

		console.log('STREAM CHUNKS:');
		console.log('================\n');

		let chunkCount = 0;
		let textChunks = 0;
		let toolCallChunks = 0;
		let toolUseCompleteChunks = 0;

		for await (const chunk of engine.sendMessage(TEST_PROMPT)) {
			chunkCount++;

			// Debug: show FULL chunk structure for first chunk
			if (chunkCount === 1) {
				console.log(`[Chunk ${chunkCount}] FULL STRUCTURE:`);
				console.log(JSON.stringify(chunk, null, 2));
				console.log();
			}

			// Debug: show chunk structure
			if (chunkCount <= 50) { // Show first 50 chunks
				console.log(`[Chunk ${chunkCount}]`);
				console.log(`  Keys: ${Object.keys(chunk).join(', ')}`);
				console.log(`  Type: ${chunk.token ? 'TEXT' : chunk.tool_call ? 'TOOL_CALL' : chunk.error ? 'ERROR' : 'UNKNOWN'}`);
				if (chunk.token) {
					console.log(`  Token: "${chunk.token.slice(0, 50)}..."`);
					textChunks++;
				}
				if (chunk.tool_call) {
					console.log(`  Tool: ${chunk.tool_call.name}`);
					console.log(`  Complete: ${chunk.tool_use_complete ? 'YES' : 'NO'}`);
					console.log(`  Input:`, JSON.stringify(chunk.tool_call.input).slice(0, 100));
					toolCallChunks++;
					if (chunk.tool_use_complete) toolUseCompleteChunks++;
				}
				if (chunk.error) {
					console.log(`  Error: ${chunk.error}`);
				}
				console.log();
			}
		}

		console.log('================');
		console.log(`Total chunks: ${chunkCount}`);
		console.log(`Text chunks: ${textChunks}`);
		console.log(`Tool call chunks: ${toolCallChunks}`);
		console.log(`Tool use complete: ${toolUseCompleteChunks}`);
		console.log();

		// Check engine's history
		console.log('ENGINE HISTORY:');
		console.log('================');
		console.log(`Messages in history: ${engine.history.length}`);
		engine.history.forEach((msg, i) => {
			console.log(`[${i}] Role: ${msg.role}`);
			if (typeof msg.content === 'string') {
				console.log(`    Content (first 100 chars): ${msg.content.slice(0, 100)}...`);
			} else if (Array.isArray(msg.content)) {
				console.log(`    Content: [Array with ${msg.content.length} items]`);
				msg.content.forEach(item => {
					if (item.type === 'tool_use') {
						console.log(`      - tool_use: ${item.name} (id: ${item.id})`);
					}
				});
			}
		});

	} catch (error) {
		console.error('\n❌ ERROR:', error.message);
		console.error(error.stack);
	}
}

testAgentDebug();
