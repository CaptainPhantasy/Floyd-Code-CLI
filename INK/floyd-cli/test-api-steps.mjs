#!/usr/bin/env node
/**
 * STEP-BY-STEP API TEST
 * Tests each component in isolation to find where it breaks
 */

import dotenv from 'dotenv';

// Load env
dotenv.config({ path: '.env.local' });
try {
	const globalEnv = `${process.env.HOME}/.floyd/.env.local`;
	dotenv.config({ path: globalEnv });
} catch (e) {}

const API_KEY = process.env.FLOYD_GLM_API_KEY || process.env.GLM_API_KEY;
const ENDPOINT = process.env.FLOYD_GLM_ENDPOINT || process.env.GLM_ENDPOINT;
const MODEL = process.env.FLOYD_GLM_MODEL || process.env.GLM_MODEL;

console.log('=== STEP-BY-STEP API TEST ===\n');
console.log('Configuration:');
console.log(`  API Key: ${API_KEY ? API_KEY.slice(0, 20) + '...' : 'MISSING'}`);
console.log(`  Endpoint: ${ENDPOINT}`);
console.log(`  Model: ${MODEL}\n`);

async function testStep1_keyValidity() {
	console.log('[STEP 1] Testing API key validity...');

	try {
		const response = await fetch(`${ENDPOINT}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`,
			},
			body: JSON.stringify({
				model: MODEL,
				messages: [{ role: 'user', content: 'Say "test"' }],
				max_tokens: 10,
			}),
		});

		console.log(`  Status: ${response.status}`);

		if (response.status === 401) {
			console.log('  ❌ FAIL: Invalid API key\n');
			return false;
		}

		const text = await response.text();
		console.log(`  Response (first 200 chars): ${text.slice(0, 200)}...`);

		if (response.ok) {
			console.log('  ✅ PASS: API key is valid\n');
			return true;
		} else {
			console.log(`  ❌ FAIL: ${response.status} ${response.statusText}\n`);
			return false;
		}
	} catch (error) {
		console.log(`  ❌ FAIL: ${error.message}\n`);
		return false;
	}
}

async function testStep2_simpleCompletion() {
	console.log('[STEP 2] Testing simple completion (no tools)...');

	try {
		const response = await fetch(`${ENDPOINT}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`,
			},
			body: JSON.stringify({
				model: MODEL,
				messages: [{ role: 'user', content: 'Say "hello world"' }],
				max_tokens: 20,
				stream: false,
			}),
		});

		const data = await response.json();

		if (response.ok && data.choices && data.choices[0]) {
			console.log('  ✅ PASS: Got completion');
			console.log(`  Response: ${data.choices[0].message.content}\n`);
			return true;
		} else {
			console.log('  ❌ FAIL: No completion returned');
			console.log(`  Full response:`, JSON.stringify(data, null, 2));
			console.log();
			return false;
		}
	} catch (error) {
		console.log(`  ❌ FAIL: ${error.message}\n`);
		return false;
	}
}

async function testStep3_completionWithTools() {
	console.log('[STEP 3] Testing completion WITH tools...');

	try {
		const response = await fetch(`${ENDPOINT}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`,
			},
			body: JSON.stringify({
				model: MODEL,
				messages: [{ role: 'user', content: 'Write "test" to a file called test.txt' }],
				tools: [{
					type: 'function',
					function: {
						name: 'write_file',
						description: 'Write content to a file',
						parameters: {
							type: 'object',
							properties: {
								path: { type: 'string', description: 'File path' },
								content: { type: 'string', description: 'File content' },
							},
							required: ['path', 'content'],
						},
					},
				}],
				tool_choice: 'auto',
				max_tokens: 100,
				stream: false,
			}),
		});

		const data = await response.json();

		if (response.ok && data.choices && data.choices[0]) {
			const msg = data.choices[0].message;
			console.log('  ✅ PASS: Got response');
			console.log(`  Content: ${msg.content || '(no content)'}`);

			if (msg.tool_calls && msg.tool_calls.length > 0) {
				console.log(`  ✅ Tool calls: ${msg.tool_calls.length}`);
				msg.tool_calls.forEach(tc => {
					console.log(`    - ${tc.function.name}`);
				});
			} else {
				console.log('  ❌ No tool calls returned');
			}
			console.log();
			return true;
		} else {
			console.log('  ❌ FAIL: No completion returned');
			console.log(`  Full response:`, JSON.stringify(data, null, 2));
			console.log();
			return false;
		}
	} catch (error) {
		console.log(`  ❌ FAIL: ${error.message}\n`);
		return false;
	}
}

async function testStep4_streamingWithTools() {
	console.log('[STEP 4] Testing STREAMING with tools...');

	try {
		const response = await fetch(`${ENDPOINT}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`,
			},
			body: JSON.stringify({
				model: MODEL,
				messages: [{ role: 'user', content: 'Say "stream test"' }],
				tools: [{
					type: 'function',
					function: {
						name: 'write_file',
						description: 'Write content to a file',
						parameters: {
							type: 'object',
							properties: {
								path: { type: 'string' },
								content: { type: 'string' },
							},
							required: ['path', 'content'],
						},
					},
				}],
				stream: true,
			}),
		});

		console.log(`  Status: ${response.status}`);

		if (!response.ok) {
			const text = await response.text();
			console.log('  ❌ FAIL');
			console.log(`  Response: ${text}\n`);
			return false;
		}

		console.log('  Reading stream...');
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let toolCallsFound = false;
		let chunks = 0;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value);
			chunks++;

			// Look for tool_calls in stream
			if (chunk.includes('tool_calls')) {
				toolCallsFound = true;
			}

			process.stdout.write('.');
		}

		console.log(`\n  ✅ Read ${chunks} chunks`);
		console.log(`  Tool calls detected: ${toolCallsFound ? '✅ YES' : '❌ NO'}\n`);

		return true;
	} catch (error) {
		console.log(`  ❌ FAIL: ${error.message}\n`);
		return false;
	}
}

async function runAllTests() {
	const results = {
		step1: await testStep1_keyValidity(),
		step2: await testStep2_simpleCompletion(),
		step3: await testStep3_completionWithTools(),
		step4: await testStep4_streamingWithTools(),
	};

	console.log('=== SUMMARY ===');
	console.log(`Step 1 (API Key): ${results.step1 ? '✅ PASS' : '❌ FAIL'}`);
	console.log(`Step 2 (Simple): ${results.step2 ? '✅ PASS' : '❌ FAIL'}`);
	console.log(`Step 3 (With Tools): ${results.step3 ? '✅ PASS' : '❌ FAIL'}`);
	console.log(`Step 4 (Streaming): ${results.step4 ? '✅ PASS' : '❌ FAIL'}`);
	console.log();

	// Find first failure
	if (!results.step1) {
		console.log('🔍 BROKEN AT: Step 1 - API key validation');
	} else if (!results.step2) {
		console.log('🔍 BROKEN AT: Step 2 - Simple completion');
	} else if (!results.step3) {
		console.log('🔍 BROKEN AT: Step 3 - Completion with tools');
	} else if (!results.step4) {
		console.log('🔍 BROKEN AT: Step 4 - Streaming with tools');
	} else {
		console.log('✅ ALL TESTS PASSED');
	}
}

runAllTests().catch(console.error);
