/**
 * ThinkingStream Component
 *
 * Real-time reasoning display with streaming tokens.
 * Visualizes the AI agent's thinking process as it streams responses.
 *
 * Features:
 * - Animated token streaming with typewriter effect
 * - Cycling gradient colors (Charple to Dolly) during thinking
 * - Collapsible thought blocks
 * - Tool call indicators
 * - Streaming progress indicator
 */

import {useState, useEffect, useRef} from 'react';
import {Box, Text} from 'ink';
import Spinner from 'ink-spinner';
import {crushTheme} from '../../theme/crush-theme.js';
import {
	thinkingColorFrames,
	thinkingAnimation,
} from '../../theme/animations.js';
import {getRandomWhimsicalPhrase} from '../../utils/whimsical-phrases.js';

// ============================================================================
// TYPES
// ============================================================================

export type ThinkingStatus =
	| 'idle'
	| 'thinking'
	| 'streaming'
	| 'complete'
	| 'error';

export interface ThoughtBlock {
	/** Unique identifier for this thought */
	id: string;

	/** Content of the thought (can be partial during streaming) */
	content: string;

	/** Current status */
	status: ThinkingStatus;

	/** Timestamp when this thought started */
	timestamp: Date;

	/** Tool calls made during this thought */
	toolCalls?: Array<{
		name: string;
		status: 'pending' | 'running' | 'success' | 'error';
	}>;

	/** Error message if status is error */
	error?: string;

	/** Whether this block is collapsed */
	collapsed?: boolean;
}

export interface ThinkingStreamProps {
	/** Array of thought blocks to display */
	thoughts: ThoughtBlock[];

	/** Maximum number of thoughts to display (for scrolling) */
	maxThoughts?: number;

	/** Show timestamps for each thought */
	showTimestamps?: boolean;

	/** Enable streaming animation */
	animate?: boolean;

	/** Custom width constraint */
	width?: number;

	/** Collapse all thoughts by default */
	defaultCollapsed?: boolean;

	/** Callback when a thought is toggled */
	onToggleThought?: (id: string) => void;

	/** Current streaming position (for progress indicator) */
	streamPosition?: number;

	/** Total stream length (for progress indicator) */
	streamLength?: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();

	if (diff < 1000) return 'just now';
	if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
	if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
	return date.toLocaleTimeString();
}

/**
 * Get status indicator for thought
 */
function getStatusIndicator(status: ThinkingStatus): {
	char: string;
	color: string;
} {
	switch (status) {
		case 'idle':
			return {char: '○', color: crushTheme.text.secondary};
		case 'thinking':
			return {char: '●', color: crushTheme.status.working};
		case 'streaming':
			return {char: '◐', color: crushTheme.accent.secondary};
		case 'complete':
			return {char: '✓', color: crushTheme.status.ready};
		case 'error':
			return {char: '✕', color: crushTheme.status.error};
		default:
			return {char: '?', color: crushTheme.text.secondary};
	}
}

/**
 * Truncate content for preview
 */
function truncateContent(content: string, maxLength: number): string {
	if (content.length <= maxLength) return content;
	return content.substring(0, maxLength) + '...';
}

/**
 * Word wrap content for terminal display
 */
function wrapContent(content: string, width: number): string[] {
	const words = content.split(' ');
	const lines: string[] = [];
	let currentLine = '';

	for (const word of words) {
		const testLine = currentLine + (currentLine ? ' ' : '') + word;
		if (testLine.length <= width) {
			currentLine = testLine;
		} else {
			if (currentLine) lines.push(currentLine);
			currentLine = word;
		}
	}
	if (currentLine) lines.push(currentLine);

	return lines;
}

// ============================================================================
// STREAMING TOKEN ANIMATION
// ============================================================================

/**
 * Hook for streaming token animation
 */
