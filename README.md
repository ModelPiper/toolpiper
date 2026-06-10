# ToolPiper — MCP Server for macOS

**300+ Model Context Protocol tools, all running on-device.** ToolPiper is a native macOS app that turns your Mac into a local AI platform: bundled inference (llama.cpp on Metal, Apple Intelligence, voice on the Neural Engine), an OpenAI-compatible API at `localhost:9998`, and a built-in MCP server that exposes the whole machine to any MCP client — Claude Code, Cursor, Windsurf, or your own scripts.

No cloud. No Docker. No Python. No API keys. Nothing leaves your Mac, and you can verify that yourself: `lsof -i -P | grep ToolPiper` while it runs.

- **Website:** https://modelpiper.com/toolpiper
- **Download:** https://modelpiper.com (free — the full local model runner has no caps and needs no account)
- **Docs:** https://modelpiper.com/docs/toolpiper
- **Community:** https://github.com/ModelPiper/modelpiper-community

> This repository is the official home for ToolPiper's MCP server manifest, setup guides, and recipes. The ToolPiper app itself is not open source — but its privacy claims don't ask for trust: every byte of network traffic is observable on your own machine. Open-source siblings live in this org: [PiperSR](https://github.com/ModelPiper/PiperSR) (ANE super-resolution model), [FluidAudio](https://github.com/ModelPiper/FluidAudio), [mlx-audio-swift](https://github.com/ModelPiper/mlx-audio-swift).

## Quick start

Install ToolPiper from [modelpiper.com](https://modelpiper.com), launch it once, then connect any MCP client.

**Streamable HTTP** (zero config — loopback connections need no auth):

```bash
claude mcp add --transport http toolpiper http://127.0.0.1:9998/mcp
```

```json
{
  "mcpServers": {
    "toolpiper": { "type": "http", "url": "http://127.0.0.1:9998/mcp" }
  }
}
```

**stdio** (the `~/.toolpiper/mcp` symlink is created automatically on launch):

```bash
claude mcp add toolpiper -- ~/.toolpiper/mcp
```

```json
{
  "mcpServers": {
    "toolpiper": { "type": "stdio", "command": "/Users/<you>/.toolpiper/mcp" }
  }
}
```

## What's in the catalog

300+ tools, 5 resources, and 5 workflow prompts. Names follow `<category>_<action>` (`vision_ocr`, `system_window_snap`, `browser_assert`). The full catalog ships names-only on the wire (~24 KB), so it fits under Claude Code's per-server payload cap without trimming.

| Category | Examples | What it covers |
|---|---|---|
| Core AI | `chat`, `audio_transcribe`, `audio_speak`, `text_embed` | Local LLM inference, speech-to-text and text-to-speech on the Neural Engine, embeddings |
| Apple frameworks + RAG | `vision_ocr`, `image_analyze`, `text_analyze`, `rag_query` | Apple Vision OCR, 11 vision endpoints, 6 NLP endpoints, hybrid HNSW + BM25 document search |
| Browser automation | `browser_snapshot`, `browser_action`, `browser_assert`, `browser_intercept` | Chrome via CDP: AX-tree snapshots, self-healing selectors, network mocking, Web Vitals, coverage |
| Testing | `test_run`, `test_save`, `test_export` | Saved browser test sessions, ~10–50 ms/step replay, Playwright/Cypress export |
| System actions | `system_*` — ~140 tools across 26 macOS domains | Windows, Spaces, clipboard (with OCR'd history), audio, displays, Finder, Calendar, Reminders, Contacts, notifications, processes, network, Bluetooth, Shortcuts, and more |
| Video creator | `video_record`, `video_render`, `video_edit_timeline` | Screen-recorded screenplays, non-destructive timeline editing, OTIO/FCP XML/EDL export |
| Outreach | `hn_search`, `reddit_search`, `github_compare`, `gsc_analytics` | HN, Reddit, GitHub, Google Search Console |
| Model management | `model_search`, `model_download`, `model_load` | Search HuggingFace, download GGUF/CoreML, load/unload |
| Routing + integrations | `endpoint_set`, `endpoint_recommend`, `claude_code_install` | Switch inference endpoints per session, Claude Code helper install |

**Resources:** `toolpiper://status`, `toolpiper://models`, `toolpiper://backends`, `toolpiper://tests`, `toolpiper://categories`
**Prompts:** `setup-model`, `audit-page`, `create-test`, `voice-over`, `research-topic`

### Category filtering (stdio)

Don't want all 300 tools in context? Filter at connect time — both the tool list and the server instructions trim to match:

```bash
# Just LLM inference (11 tools)
claude mcp add toolpiper -- ~/.toolpiper/mcp --category core

# Web dev workflow (34 tools)
claude mcp add toolpiper -- ~/.toolpiper/mcp --profile automation
```

## Transports

| Transport | Endpoint | Auth |
|---|---|---|
| Streamable HTTP | `POST http://127.0.0.1:9998/mcp` (+ `GET /mcp` SSE channel for `tools/list_changed`) | None for loopback peers — enforced at the kernel socket, so `Host`/`Origin` spoofing can't widen it. LAN/remote peers require `Authorization: Bearer`. |
| stdio | `~/.toolpiper/mcp` | Reads the local ambient token automatically |

## Privacy

ToolPiper never calls out. No telemetry, no analytics, no crash uploads, no account requirement. The only network traffic is the traffic you ask for (model downloads from HuggingFace, tools that explicitly target the web). This is a property you can check, not a policy you have to trust:

```bash
lsof -i -P | grep ToolPiper
```

## Requirements & pricing

- macOS on Apple Silicon
- **Free:** the full local model runner — no caps, no account
- **Pro ($10/mo):** all 9 inference backends, full voice suite, and more — see [pricing](https://modelpiper.com/pricing)

## FAQ

**Is this the same as "ToolPipe"?** No. ToolPiper (this page, `modelpiper.com`) is the macOS MCP server by ModelPiper. Unrelated projects with similar names exist in some directories.

**Does it work without an internet connection?** Yes — inference, voice, vision, RAG, and system tools are all on-device. You only need the network to download models.

**Can other machines connect?** Loopback is zero-config. LAN/remote access goes through bearer-token auth.
