/**
 * Manager Agent
 *
 * Top-level orchestrator that coordinates worker swarms and maintains
 * conversation context. Acts as the central coordinator for all agent
 * operations with unlimited tool access and fair resource allocation.
 *
 * @module agent/manager
 */

import {EventEmitter} from 'events';
import Anthropic from '@anthropic-ai/sdk';
import {
	SwarmScheduler,
	SwarmType,
	type SwarmTask,
} from '../throughput/swarm-scheduler.js';
import {
	ModelScheduler,
	type ModelCallOptions,
} from '../throughput/model-scheduler.js';
import {SessionManager, type SessionData} from '../store/session-store.js';
import {PermissionManager} from '../permissions/ask-ui.js';
import type {Message} from '../store/floyd-store.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Swarm types for task routing
 * Includes all SwarmType values except 'manager' (internal)
 */
export type SwarmRole = Exclude<SwarmType, 'manager'>;

/**
 * Subtask for worker delegation
 */
export interface Subtask {
	/** Unique subtask identifier */
	id: string;
	/** Subtask description */
	description: string;
	/** Target swarm for this subtask */
	swarm: SwarmRole;
	/** Priority level (0-10, higher = more important) */
	priority: number;
	/** Estimated token cost */
	estimatedTokens: number;
	/** Input data for the subtask */
	input: Record<string, unknown>;
	/** Dependencies (must complete before this subtask) */
	dependencies: string[];
	/** Current status */
	status: 'pending' | 'active' | 'completed' | 'failed';
	/** Result when completed */
	result?: unknown;
	/** Error if failed */
	error?: string;
}

/**
 * Agent plan with subtasks
 */
export interface AgentPlan {
	/** Plan identifier */
	id: string;
	/** Original task */
	task: string;
	/** Breakdown into subtasks */
	subtasks: Subtask[];
	/** Total estimated tokens */
	totalEstimatedTokens: number;
	/** Execution strategy */
	strategy: 'sequential' | 'parallel' | 'hybrid';
	/** Creation timestamp */
	created: number;
}

/**
 * Worker execution result
 */
export interface WorkerResult {
	/** Subtask ID */
	subtaskId: string;
	/** Swarm that executed */
	swarm: SwarmRole;
	/** Success flag */
	success: boolean;
	/** Result data */
	data?: unknown;
	/** Error message if failed */
	error?: string;
	/** Actual tokens used */
	tokensUsed: number;
	/** Execution duration */
	duration: number;
}

/**
 * Final synthesized result
 */
export interface FinalResult {
	/** Overall success */
	success: boolean;
	/** Synthesized output */
	output: string;
	/** Individual worker results */
	results: WorkerResult[];
	/** Total tokens consumed */
	totalTokens: number;
	/** Total execution time */
	totalDuration: number;
	/** Suggested follow-up actions */
	followUp?: string[];
}

/**
 * Task decomposition result
 */
interface TaskDecomposition {
	/** Identified subtasks */
	subtasks: Omit<Subtask, 'id' | 'status' | 'result' | 'error'>[];
	/** Recommended execution strategy */
	strategy: 'sequential' | 'parallel' | 'hybrid';
	/** Estimated total tokens */
	estimatedTokens: number;
}

/**
 * Manager configuration
 */
export interface ManagerConfig {
	/** Maximum tokens for planning */
	planningTokenBudget: number;
	/** Maximum concurrent workers */
	maxConcurrentWorkers: number;
	/** Default timeout for worker calls (ms) */
	workerTimeout: number;
	/** Manager system prompt */
	systemPrompt: string;
	/** API endpoint for LLM calls */
	apiEndpoint: string;
	/** Model to use for planning */
	planningModel: string;
	/** Model to use for synthesis */
	synthesisModel: string;
}

// ============================================================================
// MANAGER AGENT
// ============================================================================

/**
 * Manager Agent - Top-level orchestrator for worker swarms
 *
 * Responsibilities:
 * - Break down user tasks into subtasks
 * - Route subtasks to appropriate worker swarms
 * - Coordinate parallel execution with fairness
 * - Synthesize worker results into final output
 * - Maintain conversation context and session state
 */
