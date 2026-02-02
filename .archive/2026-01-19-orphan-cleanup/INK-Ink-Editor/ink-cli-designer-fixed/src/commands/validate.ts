import fs from 'fs-extra';
import { ScreenSpecSchema } from '../generator/spec.js';

interface ValidateFlags {
  spec?: string;
}

export async function runValidate(flags: ValidateFlags) {
  const specPath = flags.spec ?? 'design-spec.json';
  if (!fs.existsSync(specPath)) {
    throw new Error(`Spec file not found: ${specPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  const parsed = ScreenSpecSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('\n');
    throw new Error(`Spec validation failed:\n${issues}`);
  }
}