function useStreamingAnimation(
	content: string,
	animate: boolean,
	enabled: boolean,
): string {
	const [displayedContent, setDisplayedContent] = useState(content);
	const prevContent = useRef(content);

	useEffect(() => {
		if (!animate || !enabled) {
			setDisplayedContent(content);
			return;
		}

		// Only animate when new content is added
		if (content.length <= prevContent.current.length) {
			setDisplayedContent(content);
			prevContent.current = content;
			return;
		}

		const newContent = content.substring(prevContent.current.length);
		let index = 0;

		const interval = setInterval(() => {
			if (index < newContent.length) {
				setDisplayedContent(
					prevContent.current + newContent.substring(0, index + 1),
				);
				index++;
			} else {
				clearInterval(interval);
				prevContent.current = content;
			}
		}, 10); // Fast token streaming

		return () => clearInterval(interval);
	}, [content, animate, enabled]);

	return displayedContent;
}

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

interface StreamProgressProps {
	position: number;
	total: number;
	width?: number;
}

function StreamProgress({position, total, width = 20}: StreamProgressProps) {
	const progress = total > 0 ? Math.min(100, (position / total) * 100) : 0;
	const filledWidth = Math.round((width - 2) * (progress / 100));
	const emptyWidth = width - 2 - filledWidth;

	return (
		<Box flexDirection="row">
			<Text color={crushTheme.accent.secondary}>[</Text>
			<Text color={crushTheme.accent.primary}>{'─'.repeat(filledWidth)}</Text>
			<Text color={crushTheme.bg.elevated}>{'─'.repeat(emptyWidth)}</Text>
			<Text color={crushTheme.accent.secondary}>]</Text>
			<Text color={crushTheme.text.secondary}> {Math.round(progress)}%</Text>
		</Box>
	);
}

// ============================================================================
// THOUGHT BLOCK COMPONENT
// ============================================================================

interface ThoughtBlockProps {
	thought: ThoughtBlock;
	isStreaming: boolean;
	showTimestamp: boolean;
	contentWidth: number;
	onToggle?: () => void;
}

