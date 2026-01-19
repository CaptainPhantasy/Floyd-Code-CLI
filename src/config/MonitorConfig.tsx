/**
 * Monitor Config
 *
 * Configuration page for monitoring settings.
 * Manages file watchers, MCP servers, event filters, and refresh intervals.
 *
 * @module config/MonitorConfig
 */

import {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import MultiSelect from 'ink-multi-select';
import {SimpleTable} from '../ui/components/SimpleTable.js';
import {ConfirmInput} from '../ui/components/ConfirmInput.js';
import {useConfigStore} from '../store/config-store.js';
import {floydTheme, roleColors} from '../theme/crush-theme.js';
import type {WatchPattern, EventFilter, MCPServerConfig} from '../store/config-store.js';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * MonitorConfig - Monitoring configuration interface
 */
export function MonitorConfig() {
	const {
		config,
		setWatchPatterns,
		addWatchPattern,
		removeWatchPattern,
		toggleWatchPattern,
		setProcessMonitoring,
		setEventFilters,
		addEventFilter,
		removeEventFilter,
		setMCPServers,
		updateMCPServer,
		setRefreshInterval,
		setGitMonitoring,
		setBrowserMonitoring,
		saveToFile,
	} = useConfigStore();

	const [showAddPattern, setShowAddPattern] = useState(false);
	const [newPattern, setNewPattern] = useState('');
	const [newDescription, setNewDescription] = useState('');
	const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const {loadFromFile} = useConfigStore();

	// Load config on mount
	useEffect(() => {
		const filePath = `${process.cwd()}/.floyd/monitor-config.json`;
		void loadFromFile(filePath);
	}, [loadFromFile]);

	// Save on changes
	useEffect(() => {
		const filePath = `${process.cwd()}/.floyd/monitor-config.json`;
		void saveToFile(filePath);
	}, [config, saveToFile]);

	// Handle input
	useInput((input, key) => {
		if (key.escape) {
			setShowAddPattern(false);
			setShowDeleteConfirm(false);
			setSelectedPatternId(null);
			return;
		}

		// Add pattern shortcut
		if (input === 'a' && !showAddPattern && !showDeleteConfirm) {
			setShowAddPattern(true);
			return;
		}

		// Toggle process monitoring
		if (input === 'p' && !showAddPattern && !showDeleteConfirm) {
			setProcessMonitoring(!config.processMonitoring);
			return;
		}

		// Toggle git monitoring
		if (input === 'g' && !showAddPattern && !showDeleteConfirm) {
			setGitMonitoring(!config.gitMonitoring);
			return;
		}

		// Toggle browser monitoring
		if (input === 'b' && !showAddPattern && !showDeleteConfirm) {
			setBrowserMonitoring(!config.browserMonitoring);
			return;
		}
	});

	const handleAddPattern = () => {
		if (newPattern.trim()) {
			addWatchPattern({
				pattern: newPattern.trim(),
				description: newDescription.trim() || undefined,
				enabled: true,
			});
			setNewPattern('');
			setNewDescription('');
			setShowAddPattern(false);
		}
	};

	const handleDeletePattern = (id: string) => {
		setSelectedPatternId(id);
		setShowDeleteConfirm(true);
	};

	const confirmDelete = () => {
		if (selectedPatternId) {
			removeWatchPattern(selectedPatternId);
			setSelectedPatternId(null);
		}
		setShowDeleteConfirm(false);
	};

	// Prepare table data
	const patternTableData = config.watchPatterns.map(p => [
		p.enabled ? '✓' : '○',
		p.pattern,
		p.description || '-',
		p.enabled ? 'Enabled' : 'Disabled',
	]);

	const mcpTableData = config.mcpServers.map(s => [
		s.enabled ? '✓' : '○',
		s.name,
		s.transport.type,
		s.status || 'unknown',
	]);

	return (
		<Box flexDirection="column" width="100%" height="100%">
			{/* File Watch Patterns */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color={roleColors.headerTitle}>
					File Watch Patterns
				</Text>
				<Text color={roleColors.hint} dimColor>
					Glob patterns to monitor for changes
				</Text>

				{config.watchPatterns.length > 0 && (
					<Box marginTop={1}>
						<SimpleTable
							data={patternTableData}
							columns={['Status', 'Pattern', 'Description', 'State']}
						/>
					</Box>
				)}

				{showAddPattern ? (
					<Box flexDirection="column" marginTop={1} gap={1}>
						<Box flexDirection="row" gap={1}>
							<Text color={roleColors.inputPrompt}>Pattern:</Text>
							<TextInput
								value={newPattern}
								onChange={setNewPattern}
								onSubmit={handleAddPattern}
								placeholder="**/*.ts"
							/>
						</Box>
						<Box flexDirection="row" gap={1}>
							<Text color={roleColors.inputPrompt}>Description:</Text>
							<TextInput
								value={newDescription}
								onChange={setNewDescription}
								onSubmit={handleAddPattern}
								placeholder="Optional description"
							/>
						</Box>
						<Text color={roleColors.hint} dimColor>
							Press Enter to add, Esc to cancel
						</Text>
					</Box>
				) : (
					<Box marginTop={1} flexDirection="column" gap={0}>
						<Text color={roleColors.hint} dimColor>
							Press 'a' to add pattern • 'p' to toggle process monitoring
						</Text>
						<Text color={roleColors.hint} dimColor>
							Press 'g' to toggle git monitoring • 'b' to toggle browser monitoring
						</Text>
					</Box>
				)}

				{showDeleteConfirm && (
					<Box marginTop={1}>
						<ConfirmInput
							message="Delete this pattern?"
							onConfirm={confirmDelete}
							onCancel={() => {
								setShowDeleteConfirm(false);
								setSelectedPatternId(null);
							}}
						/>
					</Box>
				)}
			</Box>

			{/* MCP Servers */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color={roleColors.headerTitle}>
					MCP Servers
				</Text>
				<Text color={roleColors.hint} dimColor>
					Model Context Protocol server connections
				</Text>

				{config.mcpServers.length > 0 ? (
					<Box marginTop={1}>
						<SimpleTable
							data={mcpTableData}
							columns={['Status', 'Name', 'Transport', 'Connection']}
						/>
					</Box>
				) : (
					<Box marginTop={1}>
						<Text color={roleColors.hint} dimColor>
							No MCP servers configured. Add them in .floyd/mcp.json
						</Text>
					</Box>
				)}
			</Box>

			{/* Settings */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				paddingX={1}
			>
				<Text bold color={roleColors.headerTitle}>
					Settings
				</Text>

				<Box flexDirection="column" marginTop={1} gap={1}>
					<Box flexDirection="row" gap={1}>
						<Text color={floydTheme.colors.fgBase}>
							Process Monitoring:
						</Text>
						<Text
							color={
								config.processMonitoring
									? '#12C78F'
									: roleColors.hint
							}
						>
							{config.processMonitoring ? 'Enabled' : 'Disabled'}
						</Text>
					</Box>

					<Box flexDirection="row" gap={1}>
						<Text color={floydTheme.colors.fgBase}>Git Monitoring:</Text>
						<Text
							color={
								config.gitMonitoring ? '#12C78F' : roleColors.hint
							}
						>
							{config.gitMonitoring ? 'Enabled' : 'Disabled'}
						</Text>
					</Box>

					<Box flexDirection="row" gap={1}>
						<Text color={floydTheme.colors.fgBase}>
							Browser Monitoring:
						</Text>
						<Text
							color={
								config.browserMonitoring
									? '#12C78F'
									: roleColors.hint
							}
						>
							{config.browserMonitoring ? 'Enabled' : 'Disabled'}
						</Text>
					</Box>

					<Box flexDirection="row" gap={1}>
						<Text color={floydTheme.colors.fgBase}>
							Refresh Interval:
						</Text>
						<Text color={roleColors.hint}>
							{config.refreshInterval}ms
						</Text>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}
