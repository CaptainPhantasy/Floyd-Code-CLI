/**
 * Schema Validator
 *
 * Purpose: JSON schema validation for configs, tool inputs, and API responses
 * Exports: SchemaValidator class, validateConfig, validateToolInput, validateResponse
 * Related: input-sanitizer.ts, security/audit-logger.ts
 */

import {z} from 'zod';
import path from 'path';
import fs from 'fs-extra';

/**
 * Validation result type
 */
export interface ValidationResult<T = unknown> {
	valid: boolean;
	data?: T;
	errors?: string[];
}

/**
 * Project configuration schema
 */
const projectConfigSchema = z.object({
	systemPrompt: z.string().optional(),
	allowedTools: z.array(z.string()).optional(),
	mcpServers: z.record(z.string(), z.unknown()).optional(),
	maxTokens: z.number().int().positive().optional(),
	temperature: z.number().min(0).max(2).optional(),
	model: z.string().optional(),
	// Nested settings
	settings: z
		.object({
			systemPrompt: z.string().optional(),
			allowedTools: z.array(z.string()).optional(),
			mcpServers: z.record(z.string(), z.unknown()).optional(),
		})
		.optional(),
	// Agent settings
	agent: z
		.object({
			profile: z.string().optional(),
			timeout: z.number().int().positive().optional(),
			maxIterations: z.number().int().positive().optional(),
		})
		.optional(),
	// Security settings
	security: z
		.object({
			allowlistEnabled: z.boolean().optional(),
			sandboxMode: z.boolean().optional(),
			allowedDomains: z.array(z.string()).optional(),
		})
		.optional(),
});

/**
 * Tool input schema for common MCP tools
 */
const toolInputSchemas = {
	// File operations
	readFile: z.object({
		filePath: z.string().min(1),
	}),
	writeFile: z.object({
		filePath: z.string().min(1),
		content: z.string(),
	}),
	deleteFile: z.object({
		filePath: z.string().min(1),
	}),
	// Shell operations
	executeCommand: z.object({
		command: z.string().min(1).max(10_000),
		cwd: z.string().optional(),
		timeout: z.number().int().positive().max(300_000).optional(), // 5 min max
	}),
	// Search operations
	searchFiles: z.object({
		pattern: z.string().min(1).max(500),
		path: z.string().optional(),
	}),
	// Git operations
	gitCommit: z.object({
		message: z.string().min(1).max(2000),
		amend: z.boolean().optional(),
	}),
	// Browser operations
	navigate: z.object({
		url: z.string().url(),
	}),
	click: z.object({
		selector: z.string().min(1),
	}),
	// Generic tool call
	generic: z.object({
		name: z.string().min(1).max(100),
		arguments: z.record(z.string(), z.unknown()),
	}),
};

/**
 * API response schema for Anthropic/GLM API
 */
const apiResponseSchema = z.object({
	id: z.string().optional(),
	type: z.string().optional(),
	role: z.enum(['user', 'assistant', 'system']).optional(),
	content: z.array(z.any()).optional(),
	model: z.string().optional(),
	stopReason: z
		.enum(['end_turn', 'max_tokens', 'stop_sequence', 'tool_use', 'error'])
		.optional(),
	usage: z
		.object({
			inputTokens: z.number().int().nonnegative(),
			outputTokens: z.number().int().nonnegative(),
		})
		.optional(),
	error: z
		.object({
			type: z.string(),
			message: z.string(),
		})
		.optional(),
});

/**
 * Tool call result schema
 */
const toolResultSchema = z.object({
	toolUseId: z.string().optional(),
	content: z.any().optional(),
	isError: z.boolean().optional(),
});

/**
 * SchemaValidator provides JSON schema validation for various data types
 *
 * Features:
 * - Project configuration validation
 * - Tool input parameter validation
 * - API response validation
 * - Custom schema registration
 */
export class SchemaValidator {
	private static customSchemas = new Map<string, z.ZodTypeAny>();

	/**
	 * Register a custom validation schema
	 *
	 * @param name - Schema identifier
	 * @param schema - Zod schema to register
	 */
	static registerSchema(name: string, schema: z.ZodTypeAny): void {
		this.customSchemas.set(name, schema);
	}

	/**
	 * Unregister a custom schema
	 *
	 * @param name - Schema identifier
	 */
	static unregisterSchema(name: string): void {
		this.customSchemas.delete(name);
	}