function ThoughtBlockView({
	thought,
	isStreaming,
	showTimestamp,
	contentWidth,
}: ThoughtBlockProps) {
	const [thinkingColor, setThinkingColor] = useState<string>(
		crushTheme.accent.primary,
	);
	const content = useStreamingAnimation(thought.content, true, isStreaming);
	const statusInfo = getStatusIndicator(thought.status);

	// Animate color during thinking/streaming
	useEffect(() => {
		if (thought.status === 'thinking' || thought.status === 'streaming') {
			const colorGen = thinkingColorFrames();
			const interval = setInterval(() => {
				setThinkingColor(colorGen.next().value as string);
			}, thinkingAnimation.interval);

			return () => clearInterval(interval);
		} else {
			setThinkingColor(statusInfo.color);
		}
		return undefined;
	}, [thought.status, statusInfo.color]);

	const isCollapsed = thought.collapsed;
	const lines = !isCollapsed ? wrapContent(content, contentWidth) : [];
	const preview = isCollapsed ? truncateContent(content, contentWidth - 4) : '';

	return (
		<Box flexDirection="column" marginBottom={1} width="100%">
			{/* Header row */}
			<Box flexDirection="row" width="100%">
				{/* Status indicator */}
				{thought.status === 'thinking' || thought.status === 'streaming' ? (
					<Text color={thinkingColor}>
						<Spinner type="dots" />{' '}
					</Text>
				) : (
					<Text color={statusInfo.color}>{statusInfo.char} </Text>
				)}

				{/* Timestamp */}
				{showTimestamp && (
					<Text color={crushTheme.text.secondary} dimColor>
						[{formatTimestamp(thought.timestamp)}]{' '}
					</Text>
				)}

				{/* Tool call indicators */}
				{thought.toolCalls && thought.toolCalls.length > 0 && (
					<Text color={crushTheme.accent.tertiary}>
						{thought.toolCalls.map((tc, i) => (
							<span key={i}>
								{i > 0 && ', '}
								{tc.name}
								{tc.status === 'running' && '...'}
								{tc.status === 'success' && ' ✓'}
								{tc.status === 'error' && ' ✕'}
							</span>
						))}
					</Text>
				)}
			</Box>

			{/* Content or preview */}
			<Box marginLeft={2} flexDirection="column" width={contentWidth}>
				{thought.status === 'thinking' || thought.status === 'streaming' ? (
					// Animated thinking label
					<Text color={thinkingColor} italic dimColor>
						{thought.status === 'thinking' ? 'Thinking...' : 'Generating...'}
					</Text>
				) : isCollapsed ? (
					// Collapsed preview
					<Text color={crushTheme.text.tertiary} dimColor>
						{preview || '(empty)'}
					</Text>
				) : (
					// Full content
					lines.map((line, i) => (
						<Box key={i}>
							<Text color={crushTheme.text.primary}>{line}</Text>
						</Box>
					))
				)}

				{/* Error message */}
				{thought.status === 'error' && thought.error && (
					<Box marginTop={0}>
						<Text color={crushTheme.status.error}>Error: {thought.error}</Text>
					</Box>
				)}

				{/* Expand/collapse hint */}
				{content.length > 0 && !isStreaming && lines.length > 3 && (
					<Box marginTop={0}>
						<Text color={crushTheme.text.secondary} dimColor>
							{isCollapsed ? '(+ content hidden)' : '(press to collapse)'}
						</Text>
					</Box>
				)}
			</Box>
		</Box>
	);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ThinkingStream - Real-time agent reasoning display
 */
export function ThinkingStream({
	thoughts,
	maxThoughts = 10,
	showTimestamps = true,
	animate = true,
	width = 60,
	defaultCollapsed = false,
	onToggleThought,
	streamPosition = 0,
	streamLength = 0,
}: ThinkingStreamProps) {
	const [expandedThoughts, setExpandedThoughts] = useState<Set<string>>(
		new Set(),
	);

	// Auto-expand the most recent thought
	useEffect(() => {
		if (thoughts.length > 0) {
			const latestThought = thoughts[thoughts.length - 1];
			if (
				latestThought &&
				(latestThought.status === 'thinking' ||
					latestThought.status === 'streaming')
			) {
				setExpandedThoughts(prev => new Set(prev).add(latestThought.id));
			}
		}
	}, [thoughts]);

	// Calculate display thoughts with scrolling
	const displayThoughts = maxThoughts ? thoughts.slice(-maxThoughts) : thoughts;

	const contentWidth = Math.max(20, width - 8);

	return (
		<Box flexDirection="column" width={width}>
			{/* Header */}
			<Box
				borderStyle="single"
				borderColor={crushTheme.accent.primary}
				paddingX={1}
			>
				<Text bold color={crushTheme.accent.secondary}>
					Thinking Stream
				</Text>
				{thoughts.length > 0 && (
					<Text color={crushTheme.text.secondary}> ({thoughts.length})</Text>
				)}
			</Box>

			{/* Thoughts */}
			<Box flexDirection="column" marginTop={1} marginBottom={1}>
				{displayThoughts.length === 0 ? (
					<Box marginLeft={1}>
						<Text color={crushTheme.text.secondary} dimColor>
							No thoughts yet...
						</Text>
					</Box>
				) : (
					displayThoughts.map(thought => (
						<ThoughtBlockView
							key={thought.id}
							thought={{
								...thought,
								collapsed:
									!expandedThoughts.has(thought.id) && !defaultCollapsed,
							}}
							isStreaming={thought.status === 'streaming' && animate}
							showTimestamp={showTimestamps}
							contentWidth={contentWidth}
							onToggle={() => {
								const newExpanded = new Set(expandedThoughts);
								if (newExpanded.has(thought.id)) {
									newExpanded.delete(thought.id);
								} else {
									newExpanded.add(thought.id);
								}
								setExpandedThoughts(newExpanded);
								onToggleThought?.(thought.id);
							}}
						/>
					))
				)}

				{/* Hidden thoughts indicator */}
				{maxThoughts && thoughts.length > maxThoughts && (
					<Box marginLeft={1}>
						<Text color={crushTheme.text.secondary} dimColor>
							+{thoughts.length - maxThoughts} earlier thought
							{thoughts.length - maxThoughts > 1 ? 's' : ''}
						</Text>
					</Box>
				)}
			</Box>

			{/* Stream progress */}
			{streamLength > 0 && streamPosition >= 0 && (
				<Box marginTop={0}>
					<StreamProgress
						position={streamPosition}
						total={streamLength}
						width={width - 4}
					/>
				</Box>
			)}
		</Box>
	);
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

export interface CompactThinkingStreamProps {
	/** Current thought content */
	content: string;

	/** Current status */
	status: ThinkingStatus;

	/** Active tool calls */
	toolCalls?: Array<{
		name: string;
		status: 'pending' | 'running' | 'success' | 'error';
	}>;

	/** Label to show */
	label?: string;
}

/**
 * CompactThinkingStream - Single-line variant for inline use
 */
export function CompactThinkingStream({
	content,
	status,
	toolCalls,
	label,
}: CompactThinkingStreamProps) {
	const [thinkingColor, setThinkingColor] = useState<string>(
		crushTheme.accent.primary,
	);
	const [whimsicalPhrase] = useState(() =>
		status === 'thinking' ? getRandomWhimsicalPhrase() : null,
	);

	useEffect(() => {
		if (status === 'thinking' || status === 'streaming') {
			const colorGen = thinkingColorFrames();
			const interval = setInterval(() => {
				setThinkingColor(colorGen.next().value as string);
			}, thinkingAnimation.interval);

			return () => clearInterval(interval);
		}
		return undefined;
	}, [status]);

	// Get display text - use whimsical phrase if thinking, otherwise use content
	const displayText =
		content ||
		(status === 'thinking' && whimsicalPhrase
			? whimsicalPhrase.text
			: status === 'thinking'
				? 'Thinking...'
				: '');

	return (
		<Box flexDirection="row">
			{status === 'thinking' || status === 'streaming' ? (
				<Text color={thinkingColor}>
					<Spinner type="dots" />{' '}
				</Text>
			) : status === 'complete' ? (
				<Text color={crushTheme.status.ready}>✓ </Text>
			) : status === 'error' ? (
				<Text color={crushTheme.status.error}>✕ </Text>
			) : null}

			{label && <Text color={crushTheme.text.tertiary}>{label} </Text>}

			<Text
				color={status === 'streaming' ? thinkingColor : crushTheme.text.primary}
			>
				{displayText}
			</Text>

			{toolCalls && toolCalls.length > 0 && toolCalls[0] && (
				<Text color={crushTheme.text.secondary}> via {toolCalls[0].name}</Text>
			)}
		</Box>
	);
}

// ============================================================================
// HOOKS FOR INTEGRATION
// ============================================================================

/**
 * Hook for managing thinking stream state
 */
export interface UseThinkingStreamResult {
	thoughts: ThoughtBlock[];
	addThought: (content: string) => string;
	updateThought: (id: string, content: string) => void;
	completeThought: (id: string) => void;
	errorThought: (id: string, error: string) => void;
	clearThoughts: () => void;
	startStreaming: (id: string) => void;
}

export function useThinkingStream(): UseThinkingStreamResult {
	const [thoughts, setThoughts] = useState<ThoughtBlock[]>([]);

	const addThought = (content: string): string => {
		const id = `thought-${Date.now()}-${Math.random()
			.toString(36)
			.substr(2, 9)}`;
		const newThought: ThoughtBlock = {
			id,
			content,
			status: 'thinking',
			timestamp: new Date(),
		};
		setThoughts(prev => [...prev, newThought]);
		return id;
	};

	const updateThought = (id: string, content: string): void => {
		setThoughts(prev => prev.map(t => (t.id === id ? {...t, content} : t)));
	};

	const completeThought = (id: string): void => {
		setThoughts(prev =>
			prev.map(t => (t.id === id ? {...t, status: 'complete'} : t)),
		);
	};

	const errorThought = (id: string, error: string): void => {
		setThoughts(prev =>
			prev.map(t => (t.id === id ? {...t, status: 'error', error} : t)),
		);
	};

	const clearThoughts = (): void => {
		setThoughts([]);
	};

	const startStreaming = (id: string): void => {
		setThoughts(prev =>
			prev.map(t => (t.id === id ? {...t, status: 'streaming'} : t)),
		);
	};

	return {
		thoughts,
		addThought,
		updateThought,
		completeThought,
		errorThought,
		clearThoughts,
		startStreaming,
	};
}

export default ThinkingStream;
