# ToolPiper for Claude Desktop

**macOS 26 or later on Apple Silicon.** This extension talks to the ToolPiper app running on the
same Mac. It does not work on Windows, on Linux, or on an Intel Mac, and it does nothing on its
own: install ToolPiper first, from [modelpiper.com/toolpiper](https://modelpiper.com/toolpiper).

ToolPiper turns your Mac into a local AI platform: bundled LLM inference on Metal, speech to text
and text to speech on the Neural Engine, Apple Vision OCR and image analysis, Chrome automation
over the accessibility tree, document search, and native system control. This extension is a small
forwarder. Claude Desktop launches it over stdio, and it relays your requests to ToolPiper over
loopback.

## Install

1. Download `toolpiper-<version>.mcpb` from the
   [releases page](https://github.com/ModelPiper/toolpiper/releases).
2. Double click it. Claude Desktop opens its install sheet and shows the tool list.
3. Click Install.

You can also drag the file onto the Claude Desktop window, or open Settings, Extensions, Advanced
settings, Install extension.

Then install ToolPiper itself from [modelpiper.com/toolpiper](https://modelpiper.com/toolpiper) and
launch it once. Nothing else needs configuring: the connection is loopback, so there is no token,
no OAuth step and no account.

## Example prompts

- "Read the text out of the screenshot on my desktop and summarize it." Uses `vision_ocr`, which
  runs on the Neural Engine and is free.
- "Transcribe `~/Downloads/standup.m4a` and pull out the action items." Uses `audio_transcribe`.
  Every speech feature is free, with no cap and no account.
- "Scrape https://example.com and give me the headings." Uses `web_scrape`, which is a paid tool.
  On the free tier the call answers with one sentence and an upgrade link rather than a result, so
  this prompt also shows what a gated tool looks like.

## Privacy Policy

Full policy: [modelpiper.com/privacy](https://modelpiper.com/privacy).

**ToolPiper never calls out.** No telemetry, no analytics, no crash uploads, no account
requirement. The only outbound network traffic is traffic you ask for by name: a model download
from Hugging Face, or a tool you invoked that explicitly targets the web, such as `web_scrape`.

**This extension speaks to loopback only.** Every request it makes goes to
`http://127.0.0.1:9998` on this machine. It sends nothing anywhere else, it downloads nothing, and
it installs nothing. That is a tested property rather than a claim: every URL the extension can
build comes from `src/target.ts`, and `test/loopback.test.js` asserts that the whole set resolves
to `127.0.0.1` and that a non-loopback origin is discarded rather than honoured.

Both claims are checkable on your own machine while ToolPiper runs:

```bash
lsof -i -P | grep ToolPiper
```

## For reviewers

The ToolPiper app is free to download and its local model runner, every speech feature, OCR and
system control need no account and have no cap, so most of the catalog can be exercised as
downloaded. Paid tools answer a free-tier caller with one sentence and an upgrade link instead of a
result. To exercise those, ask for a test license at
[bracicot@modelpiper.com](mailto:bracicot@modelpiper.com) and one will be issued for the review.

The extension serves the `directory` profile: the ToolPiper catalog minus every tool that uses an
AI model to generate images, video or audio, which the Software Directory Policy section 4.B bars.
That exclusion is enforced by the server, not by this forwarder: a call for an excluded tool
answers a profile error rather than a result.

## Troubleshooting

**"ToolPiper is not running on this Mac."** That is the extension's one built-in tool answering
truthfully. Start the app with `open -a ToolPiper`. The full tool list appears within a few seconds,
with no need to restart Claude Desktop.

**The tool list is short.** Claude Desktop is showing the not-running state. See above.

**A tool answers with an upgrade link.** That tool is on a paid plan. The current ladder is at
[modelpiper.com/pricing](https://modelpiper.com/pricing).

**Nothing happens at all.** Check that ToolPiper is listening:

```bash
curl -s http://127.0.0.1:9998/health
```

## Building it yourself

```bash
npm install
npm run build     # src/*.ts -> server/*.js
npm test          # the loopback assertions
```

`TOOLPIPER_MCP_ORIGIN` points the forwarder at a different port for testing. It cannot widen the
target: anything that is not plain HTTP on the literal address `127.0.0.1` is discarded and the
default is used.

## License

MIT, with the rest of this repository. The ToolPiper app itself is proprietary.
