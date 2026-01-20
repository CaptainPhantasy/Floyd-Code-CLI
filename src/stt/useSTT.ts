/**
 * STT Hook for Floyd CLI (Ink)
 *
 * React hook for integrating Speech-to-Text functionality in Ink components.
 * Manages recording state and provides callback-based transcription results.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { STTService, type STTConfig, type RecordingState, STTError } from 'floyd-agent-core';

export interface UseSTTOptions {
	/** STT configuration */
	config?: STTConfig;
	/** Callback when transcription completes */
	onTranscription?: (text: string) => void;
	/** Callback when error occurs */
	onError?: (error: string) => void;
	/** Callback when state changes */
	onStateChange?: (state: RecordingState) => void;
}

export interface UseSTTReturn {
	/** Current recording state */
	state: RecordingState;
	/** Whether currently recording */
	isRecording: boolean;
	/** Whether currently processing (transcribing) */
	isProcessing: boolean;
	/** Whether ready to record */
	isReady: boolean;
	/** Start recording */
	startRecording: () => Promise<void>;
	/** Stop recording and transcribe */
	stopRecording: () => Promise<string>;
	/** Cancel current recording */
	cancelRecording: () => void;
	/** Last error message */
	error: string | null;
	/** Clear error */
	clearError: () => void;
}

/**
 * React hook for STT functionality in Ink CLI
 */
export function useSTT(options: UseSTTOptions = {}): UseSTTReturn {
	const { config, onTranscription, onError, onStateChange } = options;
	
	const [state, setState] = useState<RecordingState>('idle');
	const [error, setError] = useState<string | null>(null);
	const sttServiceRef = useRef<STTService | null>(null);
	
	// Initialize STT service on mount
	useEffect(() => {
		const initSTT = async () => {
			try {
				const service = new STTService(config);
				await service.initialize();
				
				// Set up event listeners
				service.on('state-changed', (newState: RecordingState) => {
					setState(newState);
					onStateChange?.(newState);
				});
				
				service.on('transcription-complete', (result) => {
					onTranscription?.(result.text);
				});
				
				service.on('transcription-error', (err: STTError) => {
					const errorMsg = err.getUserMessage();
					setError(errorMsg);
					onError?.(errorMsg);
				});
				
				sttServiceRef.current = service;
			} catch (err: any) {
				const errorMsg = err instanceof STTError ? err.getUserMessage() : err.message;
				setError(errorMsg);
				onError?.(errorMsg);
			}
		};
		
		initSTT();
		
		// Cleanup on unmount
		return () => {
			if (sttServiceRef.current) {
				sttServiceRef.current.dispose();
			}
		};
	}, []);
	
	/**
	 * Start recording audio
	 */
	const startRecording = useCallback(async () => {
		const service = sttServiceRef.current;
		if (!service) {
			setError('STT service not initialized');
			return;
		}
		
		clearError();
		
		try {
			await service.startRecording();
		} catch (err: any) {
			const errorMsg = err instanceof STTError ? err.getUserMessage() : err.message;
			setError(errorMsg);
			onError?.(errorMsg);
		}
	}, [onError]);
	
	/**
	 * Stop recording and transcribe
	 */
	const stopRecording = useCallback(async (): Promise<string> => {
		const service = sttServiceRef.current;
		if (!service) {
			setError('STT service not initialized');
			return '';
		}
		
		clearError();
		
		try {
			const result = await service.stopRecording();
			return result.text;
		} catch (err: any) {
			const errorMsg = err instanceof STTError ? err.getUserMessage() : err.message;
			setError(errorMsg);
			onError?.(errorMsg);
			return '';
		}
	}, [onError]);
	
	/**
	 * Cancel current recording
	 */
	const cancelRecording = useCallback(() => {
		const service = sttServiceRef.current;
		if (service) {
			service.cancelRecording();
		}
		clearError();
	}, []);
	
	/**
	 * Clear error message
	 */
	const clearError = useCallback(() => {
		setError(null);
	}, []);
	
	return {
		state,
		isRecording: state === 'recording',
		isProcessing: state === 'processing',
		isReady: state === 'idle',
		startRecording,
		stopRecording,
		cancelRecording,
		error,
		clearError,
	};
}
