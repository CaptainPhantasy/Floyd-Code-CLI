# FLOYD Multi-Chat Panels

Multiple simultaneous AI chat panels for FLOYD CURSE'M IDE.

## Features

- **Multiple Chat Panels** - Open up to 10 simultaneous chat sessions
- **Session Management** - Create, rename, duplicate, and delete chats
- **Chat History** - Automatically saves and restores chat sessions
- **Export Conversations** - Export chats as Markdown, JSON, or plain text
- **Dedicated Sidebar** - "FLOYD Chats" activity bar for easy access
- **Quick Actions** - Keyboard shortcuts and toolbar buttons

## Installation

```bash
cd floyd-multi-chat
npm install
npm run compile
# Press F5 to test
```

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `floyd.multiChat.maxPanels` | number | `5` | Maximum number of panels (1-10) |
| `floyd.multiChat.defaultPosition` | string | `beside` | Panel position (beside/right/left/bottom) |
| `floyd.multiChat.preserveHistory` | boolean | `true` | Preserve chat history between sessions |
| `floyd.multiChat.autoSave` | boolean | `true` | Automatically save chat conversations |

## Commands

| Command | Description |
|---------|-------------|
| `FLOYD Multi-Chat: New AI Chat Panel` | Create a new chat panel |
| `FLOYD Multi-Chat: Close All Chat Panels` | Close all open chats |
| `FLOYD Multi-Chat: Rename Chat Panel` | Rename an existing chat |
| `FLOYD Multi-Chat: Duplicate Chat Panel` | Duplicate a chat with all messages |
| `FLOYD Multi-Chat: Export Chat History` | Export chat to file |

## Usage

1. Click the FLOYD Chats icon in the activity bar (sidebar)
2. Click "New AI Chat Panel" or press the command
3. Start chatting!
4. Open multiple panels for different conversations
5. Export chats for documentation or sharing

## LLM Integration

The extension includes placeholder LLM integration. To connect to a real LLM:

1. Open `src/extension.ts`
2. Find the `sendToLLM` method
3. Replace the placeholder with your LLM API calls
4. Rebuild the extension

Example integration:
```typescript
private async sendToLLM(session: ChatSession, content: string): Promise<void> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${this.apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: session.agent || 'You are a helpful assistant.' },
        ...session.messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content }
      ]
    })
  });
  // Handle response...
}
```

## License

MIT
