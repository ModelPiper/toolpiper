# ToolPiper MCP Server for macOS

**400+ Model Context Protocol tools, all running on-device.** ToolPiper is a native macOS app that turns your Mac into a local AI platform: bundled inference (llama.cpp on Metal, Apple Intelligence, speech on the Neural Engine), an OpenAI-compatible API at `localhost:9998`, and a built-in MCP server that exposes the whole machine to any MCP client: Claude Code, Cursor, Codex, or your own scripts.

No cloud required for local models. No Docker. No Python. No API keys. Your prompts, files and outputs stay on your Mac, and you can check what ToolPiper connects to yourself: `lsof -i -P | grep ToolPiper` while it runs.

- **Website:** https://modelpiper.com/toolpiper
- **Download:** https://modelpiper.com/download (free; the full local model runner has no caps and needs no account)
- **Docs:** https://modelpiper.com/docs/toolpiper
- **Tool catalog:** https://modelpiper.com/mcp-tools
- **Community:** https://github.com/ModelPiper/modelpiper-community

> This repository is the official home for ToolPiper's MCP server manifest (`server.json`), the Claude Code plugin (`plugins/toolpiper`), and the setup guides. The ToolPiper app itself is not open source, but its privacy claims do not ask for trust: every byte of network traffic is observable on your own machine. Open-source siblings live in this org: [PiperSR](https://github.com/ModelPiper/PiperSR) (ANE super-resolution model), [FluidAudio](https://github.com/ModelPiper/FluidAudio), [mlx-audio-swift](https://github.com/ModelPiper/mlx-audio-swift).

## Quick start

Install ToolPiper, launch it once, then connect any MCP client over Streamable HTTP. Loopback connections need no auth: no token, no OAuth step.

