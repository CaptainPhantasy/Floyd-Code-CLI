/**
 * Viewport Component
 *
 * Scrollable viewport with content clipping.
 * Provides virtual scrolling for large content lists.
 *
 * Features:
 * - Scrollable content area
 * - Content clipping
 * - Scroll indicators
 * - Keyboard scroll support
 */

import {useState, useCallback, useEffect, useRef, type ReactNode} from 'react';
import {Box, Text, useInput} from 'ink';
import {floydTheme} from '../../theme/crush-theme.js';

export interface ViewportProps {
	/** Content to display */
	children: ReactNode;

	/** Maximum height (rows) */
	height?: number;

	/** Enable scroll indicators */
	showScrollbar?: boolean;

	/** Scroll position (controlled) */
	scrollTop?: number;

	/** On scroll callback */
	onScroll?: (scrollTop: number) => void;

	/** Enable auto-scroll to bottom during streaming */
	autoScroll?: boolean;

	/** Is currently streaming (triggers auto-scroll) */
	isStreaming?: boolean;

	/** Content key to detect changes (for auto-scroll) */
	contentKey?: string | number;
}

/**
 * Viewport - Scrollable content area with auto-scroll support
 */
export function Viewport({
	children,
	height = 20,
	showScrollbar = false,
	scrollTop: controlledScrollTop,
	onScroll,
	autoScroll = true,
	isStreaming = false,
	contentKey,
}: ViewportProps) {
	const [internalScrollTop, setInternalScrollTop] = useState(0);
	const [maxScrollTop, setMaxScrollTop] = useState(0);
	const [userScrolled, setUserScrolled] = useState(false);
	const previousContentKey = useRef<string | number | undefined>(contentKey);
	const scrollTop = controlledScrollTop ?? internalScrollTop;

	const handleScroll = useCallback(
		(newScrollTop: number, isUserAction = false) => {
			if (isUserAction) {
				setUserScrolled(true);
			}

			// Clamp to max scroll
			const clampedScroll = Math.max(0, Math.min(newScrollTop, maxScrollTop));

			if (controlledScrollTop === undefined) {
				setInternalScrollTop(clampedScroll);
			}
			onScroll?.(clampedScroll);
		},
		[controlledScrollTop, onScroll, maxScrollTop],
	);

	// Auto-scroll to bottom when streaming and content changes
	useEffect(() => {
		if (autoScroll && isStreaming && contentKey !== previousContentKey.current) {
			// Reset user scroll flag if we're auto-scrolling
			setUserScrolled(false);
			// Scroll to bottom
			handleScroll(maxScrollTop, false);
			previousContentKey.current = contentKey;
		}
	}, [autoScroll, isStreaming, contentKey, maxScrollTop, handleScroll]);

	// Reset user scroll flag when streaming stops
	useEffect(() => {
		if (!isStreaming) {
			setUserScrolled(false);
		}
	}, [isStreaming]);

	// Calculate max scroll based on content height
	// This is a simplified calculation - in a real implementation,
	// you'd measure the actual content height
	useEffect(() => {
		// Estimate content height (this would need actual measurement in production)
		// For now, we'll use a reasonable default that increases with content
		const estimatedHeight = typeof contentKey === 'number' ? contentKey : 100;
		const newMaxScroll = Math.max(0, estimatedHeight - height);
		setMaxScrollTop(newMaxScroll);

		// Auto-scroll if streaming and user hasn't manually scrolled
		if (autoScroll && isStreaming && !userScrolled && newMaxScroll > scrollTop) {
			handleScroll(newMaxScroll, false);
		}
	}, [contentKey, height, autoScroll, isStreaming, userScrolled, scrollTop, handleScroll]);

	// Keyboard scroll support
	useInput((_input, key) => {
		if (key.upArrow) {
			handleScroll(Math.max(0, scrollTop - 1), true);
		}
		if (key.downArrow) {
			handleScroll(Math.min(maxScrollTop, scrollTop + 1), true);
		}
		if (key.pageDown) {
			handleScroll(Math.min(maxScrollTop, scrollTop + height), true);
		}
		if (key.pageUp) {
			handleScroll(Math.max(0, scrollTop - height), true);
		}
		// Ctrl+Home or Ctrl+A - scroll to top (if supported)
		if (key.ctrl && _input === 'a') {
			handleScroll(0, true);
		}
		// Ctrl+End or Ctrl+E - scroll to bottom (if supported)
		if (key.ctrl && _input === 'e') {
			handleScroll(maxScrollTop, true);
		}
	});

	const isAtBottom = scrollTop >= maxScrollTop - 1;
	const showAutoScrollIndicator = autoScroll && isStreaming && !isAtBottom && !userScrolled;

	return (
		<Box
			flexDirection="column"
			height={height}
			overflowY="hidden"
			borderStyle="single"
			borderColor={floydTheme.colors.border}
		>
			{/* Scrollable content */}
			<Box flexDirection="column" marginTop={-scrollTop}>
				{children}
			</Box>

			{/* Scroll indicator */}
			{showScrollbar && (
				<Box flexDirection="column" justifyContent="flex-end" width={1}>
					{scrollTop > 0 && (
						<Text color={floydTheme.colors.fgMuted}>▐</Text>
					)}
					{showAutoScrollIndicator && (
						<Text color={floydTheme.colors.fgMuted} dimColor>
							↓
						</Text>
					)}
				</Box>
			)}

			{/* Auto-scroll indicator */}
			{showAutoScrollIndicator && !showScrollbar && (
				<Box justifyContent="flex-end" paddingX={1}>
					<Text color={floydTheme.colors.fgMuted} dimColor>
						Auto-scrolling...
					</Text>
				</Box>
			)}
		</Box>
	);
}

export default Viewport;
