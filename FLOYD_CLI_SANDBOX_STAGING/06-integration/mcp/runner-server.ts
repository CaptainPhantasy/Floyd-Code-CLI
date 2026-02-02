/**
 * MCP Runner Server
 *
 * Provides tools for detecting project types and running tests,
 * formatting, linting, and building with permission-gated execution.
 *
 * Tools:
 * - detect_project: Auto-detect project type (Go/Node/Rust/Python)
 * - run_tests: Run project tests with appropriate command
 * - format: Format code with project's formatter
 * - lint: Run project's linter
 * - build: Build the project
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs-extra';
import path from 'path';
import execa from 'execa';

export type ProjectType = 'node' | 'go' | 'rust' | 'python' | 'unknown';

export interface ProjectDetection {
	type: ProjectType;
	confidence: number;
	packageManager?: 'npm' | 'yarn' | 'pnpm' | 'go' | 'cargo' | 'pip' | 'poetry';
	commands: {
		test?: string;
		format?: string;
		lint?: string;
		build?: string;
	};
	hasConfigFiles: string[];
}

/**
 * Detect the project type by examining files and directories
 */
export async function detectProject(
	projectPath: string = process.cwd(),
): Promise<ProjectDetection> {
	const result: ProjectDetection = {
		type: 'unknown',
		confidence: 0,
		commands: {},
		hasConfigFiles: [],
	};

	try {
		const files = await fs.readdir(projectPath);

		// Check for Node.js projects
		const hasPackageJson = files.includes('package.json');
		const hasTsConfig = files.includes('tsconfig.json');
		const hasPnpmLock = files.includes('pnpm-lock.yaml');
		const hasYarnLock = files.includes('yarn.lock');
		const hasNpmLock = files.includes('package-lock.json');

		if (hasPackageJson) {
			result.type = 'node';
			result.confidence = 0.8;
			result.hasConfigFiles.push('package.json');

			if (hasTsConfig) {
				result.hasConfigFiles.push('tsconfig.json');
				result.confidence += 0.1;
			}

			// Detect package manager
			if (hasPnpmLock) {
				result.packageManager = 'pnpm';
			} else if (hasYarnLock) {
				result.packageManager = 'yarn';
			} else if (hasNpmLock) {
				result.packageManager = 'npm';
			} else {
				result.packageManager = 'npm'; // Default
			}

			// Set default commands based on package manager
			const pm = result.packageManager;
			result.commands.test = `${pm} test`;
			result.commands.lint = `${pm} run lint`;
			result.commands.build = `${pm} run build`;

			// Try to read package.json for scripts
			try {
				const pkgPath = path.join(projectPath, 'package.json');
				const pkg = await fs.readJson(pkgPath);
				if (pkg.scripts) {
					if (pkg.scripts.test) result.commands.test = `${pm} test`;
					if (pkg.scripts.lint) result.commands.lint = `${pm} run lint`;
					if (pkg.scripts.build) result.commands.build = `${pm} run build`;
					if (pkg.scripts.format) result.commands.format = `${pm} run format`;
				}
			} catch {
				// Use defaults
			}
		}

		// Check for Go projects
		const hasGoMod = files.includes('go.mod');
		const hasGoSum = files.includes('go.sum');
		const hasMainGo =
			(await fileExists(path.join(projectPath, 'cmd', 'main.go'))) ||
			(await fileExists(path.join(projectPath, 'main.go')));

		if (hasGoMod || hasGoSum || hasMainGo) {
			// Go takes precedence if strong indicators
			if (hasGoMod) {
				result.type = 'go';
				result.confidence = 0.95;
				result.packageManager = 'go';
				result.hasConfigFiles.push('go.mod');

				result.commands.test = 'go test ./...';
				result.commands.build = 'go build ./...';
				result.commands.lint = 'golangci-lint run';
				result.commands.format = 'gofmt -w .';
			}
		}

		// Check for Rust projects
		const hasCargoToml = files.includes('Cargo.toml');
		const hasCargoLock = files.includes('Cargo.lock');
		const hasSrcRs =
			(await fileExists(path.join(projectPath, 'src', 'main.rs'))) ||
			(await fileExists(path.join(projectPath, 'src', 'lib.rs')));

		if (hasCargoToml || hasCargoLock || hasSrcRs) {
			result.type = 'rust';
			result.confidence = 0.95;
			result.packageManager = 'cargo';
			result.hasConfigFiles.push('Cargo.toml');

			result.commands.test = 'cargo test';
			result.commands.build = 'cargo build';
			result.commands.lint = 'cargo clippy';
			result.commands.format = 'cargo fmt';
		}

		// Check for Python projects
		const hasPyProject = files.includes('pyproject.toml');
		const hasRequirementsTxt = files.includes('requirements.txt');
		const hasSetupPy = files.includes('setup.py');
		const hasMainPy =
			(await fileExists(path.join(projectPath, 'main.py'))) ||
			(await fileExists(path.join(projectPath, 'app.py')));

		if (hasPyProject || hasRequirementsTxt || hasSetupPy || hasMainPy) {
			result.type = 'python';
			result.confidence = hasPyProject ? 0.9 : 0.7;
			result.hasConfigFiles.push(
				hasPyProject ? 'pyproject.toml' : 'requirements.txt',
			);

			// Detect poetry vs pip
			if (hasPyProject) {
				try {
					const pyprojectPath = path.join(projectPath, 'pyproject.toml');
					const content = await fs.readFile(pyprojectPath, 'utf-8');
					if (content.includes('poetry')) {
						result.packageManager = 'poetry';
						result.commands.test = 'poetry run pytest';
						result.commands.lint = 'poetry run pylint';
						result.commands.format = 'poetry run black .';
					}
				} catch {
					// Fall through to pip defaults
				}
			}

			if (!result.packageManager || result.packageManager === 'pip') {
				result.packageManager = 'pip';
				result.commands.test = 'pytest';
				result.commands.lint = 'pylint';
				result.commands.format = 'black .';
			}
		}
	} catch {
		// Return unknown on error
	}

	return result;
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Execute a command and return formatted results
 */
export async function executeCommand(
	command: string,
	args: string[],
	options: {
		cwd?: string;
		timeout?: number;
		env?: Record<string, string>;
	} = {},
): Promise<{
	success: boolean;
	exitCode: number | null;
	stdout: string;
	stderr: string;
	duration: number;
}> {
	const startTime = Date.now();
	const { cwd = process.cwd(), timeout = 30000 } = options;

	try {
		const result = await execa(command, args, {
			cwd,
			timeout,
			reject: false,
			env: { ...process.env, ...options.env },
		});

		return {
			success: result.exitCode === 0,
			exitCode: result.exitCode ?? null,
			stdout: result.stdout || '',
			stderr: result.stderr || '',
			duration: Date.now() - startTime,
		};
	} catch (error) {
		return {
			success: false,
			exitCode: null,
			stdout: '',
			stderr: (error as Error).message,
			duration: Date.now() - startTime,
		};
	}
}

/**
 * Parse a command string into command and args
 */
function parseCommandString(cmdString: string): {
	command: string;
	args: string[];
} {
	const parts = cmdString.trim().split(/\s+/);
	return {
		command: parts[0] || '',
		args: parts.slice(1) || [],
	};
}

/**
 * Run tests for the detected project
 */
export async function runTests(
	projectPath?: string,
	customCommand?: string,
): Promise<{
	success: boolean;
	output: string;
	errorOutput: string;
	exitCode: number | null;
	duration: number;
	projectType: ProjectType;
	command: string;
}> {
	const detection = await detectProject(projectPath);
	const command = customCommand || detection.commands.test;

	if (!command) {
		return {
			success: false,
			output: '',
			errorOutput: `No test command configured for ${detection.type} project`,
			exitCode: null,
			duration: 0,
			projectType: detection.type,
			command: '',
		};
	}

	const { command: cmd, args } = parseCommandString(command);
	const result = await executeCommand(cmd, args, { cwd: projectPath });

	return {
		...result,
		output: result.stdout,
		errorOutput: result.stderr,
		projectType: detection.type,
		command,
	};
}

/**
 * Format code for the detected project
 */
export async function formatCode(
	projectPath?: string,
	customCommand?: string,
): Promise<{
	success: boolean;
	output: string;
	errorOutput: string;
	exitCode: number | null;
	duration: number;
	projectType: ProjectType;
	command: string;
}> {
	const detection = await detectProject(projectPath);
	const command = customCommand || detection.commands.format;

	if (!command) {
		return {
			success: false,
			output: '',
			errorOutput: `No format command configured for ${detection.type} project`,
			exitCode: null,
			duration: 0,
			projectType: detection.type,
			command: '',
		};
	}

	const { command: cmd, args } = parseCommandString(command);
	const result = await executeCommand(cmd, args, { cwd: projectPath });

	return {
		...result,
		output: result.stdout,
		errorOutput: result.stderr,
		projectType: detection.type,
		command,
	};
}

/**
 * Run linter for the detected project
 */
export async function lintCode(
	projectPath?: string,
	customCommand?: string,
): Promise<{
	success: boolean;
	output: string;
	errorOutput: string;
	exitCode: number | null;
	duration: number;
	projectType: ProjectType;
	command: string;
}> {
	const detection = await detectProject(projectPath);
	const command = customCommand || detection.commands.lint;

	if (!command) {
		return {
			success: false,
			output: '',
			errorOutput: `No lint command configured for ${detection.type} project`,
			exitCode: null,
			duration: 0,
			projectType: detection.type,
			command: '',
		};
	}

	const { command: cmd, args } = parseCommandString(command);
	const result = await executeCommand(cmd, args, { cwd: projectPath });

	return {
		...result,
		output: result.stdout,
		errorOutput: result.stderr,
		projectType: detection.type,
		command,
	};
}

/**
 * Build the detected project
 */
export async function buildProject(
	projectPath?: string,
	customCommand?: string,
): Promise<{
	success: boolean;
	output: string;
	errorOutput: string;
	exitCode: number | null;
	duration: number;
	projectType: ProjectType;
	command: string;
}> {
	const detection = await detectProject(projectPath);
	const command = customCommand || detection.commands.build;

	if (!command) {
		return {
			success: false,
			output: '',
			errorOutput: `No build command configured for ${detection.type} project`,
			exitCode: null,
			duration: 0,
			projectType: detection.type,
			command: '',
		};
	}

	const { command: cmd, args } = parseCommandString(command);
	const result = await executeCommand(cmd, args, { cwd: projectPath });

	return {
		...result,
		output: result.stdout,
		errorOutput: result.stderr,
		projectType: detection.type,
		command,
	};
}

/**
 * Check if a permission is granted for execution
 */
interface PermissionStore {
	permissions: Map<string, { granted: boolean; expiresAt: number }>;
}

const permissionStore: PermissionStore = {
	permissions: new Map(),
};

export function checkPermission(
	toolName: string,
	projectPath: string,
): boolean {
	const key = `${toolName}:${projectPath}`;
	const perm = permissionStore.permissions.get(key);

	if (!perm) return false; // Not granted

	if (Date.now() > perm.expiresAt) {
		permissionStore.permissions.delete(key);
		return false;
	}

	return perm.granted;
}

export function grantPermission(
	toolName: string,
	projectPath: string,
	duration = 3600000,
): void {
	const key = `${toolName}:${projectPath}`;
	permissionStore.permissions.set(key, {
		granted: true,
		expiresAt: Date.now() + duration,
	});
}

export function revokePermission(toolName: string, projectPath: string): void {
	const key = `${toolName}:${projectPath}`;
	permissionStore.permissions.delete(key);
}

/**
 * Format test results for display
 */
export function formatTestResults(result: {
	output: string;
	errorOutput: string;
	exitCode: number | null;
	duration: number;
}): string {
	const lines: string[] = [];

	lines.push(`Duration: ${result.duration}ms`);
	lines.push(`Exit Code: ${result.exitCode}`);

	if (result.output) {
		lines.push('\n--- Output ---');
		lines.push(result.output);
	}

	if (result.errorOutput) {
		lines.push('\n--- Errors ---');
		lines.push(result.errorOutput);
	}

	return lines.join('\n');
}

/**
 * Create and start the MCP runner server
 */
export async function createRunnerServer(): Promise<Server> {
	const server = new Server(
		{
			name: 'floyd-runner-server',
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
					name: 'detect_project',
					description:
						'Auto-detect project type (Node/Go/Rust/Python) and available commands',
					inputSchema: {
						type: 'object',
						properties: {
							projectPath: {
								type: 'string',
								description:
									'Path to the project directory (defaults to current working directory)',
							},
						},
					},
				},
				{
					name: 'run_tests',
					description:
						'Run tests for the detected project. Requires permission if not previously granted.',
					inputSchema: {
						type: 'object',
						properties: {
							projectPath: {
								type: 'string',
								description: 'Path to the project directory',
							},
							command: {
								type: 'string',
								description: 'Custom test command (overrides detected command)',
							},
							grantPermission: {
								type: 'boolean',
								description: 'Grant permission for this session',
								default: false,
							},
						},
					},
				},
				{
					name: 'format',
					description:
						"Format code using the project's configured formatter. Requires permission.",
					inputSchema: {
						type: 'object',
						properties: {
							projectPath: {
								type: 'string',
								description: 'Path to the project directory',
							},
							command: {
								type: 'string',
								description:
									'Custom format command (overrides detected command)',
							},
							grantPermission: {
								type: 'boolean',
								description: 'Grant permission for this session',
								default: false,
							},
						},
					},
				},
				{
					name: 'lint',
					description: "Run the project's linter. Requires permission.",
					inputSchema: {
						type: 'object',
						properties: {
							projectPath: {
								type: 'string',
								description: 'Path to the project directory',
							},
							command: {
								type: 'string',
								description: 'Custom lint command (overrides detected command)',
							},
							grantPermission: {
								type: 'boolean',
								description: 'Grant permission for this session',
								default: false,
							},
						},
					},
				},
				{
					name: 'build',
					description: 'Build the project. Requires permission.',
					inputSchema: {
						type: 'object',
						properties: {
							projectPath: {
								type: 'string',
								description: 'Path to the project directory',
							},
							command: {
								type: 'string',
								description:
									'Custom build command (overrides detected command)',
							},
							grantPermission: {
								type: 'boolean',
								description: 'Grant permission for this session',
								default: false,
							},
						},
					},
				},
				{
					name: 'check_permission',
					description: 'Check if permission is granted for a runner operation',
					inputSchema: {
						type: 'object',
						properties: {
							toolName: {
								type: 'string',
								description:
									'Name of the tool (run_tests, format, lint, build)',
								enum: ['run_tests', 'format', 'lint', 'build'],
							},
							projectPath: {
								type: 'string',
								description: 'Path to the project directory',
							},
						},
						required: ['toolName'],
					},
				},
			],
		};
	});

	server.setRequestHandler(CallToolRequestSchema, async request => {
		const { name, arguments: args } = request.params;

		try {
			switch (name) {
				case 'detect_project': {
					const { projectPath } = args as { projectPath?: string };
					const cwd = projectPath || process.cwd();
					const detection = await detectProject(cwd);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(detection, null, 2),
							},
						],
					};
				}

				case 'run_tests':
				case 'format':
				case 'lint':
				case 'build': {
					const {
						projectPath,
						command,
						grantPermission: shouldGrant = false,
					} = args as {
						projectPath?: string;
						command?: string;
						grantPermission?: boolean;
					};

					const cwd = path.resolve(projectPath || process.cwd());

					// Check or grant permission
					if (!checkPermission(name, cwd)) {
						if (shouldGrant) {
							grantPermission(name, cwd);
						} else {
							return {
								content: [
									{
										type: 'text',
										text: JSON.stringify(
											{
												error: 'Permission denied',
												tool: name,
												message: `Permission required to run ${name}. Use grantPermission=true to authorize for this session.`,
												projectPath: cwd,
											},
											null,
											2,
										),
									},
								],
								isError: true,
							};
						}
					}

					let result;
					switch (name) {
						case 'run_tests':
							result = await runTests(cwd, command);
							break;
						case 'format':
							result = await formatCode(cwd, command);
							break;
						case 'lint':
							result = await lintCode(cwd, command);
							break;
						case 'build':
							result = await buildProject(cwd, command);
							break;
						default:
							throw new Error(`Unknown tool: ${name}`);
					}

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(
									{
										...result,
										permissionGranted: true,
									},
									null,
									2,
								),
							},
						],
					};
				}

				case 'check_permission': {
					const { toolName, projectPath } = args as {
						toolName: string;
						projectPath?: string;
					};

					const cwd = path.resolve(projectPath || process.cwd());
					const hasPermission = checkPermission(toolName, cwd);

					return {
						content: [
							{
								type: 'text',
								text: JSON.stringify(
									{
										tool: toolName,
										projectPath: cwd,
										hasPermission,
									},
									null,
									2,
								),
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
 * Start the runner server (for standalone execution)
 */
export async function startRunnerServer(): Promise<void> {
	const server = await createRunnerServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);

	// Keep process alive
	console.error('Floyd MCP Runner Server started');
}

// Run server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	startRunnerServer().catch(console.error);
}
