export default {
  esbuildOptions: {
    format: 'esm',
    platform: 'node',
    target: 'node18',
    bundle: false,
    packages: 'external'
  }
};
