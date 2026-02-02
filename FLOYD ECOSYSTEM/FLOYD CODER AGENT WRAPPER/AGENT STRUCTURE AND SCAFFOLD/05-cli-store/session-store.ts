/**
 * Session Store
 *
 * Zustand-based store for session management with persistence to ~/.floyd/
 * Handles session lifecycle, project info, and session history.
 *
 * @module store/session-store
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {v4 as uuidv4} from 'uuid';
import type {Message} from 'floyd-agent-core';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Project information for current session
 */
export interface ProjectInfo {
	/** Project name */
	name: string;
	/** Root directory path */
	rootPath: string;
	/** Current working directory */
	currentDirectory: string;
	/** Git branch name (if in git repo) */
	gitBranch?: string;
	/** Whether git repo is dirty (uncommitted changes) */
	gitDirty?: boolean;
}

/**
 * Session data structure for persistence
 */
export interface SessionData {
	/** Unique session identifier */
	id: string;
	/** Timestamp when session was created */
	created: number;
	/** Timestamp when session was last updated */
	updated: number;
	/** Messages in this session */
	messages: Message[];
	/** Working directory */
	workingDirectory: string;
	/** Project info (optional) */
	project?: ProjectInfo;
}

/**
 * Session state for store
 */
export interface SessionState {
	/** Current active session ID */
	currentSessionId: string | null;
	/** Current session data */
	currentSession: SessionData | null;
	/** List of all sessions */
	sessions: SessionData[];
	/** Maximum sessions to keep in history */
	maxSessions: number;
	/** Initialize a new session */
	initSession: (cwd: string, projectInfo?: ProjectInfo) => Promise<SessionData>;
	/** Save current session */
	saveSession: () => Promise<void>;
	/** Load session by ID */
	loadSession: (id: string) => Promise<SessionData | null>;
	/** List all sessions */
	listSessions: () => Promise<SessionData[]>;
	/** Get last session */
	getLastSession: () => Promise<SessionData | null>;
	/** Delete session */
	deleteSession: (id: string) => Promise<void>;
	/** Clear all sessions */
	clearAllSessions: () => Promise<void>;
	/** Add message to current session */
	addMessage: (message: Message) => Promise<void>;
	/** Update project info */
	updateProjectInfo: (info: Partial<ProjectInfo>) => void;
	/** Get sessions directory path */
	getSessionsDir: () => string;
	/** Reset session state */
	reset: () => void;
}

// ============================================================================
// SESSION MANAGER (for backward compatibility)
// ============================================================================

/**
 * SessionManager class - maintains backward compatibility with existing code
 * that uses SessionManager directly from conversation-store
 *
 * Implements initPromise pattern to prevent race conditions during concurrent
 * initialization attempts.
 */
export class SessionManager {
	private sessionsDir: string;
	private initPromise: Promise<void> | null = null;

	constructor() {
		// Defer directory initialization to prevent race conditions
		this.sessionsDir = '';
	}

	/**
	 * Initialize the sessions directory (called lazily on first access)
	 * Uses initPromise pattern to ensure only one initialization runs even
	 * if multiple methods are called concurrently.
	 */
	private async init(): Promise<void> {
		// If initialization is already in progress, wait for it
		if (this.initPromise) {
			return this.initPromise;
		}

		// If already initialized, return immediately
		if (this.sessionsDir) {
			return;
		}

		// Start initialization
		this.initPromise = (async () => {
			// Prefer ~/.floyd/sessions, fall back to local .floyd/sessions
			const homeDir = os.homedir();
			const globalSessionsDir = path.join(homeDir, '.floyd', 'sessions');
			const localSessionsDir = path.join(process.cwd(), '.floyd', 'sessions');

			// Try to use global directory, fall back to local
			try {
				await fs.ensureDir(globalSessionsDir);
				this.sessionsDir = globalSessionsDir;
			} catch {
				await fs.ensureDir(localSessionsDir);
				this.sessionsDir = localSessionsDir;
			}
		})();

		await this.initPromise;
	}

	async createSession(cwd: string): Promise<SessionData> {
		await this.init();
		const id = uuidv4();
		const session: SessionData = {
			id,
			created: Date.now(),
			updated: Date.now(),
			messages: [],
			workingDirectory: cwd,
		};
		await this.saveSession(session);
		return session;
	}

	async saveSession(session: SessionData): Promise<void> {
		await this.init();
		session.updated = Date.now();
		const filePath = path.join(this.sessionsDir, `${session.id}.json`);
		await fs.writeJson(filePath, session, {spaces: 2});
	}

	async loadSession(id: string): Promise<SessionData | null> {
		await this.init();
		const filePath = path.join(this.sessionsDir, `${id}.json`);
		if (!(await fs.pathExists(filePath))) return null;
		return await fs.readJson(filePath);
	}

	async listSessions(): Promise<SessionData[]> {
		await this.init();
		if (!(await fs.pathExists(this.sessionsDir))) return [];
		const files = await fs.readdir(this.sessionsDir);
		const sessions: SessionData[] = [];
		for (const file of files) {
			if (file.endsWith('.json')) {
				try {
					const session = await fs.readJson(path.join(this.sessionsDir, file));
					sessions.push(session);
				} catch {
					// Ignore corrupted files
				}
			}
		}
		return sessions.sort((a, b) => b.updated - a.updated);
	}

	async getLastSession(): Promise<SessionData | null> {
		const sessions = await this.listSessions();
		return sessions.length > 0 ? sessions[0] || null : null;
	}

