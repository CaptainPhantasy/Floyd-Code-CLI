"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const node_fs_1 = require("node:fs");
const path = __importStar(require("node:path"));
const http = __importStar(require("node:http"));
// ============================================================================
// FLOYD BRIDGE SERVER
// ============================================================================
// HTTP server that allows Floyd CLI to communicate with this extension
const BRIDGE_PORT = 34567;
const BRIDGE_HOST = 'localhost';
class FloydBridgeServer {
    constructor() {
        this.server = null;
        this.manager = null;
    }
    setManager(manager) {
        this.manager = manager;
    }
    async start() {
        if (this.server) {
            return; // Already running
        }
        this.server = http.createServer(async (req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                if (req.method === 'GET' && url.pathname === '/status') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'ok', extension: 'floyd-multi-chat' }));
                    return;
                }
                if (req.method === 'GET' && url.pathname === '/sessions') {
                    if (!this.manager) {
                        res.writeHead(503, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Manager not ready' }));
                        return;
                    }
                    const sessions = this.manager.getSessions();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(sessions));
                    return;
                }
                if (req.method === 'POST') {
                    let body = '';
                    for await (const chunk of req) {
                        body += chunk.toString();
                    }
                    const data = JSON.parse(body);
                    if (url.pathname === '/open') {
                        if (!this.manager) {
                            res.writeHead(503, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Manager not ready' }));
                            return;
                        }
                        await this.manager.createNewPanel({
                            name: data.name,
                            initialMessage: data.message,
                        });
                        const sessions = this.manager.getSessions();
                        const newSession = sessions[0]; // Most recent
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ sessionId: newSession.id, name: newSession.name }));
                        return;
                    }
                    if (url.pathname === '/send') {
                        if (!this.manager || !data.sessionId) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Missing sessionId or manager' }));
                            return;
                        }
                        const session = this.manager.getSession(data.sessionId);
                        if (!session) {
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Session not found' }));
                            return;
                        }
                        // Send the message via the manager's internal method
                        await this.manager.sendMessageToSession(data.sessionId, data.message);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                        return;
                    }
                    if (url.pathname === '/close') {
                        if (!this.manager || !data.sessionId) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Missing sessionId' }));
                            return;
                        }
                        await this.manager.deleteSession(data.sessionId);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                        return;
                    }
                }
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
            catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
            }
        });
        this.server.listen(BRIDGE_PORT, BRIDGE_HOST, () => {
            console.log(`Floyd Bridge Server listening on http://${BRIDGE_HOST}:${BRIDGE_PORT}`);
        });
    }
    async stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }
}
// Global bridge server instance
const bridgeServer = new FloydBridgeServer();
// ============================================================================
// ENV PARSING
// ============================================================================
function parseEnvFile(contents) {
    const result = {};
    contents.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            return;
        const eq = trimmed.indexOf('=');
        if (eq === -1)
            return;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        result[key] = value;
    });
    return result;
}
async function loadEnvLocal() {
    var _a;
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root)
        return;
    const envPath = path.join(root, '.env.local');
    try {
        const contents = await node_fs_1.promises.readFile(envPath, 'utf-8');
        const parsed = parseEnvFile(contents);
        for (const [key, value] of Object.entries(parsed)) {
            (_a = process.env)[key] ?? (_a[key] = value);
        }
    }
    catch {
        // Ignore missing or unreadable .env.local
    }
}
/**
 * Multi-Chat Manager
 */
