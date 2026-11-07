# Recording the Secret Tender demo

Two browser-demo cuts: **90 seconds** and **30 seconds**, 1920×1080, English UI, English burned-in captions, no audio.

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
```

The editor reads the measured source ranges in `capture.json`, speeds up selected source ranges, pads the original 1920×960 screen with a caption band, and produces H.264/yuv420p MP4 files with fast-start metadata. A shorter source shot holds its final frame rather than inventing action. Captions and edit timelines are saved alongside the outputs for inspection. Windows Segoe UI is the default font; set `DEMO_VIDEO_FONT` to another local font path if needed.

Outputs:

- `output/demo-video/Secret-Tender-Demo-90s.mp4`
- `output/demo-video/Secret-Tender-Demo-30s.mp4`

Verify both durations and dimensions with FFprobe, decode the full files, and inspect frames from each scene before sharing. MP4 binaries are local deliverables and are not pushed to Git or deployed with the website.

## Verified delivery — 2026-11-07

| Cut | Duration | Frames | Size |
| --- | --- | --- | --- |
| Main | 90.000 s | 2,700 | 9,223,363 bytes |
| Short | 30.000 s | 900 | 4,898,434 bytes |

Both files are 1920×1080, 30 fps, H.264/yuv420p, without audio. Full-file FFmpeg decoding completed without errors. Review frames were inspected across all 17 main-cut scenes and all 10 short-cut scenes; captions remain outside the captured UI. Capture used the public demo and actual OpenAI replies. The recorded invitation was stopped after capture. Human feedback on presentation pace remains separate from these technical checks.