	/**
	 * Validate a project configuration object
	 *
	 * @param config - Configuration object to validate
	 * @returns ValidationResult with typed data or errors
	 */
	static validateConfig(
		config: unknown,
	): ValidationResult<z.infer<typeof projectConfigSchema>> {
		try {
			const result = projectConfigSchema.safeParse(config);

			if (result.success) {
				return {
					valid: true,
					data: result.data,
				};
			}

			return {
				valid: false,
				errors: result.error.issues.map(
					e => `${e.path.join('.')}: ${e.message}`,
				),
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					`Validation exception: ${
						error instanceof Error ? error.message : String(error)
					}`,
				],
			};
		}
	}

	/**
	 * Load and validate a project config from a directory
	 *
	 * @param projectPath - Path to project directory
	 * @returns ValidationResult with typed data or errors
	 */
	static async loadAndValidateConfig(
		projectPath: string,
	): Promise<ValidationResult<z.infer<typeof projectConfigSchema>>> {
		try {
			const configFiles = [
				path.join(projectPath, '.floyd', 'settings.json'),
				path.join(projectPath, '.claude', 'settings.json'),
				path.join(projectPath, 'floyd.config.json'),
			];

			for (const configFile of configFiles) {
				if (await fs.pathExists(configFile)) {
					try {
						const config = await fs.readJson(configFile);
						return this.validateConfig(config);
					} catch {
						// Invalid JSON, try next file
					}
				}
			}

			// No config file found, return default valid config
			return {
				valid: true,
				data: {
					systemPrompt: undefined,
					allowedTools: undefined,
					mcpServers: undefined,
				},
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					`Failed to load config: ${
						error instanceof Error ? error.message : String(error)
					}`,
				],
			};
		}
	}

	/**
	 * Validate tool input parameters
	 *
	 * @param toolName - Name of the tool being called
	 * @param input - Input parameters to validate
	 * @returns ValidationResult with typed data or errors
	 */
	static validateToolInput<T extends keyof typeof toolInputSchemas>(
		toolName: T,
		input: unknown,
	): ValidationResult<z.infer<(typeof toolInputSchemas)[T]>>;
	static validateToolInput(
		toolName: string,
		input: unknown,
	): ValidationResult<unknown>;
	static validateToolInput(
		toolName: string,
		input: unknown,
	): ValidationResult<unknown> {
		try {
			// Check for custom schema first
			if (this.customSchemas.has(toolName)) {
				const schema = this.customSchemas.get(toolName)!;
				const result = schema.safeParse(input);

				if (result.success) {
					return {valid: true, data: result.data};
				}

				return {
					valid: false,
					errors: result.error.issues.map(
						e => `${e.path.join('.')}: ${e.message}`,
					),
				};
			}

			// Use built-in schema if available
			const schema = (toolInputSchemas as Record<string, z.ZodTypeAny>)[
				toolName
			];
			if (schema) {
				const result = schema.safeParse(input);

				if (result.success) {
					return {valid: true, data: result.data};
				}

				return {
					valid: false,
					errors: result.error.issues.map(
						e => `${e.path.join('.')}: ${e.message}`,
					),
				};
			}

			// No schema found, accept with warning
			return {
				valid: true,
				data: input,
				errors: [
					`No schema found for tool '${toolName}', accepting unvalidated input`,
				],
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					`Validation exception: ${
						error instanceof Error ? error.message : String(error)
					}`,
				],
			};
		}
	}

	/**
	 * Validate an API response
	 *
	 * @param response - API response to validate
	 * @returns ValidationResult with typed data or errors
	 */
	static validateResponse(
		response: unknown,
	): ValidationResult<z.infer<typeof apiResponseSchema>> {
		try {
			const result = apiResponseSchema.safeParse(response);

			if (result.success) {
				return {
					valid: true,
					data: result.data,
				};
			}

			return {
				valid: false,
				errors: result.error.issues.map(
					e => `${e.path.join('.')}: ${e.message}`,
				),
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					`Validation exception: ${
						error instanceof Error ? error.message : String(error)
					}`,
				],
			};
		}
	}

	/**
	 * Validate a tool call result
	 *
	 * @param result - Tool result to validate
	 * @returns ValidationResult with typed data or errors
	 */
	static validateToolResult(
		result: unknown,
	): ValidationResult<z.infer<typeof toolResultSchema>> {
		try {
			const parsed = toolResultSchema.safeParse(result);

			if (parsed.success) {
				return {
					valid: true,
					data: parsed.data,
				};
			}

			return {
				valid: false,
				errors: parsed.error.issues.map(
					e => `${e.path.join('.')}: ${e.message}`,
				),
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					`Validation exception: ${
						error instanceof Error ? error.message : String(error)
					}`,
				],
			};
		}
	}

	/**
	 * Validate against a custom schema
	 *
	 * @param schemaName - Name of registered custom schema
	 * @param data - Data to validate
	 * @returns ValidationResult
	 */
	static validateCustom<T = unknown>(
		schemaName: string,
		data: unknown,
	): ValidationResult<T> {
		const schema = this.customSchemas.get(schemaName);

		if (!schema) {
			return {
				valid: false,
				errors: [`No custom schema found with name '${schemaName}'`],
			};
		}

		try {
			const result = schema.safeParse(data);

			if (result.success) {
				return {
					valid: true,
					data: result.data as T,
				};
			}

			return {
				valid: false,
				errors: result.error.issues.map(
					e => `${e.path.join('.')}: ${e.message}`,
				),
			};
		} catch (error) {
			return {
				valid: false,
				errors: [
					`Validation exception: ${
						error instanceof Error ? error.message : String(error)
					}`,
				],
			};
		}
	}
}

/**
 * Convenience function to validate a config object
 *
 * @param config - Configuration to validate
 * @returns ValidationResult
 */
export function validateConfig(
	config: unknown,
): ReturnType<typeof SchemaValidator.validateConfig> {
	return SchemaValidator.validateConfig(config);
}

/**
 * Convenience function to validate tool input
 *
 * @param toolName - Name of tool
 * @param input - Input parameters
 * @returns ValidationResult
 */
export function validateToolInput(
	toolName: string,
	input: unknown,
): ReturnType<typeof SchemaValidator.validateToolInput> {
	return SchemaValidator.validateToolInput(toolName, input);
}

/**
 * Convenience function to validate an API response
 *
 * @param response - API response to validate
 * @returns ValidationResult
 */
export function validateResponse(
	response: unknown,
): ReturnType<typeof SchemaValidator.validateResponse> {
	return SchemaValidator.validateResponse(response);
}