Download the disk image from [modelpiper.com/download](https://modelpiper.com/download), or install with Homebrew:

```bash
brew tap modelpiper/tap
brew trust modelpiper/tap
brew install --cask toolpiper
```

The `trust` line is required once: Homebrew 6 refuses casks from taps outside its own until you trust them.

**Claude Code, as a plugin** (one server entry, nothing to configure by hand):

```bash
claude plugin marketplace add ModelPiper/toolpiper
claude plugin install toolpiper@modelpiper
```

**Claude Code, as a manual server:**

```bash
claude mcp add --transport http toolpiper http://127.0.0.1:9998/mcp
```

**Codex, as a plugin:**

```bash
codex plugin marketplace add ModelPiper/toolpiper
codex plugin add toolpiper@modelpiper
```

Or as a manual server: `codex mcp add toolpiper --url http://127.0.0.1:9998/mcp`. Codex signs in to ToolPiper once; approve ToolPiper's consent page when it appears.

**Any other MCP client**, in its server configuration:

```json
{
  "mcpServers": {
    "toolpiper": { "type": "http", "url": "http://127.0.0.1:9998/mcp" }
  }
}
```

**Claude Desktop, as a one-click extension:** download [`toolpiper-1.0.0.mcpb`](https://github.com/ModelPiper/toolpiper/releases/download/desktop-extension-v1.0.0/toolpiper-1.0.0.mcpb) from [Releases](https://github.com/ModelPiper/toolpiper/releases) and double-click it; Claude Desktop shows its install sheet. The JSON block above does not apply to Claude Desktop, whose config file runs local stdio servers only. Source, build script and privacy statement: [`desktop-extension/`](desktop-extension/). It is a small Node.js forwarder that relays Claude Desktop's stdio to the same loopback server, and it serves the `directory` profile: the catalog minus every tool that uses an AI model to generate images, video or audio.

Installing with an AI agent? Point it at [`llms-install.md`](llms-install.md).

## What's in the catalog

400+ tools, 5 resources, and 5 workflow prompts. Names follow `<category>_<action>` (`vision_ocr`, `system_window_snap`, `browser_assert`). The live catalog, with per-tool documentation, is at [modelpiper.com/mcp-tools](https://modelpiper.com/mcp-tools).

| Category | Examples | What it covers |
|---|---|---|
| Core AI | `chat`, `audio_transcribe`, `audio_speak`, `text_embed` | Local LLM inference, speech-to-text and text-to-speech on the Neural Engine, embeddings |
| Apple frameworks + RAG | `vision_ocr`, `image_analyze`, `text_analyze`, `rag_query` | Apple Vision OCR, image analysis, natural-language analysis, hybrid HNSW + BM25 document search |
| Browser automation | `browser_snapshot`, `browser_action`, `browser_assert`, `browser_intercept` | Chrome via CDP: AX-tree snapshots, self-healing selectors, network mocking, Web Vitals, coverage |
| Testing | `test_run`, `test_save`, `test_export` | Saved browser test sessions, fast replay, Playwright/Cypress export |
| System actions | `system_*` | Windows, Spaces, clipboard (with OCR'd history), audio, displays, Finder, Calendar, Reminders, Contacts, notifications, processes, network, Bluetooth, Shortcuts, and more |
| Video creator | `video_record`, `video_render`, `video_edit_timeline` | Screen-recorded screenplays, non-destructive timeline editing, OTIO/FCP XML/EDL export |
| Outreach | `hn_search`, `reddit_search`, `github_compare`, `gsc_analytics` | HN, Reddit, GitHub, Google Search Console |
| Model management | `model_search`, `model_download`, `model_load` | Search HuggingFace, download GGUF/CoreML, load/unload |
| Routing + integrations | `endpoint_set`, `endpoint_recommend`, `claude_code_install` | Switch inference endpoints per session, Claude Code helper install |

**Resources:** `toolpiper://status`, `toolpiper://models`, `toolpiper://backends`, `toolpiper://tests`, `toolpiper://categories`
**Prompts:** `setup-model`, `audit-page`, `create-test`, `voice-over`, `research-topic`

### Category and profile filtering

Don't want the whole catalog in context? Pass `category` or `profile` as a query parameter on the `/mcp` URL. Both the tool list and the server instructions trim to match:

```bash
# Just LLM inference (core category)
claude mcp add --transport http toolpiper "http://127.0.0.1:9998/mcp?category=core"

# Web dev workflow (automation profile: core + browser + testing)
claude mcp add --transport http toolpiper "http://127.0.0.1:9998/mcp?profile=automation"
```

## Transport

| Transport | Endpoint | Auth |
|---|---|---|
| Streamable HTTP | `POST http://127.0.0.1:9998/mcp` (plus `GET /mcp`, the SSE channel for `tools/list_changed`) | None for loopback peers, enforced at the kernel socket, so `Host`/`Origin` spoofing cannot widen it. LAN and remote peers present `Authorization: Bearer`. |

Streamable HTTP is the only transport. ToolPiper has no stdio server, and older guides that described one are obsolete.

## Privacy

Your prompts, files and outputs stay on your Mac when you use local models. ToolPiper contacts our servers for update checks, a license check when you're signed in and a daily activity count, and it can send optional usage counts. You can turn the last two off in Settings, and none of them include your content. There are no crash uploads, and local use needs no account. Everything else is traffic you ask for: model downloads from HuggingFace, a cloud provider you add, and tools that explicitly target the web. You can watch it yourself:

```bash
lsof -i -P | grep ToolPiper
```

You will see update, license and activity requests to modelpiper.com hosts, optional usage counts to PostHog if you leave them on, plus any downloads or providers you chose, and none of them carry your content. Full policy: [modelpiper.com/privacy](https://modelpiper.com/privacy).

## Requirements and pricing

- macOS 26 or later on Apple Silicon
- **Free:** the full local model runner and every speech feature (transcription, text to speech, dictation). No caps, no account.
- Paid plans add more of the catalog. The current ladder is at [modelpiper.com/pricing](https://modelpiper.com/pricing).

## FAQ

**Is this the same as "ToolPipe"?** No. ToolPiper (this page, `modelpiper.com`) is the macOS MCP server by ModelPiper. Unrelated projects with similar names exist in some directories.

**What does the MIT license in this repo cover?** The contents of this repository: the server manifest, the Claude Code plugin, and the setup guides. The ToolPiper app itself is proprietary.

**Does it work without an internet connection?** Yes. Inference, speech, vision, RAG, and system tools are all on-device. You only need the network to download models.

**Can other machines connect?** Loopback is zero-config. LAN and remote access go through bearer-token auth.

**I already added ToolPiper with `claude mcp add`. Do I need the plugin?** No. Claude Code keeps your manual `toolpiper` server and skips the plugin's copy while the manual one exists, so nothing doubles up. The plugin is for a fresh setup, or if you remove the manual entry.
