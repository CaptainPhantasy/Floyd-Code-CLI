# FLOYD Voice Input

Voice-to-text input for FLOYD CURSE'M IDE using the Web Speech API.

## Features

- **Voice Input Panel** - Dedicated panel for speech-to-text
- **Keyboard Shortcut** - Press `Cmd+Shift+V` (Mac) or `Ctrl+Shift+V` (Windows/Linux) to toggle
- **Multiple Languages** - Supports all languages supported by the Web Speech API
- **Continuous Mode** - Optional continuous listening until manually stopped
- **Interim Results** - See partial results while speaking
- **Insert or Copy** - Insert text directly into editor or copy to clipboard

## Installation

### Development Mode

1. Open this folder in VS Code
2. Press `F5` to launch a new Extension Development Host
3. Test the extension

### Install in FLOYD CURSE'M

1. Run `npm install` to install dependencies
2. Run `npm run compile` to build
3. Press `F5` or install from VSIX:
   ```bash
   vsce package
   code --install-extension floyd-voice-input-1.0.0.vsix
   ```

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `floyd.voiceInput.language` | string | `en-US` | Language for speech recognition |
| `floyd.voiceInput.continuous` | boolean | `false` | Enable continuous listening |
| `floyd.voiceInput.autoSubmit` | boolean | `false` | Auto-submit after speech ends |
| `floyd.voiceInput.showInterimResults` | boolean | `true` | Show partial results while speaking |

## Usage

1. Press `Cmd+Shift+V` to open the Voice Input panel
2. Click the microphone button or press Space to start recording
3. Speak clearly into your microphone
4. Click "Insert Text" to insert into the active editor, or "Copy" to copy to clipboard

## Browser Compatibility

Requires a browser that supports the Web Speech API:
- Chrome/Edge (full support)
- Safari (partial support)
- Firefox (no support - use Chrome/Edge embedded browser)

## License

MIT
