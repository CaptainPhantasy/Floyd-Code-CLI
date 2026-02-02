/**
 * Floyd Dependency Injection Container
 *
 * Simple DI container for managing service instances across:
 * - Floyd CLI (Ink/React)
 * - Floyd Wrapper (Node.js)
 * - Floyd Desktop (Electron)
 *
 * PHASE 0 ARCHITECTURAL FOUNDATION - Item 0.2
 */

import { ConfigManager, initializeConfig } from '../config/floyd-config.js';
import { StateManager } from '../state/floyd-state.js';
import { UnifiedPermissionManager } from '../permissions/unified-permission.js';
import { createLLMClient } from '../llm/index.js';
import type { LLMClient } from '../types/llm.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Service keys for the container
 */
export type ServiceKey =
  | 'config'
  | 'state'
  | 'permissions'
  | 'llm';

/**
 * Service factory function
 */
export type ServiceFactory<T> = () => T | Promise<T>;

/**
 * Container options
 */
export interface ContainerOptions {
  /** Working directory */
  cwd?: string;
  /** Whether to auto-initialize services */
  autoInit?: boolean;
}

// ============================================================================
// FLOYD CONTAINER
// ============================================================================

/**
 * FloydContainer - Dependency Injection Container
 *
 * Manages service instances with lazy initialization and singleton pattern.
 *
 * @example
 * ```typescript
 * const container = await FloydContainer.initialize({ cwd: process.cwd() });
 *
 * const config = container.resolve('config');
 * const permissions = container.resolve('permissions');
 * const llm = container.resolve('llm');
 * ```
 */
export class FloydContainer {
  private instances: Map<string, unknown> = new Map();
  private factories: Map<string, ServiceFactory<unknown>> = new Map();
  private initialized: boolean = false;
  private cwd: string;

  private constructor(options: ContainerOptions = {}) {
    this.cwd = options.cwd ?? process.cwd();
  }

  /**
   * Register a service factory
   */
  register<T>(key: string, factory: ServiceFactory<T>): void {
    this.factories.set(key, factory as ServiceFactory<unknown>);
  }

  /**
   * Resolve a service instance (lazy initialization)
   */
  resolve<T>(key: ServiceKey): T {
    if (!this.instances.has(key)) {
      const factory = this.factories.get(key);
      if (!factory) {
        throw new Error(`No factory registered for service: ${key}`);
      }
      const instance = factory();
      if (instance instanceof Promise) {
        throw new Error(`Service ${key} requires async initialization. Use resolveAsync() instead.`);
      }
      this.instances.set(key, instance);
    }
    return this.instances.get(key) as T;
  }

  /**
   * Resolve a service instance asynchronously
   */
  async resolveAsync<T>(key: ServiceKey): Promise<T> {
    if (!this.instances.has(key)) {
      const factory = this.factories.get(key);
      if (!factory) {
        throw new Error(`No factory registered for service: ${key}`);
      }
      const instance = await factory();
      this.instances.set(key, instance);
    }
    return this.instances.get(key) as T;
  }

  /**
   * Check if a service is registered
   */
  has(key: string): boolean {
    return this.factories.has(key);
  }

  /**
   * Check if a service is already instantiated
   */
  isInstantiated(key: string): boolean {
    return this.instances.has(key);
  }

  /**
   * Clear a specific service instance (for hot-reload)
   */
  clear(key: string): void {
    this.instances.delete(key);
  }

  /**
   * Clear all service instances
   */
  clearAll(): void {
    this.instances.clear();
  }

  /**
   * Get the working directory
   */
  getCwd(): string {
    return this.cwd;
  }

  /**
   * Check if container is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Initialize the container with default services
   */
  static async initialize(options: ContainerOptions = {}): Promise<FloydContainer> {
    const container = new FloydContainer(options);
    const cwd = options.cwd ?? process.cwd();

    // Register config service
    container.register('config', async () => {
      await initializeConfig(cwd);
      return ConfigManager;
    });

    // Register state service
    container.register('state', () => {
      return StateManager;
    });

    // Register permissions service
    container.register('permissions', () => {
      const config = ConfigManager.get('permissions');
      return new UnifiedPermissionManager({
        mode: config.mode,
        cwd,
      });
    });

    // Register LLM service
    container.register('llm', () => {
      const llmConfig = ConfigManager.get('llm');
      return createLLMClient({
        apiKey: llmConfig.apiKey ?? '',
        baseURL: llmConfig.baseURL,
        model: llmConfig.model,
        maxTokens: llmConfig.maxTokens,
        provider: llmConfig.provider,
      });
    });

    // Auto-initialize if requested
    if (options.autoInit !== false) {
      await container.resolveAsync('config');
    }

    container.initialized = true;
    return container;
  }

  /**
   * Create a container without default services (for testing)
   */
  static createEmpty(options: ContainerOptions = {}): FloydContainer {
    return new FloydContainer(options);
  }
}

// ============================================================================
// SINGLETON GLOBAL CONTAINER
// ============================================================================

/**
 * Global container instance
 */
let globalContainer: FloydContainer | null = null;

/**
 * Get or create the global container
 */
export async function getContainer(options?: ContainerOptions): Promise<FloydContainer> {
  if (!globalContainer) {
    globalContainer = await FloydContainer.initialize(options);
  }
  return globalContainer;
}

/**
 * Reset the global container (for testing)
 */
export function resetContainer(): void {
  if (globalContainer) {
    globalContainer.clearAll();
  }
  globalContainer = null;
}

/**
 * Get a service from the global container
 */
export async function getService<T>(key: ServiceKey): Promise<T> {
  const container = await getContainer();
  return container.resolveAsync<T>(key);
}

// ============================================================================
// TYPE-SAFE SERVICE ACCESSORS
// ============================================================================

/**
 * Get the config service
 */
export async function getConfigService(): Promise<typeof ConfigManager> {
  return getService('config');
}

/**
 * Get the state service
 */
export async function getStateService(): Promise<typeof StateManager> {
  return getService('state');
}

/**
 * Get the permissions service
 */
export async function getPermissionsService(): Promise<UnifiedPermissionManager> {
  return getService('permissions');
}

/**
 * Get the LLM service
 */
export async function getLLMService(): Promise<LLMClient> {
  return getService('llm');
}
