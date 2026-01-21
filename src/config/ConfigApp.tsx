/**
 * Config App
 *
 * Main configuration interface with tabbed navigation.
 * Provides access to Monitor Config, Agent Manager, and Prompt Library.
 *
 * @module config/ConfigApp
 */

import {useState} from 'react';
import {Box, Text, useInput, useApp, useFocus} from 'ink';
import {Tabs, Tab} from 'ink-tab';
import {MonitorConfig} from './MonitorConfig.js';
import {AgentManager} from './AgentManager.js';
import {PromptLibrary} from './PromptLibrary.js';
import {ApiSettings} from './ApiSettings.js';
import {floydTheme, roleColors} from '../theme/crush-theme.js';

// ============================================================================
// TYPES
// ============================================================================

type ConfigTab = 'monitor' | 'agents' | 'prompts' | 'api';

// ============================================================================
// CONFIG APP COMPONENT
// ============================================================================

/**
 * ConfigApp - Main configuration interface
 */
export function ConfigApp() {
	const {isFocused} = useFocus({autoFocus: true});
	const [activeTab, setActiveTab] = useState<ConfigTab>('monitor');
	const {exit} = useApp();

	// Handle keyboard input
	useInput((input, key) => {
		if (!isFocused) return;

		if (key.escape) {
			exit();
			return;
		}

		// Number keys for direct tab selection
		if (input === '1') setActiveTab('monitor');
		if (input === '2') setActiveTab('agents');
		if (input === '3') setActiveTab('prompts');
		if (input === '4') setActiveTab('api');
	});

	const handleTabChange = (name: string) => {
		setActiveTab(name as ConfigTab);
	};

	return (
		<Box flexDirection="column" width="100%" height="100%">
			{/* Header */}
			<Box
				borderStyle="round"
				borderColor={floydTheme.colors.borderFocus}
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color={roleColors.headerTitle}>
					FLOYD Configuration
				</Text>
				<Box marginLeft={2}>
					<Text color={roleColors.hint} dimColor>
						Press Tab/Arrows to switch tabs • 1-4 for direct selection • Esc to exit
					</Text>
				</Box>
			</Box>

			{/* Tab Navigation */}
			<Box flexDirection="row" marginBottom={1} gap={1}>
				<Tabs onChange={handleTabChange} flexDirection="row">
					<Tab name="monitor">Monitor</Tab>
					<Tab name="agents">Agents</Tab>
					<Tab name="prompts">Prompts</Tab>
					<Tab name="api">API</Tab>
				</Tabs>
			</Box>

			{/* Tab Content */}
			<Box flexGrow={1} flexDirection="column">
				{activeTab === 'monitor' && <MonitorConfig />}
				{activeTab === 'agents' && <AgentManager />}
				{activeTab === 'prompts' && <PromptLibrary />}
				{activeTab === 'api' && <ApiSettings />}
			</Box>
		</Box>
	);
}

export default ConfigApp;