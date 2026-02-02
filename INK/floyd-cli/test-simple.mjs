import { AgentEngine } from 'floyd-agent-core';
import { MCPClientManager } from 'floyd-agent-core';
import { BUILTIN_SERVERS } from './dist/config/builtin-servers.js';
import { ConfigLoader } from './dist/utils/config.js';
import { PermissionManager } from 'floyd-agent-core';
import { SessionManager } from 'floyd-agent-core';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
try { dotenv.config({ path: `${process.env.HOME}/.floyd/.env.local` }); } catch(e) {}

async function test() {
	const mcp = new MCPClientManager(BUILTIN_SERVERS);
	await mcp.startBuiltinServers();
	await mcp.connectExternalServers(process.cwd());

	const config = await ConfigLoader.loadProjectConfig();
	const engine = new AgentEngine(
		{
			apiKey: process.env.FLOYD_GLM_API_KEY || process.env.GLM_API_KEY,
			baseURL: process.env.FLOYD_GLM_ENDPOINT || process.env.GLM_ENDPOINT,
			model: process.env.FLOYD_GLM_MODEL || process.env.GLM_MODEL,
		},
		mcp,
		new SessionManager(),
		new PermissionManager(['*']),
		config,
	);

	await engine.initSession(process.cwd());

	console.log('Sending: Write "test" to test.txt');
	for await (const chunk of engine.sendMessage('Write "test" to test.txt')) {
		process.stdout.write(chunk);
	}
}

test().catch(err => {
	console.error('ERROR:', err);
	console.error('Stack:', err.stack);
});
