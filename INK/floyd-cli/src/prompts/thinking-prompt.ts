/**
 * PHASE 5 ITEM 28: Thinking Mode Toggle
 *
 * Quick toggle for extended reasoning mode (Alt+T).
 * Adds structured thinking prompts to agent context.
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Thinking mode state
 */
export interface ThinkingModeState {
	enabled: boolean;
	level: 'basic' | 'extended';
	lastToggled: number;
}

/**
 * Thinking mode configuration
 */
export interface ThinkingModeConfig {
	shortcut?: string; // Key combination to toggle (default: Alt+T)
	indicator?: string; // Status indicator text
	persist?: boolean; // Save state across sessions
}

/**
 * Default thinking mode prompt template
 */
const DEFAULT_THINKING_PROMPT = `
**THINKING MODE ENABLED**

Before each action, think step-by-step:

1. **Understanding** - What do I want to accomplish?
2. **Planning** - What tools do I need? In what order?
3. **Risks** - What are the potential risks or side effects?
4. **Verification** - How will I verify success?

For complex decisions, show your reasoning process clearly.

---

`;

const EXTENDED_THINKING_PROMPT = `
**EXTENDED THINKING MODE ENABLED**

You are in extended reasoning mode. For each significant action:

## Analysis Phase
- **Goal**: Clearly state what you're trying to achieve
- **Context**: What information do you have? What assumptions?
- **Alternatives**: What are the different approaches? Pros/cons?

## Planning Phase
- **Decomposition**: Break down the task into smaller steps
- **Dependencies**: What must be done first? What can be parallelized?
- **Resource Estimation**: Rough time/token estimates

## Risk Assessment
- **Technical Risks**: What could go wrong technically?
- **User Impact**: Could this break anything? Affect data?
- **Rollback**: How would I undo this if needed?

## Execution
- **Step-by-step**: Execute methodically
- **Validation**: Verify each step before proceeding
- **Adaptation**: Adjust plan if unexpected issues arise

## Post-Action Review
- **Outcome**: Did I achieve what I intended?
- **Side Effects**: Any unintended consequences?
- **Learning**: What would I do differently next time?

---

`;

/**
 * Thinking mode manager
 */
export class ThinkingModeManager {
	public state: ThinkingModeState;
	private config: ThinkingModeConfig;
	private statePath: string;

	constructor(config?: ThinkingModeConfig) {
		this.config = {
			shortcut: 'Alt+T',
			indicator: '🧠',
			persist: true,
			...config,
		};

		this.statePath = path.join(process.cwd(), '.floyd', 'thinking-mode.json');
		this.state = {
			enabled: false,
			level: 'basic',
			lastToggled: Date.now(),
		};
	}

	/**
	 * Load state from file
	 */
	async load(): Promise<void> {
		if (!this.config.persist) {
			return;
		}

		try {
			const content = await fs.readFile(this.statePath, 'utf-8');
			this.state = JSON.parse(content);
		} catch {
			// Use default state
		}
	}

	/**
	 * Save state to file
	 */
	async save(): Promise<void> {
		if (!this.config.persist) {
			return;
		}

		const dir = path.dirname(this.statePath);
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), 'utf-8');
	}

	/**
	 * Toggle thinking mode
	 */
	async toggle(level?: 'basic' | 'extended'): Promise<ThinkingModeState> {
		this.state.enabled = !this.state.enabled;
		this.state.level = level || this.state.level;
		this.state.lastToggled = Date.now();

		await this.save();
		return this.getState();
	}

	/**
	 * Enable thinking mode
	 */
	async enable(level?: 'basic' | 'extended'): Promise<void> {
		this.state.enabled = true;
		this.state.level = level || this.state.level;
		this.state.lastToggled = Date.now();

		await this.save();
	}

	/**
	 * Disable thinking mode
	 */
	async disable(): Promise<void> {
		this.state.enabled = false;
		this.state.lastToggled = Date.now();

		await this.save();
	}

	/**
	 * Get current state
	 */
	getState(): ThinkingModeState {
		return { ...this.state };
	}

	/**
	 * Check if thinking mode is enabled
	 */
	isEnabled(): boolean {
		return this.state.enabled;
	}

	/**
	 * Get thinking level
	 */
	getLevel(): 'basic' | 'extended' {
		return this.state.level;
	}

	/**
	 * Apply thinking mode to a prompt
	 */
	applyToPrompt(basePrompt: string): string {
		if (!this.state.enabled) {
			return basePrompt;
		}

		const thinkingPrompt = this.state.level === 'extended'
			? EXTENDED_THINKING_PROMPT
			: DEFAULT_THINKING_PROMPT;

		return `${thinkingPrompt}\n\n${basePrompt}`;
	}

	/**
	 * Get status indicator
	 */
	getStatusIndicator(): string {
		if (this.state.enabled) {
			const level = this.state.level === 'extended' ? 'EXTENDED' : 'ON';
			return `${this.config.indicator} Thinking: ${level}`;
		}
		return `${this.config.indicator} Thinking: OFF`;
	}

	/**
	 * Get shortcut key
	 */
	getShortcut(): string {
		return this.config.shortcut || 'Alt+T';
	}

	/**
	 * Format status for display
	 */
	formatStatus(): string {
		const enabled = this.state.enabled ? 'YES' : 'NO';
		const level = this.state.level.toUpperCase();
		const shortcut = this.getShortcut();

		return `Thinking Mode: ${enabled} (Level: ${level}) - Toggle: ${shortcut}`;
	}
}

