/**
 * AgentBuilder Component
 *
 * Multi-step wizard for creating custom AI agents.
 * Flow: Name → Capabilities → System Prompt → Confirmation
 */

import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {floydTheme, floydRoles} from '../../theme/crush-theme.js';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AgentConfig {
	name: string;
	capabilities: string[];
	systemPrompt?: string;
}

export interface AgentBuilderProps {
	/** Current step in the wizard */
	step: 'name' | 'capabilities' | 'prompt' | 'success';

	/** Agent configuration being built */
	config: AgentConfig;

	/** Callback when agent is created */
	onCreate: (config: AgentConfig) => void;

	/** Callback when builder is cancelled */
	onCancel: () => void;

	/** Callback to move to next step */
 onNext?: () => void;

	/** Callback to move to previous step */
	onPrevious?: () => void;
}

// Available capabilities
const AVAILABLE_CAPABILITIES = [
	{id: 'code-analysis', label: 'Code analysis', icon: '🔍'},
	{id: 'security-review', label: 'Security review', icon: '🔒'},
	{id: 'performance-opt', label: 'Performance optimization', icon: '⚡'},
	{id: 'file-ops', label: 'File operations', icon: '📁'},
	{id: 'terminal', label: 'Terminal access', icon: '⌨️'},
	{id: 'web-search', label: 'Web search', icon: '🌐'},
	{id: 'browser', label: 'Browser automation', icon: '🌍'},
	{id: 'git', label: 'Git operations', icon: '📂'},
];

// ============================================================================
// Step 1: Agent Name Input
// ============================================================================

interface AgentNameStepProps {
	agentName: string;
	onChange: (name: string) => void;
	onSubmit: () => void;
	onCancel: () => void;
}

function AgentNameStep({agentName, onChange, onSubmit, onCancel}: AgentNameStepProps) {
	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			onCancel();
			return;
		}
		if (key.return) {
			onSubmit();
		}
	});

	return (
		<Box flexDirection="column" gap={1}>
			{/* Header */}
			<Box borderStyle="double" borderColor={floydTheme.colors.borderFocus} paddingX={1}>
				<Text bold color={floydRoles.headerTitle}>
					🤖 Agent Builder
				</Text>
			</Box>

			{/* Description */}
			<Box paddingY={1}>
				<Text color={floydTheme.colors.fgMuted}>
					Create a custom AI agent with specialized capabilities
				</Text>
			</Box>

			{/* Name Input */}
			<Box flexDirection="column" gap={1} marginTop={1}>
				<Text bold color={floydTheme.colors.fgBase}>
					Agent name:
				</Text>
				<Box
					borderStyle="single"
					borderColor={floydTheme.colors.borderFocus}
					paddingX={1}
				>
					<Text color={floydRoles.headerTitle}>❯ </Text>
					<TextInput
						value={agentName}
						onChange={onChange}
						placeholder="Enter agent name..."
					/>
				</Box>
			</Box>

			{/* Footer */}
			<Box marginTop={1} borderTop={true} borderColor={floydTheme.colors.border} paddingY={1}>
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					{'Ctrl+C: Cancel • Enter: Continue'}
				</Text>
			</Box>
		</Box>
	);
}

// ============================================================================
// Step 2: Capabilities Selection
// ============================================================================

interface CapabilitiesStepProps {
	selectedCapabilities: string[];
	onToggle: (capability: string) => void;
	onSubmit: () => void;
	onCancel: () => void;
}

