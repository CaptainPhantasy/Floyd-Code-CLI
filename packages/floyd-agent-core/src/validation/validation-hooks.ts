import { validateToolInput, ValidationError } from './validator.js';
import { schemaRegistry } from './schema-registry.js';

export class ToolValidationError extends Error {
  public validationErrors: ValidationError[];

  constructor(message: string, errors: ValidationError[]) {
    super(message);
    this.name = 'ToolValidationError';
    this.validationErrors = errors;
  }
}

/**
 * Hook to run validation before tool execution
 * Throws ToolValidationError if validation fails
 */
export function validatePreExecution(toolName: string, args: Record<string, unknown>): void {
  const schema = schemaRegistry.get(toolName);
  
  // If no schema is registered, we assume it's valid (or maybe strict mode checks this?)
  // For now, we'll allow unknown tools but warn? Or just return.
  if (!schema) {
    // console.warn(`No validation schema found for tool: ${toolName}`);
    return;
  }

  const errors = validateToolInput(toolName, args, schema);

  if (errors.length > 0) {
    const errorMessages = errors.map(e => `${e.field}: ${e.message}`).join(', ');
    throw new ToolValidationError(
      `Validation failed for tool '${toolName}': ${errorMessages}`,
      errors
    );
  }
}