export class ManagerAgent extends EventEmitter {
	private swarmScheduler: SwarmScheduler;
	private modelScheduler: ModelScheduler;
	private sessionManager: SessionManager;
	private permissionManager: PermissionManager;
	private anthropic: Anthropic;
	private config: ManagerConfig;
	private currentSession: SessionData | null = null;
	private activePlans: Map<string, AgentPlan> = new Map();
	private activeWorkers: Map<string, WorkerResult> = new Map();

	constructor(
		apiKey: string,
		sessionManager: SessionManager,
		permissionManager: PermissionManager,
		config?: Partial<ManagerConfig>,
	) {
		super();

		this.sessionManager = sessionManager;
		this.permissionManager = permissionManager;
		this.swarmScheduler = new SwarmScheduler();
		this.modelScheduler = new ModelScheduler(12); // 12 concurrent calls

		// Default configuration
		this.config = {
			planningTokenBudget: 200,
			maxConcurrentWorkers: 4,
			workerTimeout: 30000,
			systemPrompt: this.getSystemPrompt(),
			apiEndpoint: 'https://api.z.ai/api/anthropic',
			planningModel: 'claude-opus-4',
			synthesisModel: 'claude-opus-4',
			...config,
		};

		this.anthropic = new Anthropic({
			apiKey,
			baseURL: this.config.apiEndpoint,
		});

		this.setupEventForwarding();
	}

	// -------------------------------------------------------------------------
	// EVENT FORWARDING
	// -------------------------------------------------------------------------

	private setupEventForwarding(): void {
		// Forward swarm scheduler events
		this.swarmScheduler.on('task.enqueued', (task: SwarmTask) => {
			this.emit('worker.enqueued', task);
		});

		this.swarmScheduler.on('task.started', (task: SwarmTask) => {
			this.emit('worker.started', task);
		});

		this.swarmScheduler.on('task.completed', (task: SwarmTask) => {
			this.emit('worker.completed', task);
		});

		this.swarmScheduler.on(
			'task.failed',
			(data: {task: SwarmTask; error: unknown}) => {
				this.emit('worker.failed', data);
			},
		);

		this.swarmScheduler.on('tokens.refilled', () => {
			this.emit('tokens.refilled');
		});

		// Forward model scheduler events
		this.modelScheduler.on(
			'request.scheduled',
			(data: {id: string; options: ModelCallOptions}) => {
				this.emit('model.scheduled', data);
			},
		);

		this.modelScheduler.on(
			'request.started',
			(data: {id: string; options: ModelCallOptions}) => {
				this.emit('model.started', data);
			},
		);

		this.modelScheduler.on('request.completed', (data: {id: string}) => {
			this.emit('model.completed', data);
		});

		this.modelScheduler.on(
			'request.failed',
			(data: {id: string; error: Error}) => {
				this.emit('model.failed', data);
			},
		);
	}

	// -------------------------------------------------------------------------
	// SESSION MANAGEMENT
	// -------------------------------------------------------------------------

	/**
	 * Initialize a new session or resume existing one
	 */
	async initSession(cwd: string): Promise<SessionData> {
		this.currentSession = await this.sessionManager.createSession(cwd);
		return this.currentSession;
	}

	/**
	 * Load an existing session
	 */
	async loadSession(sessionId: string): Promise<SessionData | null> {
		const session = await this.sessionManager.loadSession(sessionId);
		if (session) {
			this.currentSession = session;
		}
		return session;
	}

	/**
	 * Save current session state
	 */
	async saveSession(): Promise<void> {
		if (this.currentSession) {
			await this.sessionManager.saveSession(this.currentSession);
		}
	}

	/**
	 * Get current session
	 */
	getCurrentSession(): SessionData | null {
		return this.currentSession;
	}

	// -------------------------------------------------------------------------
	// TASK PLANNING
	// -------------------------------------------------------------------------

	/**
	 * Break down a task into subtasks for worker swarms
	 */
	async plan(task: string): Promise<AgentPlan> {
		this.emit('planning.started', {task});

		const decomposition = await this.decomposeTask(task);

		// Generate IDs and set initial status
		const subtasks: Subtask[] = decomposition.subtasks.map((st, index) => ({
			...st,
			id: `subtask-${Date.now()}-${index}`,
			status: 'pending' as const,
		}));

		const plan: AgentPlan = {
			id: `plan-${Date.now()}`,
			task,
			subtasks,
			totalEstimatedTokens: decomposition.estimatedTokens,
			strategy: decomposition.strategy,
			created: Date.now(),
		};

		this.activePlans.set(plan.id, plan);
		this.emit('planning.completed', {plan});

		return plan;
	}

