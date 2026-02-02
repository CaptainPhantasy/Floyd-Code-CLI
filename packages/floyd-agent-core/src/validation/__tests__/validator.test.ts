import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateToolInput, ValidationSchema } from '../validator.js';
import { schemaRegistry } from '../schema-registry.js';
import { validatePreExecution, ToolValidationError } from '../validation-hooks.js';

describe('Validator', () => {
  const schema: ValidationSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
      tags: { type: 'array', items: { type: 'string' } },
      meta: { type: 'object', properties: { active: { type: 'boolean' } } }
    },
    required: ['name']
  };

  it('should validate valid input', () => {
    const input = {
      name: 'Floyd',
      age: 1,
      tags: ['ai', 'cli'],
      meta: { active: true }
    };
    const errors = validateToolInput('test', input, schema);
    assert.strictEqual(errors.length, 0);
  });

  it('should report missing required field', () => {
    const input = { age: 1 };
    const errors = validateToolInput('test', input, schema);
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].field, 'name');
    assert.ok(errors[0].message.includes('Missing required field'));
  });

  it('should report invalid type', () => {
    const input = { name: 123 };
    const errors = validateToolInput('test', input, schema);
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].field, 'name');
    assert.ok(errors[0].message.includes('Expected string'));
  });

  it('should report invalid nested type', () => {
    const input = { name: 'Floyd', meta: { active: 'yes' } };
    const errors = validateToolInput('test', input, schema);
    assert.strictEqual(errors.length, 1);
    assert.strictEqual(errors[0].field, 'meta.active');
    assert.ok(errors[0].message.includes('Expected boolean'));
  });
});

describe('SchemaRegistry', () => {
  it('should register and retrieve schema', () => {
    const schema: ValidationSchema = { type: 'object', properties: {} };
    schemaRegistry.register('test-tool', schema);
    assert.strictEqual(schemaRegistry.get('test-tool'), schema);
  });
});

describe('ValidationHooks', () => {
  it('should throw ToolValidationError on invalid input', () => {
    const schema: ValidationSchema = { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] };
    schemaRegistry.register('hook-test', schema);
    
    assert.throws(() => {
      validatePreExecution('hook-test', {});
    }, ToolValidationError);
  });

  it('should pass on valid input', () => {
    const schema: ValidationSchema = { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] };
    schemaRegistry.register('hook-test-pass', schema);
    
    assert.doesNotThrow(() => {
      validatePreExecution('hook-test-pass', { id: 1 });
    });
  });
});
