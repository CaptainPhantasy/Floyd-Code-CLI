/**
 * VS Code Agent File Validator
 * 
 * Validates .agent.md files against VS Code's schema requirements.
 * Ensures proper frontmatter format with only supported attributes.
 */

import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Supported VS Code agent file attributes
 */
const SUPPORTED_ATTRIBUTES = [
	'argument-hint',
	'description',
	'handoffs',
	'infer',
	'model',
	'name',
	'target',
	'tools'
] as const;

type AgentAttribute = typeof SUPPORTED_ATTRIBUTES[number];

interface AgentFrontmatter {
	name?: string;
	description?: string;
	model?: string;
	'argument-hint'?: string;
	tools?: string[];
	handoffs?: string[];
	target?: string;
	infer?: boolean;
	[key: string]: unknown;
}

interface ValidationError {
	type: 'error' | 'warning';
	line?: number;
	attribute?: string;
	message: string;
	fix?: {
		description: string;
		oldContent: string;
		newContent: string;
	};
}

interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
	filePath: string;
	frontmatter?: AgentFrontmatter;
}

/**
 * Extract frontmatter from agent file
 */
function extractFrontmatter(content: string): {
	frontmatter: string | null;
	body: string;
	startLine: number;
	endLine: number;
} {
	const lines = content.split('\n');
	let frontmatterStart = -1;
	let frontmatterEnd = -1;

	// Find frontmatter delimiters
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (line === '---') {
			if (frontmatterStart === -1) {
				frontmatterStart = i;
			} else {
				frontmatterEnd = i;
				break;
			}
		}
	}

	if (frontmatterStart === -1 || frontmatterEnd === -1) {
		return {
			frontmatter: null,
			body: content,
			startLine: 0,
			endLine: 0
		};
	}

	const frontmatterLines = lines.slice(frontmatterStart + 1, frontmatterEnd);
	const bodyLines = lines.slice(frontmatterEnd + 1);

	return {
		frontmatter: frontmatterLines.join('\n'),
		body: bodyLines.join('\n'),
		startLine: frontmatterStart,
		endLine: frontmatterEnd
	};
}

/**
 * Validate agent file frontmatter
 */
