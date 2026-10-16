# ToolPiper plugin for Claude Code and Codex

This plugin connects Claude Code or Codex to [ToolPiper](https://modelpiper.com/toolpiper), the
on-device AI platform for macOS. It declares one MCP server, `toolpiper`, at
`http://127.0.0.1:9998/mcp`, and carries no tools of its own: every tool schema is read from the
running app at connect time, so the plugin costs nothing in context until a tool is actually
called.

## Install in Claude Code

```bash
claude plugin marketplace add ModelPiper/toolpiper
claude plugin install toolpiper@modelpiper
```

Claude Code's copy serves the `directory` profile: the catalog minus every tool that uses an AI
model to generate images, video or audio.

## Install in Codex

```bash
codex plugin marketplace add ModelPiper/toolpiper
codex plugin add toolpiper@modelpiper
```

Codex's copy serves the full catalog. When Codex asks to sign in to ToolPiper, approve
ToolPiper's consent page; it happens once.

In either app, a `toolpiper` server you already added by hand takes precedence over the
plugin's.

## Requirement

ToolPiper.app must be installed and running. Download it from
[modelpiper.com/download](https://modelpiper.com/download) or install it with Homebrew; it
requires macOS 26 or later on Apple Silicon, and the free tier needs no account. If your agent
cannot reach the server, the bundled `toolpiper-setup` skill walks through the three checks
(installed, running, listening) and the fix for each. It never edits your agent's
configuration.

## Privacy

With local models, your prompts, files and outputs stay on your Mac. ToolPiper's own traffic is
limited to update checks, license checks when you're signed in, a daily activity count and optional
usage counts, none of which carry your content, and you can turn the last two off in Settings. It
sends no crash reports, and local use needs no account. This plugin reaches ToolPiper over loopback
only; nothing in the plugin contacts any other host. Other traffic is traffic you ask for, such as
a model download, a cloud provider you add or a tool that explicitly targets the web. You can watch
it on your own machine with `lsof -i -P | grep ToolPiper`.

## Versioning

The plugin's version is its own, and the Claude Code and Codex manifests carry the same one. It
changes only when the plugin changes (a server entry or the skill), not when ToolPiper releases a
new build; the app updates itself through its own update
channel and the plugin keeps working across those updates.

## License

MIT, like the rest of this repository. The ToolPiper app itself is proprietary.
