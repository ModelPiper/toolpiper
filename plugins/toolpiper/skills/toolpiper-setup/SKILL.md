---
name: toolpiper-setup
description: Use when the toolpiper MCP server is unreachable, a connection to 127.0.0.1:9998 is refused, or a ToolPiper tool call fails because ToolPiper.app is not installed or not running. Diagnoses and fixes the local app prerequisite without touching any Claude configuration.
---

# ToolPiper setup

The `toolpiper` MCP server this plugin declares is ToolPiper.app itself, listening on
`http://127.0.0.1:9998/mcp`. The plugin runs nothing: it points Claude Code at the app.
If the server is unreachable, the app is not installed, not running, or still starting.

## Diagnose, in this order

1. Installed? `ls /Applications/ToolPiper.app` succeeds when it is.
2. Running? `pgrep -x ToolPiper` prints a process id when it is.
3. Listening? `curl -s http://127.0.0.1:9998/health` returns JSON containing `"status":"ok"`.

## Fix

- **Not installed.** Tell the user to download the DMG from https://modelpiper.com/download,
  drag ToolPiper.app to `/Applications`, and launch it once. It requires macOS 26 or later on
  Apple Silicon. The free tier needs no account.
- **Installed but not running.** Run `open -a ToolPiper`, wait until `/health` answers
  (a few seconds), then reconnect with `/mcp` or start a new session.
- **Running but the client reports "needs authentication".** Loopback connections need no
  token and no OAuth step; this is stale client session state. Start a new Claude Code session.
- **Claude Code is on a different machine from ToolPiper.** The plugin's server URL is loopback
  only. Remote access exists but needs a bearer token and a manual server entry; point the user
  at https://modelpiper.com/docs/toolpiper rather than editing configuration for them.

## Rules

- Never edit `~/.claude`, `~/.claude.json`, project `.mcp.json` files, or any MCP server list.
  The plugin already declares the server; a second entry does not help.
- Never install ToolPiper with a package manager or a script. It ships as a DMG.
- Never call the ToolPiper HTTP API with a token you found on disk; loopback needs none.
