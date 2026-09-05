// The loopback-only claim in README.md, as a test rather than a sentence.
//
// Every outbound URL this extension can produce comes from src/target.ts, so
// the whole surface is enumerable and this asserts the whole of it. A new
// outbound URL that does not appear in allTargets() is one this test cannot
// see, which is why allTargets() exists.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
    DEFAULT_ORIGIN,
    LOOPBACK_HOST,
    PROFILE,
    allTargets,
    healthUrl,
    mcpUrl,
    resolveOrigin,
} from '../server/target.js';

test('the default target is loopback 9998', () => {
    assert.equal(DEFAULT_ORIGIN, 'http://127.0.0.1:9998');
    assert.equal(resolveOrigin(undefined), DEFAULT_ORIGIN);
    assert.equal(resolveOrigin(null), DEFAULT_ORIGIN);
    assert.equal(resolveOrigin(''), DEFAULT_ORIGIN);
});

test('every URL the extension can build targets 127.0.0.1', () => {
    for (const origin of [undefined, 'http://127.0.0.1:9', 'https://example.com', 'http://example.com:9998']) {
        const resolved = resolveOrigin(origin);
        const targets = allTargets(resolved);
        assert.ok(targets.length >= 2, 'allTargets must enumerate the whole outbound surface');
        for (const url of targets) {
            assert.equal(url.hostname, LOOPBACK_HOST, `${url} is not loopback`);
            assert.equal(url.protocol, 'http:', `${url} is not plain http`);
        }
    }
});

test('a non-loopback origin is discarded, not honoured', () => {
    for (const hostile of [
        'http://example.com:9998',
        'http://169.254.169.254',
        'http://127.0.0.1.evil.test:9998',
        'https://127.0.0.1:9998',
        'http://localhost:9998', // resolves through DNS and can arrive as ::1
        'http://[::1]:9998',
        'ws://127.0.0.1:9998',
        'file:///etc/passwd',
        'not a url',
    ]) {
        assert.equal(resolveOrigin(hostile), DEFAULT_ORIGIN, `${hostile} was not discarded`);
    }
});

test('a loopback origin on another port is honoured, so the down arm is testable', () => {
    assert.equal(resolveOrigin('http://127.0.0.1:9'), 'http://127.0.0.1:9');
    assert.equal(mcpUrl('http://127.0.0.1:9').port, '9');
    assert.equal(healthUrl('http://127.0.0.1:9').port, '9');
});

test('the MCP URL carries the directory profile and the health URL does not', () => {
    assert.equal(PROFILE, 'directory');
    assert.equal(mcpUrl(DEFAULT_ORIGIN).toString(), 'http://127.0.0.1:9998/mcp?profile=directory');
    assert.equal(healthUrl(DEFAULT_ORIGIN).toString(), 'http://127.0.0.1:9998/health');
});