export async function validateAgentFile(filePath: string): Promise<ValidationResult> {
	const errors: ValidationError[] = [];

	// Check file exists
	if (!await fs.pathExists(filePath)) {
		return {
			valid: false,
			errors: [{
				type: 'error',
				message: `File not found: ${filePath}`
			}],
			filePath
		};
	}

	// Read file content
	const content = await fs.readFile(filePath, 'utf-8');
	const { frontmatter, body, startLine, endLine } = extractFrontmatter(content);

	// Check for frontmatter
	if (!frontmatter) {
		errors.push({
			type: 'error',
			message: 'No YAML frontmatter found. Agent files must start with YAML frontmatter delimited by ---',
			fix: {
				description: 'Add YAML frontmatter at the beginning of the file',
				oldContent: content.split('\n').slice(0, 5).join('\n'),
				newContent: `---\nname: ${path.basename(filePath, '.agent.md')}\ndescription: TODO: Add description\n---\n\n${content}`
			}
		});
		return { valid: false, errors, filePath };
	}

	// Parse YAML
	let parsed: AgentFrontmatter;
	try {
		parsed = yaml.load(frontmatter) as AgentFrontmatter;
	} catch (err) {
		errors.push({
			type: 'error',
			line: startLine,
			message: `Invalid YAML syntax: ${err instanceof Error ? err.message : String(err)}`
		});
		return { valid: false, errors, filePath };
	}

	// Validate required attributes
	if (!parsed.name) {
		errors.push({
			type: 'error',
			attribute: 'name',
			message: 'Required attribute "name" is missing',
			fix: {
				description: 'Add name attribute',
				oldContent: frontmatter,
				newContent: `name: ${path.basename(filePath, '.agent.md')}\n${frontmatter}`
			}
		});
	}

	// Check for unsupported attributes
	const unsupportedAttrs = Object.keys(parsed).filter(
		key => !SUPPORTED_ATTRIBUTES.includes(key as AgentAttribute)
	);

	if (unsupportedAttrs.length > 0) {
		for (const attr of unsupportedAttrs) {
			const value = parsed[attr];
			const isCommentLike = typeof value === 'string' && 
				(value.startsWith('//') || value.includes('\n//'));

			errors.push({
				type: 'error',
				attribute: attr,
				message: `Attribute "${attr}" is not supported in VS Code agent files. Supported: ${SUPPORTED_ATTRIBUTES.join(', ')}`,
				fix: isCommentLike ? {
					description: `Move "${attr}" content to description or remove it`,
					oldContent: `${attr}: ${value}`,
					newContent: `# Moved from ${attr}:\n${value}`
				} : {
					description: `Remove unsupported attribute "${attr}"`,
					oldContent: frontmatter,
					newContent: frontmatter.split('\n')
						.filter(line => !line.trim().startsWith(`${attr}:`))
						.join('\n')
				}
			});
		}
	}

	// Validate description format (should be proper YAML string, not comment-style)
	if (parsed.description && typeof parsed.description === 'string') {
		const lines = parsed.description.split('\n');
		const hasCommentStyle = lines.some(line => line.trim().startsWith('//'));
		
		if (hasCommentStyle) {
			errors.push({
				type: 'warning',
				attribute: 'description',
				message: 'Description contains comment-style lines (//) which should be proper markdown',
				fix: {
					description: 'Convert comment-style lines to markdown',
					oldContent: parsed.description,
					newContent: parsed.description.replace(/^(\s*)\/\/ /gm, '$1')
				}
			});
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		filePath,
		frontmatter: parsed
	};
}

/**
 * Validate all agent files in a directory
 */
export async function validateAgentDirectory(dirPath: string): Promise<ValidationResult[]> {
	const results: ValidationResult[] = [];

	if (!await fs.pathExists(dirPath)) {
		return results;
	}

	const files = await fs.readdir(dirPath);
	const agentFiles = files.filter(f => f.endsWith('.agent.md') || f.endsWith('.md'));

	for (const file of agentFiles) {
		const filePath = path.join(dirPath, file);
		const result = await validateAgentFile(filePath);
		results.push(result);
	}

	return results;
}

/**
 * Auto-fix agent file issues
 */
export async function fixAgentFile(filePath: string, dryRun = false): Promise<{
	fixed: boolean;
	changes: string[];
	newContent?: string;
}> {
	const validation = await validateAgentFile(filePath);
	const changes: string[] = [];

	if (validation.valid) {
		return { fixed: false, changes: ['No issues found'] };
	}

	let content = await fs.readFile(filePath, 'utf-8');

	// Apply fixes in reverse order to preserve line numbers
	const fixableErrors = validation.errors.filter(e => e.fix);
	
	for (const error of fixableErrors) {
		if (!error.fix) continue;

		content = content.replace(error.fix.oldContent, error.fix.newContent);
		changes.push(`✓ ${error.fix.description}`);
	}

	if (!dryRun && changes.length > 0) {
		await fs.writeFile(filePath, content, 'utf-8');
	}

	return {
		fixed: changes.length > 0,
		changes,
		newContent: content
	};
}

/**
 * Format validation results for display
 */
export function formatValidationResults(results: ValidationResult[]): string {
	const output: string[] = [];

	for (const result of results) {
		const fileName = path.basename(result.filePath);
		
		if (result.valid) {
			output.push(`✓ ${fileName} - Valid`);
		} else {
			output.push(`✗ ${fileName} - ${result.errors.length} issue(s):`);
			
			for (const error of result.errors) {
				const icon = error.type === 'error' ? '  ✗' : '  ⚠';
				const location = error.line ? ` [Line ${error.line}]` : '';
				const attr = error.attribute ? ` (${error.attribute})` : '';
				output.push(`${icon}${location}${attr} ${error.message}`);
				
				if (error.fix) {
					output.push(`    💡 Fix: ${error.fix.description}`);
				}
			}
			output.push('');
		}
	}

	return output.join('\n');
}
