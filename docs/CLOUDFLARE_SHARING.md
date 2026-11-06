# Temporary friend demo sharing

Use Cloudflare Quick Tunnel against the production server bound to `127.0.0.1:3000`.
The binary and tunnel logs/PIDs/URL are local under ignored `.data/`.

1. Start `cloudflared tunnel --url http://127.0.0.1:3000 --no-autoupdate --protocol http2`.
2. Set server environment `MASALA_PUBLIC_ORIGIN` to the exact generated HTTPS origin, then start/restart `next start --hostname 127.0.0.1`.
3. Share the generated URL. It is accessible to anyone holding the link. The PC, app server and tunnel must remain running; a new tunnel gets a different URL.
4. Stop the process identified by `.data/cloudflare-tunnel.pid` to end sharing. Verify the PID still belongs to cloudflared before stopping it.

`requestOrigin` uses the configured scheme only when the actual Host matches the configured public host. It does not trust arbitrary forwarded host/protocol headers. POST origin checks and same-site restrictions remain enabled, and session/story cookies use Secure on the public HTTPS origin. Local HTTP access still works.

Verified via public HTTPS: page load, session, secure cookies, rejection of a different Origin, independent Asha/Mira story replies and reload persistence, live OpenAI twin preview, and 404s for `.env`, `.git/config` and `.data` paths. Unit tests include host matching and forwarded-header spoofing.

Official guide: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
