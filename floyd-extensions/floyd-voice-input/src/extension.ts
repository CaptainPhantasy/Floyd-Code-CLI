import * as vscode from 'vscode';
import { spawn } from 'node:child_process';
import * as path from 'node:path';

/**
 * Voice recognition status
 */
type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error';

/**
 * Voice service using native Python helper
 */
class NativeVoiceService {
  private readonly pythonPath: string;
  private readonly helperPath: string;
  private readonly statusBar: VoiceStatusBar;

  constructor(
    private readonly extensionPath: string,
    private readonly language: string,
    statusBar: VoiceStatusBar,
    pythonPath: string
  ) {
    this.helperPath = path.join(extensionPath, 'voice_helper.py');
    this.statusBar = statusBar;
    this.pythonPath = pythonPath || 'python3';
  }

  /**
   * Check microphone permission - triggers macOS permission dialog
   */
  async checkPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn(this.pythonPath, [this.helperPath, 'check_permission']);
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        try {
          const result = JSON.parse(output.trim());
          if (result.status === 'permission_granted') {
            vscode.window.showInformationMessage('✓ Microphone access granted!');
            resolve(true);
          } else if (result.status === 'permission_denied') {
            const exe = result.executable || this.pythonPath;
            vscode.window.showErrorMessage(
              `Microphone access denied for ${exe}. Go to System Settings > Privacy & Security > Microphone and enable the Python executable shown.`,
              'Open System Settings'
            ).then(selection => {
              if (selection === 'Open System Settings') {
                vscode.env.openExternal(vscode.Uri.parse('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone'));
              }
            });
            resolve(false);
          } else {
            vscode.window.showErrorMessage(`Error checking permission: ${result.error}`);
            resolve(false);
          }
        } catch (e) {
          const extra = errorOutput ? `\n${errorOutput}` : '';
          console.error('Voice permission parsing failed', e);
          vscode.window.showErrorMessage(`Failed to parse permission check result.${extra}`);
          resolve(false);
        }
      });
    });
  }

  /**
   * Record and transcribe audio
   */
  async recordAndTranscribe(duration: number = 5): Promise<string | null> {
    this.statusBar.update('listening');
    
    return new Promise((resolve) => {
      const process = spawn(this.pythonPath, [
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
          if (!line.trim()) continue;
          
          try {
            const result = JSON.parse(line);
            output += line + '\n';
            
            if (result.status === 'recording' && lastStatus !== 'recording') {
              vscode.window.showInformationMessage('🎤 Recording... Speak now!');
              lastStatus = 'recording';
            } else if (result.status === 'recorded' && lastStatus !== 'recorded') {
              this.statusBar.update('processing');
              vscode.window.showInformationMessage('Processing audio...');
              lastStatus = 'recorded';
            } else if (result.status === 'transcribed') {
              this.statusBar.update('idle');
              resolve(result.text);
              return;
            } else if (result.status === 'no_speech') {
              this.statusBar.update('error');
              vscode.window.showWarningMessage('No speech detected. Please try again.');
              resolve(null);
              return;
            } else if (result.status === 'permission_denied') {
              this.statusBar.update('error');
              const exe = result.executable || this.pythonPath;
              vscode.window.showErrorMessage(
                `Microphone access denied for ${exe}. Go to System Settings > Privacy & Security > Microphone and enable the Python executable shown.`
              );
              resolve(null);
              return;
            } else if (result.status === 'error') {
              this.statusBar.update('error');
              vscode.window.showErrorMessage(`Voice input error: ${result.error}`);
              resolve(null);
              return;
            }
          } catch (e) {
            console.error('Failed to parse output:', line);
            console.error(e);
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
  async checkDependencies(): Promise<boolean> {
    return new Promise((resolve) => {
      const process = spawn(this.pythonPath, ['-c', 'import pyaudio, speech_recognition']);
      
      process.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }

  /**
   * Install dependencies
   */
  async installDependencies(): Promise<boolean> {
    const install = await vscode.window.showInformationMessage(
      'FLOYD Voice Input requires Python packages (PyAudio, SpeechRecognition). Install now?',
      'Install',
      'Cancel'
    );
    
    if (install !== 'Install') {
      return false;
    }
    
    return vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Installing voice input dependencies...',
      cancellable: false
    }, async (progress) => {
      return new Promise((resolve) => {
        const process = spawn(this.pythonPath, [
          '-m', 'pip', 'install', 'pyaudio', 'SpeechRecognition'
        ]);
        
        process.stdout.on('data', (data) => {
          console.log(data.toString());
        });
        
        process.on('close', (code) => {
          if (code === 0) {
            vscode.window.showInformationMessage('✓ Voice input dependencies installed successfully!');
            resolve(true);
          } else {
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
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      'floyd.voiceInput.status',
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.command = 'floyd.voiceInput.toggle';
    this.item.tooltip = 'Toggle Voice Input (macOS microphone permission required)';
    this.update('idle');
  }

  public update(status: VoiceStatus): void {
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

  public dispose(): void {
    this.item.dispose();
  }
}

/**
 * Main extension activation
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('FLOYD Voice Input (Native) is now active!');

  // Get configuration
  const config = vscode.workspace.getConfiguration('floyd.voiceInput');
  const language = config.get<string>('language', 'en-US');
  const pythonPath = config.get<string>('pythonPath', 'python3');

  // Create status bar item
  const statusBar = new VoiceStatusBar();
  context.subscriptions.push(statusBar);

  // Create voice service
  const voiceService = new NativeVoiceService(
    context.extensionPath,
    language,
    statusBar,
    pythonPath
  );

  let lastActiveEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        lastActiveEditor = editor;
      }
    })
  );

  // Check dependencies on activation
  const hasDeps = await voiceService.checkDependencies();
  if (!hasDeps) {
    vscode.window.showWarningMessage(
      'FLOYD Voice Input requires Python packages. Click to install.',
      'Install Now',
      'Later'
    ).then(async (selection) => {
      if (selection === 'Install Now') {
        await voiceService.installDependencies();
      }
    });
  }

  // Check microphone permission command
  const checkPermissionCommand = vscode.commands.registerCommand(
    'floyd.voiceInput.checkPermission',
    async () => {
      await voiceService.checkPermission();
    }
  );

  // Toggle voice input command
  const toggleCommand = vscode.commands.registerCommand(
    'floyd.voiceInput.toggle',
    async () => {
      // Check dependencies first
      const hasDeps = await voiceService.checkDependencies();
      if (!hasDeps) {
        const installed = await voiceService.installDependencies();
        if (!installed) return;
      }

      // Record audio (5 seconds)
      const text = await voiceService.recordAndTranscribe(5);
      
      if (text) {
        const editor = vscode.window.activeTextEditor || lastActiveEditor;
        if (editor) {
          await editor.edit(editBuilder => {
            const position = editor.selection?.start || editor.document.positionAt(0);
            editBuilder.insert(position, text + ' ');
          });
          vscode.window.showInformationMessage('✓ Voice text inserted!');
        } else {
          const doc = await vscode.workspace.openTextDocument({ language: 'plaintext', content: '' });
          const newEditor = await vscode.window.showTextDocument(doc, { preview: false });
          await newEditor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), text + ' ');
          });
          vscode.window.showInformationMessage('✓ Voice text inserted in new document');
        }
      }
    }
  );

  context.subscriptions.push(checkPermissionCommand, toggleCommand);

  // Show first-time setup message
  const hasShownSetup = context.globalState.get<boolean>('hasShownSetup', false);
  if (!hasShownSetup) {
    vscode.window.showInformationMessage(
      'FLOYD Voice Input ready! Press Cmd+Shift+V to start. First use will request microphone permission.',
      'Got it',
      'Test Now'
    ).then(async (selection) => {
      if (selection === 'Test Now') {
        await vscode.commands.executeCommand('floyd.voiceInput.checkPermission');
      }
      context.globalState.update('hasShownSetup', true);
    });
  }
}

export function deactivate() {
  console.log('FLOYD Voice Input deactivated');
}
