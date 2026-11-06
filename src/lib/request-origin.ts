/** Resolve the public scheme only for an explicitly configured proxy hostname. */
export function requestOrigin(request: {url: string; headers: {get(name: string): string | null}}, publicOrigin = process.env.MASALA_PUBLIC_ORIGIN): string {
  const internal = new URL(request.url);
  const expected = new URL(`${internal.protocol}//${request.headers.get('host') || internal.host}`);
  if (publicOrigin) {
    const configured = new URL(publicOrigin);
    if (configured.protocol !== 'https:' || configured.username || configured.password || configured.search || configured.hash || configured.pathname !== '/') throw new Error('MASALA_PUBLIC_ORIGIN must be an HTTPS origin');
    if (expected.host === configured.host) return configured.origin;
  }
  return expected.origin;
}
