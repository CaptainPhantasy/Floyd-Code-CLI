/**
 * PHASE 5 ITEM 34: Session Folders
 *
 * Organized session management with per-session folders.
 * Each session gets its own folder with history, state, and artifacts.
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Session metadata
 */
export interface SessionMetadata {
	id: string;
	name?: string;
	startTime: number;
	endTime?: number;
	projectPath?: string;
	model?: string;
	totalMessages: number;
	totalTokens: number;
	status: 'active' | 'archived' | 'abandoned';
}

/**
 * Session artifact
 */
export interface SessionArtifact {
	name: string;
	type: 'screenshot' | 'log' | 'output' | 'transcript';
	filePath: string;
	timestamp: number;
	size: number;
}

/**
 * Session folder contents
 */
export interface SessionFolder {
	metadata: SessionMetadata;
	messages: MessageRecord[];
	artifacts: SessionArtifact[];
	state?: Record<string, unknown>;
}

/**
 * Message record
 */
export interface MessageRecord {
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: number;
	tokens?: number;
	toolCalls?: ToolCallRecord[];
}

/**
 * Tool call record
 */
export interface ToolCallRecord {
	name: string;
	args: Record<string, unknown>;
	result?: unknown;
	timestamp: number;
	duration?: number;
}

/**
 * Session folder configuration
 */
export interface SessionFolderConfig {
	baseDir: string;
	maxSessions: number;
	archiveAfterDays: number;
	compressArchives: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: SessionFolderConfig = {
	baseDir: '.floyd/sessions',
	maxSessions: 100,
	archiveAfterDays: 30,
	compressArchives: false,
};

/**
 * Session folder manager
 */
export class SessionFolderManager {
	private config: SessionFolderConfig;
	private currentSessionId: string | null = null;

