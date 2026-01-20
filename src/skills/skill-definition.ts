/**
 * Skill Definition
 *
 * TypeScript interfaces and types for the skills system.
 * Skills are reusable, domain-specific capabilities that can extend Floyd CLI.
 *
 * @module skills/skill-definition
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Skill metadata
 */
export interface SkillMetadata {
	/** Unique skill identifier */
	id: string;

	/** Skill name */
	name: string;

	/** Skill description */
	description: string;

	/** Skill version */
	version: string;

	/** Skill author */
	author?: string;

	/** Skill tags for categorization */
	tags: string[];

	/** Skill category (e.g., 'testing', 'documentation', 'refactoring') */
	category?: string;

	/** Path to skill directory */
	path: string;

	/** Whether skill is enabled */
	enabled: boolean;
}

/**
 * Skill parameter definition
 */
export interface SkillParameter {
	/** Parameter name */
	name: string;

	/** Parameter type */
	type: 'string' | 'number' | 'boolean' | 'object' | 'array';

	/** Parameter description */
	description?: string;

	/** Whether parameter is required */
	required: boolean;

	/** Default value */
	default?: unknown;

	/** Allowed values (for enums) */
	enum?: unknown[];

	/** Validation pattern (for strings) */
	pattern?: RegExp;
}

/**
 * Skill tool definition - tools that the skill provides to agents
 */
export interface SkillTool {
	/** Tool name */
	name: string;

	/** Tool description */
	description: string;

	/** Tool category */
	category?: string;

	/** Input parameters */
	parameters?: SkillParameter[];

	/** Handler function */
	handler: SkillToolHandler;

	/** Whether tool is dangerous (requires confirmation) */
	dangerous?: boolean;

	/** Permission level required */
	permission?: 'allow' | 'ask' | 'deny';
}

/**
 * Skill tool handler function
 */
export type SkillToolHandler = (
	input: Record<string, unknown>,
	context: SkillExecutionContext,
) => Promise<unknown> | unknown;

/**
 * Skill slash command definition
 */
export interface SkillSlashCommand {
	/** Command name (without the /) */
	name: string;

	/** Command description */
	description: string;

	/** Usage string */
	usage?: string;

	/** Examples */
	examples?: string[];

	/** Handler function */
	handler: SkillCommandHandler;

	/** Parameters */
	parameters?: SkillParameter[];
}

/**
 * Skill command handler function
 */
export type SkillCommandHandler = (
	args: string[],
	context: SkillExecutionContext,
) => Promise<void> | void;

/**
 * Skill lifecycle hooks
 */
export interface SkillLifecycleHooks {
	/** Called when skill is loaded */
	onLoad?: () => Promise<void> | void;

	/** Called before skill execution */
	beforeExecution?: (context: SkillExecutionContext) => Promise<void> | void;

	/** Called after skill execution */
	afterExecution?: (
		context: SkillExecutionContext,
		result: unknown,
	) => Promise<void> | void;

	/** Called when skill is unloaded */
	onUnload?: () => Promise<void> | void;
}

/**
 * Skill execution context
 */
export interface SkillExecutionContext {
	/** Working directory */
	cwd: string;

	/** Environment variables */
	env: Record<string, string>;

	/** Session ID */
	sessionId: string;

	/** Agent or manager invoking the skill */
	invoker: 'agent' | 'manager' | 'user';

	/** Input arguments (can be object for tools or string for commands) */
	input: Record<string, unknown> | string;

	/** Metadata */
	metadata?: Record<string, unknown>;
}

/**
 * Skill definition - complete skill configuration
 */
export interface SkillDefinition {
	/** Skill metadata */
	metadata: SkillMetadata;

	/** Tools provided by this skill */
	tools?: SkillTool[];

	/** Slash commands provided by this skill */
	commands?: SkillSlashCommand[];

	/** Dependencies on other skills */
	dependencies?: string[];

	/** Lifecycle hooks */
	hooks?: SkillLifecycleHooks;

	/** Skill configuration schema */
	config?: SkillParameter[];
}

/**
 * Skill manifest - parsed from skill.json file
 */
export interface SkillManifest {
	/** Skill ID */
	id: string;

	/** Skill name */
	name: string;

	/** Skill description */
	description: string;

	/** Skill version */
	version: string;

	/** Skill author */
	author?: string;

	/** Skill tags */
	tags: string[];

	/** Skill category */
	category?: string;

	/** Entry point file (relative to skill directory) */
	main: string;

	/** Dependencies */
	dependencies?: string[];

	/** Configuration schema */
	config?: Record<string, unknown>;
}

/**
 * Skill instance - loaded and ready to use
 */
export interface SkillInstance {
	/** Skill metadata */
	metadata: SkillMetadata;

	/** Skill manifest */
	manifest: SkillManifest;

	/** Loaded definition */
	definition: SkillDefinition;

	/** Skill configuration */
	config: Record<string, unknown>;

	/** Whether skill is loaded */
	loaded: boolean;

	/** Load time */
	loadedAt?: Date;
}

/**
 * Skill execution result
 */
export interface SkillExecutionResult {
	/** Whether execution was successful */
	success: boolean;

	/** Result data */
	data?: unknown;

	/** Error message (if failed) */
	error?: string;

	/** Execution duration in ms */
	duration: number;

	/** Skill that was executed */
	skillId: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate skill metadata
 */
export function validateSkillMetadata(
	metadata: Partial<SkillMetadata>,
): string[] {
	const errors: string[] = [];

	if (!metadata.id) {
		errors.push('Skill ID is required');
	} else if (!/^[a-z0-9-]+$/.test(metadata.id)) {
		errors.push('Skill ID must contain only lowercase letters, numbers, and hyphens');
	}

	if (!metadata.name) {
		errors.push('Skill name is required');
	}

	if (!metadata.description) {
		errors.push('Skill description is required');
	}

	if (!metadata.version) {
		errors.push('Skill version is required');
	}

	if (!Array.isArray(metadata.tags)) {
		errors.push('Skill tags must be an array');
	}

	return errors;
}

/**
 * Validate skill tool definition
 */
export function validateSkillTool(tool: Partial<SkillTool>): string[] {
	const errors: string[] = [];

	if (!tool.name) {
		errors.push('Tool name is required');
	} else if (!/^[a-z0-9-_.]+$/.test(tool.name)) {
		errors.push('Tool name must contain only lowercase letters, numbers, hyphens, underscores, and dots');
	}

	if (!tool.description) {
		errors.push('Tool description is required');
	}

	if (typeof tool.handler !== 'function') {
		errors.push('Tool handler must be a function');
	}

	return errors;
}

/**
 * Validate skill slash command definition
 */
export function validateSkillSlashCommand(
	command: Partial<SkillSlashCommand>,
): string[] {
	const errors: string[] = [];

	if (!command.name) {
		errors.push('Command name is required');
	} else if (!/^[a-z0-9-]+$/.test(command.name)) {
		errors.push('Command name must contain only lowercase letters, numbers, and hyphens');
	}

	if (!command.description) {
		errors.push('Command description is required');
	}

	if (typeof command.handler !== 'function') {
		errors.push('Command handler must be a function');
	}

	return errors;
}
