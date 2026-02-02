import {create} from 'zustand';
import {
	saveState,
	loadState as loadPersistedState,
	clearState as clearPersistedState,
	initializeState,
} from '../utils/persistence.js';
import {getRandomPhraseUnique} from '../utils/whimsical-phrases.js';
import type {LLMProvider} from '../llm/factory.js';
import {loadFloydEnv, getProviderApiKey} from '../utils/providerConfig.js';

import {TuiTagParser} from '../utils/tag-parser.js';

export type OverlayMode =
	| 'none'
	| 'transcript'
	| 'history'
	| 'background'
	| 'command'
	| 'help'
	| 'diff'
	| 'config'
	| 'context'
	| 'editor'
	| 'rewind';

export type FloydMode =
	| 'ask'
	| 'plan'
	| 'auto'
	| 'discuss'
	| 'fuckit';

export type ConnectionStatus = 'online' | 'offline' | 'connecting';

interface BackgroundTask {
	id: string;
	command: string;
	status: 'running' | 'done' | 'failed';
	startTime: number;
	endTime?: number;
	exitCode?: number;
	output?: string;
}

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string;
	timestamp: number;
	streaming?: boolean;
	toolCalls?: ToolCall[];
}

interface ToolCall {
	name: string;
	status: 'pending' | 'running' | 'success' | 'error';
	result?: string;
	error?: string;
}

interface TuiStore {
	mode: FloydMode;
	model: string;
	provider: string;
	connectionStatus: ConnectionStatus;
	isThinking: boolean;
	thinkingEnabled: boolean;
	whimsicalPhrase: string | null;
	messages: ChatMessage[];
	streamingContent: string;
	input: string;
	overlayMode: OverlayMode;
	backgroundTasks: BackgroundTask[];
	diffViewer: {
		file1Path: string;
		file2Path: string;
		file1Content: string;
		file2Content: string;
		onClose: () => void;
	} | null;
	_initialized: boolean;

	setMode: (mode: FloydMode) => void;
	cycleMode: () => void;
	setModel: (model: string) => void;
	setProvider: (provider: string) => void;
	setConnectionStatus: (status: ConnectionStatus) => void;
	setThinking: (thinking: boolean, phrase?: string) => void;
	toggleThinking: () => void;
	setInput: (input: string) => void;
	addMessage: (message: ChatMessage) => void;
	clearMessages: () => void;
	exportTranscript: () => void;
	setStreamingContent: (content: string) => void;
	setOverlayMode: (mode: OverlayMode) => void;
	setDiffViewer: (diffData: TuiStore['diffViewer']) => void;
	closeOverlay: () => void;
	addBackgroundTask: (task: Omit<BackgroundTask, 'id'>) => string;
	updateBackgroundTask: (id: string, updates: Partial<BackgroundTask>) => void;
	sendMessage: (content: string) => Promise<string>;
	undoLastExchange: () => void;
	// Persistence actions
	initialize: () => Promise<void>;
	savePreferences: () => Promise<void>;
	loadPreferences: () => Promise<void>;
	clearPreferences: () => Promise<void>;
}

