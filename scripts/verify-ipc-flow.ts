
import { AgentIPC } from '../FloydDesktop/electron/ipc/agent-ipc';
import { app, ipcMain, BrowserWindow } from 'electron';
import path from 'path';

// Mock Electron modules since we are running in a node script
jest.mock('electron', () => ({
  app: {
    getPath: (name: string) => path.join(process.cwd(), '.test-user-data'),
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeHandler: jest.fn(),
  },
  BrowserWindow: {
    getAllWindows: () => [],
  },
  Notification: {
    isSupported: () => false,
  },
  dialog: {
    showErrorBox: jest.fn((title, content) => console.error(`[Dialog] ${title}: ${content}`)),
  }
}));

// Real constants from the user's request
const USER_KEY = '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';
const USER_MODEL = 'claude-sonnet-4-5-20250929';
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com';

async function simulateEndToEnd() {
  console.log('🤖 INITIALIZING AgentIPC (Simulating App Launch)...');
  
  // 1. Initialize the IPC Bridge (Main Process)
  // We pass empty/defaults initially like the app does before loading settings
  const agentIPC = new AgentIPC({
    apiKey: '',
    apiEndpoint: '',
    model: ''
  });

  await agentIPC.initialize();
  console.log('✅ AgentIPC Initialized');

  // 2. Simulate User entering settings in SettingsModal
  console.log('\n👤 USER ACTION: Selecting Provider "Anthropic"...');
  await agentIPC.setSetting('provider', 'anthropic');

  console.log('👤 USER ACTION: Entering API Key...');
  await agentIPC.setSetting('apiKey', USER_KEY);

  console.log('👤 USER ACTION: Setting Endpoint...');
  await agentIPC.setSetting('apiEndpoint', ANTHROPIC_ENDPOINT);

  console.log(`👤 USER ACTION: Selecting Model "${USER_MODEL}"...`);
  await agentIPC.setSetting('model', USER_MODEL);

  // 3. Simulate User clicking "Send" in ChatPanel
  console.log('\n💬 USER ACTION: Sending Message "Hello"...');
  
  // Access the private sendMessage method via the public handler if accessible, 
  // or use the method directly since we have the instance
  // @ts-ignore - simulating internal call
  const response = await agentIPC.sendMessage('Hello');

  console.log('\n📨 RESPONSE RECEIVED:');
  if (response.success) {
    console.log('---------------------------------------------------');
    console.log(response.response);
    console.log('---------------------------------------------------');
    console.log('✅ END-TO-END VERIFICATION PASSED');
  } else {
    console.error('❌ FAILURE:', response.error);
    if (response.isAuthError) {
        console.error('   (Authentication Error Detected)');
    }
    process.exit(1);
  }
}

simulateEndToEnd().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
