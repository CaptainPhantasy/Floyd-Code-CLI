/**
 * Skills System
 *
 * Main entry point for the skills system.
 * Exports the skill registry, executor, and type definitions.
 *
 * @module skills
 */

export {SkillRegistry, getDefaultRegistry, resetDefaultRegistry} from './skill-registry.js';
export {SkillExecutor, getDefaultExecutor, resetDefaultExecutor} from './skill-executor.js';

export type {
	// Core types
	SkillDefinition,
	SkillInstance,
	SkillManifest,
	SkillMetadata,

	// Tool types
	SkillTool,
	SkillToolHandler,

	// Command types
	SkillSlashCommand,
	SkillCommandHandler,

	// Parameter types
	SkillParameter,

	// Lifecycle types
	SkillLifecycleHooks,
	SkillExecutionContext,

	// Result types
	SkillExecutionResult,

	// Validation functions
	validateSkillMetadata,
	validateSkillTool,
	validateSkillSlashCommand,
} from './skill-definition.js';

// Re-export registry options from skill-registry
export type {SkillRegistryOptions, SkillDiscoveryResult, SkillLoadResult} from './skill-registry.js';

// Re-export executor options from skill-executor
export type {SkillExecutorOptions} from './skill-executor.js';
