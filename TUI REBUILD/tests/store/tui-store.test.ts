import {describe, it, expect, beforeEach} from 'vitest';
import {useTuiStore} from '../../dist/store/tui-store.js';
import type {
	FloydMode,
	ConnectionStatus,
	OverlayMode,
} from '../../dist/store/tui-store.js';

describe('TUI Store', () => {
	beforeEach(() => {
		// Reset store before each test
		useTuiStore.setState({
			mode: 'yolo' as FloydMode,
			model: 'GLM-4.7',
			provider: 'glm',
			connectionStatus: 'offline' as ConnectionStatus,
			isThinking: false,
			thinkingEnabled: true,
			whimsicalPhrase: null,
			messages: [],
			streamingContent: '',
			overlayMode: 'none' as OverlayMode,
			backgroundTasks: [],
			_initialized: false,
		});
	});

	describe('Initial State', () => {
		it('should have correct default values', () => {
			const state = useTuiStore.getState();

			expect(state.mode).toBe('yolo');
			expect(state.model).toBe('GLM-4.7');
			expect(state.provider).toBe('glm');
			expect(state.connectionStatus).toBe('offline');
			expect(state.isThinking).toBe(false);
			expect(state.thinkingEnabled).toBe(true);
			expect(state.messages).toEqual([]);
			expect(state.streamingContent).toBe('');
			expect(state.overlayMode).toBe('none');
			expect(state.backgroundTasks).toEqual([]);
		});
	});

	describe('Mode Changes', () => {
		it('should allow mode changes', () => {
			useTuiStore.setState({mode: 'ask' as FloydMode});
			expect(useTuiStore.getState().mode).toBe('ask');
		});

		it('should cycle through available modes', () => {
			const modes = [
				'yolo',
				'ask',
				'plan',
				'auto',
				'dialogue',
				'fuckit',
			] as FloydMode[];

			for (const mode of modes) {
				useTuiStore.setState({mode});
				expect(useTuiStore.getState().mode).toBe(mode);
			}
		});
	});

	describe('Provider Configuration', () => {
		it('should allow provider changes', () => {
			useTuiStore.setState({provider: 'openai'});
			expect(useTuiStore.getState().provider).toBe('openai');
		});

		it('should allow model changes', () => {
			useTuiStore.setState({model: 'gpt-4'});
			expect(useTuiStore.getState().model).toBe('gpt-4');
		});
	});

	describe('Connection Status', () => {
		it('should update connection status', () => {
			useTuiStore.setState({
				connectionStatus: 'connecting' as ConnectionStatus,
			});
			expect(useTuiStore.getState().connectionStatus).toBe('connecting');

			useTuiStore.setState({connectionStatus: 'online' as ConnectionStatus});
			expect(useTuiStore.getState().connectionStatus).toBe('online');
		});
	});

	describe('Thinking State', () => {
		it('should toggle thinking state', () => {
			useTuiStore.setState({isThinking: true});
			expect(useTuiStore.getState().isThinking).toBe(true);

			useTuiStore.setState({isThinking: false});
			expect(useTuiStore.getState().isThinking).toBe(false);
		});

		it('should respect thinking enabled flag', () => {
			useTuiStore.setState({thinkingEnabled: false});
			expect(useTuiStore.getState().thinkingEnabled).toBe(false);

			useTuiStore.setState({thinkingEnabled: true});
			expect(useTuiStore.getState().thinkingEnabled).toBe(true);
		});
	});

	describe('Overlay Modes', () => {
		it('should support different overlay modes', () => {
			const modes = [
				'none',
				'transcript',
				'history',
				'background',
				'command',
				'help',
				'config',
				'context',
				'editor',
			] as OverlayMode[];

			for (const mode of modes) {
				useTuiStore.setState({overlayMode: mode});
				expect(useTuiStore.getState().overlayMode).toBe(mode);
			}
		});
	});

	describe('Background Tasks', () => {
		it('should add background tasks', () => {
			const taskId = useTuiStore.getState().addBackgroundTask({
				command: 'test command',
				status: 'running',
				startTime: Date.now(),
			});

			const state = useTuiStore.getState();
			expect(state.backgroundTasks.length).toBe(1);
			expect(state.backgroundTasks[0].id).toBe(taskId);
		});

		it('should update background tasks', () => {
			const taskId = useTuiStore.getState().addBackgroundTask({
				command: 'test command',
				status: 'running',
				startTime: Date.now(),
			});

			useTuiStore.getState().updateBackgroundTask(taskId, {
				status: 'done',
				endTime: Date.now(),
				exitCode: 0,
				output: 'Test output',
			});

			const state = useTuiStore.getState();
			expect(state.backgroundTasks[0].status).toBe('done');
			expect(state.backgroundTasks[0].exitCode).toBe(0);
			expect(state.backgroundTasks[0].output).toBe('Test output');
		});

		it('should remove background tasks', () => {
			const taskId = useTuiStore.getState().addBackgroundTask({
				command: 'test command',
				status: 'running',
				startTime: Date.now(),
			});

			useTuiStore.setState({backgroundTasks: []});

			expect(useTuiStore.getState().backgroundTasks.length).toBe(0);
		});
	});

	describe('Whimsical Phrases', () => {
		it('should set whimsical phrase', () => {
			const phrase = 'Test phrase';
			useTuiStore.setState({whimsicalPhrase: phrase});

			expect(useTuiStore.getState().whimsicalPhrase).toBe(phrase);
		});

		it('should clear whimsical phrase', () => {
			useTuiStore.setState({whimsicalPhrase: 'Test'});
			useTuiStore.setState({whimsicalPhrase: null});

			expect(useTuiStore.getState().whimsicalPhrase).toBeNull();
		});
	});

	describe('Streaming Content', () => {
		it('should set streaming content', () => {
			const content = 'Hello ';
			useTuiStore.getState().setStreamingContent(content);

			expect(useTuiStore.getState().streamingContent).toBe(content);
		});

		it('should clear streaming content', () => {
			useTuiStore.getState().setStreamingContent('Test content');
			useTuiStore.getState().setStreamingContent('');

			expect(useTuiStore.getState().streamingContent).toBe('');
		});
	});

	describe('Message Management', () => {
		it('should add user messages directly', () => {
			const userMessage = {
				id: 'msg1',
				role: 'user' as const,
				content: 'Hello, FLOYD!',
				timestamp: Date.now(),
			};

			useTuiStore.getState().addMessage(userMessage);

			const state = useTuiStore.getState();
			expect(state.messages.length).toBe(1);
			expect(state.messages[0].role).toBe('user');
			expect(state.messages[0].content).toBe('Hello, FLOYD!');
		});

		it('should add assistant messages directly', () => {
			const assistantMessage = {
				id: 'msg2',
				role: 'assistant' as const,
				content: 'Hi there!',
				timestamp: Date.now(),
			};

			useTuiStore.getState().addMessage(assistantMessage);

			const state = useTuiStore.getState();
			expect(state.messages.length).toBe(1);
			expect(state.messages[0].role).toBe('assistant');
			expect(state.messages[0].content).toBe('Hi there!');
		});

		it('should add multiple messages', () => {
			const userMessage = {
				id: 'msg1',
				role: 'user' as const,
				content: 'Hello',
				timestamp: Date.now(),
			};

			const assistantMessage = {
				id: 'msg2',
				role: 'assistant' as const,
				content: 'How are you?',
				timestamp: Date.now(),
			};

			useTuiStore.getState().addMessage(userMessage);
			useTuiStore.getState().addMessage(assistantMessage);

			const state = useTuiStore.getState();
			expect(state.messages.length).toBe(2);
			expect(state.messages[0].role).toBe('user');
			expect(state.messages[1].role).toBe('assistant');
		});
	});

	describe('Utility Methods', () => {
		it('should clear messages', () => {
			const message = {
				id: 'msg1',
				role: 'user' as const,
				content: 'Test',
				timestamp: Date.now(),
			};

			useTuiStore.getState().addMessage(message);
			useTuiStore.getState().clearMessages();

			expect(useTuiStore.getState().messages).toEqual([]);
		});

		it('should cycle mode', () => {
			useTuiStore.setState({mode: 'yolo' as FloydMode});
			useTuiStore.getState().cycleMode();

			expect(useTuiStore.getState().mode).toBe('ask');

			useTuiStore.getState().cycleMode();
			expect(useTuiStore.getState().mode).toBe('plan');
		});
	});
});