function CapabilitiesStep({
	selectedCapabilities,
	onToggle,
	onSubmit,
	onCancel,
}: CapabilitiesStepProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			onCancel();
			return;
		}

		if (key.return) {
			onSubmit();
			return;
		}

		// Navigation
		if (key.upArrow) {
			setSelectedIndex(prev => Math.max(0, prev - 1));
			return;
		}

		if (key.downArrow) {
			setSelectedIndex(prev =>
				Math.min(AVAILABLE_CAPABILITIES.length - 1, prev + 1)
			);
			return;
		}

		// Toggle selection
		if (input === ' ') {
			onToggle(AVAILABLE_CAPABILITIES[selectedIndex].id);
			return;
		}
	});

	return (
		<Box flexDirection="column" gap={1}>
			{/* Header */}
			<Box borderStyle="double" borderColor={floydTheme.colors.borderFocus} paddingX={1}>
				<Text bold color={floydRoles.headerTitle}>
					🤖 Agent Builder - Capabilities
				</Text>
			</Box>

			{/* Description */}
			<Box paddingY={1}>
				<Text color={floydTheme.colors.fgMuted}>
					Select the capabilities for your agent
				</Text>
			</Box>

			{/* Capabilities List */}
			<Box flexDirection="column" marginTop={1} borderStyle="single" borderColor={floydTheme.colors.border} paddingX={1}>
				{AVAILABLE_CAPABILITIES.map((cap, index) => {
					const isSelected = index === selectedIndex;
					const isChecked = selectedCapabilities.includes(cap.id);

					return (
						<Box key={cap.id} width="100%">
							<Text
								color={isSelected ? floydRoles.headerTitle : floydTheme.colors.fgBase}
								bold={isSelected}
							>
								{isSelected ? '▶' : ' '} {' '}
								<Text color={isChecked ? 'green' : floydTheme.colors.fgMuted}>
									{isChecked ? '☑' : '☐'}
								</Text>
								{' '}
								{cap.icon} {cap.label}
							</Text>
						</Box>
					);
				})}
			</Box>

			{/* Selected Count */}
			<Box marginTop={1}>
				<Text color={floydTheme.colors.fgMuted} dimColor>
					{selectedCapabilities.length} capabilities selected
				</Text>
			</Box>

			{/* Footer */}
			<Box marginTop={1} borderTop={true} borderColor={floydTheme.colors.border} paddingY={1}>
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					{'Space: Toggle • ↑↓: Navigate • Enter: Continue • Ctrl+C: Cancel'}
				</Text>
			</Box>
		</Box>
	);
}

// ============================================================================
// Step 3: System Prompt (Optional)
// ============================================================================

interface SystemPromptStepProps {
	prompt: string;
	onChange: (prompt: string) => void;
	onSubmit: () => void;
	onCancel: () => void;
}

function SystemPromptStep({prompt, onChange, onSubmit, onCancel}: SystemPromptStepProps) {
	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			onCancel();
			return;
		}
		if (key.return) {
			onSubmit();
		}
	});

	return (
		<Box flexDirection="column" gap={1}>
			{/* Header */}
			<Box borderStyle="double" borderColor={floydTheme.colors.borderFocus} paddingX={1}>
				<Text bold color={floydRoles.headerTitle}>
					🤖 Agent Builder - System Prompt
				</Text>
			</Box>

			{/* Description */}
			<Box paddingY={1}>
				<Text color={floydTheme.colors.fgMuted}>
					Add a custom system prompt for your agent (optional)
				</Text>
			</Box>

			{/* Prompt Input */}
			<Box flexDirection="column" gap={1} marginTop={1}>
				<Text bold color={floydTheme.colors.fgBase}>
					System prompt:
				</Text>
				<Box
					borderStyle="single"
					borderColor={floydTheme.colors.borderFocus}
					paddingX={1}
					flexDirection="column"
				>
					<Text color={floydRoles.headerTitle}>❯ </Text>
					<TextInput
						value={prompt}
						onChange={onChange}
						placeholder="Enter custom instructions..."
					/>
				</Box>
				<Text color={floydTheme.colors.fgSubtle} dimColor italic>
					Leave blank to use default behavior
				</Text>
			</Box>

			{/* Footer */}
			<Box marginTop={1} borderTop={true} borderColor={floydTheme.colors.border} paddingY={1}>
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					{'Ctrl+C: Cancel • Enter: Create Agent'}
				</Text>
			</Box>
		</Box>
	);
}

// ============================================================================
// Step 4: Success Message
// ============================================================================

interface SuccessStepProps {
	config: AgentConfig;
	onClose: () => void;
}

function SuccessStep({config, onClose}: SuccessStepProps) {
	useInput((_input, key) => {
		if (key.return || key.escape) {
			onClose();
		}
	});

	return (
		<Box flexDirection="column" gap={1} alignItems="center">
			{/* Header */}
			<Box borderStyle="double" borderColor={floydTheme.colors.success} paddingX={1}>
				<Text bold color={floydTheme.colors.success}>
					✓ Agent Created Successfully
				</Text>
			</Box>

			{/* Agent Info */}
			<Box flexDirection="column" marginTop={1} paddingX={2}>
				<Text bold color={floydRoles.headerTitle}>
					Agent: {config.name}
				</Text>

				<Box marginTop={1} flexDirection="column">
					<Text color={floydTheme.colors.fgMuted}>Capabilities:</Text>
					{config.capabilities.map(cap => {
						const capInfo = AVAILABLE_CAPABILITIES.find(c => c.id === cap);
						return (
							<Text key={cap} color={floydTheme.colors.fgBase}>
								• {capInfo?.icon} {capInfo?.label}
							</Text>
						);
					})}
				</Box>

				{config.systemPrompt && (
					<Box marginTop={1} flexDirection="column">
						<Text color={floydTheme.colors.fgMuted}>Custom prompt:</Text>
						<Text color={floydTheme.colors.fgBase} dimColor italic>
							"{config.systemPrompt}"
						</Text>
					</Box>
				)}
			</Box>

			{/* Commands */}
			<Box marginTop={2} flexDirection="column" borderStyle="single" borderColor={floydTheme.colors.border} paddingX={1}>
				<Text bold color={floydRoles.headerTitle}>Available Commands:</Text>
				<Box marginTop={1} flexDirection="column">
					<Text color={floydTheme.colors.fgBase}>@{config.name} - Use this agent</Text>
					<Text color={floydTheme.colors.fgBase}>/agent edit {config.name} - Modify agent</Text>
					<Text color={floydTheme.colors.fgBase}>/agent delete {config.name} - Delete agent</Text>
				</Box>
			</Box>

			{/* Footer */}
			<Box marginTop={1}>
				<Text color={floydTheme.colors.fgSubtle} dimColor>
					Press Enter or Escape to close
				</Text>
			</Box>
		</Box>
	);
}

