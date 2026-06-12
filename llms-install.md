# ToolPiper — AI Agent Installation Guide

This guide is for AI agents (Cline, Claude Code, Cursor, etc.) installing ToolPiper as an MCP server on a user's Mac.

## Requirements

- macOS on Apple Silicon (M1 or later)
- No Docker, no Python, no API keys, no account

## Step 1 — Install the app

ToolPiper is a native macOS app distributed as a DMG:

1. Download from https://modelpiper.com (free tier — the full local model runner has no caps and needs no account).
2. Open the DMG and drag **ToolPiper.app** to `/Applications`.
3. Launch ToolPiper once. On first launch it:
   - starts the local HTTP + MCP server on `http://127.0.0.1:9998`
   - creates the stdio bridge symlink at `~/.toolpiper/mcp`

The app must be running for either transport to work.

## Step 2 — Connect your MCP client

### Option A: Streamable HTTP (recommended, zero config)

Loopback connections need no auth — no token, no OAuth step.

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

Claude Code one-liner:

```bash
claude mcp add --transport http toolpiper http://127.0.0.1:9998/mcp
```

### Option B: stdio

The `~/.toolpiper/mcp` bridge reads the local ambient token automatically.

```json
{
  "mcpServers": {
    "toolpiper": {
      "type": "stdio",
      "command": "/Users/<username>/.toolpiper/mcp"
    }
  }
}
```

Replace `<username>` with the actual macOS username (expand `~` — some clients do not).

To reduce context usage, filter the 300+ tool catalog at connect time:

```bash
~/.toolpiper/mcp --category core      # just LLM inference (11 tools)
~/.toolpiper/mcp --profile automation # web dev workflow (34 tools)
```

## Step 3 — Verify

1. Confirm the app is running: `pgrep -x ToolPiper` should print a PID.
2. Confirm the server is listening: `lsof -i :9998` should show ToolPiper.
3. From the MCP client, list tools — the catalog reports 300+ tools, 5 resources, and 5 prompts. A quick smoke test: call `system_info` (no arguments).

## Troubleshooting

- **Connection refused on 9998** — ToolPiper isn't running. Launch it from `/Applications` (`open -a ToolPiper`).
- **`~/.toolpiper/mcp` missing** — the symlink is created on app launch; launch ToolPiper once, then retry.
- **Client shows "needs authentication" for the loopback URL** — stale client-side session state; remove and re-add the server, then restart the client session. Loopback peers are trusted by design and never require an OAuth step.
- **Connecting from another machine** — only loopback is zero-config. LAN/remote access requires bearer-token auth; see https://modelpiper.com/docs/toolpiper.

## Privacy notes

ToolPiper never calls out: no telemetry, no analytics, no crash uploads. The only network traffic is what the user explicitly requests (model downloads, web-targeting tools). Verifiable on-machine: `lsof -i -P | grep ToolPiper`.