/**
 * Global thinking mode manager
 */
let globalManager: ThinkingModeManager | null = null;

export function getThinkingModeManager(config?: ThinkingModeConfig): ThinkingModeManager {
	if (!globalManager) {
		globalManager = new ThinkingModeManager(config);
		globalManager.load().catch(() => {
			// Ignore load errors
		});
	}
	return globalManager;
}

/**
 * Toggle thinking mode (convenience function)
 */
export async function toggleThinkingMode(level?: 'basic' | 'extended'): Promise<ThinkingModeState> {
	const manager = getThinkingModeManager();
	return await manager.toggle(level);
}

/**
 * Apply thinking mode to prompt (convenience function)
 */
export function withThinkingMode(
	basePrompt: string,
	level?: 'basic' | 'extended'
): string {
	const manager = getThinkingModeManager();
	if (level) {
		manager.state.level = level;
	}
	return manager.applyToPrompt(basePrompt);
}

/**
 * Check if thinking mode is enabled (convenience function)
 */
export function isThinkingModeEnabled(): boolean {
	const manager = getThinkingModeManager();
	return manager.isEnabled();
}

/**
 * CLI command handler for thinking mode
 */
export async function handleThinkingCommand(
	action: 'status' | 'on' | 'off' | 'toggle' | 'level',
	level?: 'basic' | 'extended'
): Promise<{ success: boolean; output?: string }> {
	const manager = getThinkingModeManager();

	switch (action) {
		case 'status':
			return {
				success: true,
				output: manager.formatStatus(),
			};

		case 'on':
			await manager.enable(level);
			return {
				success: true,
				output: `Thinking mode enabled (${level || manager.getLevel()})`,
			};

		case 'off':
			await manager.disable();
			return {
				success: true,
				output: 'Thinking mode disabled',
			};

		case 'toggle':
			const newState = await manager.toggle(level);
			return {
				success: true,
				output: `Thinking mode ${newState.enabled ? 'enabled' : 'disabled'} (${newState.level})`,
			};

		case 'level':
			if (!level) {
				return {
					success: true,
					output: `Current level: ${manager.getLevel().toUpperCase()}`,
				};
			}
			if (!['basic', 'extended'].includes(level)) {
				return {
					success: false,
					output: 'Level must be "basic" or "extended"',
				};
			}
			manager.state.level = level;
			await manager.save();
			return {
				success: true,
				output: `Thinking level set to ${level.toUpperCase()}`,
			};

		default:
			return {
				success: false,
				output: 'Unknown action',
			};
	}
}

/**
 * CLI command definition
 */
export const thinkingCommand = {
	description: 'Toggle thinking mode for extended reasoning',
	usage: '/thinking [action] [level]',
	actions: {
		'': 'Show thinking mode status',
		'on [level]': 'Enable thinking mode (basic or extended)',
		'off': 'Disable thinking mode',
		'toggle': 'Toggle thinking mode',
		'level [basic|extended]': 'Set thinking level',
	},
	shortcut: 'Alt+T',
	examples: [
		'/thinking',
		'/thinking on',
		'/thinking toggle',
		'/thinking on extended',
	],
	handler: handleThinkingCommand,
};

export default thinkingCommand;
