/**
 * MCP Cache Server - SUPERCACHE Implementation
 *
 * Provides 3-tier caching system for FLOYD:
 * - Tier 1: Reasoning - Current conversation (5 min TTL)
 * - Tier 2: Project - Project context (24 hours TTL)
 * - Tier 3: Vault - Reusable wisdom (7 days TTL)
 *
 * Tools:
 * - cache_store: Store data to a cache tier
 * - cache_retrieve: Retrieve data from a cache tier
 * - cache_delete: Delete a cache entry
 * - cache_clear: Clear all entries from a tier
 * - cache_list: List all entries in a tier
 * - cache_search: Search for entries in a tier
 * - cache_stats: Get statistics for cache tiers
 * - cache_prune: Remove expired entries
 * - cache_store_pattern: Store a reusable pattern to the vault
 * - cache_store_reasoning: Store a reasoning frame
 * - cache_load_reasoning: Load the active reasoning frame
 */

import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import {fileURLToPath} from 'url';
import {CacheManager, type CacheTier, type ReasoningFrame} from '../cache/cache-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine project root (assume we're in INK/floyd-cli/src/mcp/)
const projectRoot = path.resolve(__dirname, '..', '..');

// Global cache manager instance
let cacheManager: CacheManager | null = null;

function getCacheManager(): CacheManager {
	if (!cacheManager) {
		cacheManager = new CacheManager(projectRoot);
	}
	return cacheManager;
}

/**
 * Create and start the MCP cache server
 */
