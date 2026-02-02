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
 *
 * @module ui/crush/Viewport
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

	/** Actual content height in rows (for accurate scrolling) */
	contentHeight?: number;
}

/**
 * Viewport - Scrollable content area with auto-scroll support
 *
 * Fixed: Removed circular dependency that caused infinite scroll loops
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
	contentHeight,
}: ViewportProps) {
	const [internalScrollTop, setInternalScrollTop] = useState(0);
	const [userScrolled, setUserScrolled] = useState(false);
	const previousContentKey = useRef<string | number | undefined>(contentKey);

	// Use controlled or internal scroll position
	const scrollTop = controlledScrollTop ?? internalScrollTop;

	// Calculate max scroll - use provided contentHeight or estimate from contentKey
	const estimatedContentHeight =
		contentHeight ?? (typeof contentKey === 'number' ? contentKey : height);
	const maxScrollTop = Math.max(0, estimatedContentHeight - height);

	// Stable ref for max scroll to avoid dependency cycles
	const maxScrollRef = useRef(maxScrollTop);
	maxScrollRef.current = maxScrollTop;

	// Handle scroll with bounds checking
	const handleScroll = useCallback(
		(newScrollTop: number, isUserAction = false) => {
			if (isUserAction) {
				setUserScrolled(true);
			}

			// Clamp to valid range [0, maxScrollTop]
			const clampedScroll = Math.max(
				0,
				Math.min(newScrollTop, maxScrollRef.current),
			);

			if (controlledScrollTop === undefined) {
				setInternalScrollTop(clampedScroll);
			}
			onScroll?.(clampedScroll);
		},
		[controlledScrollTop, onScroll],
	);

	// Auto-scroll to bottom when streaming and content changes
	// Uses maxScrollRef to avoid dependency on maxScrollTop (which would cause loops)
	useEffect(() => {
		if (
			autoScroll &&
			isStreaming &&
			!userScrolled &&
			contentKey !== previousContentKey.current
		) {
			// Scroll to bottom without marking as user action
			const clampedScroll = Math.max(
				0,
				Math.min(maxScrollRef.current, maxScrollRef.current),
			);
			if (controlledScrollTop === undefined) {
				setInternalScrollTop(clampedScroll);
			}
			onScroll?.(clampedScroll);
			previousContentKey.current = contentKey;
		}
	}, [autoScroll, isStreaming, contentKey, userScrolled, controlledScrollTop, onScroll]);

	// Reset user scroll flag when streaming stops
	useEffect(() => {
		if (!isStreaming) {
			setUserScrolled(false);
		}
	}, [isStreaming]);

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
		// Ctrl+Home or Ctrl+A - scroll to top
		if (key.ctrl && _input === 'a') {
			handleScroll(0, true);
		}
		// Ctrl+End or Ctrl+E - scroll to bottom
		if (key.ctrl && _input === 'e') {
			handleScroll(maxScrollTop, true);
		}
	});

	// Bound the visual scroll offset to prevent infinite negative margin
	const boundedScrollTop = Math.max(0, Math.min(scrollTop, maxScrollTop));
	const isAtBottom = boundedScrollTop >= maxScrollTop - 1;
	const showAutoScrollIndicator =
		autoScroll && isStreaming && !isAtBottom && !userScrolled;

	return (
		<Box
			flexDirection="column"
			height={height}
			overflowY="hidden"
			borderStyle="single"
			borderColor={floydTheme.colors.border}
		>
			{/* Scrollable content - uses bounded scroll to prevent runaway negative margins */}
			<Box flexDirection="column" marginTop={-boundedScrollTop}>
				{children}
			</Box>

			{/* Scroll indicator */}
			{showScrollbar && (
				<Box flexDirection="column" justifyContent="flex-end" width={1}>
					{boundedScrollTop > 0 && (
						<Text color={floydTheme.colors.fgMuted}>▲</Text>
					)}
					{boundedScrollTop < maxScrollTop && (
						<Text color={floydTheme.colors.fgMuted}>▼</Text>
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