	/**
	 * Use LLM to decompose task into subtasks
	 */
	private async decomposeTask(task: string): Promise<TaskDecomposition> {
		const prompt = this.buildPlanningPrompt(task);

		const response = await this.modelScheduler.schedule(
			async () => {
				const result = await this.anthropic.messages.create({
					model: this.config.planningModel,
					max_tokens: this.config.planningTokenBudget,
					system: this.config.systemPrompt,
					messages: [
						{
							role: 'user',
							content: prompt,
						},
					],
				});

				return result.content[0]?.type === 'text' ? result.content[0].text : '';
			},
			{
				model: this.config.planningModel,
				priority: 10, // Highest priority for planning
				timeout: this.config.workerTimeout,
			},
		);

		// Parse the structured response
		return this.parseDecomposition(response, task);
	}

	/**
	 * Build planning prompt for task decomposition
	 */
	private buildPlanningPrompt(task: string): string {
		return `You are a task planning agent. Break down the following task into subtasks.

Available worker swarms:
- codesearch: Symbol search, code discovery, finding references
- patchmaker: File edits, code generation, refactoring
- tester: Test execution, validation, test generation
- browser: Web interaction, scraping, page automation
- gitops: Git operations, version control

Task: "${task}"

Respond with a JSON object in this format:
{
  "subtasks": [
    {
      "description": "Brief description of what to do",
      "swarm": "codesearch|patchmaker|tester|browser|gitops",
      "priority": 0-10,
      "estimatedTokens": number,
      "input": {},
      "dependencies": []
    }
  ],
  "strategy": "sequential|parallel|hybrid",
  "estimatedTokens": total
}

Be concise. Focus on the essential steps.`;
	}