	constructor(config?: Partial<SessionFolderConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Initialize base directory
	 */
	async initialize(): Promise<void> {
		await fs.mkdir(this.config.baseDir, { recursive: true });
		await fs.mkdir(path.join(this.config.baseDir, 'active'), { recursive: true });
		await fs.mkdir(path.join(this.config.baseDir, 'archived'), { recursive: true });
	}

	/**
	 * Create new session folder
	 */
	async createSession(options: {
		name?: string;
		projectPath?: string;
		model?: string;
	}): Promise<string> {
		const sessionId = this.generateSessionId();
		const sessionDir = this.getSessionPath(sessionId, 'active');

		await fs.mkdir(sessionDir, { recursive: true });

		const metadata: SessionMetadata = {
			id: sessionId,
			name: options.name,
			startTime: Date.now(),
			projectPath: options.projectPath,
			model: options.model,
			totalMessages: 0,
			totalTokens: 0,
			status: 'active',
		};

		await this.saveMetadata(sessionDir, metadata);

		this.currentSessionId = sessionId;

		return sessionId;
	}

	/**
	 * Get current session directory
	 */
	getCurrentSessionDir(): string | null {
		if (!this.currentSessionId) {
			return null;
		}
		return this.getSessionPath(this.currentSessionId, 'active');
	}

	/**
	 * Add message to session
	 */
	async addMessage(message: MessageRecord): Promise<void> {
		const sessionDir = this.getCurrentSessionDir();
		if (!sessionDir) {
			throw new Error('No active session');
		}

		const messagesFile = path.join(sessionDir, 'messages.jsonl');
		const line = JSON.stringify(message) + '\n';
		await fs.appendFile(messagesFile, line, 'utf-8');

		// Update metadata
		await this.updateMetadata(sessionDir, (metadata) => {
			metadata.totalMessages++;
			if (message.tokens) {
				metadata.totalTokens += message.tokens;
			}
		});
	}

	/**
	 * Add artifact to session
	 */
	async addArtifact(artifact: Omit<SessionArtifact, 'timestamp'>): Promise<void> {
		const sessionDir = this.getCurrentSessionDir();
		if (!sessionDir) {
			throw new Error('No active session');
		}

		const artifactRecord: SessionArtifact = {
			...artifact,
			timestamp: Date.now(),
		};

		const artifactsFile = path.join(sessionDir, 'artifacts.jsonl');
		const line = JSON.stringify(artifactRecord) + '\n';
		await fs.appendFile(artifactsFile, line, 'utf-8');
	}

	/**
	 * Save session state
	 */
	async saveState(state: Record<string, unknown>): Promise<void> {
		const sessionDir = this.getCurrentSessionDir();
		if (!sessionDir) {
			throw new Error('No active session');
		}

		const stateFile = path.join(sessionDir, 'state.json');
		await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf-8');
	}

	/**
	 * Load session state
	 */
	async loadState(): Promise<Record<string, unknown> | null> {
		const sessionDir = this.getCurrentSessionDir();
		if (!sessionDir) {
			return null;
		}

		const stateFile = path.join(sessionDir, 'state.json');
		try {
			const content = await fs.readFile(stateFile, 'utf-8');
			return JSON.parse(content);
		} catch {
			return null;
		}
	}

	/**
	 * End current session
	 */
	async endSession(status: 'archived' | 'abandoned' = 'archived'): Promise<void> {
		if (!this.currentSessionId) {
			return;
		}

		const sessionDir = this.getSessionPath(this.currentSessionId, 'active');

		await this.updateMetadata(sessionDir, (metadata) => {
			metadata.endTime = Date.now();
			metadata.status = status;
		});

		// Move to archived folder if ending
		if (status === 'archived') {
			const archiveDir = this.getSessionPath(this.currentSessionId, 'archived');
			await fs.rename(sessionDir, archiveDir);
		}

		this.currentSessionId = null;
	}

	/**
	 * Load session folder
	 */
	async loadSession(sessionId: string, scope: 'active' | 'archived' = 'active'): Promise<SessionFolder | null> {
		const sessionDir = this.getSessionPath(sessionId, scope);

		try {
			const metadata = await this.loadMetadata(sessionDir);
			const messages = await this.loadMessages(sessionDir);
			const artifacts = await this.loadArtifacts(sessionDir);
			const state = await this.loadSessionState(sessionDir);

			return {
				metadata,
				messages,
				artifacts,
				state: state || undefined,
			};
		} catch {
			return null;
		}
	}

	/**
	 * List sessions
	 */
	async listSessions(scope: 'active' | 'archived' | 'all' = 'all'): Promise<SessionMetadata[]> {
		const sessions: SessionMetadata[] = [];
		const scopes: Array<'active' | 'archived'> = scope === 'all' ? ['active', 'archived'] : [scope];

		for (const s of scopes) {
			const dir = path.join(this.config.baseDir, s);
			try {
				const entries = await fs.readdir(dir, { withFileTypes: true });
				for (const entry of entries) {
					if (entry.isDirectory()) {
						const sessionDir = path.join(dir, entry.name);
						const metadata = await this.loadMetadata(sessionDir);
						sessions.push(metadata);
					}
				}
			} catch {
				// Directory doesn't exist
			}
		}

		// Sort by start time, newest first
		return sessions.sort((a, b) => b.startTime - a.startTime);
	}

	/**
	 * Delete session
	 */
	async deleteSession(sessionId: string): Promise<boolean> {
		for (const scope of ['active', 'archived']) {
			const sessionDir = this.getSessionPath(sessionId, scope as 'active' | 'archived');
			try {
				await fs.rm(sessionDir, { recursive: true, force: true });
				return true;
			} catch {
				// Try next scope
			}
		}
		return false;
	}

	/**
	 * Archive old sessions
	 */
	async archiveOldSessions(): Promise<number> {
		const activeSessions = await this.listSessions('active');
		const cutoffTime = Date.now() - (this.config.archiveAfterDays * 24 * 60 * 60 * 1000);
		let archived = 0;

		for (const session of activeSessions) {
			if (session.endTime && session.endTime < cutoffTime) {
				const activeDir = this.getSessionPath(session.id, 'active');
				const archiveDir = this.getSessionPath(session.id, 'archived');

				try {
					await fs.rename(activeDir, archiveDir);
					archived++;
				} catch {
					// Skip if move fails
				}
			}
		}

		return archived;
	}

	/**
	 * Prune sessions exceeding max count
	 */
	async pruneSessions(): Promise<number> {
		const allSessions = await this.listSessions('all');
		let pruned = 0;

		if (allSessions.length > this.config.maxSessions) {
			const toPrune = allSessions.slice(this.config.maxSessions);
			for (const session of toPrune) {
				if (await this.deleteSession(session.id)) {
					pruned++;
				}
			}
		}

		return pruned;
	}

	/**
	 * Export session as transcript
	 */
	async exportTranscript(sessionId: string, outputPath: string): Promise<boolean> {
		const session = await this.loadSession(sessionId, 'active') || await this.loadSession(sessionId, 'archived');
		if (!session) {
			return false;
		}

		const lines: string[] = [];
		lines.push(`# Session Transcript: ${session.metadata.name || session.metadata.id}`);
		lines.push(`Started: ${new Date(session.metadata.startTime).toISOString()}`);
		lines.push(`Project: ${session.metadata.projectPath || 'N/A'}`);
		lines.push(`Model: ${session.metadata.model || 'N/A'}`);
		lines.push(`Total Messages: ${session.metadata.totalMessages}`);
		lines.push('');

		for (const msg of session.messages) {
			const timestamp = new Date(msg.timestamp).toISOString();
			lines.push(`## ${msg.role.toUpperCase()} @ ${timestamp}`);
			lines.push(msg.content);
			if (msg.toolCalls && msg.toolCalls.length > 0) {
				lines.push('');
				lines.push('**Tool Calls:**');
				for (const tc of msg.toolCalls) {
					lines.push(`- ${tc.name}(${JSON.stringify(tc.args)})`);
				}
			}
			lines.push('');
		}

		await fs.writeFile(outputPath, lines.join('\n'), 'utf-8');
		return true;
	}

	/**
	 * Generate session ID
	 */
	private generateSessionId(): string {
		const timestamp = Date.now().toString(36);
		const random = Math.random().toString(36).substring(2, 8);
		return `${timestamp}-${random}`;
	}

	/**
	 * Get session path
	 */
	private getSessionPath(sessionId: string, scope: 'active' | 'archived'): string {
		return path.join(this.config.baseDir, scope, sessionId);
	}

	/**
	 * Save metadata
	 */
	private async saveMetadata(sessionDir: string, metadata: SessionMetadata): Promise<void> {
		const metadataFile = path.join(sessionDir, 'metadata.json');
		await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2), 'utf-8');
	}

