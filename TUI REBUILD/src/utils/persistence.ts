/**
 * State persistence using Floyd Supercache Server
 *
 * Saves and loads TUI state across sessions:
 * - User preferences (mode, thinking enabled)
 * - Provider configuration (provider, model)
 * - Recent messages (last 10)
 */

import {type FloydMode} from '../store/tui-store.js';
import type {ChatMessage} from '../store/tui-store.js';

const SUPERCACHE_SERVER =
	process.env.FLOYD_SUPERCACHE_PATH ||
	'/Volumes/Storage/MCP/floyd-supercache-server/dist/index.js';

const CACHE_KEYS = {
	MODE: 'tui:mode',
	THINKING_ENABLED: 'tui:thinkingEnabled',
	PROVIDER: 'tui:provider',
	MODEL: 'tui:model',
	RECENT_MESSAGES: 'tui:recentMessages',
} as const;

interface CachedState {
	mode?: FloydMode;
	thinkingEnabled?: boolean;
	provider?: string;
	model?: string;
	recentMessages?: ChatMessage[];
}

/**
 * Save a single key-value pair to cache
 */
export async function saveCache(key: string, value: string): Promise<boolean> {
	try {
		const {execSync} = await import('child_process');
		const payload = {
			jsonrpc: '2.0',
			id: Date.now(),
			method: 'tools/call',
			params: {
				name: 'cache_store',
				arguments: {key, value},
			},
		};
		const cmd = `echo '${JSON.stringify(payload).replace(
			/'/g,
			"'\\''",
		)}' | node ${SUPERCACHE_SERVER}`;
		const output = execSync(cmd, {
			encoding: 'utf-8',
			timeout: 5000,
			stdio: ['pipe', 'pipe', 'ignore'],
		});
		if (output) {
			const response = JSON.parse(output.trim());
			// Response format: { result: { content: [{ type: "text", text: "{\"success\":true,...}" }] } }
			if (response.result?.content?.[0]?.text) {
				const result = JSON.parse(response.result.content[0].text);
				return result.success === true;
			}
		}
		return false;
	} catch (error) {
		if (process.env.FLOYD_DEBUG) {
			console.debug('Cache operation failed:', error);
		}
		return false;
	}
}

/**
 * Load a value from cache by key
 */
export async function loadCache(key: string): Promise<string | null> {
	try {
		const {execSync} = await import('child_process');
		const payload = {
			jsonrpc: '2.0',
			id: Date.now(),
			method: 'tools/call',
			params: {
				name: 'cache_retrieve',
				arguments: {key},
			},
		};
		const cmd = `echo '${JSON.stringify(payload).replace(
			/'/g,
			"'\\''",
		)}' | node ${SUPERCACHE_SERVER}`;
		const output = execSync(cmd, {
			encoding: 'utf-8',
			timeout: 5000,
			stdio: ['pipe', 'pipe', 'ignore'],
		});
		if (output) {
			const response = JSON.parse(output.trim());
			// Response format: { result: { content: [{ type: "text", text: "{...}" }] } }
			// When found: {"key": "...", "value": "...", ...}
			// When not found: {"error": "Key not found", "key": "..."}
			if (response.result?.content?.[0]?.text) {
				const result = JSON.parse(response.result.content[0].text);
				if (result.error === 'Key not found') {
					return null;
				}
				if (result.value !== undefined) {
					return result.value as string;
				}
			}
		}
	} catch (error) {
		// Silent failure is intentional - cache unavailable is non-fatal
		if (process.env.FLOYD_DEBUG) {
			console.debug('Cache load failed:', error);
		}
	}
	return null;
}

/**
 * Save all TUI state to cache
 */
export async function saveState(state: Partial<CachedState>): Promise<boolean> {
	const results = await Promise.allSettled([
		state.mode !== undefined
			? saveCache(CACHE_KEYS.MODE, state.mode)
			: Promise.resolve(true),
		state.thinkingEnabled !== undefined
			? saveCache(CACHE_KEYS.THINKING_ENABLED, String(state.thinkingEnabled))
			: Promise.resolve(true),
		state.provider !== undefined
			? saveCache(CACHE_KEYS.PROVIDER, state.provider)
			: Promise.resolve(true),
		state.model !== undefined
			? saveCache(CACHE_KEYS.MODEL, state.model)
			: Promise.resolve(true),
		state.recentMessages !== undefined
			? saveCache(
					CACHE_KEYS.RECENT_MESSAGES,
					JSON.stringify(state.recentMessages),
			  )
			: Promise.resolve(true),
	]);

	return results.every(r => r.status === 'fulfilled' && r.value === true);
}

/**
 * Load all TUI state from cache
 */
export async function loadState(): Promise<Partial<CachedState>> {
	const [mode, thinkingEnabled, provider, model, recentMessages] =
		await Promise.all([
			loadCache(CACHE_KEYS.MODE),
			loadCache(CACHE_KEYS.THINKING_ENABLED),
			loadCache(CACHE_KEYS.PROVIDER),
			loadCache(CACHE_KEYS.MODEL),
			loadCache(CACHE_KEYS.RECENT_MESSAGES),
		]);

	return {
		mode: (mode as FloydMode | null) ?? undefined,
		thinkingEnabled: thinkingEnabled === 'true',
		provider: provider ?? undefined,
		model: model ?? undefined,
		recentMessages: recentMessages
			? (JSON.parse(recentMessages) as ChatMessage[])
			: undefined,
	};
}

/**
 * Clear all cached TUI state
 */
export async function clearState(): Promise<boolean> {
	try {
		const {execSync} = await import('child_process');
		const payload = {
			jsonrpc: '2.0',
			id: Date.now(),
			method: 'tools/call',
			params: {
				name: 'cache_delete',
				arguments: {
					pattern: 'tui:',
				},
			},
		};
		const cmd = `echo '${JSON.stringify(payload).replace(
			/'/g,
			"'\\''",
		)}' | node ${SUPERCACHE_SERVER}`;
		execSync(cmd, {
			encoding: 'utf-8',
			timeout: 5000,
			stdio: ['pipe', 'pipe', 'ignore'],
		});
		return true;
	} catch (error) {
		if (process.env.FLOYD_DEBUG) {
			console.debug('Cache operation failed:', error);
		}
		return false;
	}
}

/**
 * Initialize state from cache on app startup
 */
export async function initializeState(): Promise<Partial<CachedState>> {
	const cached = await loadState();

	if (Object.keys(cached).length > 0) {
		console.log('✓ Loaded state from cache');
	}

	return cached;
}