	/**
	 * Parse LLM response into TaskDecomposition
	 */
	private parseDecomposition(
		response: string,
		originalTask: string,
	): TaskDecomposition {
		try {
			// Try to extract JSON from response
			const jsonMatch = response.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]) as TaskDecomposition;
				return {
					subtasks: parsed.subtasks || [],
					strategy: parsed.strategy || 'hybrid',
					estimatedTokens: parsed.estimatedTokens || 0,
				};
			}
		} catch {
			// Fall through to default
		}

		// Default decomposition if parsing fails
		return {
			subtasks: [
				{
					description: 'Complete task',
					swarm: 'patchmaker',
					priority: 5,
					estimatedTokens: 100,
					input: {originalTask},
					dependencies: [],
				},
			],
			strategy: 'sequential',
			estimatedTokens: 100,
		};
	}

	// -------------------------------------------------------------------------
	// TASK DELEGATION
	// -------------------------------------------------------------------------

	/**
	 * Route a subtask to the appropriate worker swarm
	 */
	async delegate(subtask: Subtask, swarm: SwarmType): Promise<WorkerResult> {
		const startTime = Date.now();
		this.emit('delegate.started', {subtask, swarm});

		// Check permission for tool usage
		const hasPermission = await this.checkSwarmPermissions(swarm);
		if (!hasPermission) {
			const result: WorkerResult = {
				subtaskId: subtask.id,
				swarm: swarm as SwarmRole,
				success: false,
				error: 'Permission denied for swarm',
				tokensUsed: 0,
				duration: Date.now() - startTime,
			};
			this.emit('delegate.failed', result);
			return result;
		}

		// Create swarm task for scheduler
		const swarmTask: SwarmTask = {
			id: subtask.id,
			swarm,
			priority: subtask.priority,
			execute: () => this.executeSwarmTask(subtask, swarm),
		};

		// Enqueue for fair execution
		return new Promise((resolve, reject) => {
			this.swarmScheduler.enqueue(swarmTask);

			// Wait for completion (in production, this would be event-based)
			void this.waitForSwarmCompletion(subtask.id, swarm)
				.then(result => {
					this.emit('delegate.completed', result);
					resolve(result);
				})
				.catch(error => {
					this.emit('delegate.failed', {subtask, error});
					reject(error);
				});
		});
	}

	/**
	 * Execute a task on a specific swarm
	 */
	private async executeSwarmTask(
		subtask: Subtask,
		swarm: SwarmType,
	): Promise<WorkerResult> {
		const startTime = Date.now();

		try {
			// In production, this would call the actual worker
			// For now, we simulate with an LLM call
			const prompt = this.buildSwarmPrompt(subtask, swarm);

			const response = await this.modelScheduler.schedule(
				async () => {
					const result = await this.anthropic.messages.create({
						model: this.config.planningModel,
						max_tokens: subtask.estimatedTokens,
						messages: [
							{
								role: 'user',
								content: prompt,
							},
						],
					});

					return result.content[0]?.type === 'text'
						? result.content[0].text
						: '';
				},
				{
					model: this.config.planningModel,
					priority: subtask.priority,
					timeout: this.config.workerTimeout,
				},
			);

			return {
				subtaskId: subtask.id,
				swarm: swarm as SwarmRole,
				success: true,
				data: response,
				tokensUsed: subtask.estimatedTokens,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			return {
				subtaskId: subtask.id,
				swarm: swarm as SwarmRole,
				success: false,
				error: error instanceof Error ? error.message : String(error),
				tokensUsed: 0,
				duration: Date.now() - startTime,
			};
		}
	}

	/**
	 * Build execution prompt for a specific swarm
	 */
	private buildSwarmPrompt(subtask: Subtask, swarm: SwarmType): string {
		const swarmInstructions: Record<SwarmType, string> = {
			codesearch:
				'Search and analyze code. Find symbols, references, and patterns.',
			patchmaker: 'Generate or modify code. Create patches and file edits.',
			tester: 'Execute tests and validate functionality.',
			browser: 'Interact with web pages and scrape content.',
			gitops: 'Perform git operations and version control tasks.',
			manager: 'Coordinate and plan tasks across swarms.',
		};

		return `You are a ${swarm} worker.

Task: ${subtask.description}

Input: ${JSON.stringify(subtask.input, null, 2)}

Instructions: ${swarmInstructions[swarm]}

Execute the task and provide a concise result.`;
	}

	/**
	 * Wait for swarm task completion (simulated)
	 */
	private async waitForSwarmCompletion(
		taskId: string,
		swarm: SwarmType,
	): Promise<WorkerResult> {
		// In production, this would listen to actual swarm events
		// For now, simulate completion
		await new Promise(resolve => setTimeout(resolve, 100));

		return {
			subtaskId: taskId,
			swarm: swarm as SwarmRole,
			success: true,
			data: {message: 'Task delegated'},
			tokensUsed: 50,
			duration: 100,
		};
	}

	/**
	 * Check permissions for swarm operations
	 */
	private async checkSwarmPermissions(swarm: SwarmType): Promise<boolean> {
		// Map swarms to representative tools for permission check
		const swarmToolMap: Record<SwarmType, string> = {
			codesearch: 'grep',
			patchmaker: 'write',
			tester: 'run',
			browser: 'browser_navigate',
			gitops: 'git',
			manager: 'plan',
		};

		const tool = swarmToolMap[swarm];
		const permission = await this.permissionManager.checkPermission(tool);
		return permission === 'allow' || permission === 'ask';
	}

	// -------------------------------------------------------------------------
	// RESULT COORDINATION
	// -------------------------------------------------------------------------

	/**
	 * Synthesize worker results into final output
	 */
	async coordinate(results: WorkerResult[]): Promise<FinalResult> {
		this.emit('coordinate.started', {results});

		const totalTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0);
		const totalDuration = Math.max(...results.map(r => r.duration));
		const success = results.every(r => r.success);

		if (success && results.length > 0) {
			// Synthesize results with LLM
			const synthesis = await this.synthesizeResults(results);

			this.emit('coordinate.completed', {success: true});

			return {
				success: true,
				output: synthesis,
				results,
				totalTokens,
				totalDuration,
			};
		}

		// Handle failure case
		const failures = results.filter(r => !r.success);
		const errorSummary = `Failed: ${failures.map(f => f.error).join(', ')}`;

		this.emit('coordinate.completed', {success: false});

		return {
			success: false,
			output: errorSummary,
			results,
			totalTokens,
			totalDuration,
		};
	}

	/**
	 * Use LLM to synthesize multiple worker results
	 */
	private async synthesizeResults(results: WorkerResult[]): Promise<string> {
		const prompt = this.buildSynthesisPrompt(results);

		const response = await this.modelScheduler.schedule(
			async () => {
				const result = await this.anthropic.messages.create({
					model: this.config.synthesisModel,
					max_tokens: 500,
					messages: [
						{
							role: 'user',
							content: prompt,
						},
					],
				});

				return result.content[0]?.type === 'text' ? result.content[0].text : '';
			},
			{
				model: this.config.synthesisModel,
				priority: 8,
				timeout: this.config.workerTimeout,
			},
		);

		return response;
	}

	/**
	 * Build synthesis prompt
	 */
	private buildSynthesisPrompt(results: WorkerResult[]): string {
		const resultsSummary = results
			.map(
				r => `
Subtask: ${r.subtaskId}
Swarm: ${r.swarm}
Success: ${r.success}
Result: ${JSON.stringify(r.data)}
Error: ${r.error || 'none'}
`,
			)
			.join('\n');

		return `Synthesize the following worker results into a cohesive response:

${resultsSummary}

Provide a clear, concise summary of what was accomplished.`;
	}

	// -------------------------------------------------------------------------
	// SUPERVISION
	// -------------------------------------------------------------------------

	/**
	 * Monitor worker progress and adjust as needed
	 */
	async supervise(): Promise<void> {
		this.emit('supervise.started');

		const states = this.swarmScheduler.getStates();
		const stats = this.swarmScheduler.getStats();

		// Check for stuck or failing swarms
		for (const state of states) {
			if (state.active > 5) {
				// Too many active tasks, may need throttling
				this.emit('supervise.warning', {
					swarm: state.swarm,
					message: 'High active task count',
					count: state.active,
				});
			}

			if (state.pending > 20) {
				// Large backlog, may need scaling
				this.emit('supervise.warning', {
					swarm: state.swarm,
					message: 'Large pending queue',
					count: state.pending,
				});
			}
		}

		this.emit('supervise.completed', {states, stats});
	}

	// -------------------------------------------------------------------------
	// MESSAGE HANDLING
	// -------------------------------------------------------------------------

	/**
	 * Add a message to the conversation history
	 */
	async addMessage(message: Message): Promise<void> {
		if (this.currentSession) {
			this.currentSession.messages.push(message);
			await this.saveSession();
		}
	}

	/**
	 * Get conversation history
	 */
	getHistory(): Message[] {
		return this.currentSession?.messages || [];
	}

	/**
	 * Clear conversation history
	 */
	async clearHistory(): Promise<void> {
		if (this.currentSession) {
			this.currentSession.messages = [];
			await this.saveSession();
		}
	}

	// -------------------------------------------------------------------------
	// STATUS AND METRICS
	// -------------------------------------------------------------------------

	/**
	 * Get current swarm states
	 */
	getSwarmStates() {
		return this.swarmScheduler.getStates();
	}

	/**
	 * Get scheduler statistics
	 */
	getStats() {
		return {
			swarm: this.swarmScheduler.getStats(),
			model: this.modelScheduler.getStats(),
			plans: this.activePlans.size,
			workers: this.activeWorkers.size,
		};
	}

	/**
	 * Pause all scheduling
	 */
	pause(): void {
		this.modelScheduler.pause();
		this.emit('paused');
	}

	/**
	 * Resume all scheduling
	 */
	resume(): void {
		this.modelScheduler.start();
		this.emit('resumed');
	}

	// -------------------------------------------------------------------------
	// SYSTEM PROMPT
	// -------------------------------------------------------------------------

	/**
	 * Get the manager's system prompt
	 */
	private getSystemPrompt(): string {
		return `You are the Manager Agent, the top-level orchestrator for the FLOYD AI coding assistant.

Your responsibilities:
1. Break down complex user tasks into clear, actionable subtasks
2. Route each subtask to the appropriate worker swarm
3. Coordinate parallel execution with fairness across swarms
4. Synthesize worker results into coherent responses
5. Maintain conversation context and session state

Worker Swarms:
- CodeSearch: Symbol search, code discovery, finding references
- PatchMaker: File edits, code generation, refactoring
- Tester: Test execution, validation, test generation
- Browser: Web interaction, scraping, page automation
- GitOps: Git operations, version control

Execute efficiently. Prioritize user intent. Maintain context across conversations.`;
	}
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ManagerAgent;
