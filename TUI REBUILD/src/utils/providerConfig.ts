import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { z } from 'zod';

const FloydEnvSchema = z.object({
  // Standard keys
  GLM_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  // FLOYD_ prefixed keys (from .env.local)
  FLOYD_GLM_API_KEY: z.string().optional(),
  FLOYD_OPENAI_API_KEY: z.string().optional(),
  FLOYD_ANTHROPIC_API_KEY: z.string().optional(),
  FLOYD_DEEPSEEK_API_KEY: z.string().optional(),
  FLOYD_XAI_API_KEY: z.string().optional(),
  FLOYD_GLM_ENDPOINT: z.string().optional(),
  FLOYD_OPENAI_ENDPOINT: z.string().optional(),
  FLOYD_ANTHROPIC_ENDPOINT: z.string().optional(),
  // Config
  FLOYD_PROVIDER: z.enum(['glm', 'openai', 'anthropic', 'deepseek', 'xai', 'custom']).default('glm'),
  FLOYD_MODEL: z.string().default('GLM-4.7'),
  FLOYD_ENDPOINT: z.string().optional(),
});

export type FloydEnv = z.infer<typeof FloydEnvSchema>;

const FLOYD_DIR = join(homedir(), '.floyd');
const ENV_FILE = join(FLOYD_DIR, '.env');
const ENV_LOCAL_FILE = join(FLOYD_DIR, '.env.local');

/**
 * Get the Floyd .env directory path
 */
export function getFloydDir(): string {
  return FLOYD_DIR;
}

/**
 * Ensure .floyd directory exists
 */
export function ensureFloydDir(): void {
  if (!existsSync(FLOYD_DIR)) {
    mkdirSync(FLOYD_DIR, { recursive: true });
  }
}

/**
 * Load Floyd environment configuration
 * Checks both .env and .env.local files
 */
export function loadFloydEnv(): FloydEnv {
  // Check .env.local first (has priority), then .env
  const envFile = existsSync(ENV_LOCAL_FILE) ? ENV_LOCAL_FILE : existsSync(ENV_FILE) ? ENV_FILE : null;

  if (!envFile) {
    return {
      FLOYD_PROVIDER: 'glm',
      FLOYD_MODEL: 'GLM-4.7',
    };
  }

  const content = readFileSync(envFile, 'utf-8');
  const env: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      env[key] = valueParts.join('=');
    }
  }

  return FloydEnvSchema.parse(env);
}

/**
 * Save Floyd environment configuration
 */
export function saveFloydEnv(config: Partial<FloydEnv>): void {
  ensureFloydDir();

  const existing = loadFloydEnv();
  const merged = { ...existing, ...config };

  const lines = Object.entries(merged)
    .filter(([key]) => key !== 'FLOYD_PROVIDER' && key !== 'FLOYD_MODEL' && key !== 'FLOYD_ENDPOINT')
    .map(([key, value]) => `${key}=${value || ''}`);

  lines.push(`FLOYD_PROVIDER=${merged.FLOYD_PROVIDER}`);
  lines.push(`FLOYD_MODEL=${merged.FLOYD_MODEL}`);
  if (merged.FLOYD_ENDPOINT) {
    lines.push(`FLOYD_ENDPOINT=${merged.FLOYD_ENDPOINT}`);
  }

  writeFileSync(ENV_FILE, lines.join('\n') + '\n');
}

/**
 * Get API key for current provider
 * Checks both standard and FLOYD_ prefixed env vars
 */
export function getProviderApiKey(provider?: string): string | undefined {
  const env = loadFloydEnv();
  const currentProvider = provider || env.FLOYD_PROVIDER;

  switch (currentProvider) {
    case 'glm':
      return env.GLM_API_KEY || env.FLOYD_GLM_API_KEY;
    case 'openai':
      return env.OPENAI_API_KEY || env.FLOYD_OPENAI_API_KEY;
    case 'anthropic':
      return env.ANTHROPIC_API_KEY || env.FLOYD_ANTHROPIC_API_KEY;
    case 'deepseek':
      return env.DEEPSEEK_API_KEY || env.FLOYD_DEEPSEEK_API_KEY;
    case 'xai':
      return env.XAI_API_KEY || env.FLOYD_XAI_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Check if Floyd is configured
 */
export function isFloydConfigured(): boolean {
  const env = loadFloydEnv();
  return !!getProviderApiKey(env.FLOYD_PROVIDER);
}
