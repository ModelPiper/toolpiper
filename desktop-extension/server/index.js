#!/usr/bin/env node
/**
 * ToolPiper for Claude Desktop: a stdio-to-loopback forwarder.
 *
 * Claude Desktop launches this over stdio. It relays JSON-RPC to a ToolPiper
 * already running on this Mac at http://127.0.0.1:9998/mcp?profile=directory
 * over Streamable HTTP, and relays whatever comes back, ids preserved and
 * bodies untouched: annotations, elicitations and the 402 upgrade sentence
 * included.
 *
 * It is never a host, never a tier judge and never a fetcher. Tier is enforced
 * at ToolPiper's HTTP routes; a second enforcement seam here would drift from
 * the ones that exist. The only bytes this process fetches are the JSON-RPC
 * responses it was asked to relay and the health probe below.
 *
 * When ToolPiper is not running the handshake still completes and exactly one
 * tool is served, `toolpiper_status`, which says so and names the command that
 * starts the app. A poll notices when it comes up, connects, and emits
 * `notifications/tools/list_changed` so the real catalog appears without a
 * restart.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { LATEST_PROTOCOL_VERSION, SUPPORTED_PROTOCOL_VERSIONS } from '@modelcontextprotocol/sdk/types.js';
import { healthUrl, mcpUrl, resolveOrigin } from './target.js';
import { STATUS_TOOL_NAME, notRunningText, statusTool, unavailableText } from './status.js';
const VERSION = '1.0.0';
const ORIGIN = resolveOrigin(process.env.TOOLPIPER_MCP_ORIGIN);
const MCP_URL = mcpUrl(ORIGIN);
const HEALTH_URL = healthUrl(ORIGIN);
const PROBE_TIMEOUT_MS = 1500;
const POLL_MS = 3000;
/** The id the forwarder's own replayed `initialize` carries. Its response is
 *  swallowed: the client downstream already has one. */
const REPLAY_ID = '__toolpiper_forwarder_initialize';
const stdio = new StdioServerTransport();
let http = null;
let connected = false;
let connecting = false;
let awaitingReplay = false;
let initializeRequest = null;
let pollTimer = null;
function log(...parts) {
    // stdout is the JSON-RPC channel. Everything else goes to stderr.
    console.error('[toolpiper]', ...parts);
}
function toClient(message) {
    void stdio.send(message).catch((error) => {
        log('could not write to stdout:', error);
    });
}
function result(id, value) {
    toClient({ jsonrpc: '2.0', id, result: value });
}
function rpcError(id, code, message) {
    toClient({ jsonrpc: '2.0', id, error: { code, message } });
}
/** A refusal the model can read aloud. Never a protocol error: a red failed
 *  call in the transcript tells the user nothing they can act on. */
