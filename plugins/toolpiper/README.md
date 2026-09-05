# ToolPiper plugin for Claude Code

This plugin connects Claude Code to [ToolPiper](https://modelpiper.com/toolpiper), the on-device
AI platform for macOS. It declares one MCP server, `toolpiper`, at `http://127.0.0.1:9998/mcp`,
and carries no tools of its own: every tool schema is read from the running app at connect time,
so the plugin costs nothing in context until a tool is actually called.

## Install

```bash
claude plugin marketplace add ModelPiper/toolpiper
claude plugin install toolpiper@modelpiper
```

## Requirement

ToolPiper.app must be installed and running. Download it from
[modelpiper.com/download](https://modelpiper.com/download); it requires macOS 26 or later on
Apple Silicon, and the free tier needs no account. If Claude Code cannot reach the server, the
bundled `toolpiper-setup` skill walks through the three checks (installed, running, listening)
and the fix for each. It never edits your Claude configuration.

## Privacy

ToolPiper never calls out. It sends no telemetry, no analytics and no crash reports, and it
requires no account. This plugin reaches it over loopback only; nothing in the plugin contacts
any other host. The only network traffic ToolPiper makes is the traffic you ask for, such as a
model download or a tool that explicitly targets the web, and you can verify that on your own
machine with `lsof -i -P | grep ToolPiper`.

## Versioning

The plugin's version is its own. It changes only when the plugin changes (the server entry or the
skill), not when ToolPiper releases a new build; the app updates itself through its own update
channel and the plugin keeps working across those updates.

## License

MIT, like the rest of this repository. The ToolPiper app itself is proprietary.
