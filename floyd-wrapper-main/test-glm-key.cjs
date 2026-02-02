/**
 * Test script to verify GLM API key is loaded in bridge server
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');

// Load .env.local like the bridge server does
const envPath = '/Volumes/Storage/FLOYD_CLI/floyd-wrapper-main/.env.local';

console.log('Testing GLM API Key Loading...\n');

(async () => {
  if (await fs.pathExists(envPath)) {
    console.log('✓ .env.local exists at:', envPath);
    dotenv.config({ path: envPath });
    console.log('✓ dotenv.config() called\n');

    // Check if GLM API key is loaded
    const glmKey = process.env.FLOYD_GLM_API_KEY || process.env.GLM_API_KEY;
    const glmEndpoint = process.env.FLOYD_GLM_ENDPOINT || process.env.GLM_API_ENDPOINT;
    const glmModel = process.env.FLOYD_GLM_MODEL || process.env.GLM_MODEL;

    console.log('Environment Variables Loaded:');
    console.log('  FLOYD_GLM_API_KEY:', glmKey ? `${glmKey.substring(0, 20)}...` : 'NOT SET');
    console.log('  FLOYD_GLM_ENDPOINT:', glmEndpoint || 'NOT SET');
    console.log('  FLOYD_GLM_MODEL:', glmModel || 'NOT SET');
    console.log();

    if (glmKey) {
      console.log('✅ SUCCESS: GLM API key is loaded and ready for use!');
      console.log('\nThe bridge server should be able to execute AI messages.');
    } else {
      console.log('❌ FAILED: GLM API key is not loaded!');
      console.log('\nThe bridge server will fail with "glmApiKey: Required" error.');
    }
  } else {
    console.log('❌ .env.local not found at:', envPath);
  }
})();