function toolText(id, text, isError) {
    result(id, { content: [{ type: 'text', text }], isError });
}
async function toolPiperIsUp() {
    try {
        const response = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
        return response.ok;
    }
    catch {
        return false;
    }
}
// --- The down state ---------------------------------------------------------
function negotiatedVersion(requested) {
    return typeof requested === 'string' && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
        ? requested
        : LATEST_PROTOCOL_VERSION;
}
function answerInitializeLocally(message) {
    result(message.id, {
        protocolVersion: negotiatedVersion(message?.params?.protocolVersion),
        capabilities: { tools: { listChanged: true } },
        serverInfo: { name: 'toolpiper', title: 'ToolPiper', version: VERSION },
        instructions: 'ToolPiper is not running on this Mac yet, so only its status tool is available. ' +
            'Start the app with `open -a ToolPiper` and the full tool list arrives here on its own.',
    });
}
function answerWhileDown(message) {
    const { id, method } = message;
    if (id === undefined || id === null)
        return; // a notification needs no answer
    switch (method) {
        case 'ping':
            result(id, {});
            return;
        case 'tools/list':
            result(id, { tools: [statusTool] });
            return;
        case 'prompts/list':
            result(id, { prompts: [] });
            return;
        case 'resources/list':
            result(id, { resources: [] });
            return;
        case 'resources/templates/list':
            result(id, { resourceTemplates: [] });
            return;
        case 'tools/call': {
            const name = message?.params?.name;
            if (name === STATUS_TOOL_NAME) {
                toolText(id, notRunningText(ORIGIN), false);
            }
            else {
                toolText(id, unavailableText(String(name ?? 'that tool')), true);
            }
            return;
        }
        default:
            rpcError(id, -32601, `ToolPiper is not running, so "${method}" cannot be served`);
    }
}
// --- The up state -----------------------------------------------------------
function degrade(reason) {
    if (!connected && !connecting)
        return;
    connected = false;
    connecting = false;
    awaitingReplay = false;
    const dying = http;
    http = null;
    if (dying) {
        dying.onmessage = undefined;
        dying.onerror = undefined;
        dying.onclose = undefined;
        void dying.close().catch(() => undefined);
    }
    log('upstream lost:', reason, '- serving the status tool until it returns');
    toClient({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
    startPolling();
}
async function connect() {
    if (connected || connecting || initializeRequest === null)
        return connected;
    connecting = true;
    const transport = new StreamableHTTPClientTransport(MCP_URL);
    transport.onmessage = (message) => {
        if (awaitingReplay && message?.id === REPLAY_ID) {
            awaitingReplay = false;
            void transport
                .send({ jsonrpc: '2.0', method: 'notifications/initialized' })
                .catch((error) => log('could not send notifications/initialized:', error));
            return;
        }
        toClient(message);
    };
    transport.onerror = (error) => degrade(error.message);
    transport.onclose = () => degrade('stream closed');
    try {
        await transport.start();
    }
    catch (error) {
        connecting = false;
        log('could not start the upstream transport:', error);
        return false;
    }
    http = transport;
    connected = true;
    connecting = false;
    return true;
}
function startPolling() {
    if (pollTimer)
        return;
    pollTimer = setInterval(() => {
        serialize(async () => {
            if (connected || connecting || initializeRequest === null)
                return;
            if (!(await toolPiperIsUp()))
                return;
            awaitingReplay = true;
            if (!(await connect())) {
                awaitingReplay = false;
                return;
            }
            stopPolling();
            // The client downstream is already initialized against us; ToolPiper
            // is not, so its handshake is replayed under an id whose response is
            // swallowed above.
            try {
                await http.send({ ...initializeRequest, id: REPLAY_ID });
            }
            catch (error) {
                awaitingReplay = false;
                degrade(`replayed initialize failed: ${String(error)}`);
                return;
            }
            log('ToolPiper is up; relaying the full catalog');
            toClient({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
        });
    }, POLL_MS);
    pollTimer.unref?.();
}
function stopPolling() {
    if (!pollTimer)
        return;
    clearInterval(pollTimer);
    pollTimer = null;
}
// --- The relay --------------------------------------------------------------
/**
 * Ordering gate.
 *
 * Handling `initialize` takes a health probe and a connect, so anything that
 * arrives while that is in flight would otherwise be answered against the
 * pre-connect state: a `notifications/initialized` sent back to back with the
 * handshake would be dropped by the down arm, and dropping it is what keeps the
 * GET SSE stream closed, which is how server-initiated traffic (elicitations,
 * `tools/list_changed`) would go missing. Every state transition runs through
 * this chain, so a message is always handled against the state its predecessor
 * left behind. Dispatch does NOT await the upstream POST, so a slow tool call
 * cannot hold the queue.
 */
let gate = Promise.resolve();
function serialize(work) {
    gate = gate.then(work).catch((error) => log('handler failed:', error));
}
stdio.onmessage = (message) => {
    if (message?.method === 'initialize' && message?.id !== undefined) {
        serialize(async () => {
            initializeRequest = message;
            if (await toolPiperIsUp()) {
                if (await connect()) {
                    // AWAITED, unlike every other dispatch: Streamable HTTP
                    // hands back `Mcp-Session-Id` on the initialize RESPONSE,
                    // and a request issued before it lands carries no session
                    // and is refused. Measured 2026-09-05: dispatching the
                    // client's `tools/list` without this await produced
                    // "Error POSTing to endpoint" and a spurious degrade.
                    await sendUpstream(message);
                    return;
                }
            }
            answerInitializeLocally(message);
            startPolling();
        });
        return;
    }
    serialize(() => {
        if (connected && http) {
            void sendUpstream(message);
            return;
        }
        answerWhileDown(message);
    });
};
async function sendUpstream(message) {
    try {
        await http.send(message);
    }
    catch (error) {
        const id = message?.id;
        degrade(String(error));
        if (id === undefined || id === null)
            return;
        if (message?.method === 'tools/call') {
            toolText(id, unavailableText(String(message?.params?.name ?? 'that tool')), true);
        }
        else {
            rpcError(id, -32603, `ToolPiper stopped answering on ${ORIGIN}`);
        }
    }
}
stdio.onerror = (error) => log('stdio error:', error.message);
stdio.onclose = () => {
    stopPolling();
    void http?.close().catch(() => undefined);
};
await stdio.start();
log(`forwarding to ${MCP_URL.toString()}`);
