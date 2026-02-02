import * as Ink from 'ink';
import { useState, useEffect } from 'react';
import TextInput from 'ink-text-input';
import { useInput } from 'ink';
import { useTuiStore } from '../store/tui-store.js';

interface Provider {
  id: string;
  name: string;
  endpoint: string;
  model: string;
  recommended: boolean;
}

const PROVIDERS: Provider[] = [
  {
    id: 'glm',
    name: 'GLM (Zai)',
    endpoint: 'https://api.z.ai/api/coding/paas/v4',
    model: 'glm-4-plus',
    recommended: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    recommended: false,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com/v1',
    model: 'claude-opus-4',
    recommended: false,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1',
    model: 'deepseek-coder',
    recommended: false,
  },
];

interface ProviderConfigProps {
  onComplete?: (config: { provider: string; apiKey: string }) => void;
}

type ConfigStep = 'provider' | 'apikey';

/**
 * First-run provider configuration
 * Shows when no provider is configured
 */
export function ProviderConfig(props: ProviderConfigProps) {
  const { onComplete } = props;
  const [step, setStep] = useState<ConfigStep>('provider');
  const [selectedProvider, setSelectedProvider] = useState(0);
  const [apiKey, setApiKey] = useState('');

  const setProvider = useTuiStore((state) => state.setProvider);
  const setModel = useTuiStore((state) => state.setModel);

  // Update store when provider selection changes
  useEffect(() => {
    setProvider(PROVIDERS[selectedProvider].id);
    setModel(PROVIDERS[selectedProvider].model);
  }, [selectedProvider, setProvider, setModel]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      onComplete?.({
        provider: PROVIDERS[selectedProvider].id,
        apiKey,
      });
    }
  };

  // Handle keyboard navigation for provider selection
  useInput((input, key) => {
    if (step === 'provider') {
      // Number keys for quick selection
      const num = parseInt(input, 10);
      if (num >= 1 && num <= PROVIDERS.length) {
        setSelectedProvider(num - 1);
        setStep('apikey');
        return;
      }

      // Arrow keys for navigation
      if (key.upArrow) {
        setSelectedProvider((prev) =>
          prev > 0 ? prev - 1 : PROVIDERS.length - 1
        );
        return;
      }

      if (key.downArrow) {
        setSelectedProvider((prev) =>
          prev < PROVIDERS.length - 1 ? prev + 1 : 0
        );
        return;
      }

      // Enter to continue
      if (key.return) {
        setStep('apikey');
        return;
      }
    } else if (step === 'apikey') {
      // Esc to go back
      if (key.escape) {
        setStep('provider');
        return;
      }
    }
  }, { isActive: step === 'provider' });

  if (step === 'provider') {
    return (
      <Ink.Box
        flexDirection="column"
        borderStyle="double"
        borderColor="#6B50FF"
        paddingX={2}
        paddingY={1}
        width={70}
      >
        <Ink.Box marginBottom={1}>
          <Ink.Text bold>FLOYD GOD TIER - First Run Configuration</Ink.Text>
        </Ink.Box>

        <Ink.Box marginBottom={1}>
          <Ink.Text>Select your provider:</Ink.Text>
        </Ink.Box>

        <Ink.Box flexDirection="column" marginBottom={1}>
          {PROVIDERS.map((provider, index) => (
            <Ink.Box key={provider.id}>
              <Ink.Text color={index === selectedProvider ? '#FFC107' : '#808080'}>
                {index === selectedProvider ? '> ' : '  '}
              </Ink.Text>
              <Ink.Text bold={index === selectedProvider}>
                {index + 1}. {provider.name}
                {provider.recommended && (
                  <Ink.Text color="#4CAF50"> - RECOMMENDED</Ink.Text>
                )}
              </Ink.Text>
            </Ink.Box>
          ))}
        </Ink.Box>

        <Ink.Box marginTop={1}>
          <Ink.Text dimColor>
            ↑/↓: Navigate • 1-4: Quick select • Enter: Continue
          </Ink.Text>
        </Ink.Box>
      </Ink.Box>
    );
  }

  return (
    <Ink.Box
      flexDirection="column"
      borderStyle="double"
      borderColor="#6B50FF"
      paddingX={2}
      paddingY={1}
      width={70}
    >
      <Ink.Box marginBottom={1}>
        <Ink.Text bold>Enter your API key</Ink.Text>
        <Ink.Text dimColor> [will be saved to ~/.floyd/.env]</Ink.Text>
      </Ink.Box>

      <Ink.Box marginBottom={1}>
        <Ink.Text dimColor>Provider: </Ink.Text>
        <Ink.Text bold color="#FFC107">{PROVIDERS[selectedProvider].name}</Ink.Text>
      </Ink.Box>

      <Ink.Box marginBottom={1}>
        <Ink.Text color="#FFC107">{'> '}</Ink.Text>
        <TextInput
          value={apiKey}
          onChange={setApiKey}
          onSubmit={handleSaveApiKey}
          placeholder="sk-..."
          mask="*"
        />
      </Ink.Box>

      <Ink.Box marginTop={1}>
        <Ink.Text dimColor>Enter to save • Esc: Back</Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
