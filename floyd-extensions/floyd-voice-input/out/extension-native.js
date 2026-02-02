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
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
/**
 * Voice service using native Python helper
 */
class NativeVoiceService {
    constructor(extensionPath, language, statusBar) {
        this.extensionPath = extensionPath;
        this.language = language;
        this.pythonPath = 'python3';
        this.helperPath = path.join(extensionPath, 'voice_helper.py');
        this.statusBar = statusBar;
    }
    /**
     * Check microphone permission - triggers macOS permission dialog
     */
    async checkPermission() {
        return new Promise((resolve) => {
            const process = (0, child_process_1.spawn)(this.pythonPath, [this.helperPath, 'check_permission']);
            let output = '';
            process.stdout.on('data', (data) => {
                output += data.toString();
            });
            process.on('close', (code) => {
                try {
                    const result = JSON.parse(output.trim());
                    if (result.status === 'permission_granted') {
                        vscode.window.showInformationMessage('✓ Microphone access granted!');
                        resolve(true);
                    }
                    else if (result.status === 'permission_denied') {
                        vscode.window.showErrorMessage('Microphone access denied. Go to System Settings > Privacy & Security > Microphone and enable VS Code.', 'Open System Settings').then(selection => {
                            if (selection === 'Open System Settings') {
                                vscode.env.openExternal(vscode.Uri.parse('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone'));
                            }
                        });
                        resolve(false);
                    }
                    else {
                        vscode.window.showErrorMessage(`Error checking permission: ${result.error}`);
                        resolve(false);
                    }
                }
                catch (e) {
                    vscode.window.showErrorMessage('Failed to parse permission check result');
                    resolve(false);
                }
            });
        });
    }
    /**
     * Record and transcribe audio
     */
    async recordAndTranscribe(duration = 5) {
        this.statusBar.update('listening');
        return new Promise((resolve) => {
            const process = (0, child_process_1.spawn)(this.pythonPath, [
                this.helperPath,
                'record',
                duration.toString(),
                this.language
            ]);
            let output = '';
            let lastStatus = '';
            process.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                for (const line of lines) {
                    if (!line.trim())
                        continue;
                    try {
                        const result = JSON.parse(line);
                        output += line + '\n';
                        if (result.status === 'recording' && lastStatus !== 'recording') {
                            vscode.window.showInformationMessage('🎤 Recording... Speak now!');
                            lastStatus = 'recording';
                        }
                        else if (result.status === 'recorded' && lastStatus !== 'recorded') {
                            this.statusBar.update('processing');
                            vscode.window.showInformationMessage('Processing audio...');
                            lastStatus = 'recorded';
                        }
                        else if (result.status === 'transcribed') {
                            this.statusBar.update('idle');
                            resolve(result.text);
                            return;
                        }
                        else if (result.status === 'no_speech') {
                            this.statusBar.update('error');
                            vscode.window.showWarningMessage('No speech detected. Please try again.');
                            resolve(null);
                            return;
                        }
                        else if (result.status === 'error') {
                            this.statusBar.update('error');
                            vscode.window.showErrorMessage(`Voice input error: ${result.error}`);
                            resolve(null);
                            return;
                        }
                    }
                    catch (e) {
                        console.error('Failed to parse output:', line);
                    }
                }
            });
            process.stderr.on('data', (data) => {
                console.error('Voice helper error:', data.toString());
            });
            process.on('close', (code) => {
                this.statusBar.update('idle');
                if (code !== 0) {
                    vscode.window.showErrorMessage('Voice input process failed');
                    resolve(null);
                }
            });
        });
    }
    /**
     * Check if dependencies are installed
     */
    async checkDependencies() {
        return new Promise((resolve) => {
            const process = (0, child_process_1.spawn)(this.pythonPath, ['-c', 'import pyaudio, speech_recognition']);
            process.on('close', (code) => {
                resolve(code === 0);
            });
        });
    }
    /**
     * Install dependencies
     */
    async installDependencies() {
        const install = await vscode.window.showInformationMessage('FLOYD Voice Input requires Python packages (PyAudio, SpeechRecognition). Install now?', 'Install', 'Cancel');
        if (install !== 'Install') {
            return false;
        }
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Installing voice input dependencies...',
            cancellable: false
        }, async (progress) => {
            return new Promise((resolve) => {
                const process = (0, child_process_1.spawn)(this.pythonPath, [
                    '-m', 'pip', 'install', 'pyaudio', 'SpeechRecognition'
                ]);
                process.stdout.on('data', (data) => {
                    console.log(data.toString());
                });
                process.on('close', (code) => {
                    if (code === 0) {
                        vscode.window.showInformationMessage('✓ Voice input dependencies installed successfully!');
                        resolve(true);
                    }
                    else {
                        vscode.window.showErrorMessage('Failed to install dependencies. Please run: pip3 install pyaudio SpeechRecognition');
                        resolve(false);
                    }
                });
            });
        });
    }
}
/**
 * Status bar item for voice input
 */
