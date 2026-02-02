import {useRef, useState, useCallback} from 'react';
import {useTuiStore} from '../store/tui-store.js';

interface StreamingOptions {
	onComplete?: (content: string) => void;
}

/**
 * Streaming hook for LLM responses
 * Handles real-time content streaming
 */
export function useStreaming(options: StreamingOptions = {}) {
	const {onComplete} = options;
	const streamingContent = useTuiStore(state => state.streamingContent);
	const setStreamingContent = useTuiStore(state => state.setStreamingContent);
	const setThinking = useTuiStore(state => state.setThinking);
	const addMessage = useTuiStore(state => state.addMessage);

	const bufferRef = useRef<string>('');
	const [isStreaming, setIsStreaming] = useState<boolean>(false);

	const startStreaming = useCallback(() => {
		bufferRef.current = '';
		setIsStreaming(true);
		setStreamingContent('');
	}, [setStreamingContent]);

	const appendContent = useCallback(
		(chunk: string) => {
			if (!isStreaming) {
				startStreaming();
			}
			bufferRef.current += chunk;
			setStreamingContent(bufferRef.current);
		},
		[isStreaming, startStreaming, setStreamingContent],
	);

	const endStreaming = useCallback(() => {
		if (!isStreaming) return;

		setIsStreaming(false);
		const finalContent = bufferRef.current;

		// Add assistant message
		addMessage({
			id: Math.random().toString(36).substring(7),
			role: 'assistant',
			content: finalContent,
			timestamp: Date.now(),
		});

		// Clear streaming state
		setStreamingContent('');
		setThinking(false, undefined);
		bufferRef.current = '';

		if (onComplete) {
			onComplete(finalContent);
		}
	}, [isStreaming, addMessage, setStreamingContent, setThinking, onComplete]);

	const cancelStreaming = useCallback(() => {
		setIsStreaming(false);
		setStreamingContent('');
		setThinking(false, undefined);
		bufferRef.current = '';
	}, [setStreamingContent, setThinking]);

	return {
		streamingContent,
		isStreaming,
		startStreaming,
		appendContent,
		endStreaming,
		cancelStreaming,
	};
}
