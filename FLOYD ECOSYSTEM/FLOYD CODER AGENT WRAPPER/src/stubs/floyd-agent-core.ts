/**
 * floyd-agent-core stub
 *
 * Minimal stub for floyd-agent-core module to allow compilation.
 * The real floyd-agent-core is in ../../packages/floyd-agent-core
 *
 * @module stubs/floyd-agent-core
 */

// Re-export types from local store
export type {Message, ToolCall, ToolResult} from '../store/session-store.js';

// Export empty MCP module for now
export const mcp = {};
