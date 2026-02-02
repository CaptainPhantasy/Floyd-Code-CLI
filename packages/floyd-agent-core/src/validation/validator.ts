/**
 * Tool Parameter Validator
 * 
 * Provides JSON Schema-like validation for tool inputs.
 * Ensures that tools receive correct parameter types and required fields.
 */

export interface ValidationError {
  field: string;
  message: string;
  received: unknown;
}

export interface ValidationSchema {
  type: 'object';
  properties: Record<string, PropertySchema>;
  required?: string[];
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any';
  description?: string;
  enum?: unknown[];
  items?: PropertySchema; // For arrays
  properties?: Record<string, PropertySchema>; // For objects
}

/**
 * Validate tool input against a schema
 */
export function validateToolInput(
  _toolName: string,
  input: Record<string, unknown>,
  schema: ValidationSchema
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in input) || input[field] === undefined) {
        errors.push({
          field,
          message: `Missing required field: ${field}`,
          received: undefined
        });
      }
    }
  }

  // 2. Validate types for provided fields
  for (const [key, value] of Object.entries(input)) {
    // Skip fields not in schema (allow extra fields? usually yes for flexibility, or no for strictness)
    // For now, we only validate fields that are defined in the schema
    if (schema.properties[key]) {
      const fieldSchema = schema.properties[key];
      const fieldError = validateType(key, value, fieldSchema);
      if (fieldError) {
        errors.push(fieldError);
      }
    }
  }

  return errors;
}

/**
 * Helper to validate a single value against a property schema
 */
function validateType(
  field: string,
  value: unknown,
  schema: PropertySchema
): ValidationError | null {
  // Handle null/undefined if not required (required check is done separately)
  if (value === undefined || value === null) {
    return null; 
  }

  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        return { field, message: 'Expected string', received: value };
      }
      if (schema.enum && !schema.enum.includes(value)) {
         return { field, message: `Invalid value. Expected one of: ${schema.enum.join(', ')}`, received: value };
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { field, message: 'Expected number', received: value };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { field, message: 'Expected boolean', received: value };
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        return { field, message: 'Expected array', received: value };
      }
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          const itemError = validateType(`${field}[${i}]`, value[i], schema.items);
          if (itemError) return itemError;
        }
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        return { field, message: 'Expected object', received: value };
      }
      if (schema.properties) {
        for (const [propKey, propSchema] of Object.entries(schema.properties)) {
            // Recurse for nested objects
             if (value && typeof value === 'object' && propKey in value) {
                 const nestedVal = (value as Record<string, unknown>)[propKey];
                 const nestedError = validateType(`${field}.${propKey}`, nestedVal, propSchema);
                 if (nestedError) return nestedError;
             }
        }
      }
      break;
      
    case 'any':
        // No validation needed
        break;
  }

  return null;
}
