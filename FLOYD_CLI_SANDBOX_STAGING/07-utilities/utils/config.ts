import fs from 'fs-extra';
import path from 'path';

export interface Config {
	systemPrompt: string;
	allowedTools: string[];
	mcpServers: Record<string, any>;
}

export class ConfigLoader {
	static async loadProjectConfig(cwd: string = process.cwd()): Promise<Config> {
		const basePrompt = `You are Floyd, a Tier 5 "Self-Replicating" AI Software Engineer (2026 Edition).

STANDARD OPERATIONS PROTOCOL (SAFETY MODE):

1. 🧭 SPATIAL & DEEP AWARENESS
   - START with 'project_map'.
   - Use 'ast_navigator' and 'semantic_search' to orient yourself.

2. 🧬 REPLICATION & EVOLUTION (CRITICAL)
   - IF you are asked to modify your own source code (Floyd CLI/Server):
     1. DO NOT edit the live files directly. You will crash.
     2. RUN 'spawn_shadow_workspace' to create a safe clone (e.g., id="fix_glitch").
     3. The tool will give you a shadow path. OPERATE THERE.
     4. Use 'visual_verify' inside the shadow workspace to confirm the fix works.
     5. Only apply changes to the main instance if the user explicitly authorizes it after verification.

3. 🔬 DIAGNOSTICS & SELF-CORRECTION
   - Run 'check_diagnostics' after every edit.
   - Use 'runtime_schema_gen' for API data.

4. 👁️ VISUAL & GHOST TESTING
   - Use 'tui_puppeteer' and 'visual_verify' to check TUI outputs.

5. 🧠 ACTIVE LEARNING
   - Use 'skill_crystallizer' to save new patterns.

6. 🧹 TECH DEBT
   - Use 'manage_scratchpad' and 'todo_sniper'.
`;

		const config: Config = {
			systemPrompt: basePrompt,
			allowedTools: [],
			mcpServers: {},
		};

		const claudeMdPath = path.join(cwd, 'CLAUDE.md');
		if (await fs.pathExists(claudeMdPath)) {
			const content = await fs.readFile(claudeMdPath, 'utf-8');
			config.systemPrompt += `\n\nProject Context (from CLAUDE.md):\n${content}`;
		}

		const settingsPath = path.join(cwd, '.floyd', 'settings.json');
		if (await fs.pathExists(settingsPath)) {
			try {
				const settings = await fs.readJson(settingsPath);
				if (settings.systemPrompt) config.systemPrompt += `\n${settings.systemPrompt}`;
				if (settings.allowedTools) config.allowedTools = settings.allowedTools;
				if (settings.mcpServers) config.mcpServers = settings.mcpServers;
			} catch (e) {
				console.error('Failed to parse settings.json', e);
			}
		}

		return config;
	}
}