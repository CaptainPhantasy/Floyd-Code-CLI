#!/bin/bash

# Test MCP server by sending initialize request and checking for tools/list response
# Usage: ./test_mcp_server.sh <server-path>

SERVER_PATH="$1"

if [ -z "$SERVER_PATH" ]; then
    echo "Usage: $0 <path-to-dist/index.js>"
    exit 1
fi

if [ ! -f "$SERVER_PATH" ]; then
    echo "Error: Server file not found: $SERVER_PATH"
    exit 1
fi

echo "Testing server: $SERVER_PATH"
echo "----------------------------------------"

# Create a temporary script to send MCP messages
TEST_SCRIPT=$(cat <<'EOF'
#!/usr/bin/env node

const { spawn } = require('child_process');

const serverPath = process.argv[1];
const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit']
});

let initialized = false;
let toolsListed = false;
let hasError = false;

server.stdout.on('data', (data) => {
    const response = data.toString();

    // Parse JSON-RPC responses
    const lines = response.split('\n').filter(line => line.trim());

    lines.forEach(line => {
        try {
            const msg = JSON.parse(line);

            if (msg.result) {
                if (msg.result.capabilities && !initialized) {
                    console.log('✓ Server initialized successfully');
                    console.log('  Capabilities:', JSON.stringify(msg.result.capabilities));
                    initialized = true;

                    // Request tools list
                    server.stdin.write(JSON.stringify({
                        jsonrpc: "2.0",
                        id: 2,
                        method: "tools/list",
                        params: {}
                    }) + '\n');
                }

                if (msg.result.tools && !toolsListed) {
                    console.log('✓ Tools advertised successfully');
                    console.log(`  Tool count: ${msg.result.tools.length}`);
                    msg.result.tools.forEach(tool => {
                        console.log(`    - ${tool.name}: ${tool.description?.substring(0, 60)}...`);
                    });
                    toolsListed = true;

                    // Close server after successful test
                    server.stdin.end();
                }
            }

            if (msg.error) {
                console.log('✗ Server error:', msg.error.message);
                hasError = true;
                server.stdin.end();
            }
        } catch (e) {
            // Ignore non-JSON lines
        }
    });
});

server.on('error', (err) => {
    console.error('✗ Failed to start server:', err.message);
    process.exit(1);
});

server.on('exit', (code) => {
    if (!hasError) {
        if (initialized && toolsListed) {
            console.log('\n✓ Server test PASSED');
            process.exit(0);
        } else if (initialized) {
            console.log('\n⚠ Server initialized but no tools listed');
            process.exit(1);
        } else {
            console.log('\n✗ Server failed to initialize');
            process.exit(1);
        }
    }
    process.exit(1);
});

// Send initialize request
setTimeout(() => {
    server.stdin.write(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
                name: "test-client",
                version: "1.0.0"
            }
        }
    }) + '\n');

    // Send initialized notification
    server.stdin.write(JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized"
    }) + '\n');
}, 100);

// Timeout after 5 seconds
setTimeout(() => {
    console.log('\n✗ Test timed out after 5 seconds');
    server.kill();
    process.exit(1);
}, 5000);
EOF
)

# Write and run the test script
echo "$TEST_SCRIPT" > /tmp/test_mcp_$$.js
chmod +x /tmp/test_mcp_$$.js

node /tmp/test_mcp_$$.js "$SERVER_PATH"
EXIT_CODE=$?

rm /tmp/test_mcp_$$.js

echo ""
exit $EXIT_CODE