export const useTuiStore = create<TuiStore>((set, get) => ({
	mode: 'ask',
	model: 'GLM-4.7',
	provider: 'glm',
	connectionStatus: 'offline',
	isThinking: false,
	thinkingEnabled: true,
	whimsicalPhrase: null,
	messages: [],
	streamingContent: '',
	input: '',
	overlayMode: 'none',
	backgroundTasks: [],
	diffViewer: null,
	_initialized: false,

	setMode: mode => {
		set({mode});
		// Auto-save mode preference
		saveState({mode}).catch(() => {});
	},
	setInput: input => set({input}),
	cycleMode: () => {
		const modes: FloydMode[] = [
			'ask',
			'plan',
			'auto',
			'discuss',
			'fuckit',
		];
		const currentIdx = modes.indexOf(get().mode);
		const nextMode = modes[(currentIdx + 1) % modes.length];
		set({mode: nextMode});
		saveState({mode: nextMode}).catch(() => {});
	},

	setModel: model => {
		set({model});
		saveState({model}).catch(() => {});
	},
	setProvider: provider => {
		set({provider});
		saveState({provider}).catch(() => {});
	},
	setConnectionStatus: connectionStatus => set({connectionStatus}),
	setDiffViewer: diffViewer => set({diffViewer}),

	setThinking: (isThinking, whimsicalPhrase) => {
		const phrase =
			isThinking && !whimsicalPhrase
				? getRandomPhraseUnique(get().whimsicalPhrase ?? undefined)
				: whimsicalPhrase;
		set({isThinking, whimsicalPhrase: phrase ?? null});
	},
	toggleThinking: () => {
		const newState = !get().thinkingEnabled;
		set({thinkingEnabled: newState});
		saveState({thinkingEnabled: newState}).catch(() => {});
	},

	addMessage: message =>
		set(state => ({
			messages: [...state.messages, message],
		})),
	clearMessages: () => set({messages: []}),
	exportTranscript: () => {
		const {messages} = get();
		const timestamp = new Date().toISOString();
		const filename = `floyd-transcript-${timestamp}.txt`;
		const content = messages
			.map(
				m =>
					`[${new Date(m.timestamp).toISOString()}] ${m.role.toUpperCase()}: ${
						m.content
					}`,
			)
			.join('\n\n');
		// In a real implementation, this would write to a file
		// For now, we'll just log it
		console.log(`\n--- Export to ${filename} ---\n${content}\n`);
	},
	setStreamingContent: streamingContent => set({streamingContent}),

	setOverlayMode: overlayMode => set({overlayMode}),
	closeOverlay: () => set({overlayMode: 'none'}),

	addBackgroundTask: task => {
		const id = Math.random().toString(36).substring(7);
		set(state => ({
			backgroundTasks: [...state.backgroundTasks, {...task, id}],
		}));
		return id;
	},
	updateBackgroundTask: (id, updates) =>
		set(state => ({
			backgroundTasks: state.backgroundTasks.map(task =>
				task.id === id ? {...task, ...updates} : task,
			),
		})),

	sendMessage: async content => {
		const trimmedContent = content.trim();

		// Handle prefixes
		if (trimmedContent.startsWith('!')) {
			const command = trimmedContent.slice(1).trim();
			get().addBackgroundTask({
				command,
				status: 'running',
				startTime: Date.now(),
			});
			// For now, we just acknowledge it. 
			// In a real implementation, this would trigger the actual execution.
			get().addMessage({
				id: Math.random().toString(36).substring(7),
				role: 'system',
				content: `🚀 Executing direct command: ${command}`,
				timestamp: Date.now(),
			});
			return `Direct command execution started: ${command}`;
		}

		if (trimmedContent.startsWith('/')) {
			const parts = trimmedContent.slice(1).split(' ');
			const command = parts[0]?.toLowerCase();
			const args = parts.slice(1).join(' ');

			if (command === 'commit') {
				get().addMessage({
					id: Math.random().toString(36).substring(7),
					role: 'system',
					content: `📦 Preparing commit with message: ${args || 'Auto-generated message'}`,
					timestamp: Date.now(),
				});
				// Stub for commit logic
				return `Commit workflow started.`;
			}

			if (command === 'help') {
				get().setOverlayMode('help');
				return 'Opening help...';
			}

			if (command === 'exit' || command === 'quit') {
				get().addMessage({
					id: Math.random().toString(36).substring(7),
					role: 'system',
					content: '👋 Goodbye!',
					timestamp: Date.now(),
				});
				setTimeout(() => process.exit(0), 500);
				return 'Exiting...';
			}
		}

		if (trimmedContent.startsWith('&')) {
			const command = trimmedContent.slice(1).trim();
			get().addBackgroundTask({
				command,
				status: 'running',
				startTime: Date.now(),
			});
			return `Background task started: ${command}`;
		}

		// Handle @ prefix for file references
		if (trimmedContent.startsWith('@')) {
			const filePath = trimmedContent.slice(1).trim();
			get().addMessage({
				id: Math.random().toString(36).substring(7),
				role: 'system',
				content: `📁 File reference: ${filePath}`,
				timestamp: Date.now(),
			});
			// Include file in context for next message
			// For now, acknowledge the file reference - actual file reading would be done by the assistant
			return `File reference added: ${filePath}`;
		}

		const userMessage: ChatMessage = {
			id: Math.random().toString(36).substring(7),
			role: 'user',
			content,
			timestamp: Date.now(),
		};
		const phrase = getRandomPhraseUnique(get().whimsicalPhrase ?? undefined);

		// Add user message immediately
		set({
			messages: [...get().messages, userMessage],
			isThinking: true,
			whimsicalPhrase: phrase,
			connectionStatus: 'connecting',
		});

		// Get provider from store
		let provider = get().provider;
		const model = get().model;

		// Load API key and endpoint from ~/.floyd/.env.local
		const env = loadFloydEnv();
		let apiKey = getProviderApiKey(provider);

		// Smart fallback: if current provider has no key, try to use GLM
		let effectiveModel = model;
		if (!apiKey && provider !== 'glm') {
			const glmKey = getProviderApiKey('glm');
			if (glmKey) {
				console.log(
					`[FLOYD] No API key for "${provider}", falling back to GLM`,
				);
				provider = 'glm';
				apiKey = glmKey;
				// Also reset model to GLM default when falling back
				effectiveModel = 'GLM-4.7';
				// Update store to reflect fallback
				set({provider, model: effectiveModel});
			}
		}

		// Get endpoint from env if available
		let baseURL = undefined;
		if (provider === 'glm') {
			baseURL = env.FLOYD_GLM_ENDPOINT || 'https://api.z.ai/api/anthropic';
		}

		if (!apiKey) {
			set({
				isThinking: false,
				connectionStatus: 'offline',
			});
			throw new Error(
				`API key not found for provider "${provider}". Configure with: floyd-config`,
			);
		}

		// Get LLM client
		const {createLLMClient} = await import('../llm/factory.js');
		const client = createLLMClient(provider as LLMProvider, {
			apiKey,
			model: effectiveModel,
			baseURL,
		});

		// Create assistant message for streaming
		const assistantId = Math.random().toString(36).substring(7);
		const assistantMessage: ChatMessage = {
			id: assistantId,
			role: 'assistant',
			content: '',
			timestamp: Date.now(),
			streaming: true,
		};

		// Add empty assistant message that will be updated
		set(state => ({
			messages: [...state.messages, assistantMessage],
			connectionStatus: 'online',
		}));

		try {
			let fullResponse = '';
			const parser = new TuiTagParser(['thinking']);
			let inThinking = false;

			await client.sendMessage(content, (chunk: string) => {
				for (const event of parser.process(chunk)) {
					if (event.type === 'tag_open' && event.tagName === 'thinking') {
						inThinking = true;
						// Update whimsical phrase for each new thinking block
						const newPhrase = getRandomPhraseUnique(get().whimsicalPhrase ?? undefined);
						set({isThinking: true, whimsicalPhrase: newPhrase});
						continue;
					}

					if (event.type === 'tag_close' && event.tagName === 'thinking') {
						inThinking = false;
						// Brief pause after thinking
						set({isThinking: false, whimsicalPhrase: null});
						continue;
					}

					if (event.type === 'text' && event.content) {
						if (inThinking) {
							// Thinking content is suppressed from main transcript but keeps thinking status active
							continue;
						}

						// Actual text content
						fullResponse += event.content;
						
						// If we were thinking but now have text, clear thinking state
						if (get().isThinking) {
							set({isThinking: false, whimsicalPhrase: null});
						}

						// Update the streaming message with new content
						set(state => ({
							messages: state.messages.map(msg =>
								msg.id === assistantId
									? {...msg, content: fullResponse, streaming: true}
									: msg,
							),
						}));
					}
				}
			});

			// Final update - mark streaming complete
			set(state => ({
				messages: state.messages.map(msg =>
					msg.id === assistantId ? {...msg, streaming: false} : msg,
				),
				isThinking: false,
				whimsicalPhrase: null,
			}));

			return fullResponse;
		} catch (error) {
			console.error('Failed to send message:', error);

			// Remove the incomplete assistant message on error
			set(state => ({
				messages: state.messages.filter(msg => msg.id !== assistantId),
				isThinking: false,
				connectionStatus: 'offline',
			}));

			throw error;
		}
	},
	undoLastExchange: () =>
		set(state => ({
			messages: state.messages.slice(0, -2),
		})),

	// Persistence actions
	initialize: async () => {
		if (get()._initialized) return;

		const cached = await initializeState();
		if (cached.mode) set({mode: cached.mode});
		if (cached.thinkingEnabled !== undefined)
			set({thinkingEnabled: cached.thinkingEnabled});
		if (cached.provider) set({provider: cached.provider});
		if (cached.model) set({model: cached.model});
		if (cached.recentMessages) set({messages: cached.recentMessages});

		set({_initialized: true});
	},

	savePreferences: async () => {
		const {mode, thinkingEnabled, provider, model} = get();
		await saveState({mode, thinkingEnabled, provider, model});
	},

	loadPreferences: async () => {
		const cached = await loadPersistedState();
		if (cached.mode) set({mode: cached.mode});
		if (cached.thinkingEnabled !== undefined)
			set({thinkingEnabled: cached.thinkingEnabled});
		if (cached.provider) set({provider: cached.provider});
		if (cached.model) set({model: cached.model});
		if (cached.recentMessages) set({messages: cached.recentMessages});
	},

	clearPreferences: async () => {
		await clearPersistedState();
		// Reset to defaults
		set({
			mode: 'ask',
			thinkingEnabled: true,
			provider: 'glm',
			model: 'GLM-4.7',
		});
	},
}));
