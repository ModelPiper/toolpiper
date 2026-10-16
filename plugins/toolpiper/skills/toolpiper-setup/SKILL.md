---
name: toolpiper-setup
description: Use when the toolpiper MCP server is unreachable, a connection to 127.0.0.1:9998 is refused, or a ToolPiper tool call fails because ToolPiper.app is not installed or not running. Diagnoses and fixes the local app prerequisite without touching the agent's own configuration.
---

# ToolPiper setup

The `toolpiper` MCP server this plugin declares is ToolPiper.app itself, listening on
`http://127.0.0.1:9998/mcp`. The plugin runs nothing: it points your agent (Claude Code or
Codex) at the app. If the server is unreachable, the app is not installed, not running, or
still starting.

## Diagnose, in this order

1. Installed? `ls /Applications/ToolPiper.app` succeeds when it is.
2. Running? `pgrep -x ToolPiper` prints a process id when it is.
3. Listening? `curl -s http://127.0.0.1:9998/health` returns JSON containing `"status":"ok"`.

## Fix

- **Not installed.** Tell the user to download the DMG from https://modelpiper.com/download,
  drag ToolPiper.app to `/Applications`, and launch it once, or to install it with Homebrew:
  `brew tap modelpiper/tap`, `brew trust modelpiper/tap`, `brew install --cask toolpiper`. It
  requires macOS 26 or later on Apple Silicon. The free tier needs no account.
- **Installed but not running.** Run `open -a ToolPiper` and wait until `/health` answers (a
  few seconds). Then reconnect: in Claude Code run `/mcp` or start a new session; in Codex start
  a new session.
- **Running but the client reports "needs authentication".** Loopback connections need no
  sign-in from Claude Code: this is stale session state, so start a new session. Codex signs in
  to ToolPiper once: run `codex mcp login toolpiper` and approve ToolPiper's consent page.
- **The agent is on a different machine from ToolPiper.** The plugin's server URL is loopback
  only. Point the user at ToolPiper's remote-access documentation,
  https://modelpiper.com/docs/toolpiper, rather than editing configuration for them.

## Rules

- Never edit the agent's own settings or any MCP server list. The plugin already declares the
  server; a second entry does not help.
- Install ToolPiper only from the DMG at modelpiper.com or the official Homebrew tap above, and
  only when the user asks. Never from another script or package source.
- Read nothing from the user's files to reach ToolPiper. The loopback server needs no
  credentials, so the three checks above are the whole diagnosis.