	async getSessionsDir(): Promise<string> {
		await this.init();
		return this.sessionsDir;
	}
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

const initialState = {
	currentSessionId: null,
	currentSession: null,
	sessions: [],
	maxSessions: 100,
};

// ============================================================================
// STORE CREATION
// ============================================================================

/**
 * Get the sessions directory path
 */
function getSessionsDir(): string {
	const homeDir = os.homedir();
	return path.join(homeDir, '.floyd', 'sessions');
}

/**
 * Ensure sessions directory exists
 */
async function ensureSessionsDir(): Promise<void> {
	const sessionsDir = getSessionsDir();
	await fs.ensureDir(sessionsDir);
}

/**
 * Session store with file system persistence to ~/.floyd/sessions/
 */
export const useSessionStore = create<SessionState>()(
	persist(
		(set, get) => ({
			...initialState,

			getSessionsDir,

			initSession: async (cwd, projectInfo) => {
				await ensureSessionsDir();

				const id = uuidv4();
				const now = Date.now();
				const session: SessionData = {
					id,
					created: now,
					updated: now,
					messages: [],
					workingDirectory: cwd,
					project: projectInfo,
				};

				// Save to file system
				const filePath = path.join(getSessionsDir(), `${id}.json`);
				await fs.writeJson(filePath, session, {spaces: 2});

				// Update store state
				set({
					currentSessionId: id,
					currentSession: session,
					sessions: [session, ...get().sessions].slice(0, get().maxSessions),
				});

				return session;
			},

			saveSession: async () => {
				const {currentSession} = get();
				if (!currentSession) return;

				currentSession.updated = Date.now();
				const filePath = path.join(
					getSessionsDir(),
					`${currentSession.id}.json`,
				);
				await fs.writeJson(filePath, currentSession, {spaces: 2});

				set({currentSession: {...currentSession}});
			},

			loadSession: async id => {
				const filePath = path.join(getSessionsDir(), `${id}.json`);
				if (!(await fs.pathExists(filePath))) return null;

				const session = (await fs.readJson(filePath)) as SessionData;
				set({
					currentSessionId: id,
					currentSession: session,
				});
				return session;
			},

			listSessions: async () => {
				const sessionsDir = getSessionsDir();
				if (!(await fs.pathExists(sessionsDir))) return [];

				const files = await fs.readdir(sessionsDir);
				const sessions: SessionData[] = [];

				for (const file of files) {
					if (file.endsWith('.json')) {
						try {
							const session = (await fs.readJson(
								path.join(sessionsDir, file),
							)) as SessionData;
							sessions.push(session);
						} catch {
							// Ignore corrupted files
						}
					}
				}

				return sessions.sort((a, b) => b.updated - a.updated);
			},

			getLastSession: async () => {
				const sessions = await get().listSessions();
				return sessions.length > 0 ? sessions[0] || null : null;
			},

			deleteSession: async id => {
				const filePath = path.join(getSessionsDir(), `${id}.json`);
				if (await fs.pathExists(filePath)) {
					await fs.remove(filePath);
				}

				set(state => ({
					sessions: state.sessions.filter(s => s.id !== id),
					currentSession:
						state.currentSession?.id === id ? null : state.currentSession,
					currentSessionId:
						state.currentSessionId === id ? null : state.currentSessionId,
				}));
			},

			clearAllSessions: async () => {
				const sessionsDir = getSessionsDir();
				if (await fs.pathExists(sessionsDir)) {
					const files = await fs.readdir(sessionsDir);
					for (const file of files) {
						if (file.endsWith('.json')) {
							await fs.remove(path.join(sessionsDir, file));
						}
					}
				}

				set({
					currentSessionId: null,
					currentSession: null,
					sessions: [],
				});
			},

			addMessage: async message => {
				const {currentSession} = get();
				if (!currentSession) return;

				const updatedSession: SessionData = {
					...currentSession,
					messages: [...currentSession.messages, message],
					updated: Date.now(),
				};

				const filePath = path.join(
					getSessionsDir(),
					`${currentSession.id}.json`,
				);
				await fs.writeJson(filePath, updatedSession, {spaces: 2});

				set({currentSession: updatedSession});
			},

			updateProjectInfo: info =>
				set(state => ({
					currentSession: state.currentSession
						? {
								...state.currentSession,
								project: state.currentSession.project
									? {...state.currentSession.project, ...info}
									: (info as ProjectInfo),
						  }
						: null,
				})),

			reset: () => set({...initialState}),
		}),
		{
			name: 'floyd-session-store',
			storage: createJSONStorage(() => ({
				getItem: name => {
					const data = globalThis.__floydSessionMemory?.[name];
					return data ? JSON.stringify(data) : null;
				},
				setItem: (name, value) => {
					if (!globalThis.__floydSessionMemory) {
						globalThis.__floydSessionMemory = {};
					}
					try {
						globalThis.__floydSessionMemory[name] = JSON.parse(value);
					} catch {
						globalThis.__floydSessionMemory[name] = value;
					}
				},
				removeItem: name => {
					if (globalThis.__floydSessionMemory) {
						delete globalThis.__floydSessionMemory[name];
					}
				},
			})),
			partialize: state => ({
				currentSessionId: state.currentSessionId,
				maxSessions: state.maxSessions,
			}),
		},
	),
);

// ============================================================================
// CONVENIENCE SELECTORS
// ============================================================================

/**
 * Get current session
 */
export const selectCurrentSession = (state: SessionState) =>
	state.currentSession;

/**
 * Get current session ID
 */
export const selectCurrentSessionId = (state: SessionState) =>
	state.currentSessionId;

/**
 * Check if a session is active
 */
export const selectHasActiveSession = (state: SessionState) =>
	state.currentSession !== null;

/**
 * Get sessions count
 */
export const selectSessionsCount = (state: SessionState) =>
	state.sessions.length;

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
	// eslint-disable-next-line no-var
	var __floydSessionMemory: Record<string, unknown> | undefined;
}
