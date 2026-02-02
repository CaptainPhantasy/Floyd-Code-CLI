# FLOYD Custom AI Agents

Create and manage custom AI agents with custom prompts for FLOYD CURSE'M IDE.

## Features

- **Custom Agent Creation** - Define your own AI agents with custom system prompts
- **Built-in Templates** - Pre-built agents for common tasks (Code Review, Debugging, etc.)
- **Agent Management** - Create, edit, delete, and organize your agents
- **Import/Export** - Share agents with your team
- **Chat Integration** - Use agents via `@floyd` in VS Code's chat
- **Configurable Parameters** - Temperature, max tokens, model selection

## Built-in Agent Templates

| Name | Description | Icon |
|------|-------------|------|
| Code Reviewer | Reviews code for bugs, security issues | shield |
| Documentation Writer | Generates documentation from code | book |
| Refactoring Expert | Suggests code improvements | symbol-property |
| Debug Assistant | Helps diagnose and fix bugs | bug |
| Test Generator | Generates comprehensive unit tests | beaker |
| Code Explainer | Explains code in simple terms | lightbulb |
| SQL Expert | Helps write and optimize SQL queries | database |
| Git Helper | Assists with Git operations | git-branch |

## Installation

```bash
cd floyd-custom-agents
npm install
npm run compile
# Press F5 to test
```

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `floyd.customAgents.enabled` | boolean | `true` | Enable custom AI agents |
| `floyd.customAgents.storageLocation` | string | `global` | Where to store agents (global/workspace) |
| `floyd.customAgents.defaultAgent` | string | `""` | Default agent to use |
| `floyd.customAgents.templatesPath` | string | `""` | Custom path for agent templates |

## Commands

| Command | Description |
|---------|-------------|
| `FLOYD: Create New Custom Agent` | Create a new custom agent |
| `FLOYD: List All Custom Agents` | Show all agents |
| `FLOYD: Edit Custom Agent` | Edit an existing agent |
| `FLOYD: Delete Custom Agent` | Delete an agent |
| `FLOYD: Import Agent from File` | Import agents from JSON |
| `FLOYD: Export Agent to File` | Export agent to JSON |
| `FLOYD: Create Agent from Template` | Use a built-in template |

## Agent Definition Format

```json
{
  "id": "agent-12345",
  "name": "My Agent",
  "description": "Does something useful",
  "systemPrompt": "You are an expert assistant...",
  "temperature": 0.7,
  "maxTokens": 2000,
  "icon": "robot",
  "model": "gpt-4",
  "keywords": ["help", "assistant"],
  "createdAt": 1709251200000,
  "updatedAt": 1709251200000
}
```

## Usage in Chat

```
@floyd List all available agents
@floyd use code-reviewer Please review this code
```

## License

MIT