class VoiceStatusBar {
    constructor() {
        this.item = vscode.window.createStatusBarItem('floyd.voiceInput.status', vscode.StatusBarAlignment.Right, 100);
        this.item.command = 'floyd.voiceInput.toggle';
        this.item.tooltip = 'Toggle Voice Input (macOS microphone permission required)';
        this.update('idle');
    }
    update(status) {
        switch (status) {
            case 'idle':
                this.item.text = '$(mic) Voice Input';
                this.item.backgroundColor = undefined;
                break;
            case 'listening':
                this.item.text = '$(pulse) Recording...';
                this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                break;
            case 'processing':
                this.item.text = '$(loading~spin) Processing...';
                this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.inProgressForeground');
                break;
            case 'error':
                this.item.text = '$(error) Voice Error';
                this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                break;
        }
        this.item.show();
    }
    dispose() {
        this.item.dispose();
    }
}
/**
 * Main extension activation
 */
async function activate(context) {
    console.log('FLOYD Voice Input (Native) is now active!');
    // Get configuration
    const config = vscode.workspace.getConfiguration('floyd.voiceInput');
    const language = config.get('language', 'en-US');
    // Create status bar item
    const statusBar = new VoiceStatusBar();
    context.subscriptions.push(statusBar);
    // Create voice service
    const voiceService = new NativeVoiceService(context.extensionPath, language, statusBar);
    // Check dependencies on activation
    const hasDeps = await voiceService.checkDependencies();
    if (!hasDeps) {
        vscode.window.showWarningMessage('FLOYD Voice Input requires Python packages. Click to install.', 'Install Now', 'Later').then(async (selection) => {
            if (selection === 'Install Now') {
                await voiceService.installDependencies();
            }
        });
    }
    // Check microphone permission command
    const checkPermissionCommand = vscode.commands.registerCommand('floyd.voiceInput.checkPermission', async () => {
        await voiceService.checkPermission();
    });
    // Toggle voice input command
    const toggleCommand = vscode.commands.registerCommand('floyd.voiceInput.toggle', async () => {
        // Check dependencies first
        const hasDeps = await voiceService.checkDependencies();
        if (!hasDeps) {
            const installed = await voiceService.installDependencies();
            if (!installed)
                return;
        }
        // Record audio (5 seconds)
        const text = await voiceService.recordAndTranscribe(5);
        if (text) {
            // Insert text into active editor
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await editor.edit(editBuilder => {
                    const position = editor.selection?.start || editor.document.positionAt(0);
                    editBuilder.insert(position, text + ' ');
                });
                vscode.window.showInformationMessage('✓ Voice text inserted!');
            }
            else {
                await vscode.env.clipboard.writeText(text);
                vscode.window.showInformationMessage('✓ Voice text copied to clipboard (no active editor)');
            }
        }
    });
    context.subscriptions.push(checkPermissionCommand, toggleCommand);
    // Show first-time setup message
    const hasShownSetup = context.globalState.get('hasShownSetup', false);
    if (!hasShownSetup) {
        vscode.window.showInformationMessage('FLOYD Voice Input ready! Press Cmd+Shift+V to start. First use will request microphone permission.', 'Got it', 'Test Now').then(async (selection) => {
            if (selection === 'Test Now') {
                await vscode.commands.executeCommand('floyd.voiceInput.checkPermission');
            }
            context.globalState.update('hasShownSetup', true);
        });
    }
}
function deactivate() {
    console.log('FLOYD Voice Input deactivated');
}
//# sourceMappingURL=extension-native.js.map