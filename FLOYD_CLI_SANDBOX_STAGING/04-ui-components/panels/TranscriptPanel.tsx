// Placeholder to check file structure - I'll read the full content next
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
			return 'FLOYD';
		case 'system':
			return 'System';
		case 'tool':
			return 'Tool';
		default:
			return '?';
	}
}

function TranscriptPanelInner({
	messages = [],
	userName: _userName = 'User',
	toolExecutions = [],
	streamingContent,
	isThinking = false,
	height = 30,
	maxMessages = 20,
	// FIX: Render messages NEWEST first so they grow UP from input, not DOWN
	// Slice gets the newest messages, then reverse() so newest renders at TOP of viewport
	const displayMessages = uniqueMessages.slice(-maxMessages).reverse();

}: TranscriptPanelProps) {
	// Filter for unique messages by ID to prevent doubling issues
	const uniqueMessages = Array.from(new Map(messages.map(m => [m.id, m])).values());
								</Text>
								{msg.streaming && isThinking && (
									<Text color={roleColors.thinking}>
	// FIX: Render messages NEWEST first so they grow UP from input, not DOWN
	// This reverses the array so newest messages appear at TOP of viewport
	// Content grows UP away from input box, never DOWN into it
	const displayMessages = uniqueMessages.slice(-maxMessages).reverse();
								)}
							</Box>

							{/* Message content */}
							<Box marginLeft={2} flexDirection="column" width="100%">
								{typeof msg.content === 'string' ? (
									<Box flexDirection="column">
										<MarkdownRenderer>{msg.content}</MarkdownRenderer>
										{msg.streaming && <Text color={roleColors.thinking}>▋</Text>}
									</Box>
								) : (
									msg.content
								)}

								{/* Tool calls in message */}
								{msg.toolCalls && msg.toolCalls.length > 0 && (
									<Box flexDirection="column" marginTop={1} gap={1} width="100%">
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
				</Box>
			</Viewport>
		</Frame>
	);
}

export const TranscriptPanel = React.memo(TranscriptPanelInner, (prevProps, nextProps) => {
	// Memoize based on critical props that trigger re-renders
	return (
		prevProps.messages === nextProps.messages &&
		prevProps.streamingContent === nextProps.streamingContent &&
		prevProps.isThinking === nextProps.isThinking &&
		prevProps.maxMessages === nextProps.maxMessages &&
		prevProps.height === nextProps.height
	);
});
