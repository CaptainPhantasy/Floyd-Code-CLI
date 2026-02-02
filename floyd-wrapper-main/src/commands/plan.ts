/**
 * PHASE 5 ITEM 24: /plan Command
 *
 * CLI command for entering planning mode.
 */

import { createPlanMode, type PlanMode } from '../modes/plan-mode.js';

/**
 * /plan command handler
 */
export async function handlePlanCommand(
	goal: string,
	options: {
		auto?: boolean;
		save?: boolean;
		maxSteps?: number;
	} = {}
): Promise<{ success: boolean; result?: string; error?: string }> {
	try {
		const planMode = createPlanMode({
			autoApproveLowRisk: options.auto,
			savePlans: options.save,
			maxSteps: options.maxSteps,
		});

		// Execute plan mode
		const result = await planMode.enter(goal);

		if (result.status === 'approved') {
			return {
				success: true,
				result: `Plan executed successfully. ${result.executedSteps.length} steps completed.`,
			};
		}

		if (result.status === 'cancelled') {
			return {
				success: true,
				result: 'Plan cancelled by user.',
			};
		}

		if (result.status === 'failed') {
			return {
				success: false,
				error: `Plan failed at step ${result.failedAt}: ${result.error}`,
			};
		}

		return {
			success: false,
			error: 'Unknown plan execution error',
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * CLI command definition
 */
export const planCommand = {
	description: 'Enter planning mode to generate a step-by-step plan before execution',
	usage: '/plan <goal> [options]',
	options: {
		'--auto': 'Auto-approve low-risk plans',
		'--save': 'Save plan to file for later use',
		'--max-steps <n>': 'Maximum steps before requiring confirmation',
	},
	examples: [
		'/plan Fix authentication bug',
		'/plan Add user registration --save',
		'/plan Implement search feature --auto',
	],
	handler: handlePlanCommand,
};

export default planCommand;
