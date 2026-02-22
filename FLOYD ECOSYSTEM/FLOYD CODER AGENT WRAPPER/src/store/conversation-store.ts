/**
 * Conversation Store
 *
 * Zustand-based store for managing chat messages with persistence.
 * Handles conversation history, streaming content, and message operations.
 *
 * @module store/conversation-store
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import type {Message} from './floyd-store.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Represents a single message in the conversation with metadata
 */
export interface ConversationMessage extends Message {
	/** Unique identifier for this message */
	id: string;
	/** Timestamp when message was created */
	timestamp: number;
	/** Tokens used (if available) */
	tokens?: number;
	/** Duration in milliseconds (for assistant messages) */
	duration?: number;
	/** Whether this message is currently being streamed */
	streaming?: boolean;
}

/**
 * Conversation state interface
 */
interface ConversationState {
	/** All messages in current conversation */
	messages: ConversationMessage[];
	/** Current streaming content (partial message) */
	streamingContent: string;
	/** System prompt */
	systemPrompt: string;
	/** Maximum context window size */
	maxMessages: number;
	/** Add a message to conversation */
	addMessage: (message: ConversationMessage) => void;
	/** Update an existing message */
	updateMessage: (id: string, updates: Partial<ConversationMessage>) => void;
	/** Remove a message by ID */
	removeMessage: (id: string) => void;
	/** Clear all messages */
	clearMessages: () => void;
	/** Append to streaming content */
	appendStreamingContent: (content: string) => void;
	/** Set streaming content (replace) */
	setStreamingContent: (content: string) => void;
	/** Clear streaming content */
	clearStreamingContent: () => void;
	/** Set system prompt */
	setSystemPrompt: (prompt: string) => void;
	/** Get messages as orchestrator Message array (without metadata) */
	getOrchestratorMessages: () => Message[];
	/** Reset conversation state */
	reset: () => void;
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

const initialState = {
	messages: [],
	streamingContent: '',
	systemPrompt: 'You are a helpful AI assistant.',
	maxMessages: 100,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a unique ID for messages
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Convert ConversationMessage back to orchestrator Message format
 */
function toOrchestratorMessage(message: ConversationMessage): Message {
	const {id, timestamp, tokens, duration, streaming, ...rest} = message;
	return rest;
}

// ============================================================================
// STORE CREATION
// ============================================================================

/**
 * Conversation store with persistence to ~/.floyd/
 */
export const useConversationStore = create<ConversationState>()(
	persist(
		(set, get) => ({
			...initialState,

			addMessage: message =>
				set(state => {
					const messages = [...state.messages, message];
					// Trim to max messages if needed
					const trimmed =
						messages.length > state.maxMessages
							? messages.slice(-state.maxMessages)
							: messages;
					return {messages: trimmed};
				}),

			updateMessage: (id, updates) =>
				set(state => ({
					messages: state.messages.map(msg =>
						msg.id === id ? {...msg, ...updates} : msg,
					),
				})),

			removeMessage: id =>
				set(state => ({
					messages: state.messages.filter(msg => msg.id !== id),
				})),

			clearMessages: () => set({messages: [], streamingContent: ''}),

			appendStreamingContent: content =>
				set(state => ({
					streamingContent: state.streamingContent + content,
				})),

			setStreamingContent: content => set({streamingContent: content}),

			clearStreamingContent: () => set({streamingContent: ''}),

			setSystemPrompt: prompt => set({systemPrompt: prompt}),

			getOrchestratorMessages: () => {
				const {messages} = get();
				return messages.map(toOrchestratorMessage);
			},

			reset: () => set({...initialState}),
		}),
		{
			name: 'floyd-conversation-store',
			storage: createJSONStorage(() => ({
				getItem: name => {
					const data = globalThis.__floydConversationMemory?.[name];
					return data ? JSON.stringify(data) : null;
				},
				setItem: (name, value) => {
					if (!globalThis.__floydConversationMemory) {
						globalThis.__floydConversationMemory = {};
					}
					try {
						globalThis.__floydConversationMemory[name] = JSON.parse(value);
					} catch {
						globalThis.__floydConversationMemory[name] = value;
					}
				},
				removeItem: name => {
					if (globalThis.__floydConversationMemory) {
						delete globalThis.__floydConversationMemory[name];
					}
				},
			})),
			partialize: state => ({
				messages: state.messages,
				systemPrompt: state.systemPrompt,
				maxMessages: state.maxMessages,
			}),
		},
	),
);

// ============================================================================
// CONVENIENCE SELECTORS
// ============================================================================

/**
 * Get current conversation messages
 */
export const selectMessages = (state: ConversationState) => state.messages;

/**
 * Get last message
 */
export const selectLastMessage = (state: ConversationState) =>
	state.messages[state.messages.length - 1] || null;

/**
 * Get message count
 */
export const selectMessageCount = (state: ConversationState) =>
	state.messages.length;

/**
 * Check if there are any messages
 */
export const selectHasMessages = (state: ConversationState) =>
	state.messages.length > 0;

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
	// eslint-disable-next-line no-var
	var __floydConversationMemory: Record<string, unknown> | undefined;
}
