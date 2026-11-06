import test from 'node:test';
import assert from 'node:assert/strict';
import {requestOrigin} from '../src/lib/request-origin';

const request = (host: string, extra: Record<string, string> = {}) => ({url: 'http://localhost:3000/api/session', headers: new Headers({host, ...extra})});
test('HTTPS sharing applies only to the configured host; forwarded headers cannot choose the origin', () => {
  const shared = 'https://demo.example.com';
  assert.equal(requestOrigin(request('demo.example.com'), shared), shared);
  assert.equal(requestOrigin(request('127.0.0.1:3000'), shared), 'http://127.0.0.1:3000');
  assert.equal(requestOrigin(request('evil.example', {'x-forwarded-host': 'demo.example.com', 'x-forwarded-proto': 'https'}), shared), 'http://evil.example');
  assert.equal(requestOrigin(request('demo.example.com'), ''), 'http://demo.example.com');
  for (const invalid of ['http://demo.example.com', 'https://demo.example.com/path', 'https://user@demo.example.com', 'https://demo.example.com?x=1']) assert.throws(() => requestOrigin(request('demo.example.com'), invalid));
});
