#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🧪 Testing Media Types Tool Fix...\n');

// Test the media types tool
const testMediaTypes = () => {
    return new Promise((resolve, reject) => {
        const mcpProcess = spawn('node', ['src/index.js'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        mcpProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        mcpProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        // Send the media types request
        const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: "zabbix_get_media_types",
                arguments: {}
            }
        };

        setTimeout(() => {
            mcpProcess.stdin.write(JSON.stringify(request) + '\n');
        }, 2000);

        setTimeout(() => {
            mcpProcess.kill();
            
            console.log('📤 Request sent:', JSON.stringify(request, null, 2));
            console.log('\n📥 Response received:');
            
            if (output) {
                // Try to parse JSON responses
                const lines = output.split('\n').filter(line => line.trim());
                lines.forEach(line => {
                    try {
                        const parsed = JSON.parse(line);
                        console.log(JSON.stringify(parsed, null, 2));
                    } catch (e) {
                        console.log('Raw output:', line);
                    }
                });
            }
            
            if (errorOutput) {
                console.log('\n❌ Error output:', errorOutput);
            }
            
            // Check if we got a proper structured response
            if (output.includes('"content"') && output.includes('"type"') && output.includes('"text"')) {
                console.log('\n✅ SUCCESS: Media types tool now returns proper MCP response format!');
                resolve(true);
            } else if (output.includes('Retrieved') && output.includes('media types')) {
                console.log('\n✅ SUCCESS: Media types tool is working!');
                resolve(true);
            } else {
                console.log('\n❌ FAILED: Media types tool still has issues');
                resolve(false);
            }
        }, 5000);
    });
};

testMediaTypes().then(success => {
    console.log('\n🏁 Test completed:', success ? 'PASSED' : 'FAILED');
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
}); 