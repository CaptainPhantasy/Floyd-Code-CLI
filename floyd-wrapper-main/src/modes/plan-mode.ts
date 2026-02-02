/**
 * PHASE 5 ITEM 24: /plan Mode
 *
 * Dedicated planning mode with separate subagent.
 * Generates detailed step-by-step plans before execution.
 */

import { EventEmitter } from 'events';

/**
 * Plan step with dependencies
 */
export interface PlanStep {
	id: string;
	description: string;
	dependencies: string[];
	files: string[];
	tools: string[];
	estimatedTime?: string;
	status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
}

/**
 * Complete plan structure
 */
export interface Plan {
	goal: string;
	steps: PlanStep[];
	estimatedTime: string;
	risks: string[];
	prerequisites: string[];
	successCriteria: string[];
	createdAt: number;
}

/**
 * Plan execution result
 */
export interface PlanExecutionResult {
	status: 'approved' | 'cancelled' | 'failed';
	plan: Plan;
	executedSteps: string[];
	failedAt?: string;
	error?: string;
}

/**
 * Plan approval options
 */
export type PlanApproval = 'yes' | 'no' | 'modify' | 'save';

/**
 * Plan mode configuration
 */
export interface PlanModeConfig {
	autoApproveLowRisk?: boolean; // Auto-approve plans with 0 risks
	maxSteps?: number; // Maximum steps before requiring confirmation
	showFullPlan?: boolean; // Show entire plan at once or step-by-step
	savePlans?: boolean; // Save plans to .floyd/plans/
}

/**
 * Plan mode - Main implementation
 */
export class PlanMode extends EventEmitter {
	private config: PlanModeConfig;
	private currentPlan: Plan | null = null;
	private executedSteps: Set<string> = new Set();

	constructor(config: PlanModeConfig = {}) {
		super();
		this.config = {
			autoApproveLowRisk: false,
			maxSteps: 20,
			showFullPlan: true,
			savePlans: true,
			...config,
		};
	}

	/**
	 * Enter planning mode with a user goal
	 */
	async enter(userGoal: string): Promise<PlanExecutionResult> {
		// Generate plan
		const plan = await this.generatePlan(userGoal);
		this.currentPlan = plan;

		// Present plan
		this.displayPlan(plan);

		// Check for auto-approval
		if (this.shouldAutoApprove(plan)) {
			this.emit('plan_auto_approved', plan);
			return await this.executePlan(plan);
		}

		// Wait for user approval
		const approval = await this.waitForApproval(plan);

		if (approval === 'no') {
			return {
				status: 'cancelled',
				plan,
				executedSteps: [],
			};
		}

		if (approval === 'yes') {
			return await this.executePlan(plan);
		}

		if (approval === 'save') {
			await this.savePlan(plan);
			return {
				status: 'cancelled',
				plan,
				executedSteps: [],
			};
		}

		// 'modify' - return plan for editing
		return {
			status: 'cancelled',
			plan,
			executedSteps: [],
		};
	}

	/**
	 * Generate a plan from user goal
	 */
	private async generatePlan(goal: string): Promise<Plan> {
		this.emit('plan_generation_started', goal);

		// In a real implementation, this would call LLM with planning-specific prompt
		// For now, generate a structured plan template

		const plan: Plan = {
			goal,
			steps: this.generateTemplateSteps(goal),
			estimatedTime: this.estimateTime(goal),
			risks: this.assessRisks(goal),
			prerequisites: this.identifyPrerequisites(goal),
			successCriteria: this.defineSuccessCriteria(goal),
			createdAt: Date.now(),
		};

		this.emit('plan_generated', plan);
		return plan;
	}

