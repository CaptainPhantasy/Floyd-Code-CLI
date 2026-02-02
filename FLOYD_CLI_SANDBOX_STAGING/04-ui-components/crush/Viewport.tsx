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
	// Auto-scroll to show NEWEST messages at TOP of viewport (TUI grows UP from input)
	// Content flows: [OLDEST at bottom] ... [NEWEST at top of viewport]
	useEffect(() => {
		if (autoScroll && isStreaming && contentKey !== previousContentKey.current) {
			// Reset user scroll flag if we're auto-scrolling
			setUserScrolled(false);
			// Scroll to show newest content at TOP (positive offset moves content UP)
			handleScroll(maxScrollTop, false);
			previousContentKey.current = contentKey;
		}
	}, [autoScroll, isStreaming, contentKey, maxScrollTop, handleScroll]);
	useEffect(() => {
		if (!isStreaming) {
			setUserScrolled(false);
		}
	}, [isStreaming]);

	// Calculate max scroll based on content height
	// This is a simplified calculation - in a real implementation,
	// you'd measure actual content height
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
			<Box flexDirection="column" marginTop={-scrollTop} position="relative">
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
