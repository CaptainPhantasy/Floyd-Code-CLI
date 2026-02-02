/**
 * VoiceInputButton Component for Floyd CLI (Ink)
 *
 * Microphone button with recording indicator for speech-to-text input.
 * Displays visual feedback during recording and transcribing states.
 */

import { Box, Text } from 'ink';
import { useSTT } from '../../stt/useSTT.js';

export interface VoiceInputButtonProps {
	/** Callback when transcription completes */
	onTranscription: (text: string) => void;
	/** Callback when error occurs */
	onError?: (error: string) => void;
	/** Whether STT is enabled (opt-in) */
	enabled?: boolean;
}

/**
 * Voice input button component
 *
 * Shows a microphone icon that pulses when recording.
 * Press CTRL-R to toggle recording.
 */
export function VoiceInputButton({
	onTranscription,
	onError,
	enabled = true,
}: VoiceInputButtonProps) {
	if (!enabled) {
		return null;
	}
	
	const {
		state,
		isRecording,
		isProcessing,
		startRecording,
		stopRecording,
		cancelRecording,
		error,
		clearError,
	} = useSTT({
		onTranscription,
		onError,
	});
	
	// Determine icon and color based on state
	const getMicIcon = () => {
		if (isRecording) {
			return { icon: '🔴', color: 'red', text: 'Recording...' };
		}
		if (isProcessing) {
			return { icon: '⏳', color: 'yellow', text: 'Transcribing...' };
		}
		if (error) {
			return { icon: '❌', color: 'red', text: 'Error' };
		}
		return { icon: '🎤', color: 'green', text: 'Voice Input (Ctrl+R)' };
	};
	
	const { icon, color, text } = getMicIcon();
	
	// Pulse animation for recording (using period)
	const pulse = isRecording ? '.' : '';
	
	return (
		<Box>
			<Text color={color}>
				{icon} {text}{pulse}
			</Text>
			{error && (
				<Text color="red"> {error}</Text>
			)}
		</Box>
	);
}
