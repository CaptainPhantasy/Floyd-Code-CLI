// Fix for Ink's console patching in Vitest environment
import { vi } from 'vitest';

// Ink attempts to patch console.Console, but in Vitest environment it might not be a constructor
// We need to ensure global.console is compatible or mocked if necessary.
// However, the specific error "TypeError: console.Console is not a constructor" usually comes from 
// 'patch-console' package used by Ink.

// A common workaround for Ink testing in strict environments:
if (!console.Console) {
  // @ts-ignore
  console.Console = console.constructor;
}
