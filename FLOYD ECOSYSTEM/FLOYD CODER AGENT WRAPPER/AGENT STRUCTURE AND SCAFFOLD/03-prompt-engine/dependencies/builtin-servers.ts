import {join} from 'path';
import {fileURLToPath} from 'url';
import type {MCPServerConfig} from 'floyd-agent-core/mcp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Always use source TypeScript files with tsx (works in both dev and production)
// tsx handles ESM better than ts-node/esm and can run .ts files directly
// Resolve path relative to project root, not dist
const getServerDir = () => {
	if (__dirname.includes('dist')) {
		// Running from compiled dist - point to source
		return join(__dirname, '..', '..', 'src', 'mcp');
	}
	// Running from source - point to mcp directory
	return join(__dirname, '..', '..', 'src', 'mcp');
};

const serverDir = getServerDir();

/**
 * Built-in MCP servers that run as subprocesses
 * These are CLI-specific servers that provide core functionality
 */
export const BUILTIN_SERVERS: Record<string, MCPServerConfig> = {
	patch: {
		name: 'patch',
		modulePath: join(serverDir, 'patch-server.ts'),
		description: 'Apply unified diffs, edit ranges, insert content, delete ranges',
		enabled: true,
	},
	runner: {
		name: 'runner',
		modulePath: join(serverDir, 'runner-server.ts'),
		description: 'Detect projects, run tests, format, lint, build',
		enabled: true,
	},
	git: {
		name: 'git',
		modulePath: join(serverDir, 'git-server.ts'),
		description: 'Git operations: status, diff, log, commit, branch management',
		enabled: true,
	},
	cache: {
		name: 'cache',
		modulePath: join(serverDir, 'cache-server.ts'),
		description: 'SUPERCACHE - 3-tier caching system (reasoning, project, vault)',
		enabled: true,
	},
	explorer: {
		name: 'explorer',
		modulePath: join(serverDir, 'explorer-server.ts'),
		description: 'Codebase exploration: project map, smart replace, symbol listing',
		enabled: true,
	},
};