class MultiChatManager {
    constructor(context, config) {
        this.context = context;
        this.config = config;
        this.panels = new Map();
        this.sessions = new Map();
        this.historyPath = path.join(context.globalStorageUri.fsPath, 'chat-history.json');
    }
    async init() {
        await this.initialize();
    }
    /**
     * Initialize the manager
     */
    async initialize() {
        // Ensure directory exists
        await node_fs_1.promises.mkdir(path.dirname(this.historyPath), { recursive: true });
        // Load history
        await this.loadHistory();
        // Set up auto-save
        if (this.config.get('autoSave', true)) {
            setInterval(() => this.saveHistory(), 30000); // Save every 30 seconds
        }
    }
    /**
     * Load chat history from disk
     */
    async loadHistory() {
        try {
            const data = await node_fs_1.promises.readFile(this.historyPath, 'utf-8');
            const sessions = JSON.parse(data);
            this.sessions.clear();
            sessions.forEach(session => this.sessions.set(session.id, session));
        }
        catch (error) {
            // File doesn't exist or is invalid
            this.sessions.clear();
            console.warn('FLOYD Multi-Chat: history load failed, starting fresh.', error);
        }
    }
    /**
     * Save chat history to disk
     */
    async saveHistory() {
        if (!this.config.get('preserveHistory', true)) {
            return;
        }
        const sessions = Array.from(this.sessions.values());
        await node_fs_1.promises.writeFile(this.historyPath, JSON.stringify(sessions, null, 2), 'utf-8');
    }
    /**
     * Get all sessions
     */
    getSessions() {
        return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    }
    /**
     * Get session by ID
     */
    getSession(id) {
        return this.sessions.get(id);
    }
    /**
     * Create a new chat panel
     */
    async createNewPanel(options) {
        // Check max panels limit
        const maxPanels = this.config.get('maxPanels', 5);
        if (this.panels.size >= maxPanels) {
            vscode.window.showWarningMessage(`Maximum ${maxPanels} panels allowed. Close one first.`);
            return;
        }
        // Create new session
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        const session = {
            id: sessionId,
            name: options?.name || `Chat ${this.sessions.size + 1}`,
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            agent: options?.agent
        };
        this.sessions.set(sessionId, session);
        await this.saveHistory();
        // Create panel
        this.createPanelForSession(session, options?.initialMessage);
    }
    /**
     * Create a webview panel for a session
     */
    createPanelForSession(session, initialMessage) {
        const defaultPosition = this.config.get('defaultPosition', 'beside');
        const columnMap = {
            beside: vscode.ViewColumn.Beside,
            right: vscode.ViewColumn.Two,
            left: vscode.ViewColumn.One,
            bottom: vscode.ViewColumn.Three
        };
        const panel = vscode.window.createWebviewPanel(`floyd.chat.${session.id}`, session.name, { viewColumn: columnMap[defaultPosition], preserveFocus: false }, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'assets')]
        });
        this.panels.set(session.id, { sessionId: session.id, panel });
        this.currentSessionId = session.id;
        // Set webview HTML
        panel.webview.html = this.getWebviewContent(session);
        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async (message) => {
            await this.handleMessage(session.id, message);
        }, null, this.context.subscriptions);
        // Handle panel dispose
        panel.onDidDispose(() => {
            this.panels.delete(session.id);
            if (this.currentSessionId === session.id) {
                this.currentSessionId = undefined;
            }
        });
        // Send initial message if provided
        if (initialMessage) {
            setTimeout(() => {
                panel.webview.postMessage({ type: 'addMessage', message: initialMessage });
            }, 500);
        }
    }
    /**
     * Handle messages from webview
     */
    async handleMessage(sessionId, message) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        switch (message.type) {
            case 'sendMessage': {
                const userMsg = {
                    id: `msg-${Date.now()}`,
                    role: 'user',
                    content: message.content,
                    timestamp: Date.now()
                };
                session.messages.push(userMsg);
                session.updatedAt = Date.now();
                await this.sendToLLM(session, message.content);
                await this.saveHistory();
                break;
            }
            case 'rename': {
                session.name = message.name;
                session.updatedAt = Date.now();
                await this.saveHistory();
                const panelState = this.panels.get(sessionId);
                if (panelState) {
                    panelState.panel.title = session.name;
                }
                break;
            }
            case 'clear': {
                session.messages = [];
                session.updatedAt = Date.now();
                await this.saveHistory();
                break;
            }
            case 'export': {
                await this.exportSession(sessionId);
                break;
            }
        }
    }
    /**
     * Send message to LLM
     * First tries to use Floyd's agent MCP server, falls back to direct API call
     */
    async sendToLLM(session, content) {
        const panelState = this.panels.get(session.id);
        if (!panelState)
            return;
        // Show typing indicator
        panelState.panel.webview.postMessage({ type: 'typing', isTyping: true });
        try {
            // Try Floyd's agent server first
            const floydAgentAvailable = await this.checkFloydAgentServer();
            if (floydAgentAvailable) {
                console.log('Using Floyd Agent Server for chat');
                await this.sendViaFloydAgent(session, content);
            }
            else {
                console.log('Floyd Agent Server not available, using direct API');
                await this.sendViaDirectAPI(session, content);
            }
            // Send to webview
            panelState.panel.webview.postMessage({ type: 'typing', isTyping: false });
            // Save history
            await this.saveHistory();
        }
        catch (error) {
            console.error('LLM error:', error);
            // Send error message to user
            const errorMsg = {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : String(error)}\n\nPlease check your API key configuration.`,
                timestamp: Date.now()
            };
            session.messages.push(errorMsg);
            session.updatedAt = Date.now();
            panelState.panel.webview.postMessage({
                type: 'addMessage',
                message: errorMsg
            });
            panelState.panel.webview.postMessage({ type: 'typing', isTyping: false });
        }
    }
    /**
     * Check if Floyd's agent MCP server is available
     */
    async checkFloydAgentServer() {
        try {
            const response = await fetch('http://localhost:34568/status', {
                method: 'GET',
                signal: AbortSignal.timeout(500)
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    /**
     * Send message via Floyd's agent MCP server
     */
    async sendViaFloydAgent(session, content) {
        const response = await fetch('http://localhost:34568/tools/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'chat_send',
                arguments: {
                    sessionId: session.id,
                    message: content,
                    projectPath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                    includeHistory: false
                }
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Floyd Agent error: ${error}`);
        }
        const data = await response.json();
        const resultText = data.content?.[0]?.text;
        if (!resultText) {
            throw new Error('No response from Floyd Agent');
        }
        const parsedResult = JSON.parse(resultText);
        const assistantContent = parsedResult.content || 'No response received';
        // Add assistant message to session
        const assistantMsg = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: assistantContent,
            timestamp: parsedResult.timestamp || Date.now()
        };
        session.messages.push(assistantMsg);
        session.updatedAt = Date.now();
        // Send to webview
        const panelState = this.panels.get(session.id);
        if (panelState) {
            panelState.panel.webview.postMessage({
                type: 'addMessage',
                message: assistantMsg
            });
        }
    }
    /**
     * Send message via direct API call (fallback)
     */
    async sendViaDirectAPI(session, content) {
        const panelState = this.panels.get(session.id);
        if (!panelState)
            return;
        // Get API key from configuration or environment
        const apiKey = process.env.FLOYD_GLM_API_KEY || process.env.GLM_API_KEY;
        if (!apiKey) {
            throw new Error('API key not configured. Please set FLOYD_GLM_API_KEY or GLM_API_KEY environment variable.');
        }
        // Get API configuration
        const apiEndpoint = process.env.FLOYD_GLM_ENDPOINT || process.env.GLM_ENDPOINT || 'https://api.z.ai/api/coding/paas/v4';
        const apiModel = process.env.FLOYD_GLM_MODEL || process.env.GLM_MODEL || 'glm-4.7';
        // Build message history for GLM-4.7 format
        const messages = session.messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : m.role,
            content: m.content
        }));
        // Add system prompt if agent is specified
        if (session.agent) {
            messages.unshift({ role: 'system', content: session.agent });
        }
        else {
            messages.unshift({ role: 'system', content: 'You are a helpful AI assistant.' });
        }
        // Make API request to GLM-4.7 endpoint
        const response = await fetch(`${apiEndpoint}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: apiModel,
                max_tokens: 4096,
                messages: messages,
                stream: false
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API request failed: ${response.status} - ${error}`);
        }
        const data = await response.json();
        // GLM-4.7 response format: choices[0].message.content or reasoning_content
        const message = data.choices?.[0]?.message;
        const assistantContent = message?.content || message?.reasoning_content || 'No response received';
        // Add assistant message to session
        const assistantMsg = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: assistantContent,
            timestamp: Date.now()
        };
        session.messages.push(assistantMsg);
        session.updatedAt = Date.now();
        // Send to webview
        panelState.panel.webview.postMessage({
            type: 'addMessage',
            message: assistantMsg
        });
    }
    /**
     * Get webview HTML content
     */
    getWebviewContent(session) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${session.name}</title>
  <style>
    * { box-sizing: border-box; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .header {
      padding: 10px 15px;
      background-color: var(--vscode-editorGroupHeader-tabsBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-title {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .header-btn {
      background: transparent;
      border: none;
      color: var(--vscode-foreground);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
    }

    .header-btn:hover {
      background-color: var(--vscode-toolbar-hoverBackground);
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
      line-height: 1.5;
    }

    .message.user {
      align-self: flex-end;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .message.assistant {
      align-self: flex-start;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
    }

    .message.system {
      align-self: center;
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 3px solid var(--vscode-textBlockQuote-border);
      max-width: 90%;
      font-size: 0.9em;
    }

    .message-content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .input-area {
      padding: 15px;
      background-color: var(--vscode-editorGroupHeader-tabsBackground);
      border-top: 1px solid var(--vscode-panel-border);
      display: flex;
      gap: 10px;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }

    #messageInput {
      width: 100%;
      min-height: 40px;
      max-height: 150px;
      padding: 10px 40px 10px 12px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 6px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: inherit;
      font-size: inherit;
      resize: vertical;
    }

    #messageInput:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }

    .send-btn {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 6px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .send-btn:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .typing-indicator {
      display: none;
      padding: 12px 16px;
      background-color: var(--vscode-input-background);
      border-radius: 12px;
      align-self: flex-start;
    }

    .typing-indicator.active {
      display: block;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
    }

    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--vscode-foreground);
      animation: typing 1.4s infinite;
    }

    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { opacity: 0.3; }
      30% { opacity: 1; }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--vscode-descriptionForeground);
      text-align: center;
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-top: 20px;
    }

    .suggestion {
      padding: 8px 12px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 16px;
      cursor: pointer;
      font-size: 13px;
    }

    .suggestion:hover {
      background-color: var(--vscode-toolbar-hoverBackground);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-title">
      <span>💬</span>
      <span>${this.escapeHtml(session.name)}</span>
    </div>
    <div class="header-actions">
      <button class="header-btn" id="renameBtn" title="Rename chat">✏️</button>
      <button class="header-btn" id="clearBtn" title="Clear conversation">🗑️</button>
      <button class="header-btn" id="exportBtn" title="Export chat">📥</button>
    </div>
  </div>

  <div class="messages" id="messages">
    <div class="empty-state" id="emptyState">
      <div class="empty-state-icon">🤖</div>
      <div>Start a conversation with AI</div>
      <div class="suggestions">
        <div class="suggestion" data-text="Explain this code">Explain this code</div>
        <div class="suggestion" data-text="Help me debug">Help me debug</div>
        <div class="suggestion" data-text="Write tests for this">Write tests</div>
        <div class="suggestion" data-text="Refactor this code">Refactor this</div>
      </div>
    </div>
  </div>

  <div class="typing-indicator" id="typingIndicator">
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  </div>

  <div class="input-area">
    <div class="input-wrapper">
      <textarea
        id="messageInput"
        placeholder="Type your message... (Shift+Enter for new line)"
        rows="1"
      ></textarea>
    </div>
    <button class="send-btn" id="sendBtn" disabled>➤</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const typingIndicator = document.getElementById('typingIndicator');
    let emptyState = document.getElementById('emptyState');
    const renameBtn = document.getElementById('renameBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exportBtn = document.getElementById('exportBtn');

    // Existing messages
    const existingMessages = ${JSON.stringify(session.messages)};
    existingMessages.forEach(msg => addMessage(msg.role, msg.content));

    updateEmptyState();

    // Event listeners
    messageInput.addEventListener('input', () => {
      sendBtn.disabled = !messageInput.value.trim();
      autoResize();
    });

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    sendBtn.addEventListener('click', sendMessage);

    renameBtn.addEventListener('click', () => {
      const newName = prompt('Enter new chat name:', '${this.escapeHtml(session.name)}');
      if (newName) {
        vscode.postMessage({ type: 'rename', name: newName });
        document.querySelector('.header-title span:nth-child(2)').textContent = newName;
      }
    });

    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all messages in this conversation?')) {
        vscode.postMessage({ type: 'clear' });
        messagesContainer.innerHTML = \`
          <div class="empty-state" id="emptyState">
            <div class="empty-state-icon">🤖</div>
            <div>Start a conversation with AI</div>
            <div class="suggestions">
              <div class="suggestion" data-text="Explain this code">Explain this code</div>
              <div class="suggestion" data-text="Help me debug">Help me debug</div>
              <div class="suggestion" data-text="Write tests for this">Write tests</div>
            </div>
          </div>
        \`;
        emptyState = document.getElementById('emptyState');
        updateEmptyState();
        attachSuggestionListeners();
      }
    });

    exportBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'export' });
    });

    // Suggestions
    function attachSuggestionListeners() {
      document.querySelectorAll('.suggestion').forEach(s => {
        s.addEventListener('click', () => {
          messageInput.value = s.dataset.text;
          sendBtn.disabled = false;
          messageInput.focus();
          autoResize();
        });
      });
    }
    attachSuggestionListeners();

    function sendMessage() {
      const content = messageInput.value.trim();
      if (!content) return;

      addMessage('user', content);
      vscode.postMessage({ type: 'sendMessage', content });

      messageInput.value = '';
      sendBtn.disabled = true;
      autoResize();
    }

    function addMessage(role, content) {
      const msgDiv = document.createElement('div');
      msgDiv.className = \`message \${role}\`;
      msgDiv.innerHTML = \`<div class="message-content">\${escapeHtml(content)}</div>\`;
      messagesContainer.appendChild(msgDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      updateEmptyState();
    }

    function updateEmptyState() {
      const hasMessages = messagesContainer.querySelectorAll('.message').length > 0;
      const currentEmptyState = document.getElementById('emptyState');
      if (currentEmptyState) {
        currentEmptyState.style.display = hasMessages ? 'none' : 'flex';
      }
    }

    function autoResize() {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Listen for messages from extension
    window.addEventListener('message', event => {
      const message = event.data;
      switch (message.type) {
        case 'addMessage':
          addMessage('assistant', message.message.content || message.message);
          break;
        case 'typing':
          typingIndicator.classList.toggle('active', message.isTyping);
          break;
      }
    });
  </script>
</body>
</html>`;
    }
    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        return text
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }
    /**
     * Export session to file
     */
    async exportSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        const uri = await vscode.window.showSaveDialog({
            filters: { 'Markdown': ['md'], 'JSON': ['json'], 'Text': ['txt'] },
            defaultUri: vscode.Uri.file(`${session.name.replaceAll(/\s+/g, '-')}-${Date.now()}.md`),
            title: 'Export chat as'
        });
        if (!uri)
            return;
        const ext = path.extname(uri.fsPath).toLowerCase();
        let content;
        switch (ext) {
            case '.json':
                content = JSON.stringify(session, null, 2);
                break;
            case '.md':
                content = this.exportAsMarkdown(session);
                break;
            default:
                content = this.exportAsText(session);
        }
        await node_fs_1.promises.writeFile(uri.fsPath, content, 'utf-8');
        vscode.window.showInformationMessage(`Chat exported to ${uri.fsPath}`);
    }
    /**
     * Export session as markdown
     */
    exportAsMarkdown(session) {
        let md = `# ${session.name}\n\n`;
        md += `**Created:** ${new Date(session.createdAt).toLocaleString()}\n`;
        md += `**Messages:** ${session.messages.length}\n\n`;
        md += `---\n\n`;
        for (const msg of session.messages) {
            const role = msg.role === 'user' ? '👤 **You**' : '🤖 **Assistant**';
            md += `${role}\n\n${msg.content}\n\n---\n\n`;
        }
        return md;
    }
    /**
     * Export session as plain text
     */
    exportAsText(session) {
        let text = `${session.name}\n`;
        text += `${'='.repeat(session.name.length)}\n\n`;
        text += `Created: ${new Date(session.createdAt).toLocaleString()}\n\n`;
        for (const msg of session.messages) {
            const role = msg.role === 'user' ? 'YOU' : 'ASSISTANT';
            text += `[${role} - ${new Date(msg.timestamp).toLocaleTimeString()}]\n`;
            text += `${msg.content}\n\n`;
        }
        return text;
    }
    /**
     * Close all panels
     */
    closeAllPanels() {
        this.panels.forEach(state => state.panel.dispose());
        this.panels.clear();
    }
    /**
     * Rename a session
     */
    async renameSession(sessionId, newName) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.name = newName;
            session.updatedAt = Date.now();
            await this.saveHistory();
            const panelState = this.panels.get(sessionId);
            if (panelState) {
                panelState.panel.title = newName;
            }
        }
    }
    /**
     * Delete a session
     */
    async deleteSession(sessionId) {
        const panelState = this.panels.get(sessionId);
        if (panelState) {
            panelState.panel.dispose();
        }
        this.panels.delete(sessionId);
        this.sessions.delete(sessionId);
        await this.saveHistory();
    }
    /**
     * Open existing session
     */
    openSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session && !this.panels.has(sessionId)) {
            this.createPanelForSession(session);
        }
        else if (this.panels.has(sessionId)) {
            this.panels.get(sessionId).panel.reveal();
        }
    }
    /**
     * Duplicate a session
     */
    async duplicateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            const newSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            const newSession = {
                ...session,
                id: newSessionId,
                name: `${session.name} (copy)`,
                messages: [...session.messages],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            this.sessions.set(newSessionId, newSession);
            await this.saveHistory();
            this.createPanelForSession(newSession);
        }
    }
    /**
     * Send a message to a specific session (for Floyd CLI bridge)
     */
    async sendMessageToSession(sessionId, message) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        // Add user message
        const userMsg = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: message,
            timestamp: Date.now()
        };
        session.messages.push(userMsg);
        session.updatedAt = Date.now();
        // Get the panel for this session
        const panelState = this.panels.get(sessionId);
        if (panelState) {
            // Send to webview to display
            panelState.panel.webview.postMessage({ type: 'addMessage', message: userMsg });
            // Show typing indicator
            panelState.panel.webview.postMessage({ type: 'typing', isTyping: true });
        }
        // Get response from LLM
        await this.sendToLLM(session, message);
        // Save history
        await this.saveHistory();
        // Hide typing indicator
        if (panelState) {
            panelState.panel.webview.postMessage({ type: 'typing', isTyping: false });
        }
    }
}
/**
 * Tree Data Provider for Chat Sessions
 */
