import { ValidationSchema } from './validator.js';

/**
 * Registry for Tool Validation Schemas
 */
export class SchemaRegistry {
  private schemas: Map<string, ValidationSchema> = new Map();

  /**
   * Register a schema for a tool
   */
  register(toolName: string, schema: ValidationSchema): void {
    this.schemas.set(toolName, schema);
  }

  /**
   * Get a schema for a tool
   */
  get(toolName: string): ValidationSchema | undefined {
    return this.schemas.get(toolName);
  }

  /**
   * Check if a tool has a registered schema
   */
  has(toolName: string): boolean {
    return this.schemas.has(toolName);
  }

  /**
   * Get all registered tool names
   */
  getRegisteredTools(): string[] {
    return Array.from(this.schemas.keys());
  }
}

// Global registry instance
export const schemaRegistry = new SchemaRegistry();