	/**
	 * Generate template steps for a goal
	 */
	private generateTemplateSteps(goal: string): PlanStep[] {
		// Analyze goal to determine step types
		const steps: PlanStep[] = [];

		// Common step patterns
		if (goal.toLowerCase().includes('test') || goal.toLowerCase().includes('fix')) {
			steps.push({
				id: '1',
				description: 'Understand the problem',
				dependencies: [],
				files: [],
				tools: ['read_file', 'grep'],
				status: 'pending',
			});
			steps.push({
				id: '2',
				description: 'Locate the relevant code',
				dependencies: ['1'],
				files: [],
				tools: ['search_files', 'grep'],
				status: 'pending',
			});
			steps.push({
				id: '3',
				description: 'Implement the fix',
				dependencies: ['2'],
				files: [],
				tools: ['edit_block', 'write_file'],
				status: 'pending',
			});
			steps.push({
				id: '4',
				description: 'Verify the fix works',
				dependencies: ['3'],
				files: [],
				tools: ['execute_command'],
				status: 'pending',
			});
		} else if (goal.toLowerCase().includes('add') || goal.toLowerCase().includes('create')) {
			steps.push({
				id: '1',
				description: 'Understand requirements',
				dependencies: [],
				files: [],
				tools: ['read_file'],
				status: 'pending',
			});
			steps.push({
				id: '2',
				description: 'Design the implementation',
				dependencies: ['1'],
				files: [],
				tools: [],
				status: 'pending',
			});
			steps.push({
				id: '3',
				description: 'Implement the feature',
				dependencies: ['2'],
				files: [],
				tools: ['write_file', 'edit_block'],
				status: 'pending',
			});
			steps.push({
				id: '4',
				description: 'Test the implementation',
				dependencies: ['3'],
				files: [],
				tools: ['execute_command'],
				status: 'pending',
			});
		}

		return steps;
	}

	/**
	 * Estimate time for plan completion
	 */
	private estimateTime(goal: string): string {
		const stepCount = this.generateTemplateSteps(goal).length;
		if (stepCount <= 3) return '5-15 minutes';
		if (stepCount <= 6) return '15-30 minutes';
		if (stepCount <= 10) return '30-60 minutes';
		return '1-2 hours';
	}

	/**
	 * Assess potential risks
	 */
	private assessRisks(goal: string): string[] {
		const risks: string[] = [];

		if (goal.toLowerCase().includes('delete') || goal.toLowerCase().includes('remove')) {
			risks.push('Data loss - consider backup before proceeding');
		}

		if (goal.toLowerCase().includes('git') && goal.toLowerCase().includes('push')) {
			risks.push('Git push may fail if there are conflicts');
		}

		if (goal.toLowerCase().includes('npm') || goal.toLowerCase().includes('install')) {
			risks.push('Dependencies may have compatibility issues');
		}

		if (risks.length === 0) {
			risks.push('No significant risks identified');
		}

		return risks;
	}

	/**
	 * Identify prerequisites
	 */
	private identifyPrerequisites(goal: string): string[] {
		const prereqs: string[] = [];

		if (goal.includes('test') || goal.includes('build')) {
			prereqs.push('Project must be buildable');
		}

		if (goal.includes('git')) {
			prereqs.push('Clean git working directory preferred');
		}

		return prereqs;
	}

	/**
	 * Define success criteria
	 */
	private defineSuccessCriteria(goal: string): string[] {
		const criteria: string[] = [];

		if (goal.includes('fix')) {
			criteria.push('Bug is no longer reproducible');
			criteria.push('Related tests pass');
		}

		if (goal.includes('add') || goal.includes('create')) {
			criteria.push('New functionality works as expected');
			criteria.push('No regressions in existing features');
		}

		if (goal.includes('test')) {
			criteria.push('All tests pass');
		}

		if (criteria.length === 0) {
			criteria.push('Goal achieved as described');
		}

		return criteria;
	}

