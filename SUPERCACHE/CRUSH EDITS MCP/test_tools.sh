#!/bin/bash

# Test MCP server and capture tools list

SERVER_PATH="$1"

if [ -z "$SERVER_PATH" ]; then
    echo "Usage: $0 <path-to-dist/index.js>"
    exit 1
fi

echo "Testing: $SERVER_PATH"
echo "================================"

# Create test script
cat > /tmp/mcp_test.js << 'EOF'
const { spawn } = require('child_process');
const serverPath = process.argv[1];

const server = spawn('node', [serverPath]);
let buffer = '';

server.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    lines.forEach(line => {
        if (line.trim()) {
            try {
                const msg = JSON.parse(line);
                console.log(JSON.stringify(msg, null, 2));
            } catch (e) {
                console.log(line);
            }
        }
    });
});

server.stderr.on('data', (data) => {
    process.stderr.write(data);
});

// Send initialize
server.stdin.write(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0.0" }
    }
}) + '\n');

// Send initialized
server.stdin.write(JSON.stringify({
    jsonrpc: "2.0",
    method: "notifications/initialized"
}) + '\n');

// Request tools list
setTimeout(() => {
    server.stdin.write(JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list"
    }) + '\n');

    // Exit after receiving response
    setTimeout(() => {
        server.kill();
    }, 500);
}, 100);

setTimeout(() => {
    server.kill();
    process.exit(0);
}, 2000);
EOF

node /tmp/mcp_test.js "$SERVER_PATH"
rm /tmp/mcp_test.js