// ============================================================================
// Main AgentBuilder Component
// ============================================================================

export function AgentBuilder({
	step,
	config,
	onCreate,
	onCancel,
	onNext,
	onPrevious,
}: AgentBuilderProps) {
	const [localConfig, setLocalConfig] = useState<AgentConfig>(config);

	useEffect(() => {
		setLocalConfig(config);
	}, [config]);

	const handleNameChange = (name: string) => {
		setLocalConfig(prev => ({...prev, name}));
	};

	const handleCapabilityToggle = (capabilityId: string) => {
		setLocalConfig(prev => ({
			...prev,
			capabilities: prev.capabilities.includes(capabilityId)
				? prev.capabilities.filter(c => c !== capabilityId)
				: [...prev.capabilities, capabilityId],
		}));
	};

	const handlePromptChange = (prompt: string) => {
		setLocalConfig(prev => ({...prev, systemPrompt: prompt || undefined}));
	};

	const handleCreate = () => {
		onCreate(localConfig);
	};

	// Render current step
	switch (step) {
		case 'name':
			return (
				<AgentNameStep
					agentName={localConfig.name}
					onChange={handleNameChange}
					onSubmit={onNext || (() => {})}
					onCancel={onCancel}
				/>
			);

		case 'capabilities':
			return (
				<CapabilitiesStep
					selectedCapabilities={localConfig.capabilities}
					onToggle={handleCapabilityToggle}
					onSubmit={onNext || (() => {})}
					onCancel={onCancel}
				/>
			);

		case 'prompt':
			return (
				<SystemPromptStep
					prompt={localConfig.systemPrompt || ''}
					onChange={handlePromptChange}
					onSubmit={handleCreate}
					onCancel={onCancel}
				/>
			);

		case 'success':
			return <SuccessStep config={config} onClose={onCancel} />;

		default:
			return null;
	}
}

// ============================================================================
// AgentBuilderOverlay - Full-screen modal wrapper
// ============================================================================

export interface AgentBuilderOverlayProps {
	/** Is the builder currently open */
	isOpen: boolean;

	/** Callback when agent is created */
	onCreate: (config: AgentConfig) => void;

	/** Callback when builder is closed */
	onClose: () => void;
}

export function AgentBuilderOverlay({isOpen, onCreate, onClose}: AgentBuilderOverlayProps) {
	const [step, setStep] = useState<'name' | 'capabilities' | 'prompt' | 'success'>('name');
	const [config, setConfig] = useState<AgentConfig>({
		name: '',
		capabilities: [],
	});

	// Reset state when opening
	useEffect(() => {
		if (isOpen) {
			setStep('name');
			setConfig({name: '', capabilities: []});
		}
	}, [isOpen]);

	const handleNext = () => {
		if (step === 'name') {
			setStep('capabilities');
		} else if (step === 'capabilities') {
			setStep('prompt');
		}
	};

	const handleCreate = (newConfig: AgentConfig) => {
		setConfig(newConfig);
		setStep('success');
		onCreate(newConfig);
	};

	if (!isOpen) return null;

	return (
		<Box
			flexDirection="column"
			width="100%"
			height="100%"
			justifyContent="center"
			alignItems="center"
			paddingX={2}
		>
			{/* Overlay background */}
			<Box
				flexDirection="column"
				width={70}
				borderStyle="round"
				borderColor={floydTheme.colors.borderFocus}
				padding={1}
			>
				<AgentBuilder
					step={step}
					config={config}
					onCreate={handleCreate}
					onCancel={onClose}
					onNext={handleNext}
				/>
			</Box>
		</Box>
	);
}

export default AgentBuilder;
