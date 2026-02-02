/**
 * Browork Manager - Sub-agent delegation system like Claude Cowork
 * Spawns autonomous agents to work on tasks in parallel
 * Supports both Anthropic and OpenAI
 */
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { BUILTIN_TOOLS } from './mcp-client.js';
const DEFAULT_CONFIG = {
    maxConcurrentAgents: 3,
    maxToolCallsPerAgent: 20,
    agentTimeout: 5 * 60 * 1000,
};
export class BroworkManager {
    tasks = new Map();
    runningCount = 0;
    config = DEFAULT_CONFIG;
    toolExecutor;
    apiKey = '';
    baseURL;
    model = 'claude-sonnet-4-5-20250514';
    provider = 'anthropic';
    onUpdate;
    constructor(toolExecutor) {
        this.toolExecutor = toolExecutor;
    }
    setApiKey(key) { this.apiKey = key; }
    setBaseURL(url) { this.baseURL = url; }
    setModel(model) { this.model = model; }
    setProvider(provider) { this.provider = provider; }
    setConfig(config) { this.config = { ...this.config, ...config }; }
    setUpdateCallback(cb) { this.onUpdate = cb; }
    createTask(name, description) {
        const task = {
            id: uuidv4(),
            name,
            description,
            status: 'pending',
            progress: 0,
            created: Date.now(),
            logs: [],
            toolCalls: [],
        };
        this.tasks.set(task.id, task);
        return task;
    }
    async startTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            throw new Error('Task not found');
        if (task.status !== 'pending')
            throw new Error('Task already started');
        if (this.runningCount >= this.config.maxConcurrentAgents) {
            throw new Error(`Max concurrent agents (${this.config.maxConcurrentAgents}) reached`);
        }
        if (!this.apiKey)
            throw new Error('API key not configured');
        task.status = 'running';
        task.started = Date.now();
        this.runningCount++;
        this.notifyUpdate(task);
        this.runAgent(task).catch(err => {
            task.status = 'failed';
            task.error = err.message;
            this.log(task, 'error', `Agent failed: ${err.message}`);
            this.runningCount--;
            this.notifyUpdate(task);
        });
    }
    cancelTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return false;
        if (task.status === 'running') {
            task.status = 'cancelled';
            task.completed = Date.now();
            this.runningCount--;
            this.log(task, 'info', 'Task cancelled by user');
            this.notifyUpdate(task);
        }
        return true;
    }
    getTasks() {
        return Array.from(this.tasks.values()).sort((a, b) => b.created - a.created);
    }
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    deleteTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return false;
        if (task.status === 'running')
            this.cancelTask(taskId);
        return this.tasks.delete(taskId);
    }
    clearFinished() {
        let cleared = 0;
        for (const [id, task] of this.tasks) {
            if (['completed', 'failed', 'cancelled'].includes(task.status)) {
                this.tasks.delete(id);
                cleared++;
            }
        }
        return cleared;
    }
    log(task, type, message) {
        task.logs.push({ timestamp: Date.now(), type, message });
    }
    notifyUpdate(task) {
        if (this.onUpdate)
            this.onUpdate({ ...task });
    }
    async runAgent(task) {
        const systemPrompt = `You are a Browork agent - an autonomous sub-agent working on a specific task.

Your task: ${task.name}
Description: ${task.description}

STANDARD OPERATIONS PROTOCOL:
1. 🧭 SPATIAL AWARENESS: Use 'project_map' to orient yourself.
2. 🛠️ SURGICAL EDITING: Use 'smart_replace' for code changes.
3. 🌐 BROWSER EXTENSION (MANDATORY): 
   - DO NOT USE standard Chromium/Puppeteer tools.
   - USE THE 'browser_*' TOOLS ONLY. These connect to the Floyd Chrome Extension.
   - Use 'browser_navigate', 'browser_read_page', 'browser_click', etc.
4. 🧠 AUTONOMY: Work step by step to complete the task.
5. 📊 REPORTING: Report progress and provide a clear summary when finished.

You have access to file system tools, command execution, and the Floyd Chrome Extension.`;
        this.log(task, 'info', `Agent started (${this.provider})`);
        task.progress = 10;
        this.notifyUpdate(task);
        try {
            if (this.provider === 'openai' || this.provider === 'glm') {
                await this.runOpenAIAgent(task, systemPrompt);
            }
            else {
                await this.runAnthropicAgent(task, systemPrompt);
            }
            if (task.status === 'running') {
                task.status = 'completed';
                task.progress = 100;
                task.completed = Date.now();
                task.result = 'Task completed (max turns reached)';
                this.log(task, 'info', 'Task completed (reached turn limit)');
            }
        }
        catch (err) {
            task.status = 'failed';
            task.error = err.message;
            task.completed = Date.now();
            this.log(task, 'error', `Error: ${err.message}`);
        }
        finally {
            this.runningCount--;
            this.notifyUpdate(task);
        }
    }
    async runAnthropicAgent(task, systemPrompt) {
        const client = new Anthropic({
            apiKey: this.apiKey,
            baseURL: this.baseURL,
        });
        const tools = BUILTIN_TOOLS.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
        }));
        const messages = [
            { role: 'user', content: `Please complete this task: ${task.description}` }
        ];
        let toolCallCount = 0;
        const maxTurns = 15;
        for (let turn = 0; turn < maxTurns && task.status === 'running'; turn++) {
            if (Date.now() - task.started > this.config.agentTimeout) {
                throw new Error('Agent timeout exceeded');
            }
            const response = await client.messages.create({
                model: this.model,
                max_tokens: 4096,
                system: systemPrompt,
                messages,
                tools,
            });
            let hasToolUse = false;
            const toolResults = [];
            let textContent = '';
            for (const block of response.content) {
                if (block.type === 'text') {
                    textContent += block.text;
                    this.log(task, 'thinking', block.text.slice(0, 200) + (block.text.length > 200 ? '...' : ''));
                }
                else if (block.type === 'tool_use') {
                    hasToolUse = true;
                    toolCallCount++;
                    if (toolCallCount > this.config.maxToolCallsPerAgent)
                        throw new Error('Max tool calls exceeded');
                    this.log(task, 'tool', `Using ${block.name}`);
                    const result = await this.toolExecutor.execute(block.name, block.input);
                    task.toolCalls.push({
                        tool: block.name,
                        args: block.input,
                        result: result.success ? result.result : { error: result.error },
                        timestamp: Date.now(),
                    });
                    toolResults.push({
                        type: 'tool_result',
                        tool_use_id: block.id,
                        content: JSON.stringify(result.success ? result.result : { error: result.error }),
                    });
                    task.progress = Math.min(90, 10 + (toolCallCount / this.config.maxToolCallsPerAgent) * 80);
                    this.notifyUpdate(task);
                }
            }
            messages.push({ role: 'assistant', content: response.content });
            if (hasToolUse && toolResults.length > 0) {
                messages.push({ role: 'user', content: toolResults });
            }
            if (response.stop_reason === 'end_turn' && !hasToolUse) {
                task.result = textContent;
                task.status = 'completed';
                task.progress = 100;
                task.completed = Date.now();
                this.log(task, 'info', 'Task completed successfully');
                break;
            }
        }
    }
    async runOpenAIAgent(task, systemPrompt) {
        const client = new OpenAI({
            apiKey: this.apiKey,
            baseURL: this.provider === 'glm' ? 'https://open.bigmodel.cn/api/paas/v4' : undefined,
        });
        const tools = BUILTIN_TOOLS.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema,
            },
        }));
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Please complete this task: ${task.description}` }
        ];
        let toolCallCount = 0;
        const maxTurns = 15;
        for (let turn = 0; turn < maxTurns && task.status === 'running'; turn++) {
            if (Date.now() - task.started > this.config.agentTimeout) {
                throw new Error('Agent timeout exceeded');
            }
            const response = await client.chat.completions.create({
                model: this.model,
                max_tokens: 4096,
                messages,
                tools,
            });
            const choice = response.choices[0];
            const assistantMessage = choice.message;
            let textContent = assistantMessage.content || '';
            if (textContent) {
                this.log(task, 'thinking', textContent.slice(0, 200) + (textContent.length > 200 ? '...' : ''));
            }
            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                messages.push(assistantMessage);
                for (const toolCall of assistantMessage.tool_calls) {
                    toolCallCount++;
                    if (toolCallCount > this.config.maxToolCallsPerAgent)
                        throw new Error('Max tool calls exceeded');
                    // Type narrowing: only function-type calls have the .function property
                    if (toolCall.type !== 'function')
                        continue;
                    const toolName = toolCall.function.name;
                    const toolArgs = JSON.parse(toolCall.function.arguments);
                    this.log(task, 'tool', `Using ${toolName}`);
                    const result = await this.toolExecutor.execute(toolName, toolArgs);
                    task.toolCalls.push({
                        tool: toolName,
                        args: toolArgs,
                        result: result.success ? result.result : { error: result.error },
                        timestamp: Date.now(),
                    });
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(result.success ? result.result : { error: result.error }),
                    });
                    task.progress = Math.min(90, 10 + (toolCallCount / this.config.maxToolCallsPerAgent) * 80);
                    this.notifyUpdate(task);
                }
            }
            else {
                task.result = textContent;
                task.status = 'completed';
                task.progress = 100;
                task.completed = Date.now();
                this.log(task, 'info', 'Task completed successfully');
                break;
            }
            if (choice.finish_reason === 'stop') {
                task.result = textContent;
                task.status = 'completed';
                task.progress = 100;
                task.completed = Date.now();
                this.log(task, 'info', 'Task completed successfully');
                break;
            }
        }
    }
}
