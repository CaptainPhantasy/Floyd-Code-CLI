/**
 * API Settings
 *
 * Configuration page for API credentials and endpoints.
 * Manages GLM_API_KEY and custom endpoint configuration.
 *
 * @module config/ApiSettings
 */

import {useState, useEffect} from 'react';
import {Box, Text, useInput, useFocus} from 'ink';
import TextInput from 'ink-text-input';
import {ConfirmInput} from '../ui/components/ConfirmInput.js';
import {floydTheme, roleColors} from '../theme/crush-theme.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// ============================================================================
// TYPES
// ============================================================================

interface ApiConfig {
	apiKey: string;
	endpoint: string;
	model: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the path to .env.local file
 */
function getEnvLocalPath(): string {
	// Try project-level .env.local first
	const projectEnv = path.join(process.cwd(), '.env.local');
	if (fs.existsSync(projectEnv)) {
		return projectEnv;
	}
	
	// Fallback to global .floyd directory
	const globalDir = path.join(os.homedir(), '.floyd');
	fs.ensureDirSync(globalDir);
	return path.join(globalDir, '.env.local');
}

/**
 * Read current API configuration from .env.local
 */
function readApiConfig(): ApiConfig {
	const envPath = getEnvLocalPath();
	
	if (!fs.existsSync(envPath)) {
		return {
			apiKey: '',
			endpoint: 'https://api.z.ai/api/anthropic',
			model: 'claude-sonnet-4-20250514',
		};
	}

	const content = fs.readFileSync(envPath, 'utf-8');
	const lines = content.split('\n');
	
	const config: ApiConfig = {
		apiKey: '',
		endpoint: 'https://api.z.ai/api/anthropic',
		model: 'claude-sonnet-4-20250514',
	};

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith('GLM_API_KEY=')) {
			config.apiKey = trimmed.split('=')[1] || '';
		} else if (trimmed.startsWith('GLM_ENDPOINT=')) {
			config.endpoint = trimmed.split('=')[1] || config.endpoint;
		} else if (trimmed.startsWith('GLM_MODEL=')) {
			config.model = trimmed.split('=')[1] || config.model;
		}
	}

	return config;
}

/**
 * Write API configuration to .env.local
 */
