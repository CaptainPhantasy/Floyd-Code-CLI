/**
 * Session Router
 *
 * Routes requests to the appropriate session and manages session lifecycle.
 * Persists session state for resume capability.
 *
 * @author OPUS1
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface Session {
  id: string;
  clientId: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  metadata: SessionMetadata;
  state: SessionState;
  history: SessionMessage[];
}

export interface SessionMetadata {
  deviceType?: 'ios' | 'android' | 'web' | 'cli';
  appVersion?: string;
  clientIp?: string;
  userAgent?: string;
}

export type SessionState = 'active' | 'idle' | 'disconnected' | 'expired';

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface SessionRouterConfig {
  maxSessions?: number;
  sessionTTL?: number; // ms
  persistPath?: string;
  autoPersist?: boolean;
}

// ============================================================================
// Session Router
// ============================================================================

export class SessionRouter extends EventEmitter {
  private sessions: Map<string, Session> = new Map();
  private clientToSession: Map<string, string> = new Map();
  private config: Required<SessionRouterConfig>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: SessionRouterConfig = {}) {
    super();
    this.config = {
      maxSessions: config.maxSessions ?? 100,
      sessionTTL: config.sessionTTL ?? 24 * 60 * 60 * 1000, // 24 hours
      persistPath: config.persistPath ?? '.floyd/sessions',
      autoPersist: config.autoPersist ?? true,
    };
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  async start(): Promise<void> {
    // Load persisted sessions
    if (this.config.autoPersist) {
      await this.loadSessions();
    }

    // Start cleanup timer
    this.cleanupTimer = setInterval(
      () => this.cleanupExpiredSessions(),
      60 * 1000 // Every minute
    );

    this.emit('started');
  }

  async stop(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Persist sessions before shutdown
    if (this.config.autoPersist) {
      await this.persistSessions();
    }

    this.emit('stopped');
  }

  // --------------------------------------------------------------------------
  // Session Management
  // --------------------------------------------------------------------------

  createSession(clientId: string, metadata: SessionMetadata = {}): Session {
    // Check max sessions
    if (this.sessions.size >= this.config.maxSessions) {
      this.evictOldestSession();
    }

    const session: Session = {
      id: randomUUID(),
      clientId,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      metadata,
      state: 'active',
      history: [],
    };

    this.sessions.set(session.id, session);
    this.clientToSession.set(clientId, session.id);

    this.emit('session-created', { sessionId: session.id, clientId });

    return session;
  }

  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  getSessionByClient(clientId: string): Session | null {
    const sessionId = this.clientToSession.get(clientId);
    return sessionId ? this.sessions.get(sessionId) || null : null;
  }

  resumeSession(sessionId: string, clientId: string): Session | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    if (session.state === 'expired') {
      this.emit('session-expired', { sessionId });
      return null;
    }

    // Update session
    session.clientId = clientId;
    session.lastActiveAt = new Date();
    session.state = 'active';

    // Update client mapping
    this.clientToSession.set(clientId, sessionId);

    this.emit('session-resumed', { sessionId, clientId });

    return session;
  }

  disconnectSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    // Remove client mapping
    if (session.clientId) {
      this.clientToSession.delete(session.clientId);
    }

    session.clientId = null;
    session.state = 'disconnected';
    session.lastActiveAt = new Date();

    this.emit('session-disconnected', { sessionId });

    return true;
  }

  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    // Remove client mapping
    if (session.clientId) {
      this.clientToSession.delete(session.clientId);
    }

    this.sessions.delete(sessionId);

    this.emit('session-deleted', { sessionId });

    return true;
  }

  // --------------------------------------------------------------------------
  // Message Management
  // --------------------------------------------------------------------------

  addMessage(sessionId: string, message: Omit<SessionMessage, 'id' | 'timestamp'>): SessionMessage | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    const fullMessage: SessionMessage = {
      ...message,
      id: randomUUID(),
      timestamp: new Date(),
    };

    session.history.push(fullMessage);
    session.lastActiveAt = new Date();
    session.state = 'active';

    this.emit('message-added', { sessionId, messageId: fullMessage.id });

    return fullMessage;
  }

  getMessages(sessionId: string, limit?: number): SessionMessage[] {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return [];
    }

    const history = session.history;
    return limit ? history.slice(-limit) : history;
  }

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  async persistSessions(): Promise<void> {
    try {
      await fs.mkdir(this.config.persistPath, { recursive: true });

      const data = {
        version: 1,
        savedAt: new Date().toISOString(),
        sessions: Array.from(this.sessions.entries()).map(([id, session]) => ({
          id,
          ...session,
          createdAt: session.createdAt.toISOString(),
          lastActiveAt: session.lastActiveAt.toISOString(),
          history: session.history.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
        })),
      };

      const filePath = path.join(this.config.persistPath, 'sessions.json');
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));

      this.emit('sessions-persisted', { count: this.sessions.size });
    } catch (error) {
      this.emit('persist-error', error);
    }
  }

  async loadSessions(): Promise<void> {
    try {
      const filePath = path.join(this.config.persistPath, 'sessions.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (data.version !== 1) {
        throw new Error(`Unknown session format version: ${data.version}`);
      }

      for (const sessionData of data.sessions) {
        const session: Session = {
          ...sessionData,
          clientId: null, // Clear client association on load
          createdAt: new Date(sessionData.createdAt),
          lastActiveAt: new Date(sessionData.lastActiveAt),
          state: 'disconnected',
          history: sessionData.history.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        };

        // Skip expired sessions
        const age = Date.now() - session.lastActiveAt.getTime();
        if (age > this.config.sessionTTL) {
          continue;
        }

        this.sessions.set(session.id, session);
      }

      this.emit('sessions-loaded', { count: this.sessions.size });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.emit('load-error', error);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Cleanup
  // --------------------------------------------------------------------------

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      const age = now - session.lastActiveAt.getTime();
      if (age > this.config.sessionTTL) {
        expired.push(sessionId);
      }
    }

    for (const sessionId of expired) {
      const session = this.sessions.get(sessionId);
      if (session?.clientId) {
        this.clientToSession.delete(session.clientId);
      }
      this.sessions.delete(sessionId);
    }

    if (expired.length > 0) {
      this.emit('sessions-cleaned', { count: expired.length });
    }
  }

  private evictOldestSession(): void {
    let oldest: Session | null = null;
    let oldestId: string | null = null;

    for (const [id, session] of this.sessions) {
      if (!oldest || session.lastActiveAt < oldest.lastActiveAt) {
        oldest = session;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.deleteSession(oldestId);
      this.emit('session-evicted', { sessionId: oldestId });
    }
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.state === 'active'
    );
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getActiveSessionCount(): number {
    return this.getActiveSessions().length;
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createSessionRouter(config?: SessionRouterConfig): SessionRouter {
  return new SessionRouter(config);
}
