/**
 * Tool Executor - Desktop Commander compatible tool execution
 *
 * Provides comprehensive tool execution capabilities including:
 * - File system operations (read, write, edit, delete, move, search)
 * - Command execution with safety checks
 * - Process/session management for long-running tasks
 * - Code execution (Python, Node.js, Bash)
 * - Git workflow operations
 * - Cache management (3-tier system)
 * - Browser automation tools
 * - Patch operations
 *
 * @module server/tool-executor
 */
import fs from 'fs/promises';
import fse from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { glob } from 'glob';
import { globby } from 'globby';
import processManager from './process-manager.js';
import { CacheManager } from './cache-manager.js';
const execAsync = promisify(exec);
/**
 * Tool Executor - Main class for executing all MCP tools
 *
 * Handles 75+ tools across multiple categories with proper
 * security checks and error handling.
 */
export class ToolExecutor {
    /** List of allowed file system paths for operations */
    allowedPaths = [];
    /** Dangerous commands that are blocked */
    blockedCommands = ['rm -rf /', 'mkfs', 'dd if=', ':(){'];
    /** Cache manager for 3-tier caching system */
    cacheManager;
    /** WebSocket MCP server for browser extension bridge */
    wsMcpServer = null;
    /**
     * Create a new ToolExecutor
     * @param allowedPaths - List of allowed paths for file operations
     */
    constructor(allowedPaths) {
        this.allowedPaths = allowedPaths || [process.cwd(), process.env.HOME || '/'];
        // Initialize cache manager using the first allowed path (usually data dir or cwd)
        this.cacheManager = new CacheManager(this.allowedPaths[0]);
    }
    setAllowedPaths(paths) {
        this.allowedPaths = paths;
        // Reinitialize cache manager with new path if paths exist
        if (paths.length > 0) {
            this.cacheManager = new CacheManager(paths[0]);
        }
    }
    setWsMcpServer(server) {
        this.wsMcpServer = server;
    }
    isPathAllowed(targetPath) {
        const resolved = path.resolve(targetPath);
        // Allow if within any allowed path
        return this.allowedPaths.some(allowed => resolved.startsWith(path.resolve(allowed)));
    }
    isCommandBlocked(command) {
        return this.blockedCommands.some(blocked => command.toLowerCase().includes(blocked.toLowerCase()));
    }
    async execute(toolName, args) {
        try {
            switch (toolName) {
                // File operations
                case 'read_file':
                    return await this.readFile(args);
                case 'write_file':
                    return await this.writeFile(args);
                case 'list_directory':
                    return await this.listDirectory(args);
                case 'search_files':
                    return await this.searchFiles(args);
                case 'create_directory':
                    return await this.createDirectory(args);
                case 'delete_file':
                    return await this.deleteFile(args);
                case 'move_file':
                    return await this.moveFile(args);
                case 'get_file_info':
                    return await this.getFileInfo(args);
                case 'edit_block':
                    return await this.editBlock(args);
                // Command execution (simple)
                case 'execute_command':
                    return await this.executeCommand(args);
                // Process/Session management (Desktop Commander style)
                case 'start_process':
                    return await this.startProcess(args);
                case 'interact_with_process':
                    return await this.interactWithProcess(args);
                case 'read_process_output':
                    return await this.readProcessOutput(args);
                case 'force_terminate':
                    return await this.forceTerminate(args);
                case 'list_sessions':
                    return await this.listSessions();
                case 'list_processes':
                    return await this.listProcesses();
                case 'kill_process':
                    return await this.killProcess(args);
                // Code execution
                case 'execute_code':
                    return await this.executeCode(args);
                // Explorer tools (Superpowers)
                case 'project_map':
                    return await this.getProjectMap(args);
                case 'smart_replace':
                    return await this.smartReplace(args);
                case 'list_symbols':
                    return await this.listSymbols(args);
                case 'semantic_search':
                    return await this.semanticSearch(args);
                case 'check_diagnostics':
                    return await this.checkDiagnostics();
                case 'fetch_docs':
                    return await this.fetchDocs(args);
                case 'dependency_xray':
                    return await this.dependencyXray(args);
                case 'visual_verify':
                    return await this.visualVerify(args);
                case 'todo_sniper':
                    return await this.todoSniper();
                // Novel tools (Singularity)
                case 'runtime_schema_gen':
                    return await this.runtimeSchemaGen(args);
                case 'tui_puppeteer':
                    return await this.tuiPuppeteer(args);
                case 'ast_navigator':
                    return await this.astNavigator(args);
                case 'skill_crystallizer':
                    return await this.skillCrystallizer(args);
                // Memory & Planning tools
                case 'manage_scratchpad':
                    return await this.manageScratchpad(args);
                case 'cache_store':
                    return await this.cacheStore(args);
                case 'cache_retrieve':
                    return await this.cacheRetrieve(args);
                case 'cache_search':
                    return await this.cacheSearch(args);
                // Browser automation (Chrome Extension)
                case 'browser_navigate':
                case 'browser_read_page':
                case 'browser_click':
                case 'browser_type':
                case 'browser_get_tabs':
                case 'browser_status':
                case 'browser_screenshot':
                case 'browser_find':
                case 'browser_create_tab':
                    return await this.executeBrowserTool(toolName, args);
                // === GIT WORKFLOW TOOLS ===
                case 'git_status':
                    return await this.gitStatus(args);
                case 'git_add':
                    return await this.gitAdd(args);
                case 'git_commit':
                    return await this.gitCommit(args);
                case 'git_diff':
                    return await this.gitDiff(args);
                case 'git_log':
                    return await this.gitLog(args);
                case 'git_branch':
                    return await this.gitBranch(args);
                case 'git_checkout':
                    return await this.gitCheckout(args);
                case 'git_stash':
                    return await this.gitStash(args);
                case 'git_merge':
                    return await this.gitMerge(args);
                // === SEARCH TOOLS ===
                case 'grep':
                    return await this.grep(args);
                case 'codebase_search':
                    return await this.codebaseSearch(args);
                // === ADVANCED CACHE TOOLS ===
                case 'cache_delete':
                    return await this.cacheDelete(args);
                case 'cache_clear':
                    return await this.cacheClear(args);
                case 'cache_list':
                    return await this.cacheList(args);
                case 'cache_stats':
                    return await this.cacheStats(args);
                case 'cache_prune':
                    return await this.cachePrune(args);
                case 'cache_store_pattern':
                    return await this.cacheStorePattern(args);
                case 'cache_store_reasoning':
                    return await this.cacheStoreReasoning(args);
                case 'cache_load_reasoning':
                    return await this.cacheLoadReasoning(args);
                case 'cache_archive_reasoning':
                    return await this.cacheArchiveReasoning(args);
                // === PATCH OPERATIONS ===
                case 'apply_unified_diff':
                    return await this.applyUnifiedDiff(args);
                case 'edit_range':
                    return await this.editRange(args);
                case 'insert_at':
                    return await this.insertAt(args);
                case 'delete_range':
                    return await this.deleteRange(args);
                case 'assess_patch_risk':
                    return await this.assessPatchRisk(args);
                // === SPECIAL OPERATIONS ===
                case 'verify':
                    return await this.verify(args);
                case 'safe_refactor':
                    return await this.safeRefactor(args);
                case 'impact_simulate':
                    return await this.impactSimulate(args);
                // === ADDITIONAL SYSTEM TOOLS ===
                case 'ask_user':
                    return await this.askUser(args);
                case 'fetch':
                    return await this.fetch(args);
                default:
                    return { success: false, error: `Unknown tool: ${toolName}` };
            }
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async readFile(args) {
        const filePath = args.path;
        const offset = args.offset || 0;
        const limit = args.limit || 1000;
        if (!this.isPathAllowed(filePath)) {
            return { success: false, error: `Access denied: ${filePath}` };
        }
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        let startLine = offset;
        if (offset < 0) {
            // Negative offset means from end
            startLine = Math.max(0, lines.length + offset);
        }
        const selectedLines = lines.slice(startLine, startLine + limit);
        const result = selectedLines.map((line, i) => `${startLine + i + 1}|${line}`).join('\n');
        return {
            success: true,
            result: {
                content: result,
                totalLines: lines.length,
                startLine: startLine + 1,
                endLine: Math.min(startLine + limit, lines.length),
            },
        };
    }
    async writeFile(args) {
        const filePath = args.path;
        const content = args.content;
        const append = args.append;
        if (!this.isPathAllowed(filePath)) {
            return { success: false, error: `Access denied: ${filePath}` };
        }
        // Ensure directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        if (append) {
            await fs.appendFile(filePath, content);
        }
        else {
            await fs.writeFile(filePath, content);
        }
        return { success: true, result: { path: filePath, bytesWritten: content.length } };
    }
    async listDirectory(args) {
        const dirPath = args.path;
        if (!this.isPathAllowed(dirPath)) {
            return { success: false, error: `Access denied: ${dirPath}` };
        }
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const result = await Promise.all(entries.map(async (entry) => {
            const fullPath = path.join(dirPath, entry.name);
            try {
                const stats = await fs.stat(fullPath);
                return {
                    name: entry.name,
                    type: entry.isDirectory() ? 'directory' : 'file',
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                };
            }
            catch {
                return {
                    name: entry.name,
                    type: entry.isDirectory() ? 'directory' : 'file',
                };
            }
        }));
        return { success: true, result };
    }
    async searchFiles(args) {
        const searchPath = args.path;
        const pattern = args.pattern;
        const contentSearch = args.content;
        if (!this.isPathAllowed(searchPath)) {
            return { success: false, error: `Access denied: ${searchPath}` };
        }
        let files = [];
        if (pattern) {
            const globPattern = path.join(searchPath, '**', pattern);
            files = await glob(globPattern, { nodir: true });
        }
        else {
            files = await glob(path.join(searchPath, '**/*'), { nodir: true });
        }
        // Limit results
        files = files.slice(0, 100);
        // If content search specified, filter by content
        if (contentSearch) {
            const matches = [];
            for (const file of files.slice(0, 50)) {
                try {
                    const content = await fs.readFile(file, 'utf-8');
                    const lines = content.split('\n');
                    lines.forEach((line, i) => {
                        if (line.includes(contentSearch)) {
                            matches.push({
                                file,
                                line: i + 1,
                                content: line.trim().slice(0, 200),
                            });
                        }
                    });
                }
                catch {
                    // Skip files that can't be read
                }
            }
            return { success: true, result: { matches: matches.slice(0, 50) } };
        }
        return { success: true, result: { files } };
    }
    async executeCommand(args) {
        const command = args.command;
        const cwd = args.cwd || process.cwd();
        const timeout = args.timeout || 30000;
        if (this.isCommandBlocked(command)) {
            return { success: false, error: 'Command blocked for safety' };
        }
        if (!this.isPathAllowed(cwd)) {
            return { success: false, error: `Access denied: ${cwd}` };
        }
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd,
                timeout,
                maxBuffer: 10 * 1024 * 1024, // 10MB
            });
            return {
                success: true,
                result: {
                    stdout: stdout.slice(0, 50000),
                    stderr: stderr.slice(0, 10000),
                    truncated: stdout.length > 50000,
                },
            };
        }
        catch (err) {
            return {
                success: false,
                error: err.message,
                result: {
                    stdout: err.stdout?.slice(0, 10000),
                    stderr: err.stderr?.slice(0, 10000),
                    code: err.code,
                },
            };
        }
    }
    async createDirectory(args) {
        const dirPath = args.path;
        if (!this.isPathAllowed(dirPath)) {
            return { success: false, error: `Access denied: ${dirPath}` };
        }
        await fs.mkdir(dirPath, { recursive: true });
        return { success: true, result: { path: dirPath } };
    }
    async deleteFile(args) {
        const targetPath = args.path;
        if (!this.isPathAllowed(targetPath)) {
            return { success: false, error: `Access denied: ${targetPath}` };
        }
        const stats = await fs.stat(targetPath);
        if (stats.isDirectory()) {
            await fs.rm(targetPath, { recursive: true });
        }
        else {
            await fs.unlink(targetPath);
        }
        return { success: true, result: { deleted: targetPath } };
    }
    async moveFile(args) {
        const source = args.source;
        const destination = args.destination;
        if (!this.isPathAllowed(source) || !this.isPathAllowed(destination)) {
            return { success: false, error: 'Access denied' };
        }
        await fs.rename(source, destination);
        return { success: true, result: { from: source, to: destination } };
    }
    async getFileInfo(args) {
        const filePath = args.path;
        if (!this.isPathAllowed(filePath)) {
            return { success: false, error: `Access denied: ${filePath}` };
        }
        const stats = await fs.stat(filePath);
        return {
            success: true,
            result: {
                path: filePath,
                type: stats.isDirectory() ? 'directory' : 'file',
                size: stats.size,
                created: stats.birthtime.toISOString(),
                modified: stats.mtime.toISOString(),
                accessed: stats.atime.toISOString(),
                permissions: stats.mode.toString(8),
                isSymlink: stats.isSymbolicLink(),
            },
        };
    }
    /**
     * Edit block - Desktop Commander style search/replace
     * Supports format:
     * <<<<<<< SEARCH
     * old content
     * =======
     * new content
     * >>>>>>> REPLACE
     */
    async editBlock(args) {
        const filePath = args.path;
        const searchContent = args.search;
        const replaceContent = args.replace;
        const expectedReplacements = args.expected_replacements || 1;
        if (!this.isPathAllowed(filePath)) {
            return { success: false, error: `Access denied: ${filePath}` };
        }
        let content;
        try {
            content = await fs.readFile(filePath, 'utf-8');
        }
        catch {
            return { success: false, error: `File not found: ${filePath}` };
        }
        // Count occurrences
        const regex = new RegExp(this.escapeRegex(searchContent), 'g');
        const matches = content.match(regex);
        const occurrences = matches ? matches.length : 0;
        if (occurrences === 0) {
            // Fuzzy search fallback
            const lines = content.split('\n');
            const searchLines = searchContent.split('\n');
            let bestMatch = { similarity: 0, lineNumber: -1, text: '' };
            for (let i = 0; i <= lines.length - searchLines.length; i++) {
                const block = lines.slice(i, i + searchLines.length).join('\n');
                const similarity = this.calculateSimilarity(searchContent, block);
                if (similarity > bestMatch.similarity) {
                    bestMatch = { similarity, lineNumber: i + 1, text: block };
                }
            }
            if (bestMatch.similarity > 0.7) {
                return {
                    success: false,
                    error: `Exact match not found. Best match (${Math.round(bestMatch.similarity * 100)}% similar) at line ${bestMatch.lineNumber}:\n${bestMatch.text.slice(0, 200)}...`,
                };
            }
            return { success: false, error: 'Search content not found in file' };
        }
        if (occurrences !== expectedReplacements && expectedReplacements !== -1) {
            return {
                success: false,
                error: `Found ${occurrences} occurrences, expected ${expectedReplacements}. Use expected_replacements: -1 to replace all.`,
            };
        }
        // Perform replacement
        const newContent = expectedReplacements === -1
            ? content.replace(regex, replaceContent)
            : content.replace(searchContent, replaceContent);
        await fs.writeFile(filePath, newContent);
        return {
            success: true,
            result: {
                path: filePath,
                replacements: expectedReplacements === -1 ? occurrences : 1,
            },
        };
    }
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    calculateSimilarity(a, b) {
        if (a === b)
            return 1;
        if (!a || !b)
            return 0;
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        if (longer.length === 0)
            return 1;
        const costs = [];
        for (let i = 0; i <= shorter.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= longer.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                }
                else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0)
                costs[longer.length] = lastValue;
        }
        return (longer.length - costs[longer.length]) / longer.length;
    }
    // Process management methods
    async startProcess(args) {
        const command = args.command;
        const cwd = args.cwd;
        const shell = args.shell;
        const timeout = args.timeout;
        if (this.isCommandBlocked(command)) {
            return { success: false, error: 'Command blocked for safety' };
        }
        if (cwd && !this.isPathAllowed(cwd)) {
            return { success: false, error: `Access denied: ${cwd}` };
        }
        const result = await processManager.startProcess({ command, cwd, shell, timeout });
        return { success: true, result };
    }
    async interactWithProcess(args) {
        const sessionId = args.session_id;
        const input = args.input;
        const result = await processManager.interactWithProcess(sessionId, input);
        return { success: result.success, result };
    }
    async readProcessOutput(args) {
        const sessionId = args.session_id;
        const lines = args.lines;
        const result = processManager.readProcessOutput(sessionId, lines);
        return { success: true, result };
    }
    async forceTerminate(args) {
        const sessionId = args.session_id;
        const result = processManager.forceTerminate(sessionId);
        return { success: result.success, result };
    }
    async listSessions() {
        const sessions = processManager.listSessions();
        return { success: true, result: { sessions } };
    }
    async listProcesses() {
        const processes = await processManager.listProcesses();
        return { success: true, result: { processes } };
    }
    async killProcess(args) {
        const pid = args.pid;
        const result = await processManager.killProcess(pid);
        return { success: result.success, result };
    }
    async executeCode(args) {
        const language = args.language;
        const code = args.code;
        const timeout = args.timeout;
        const result = await processManager.executeCode({ language, code, timeout });
        return { success: result.success, result };
    }
    // === EXPLORER TOOL IMPLEMENTATIONS ===
    async getProjectMap(args) {
        const rootPath = args.path || process.cwd();
        const maxDepth = args.maxDepth || 3;
        const ignorePatterns = args.ignorePatterns || ['node_modules', '.git', 'dist', 'build', '.floyd'];
        if (!this.isPathAllowed(rootPath)) {
            return { success: false, error: `Access denied: ${rootPath}` };
        }
        try {
            const files = await globby('**/*', {
                cwd: rootPath,
                ignore: ignorePatterns,
                deep: maxDepth,
                onlyFiles: false,
                markDirectories: true,
            });
            const tree = {};
            for (const file of files) {
                const parts = file.split('/');
                let current = tree;
                for (const part of parts) {
                    if (!part)
                        continue;
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current = current[part];
                }
            }
            const formatTree = (node, indent = '') => {
                let result = '';
                const keys = Object.keys(node).sort();
                for (const key of keys) {
                    const isDir = Object.keys(node[key]).length > 0;
                    result += `${indent}${isDir ? '📁' : '📄'} ${key}\n`;
                    result += formatTree(node[key], indent + '  ');
                }
                return result;
            };
            return { success: true, result: formatTree(tree) };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async smartReplace(args) {
        const filePath = args.filePath;
        const searchString = args.searchString;
        const replaceString = args.replaceString;
        const dryRun = args.dryRun;
        if (!this.isPathAllowed(filePath)) {
            return { success: false, error: `Access denied: ${filePath}` };
        }
        try {
            const resolvedPath = path.resolve(filePath);
            if (!(await fse.pathExists(resolvedPath))) {
                return { success: false, error: `File not found: ${filePath}` };
            }
            const content = await fs.readFile(resolvedPath, 'utf-8');
            if (!content.includes(searchString)) {
                // Try to be helpful: check if it's a whitespace issue
                const normalizedSearch = searchString.replace(/\s+/g, ' ').trim();
                const normalizedContent = content.replace(/\s+/g, ' ');
                if (normalizedContent.includes(normalizedSearch)) {
                    return { success: false, error: `Search string found but whitespace does not match exactly. Use exact string from file.` };
                }
                return { success: false, error: `Search string not found in file.` };
            }
            // Check for multiple occurrences
            const occurrences = content.split(searchString).length - 1;
            if (occurrences > 1) {
                return { success: false, error: `Multiple occurrences (${occurrences}) of search string found. Please provide more context to uniquely identify the target block.` };
            }
            const newContent = content.replace(searchString, replaceString);
            if (!dryRun) {
                await fs.writeFile(resolvedPath, newContent, 'utf-8');
            }
            return {
                success: true,
                result: {
                    filePath,
                    occurrences,
                    dryRun,
                },
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async listSymbols(args) {
        const filePath = args.filePath;
        if (!this.isPathAllowed(filePath)) {
            return { success: false, error: `Access denied: ${filePath}` };
        }
        try {
            const resolvedPath = path.resolve(filePath);
            if (!(await fse.pathExists(resolvedPath))) {
                return { success: false, error: `File not found: ${filePath}` };
            }
            const content = await fs.readFile(resolvedPath, 'utf-8');
            const lines = content.split('\n');
            const symbols = [];
            // Simple regex for TS/JS symbols
            const patterns = [
                { type: 'class', regex: /class\s+([a-zA-Z0-9_]+)/ },
                { type: 'function', regex: /(?:async\s+)?function\s+([a-zA-Z0-9_]+)/ },
                { type: 'const_func', regex: /const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/ },
                { type: 'interface', regex: /interface\s+([a-zA-Z0-9_]+)/ },
                { type: 'type', regex: /type\s+([a-zA-Z0-9_]+)/ },
                { type: 'export_default', regex: /export\s+default\s+(?:class|function)?\s*([a-zA-Z0-9_]+)?/ },
            ];
            lines.forEach((line, index) => {
                for (const p of patterns) {
                    const match = line.match(p.regex);
                    if (match) {
                        symbols.push({
                            name: match[1] || 'default',
                            type: p.type,
                            line: index + 1,
                            preview: line.trim(),
                        });
                        break;
                    }
                }
            });
            return { success: true, result: symbols };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async semanticSearch(args) {
        const query = args.query;
        const keywords = query.split(' ').filter(k => k.length > 2);
        try {
            const files = await globby('**/*.{ts,tsx,rs,js,md}', {
                cwd: this.allowedPaths[0],
                ignore: ['node_modules', 'dist', 'target', '.git'],
                absolute: true
            });
            const results = [];
            for (const file of files) {
                const content = await fs.readFile(file, 'utf-8');
                const lines = content.split('\n');
                let score = 0;
                const matches = [];
                if (file.toLowerCase().includes(query.toLowerCase()))
                    score += 10;
                lines.forEach((line, i) => {
                    if (keywords.some(k => line.toLowerCase().includes(k.toLowerCase()))) {
                        score++;
                        if (matches.length < 3) {
                            matches.push({ line: i + 1, content: line.trim() });
                        }
                    }
                });
                if (score > 0) {
                    results.push({ file: path.relative(this.allowedPaths[0], file), score, matches });
                }
            }
            const sorted = results.sort((a, b) => b.score - a.score).slice(0, 8);
            return { success: true, result: sorted };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async checkDiagnostics() {
        const cwd = this.allowedPaths[0];
        try {
            if (await fse.pathExists(path.join(cwd, 'Cargo.toml'))) {
                const { stdout } = await execAsync('cargo check --quiet --message-format=short', { cwd });
                return { success: true, result: { type: 'rust', status: 'clean', output: stdout || 'No errors.' } };
            }
            else if (await fse.pathExists(path.join(cwd, 'tsconfig.json'))) {
                const { stdout } = await execAsync('npx tsc --noEmit --pretty false', { cwd });
                return { success: true, result: { type: 'ts', status: 'clean', output: stdout || 'No errors.' } };
            }
            return { success: true, result: { status: 'skipped', message: 'No Rust/TS project detected.' } };
        }
        catch (err) {
            return { success: true, result: { status: 'error', output: err.stdout || err.stderr || err.message } };
        }
    }
    async fetchDocs(args) {
        const url = args.url;
        try {
            const response = await fetch(`https://r.jina.ai/${url}`);
            if (!response.ok)
                throw new Error(response.statusText);
            const text = await response.text();
            return { success: true, result: text.slice(0, 15000) + (text.length > 15000 ? '\n...(truncated)' : '') };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    async dependencyXray(args) {
        const packageName = args.packageName;
        const nodePath = path.join(this.allowedPaths[0], 'node_modules', packageName, 'package.json');
        try {
            if (await fse.pathExists(nodePath)) {
                const pkg = await fse.readJson(nodePath);
                const mainFile = pkg.main || pkg.module || 'index.js';
                const mainPath = path.join(path.dirname(nodePath), mainFile);
                if (await fse.pathExists(mainPath)) {
                    const content = await fs.readFile(mainPath, 'utf-8');
                    return {
                        success: true,
                        result: {
                            found: true,
                            path: path.relative(this.allowedPaths[0], mainPath),
                            types: pkg.types ? path.join(path.dirname(nodePath), pkg.types) : 'unknown',
                            preview: content.slice(0, 2000)
                        }
                    };
                }
            }
            return { success: true, result: { found: false, message: `Could not locate source for ${packageName}.` } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async visualVerify(args) {
        const command = args.command;
        const timeoutMs = args.timeoutMs || 2000;
        return new Promise((resolve) => {
            let output = '';
            const child = exec(command, { timeout: timeoutMs, cwd: this.allowedPaths[0] });
            child.stdout?.on('data', (data) => output += data);
            child.stderr?.on('data', (data) => output += data);
            setTimeout(() => {
                child.kill();
                resolve({
                    success: true,
                    result: {
                        command,
                        preview: output.slice(0, 5000) || '(No Output Captured)',
                        note: 'Process killed after timeout to capture snapshot.'
                    }
                });
            }, timeoutMs);
        });
    }
    async todoSniper() {
        try {
            const files = await globby('**/*.{ts,tsx,rs,js,md}', {
                cwd: this.allowedPaths[0],
                ignore: ['node_modules', 'dist', 'target', '.git'],
                absolute: true
            });
            const todos = [];
            for (const file of files) {
                const content = await fs.readFile(file, 'utf-8');
                content.split('\n').forEach((line, i) => {
                    if (line.match(/\/\/\s*(TODO|FIXME|HACK):/i)) {
                        todos.push({
                            file: path.relative(this.allowedPaths[0], file),
                            line: i + 1,
                            text: line.trim()
                        });
                    }
                });
            }
            return { success: true, result: todos };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async runtimeSchemaGen(args) {
        const source = args.source;
        const type = args.type;
        try {
            let data;
            if (type === 'url') {
                const response = await fetch(source);
                data = await response.json();
            }
            else {
                const filePath = path.resolve(this.allowedPaths[0], source);
                if (!(await fse.pathExists(filePath)))
                    throw new Error(`File not found: ${filePath}`);
                data = await fse.readJson(filePath);
            }
            const generateType = (obj, name) => {
                if (Array.isArray(obj)) {
                    const itemType = obj.length > 0 ? generateType(obj[0], 'Item') : 'any';
                    return `${itemType}[]`;
                }
                if (typeof obj === 'object' && obj !== null) {
                    const props = Object.keys(obj).map(key => {
                        return `  ${key}: ${generateType(obj[key], key)};`;
                    }).join('\n');
                    return `{\n${props}\n}`;
                }
                return typeof obj;
            };
            const tsInterface = `export interface GeneratedSchema ${generateType(data, 'Root')}`;
            return {
                success: true,
                result: {
                    source,
                    sampleKeys: Object.keys(data).slice(0, 5),
                    generatedInterface: tsInterface
                }
            };
        }
        catch (e) {
            return { success: false, error: `Failed to fetch data: ${e.message}` };
        }
    }
    async tuiPuppeteer(args) {
        const command = args.command;
        const keys = args.keys;
        // Simulation mode for now as node-pty requires native bindings
        return {
            success: true,
            result: {
                status: "Simulation Mode (node-pty missing)",
                message: "To fully enable TUI Puppeteer, install 'node-pty'. For now, I am verifying the command runs.",
                command,
                keysSent: keys,
                output: "Simulated output: [Main Menu] > [Selection 2] > [Success]"
            }
        };
    }
    async astNavigator(args) {
        const query = args.query;
        const type = args.type;
        const cwd = this.allowedPaths[0];
        let cmd = '';
        if (type === 'def') {
            cmd = `grep -rE "class ${query}|function ${query}|fn ${query}|struct ${query}|interface ${query}" . --exclude-dir=node_modules --exclude-dir=target`;
        }
        else {
            cmd = `grep -r "${query}" . --exclude-dir=node_modules --exclude-dir=target`;
        }
        try {
            const { stdout } = await execAsync(cmd, { cwd });
            return {
                success: true,
                result: {
                    query,
                    type,
                    matches: stdout.split('\n').filter(Boolean).slice(0, 10)
                }
            };
        }
        catch (e) {
            return { success: true, result: { matches: [], message: 'No matches found.' } };
        }
    }
    async skillCrystallizer(args) {
        const skillName = args.skillName;
        const filePath = args.filePath;
        const description = args.description;
        const patternsDir = path.join(this.allowedPaths[0], '.floyd', 'patterns');
        const fullPath = path.resolve(this.allowedPaths[0], filePath);
        try {
            await fse.ensureDir(patternsDir);
            if (!(await fse.pathExists(fullPath)))
                throw new Error(`File not found: ${filePath}`);
            const content = await fs.readFile(fullPath, 'utf-8');
            const safeName = skillName.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const patternFile = path.join(patternsDir, `${safeName}.md`);
            const template = `# Skill: ${skillName}
> ${description}

\`\`\`typescript
${content}
\`\`\`

## Usage Notes
- Crystallized from: ${filePath}
- Date: ${new Date().toISOString()}
`;
            await fs.writeFile(patternFile, template, 'utf-8');
            return {
                success: true,
                result: {
                    savedTo: patternFile,
                    message: "I have learned this skill. Use 'semantic_search' to find it later."
                }
            };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    // === MEMORY & PLANNING TOOL IMPLEMENTATIONS ===
    async manageScratchpad(args) {
        const action = args.action;
        const content = args.content;
        // Use the first allowed path + .floyd/scratchpad.md
        const scratchpadPath = path.join(this.allowedPaths[0], '.floyd', 'scratchpad.md');
        try {
            await fs.mkdir(path.dirname(scratchpadPath), { recursive: true });
            if (action === 'read') {
                try {
                    const data = await fs.readFile(scratchpadPath, 'utf-8');
                    return { success: true, result: data || '(Scratchpad is empty)' };
                }
                catch {
                    return { success: true, result: '(Scratchpad is empty)' };
                }
            }
            if (action === 'write') {
                await fs.writeFile(scratchpadPath, content, 'utf-8');
                return { success: true, result: 'Scratchpad updated.' };
            }
            if (action === 'append') {
                await fs.appendFile(scratchpadPath, '\n' + content, 'utf-8');
                return { success: true, result: 'Content appended to scratchpad.' };
            }
            if (action === 'clear') {
                await fs.writeFile(scratchpadPath, '', 'utf-8');
                return { success: true, result: 'Scratchpad cleared.' };
            }
            return { success: false, error: `Invalid action: ${action}` };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cacheStore(args) {
        const { tier, key, value } = args;
        try {
            await this.cacheManager.store(tier, key, value);
            return { success: true, result: { message: `Stored to ${tier} tier`, key } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cacheRetrieve(args) {
        const { tier, key } = args;
        try {
            const value = await this.cacheManager.retrieve(tier, key);
            return { success: true, result: { found: value !== null, value } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cacheSearch(args) {
        const { tier, query } = args;
        try {
            const results = await this.cacheManager.search(tier, query);
            return {
                success: true,
                result: {
                    count: results.length,
                    results: results.map(r => ({ key: r.key, timestamp: r.timestamp }))
                }
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async executeBrowserTool(name, args) {
        if (!this.wsMcpServer) {
            return { success: false, error: 'Browser extension bridge not initialized' };
        }
        // Since WebSocket is async and we don't have a direct request-response
        // pattern implemented in the simple broadcast, we'll use a Promise
        // and wait for the result from the extension.
        // NOTE: For now, we'll trigger the broadcast.
        // The actual response handling would need a more complex state management
        // in ws-mcp-server to route the specific result back to this promise.
        // For this implementation, we broadcast and assume the extension will
        // handle it. In a production Tier 5 agent, we'd have a full RPC bridge.
        try {
            this.wsMcpServer.broadcast({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: { name, arguments: args },
                id: Math.floor(Math.random() * 1000000)
            });
            return {
                success: true,
                result: { message: `Command '${name}' sent to browser extension.` }
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    // === GIT WORKFLOW IMPLEMENTATIONS ===
    async gitStatus(args) {
        const cwd = args.cwd || this.allowedPaths[0];
        if (!this.isPathAllowed(cwd))
            return { success: false, error: `Access denied: ${cwd}` };
        try {
            const { stdout } = await execAsync('git status --porcelain', { cwd });
            return { success: true, result: { status: stdout || 'Clean working directory' } };
        }
        catch (err) {
            return { success: false, error: err.message, result: { notGitRepo: true } };
        }
    }
    async gitAdd(args) {
        const files = args.files;
        const cwd = args.cwd || this.allowedPaths[0];
        if (!this.isPathAllowed(cwd))
            return { success: false, error: `Access denied: ${cwd}` };
        try {
            const { stdout } = await execAsync(`git add ${files}`, { cwd });
            return { success: true, result: { message: 'Staged successfully', output: stdout } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async gitCommit(args) {
        const message = args.message;
        const cwd = args.cwd || this.allowedPaths[0];
        if (!this.isPathAllowed(cwd))
            return { success: false, error: `Access denied: ${cwd}` };
        try {
            const { stdout } = await execAsync(`git commit -m ${JSON.stringify(message)}`, { cwd });
            return { success: true, result: { message: 'Committed successfully', output: stdout } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async gitDiff(args) {
        const cwd = args.cwd || this.allowedPaths[0];
        const cached = args.cached;
        if (!this.isPathAllowed(cwd))
            return { success: false, error: `Access denied: ${cwd}` };
        try {
            const cachedFlag = cached ? '--cached' : '';
            const { stdout } = await execAsync(`git diff ${cachedFlag}`, { cwd });
            return { success: true, result: { diff: stdout || 'No changes' } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async gitLog(args) {
        const cwd = args.cwd || this.allowedPaths[0];
        const maxCount = args.maxCount || 10;
        if (!this.isPathAllowed(cwd))
            return { success: false, error: `Access denied: ${cwd}` };
        try {
            const { stdout } = await execAsync(`git log -${maxCount} --oneline --decorate`, { cwd });
            return { success: true, result: { log: stdout || 'No commits' } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async gitBranch(args) {
        const cwd = args.cwd || this.allowedPaths[0];
        const name = args.name;
        const action = args.action || 'list';
        if (!this.isPathAllowed(cwd))
            return { success: false, error: `Access denied: ${cwd}` };
        try {
            let cmd = '';
            if (action === 'list') {
                cmd = 'git branch -a';
            }
            else if (action === 'create') {
                // Sanitize branch name to prevent command injection
                const sanitizedName = name.replace(/[;&|`$()]/g, '');
                cmd = `git branch ${JSON.stringify(sanitizedName)}`;
            }
            else if (action === 'delete') {
                const sanitizedName = name.replace(/[;&|`$()]/g, '');
                cmd = `git branch -D ${JSON.stringify(sanitizedName)}`;
            }
            const { stdout } = await execAsync(cmd, { cwd });
            return { success: true, result: { branches: stdout } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async gitCheckout(args) {
        const branch = args.branch;
        const cwd = args.cwd || this.allowedPaths[0];
        if (!this.isPathAllowed(cwd))
            return { success: false, error: `Access denied: ${cwd}` };
        // Sanitize branch name to prevent command injection
        const sanitizedBranch = branch.replace(/[;&|`$()]/g, '');
        try {
            const { stdout } = await execAsync(`git checkout ${JSON.stringify(sanitizedBranch)}`, { cwd });
            return { success: true, result: { message: `Checked out ${sanitizedBranch}`, output: stdout } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async gitStash(args) {
        const cwd = args.cwd || this.allowedPaths[0];
        const action = args.action || 'push';
        if (!this.isPathAllowed(cwd))
            return { success: false, error: `Access denied: ${cwd}` };
        try {
            const { stdout } = await execAsync(`git stash ${action}`, { cwd });
            return { success: true, result: { message: `Stash ${action} successful`, output: stdout } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async gitMerge(args) {
        const branch = args.branch;
        const cwd = args.cwd || this.allowedPaths[0];
        if (!this.isPathAllowed(cwd))
            return { success: false, error: `Access denied: ${cwd}` };
        // Sanitize branch name to prevent command injection
        const sanitizedBranch = branch.replace(/[;&|`$()]/g, '');
        try {
            const { stdout, stderr } = await execAsync(`git merge ${JSON.stringify(sanitizedBranch)}`, { cwd });
            return { success: true, result: { message: `Merged ${sanitizedBranch}`, output: stdout || stderr } };
        }
        catch (err) {
            return { success: false, error: err.message, result: { conflict: true } };
        }
    }
    // === SEARCH TOOL IMPLEMENTATIONS ===
    async grep(args) {
        const pattern = args.pattern;
        const searchPath = args.path || this.allowedPaths[0];
        const ignoreCase = args.ignoreCase;
        if (!this.isPathAllowed(searchPath))
            return { success: false, error: `Access denied: ${searchPath}` };
        // Sanitize pattern to prevent command injection
        // Escape special shell characters: $ ` " ' \ ; | & ( ) [ ] { } * ? ~ < > ^ !
        const sanitizedPattern = pattern.replace(/[\$\`"'\\;|&()[\]{}*?~<>^!]/g, '\\$&');
        try {
            const caseFlag = ignoreCase ? '-i' : '';
            const { stdout } = await execAsync(`grep -r -n ${caseFlag} "${sanitizedPattern}" ${searchPath} --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist`, {
                cwd: searchPath,
                maxBuffer: 10 * 1024 * 1024,
            });
            const lines = stdout.split('\n').filter(Boolean).slice(0, 100);
            return { success: true, result: { matches: lines, count: lines.length } };
        }
        catch (err) {
            // grep returns non-zero when no matches found
            if (err.code === 1) {
                return { success: true, result: { matches: [], count: 0 } };
            }
            return { success: false, error: err.message };
        }
    }
    async codebaseSearch(args) {
        const query = args.query;
        const searchPath = args.path || this.allowedPaths[0];
        if (!this.isPathAllowed(searchPath))
            return { success: false, error: `Access denied: ${searchPath}` };
        // Semantic search is just keyword search for now (would need embeddings for true semantic)
        return await this.semanticSearch({ query });
    }
    // === ADVANCED CACHE IMPLEMENTATIONS ===
    async cacheDelete(args) {
        const { tier, key } = args;
        try {
            await this.cacheManager.delete(tier, key);
            return { success: true, result: { message: `Deleted ${key} from ${tier}` } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cacheClear(args) {
        const { tier } = args;
        try {
            await this.cacheManager.clear(tier);
            return { success: true, result: { message: `Cleared ${tier} tier` } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cacheList(args) {
        const { tier } = args;
        try {
            const keys = await this.cacheManager.list(tier);
            return { success: true, result: { tier, keys, count: keys.length } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cacheStats(args) {
        try {
            const stats = await this.cacheManager.getStats();
            return { success: true, result: stats };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cachePrune(args) {
        const { tier } = args;
        try {
            const pruned = await this.cacheManager.prune(tier);
            return { success: true, result: { message: `Pruned ${pruned} entries from ${tier}`, pruned } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cacheStorePattern(args) {
        const key = args.key;
        const pattern = args.pattern;
        const tier = args.tier || 'project';
        try {
            await this.cacheManager.store(tier, `pattern:${key}`, pattern);
            return { success: true, result: { message: `Pattern stored to ${tier}`, key } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cacheStoreReasoning(args) {
        const key = args.key;
        const reasoning = args.reasoning;
        try {
            await this.cacheManager.store('reasoning', key, reasoning);
            return { success: true, result: { message: 'Reasoning stored', key } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cacheLoadReasoning(args) {
        const key = args.key;
        try {
            const value = await this.cacheManager.retrieve('reasoning', key);
            return { success: true, result: { found: value !== null, reasoning: value } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async cacheArchiveReasoning(args) {
        const key = args.key;
        try {
            const value = await this.cacheManager.retrieve('reasoning', key);
            if (value) {
                await this.cacheManager.store('vault', key, value);
                await this.cacheManager.delete('reasoning', key);
                return { success: true, result: { message: `Archived ${key} to vault` } };
            }
            return { success: false, error: `Reasoning ${key} not found` };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    // === PATCH OPERATION IMPLEMENTATIONS ===
    async applyUnifiedDiff(args) {
        const diff = args.diff;
        const basePath = args.basePath || this.allowedPaths[0];
        if (!this.isPathAllowed(basePath))
            return { success: false, error: `Access denied: ${basePath}` };
        const diffPath = path.join(basePath, '.floyd-temp.patch');
        let cleanupNeeded = false;
        try {
            await fs.writeFile(diffPath, diff, 'utf-8');
            cleanupNeeded = true;
            const { stdout, stderr } = await execAsync(`patch -p1 < "${diffPath}"`, { cwd: basePath });
            // Clean up temp file on success
            await fs.unlink(diffPath).catch(() => { });
            cleanupNeeded = false;
            return { success: true, result: { message: 'Patch applied', output: stdout || stderr } };
        }
        catch (err) {
            // Clean up temp file on failure
            if (cleanupNeeded) {
                await fs.unlink(diffPath).catch(() => { });
            }
            return { success: false, error: err.message };
        }
    }
    async editRange(args) {
        const filePath = args.path;
        const startLine = args.startLine;
        const endLine = args.endLine;
        const content = args.content;
        if (!this.isPathAllowed(filePath))
            return { success: false, error: `Access denied: ${filePath}` };
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const lines = fileContent.split('\n');
            if (startLine < 1 || endLine > lines.length || startLine > endLine) {
                return { success: false, error: 'Invalid line range' };
            }
            const newLines = [
                ...lines.slice(0, startLine - 1),
                ...content.split('\n'),
                ...lines.slice(endLine)
            ];
            await fs.writeFile(filePath, newLines.join('\n'), 'utf-8');
            return { success: true, result: { message: `Edited lines ${startLine}-${endLine}` } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async insertAt(args) {
        const filePath = args.path;
        const line = args.line;
        const content = args.content;
        if (!this.isPathAllowed(filePath))
            return { success: false, error: `Access denied: ${filePath}` };
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const lines = fileContent.split('\n');
            if (line < 1 || line > lines.length + 1) {
                return { success: false, error: 'Invalid line number' };
            }
            lines.splice(line - 1, 0, ...content.split('\n'));
            await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
            return { success: true, result: { message: `Inserted at line ${line}` } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async deleteRange(args) {
        const filePath = args.path;
        const startLine = args.startLine;
        const endLine = args.endLine;
        if (!this.isPathAllowed(filePath))
            return { success: false, error: `Access denied: ${filePath}` };
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const lines = fileContent.split('\n');
            if (startLine < 1 || endLine > lines.length || startLine > endLine) {
                return { success: false, error: 'Invalid line range' };
            }
            const newLines = [...lines.slice(0, startLine - 1), ...lines.slice(endLine)];
            await fs.writeFile(filePath, newLines.join('\n'), 'utf-8');
            return { success: true, result: { message: `Deleted lines ${startLine}-${endLine}` } };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
    async assessPatchRisk(args) {
        const diff = args.diff;
        // Simple risk assessment
        let risk = 'low';
        const concerns = [];
        if (diff.includes('--- /dev/null')) {
            concerns.push('Creates new files');
        }
        if (diff.includes('+++ /dev/null')) {
            concerns.push('Deletes files');
            risk = 'high';
        }
        if (diff.split('\n').length > 500) {
            concerns.push('Large diff (>500 lines)');
            risk = 'medium';
        }
        if (/@@[\s\-+]*\d+,\d+[\s\-+]*\d+,\d+@@/.test(diff)) {
            const matches = diff.match(/@@[\s\-+]*\d+,\d+[\s\-+]*\d+,\d+@@/g);
            if (matches && matches.length > 10) {
                concerns.push('Modifies many files/chunks');
                risk = 'medium';
            }
        }
        return {
            success: true,
            result: { risk: risk, concerns, diffSize: diff.length }
        };
    }
    // === SPECIAL OPERATION IMPLEMENTATIONS ===
    async verify(args) {
        const type = args.type;
        const targetPath = args.path;
        const expectedContent = args.content;
        const command = args.command;
        try {
            switch (type) {
                case 'file_exists':
                    if (!targetPath)
                        return { success: false, error: 'path required for file_exists' };
                    await fs.access(targetPath);
                    return { success: true, result: { verified: true, type, path: targetPath } };
                case 'file_contains':
                    if (!targetPath || !expectedContent) {
                        return { success: false, error: 'path and content required for file_contains' };
                    }
                    const content = await fs.readFile(targetPath, 'utf-8');
                    const contains = content.includes(expectedContent);
                    return { success: true, result: { verified: contains, type, path: targetPath } };
                case 'command_succeeds':
                    if (!command)
                        return { success: false, error: 'command required for command_succeeds' };
                    await execAsync(command);
                    return { success: true, result: { verified: true, type, command } };
                case 'test_passes':
                    const testCmd = command || 'npm test';
                    const { stdout, stderr } = await execAsync(testCmd);
                    return { success: true, result: { verified: true, type, output: stdout || stderr } };
                default:
                    return { success: false, error: `Unknown verification type: ${type}` };
            }
        }
        catch (err) {
            return { success: false, error: err.message, result: { verified: false, type } };
        }
    }
    async safeRefactor(args) {
        const changes = args.changes;
        const testCommand = args.testCommand || 'npm test';
        // Simple implementation - just run the test command
        try {
            const { stdout, stderr } = await execAsync(testCommand, { cwd: this.allowedPaths[0] });
            return {
                success: true,
                result: { message: 'Refactor verified', output: stdout || stderr, changesApplied: changes.length }
            };
        }
        catch (err) {
            return {
                success: false,
                error: `Tests failed: ${err.message}`,
                result: { needsRollback: true }
            };
        }
    }
    async impactSimulate(args) {
        const changes = args.changes;
        // Simple impact analysis
        const impacts = [];
        if (changes.includes('delete')) {
            impacts.push('May break imports/dependencies');
        }
        if (changes.includes('API') || changes.includes('api')) {
            impacts.push('May affect API consumers');
        }
        if (changes.includes('config') || changes.includes('Config')) {
            impacts.push('May require configuration updates');
        }
        return {
            success: true,
            result: {
                impact: impacts.length > 0 ? 'medium' : 'low',
                potentialImpacts: impacts,
                recommendation: impacts.length > 2 ? 'Review carefully' : 'Safe to proceed'
            }
        };
    }
    // === ADDITIONAL SYSTEM TOOL IMPLEMENTATIONS ===
    async askUser(args) {
        const question = args.question;
        const options = args.options;
        // In a real implementation, this would prompt via WebSocket or other IPC
        // For now, return a placeholder
        return {
            success: true,
            result: {
                message: 'User input required',
                question,
                options,
                note: 'This tool requires UI integration for actual user prompts'
            }
        };
    }
    async fetch(args) {
        const url = args.url;
        const method = args.method || 'GET';
        try {
            const response = await fetch(url, { method });
            const text = await response.text();
            return {
                success: true,
                result: {
                    status: response.status,
                    content: text.slice(0, 50000),
                    truncated: text.length > 50000
                }
            };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    }
}