class ChatSessionTreeProvider {
    constructor(manager) {
        this.manager = manager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            const sessions = this.manager.getSessions();
            return sessions.map(session => new SessionTreeItem(session));
        }
        return [];
    }
}
class SessionTreeItem extends vscode.TreeItem {
    constructor(session) {
        super(session.name, vscode.TreeItemCollapsibleState.None);
        this.session = session;
        this.description = `${session.messages.length} messages`;
        this.tooltip = `Created: ${new Date(session.createdAt).toLocaleString()}`;
        this.contextValue = 'chatSession';
        this.iconPath = new vscode.ThemeIcon('$(comment-discussion)');
        this.command = {
            command: 'floyd.multiChat.openSession',
            title: 'Open Chat',
            arguments: [this.session.id]
        };
    }
}
/**
 * Main extension activation
 */
async function activate(context) {
    console.log('FLOYD Multi-Chat is now active!');
    await loadEnvLocal();
    // Get configuration
    const config = vscode.workspace.getConfiguration('floyd.multiChat');
    // Create manager
    const manager = new MultiChatManager(context, config);
    await manager.init();
    // Start Floyd Bridge Server (allows Floyd CLI to communicate with extension)
    bridgeServer.setManager(manager);
    await bridgeServer.start();
    // Register bridge server disposal on deactivate
    context.subscriptions.push({
        dispose: async () => {
            await bridgeServer.stop();
        }
    });
    // Create new chat panel command
    const newChatCommand = vscode.commands.registerCommand('floyd.multiChat.new', async () => {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter chat name (optional)',
            placeHolder: 'My AI Chat'
        });
        await manager.createNewPanel({ name: name || undefined });
    });
    // Close all panels command
    const closeAllCommand = vscode.commands.registerCommand('floyd.multiChat.closeAll', () => {
        manager.closeAllPanels();
    });
    // Rename panel command
    const renameCommand = vscode.commands.registerCommand('floyd.multiChat.rename', async () => {
        const sessions = manager.getSessions();
        if (sessions.length === 0) {
            vscode.window.showInformationMessage('No chat sessions to rename.');
            return;
        }
        const items = sessions.map(s => ({
            label: s.name,
            sessionId: s.id
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a chat to rename'
        });
        if (selected) {
            const newName = await vscode.window.showInputBox({
                prompt: 'Enter new name',
                value: manager.getSession(selected.sessionId)?.name
            });
            if (newName) {
                await manager.renameSession(selected.sessionId, newName);
            }
        }
    });
    // Duplicate panel command
    const duplicateCommand = vscode.commands.registerCommand('floyd.multiChat.duplicate', async () => {
        const sessions = manager.getSessions();
        if (sessions.length === 0) {
            vscode.window.showInformationMessage('No chat sessions to duplicate.');
            return;
        }
        const items = sessions.map(s => ({
            label: s.name,
            sessionId: s.id
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a chat to duplicate'
        });
        if (selected) {
            await manager.duplicateSession(selected.sessionId);
        }
    });
    // Export command
    const exportCommand = vscode.commands.registerCommand('floyd.multiChat.export', async () => {
        const sessions = manager.getSessions();
        if (sessions.length === 0) {
            vscode.window.showInformationMessage('No chat sessions to export.');
            return;
        }
        const items = sessions.map(s => ({
            label: s.name,
            sessionId: s.id
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a chat to export'
        });
        if (selected) {
            await manager.exportSession(selected.sessionId);
        }
    });
    // Open session command
    const openSessionCommand = vscode.commands.registerCommand('floyd.multiChat.openSession', (sessionId) => {
        manager.openSession(sessionId);
    });
    // Delete session command
    const deleteSessionCommand = vscode.commands.registerCommand('floyd.multiChat.deleteSession', async (sessionId) => {
        const confirmed = await vscode.window.showWarningMessage('Delete this chat session?', { modal: true }, 'Delete');
        if (confirmed === 'Delete') {
            await manager.deleteSession(sessionId);
        }
    });
    // Register all commands
    context.subscriptions.push(newChatCommand, closeAllCommand, renameCommand, duplicateCommand, exportCommand, openSessionCommand, deleteSessionCommand);
    // Create tree view
    const treeDataProvider = new ChatSessionTreeProvider(manager);
    const treeView = vscode.window.createTreeView('floydMultiChatList', {
        treeDataProvider
    });
    context.subscriptions.push(treeView);
    // Welcome message
    vscode.window.showInformationMessage('FLOYD Multi-Chat ready! Open the FLOYD Chats sidebar to manage your AI conversations.', 'New Chat', 'Learn More').then(selection => {
        if (selection === 'New Chat') {
            vscode.commands.executeCommand('floyd.multiChat.new');
        }
    });
}
function deactivate() {
    console.log('FLOYD Multi-Chat deactivated');
}
//# sourceMappingURL=extension.js.map