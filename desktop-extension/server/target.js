/**
 * Where this extension is allowed to speak, and nowhere else.
 *
 * The forwarder is a forwarder: loopback is its only socket. Every outbound
 * request in `index.ts` is built from `mcpUrl()` or `healthUrl()`, and both are
 * built from `resolveOrigin()`, so the loopback claim in `README.md` is one
 * function rather than a habit spread over call sites.
 *
 * `TOOLPIPER_MCP_ORIGIN` exists so a test can point the forwarder at a closed
 * loopback port and exercise the not-running arm without quitting the app. It
 * cannot widen the target: an origin that is not plain HTTP on the literal
 * address 127.0.0.1 is discarded and the default is used. `localhost` is
 * discarded too, because it resolves through DNS and can arrive as ::1.
 */
export const LOOPBACK_HOST = '127.0.0.1';
export const DEFAULT_PORT = 9998;
export const DEFAULT_ORIGIN = `http://${LOOPBACK_HOST}:${DEFAULT_PORT}`;
/** The Anthropic-directory tool profile: the catalog minus the tools the
 *  Software Directory Policy section 4.B names. Closed at the wire by
 *  ToolPiper, not by this forwarder. */
export const PROFILE = 'directory';
export function resolveOrigin(raw) {
    if (!raw)
        return DEFAULT_ORIGIN;
    let url;
    try {
        url = new URL(raw);
    }
    catch {
        return DEFAULT_ORIGIN;
    }
    if (url.protocol !== 'http:')
        return DEFAULT_ORIGIN;
    if (url.hostname !== LOOPBACK_HOST)
        return DEFAULT_ORIGIN;
    const port = url.port || String(DEFAULT_PORT);
    return `http://${LOOPBACK_HOST}:${port}`;
}
export function mcpUrl(origin = resolveOrigin(process.env.TOOLPIPER_MCP_ORIGIN)) {
    const url = new URL('/mcp', origin);
    url.searchParams.set('profile', PROFILE);
    return url;
}
export function healthUrl(origin = resolveOrigin(process.env.TOOLPIPER_MCP_ORIGIN)) {
    return new URL('/health', origin);
}
/** Every URL this extension can produce, for the test that asserts the whole
 *  set is loopback. A new outbound URL that is not listed here is a URL the
 *  loopback test does not cover, which is the point of listing them. */
export function allTargets(origin = resolveOrigin(process.env.TOOLPIPER_MCP_ORIGIN)) {
    return [mcpUrl(origin), healthUrl(origin)];
}