	/**
	 * Display plan to user
	 */
	private displayPlan(plan: Plan): void {
		this.emit('plan_displayed', plan);

		console.log('\n╔════════════════════════════════════════════════════════════════╗');
		console.log(`║                    PLAN: ${plan.goal.substring(0, 48).padEnd(48)}║`);
		console.log('╠════════════════════════════════════════════════════════════════╣');

		console.log(`║ Estimated Time: ${plan.estimatedTime.padEnd(48)}║`);
		console.log(`║ Steps: ${plan.steps.length.toString().padEnd(4)}    Risks: ${plan.risks.length.toString().padEnd(2)}    ║`);

		console.log('╠════════════════════════════════════════════════════════════════╣');
		console.log('║ Steps:'.padEnd(67) + '║');
		console.log('╠════════════════════════════════════════════════════════════════╣');

		for (const step of plan.steps) {
			const deps = step.dependencies.length > 0 ? ` (after: ${step.dependencies.join(', ')})` : '';
			console.log(`║ ${step.id}. ${step.description}${deps}`.padEnd(67) + '║');
		}

		if (plan.risks.length > 0) {
			console.log('╠════════════════════════════════════════════════════════════════╣');
			console.log('║ Risks:'.padEnd(67) + '║');
			for (const risk of plan.risks) {
				console.log(`║ ⚠️  ${risk}`.padEnd(67) + '║');
			}
		}

		console.log('╚════════════════════════════════════════════════════════════════╝\n');
	}

	/**
	 * Check if plan should be auto-approved
	 */
	private shouldAutoApprove(plan: Plan): boolean {
		if (!this.config.autoApproveLowRisk) return false;
		if (plan.risks.length > 1) return false;
		if (plan.steps.length > this.config.maxSteps) return false;

		// Check if the only risk is "No significant risks identified"
		return plan.risks.length === 1 && plan.risks[0].includes('No significant risks');
	}

	/**
	 * Wait for user approval (in real implementation, would use TUI)
	 */
	private async waitForApproval(_plan: Plan): Promise<PlanApproval> {
		// In a real TUI, this would show a prompt with yes/no/modify/save buttons
		// For now, this is a placeholder that would be implemented by the CLI layer
		this.emit('plan_waiting_approval', _plan);

		// Return 'yes' as default for now - real implementation would wait for user input
		return 'yes';
	}

	/**
	 * Execute the plan
	 */
	private async executePlan(plan: Plan): Promise<PlanExecutionResult> {
		this.emit('plan_execution_started', plan);
		const executedSteps: string[] = [];

		// Execute steps in dependency order
		for (const step of plan.steps) {
			// Check dependencies
			const depsSatisfied = step.dependencies.every(dep =>
				executedSteps.includes(dep)
			);

			if (!depsSatisfied) {
				continue; // Skip if dependencies not met
			}

			this.emit('step_started', step);
			step.status = 'in_progress';

			try {
				// In real implementation, would execute the step using available tools
				await this.executeStep(step);
				step.status = 'completed';
				executedSteps.push(step.id);
				this.emit('step_completed', step);
			} catch (error) {
				step.status = 'failed';
				this.emit('step_failed', { step, error });
				return {
					status: 'failed',
					plan,
					executedSteps,
					failedAt: step.id,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		}

		this.emit('plan_execution_completed', plan);

		return {
			status: 'approved',
			plan,
			executedSteps,
		};
	}

	/**
	 * Execute a single plan step
	 */
	private async executeStep(step: PlanStep): Promise<void> {
		// In real implementation, this would use the tool executor
		// For now, simulate execution
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	/**
	 * Save plan to file
	 */
	private async savePlan(plan: Plan): Promise<void> {
		if (!this.config.savePlans) return;

		// In real implementation, would save to .floyd/plans/
		this.emit('plan_saved', plan);
	}

	/**
	 * Get current plan
	 */
	getCurrentPlan(): Plan | null {
		return this.currentPlan;
	}

	/**
	 * Update configuration
	 */
	setConfig(config: Partial<PlanModeConfig>): void {
		this.config = { ...this.config, ...config };
	}
}

/**
 * Create a new plan mode instance
 */
export function createPlanMode(config?: PlanModeConfig): PlanMode {
	return new PlanMode(config);
}
