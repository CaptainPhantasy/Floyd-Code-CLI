/**
 * TranscriptPanel Component
 *
 * Middle pane showing conversation history, tool calls, and agent activity.
 * Matches the mockup's "TRANSCRIPT" panel with ToolCard integration.
 * Enhanced with worker annotations, tool.requested prefix, and HH:MM:SS timestamps.
 */

import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {Frame} from '../crush/Frame.js';
import {Viewport} from '../crush/Viewport.js';
import {ToolCard, ToolCardList} from '../components/ToolCard.js';
import {floydTheme, roleColors} from '../../theme/crush-theme.js';
import type {ChatMessage, MessageRole} from '../layouts/MainLayout.js';
import type {ToolExecution} from '../monitor/ToolTimeline.js';

export interface TranscriptPanelProps {
	/** Chat messages */
	messages?: ChatMessage[];
	/** User name for display */
	userName?: string;
	/** Tool executions */
	toolExecutions?: ToolExecution[];
	/** Streaming content */
	streamingContent?: string;
	/** Is thinking */
	isThinking?: boolean;
	/** Height for viewport */
	height?: number;
	/** Max messages to display */
	maxMessages?: number;
}

/**
 * Format timestamp as HH:MM:SS
 */
function formatTimestamp(date: Date): string {
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
}

/**
 * Get message color based on role
 */
function getMessageColor(role: MessageRole): string {
	switch (role) {
		case 'user':
			return roleColors.userLabel;
		case 'assistant':
			return roleColors.assistantLabel;
		case 'system':
			return roleColors.systemLabel;
		case 'tool':
			return roleColors.toolLabel;
		default:
			return floydTheme.colors.fgBase;
	}
}

/**
 * Get label for message role
 */
function getLabel(role: MessageRole): string {
	switch (role) {
		case 'user':
			return 'User';
		case 'assistant':
			return 'Assistant';
		case 'system':
			return 'System';
		case 'tool':
			return 'Tool';
		default:
			return '?';
	}
}

export function TranscriptPanel({
	messages = [],
	userName: _userName = 'User',
	toolExecutions = [],
	streamingContent,
	isThinking = false,
	height = 30,
	maxMessages = 20,
}: TranscriptPanelProps) {
	const displayMessages = messages.slice(-maxMessages);

	return (
		<Frame title=" TRANSCRIPT " borderStyle="round" borderVariant="focus" padding={1}>
			<Viewport height={height} showScrollbar>
				<Box flexDirection="column" gap={1}>
					{/* Messages */}
					{displayMessages.length === 0 && !streamingContent && (
						<Box paddingY={1}>
							<Text color={floydTheme.colors.fgMuted} dimColor italic>
								No messages yet. Start a conversation!
							</Text>
						</Box>
					)}

					{displayMessages.map(msg => (
						<Box key={msg.id} flexDirection="column" marginBottom={1} width="100%">
							{/* Message header */}
							<Box flexDirection="row" gap={1}>
								<Text color={getMessageColor(msg.role)}>
									{msg.role === 'user' ? '>' : '<'} {getLabel(msg.role)}:
								</Text>
								<Text color={floydTheme.colors.fgSubtle} dimColor>
									{formatTimestamp(msg.timestamp)}
								</Text>
							</Box>

							{/* Message content */}
							<Box marginLeft={2} flexDirection="column" width="100%">
								{typeof msg.content === 'string' ? (
									<Text color={floydTheme.colors.fgBase} wrap="wrap">{msg.content}</Text>
								) : (
									msg.content
								)}

								{/* Tool calls in message */}
								{msg.toolCalls && msg.toolCalls.length > 0 && (
									<Box flexDirection="column" marginTop={1} gap={0}>
										{msg.toolCalls.map((tool, idx) => (
											<ToolCard
												key={`${msg.id}-tool-${tool.name}-${idx}`}
												toolName={tool.name}
												status={tool.status}
												result={tool.result}
												error={tool.error}
												workerName={tool.workerName}
												duration={tool.duration}
												timestamp={tool.timestamp}
												showRequestedPrefix={true}
												compact
											/>
										))}
									</Box>
								)}
							</Box>
						</Box>
					))}

					{/* Tool executions */}
					{toolExecutions.length > 0 && (
						<ToolCardList
							tools={toolExecutions.map(tool => ({
								id: tool.id,
								name: tool.toolName,
								status: tool.status,
								description: tool.label,
								result: tool.error ? undefined : 'Success',
								error: tool.error,
								duration: tool.duration,
								timestamp: tool.startTime,
							}))}
							compact={false}
						/>
					)}

					{/* Streaming content */}
					{streamingContent && (
						<Box flexDirection="column" marginBottom={1} width="100%">
							<Box flexDirection="row" gap={1}>
								<Text bold color={roleColors.assistantLabel}>
									&lt; Assistant:
								</Text>
								{isThinking && (
									<Text color={roleColors.thinking}>
										<Spinner type="dots" />
									</Text>
								)}
							</Box>
							<Box marginLeft={2} width="100%">
								<Text color={floydTheme.colors.fgBase} wrap="wrap">
									{streamingContent}
									<Text color={roleColors.thinking}>▋</Text>
								</Text>
							</Box>
						</Box>
					)}
				</Box>
			</Viewport>
		</Frame>
	);
}

export default TranscriptPanel;
