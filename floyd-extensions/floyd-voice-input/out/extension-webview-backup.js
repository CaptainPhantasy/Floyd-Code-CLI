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
/**
 * Voice input panel using Web Speech API
 */
class VoiceInputPanel {
    constructor(extensionUri, language, continuous, showInterim) {
        this.extensionUri = extensionUri;
        this.language = language;
        this.continuous = continuous;
        this.showInterim = showInterim;
        this.status = 'idle';
        this.disposables = [];
    }
    /**
     * Show or create the voice input panel
     */
    show(onText) {
        this.onTextCallback = onText;
        if (this.panel) {
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel('floydVoiceInput', 'Voice Input', { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'assets')],
            retainContextWhenHidden: true
        });
        this.panel.webview.html = this.getWebviewContent();
        // Handle messages from webview
        this.panel.onDidDispose(() => {
            this.panel = undefined;
            this.dispose();
        });
        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'text':
                    if (this.onTextCallback && message.text) {
                        this.onTextCallback(message.text);
                    }
                    break;
                case 'status':
                    this.status = message.status;
                    this.updateStatusBar();
                    break;
                case 'error':
                    vscode.window.showErrorMessage(`Voice Input: ${message.error}`);
                    break;
            }
        }, null, this.disposables);
    }
    /**
     * Start listening
     */
    start() {
        this.panel?.webview.postMessage({ command: 'start' });
    }
    /**
     * Stop listening
     */
    stop() {
        this.panel?.webview.postMessage({ command: 'stop' });
    }
    /**
     * Get the HTML content for the webview
     */
    getWebviewContent() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voice Input</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      font-weight: var(--vscode-font-weight);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }

    .mic-container {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 40px 0;
    }

    .mic-button {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      font-size: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .mic-button:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
      transform: scale(1.05);
    }

    .mic-button.listening {
      background-color: #e51400;
      color: white;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229, 20, 0, 0.7); }
      50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(229, 20, 0, 0); }
    }

    .status {
      font-size: 18px;
      margin-bottom: 20px;
      color: var(--vscode-descriptionForeground);
    }

    .transcript {
      width: 100%;
      min-height: 150px;
      padding: 15px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      line-height: 1.6;
      resize: none;
      box-sizing: border-box;
    }

    .transcript.interim {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }

    .transcript.final {
      color: var(--vscode-editor-foreground);
      font-style: normal;
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: var(--vscode-font-family);
      font-size: 14px;
    }

    .btn-primary {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-primary:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn-secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .info {
      margin-top: 30px;
      padding: 15px;
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 4px solid var(--vscode-textBlockQuote-border);
      border-radius: 4px;
      font-size: 14px;
    }

    .unsupported {
      text-align: center;
      padding: 40px;
      color: var(--vscode-errorForeground);
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="status" id="status">Click the microphone to start speaking</div>

    <div class="mic-container">
      <button class="mic-button" id="micButton" title="Click to start/stop recording">
        🎤
      </button>
    </div>

    <div id="transcript" class="transcript" placeholder="Your speech will appear here..."></div>

    <div class="actions">
      <button class="btn btn-primary" id="insertBtn" disabled>Insert Text</button>
      <button class="btn btn-secondary" id="clearBtn">Clear</button>
      <button class="btn btn-secondary" id="copyBtn">Copy</button>
    </div>

    <div class="info">
      <strong>Tips:</strong><br>
      • Click the microphone button to request microphone access<br>
      • A system permission dialog will appear - click <strong>Allow</strong><br>
      • Press <kbd>Space</kbd> to toggle recording while focused<br>
      • Speak clearly for best results<br>
      • Language: ${this.language}
    </div>
  </div>

  <div id="unsupported" class="unsupported" style="display: none;">
    <p>⚠️ Speech recognition is not supported in this browser.</p>
    <p>Voice input requires Chrome, Edge, or a browser that supports the Web Speech API.</p>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const micButton = document.getElementById('micButton');
    const statusEl = document.getElementById('status');
    const transcriptEl = document.getElementById('transcript');
    const insertBtn = document.getElementById('insertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');

    let recognition = null;
    let isListening = false;
    let finalTranscript = '';
    let interimTranscript = '';

    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      document.getElementById('app').style.display = 'none';
      document.getElementById('unsupported').style.display = 'block';
    } else {
      // Request microphone permission on load
      async function requestMicrophonePermission() {
        try {
          console.log('Requesting microphone permission...');
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop the stream immediately - we just needed to trigger the permission dialog
          stream.getTracks().forEach(track => track.stop());
          console.log('Microphone permission granted');
          statusEl.textContent = 'Microphone access granted. Click the microphone to start.';
          statusEl.style.color = 'var(--vscode-foreground)';
        } catch (error) {
          console.error('Microphone permission error:', error);
          // Don't block UI on permission error - user can still try
          console.warn('Microphone access not yet granted');
        }
      }

      // Request permission when the page loads (with a slight delay to ensure DOM is ready)
      setTimeout(requestMicrophonePermission, 500);

      recognition = new SpeechRecognition();
      recognition.continuous = ${this.continuous};
      recognition.interimResults = ${this.showInterim};
      recognition.lang = '${this.language}';

      recognition.onstart = () => {
        isListening = true;
        micButton.classList.add('listening');
        statusEl.textContent = 'Listening...';
        vscode.postMessage({ type: 'status', status: 'listening' });
      };

      recognition.onend = () => {
        isListening = false;
        micButton.classList.remove('listening');
        if (finalTranscript) {
          statusEl.textContent = 'Recording stopped. Ready to insert.';
          insertBtn.disabled = false;
        } else {
          statusEl.textContent = 'Click the microphone to start speaking';
        }
        vscode.postMessage({ type: 'status', status: 'idle' });
      };

      recognition.onresult = (event) => {
        interimTranscript = '';
        finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        transcriptEl.innerHTML = finalTranscript + '<span class="interim">' + interimTranscript + '</span>';

        if (finalTranscript) {
          insertBtn.disabled = false;
          vscode.postMessage({ type: 'text', text: finalTranscript, isFinal: true });
        } else if (interimTranscript) {
          vscode.postMessage({ type: 'text', text: interimTranscript, isFinal: false });
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMsg = 'An error occurred';
        switch (event.error) {
          case 'no-speech':
            errorMsg = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMsg = 'No microphone found. Please check your microphone.';
            break;
          case 'not-allowed':
            errorMsg = 'Microphone permission denied. Please allow microphone access.';
            break;
        }
        statusEl.textContent = errorMsg;
        vscode.postMessage({ type: 'error', error: errorMsg });
        isListening = false;
        micButton.classList.remove('listening');
      };
    }

    // Event listeners
    micButton.addEventListener('click', toggleRecording);

    insertBtn.addEventListener('click', () => {
      const text = finalTranscript || transcriptEl.textContent;
      if (text) {
        vscode.postMessage({ type: 'insert', text: text });
        transcriptEl.textContent = '';
        finalTranscript = '';
        interimTranscript = '';
        insertBtn.disabled = true;
        statusEl.textContent = 'Text inserted! Ready for new recording.';
      }
    });

    clearBtn.addEventListener('click', () => {
      transcriptEl.textContent = '';
      finalTranscript = '';
      interimTranscript = '';
      insertBtn.disabled = true;
      statusEl.textContent = 'Cleared. Click the microphone to start speaking.';
    });

    copyBtn.addEventListener('click', () => {
      const text = finalTranscript || transcriptEl.textContent;
      if (text) {
        navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy', 2000);
      }
    });

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        toggleRecording();
      }
    });

    function toggleRecording() {
      if (!recognition) return;

      if (isListening) {
        try {
          recognition.stop();
        } catch (e) {
          console.error('Failed to stop recognition:', e);
        }
      } else {
        // Ensure microphone permission is requested before starting
        console.log('Requesting microphone access before recording...');
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            // Keep the stream active for recognition
            console.log('Microphone access granted, starting recognition...');
            stream.getTracks().forEach(track => {
              // Don't stop - let the speech recognition use it
            });
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to start recognition:', e);
              statusEl.textContent = 'Error: Could not start recording. Try again.';
            }
          })
          .catch((error) => {
            console.error('Microphone permission denied:', error);
            statusEl.textContent = '❌ Microphone access required. Please check your browser permissions and try again.';
            statusEl.style.color = 'var(--vscode-errorForeground)';
            vscode.postMessage({ 
              type: 'error', 
              error: 'Microphone access denied. Enable microphone permissions in your browser settings and try again.' 
            });
          });
      }
    }

    // Listen for messages from extension
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'start' && !isListening) {
        recognition?.start();
      } else if (message.command === 'stop' && isListening) {
        recognition?.stop();
      }
    });
  </script>
