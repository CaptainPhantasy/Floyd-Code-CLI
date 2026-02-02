# FLOYD Voice Input - Native macOS Setup

## How It Works

This extension uses a **native Python process** to access the microphone, which properly triggers the macOS system permission dialog.

## First-Time Setup

### 1. Install Python Dependencies

The extension requires two Python packages:

```bash
pip3 install pyaudio SpeechRecognition
```

**Note:** On macOS, you may need to install PortAudio first:

```bash
brew install portaudio
pip3 install pyaudio
```

### 2. Grant Microphone Permission

When you first use voice input:

1. Press `Cmd+Shift+V` or run command: **FLOYD: Toggle Voice Input**
2. **macOS will show a system dialog** asking for microphone permission
3. Click **"OK"** or **"Allow"** to grant access to VS Code

### 3. Manual Permission Setup (if needed)

If you accidentally denied permission or need to change it:

1. Open **System Settings** (System Preferences on older macOS)
2. Go to **Privacy & Security**
3. Click **Microphone**
4. Enable the toggle for **Visual Studio Code**

## Usage

1. **Press `Cmd+Shift+V`** (or `Ctrl+Shift+V` on other platforms)
2. Wait for the "Recording..." message
3. **Speak clearly** for 5 seconds
4. The text will be automatically inserted at your cursor

## Commands

- **FLOYD: Toggle Voice Input** - Start voice recording (triggers permission)
- **FLOYD: Check Microphone Permission** - Test microphone access
- **FLOYD: Start Voice Input & Insert Text** - Record and insert

## Settings

Configure in VS Code Settings:

- `floyd.voiceInput.language` - Speech recognition language (default: "en-US")
- `floyd.voiceInput.enabled` - Enable/disable the extension

## Troubleshooting

### "Microphone access denied"

Run the command: **FLOYD: Check Microphone Permission**

This will show you if permission is granted and guide you to System Settings if needed.

### "Python dependencies not found"

The extension will prompt you to install dependencies automatically. If this fails:

```bash
# Install manually
pip3 install pyaudio SpeechRecognition

# On macOS, if PyAudio fails:
brew install portaudio
pip3 install --global-option='build_ext' --global-option='-I/opt/homebrew/include' --global-option='-L/opt/homebrew/lib' pyaudio
```

### Permission Dialog Not Appearing

The dialog only appears when a **native process** tries to access the mic. Make sure:

1. Python 3 is installed (`python3 --version`)
2. The helper script is executable
3. VS Code has permission to run external processes

## Technical Details

This extension:
1. Launches a Python script (`voice_helper.py`) when you use voice input
2. The Python script uses PyAudio to access the microphone
3. **This triggers the macOS system permission dialog**
4. Once granted, the script records audio and transcribes it
5. The text is returned to VS Code and inserted

This is the **correct way** to request microphone permissions on macOS from a VS Code extension.
