/**
 * Agent Manager
 *
 * Configuration page for agent profile management.
 * Create, edit, and configure agent profiles with swarm assignments.
 *
 * @module config/AgentManager
 */

import {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import MultiSelect from 'ink-multi-select';
import {SimpleTable} from '../ui/components/SimpleTable.js';
import {ConfirmInput} from '../ui/components/ConfirmInput.js';
import {ProgressBar} from '../ui/components/ProgressBar.js';
import {useAgentStore} from '../store/agent-store.js';
import {floydTheme, roleColors} from '../theme/crush-theme.js';
import type {SwarmRole} from '../agent/manager.js';
import type {AgentProfile} from '../store/agent-store.js';

// ============================================================================
// COMPONENT
// ============================================================================

const SWARM_TYPES: Array<{label: string; value: SwarmRole}> = [
	{label: 'Code Search', value: 'codesearch'},
	{label: 'Patch Maker', value: 'patchmaker'},
	{label: 'Tester', value: 'tester'},
	{label: 'Browser', value: 'browser'},
	{label: 'GitOps', value: 'gitops'},
];

const AVAILABLE_TOOLS = [
	'grep',
	'read_file',
	'write',
	'search_replace',
	'edit_file',
	'codebase_search',
	'run',
	'browser_navigate',
	'git',
];

/**
 * AgentManager - Agent profile management interface
 */
export function AgentManager() {
	const {
		profiles,
		activeProfileId,
		getActiveProfile,
		addProfile,
		updateProfile,
		removeProfile,
		setActiveProfile,
		saveToFile,
	} = useAgentStore();

	const [showAddForm, setShowAddForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

	// Form state
	const [formName, setFormName] = useState('');
	const [formRole, setFormRole] = useState('');
	const [formSwarmType, setFormSwarmType] = useState<SwarmRole>('codesearch');
	const [formTools, setFormTools] = useState<string[]>([]);
	const [formPrompt, setFormPrompt] = useState('');
	const [formBudget, setFormBudget] = useState('2000');

	const {loadFromFile} = useAgentStore();

	// Load profiles on mount
	useEffect(() => {
		const filePath = `${process.cwd()}/.floyd/agent-profiles.json`;
		void loadFromFile(filePath);
	}, [loadFromFile]);

	// Save on changes
	useEffect(() => {
		const filePath = `${process.cwd()}/.floyd/agent-profiles.json`;
		void saveToFile(filePath);
	}, [profiles, activeProfileId, saveToFile]);

	// Handle input
	useInput((input, key) => {
		if (key.escape) {
			setShowAddForm(false);
			setEditingId(null);
			setShowDeleteConfirm(false);
			return;
		}

		// Add profile shortcut
		if (input === 'a' && !showAddForm && !showDeleteConfirm) {
			setShowAddForm(true);
			return;
		}

		// Cycle through profiles to set active
		if (input === 'n' && !showAddForm && !showDeleteConfirm && profiles.length > 0) {
			const currentIndex = profiles.findIndex(p => p.id === activeProfileId);
			const nextIndex = (currentIndex + 1) % profiles.length;
			setActiveProfile(profiles[nextIndex].id);
			return;
		}
	});

	const handleAddProfile = () => {
		if (formName.trim() && formRole.trim()) {
			addProfile({
				name: formName.trim(),
				role: formRole.trim(),
				swarmType: formSwarmType,
				allowedTools: formTools,
				systemPrompt: formPrompt.trim() || `You are a ${formRole}.`,
				tokenBudget: parseInt(formBudget, 10) || 2000,
				maxConcurrentTasks: 2,
				active: false,
			});
			// Reset form
			setFormName('');
			setFormRole('');
			setFormSwarmType('codesearch');
			setFormTools([]);
			setFormPrompt('');
			setFormBudget('2000');
			setShowAddForm(false);
		}
	};

	const handleDelete = (id: string) => {
		setDeleteTargetId(id);
		setShowDeleteConfirm(true);
	};

	const confirmDelete = () => {
		if (deleteTargetId) {
			removeProfile(deleteTargetId);
			setDeleteTargetId(null);
		}
		setShowDeleteConfirm(false);
	};

	const activeProfile = getActiveProfile();

	// Prepare table data
	const profileTableData = profiles.map(p => [
		p.id === activeProfileId ? '●' : '○',
		p.name,
		p.role,
		p.swarmType,
		p.allowedTools.length.toString(),
		p.stats.totalCalls.toString(),
	]);

	return (
		<Box flexDirection="column" width="100%" height="100%">
			{/* Active Profile Info */}
			{activeProfile && (
				<Box
					flexDirection="column"
					borderStyle="round"
					borderColor={floydTheme.colors.borderFocus}
					paddingX={1}
					marginBottom={1}
				>
					<Text bold color={roleColors.headerTitle}>
						Active Profile: {activeProfile.name}
					</Text>
					<Text color={roleColors.hint} dimColor>
						{activeProfile.role} • {activeProfile.swarmType}
					</Text>
					<Box marginTop={1} flexDirection="row" gap={2}>
						<Text color={floydTheme.colors.fgBase}>
							Calls: {activeProfile.stats.totalCalls}
						</Text>
						<Text color={floydTheme.colors.fgBase}>
							Tokens: {activeProfile.stats.totalTokens}
						</Text>
						<Text
							color={
								activeProfile.stats.successRate > 0.9
									? '#12C78F'
									: roleColors.hint
							}
						>
							Success: {(activeProfile.stats.successRate * 100).toFixed(1)}%
						</Text>
					</Box>
					<Box marginTop={1} width={40}>
						<ProgressBar
							percent={Math.min(
								(activeProfile.stats.totalTokens / activeProfile.tokenBudget) *
									100,
								100,
							)}
						/>
					</Box>
				</Box>
			)}

			{/* Agent Profiles List */}
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor={floydTheme.colors.border}
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color={roleColors.headerTitle}>
					Agent Profiles
				</Text>

				{profiles.length > 0 ? (
					<Box marginTop={1}>
						<SimpleTable
							data={profileTableData}
							columns={['Active', 'Name', 'Role', 'Swarm', 'Tools', 'Calls']}
						/>
					</Box>
				) : (
					<Box marginTop={1}>
						<Text color={roleColors.hint} dimColor>
							No agent profiles. Press 'a' to add one.
						</Text>
					</Box>
				)}
			</Box>

			{/* Add Profile Form */}
			{showAddForm && (
				<Box
					flexDirection="column"
					borderStyle="single"
					borderColor={floydTheme.colors.borderFocus}
					paddingX={1}
					marginBottom={1}
					gap={1}
				>
					<Text bold color={roleColors.headerTitle}>
						Add New Agent Profile
					</Text>

					<Box flexDirection="row" gap={1}>
						<Text color={roleColors.inputPrompt}>Name:</Text>
						<TextInput
							value={formName}
							onChange={setFormName}
							placeholder="Agent name"
						/>
					</Box>

					<Box flexDirection="row" gap={1}>
						<Text color={roleColors.inputPrompt}>Role:</Text>
						<TextInput
							value={formRole}
							onChange={setFormRole}
							placeholder="Agent role/persona"
						/>
					</Box>

					<Box flexDirection="row" gap={1}>
						<Text color={roleColors.inputPrompt}>Swarm Type:</Text>
						<SelectInput
							items={SWARM_TYPES}
							onSelect={item => setFormSwarmType(item.value)}
						/>
					</Box>

					<Box flexDirection="row" gap={1}>
						<Text color={roleColors.inputPrompt}>Token Budget:</Text>
						<TextInput
							value={formBudget}
							onChange={setFormBudget}
							placeholder="2000"
						/>
					</Box>

					<Box flexDirection="row" gap={1}>
						<Text color={roleColors.inputPrompt}>System Prompt:</Text>
						<TextInput
							value={formPrompt}
							onChange={setFormPrompt}
							placeholder="Custom system prompt (optional)"
						/>
					</Box>

					<Text color={roleColors.hint} dimColor>
						Press Enter to save, Esc to cancel
					</Text>
				</Box>
			)}

			{/* Delete Confirmation */}
			{showDeleteConfirm && (
				<Box marginTop={1}>
					<ConfirmInput
						message="Delete this agent profile?"
						onConfirm={confirmDelete}
						onCancel={() => {
							setShowDeleteConfirm(false);
							setDeleteTargetId(null);
						}}
					/>
				</Box>
			)}

			{/* Help Text */}
			{!showAddForm && !showDeleteConfirm && (
				<Box marginTop={1} flexDirection="column" gap={0}>
					<Text color={roleColors.hint} dimColor>
						Press 'a' to add profile • 'n' to cycle active profile • Esc to cancel
					</Text>
				</Box>
			)}
		</Box>
	);
}