</body>
</html>`;
    }
    /**
     * Update status bar based on current status
     */
    updateStatusBar() {
        // Could update a status bar item here
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
/**
 * Status bar item for voice input
 */
class VoiceStatusBar {
    constructor() {
        this.item = vscode.window.createStatusBarItem('floyd.voiceInput.status', vscode.StatusBarAlignment.Right, 100);
        this.item.command = 'floyd.voiceInput.toggle';
        this.item.tooltip = 'Toggle Voice Input';
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
function activate(context) {
    console.log('FLOYD Voice Input is now active!');
    // Get configuration
    const config = vscode.workspace.getConfiguration('floyd.voiceInput');
    const language = config.get('language', 'en-US');
    const continuous = config.get('continuous', false);
    const showInterim = config.get('showInterimResults', true);
    // Create status bar item
    const statusBar = new VoiceStatusBar();
    context.subscriptions.push(statusBar);
    // Create voice input panel
    let voicePanel;
    // Toggle voice input command
    const toggleCommand = vscode.commands.registerCommand('floyd.voiceInput.toggle', () => {
        if (!voicePanel) {
            voicePanel = new VoiceInputPanel(context.extensionUri, language, continuous, showInterim);
        }
        voicePanel.show((text) => {
            // Insert text into active editor
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.edit(editBuilder => {
                    editor.selection
                        ? editBuilder.insert(editor.selection.start, text)
                        : editBuilder.insert(editor.document.positionAt(0), text);
                });
            }
            else {
                vscode.env.clipboard.writeText(text);
                vscode.window.showInformationMessage('Voice text copied to clipboard (no active editor)');
            }
        });
        voicePanel.start();
    });
    // Insert voice input command (starts recording and inserts when done)
    const insertCommand = vscode.commands.registerCommand('floyd.voiceInput.insert', async () => {
        if (!voicePanel) {
            voicePanel = new VoiceInputPanel(context.extensionUri, language, continuous, showInterim);
        }
        const text = await new Promise((resolve) => {
            voicePanel.show((text) => {
                resolve(text);
            });
            voicePanel.start();
        });
        // Insert text
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await editor.edit(editBuilder => {
                const position = editor.selection?.start || editor.document.positionAt(0);
                editBuilder.insert(position, text);
            });
        }
    });
    context.subscriptions.push(toggleCommand, insertCommand);
    // Watch for configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('floyd.voiceInput')) {
            const newConfig = vscode.workspace.getConfiguration('floyd.voiceInput');
            // Recreate panel with new settings
            voicePanel = undefined;
        }
    }));
    // Show notification on first activation
    vscode.window.showInformationMessage('FLOYD Voice Input ready! Press Cmd+Shift+V to start voice input.', 'OK');
}
function deactivate() {
    console.log('FLOYD Voice Input deactivated');
}
//# sourceMappingURL=extension-webview-backup.js.map