export async function createCacheServer(): Promise<Server> {
	const server = new Server(
		{
			name: 'floyd-cache-server',
			version: '0.1.0',
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	server.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: [
				{
					name: 'cache_store',
					description:
						'Store data to a cache tier with optional metadata',
					inputSchema: {
						type: 'object',
						properties: {
							tier: {
								type: 'string',
								enum: ['reasoning', 'project', 'vault'],
								description: 'Cache tier to store in',
							},
							key: {
								type: 'string',
								description: 'Unique key for the cache entry',
							},
							value: {
								type: 'string',
								description: 'Value to store',
							},
							metadata: {
								type: 'object',
								description: 'Optional metadata as JSON object',
							},
						},
						required: ['tier', 'key', 'value'],
					},
				},
				{
					name: 'cache_retrieve',
					description:
						'Retrieve data from a cache tier by key',
					inputSchema: {
						type: 'object',
						properties: {
							tier: {
								type: 'string',
								enum: ['reasoning', 'project', 'vault'],
								description: 'Cache tier to retrieve from',
							},
							key: {
								type: 'string',
								description: 'Key to retrieve',
							},
						},
						required: ['tier', 'key'],
					},
				},
				{
					name: 'cache_delete',
					description:
						'Delete a cache entry by key',
					inputSchema: {
						type: 'object',
						properties: {
							tier: {
								type: 'string',
								enum: ['reasoning', 'project', 'vault'],
								description: 'Cache tier',
							},
							key: {
								type: 'string',
								description: 'Key to delete',
							},
						},
						required: ['tier', 'key'],
					},
				},
				{
					name: 'cache_clear',
					description:
						'Clear all entries from a cache tier, or all tiers if not specified',
					inputSchema: {
						type: 'object',
						properties: {
							tier: {
								type: 'string',
								enum: ['reasoning', 'project', 'vault'],
								description: 'Cache tier to clear (omits to clear all)',
							},
						},
					},
				},
				{
					name: 'cache_list',
					description:
						'List all non-expired entries in a cache tier',
					inputSchema: {
						type: 'object',
						properties: {
							tier: {
								type: 'string',
								enum: ['reasoning', 'project', 'vault'],
								description: 'Cache tier to list (omits to list all)',
							},
						},
					},
				},
				{
					name: 'cache_search',
					description:
						'Search for entries in a cache tier by key or value',
					inputSchema: {
						type: 'object',
						properties: {
							tier: {
								type: 'string',
								enum: ['reasoning', 'project', 'vault'],
								description: 'Cache tier to search',
							},
							query: {
								type: 'string',
								description: 'Search query (matches key or value)',
							},
						},
						required: ['tier', 'query'],
					},
				},
				{
					name: 'cache_stats',
					description:
						'Get statistics for cache tiers (entry count, size, oldest/newest)',
					inputSchema: {
						type: 'object',
						properties: {
							tier: {
								type: 'string',
								enum: ['reasoning', 'project', 'vault'],
								description: 'Cache tier to get stats for (omits to get all)',
							},
						},
					},
				},
				{
					name: 'cache_prune',
					description:
						'Remove all expired entries from cache tiers',
					inputSchema: {
						type: 'object',
						properties: {
							tier: {
								type: 'string',
								enum: ['reasoning', 'project', 'vault'],
								description: 'Cache tier to prune (omits to prune all)',
							},
						},
					},
				},
				{
					name: 'cache_store_pattern',
					description:
						'Store a reusable pattern to the vault tier',
					inputSchema: {
						type: 'object',
						properties: {
							name: {
								type: 'string',
								description: 'Pattern name',
							},
							pattern: {
								type: 'string',
								description: 'Pattern content (code, solution, etc.)',
							},
							tags: {
								type: 'array',
								items: {type: 'string'},
								description: 'Optional tags for categorization',
							},
						},
						required: ['name', 'pattern'],
					},
				},
				{
					name: 'cache_store_reasoning',
					description:
						'Store a reasoning frame to the active reasoning frame',
					inputSchema: {
						type: 'object',
						properties: {
							frame: {
								type: 'string',
								description: 'Reasoning frame as JSON string',
							},
						},
						required: ['frame'],
					},
				},
				{
					name: 'cache_load_reasoning',
					description:
						'Load the active reasoning frame',
					inputSchema: {
						type: 'object',
						properties: {},
					},
				},
				{
					name: 'cache_archive_reasoning',
					description:
						'Archive the active reasoning frame to the archive',
					inputSchema: {
						type: 'object',
						properties: {},
					},
				},
			],
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async request => {
		const {name, arguments: args} = request.params;
		const cache = getCacheManager();

		try {
			switch (name) {
				case 'cache_store': {
					const {tier, key, value, metadata} = args as {
						tier: CacheTier;
						key: string;
						value: string;
						metadata?: Record<string, unknown>;
					};

					await cache.store(tier, key, value, metadata);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									tier,
									key,
									message: `Stored to ${tier} tier`,
								}),
							},
						],
					};
				}

				case 'cache_retrieve': {
					const {tier, key} = args as {
						tier: CacheTier;
						key: string;
					};

					const value = await cache.retrieve(tier, key);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									tier,
									key,
									found: value !== null,
									value,
								}),
							},
						],
					};
				}

				case 'cache_delete': {
					const {tier, key} = args as {
						tier: CacheTier;
						key: string;
					};

					const deleted = await cache.delete(tier, key);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: deleted,
									tier,
									key,
									message: deleted ? 'Deleted' : 'Not found',
								}),
							},
						],
					};
				}

				case 'cache_clear': {
					const {tier} = args as {tier?: CacheTier};

					const count = await cache.clear(tier);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									deleted: count,
									tier: tier || 'all',
									message: `Cleared ${count} entries`,
								}),
							},
						],
					};
				}

				case 'cache_list': {
					const {tier} = args as {tier?: CacheTier};

					const entries = await cache.list(tier);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									count: entries.length,
									entries: entries.map(e => ({
										key: e.key,
										tier: e.tier,
										timestamp: e.timestamp,
										metadata: e.metadata,
									})),
								}),
							},
						],
					};
				}

				case 'cache_search': {
					const {tier, query} = args as {
						tier: CacheTier;
						query: string;
					};

					const results = await cache.search(tier, query);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									query,
									tier,
									count: results.length,
									results: results.map(e => ({
										key: e.key,
										timestamp: e.timestamp,
										metadata: e.metadata,
									})),
								}),
							},
						],
					};
				}

				case 'cache_stats': {
					const {tier} = args as {tier?: CacheTier};

					const stats = await cache.getStats(tier);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(stats, null, 2),
							},
						],
					};
				}

				case 'cache_prune': {
					const {tier} = args as {tier?: CacheTier};

					const pruned = await cache.prune(tier);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									pruned,
									tier: tier || 'all',
									message: `Pruned ${pruned} expired entries`,
								}),
							},
						],
					};
				}

				case 'cache_store_pattern': {
					const {name, pattern, tags} = args as {
						name: string;
						pattern: string;
						tags?: string[];
					};

					await cache.storePattern(name, pattern, tags);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									name,
									tags,
									message: `Pattern stored to vault`,
								}),
							},
						],
					};
				}

				case 'cache_store_reasoning': {
					const {frame} = args as {frame: string};

					const reasoningFrame: ReasoningFrame = JSON.parse(frame);
					await cache.storeReasoningFrame(reasoningFrame);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									steps: reasoningFrame.cog_steps.length,
									message: `Reasoning frame stored with ${reasoningFrame.cog_steps.length} steps`,
								}),
							},
						],
					};
				}

				case 'cache_load_reasoning': {
					const frame = await cache.loadReasoningFrame();

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									found: frame !== null,
									frame,
								}, null, 2),
							},
						],
					};
				}

				case 'cache_archive_reasoning': {
					await cache.archiveFrame();

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify({
									success: true,
									message: 'Active reasoning frame archived',
								}),
							},
						],
					};
				}

				default:
					throw new Error(`Unknown tool: ${name}`);
			}
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify({
							error: (error as Error).message,
							tool: name,
						}),
					},
				],
				isError: true,
			};
		}
	});

	return server;
}

/**
 * Start the cache server (for standalone execution)
 */
export async function startCacheServer(): Promise<void> {
	const server = await createCacheServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);

	// Keep process alive
	console.error('Floyd MCP Cache Server started');
}

// Run server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	startCacheServer().catch(console.error);
}
