/**
 * MCP Runner Server
 *
 * Provides tools for detecting project types and running tests,
 * formatting, linting, and building with permission-gated execution.
 */

import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import {detectProject} from './detector.js';
import {
	buildProject,
	checkPermission,
	formatCode,
	lintCode,
	runTests,
	grantPermission,
} from './executor.js';

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
		const {name, arguments: args} = request.params;

		try {
			switch (name) {
				case 'detect_project': {
					const {projectPath} = args as {projectPath?: string};
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
					const {toolName, projectPath} = args as {
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

export async function startRunnerServer(): Promise<void> {
	const server = await createRunnerServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);

	console.error('Floyd MCP Runner Server started');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	startRunnerServer().catch(console.error);
}
