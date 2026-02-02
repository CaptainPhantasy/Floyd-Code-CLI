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
/**
 * Agent storage service
 */
class AgentStorage {
    constructor(context, config) {
        this.context = context;
        this.config = config;
        this.agents = new Map();
        this.useWorkspace = false;
        this.globalStoragePath = path.join(context.globalStorageUri.fsPath, 'agents.json');
        this.workspaceStoragePath = path.join(context.storageUri?.fsPath || '', 'agents.json');
        this.storagePath = this.globalStoragePath;
    }
    /**
     * Initialize storage
     */
    async initialize() {
        // Ensure directories exist
        await node_fs_1.promises.mkdir(path.dirname(this.globalStoragePath), { recursive: true });
        // Determine storage location
        this.useWorkspace = this.config.get('storageLocation', 'global') === 'workspace';
        this.storagePath = this.useWorkspace && this.context.storageUri
            ? this.workspaceStoragePath
            : this.globalStoragePath;
        if (this.useWorkspace && this.context.storageUri) {
            await node_fs_1.promises.mkdir(path.dirname(this.workspaceStoragePath), { recursive: true });
        }
        await this.loadAgents();
    }
    /**
     * Load agents from storage
     */
    async loadAgents() {
        try {
            const data = await node_fs_1.promises.readFile(this.storagePath, 'utf-8');
            const agents = JSON.parse(data);
            this.agents.clear();
            agents.forEach(agent => this.agents.set(agent.id, agent));
        }
        catch (error) {
            // File doesn't exist or is invalid, start with empty
            this.agents.clear();
            console.warn('FLOYD Custom Agents: load failed, starting fresh.', error);
            await this.saveAgents();
        }
    }
    /**
     * Save agents to storage
     */
    async saveAgents() {
        const agents = Array.from(this.agents.values());
        await node_fs_1.promises.writeFile(this.storagePath, JSON.stringify(agents, null, 2), 'utf-8');
    }
    /**
     * Get all agents
     */
    getAllAgents() {
        return Array.from(this.agents.values()).sort((a, b) => b.createdAt - a.createdAt);
    }
    /**
     * Get agent by ID
     */
    getAgent(id) {
        return this.agents.get(id);
    }
    /**
     * Get agent by name
     */
    getAgentByName(name) {
        return this.getAllAgents().find(a => a.name.toLowerCase() === name.toLowerCase());
    }
    /**
     * Add or update an agent
     */
    async saveAgent(agent) {
        const now = Date.now();
        if (this.agents.has(agent.id)) {
            // Update existing
            const existing = this.agents.get(agent.id);
            agent.createdAt = existing.createdAt;
            agent.updatedAt = now;
        }
        else {
            // New agent
            agent.createdAt = now;
            agent.updatedAt = now;
        }
        this.agents.set(agent.id, agent);
        await this.saveAgents();
    }
    /**
     * Delete an agent
     */
    async deleteAgent(id) {
        const deleted = this.agents.delete(id);
        if (deleted) {
            await this.saveAgents();
        }
        return deleted;
    }
    /**
     * Import agents from file
     */
    async importAgents(filePath) {
        const data = await node_fs_1.promises.readFile(filePath, 'utf-8');
        const imported = JSON.parse(data);
        const importedCount = [];
        for (const agent of imported) {
            // Generate new ID to avoid conflicts
            agent.id = this.generateId();
            agent.createdAt = Date.now();
            agent.updatedAt = Date.now();
            this.agents.set(agent.id, agent);
            importedCount.push(agent);
        }
        await this.saveAgents();
        return importedCount;
    }
    /**
     * Export agents to file
     */
    async exportAgents(agentIds, filePath) {
        const agents = agentIds.map(id => this.agents.get(id)).filter((a) => !!a);
        await node_fs_1.promises.writeFile(filePath, JSON.stringify(agents, null, 2), 'utf-8');
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `agent-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }
    /**
     * Switch storage location
     */
    async switchStorage(useWorkspace) {
        this.useWorkspace = useWorkspace;
        this.storagePath = useWorkspace && this.context.storageUri
            ? this.workspaceStoragePath
            : this.globalStoragePath;
        if (useWorkspace && this.context.storageUri) {
            await node_fs_1.promises.mkdir(path.dirname(this.workspaceStoragePath), { recursive: true });
        }
        await this.loadAgents();
    }
}
/**
 * Built-in agent templates
 */
const AGENT_TEMPLATES = [
    {
        name: 'Code Reviewer',
        description: 'Reviews code for bugs, security issues, and best practices',
        systemPrompt: `You are an expert code reviewer. Analyze the provided code for:
1. Potential bugs and edge cases
2. Security vulnerabilities (OWASP Top 10, injection attacks, etc.)
3. Performance issues and optimizations
4. Code style and maintainability
5. Best practices adherence (SOLID, DRY, clean code)

Provide constructive feedback with:
- Specific examples and line references
- Suggested fixes with code snippets
- Severity ratings (Critical/High/Medium/Low)
- Positive reinforcement for good practices

Be thorough but constructive. Your goal is to improve code quality.`,
        temperature: 0.3,
        maxTokens: 2000,
        icon: 'shield',
        model: 'gpt-4',
        keywords: ['review', 'audit', 'security', 'bugs']
    },
    {
        name: 'Documentation Writer',
        description: 'Generates clear documentation from code',
        systemPrompt: `You are a technical writer specializing in API documentation. Generate clear, concise documentation including:

For functions/methods:
- Purpose and behavior description
- Parameter descriptions with types
- Return value documentation
- Usage examples
- Important notes, warnings, or edge cases

For classes/modules:
- Overview and purpose
- Public API documentation
- Usage examples
- Design patterns used
- Integration points

Use:
- Clear, simple language
- Active voice
- Code examples for complex concepts
- Proper formatting (markdown, JSDoc, etc.)`,
        temperature: 0.5,
        maxTokens: 3000,
        icon: 'book',
        model: 'gpt-4',
        keywords: ['docs', 'documentation', 'comments', 'readme']
    },
    {
        name: 'Refactoring Expert',
        description: 'Suggests code improvements and refactoring opportunities',
        systemPrompt: `You are a code refactoring expert with deep knowledge of design patterns and clean code principles. Analyze code and suggest:

1. Design pattern applications
2. Code duplication reduction (DRY)
3. SOLID principle improvements
4. Clean code practices
5. Modern language feature usage
6. Performance optimizations
7. Testability improvements

For each suggestion:
- Explain the problem
- Propose a solution
- Show before/after code
- Explain benefits

Focus on actionable improvements with clear code examples.`,
        temperature: 0.4,
        maxTokens: 2500,
        icon: 'symbol-property',
        model: 'gpt-4',
        keywords: ['refactor', 'improve', 'optimize', 'clean']
    },
    {
        name: 'Debug Assistant',
        description: 'Helps diagnose and fix bugs',
        systemPrompt: `You are a debugging expert. Help diagnose and fix bugs by:

1. Analyzing error messages and stack traces
2. Identifying root causes
3. Suggesting diagnostic steps
4. Proposing fixes with explanations
5. Preventing similar issues

When debugging:
- Ask clarifying questions if needed
- Consider edge cases
- Suggest logging/debugging strategies
- Explain why the bug occurs
- Provide tested solutions

Be methodical and educational.`,
        temperature: 0.3,
        maxTokens: 2000,
        icon: 'bug',
        model: 'gpt-4',
        keywords: ['debug', 'fix', 'error', 'issue']
    },
    {
        name: 'Test Generator',
        description: 'Generates comprehensive unit tests',
        systemPrompt: `You are a test engineering expert. Generate comprehensive test suites that cover:

For each function/class:
- Happy path cases
- Edge cases and boundaries
- Error handling
- Null/undefined inputs
- Integration scenarios

Use best practices:
- AAA pattern (Arrange, Act, Assert)
- Clear test names
- Descriptive assertions
- Mock external dependencies
- Test isolation

Include:
- Unit tests
- Integration tests (if applicable)
- Setup/teardown code
- Test data fixtures

Framework-agnostic unless specified.`,
        temperature: 0.4,
        maxTokens: 3000,
        icon: 'beaker',
        model: 'gpt-4',
        keywords: ['test', 'testing', 'unit', 'coverage']
    },
    {
        name: 'Code Explainer',
        description: 'Explains code in simple terms',
        systemPrompt: `You are a code explanation expert. Explain code clearly to developers of varying skill levels.

For each explanation:
- Start with a high-level overview
- Break down complex logic
- Explain the "why", not just the "what"
- Use analogies when helpful
- Point out important patterns or techniques
- Mention potential pitfalls

Adapt your explanation depth based on:
- Code complexity
- Requested detail level
- Apparent expertise level

Be clear, patient, and thorough.`,
        temperature: 0.5,
        maxTokens: 2000,
        icon: 'lightbulb',
        model: 'gpt-4',
        keywords: ['explain', 'understand', 'learn', 'teach']
    },
    {
        name: 'SQL Expert',
        description: 'Helps write, optimize, and debug SQL queries',
        systemPrompt: `You are a SQL and database expert. Help with:

Query Writing:
- SELECT, JOIN, GROUP BY, HAVING queries
- Subqueries and CTEs
- Window functions
- Complex aggregations

Optimization:
- Index suggestions
- Query plan analysis
- Performance tuning
- N+1 query prevention

Database Design:
- Schema normalization
- Relationship modeling
- Migration scripts

Include:
- Query explanations
- Performance considerations
- Alternative approaches
- Database-specific notes (PostgreSQL, MySQL, etc.)`,
        temperature: 0.3,
        maxTokens: 2000,
        icon: 'database',
        model: 'gpt-4',
        keywords: ['sql', 'database', 'query', 'postgres']
    },
    {
        name: 'Git Helper',
        description: 'Assists with Git operations and workflows',
        systemPrompt: `You are a Git and version control expert. Help with:

Commit Messages:
- Write conventional commit messages
- Format multi-commit PRs
- Write clear PR descriptions

Branching:
- Git flow strategies
- Branch naming
- Merge vs rebase decisions

Troubleshooting:
- Merge conflicts
- Undo operations
- Lost commits
- Remote sync issues

Workflows:
- Feature branch workflow
- Pull request best practices
- Code review process

Provide commands with explanations.`,
        temperature: 0.4,
        maxTokens: 2000,
        icon: 'git-branch',
        model: 'gpt-4',
        keywords: ['git', 'commit', 'branch', 'merge']
    }
];
/**
 * Main extension activation
 */
async function activate(context) {
    console.log('FLOYD Custom Agents is now active!');
    // Get configuration
    const config = vscode.workspace.getConfiguration('floyd.customAgents');
    // Check if enabled
    if (!config.get('enabled', true)) {
        console.log('FLOYD Custom Agents is disabled');
        return;
    }
    // Initialize storage
    const storage = new AgentStorage(context, config);
    await storage.initialize();
    // Initialize tree view data provider
    const agentDataProvider = new AgentDataProvider(storage);
    // Create tree view for agents
    let treeView;
    try {
        treeView = vscode.window.createTreeView('floydAgents', {
            treeDataProvider: agentDataProvider,
            showCollapseAll: true
        });
    }
    catch (error) {
        console.error('Failed to create tree view:', error);
        // Continue without tree view if it fails
    }
    function refreshAgentList() {
        agentDataProvider.refresh();
    }
    // Note: Chat participant integration requires VS Code 1.90+
    // For older versions, agents are managed through commands only
    // Create new agent command
    const newAgentCommand = vscode.commands.registerCommand('floyd.customAgents.new', async () => {
        const agent = await createAgentWizard(storage);
        if (agent) {
            await storage.saveAgent(agent);
            vscode.window.showInformationMessage(`Agent "${agent.name}" created successfully!`);
            refreshAgentList();
        }
    });
    // List agents command
    const listAgentsCommand = vscode.commands.registerCommand('floyd.customAgents.list', async () => {
        await showAgentList(storage);
    });
    // Edit agent command
    const editAgentCommand = vscode.commands.registerCommand('floyd.customAgents.edit', async () => {
        const agent = await selectAgent(storage, 'Select an agent to edit');
        if (agent) {
            const updated = await createAgentWizard(storage, agent);
            if (updated) {
                await storage.saveAgent(updated);
                vscode.window.showInformationMessage(`Agent "${updated.name}" updated successfully!`);
            }
        }
    });
    // Delete agent command
    const deleteAgentCommand = vscode.commands.registerCommand('floyd.customAgents.delete', async () => {
        const agent = await selectAgent(storage, 'Select an agent to delete');
        if (agent) {
            const confirmed = await vscode.window.showWarningMessage(`Are you sure you want to delete "${agent.name}"?`, { modal: true }, 'Delete');
            if (confirmed === 'Delete') {
                await storage.deleteAgent(agent.id);
                vscode.window.showInformationMessage(`Agent "${agent.name}" deleted.`);
                refreshAgentList();
            }
        }
    });
    // Import agent command
    const importAgentCommand = vscode.commands.registerCommand('floyd.customAgents.import', async () => {
        const uri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectMany: false,
            filters: { 'JSON Files': ['json'] },
            title: 'Select agent file to import'
        });
        const file = uri?.[0];
        if (file) {
            try {
                const imported = await storage.importAgents(file.fsPath);
                vscode.window.showInformationMessage(`Imported ${imported.length} agent(s).`);
                refreshAgentList();
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to import agents: ${error}`);
            }
        }
    });
    // Export agent command
    const exportAgentCommand = vscode.commands.registerCommand('floyd.customAgents.export', async () => {
        const agent = await selectAgent(storage, 'Select an agent to export');
        if (agent) {
            const uri = await vscode.window.showSaveDialog({
                filters: { 'JSON Files': ['json'] },
                defaultUri: vscode.Uri.file(`${agent.name.replace(/\s+/g, '-')}.json`),
                title: 'Save agent as'
            });
            if (uri) {
                await storage.exportAgents([agent.id], uri.fsPath);
                vscode.window.showInformationMessage(`Agent exported to ${uri.fsPath}`);
            }
        }
    });
    // Create agent from template command
    const createFromTemplateCommand = vscode.commands.registerCommand('floyd.customAgents.createFromTemplate', async () => {
        const templates = AGENT_TEMPLATES.map(t => ({
            label: t.name,
            description: t.description,
            template: t
        }));
        const selected = await vscode.window.showQuickPick(templates, {
            placeHolder: 'Select a template to create from'
        });
        if (selected) {
            const agent = {
                ...selected.template,
                id: storage.generateId(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await storage.saveAgent(agent);
            vscode.window.showInformationMessage(`Agent "${agent.name}" created from template!`);
            refreshAgentList();
        }
    });
    context.subscriptions.push(newAgentCommand, listAgentsCommand, editAgentCommand, deleteAgentCommand, importAgentCommand, exportAgentCommand, createFromTemplateCommand, ...(treeView ? [treeView] : []));
    // Welcome message on first activation
    const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
    if (!hasShownWelcome) {
        vscode.window.showInformationMessage('FLOYD Custom Agents ready! Create your first AI agent or use a template.', 'Create Agent', 'Use Template', 'Learn More').then(selection => {
            if (selection === 'Create Agent') {
                vscode.commands.executeCommand('floyd.customAgents.new');
            }
            else if (selection === 'Use Template') {
                vscode.commands.executeCommand('floyd.customAgents.createFromTemplate');
            }
            context.globalState.update('hasShownWelcome', true);
        });
    }
}
/**
 * Create agent wizard
 */
async function createAgentWizard(storage, existing) {
    const name = await vscode.window.showInputBox({
        prompt: 'Enter agent name',
        value: existing?.name || '',
        placeHolder: 'e.g., Code Reviewer',
        validateInput: (value) => value.trim().length < 3 ? 'Name must be at least 3 characters' : undefined
    });
    if (!name)
        return undefined;
    const description = await vscode.window.showInputBox({
        prompt: 'Enter agent description',
        value: existing?.description || '',
        placeHolder: 'e.g., Reviews code for bugs and security issues',
        validateInput: (value) => value.trim().length < 10 ? 'Description must be at least 10 characters' : undefined
    });
    if (!description)
        return undefined;
    // System prompt input
    const prompt = await vscode.window.showInputBox({
        prompt: 'Enter system prompt',
        value: existing?.systemPrompt || '',
        placeHolder: 'You are a helpful assistant...',
        validateInput: (value) => value.trim().length < 20 ? 'Prompt must be at least 20 characters' : undefined
    });
    if (!prompt || prompt.trim().length === 0) {
        vscode.window.showErrorMessage('System prompt cannot be empty');
        return undefined;
    }
    // Temperature
    const temperatureInput = await vscode.window.showInputBox({
        prompt: 'Temperature (0.0 - 2.0, lower = more focused)',
        value: existing?.temperature?.toString() || '0.7',
        placeHolder: '0.7',
        validateInput: (value) => {
            const num = Number.parseFloat(value);
            return Number.isNaN(num) || num < 0 || num > 2 ? 'Enter a number between 0 and 2' : undefined;
        }
    });
    if (!temperatureInput)
        return undefined;
    // Icon
    const icons = ['robot', 'shield', 'book', 'lightbulb', 'bug', 'beaker', 'zap', 'tools', 'symbol-property'];
    const iconItems = icons.map(i => ({ label: i, description: i }));
    const icon = await vscode.window.showQuickPick(iconItems, {
        placeHolder: 'Select an icon'
    });
    if (!icon)
        return undefined;
    return {
        id: existing?.id || storage.generateId(),
        name: name.trim(),
        description: description.trim(),
        systemPrompt: prompt,
        temperature: Number.parseFloat(temperatureInput),
        maxTokens: existing?.maxTokens || 2000,
        icon: icon.label,
        model: existing?.model || 'gpt-4',
        keywords: existing?.keywords || [],
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now()
    };
}
/**
 * Select agent from list
 */
async function selectAgent(storage, placeHolder) {
    const agents = storage.getAllAgents();
    if (agents.length === 0) {
        vscode.window.showInformationMessage('No agents found. Create one first!');
        return undefined;
    }
    const items = agents.map(agent => ({
        label: agent.name,
        description: agent.description,
        detail: `Temp: ${agent.temperature}, Max Tokens: ${agent.maxTokens}`,
        agent
    }));
    const selected = await vscode.window.showQuickPick(items, {
        placeHolder
    });
    return selected?.agent;
}
/**
 * Show agent list with actions
 */
async function showAgentList(storage) {
    const agents = storage.getAllAgents();
    if (agents.length === 0) {
        vscode.window.showInformationMessage('No agents found. Create one using "FLOYD: Create New Custom Agent"');
        return;
    }
    const items = agents.map(agent => ({
        label: agent.name,
        description: agent.description,
        detail: `Created: ${new Date(agent.createdAt).toLocaleDateString()}`,
        agent
    }));
    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an agent to view details'
    });
    if (selected) {
        const actions = ['Edit', 'Delete', 'Export', 'Copy Prompt'];
        const action = await vscode.window.showQuickPick(actions, {
            placeHolder: `What would you like to do with "${selected.agent.name}"?`
        });
        switch (action) {
            case 'Edit':
                await vscode.commands.executeCommand('floyd.customAgents.edit');
                break;
            case 'Delete':
                await vscode.commands.executeCommand('floyd.customAgents.delete');
                break;
            case 'Export':
                await vscode.commands.executeCommand('floyd.customAgents.export');
                break;
            case 'Copy Prompt':
                await vscode.env.clipboard.writeText(selected.agent.systemPrompt);
                vscode.window.showInformationMessage('System prompt copied to clipboard');
                break;
        }
    }
}
/**
 * Tree Data Provider for Agent List
 */
class AgentDataProvider {
    constructor(storage) {
        this.storage = storage;
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
            // Root level - show categories
            const agents = this.storage.getAllAgents();
            return agents.map(agent => new AgentTreeItem(agent, vscode.TreeItemCollapsibleState.None));
        }
        return [];
    }
}
class AgentTreeItem extends vscode.TreeItem {
    constructor(agent, collapsibleState) {
        super(agent.name, collapsibleState);
        this.agent = agent;
        this.collapsibleState = collapsibleState;
        this.description = agent.description;
        this.tooltip = `Temperature: ${agent.temperature}\nModel: ${agent.model}`;
        this.iconPath = new vscode.ThemeIcon(`$(symbol-${agent.icon || 'robot'})`);
        this.contextValue = 'floydAgent';
        this.command = {
            command: 'floyd.customAgents.edit',
            title: 'Edit Agent',
            arguments: [this.agent]
        };
    }
}
function deactivate() {
    console.log('FLOYD Custom Agents deactivated');
}
//# sourceMappingURL=extension.js.map