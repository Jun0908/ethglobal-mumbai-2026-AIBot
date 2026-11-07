# Recording the Secret Tender demo

Three browser-demo cuts: **180 seconds**, **90 seconds** and **30 seconds**, 1920×1080, English UI, English burned-in captions, no audio. The three-minute cut restores the intermediate selections and both typed questions, with more reading time for replies and memories.

## What the video shows

1. Secret Tender home.
2. Photo preferences and illustrated personality selections.
3. A genuine OpenAI preview and explicit approval.
4. An invitation opened in a separate browser session.
5. Conversation with the approved twin and the three-choice planning game.
6. A dashboard of the actual conversation, memory and an idea to continue in person.

The video uses actual browser footage, not reconstructed screens or mocked API replies. AI wait time and repetitive selections are shortened. Recorded cursor highlighting and captions are presentation aids. Story/game results remain those produced by the application.

The recordings use synthetic demo choices. The completed capture stops the invitation and withdraws the synthetic twin’s simulation consent. Do not publish a recording containing an active invitation or private user data.

## Capture

Requirements: Node.js, Playwright with its browsers/video encoder, Python 3 and FFmpeg/FFprobe. No application dependency changes are needed.

```powershell
# Install Playwright in a separate tooling directory or use an existing installation.
$env:PLAYWRIGHT_MODULE='C:/absolute/path/to/node_modules/playwright'
# Default: installed Microsoft Edge, headless. Set chrome if appropriate.
$env:DEMO_BROWSER_CHANNEL='msedge'
# Default is the public demo. Use a dedicated test server for repeat runs.
$env:DEMO_BASE_URL='https://love-match-masala.vercel.app'
$env:DEMO_VIDEO_DIR='output/demo-video'
node scripts/demo-video/record.mjs
```

The script starts fresh owner/visitor contexts and interacts through the UI. It calls the real AI API when the target server uses OpenAI, so normal API charges apply. It does not export cookies or session credentials. The generated capture metadata contains local file paths and shot timings. Raw footage, screenshots and generated files stay under ignored `output/`.

## Edit

```powershell
python scripts/demo-video/render.py --dir output/demo-video
# Detailed three-minute cut, without rebuilding the two existing cuts:
python scripts/demo-video/render.py --dir output/demo-video --version 180s
```

The editor reads the measured source ranges in `capture.json`, speeds up selected source ranges, pads the original 1920×960 screen with a caption band, and produces H.264/yuv420p MP4 files with fast-start metadata. A shorter source shot holds its final frame rather than inventing action. Captions and edit timelines are saved alongside the outputs for inspection. Windows Segoe UI is the default font; set `DEMO_VIDEO_FONT` to another local font path if needed.

Outputs:

- `output/demo-video/Secret-Tender-Demo-180s.mp4`
- `output/demo-video/Secret-Tender-Demo-90s.mp4`
- `output/demo-video/Secret-Tender-Demo-30s.mp4`

Verify the durations and dimensions with FFprobe, decode the full files, and inspect frames from each scene before sharing. MP4 binaries are local deliverables and are not pushed to Git or deployed with the website.

## Verified delivery — 2026-11-07

| Cut | Duration | Frames | Size |
| --- | --- | --- | --- |
| Detailed | 180.000 s | 5,400 | 15,981,776 bytes |
| Main | 90.000 s | 2,700 | 9,223,363 bytes |
| Short | 30.000 s | 900 | 4,898,434 bytes |

All three files are 1920×1080, 30 fps, H.264/yuv420p, without audio. Full-file FFmpeg decoding completed without errors. Review frames were inspected across all 21 detailed-cut scenes, all 17 main-cut scenes and all 10 short-cut scenes; captions remain outside the captured UI. The detailed cut uses the same authentic source recording, restores previously omitted interactions, and does not require new AI calls. Capture used the public demo and actual OpenAI replies. The recorded invitation was stopped after capture. Human feedback on presentation pace remains separate from these technical checks.

## English narrated 720p edition

The requested narrated version uses a separate, video-specific English script, rather than the desktop slide-pitch script. Exact speech text is stored in `scripts/demo-video/narration.en.json` (332 whitespace-delimited words, 21 scene paragraphs).

```powershell
# Uses the already authorized server-side OpenAI key; never prints its value.
# Existing saved narration is reused rather than regenerated automatically.
node --env-file=.env scripts/demo-video/narrate.mjs
python scripts/demo-video/mix-narration.py --dir output/demo-video --video 'C:/absolute/path/to/Secret-Tender-Demo-180s-720p.mp4'
```

Speech was synthesized once with OpenAI `gpt-4o-mini-tts-2025-12-15`, built-in voice `marin`, at normal speed. The source WAV lasts 123.750 seconds. A word-timestamp transcription supplies actual phrase boundaries; the editor inserts reading pauses between scenes without changing voice speed. The output explicitly labels the voice as AI-generated. Model/API compatibility should be checked again for future generations; see the [official speech guide](https://developers.openai.com/api/docs/guides/text-to-speech).

Original audio, exact spoken text, provider provenance, word timestamps and source-to-video phrase mapping remain under ignored `output/demo-video/narration/`. The script does not send stage directions to speech synthesis or export credentials. Failed calls retain originals and do not retry automatically.

Delivered `Secret-Tender-Demo-180s-720p-Narrated-EN.mp4`: 180.000 seconds, 1280×720, 30 fps, H.264 plus AAC mono at 48 kHz, 9,744,897 bytes. Full-file decoding passed; measured peak volume is −1.4 dB. All 21 phrases fit their scenes. Script/transcription token similarity is 99.7%; the sole difference is a transcription of “response” as “responds”. Direct listening was unavailable to this host, so a subjective listening review is not marked passed. The video and plain English manuscript were copied to the desktop and verified by SHA-256.
