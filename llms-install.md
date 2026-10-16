# ToolPiper: AI Agent Installation Guide

This guide is for AI agents (Claude Code, Cline, Cursor, Codex, etc.) installing ToolPiper as an MCP server on a user's Mac.

## Requirements

- macOS 26 or later on Apple Silicon
- No Docker, no Python, no API keys, no account

## Step 1: Install the app

ToolPiper is a native macOS app distributed as a DMG:

1. Download from https://modelpiper.com/download (the free tier is the full local model runner: no caps, no account).
2. Open the DMG and drag **ToolPiper.app** to `/Applications`.
3. Launch ToolPiper once. It starts the local HTTP and MCP server on `http://127.0.0.1:9998`.

The app must be running for the MCP server to answer.

## Step 2: Connect the MCP client

ToolPiper serves one transport, Streamable HTTP, at `http://127.0.0.1:9998/mcp`. Loopback connections need no auth: no token, no OAuth step.

### Claude Code: the plugin (preferred)

```bash
claude plugin marketplace add ModelPiper/toolpiper
claude plugin install toolpiper@modelpiper
```

The plugin declares the server and bundles a setup skill that diagnoses a missing or stopped app. It edits no configuration files.

### Claude Code: a manual server entry

```bash
claude mcp add --transport http toolpiper http://127.0.0.1:9998/mcp
```

### Any other MCP client

```json
{
  "mcpServers": {
    "toolpiper": {
      "type": "http",
      "url": "http://127.0.0.1:9998/mcp"
    }
  }
}
```

To reduce context usage, filter the catalog at connect time with a query parameter on the URL:

```bash
claude mcp add --transport http toolpiper "http://127.0.0.1:9998/mcp?category=core"       # just LLM inference
claude mcp add --transport http toolpiper "http://127.0.0.1:9998/mcp?profile=automation"  # core + browser + testing
```

## Step 3: Verify

1. Confirm the app is running: `pgrep -x ToolPiper` prints a process id.
2. Confirm the server is listening: `curl -s http://127.0.0.1:9998/health` returns JSON containing `"status":"ok"`.
3. From the MCP client, list tools. The catalog reports 400+ tools, 5 resources, and 5 prompts. A quick smoke test: call `system_status` with no arguments.

## Troubleshooting

- **Connection refused on 9998.** ToolPiper is not running. Launch it from `/Applications` (`open -a ToolPiper`) and wait a few seconds.
- **The client shows "needs authentication" for the loopback URL.** Stale client-side session state; remove and re-add the server, then restart the client session. Loopback peers are trusted by design and never require an OAuth step.
- **The client asks for a stdio command.** There is none. ToolPiper serves Streamable HTTP only; pick the HTTP transport and use the URL above.
- **Connecting from another machine.** Only loopback is zero-config. LAN and remote access require bearer-token auth; see https://modelpiper.com/docs/toolpiper.

## Privacy notes

With local models, the user's prompts, files and outputs stay on the Mac. ToolPiper's own traffic is limited to update checks, license checks when signed in, a daily activity count and optional usage counts, none of which carry the user's content; the daily activity count and usage counts can be turned off in Settings. There are no crash uploads. Other traffic is what the user explicitly requests (model downloads, cloud providers the user adds, web-targeting tools). Verifiable on-machine: `lsof -i -P | grep ToolPiper`.
