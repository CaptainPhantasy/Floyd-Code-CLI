# FLOYD CURSE'M Extensions

Collection of extensions to add Cursor-like features to FLOYD CURSE'M IDE.

## Extensions

### 1. floyd-voice-input
Voice-to-text input using Web Speech API.
- Keyboard shortcut: `Cmd+Shift+V`
- Multi-language support
- Continuous mode available

### 2. floyd-custom-agents
Create and manage custom AI agents.
- 8 built-in agent templates
- Import/export agents
- Chat participant integration

### 3. floyd-multi-chat
Multiple simultaneous AI chat panels.
- Up to 10 concurrent chats
- Chat history preservation
- Export to MD/JSON/TXT

## Quick Install

Install all extensions at once:

```bash
cd /Volumes/Storage/FLOYD_CLI/floyd-extensions

# Install dependencies for all extensions
for dir in floyd-*; do
  (cd "$dir" && npm install)
done

# Build all extensions
for dir in floyd-*; do
  (cd "$dir" && npm run compile)
done

# Install in FLOYD CURSE'M
for dir in floyd-*; do
  code --install-extension "$dir"
done
```

## Individual Install

```bash
cd floyd-voice-input    # or floyd-custom-agents or floyd-multi-chat
npm install
npm run compile
code --install-extension .
```

## Configuration

After installation, configure via VS Code settings (`Cmd+,`):

### Voice Input
```json
{
  "floyd.voiceInput.language": "en-US",
  "floyd.voiceInput.continuous": false,
  "floyd.voiceInput.showInterimResults": true
}
```

### Custom Agents
```json
{
  "floyd.customAgents.enabled": true,
  "floyd.customAgents.storageLocation": "global",
  "floyd.customAgents.defaultAgent": ""
}
```

### Multi-Chat
```json
{
  "floyd.multiChat.maxPanels": 5,
  "floyd.multiChat.defaultPosition": "beside",
  "floyd.multiChat.preserveHistory": true
}
```

## LLM API Configuration

To connect to an LLM (OpenAI, Anthropic, etc.), you'll need to add your API key.

1. Open VS Code settings
2. Search for "LLM" or "FLOYD"
3. Add your API key:

```json
{
  "floyd.llm.provider": "openai",  // or "anthropic", "local", etc.
  "floyd.llm.apiKey": "your-api-key-here",
  "floyd.llm.model": "gpt-4"
}
```

## Development

Each extension can be developed and tested independently:

```bash
cd floyd-voice-input
npm run watch  # Watch mode for development
# Press F5 in VS Code to launch Extension Development Host
```

## Roadmap

- [ ] LLM provider integrations (OpenAI, Anthropic, Ollama)
- [ ] Voice output (text-to-speech)
- [ ] Agent marketplace
- [ ] Chat history search
- [ ] Inline code suggestions
- [ ] Context-aware responses

## License

MIT