	/**
	 * Load metadata
	 */
	private async loadMetadata(sessionDir: string): Promise<SessionMetadata> {
		const metadataFile = path.join(sessionDir, 'metadata.json');
		const content = await fs.readFile(metadataFile, 'utf-8');
		return JSON.parse(content);
	}

	/**
	 * Load messages
	 */
	private async loadMessages(sessionDir: string): Promise<MessageRecord[]> {
		const messagesFile = path.join(sessionDir, 'messages.jsonl');
		try {
			const content = await fs.readFile(messagesFile, 'utf-8');
			return content.trim().split('\n').map(line => JSON.parse(line));
		} catch {
			return [];
		}
	}

	/**
	 * Load artifacts
	 */
	private async loadArtifacts(sessionDir: string): Promise<SessionArtifact[]> {
		const artifactsFile = path.join(sessionDir, 'artifacts.jsonl');
		try {
			const content = await fs.readFile(artifactsFile, 'utf-8');
			return content.trim().split('\n').map(line => JSON.parse(line));
		} catch {
			return [];
		}
	}

	/**
	 * Load session state
	 */
	private async loadSessionState(sessionDir: string): Promise<Record<string, unknown> | null> {
		const stateFile = path.join(sessionDir, 'state.json');
		try {
			const content = await fs.readFile(stateFile, 'utf-8');
			return JSON.parse(content);
		} catch {
			return null;
		}
	}

	/**
	 * Update metadata
	 */
	private async updateMetadata(
		sessionDir: string,
		updateFn: (metadata: SessionMetadata) => void
	): Promise<void> {
		const metadata = await this.loadMetadata(sessionDir);
		updateFn(metadata);
		await this.saveMetadata(sessionDir, metadata);
	}
}

/**
 * Session folder manager singleton
 */
let globalSessionManager: SessionFolderManager | null = null;

export function getSessionFolderManager(config?: Partial<SessionFolderConfig>): SessionFolderManager {
	if (!globalSessionManager) {
		globalSessionManager = new SessionFolderManager(config);
	}
	return globalSessionManager;
}

export { SessionFolder, SessionArtifact, SessionMetadata };
export default SessionFolderManager;