function writeApiConfig(config: ApiConfig): void {
	const envPath = getEnvLocalPath();
	const dir = path.dirname(envPath);
	
	fs.ensureDirSync(dir);
	
	const lines = [
		`# Floyd CLI API Configuration`,
		`# Generated: ${new Date().toISOString()}`,
		``,
		`GLM_API_KEY=${config.apiKey}`,
		`GLM_ENDPOINT=${config.endpoint}`,
		`GLM_MODEL=${config.model}`,
	];
	
	fs.writeFileSync(envPath, lines.join('\n'), 'utf-8');
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ApiSettings() {
	const {isFocused} = useFocus({autoFocus: true});
	const [config, setConfig] = useState<ApiConfig>(readApiConfig);
	const [editingField, setEditingField] = useState<keyof ApiConfig | null>(null);
	const [showSaveConfirm, setShowSaveConfirm] = useState(false);
	const [tempValue, setTempValue] = useState('');
	const [statusMessage, setStatusMessage] = useState('');

	// Load config on mount
	useEffect(() => {
		const loadConfig = () => {
			const loaded = readApiConfig();
			setConfig(loaded);
		};
		loadConfig();
	}, []);

	// Handle input
	useInput((input, key) => {
		if (!isFocused) return;

		if (key.escape) {
			if (showSaveConfirm) {
				setShowSaveConfirm(false);
			} else if (editingField) {
				setEditingField(null);
				setTempValue('');
			}
			return;
		}

		if (editingField || showSaveConfirm) {
			return; // Let TextInput/ConfirmInput handle input
		}

		// Keyboard shortcuts for editing
		if (input === 'a') {
			setEditingField('apiKey');
			setTempValue(config.apiKey);
		}
		if (input === 'e') {
			setEditingField('endpoint');
			setTempValue(config.endpoint);
		}
		if (input === 'm') {
			setEditingField('model');
			setTempValue(config.model);
		}
		if (input === 's') {
			setShowSaveConfirm(true);
		}
		if (input === 'r') {
			const loaded = readApiConfig();
			setConfig(loaded);
			setStatusMessage('Reloaded from .env.local');
			setTimeout(() => setStatusMessage(''), 2000);
		}
	});

	// Handle field submission
	const handleSubmit = () => {
		if (editingField) {
			setConfig({...config, [editingField]: tempValue});
			setEditingField(null);
			setTempValue('');
		}
	};

	// Handle save confirmation
	const handleSave = () => {
		try {
			writeApiConfig(config);
			setStatusMessage('✓ Saved to .env.local');
			setShowSaveConfirm(false);
			setTimeout(() => setStatusMessage(''), 2000);
		} catch (error) {
			setStatusMessage(`✗ Error: ${error instanceof Error ? error.message : String(error)}`);
			setTimeout(() => setStatusMessage(''), 3000);
		}
	};

	// Mask API key for display
	const maskApiKey = (key: string) => {
		if (!key) return 'Not set';
		if (key.length <= 8) return '*'.repeat(key.length);
		return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`;
	};

	// ============================================================================
	// RENDER
	// ============================================================================

	return (
		<Box flexDirection="column" paddingX={1}>
			{/* Header */}
			<Box
				borderStyle="round"
				borderColor={floydTheme.colors.borderFocus}
				paddingX={1}
				marginBottom={1}
			>
				<Text bold color={roleColors.headerTitle}>
					API Configuration
				</Text>
			</Box>

			{/* Status Message */}
			{statusMessage && (
				<Box marginBottom={1}>
					<Text color={statusMessage.startsWith('✓') ? 'green' : 'red'}>
						{statusMessage}
					</Text>
				</Box>
			)}

			{/* API Key Field */}
			<Box marginBottom={1} flexDirection="column">
				<Box>
					<Text bold color={roleColors.hint}>
						[A]
					</Text>
					<Text bold> API Key: </Text>
					{editingField === 'apiKey' ? (
						<TextInput
							value={tempValue}
							onChange={setTempValue}
							onSubmit={handleSubmit}
							placeholder="Enter API key..."
						/>
					) : (
						<Text color={config.apiKey ? 'green' : 'red'}>
							{maskApiKey(config.apiKey)}
						</Text>
					)}
				</Box>
			</Box>

			{/* Endpoint Field */}
			<Box marginBottom={1} flexDirection="column">
				<Box>
					<Text bold color={roleColors.hint}>
						[E]
					</Text>
					<Text bold> Endpoint: </Text>
					{editingField === 'endpoint' ? (
						<TextInput
							value={tempValue}
							onChange={setTempValue}
							onSubmit={handleSubmit}
							placeholder="Enter API endpoint..."
						/>
					) : (
						<Text color="#DFDBDD">{config.endpoint}</Text>
					)}
				</Box>
			</Box>

			{/* Model Field */}
			<Box marginBottom={1} flexDirection="column">
				<Box>
					<Text bold color={roleColors.hint}>
						[M]
					</Text>
					<Text bold> Model: </Text>
					{editingField === 'model' ? (
						<TextInput
							value={tempValue}
							onChange={setTempValue}
							onSubmit={handleSubmit}
							placeholder="Enter model name..."
						/>
					) : (
						<Text color="#DFDBDD">{config.model}</Text>
					)}
				</Box>
			</Box>

			{/* Actions */}
			<Box marginTop={1} flexDirection="column">
				<Text bold color={roleColors.hint}>
					Actions:
				</Text>
				<Box marginLeft={2} flexDirection="column">
					<Text>
						• Press <Text bold>A</Text> to edit API Key
					</Text>
					<Text>
						• Press <Text bold>E</Text> to edit Endpoint
					</Text>
					<Text>
						• Press <Text bold>M</Text> to edit Model
					</Text>
					<Text>
						• Press <Text bold>S</Text> to save configuration
					</Text>
					<Text>
						• Press <Text bold>R</Text> to reload from .env.local
					</Text>
					<Text>
						• Press <Text bold>Esc</Text> to cancel
					</Text>
				</Box>
			</Box>

			{/* Save Confirmation */}
			{showSaveConfirm && (
				<ConfirmInput
					message="Save configuration to .env.local?"
					onConfirm={handleSave}
					onCancel={() => setShowSaveConfirm(false)}
				/>
			)}

			{/* File Location */}
			<Box marginTop={1} borderTop={true} borderColor="#3A3943" paddingTop={1}>
				<Text dimColor>
					Config file: {getEnvLocalPath()}
				</Text>
			</Box>
		</Box>
	);
}

export default ApiSettings;
