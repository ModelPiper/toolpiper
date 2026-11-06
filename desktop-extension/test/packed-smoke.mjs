// Runs an unpacked .mcpb the way Claude Desktop does, with ToolPiper unreachable.
//
//   TOOLPIPER_MCP_ORIGIN=http://127.0.0.1:9 node test/packed-smoke.mjs <unpacked>/server/index.js
//
// Claude Desktop installs the archive, not this directory, and the packer
// applies .mcpbignore, so a bundle can pass every test run here and still fail
// to start. With nothing listening the handshake must still complete and serve
// exactly toolpiper_status. The release workflow runs this on the archive it is
// about to publish.

import { spawn } from 'node:child_process';

const entry = process.argv[2];
if (!entry) {
    console.error('usage: node test/packed-smoke.mjs <unpacked>/server/index.js');
    process.exit(2);
}

const child = spawn(process.execPath, [entry], { stdio: ['pipe', 'pipe', 'inherit'] });
const send = (message) => child.stdin.write(JSON.stringify(message) + '\n');
const fail = (why) => {
    child.removeAllListeners('exit');
    child.kill();
    console.error(why);
    process.exit(1);
};
const timer = setTimeout(() => fail('no tools/list answer within 20 s'), 20000);
child.on('exit', (code) => {
    clearTimeout(timer);
    console.error(`the bundle exited (${code}) before answering`);
    process.exit(1);
});

let buffered = '';
child.stdout.on('data', (chunk) => {
    buffered += chunk;
    for (let i = buffered.indexOf('\n'); i >= 0; i = buffered.indexOf('\n')) {
        const line = buffered.slice(0, i);
        buffered = buffered.slice(i + 1);
        let message;
        try {
            message = JSON.parse(line);
        } catch {
            continue;
        }
        if (message.id === 1) {
            send({ jsonrpc: '2.0', method: 'notifications/initialized' });
            send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
        } else if (message.id === 2) {
            clearTimeout(timer);
            const names = (message.result?.tools ?? []).map((tool) => tool.name).join(',');
            if (names !== 'toolpiper_status') fail(`served '${names}', expected exactly toolpiper_status`);
            child.removeAllListeners('exit');
            child.kill();
            console.log('the packed bundle serves toolpiper_status with ToolPiper unreachable');
            process.exit(0);
        }
    }
});

send({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'packed-smoke', version: '1.0.0' } },
});
