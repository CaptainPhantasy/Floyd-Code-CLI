export function generateId(prefix: string = 'node'): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 5)}`;
}

export function generateTimestamp(): string {
  return new Date().toISOString();
}
