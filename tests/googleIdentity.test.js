import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGoogleIdentity, bindGoogleIdentity, profileFromCredential, restoreGoogleProfile } from '../src/utils/googleIdentity.js';

const clientId = '123-test.apps.googleusercontent.com';
const claims = { sub: '123456', name: 'Josué Marín', email: 'user@example.com', email_verified: true, aud: clientId, iss: 'https://accounts.google.com', exp: 2000000000 };
const token = (payload) => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;

test('reads Unicode profiles and rejects invalid or expired responses', () => {
  assert.equal(profileFromCredential(token(claims), clientId, 0).name, claims.name);
  for (const changes of [{ aud: 'other' }, { exp: 0 }, { iss: 'other' }, { email_verified: false }, { sub: '' }]) {
    assert.throws(() => profileFromCredential(token({ ...claims, ...changes }), clientId, 0));
  }
  assert.throws(() => profileFromCredential(undefined, clientId));
});

test('restores local profiles without accepting the old simulated accounts', () => {
  const profile = profileFromCredential(token(claims), clientId, 0);
  assert.equal(restoreGoogleProfile(JSON.stringify(profile)).id, claims.sub);
  assert.equal(restoreGoogleProfile(JSON.stringify({ ...profile, id: 'g_123' })), null);
  assert.equal(restoreGoogleProfile('invalid'), null);
  assert.equal(restoreGoogleProfile(null), null);
});

test('waits for delayed SDK load, shares requests, and retries after failure', async () => {
  globalThis.window = {};
  const scripts = [];
  globalThis.document = {
    createElement: () => ({ remove() { this.removed = true; } }),
    head: { appendChild(script) { scripts.push(script); } },
  };
  const first = loadGoogleIdentity();
  assert.equal(loadGoogleIdentity(), first);
  assert.equal(scripts.length, 1);
  scripts[0].onerror();
  await assert.rejects(first, /No se pudo cargar/);
  assert.equal(scripts[0].removed, true);
  const retry = loadGoogleIdentity();
  assert.equal(scripts.length, 2);
  window.google = { accounts: { id: {} } };
  scripts[1].onload();
  assert.equal(await retry, window.google.accounts.id);
  assert.equal(await loadGoogleIdentity(), window.google.accounts.id);
});

test('initializes once and prevents callbacks to closed or replaced modals', () => {
  let config;
  let initialized = 0;
  let received = 0;
  const api = { initialize(value) { initialized++; config = value; } };
  const firstCleanup = bindGoogleIdentity(api, clientId, () => { received += 100; });
  const secondCleanup = bindGoogleIdentity(api, clientId, () => { received++; });
  firstCleanup();
  config.callback({});
  assert.equal(received, 1);
  assert.equal(initialized, 1);
  secondCleanup();
  config.callback({});
  assert.equal(received, 1);
});
