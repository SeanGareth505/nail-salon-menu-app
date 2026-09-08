import { readFile, writeFile, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const DESIGN_CLIENT_ID = '59637612-477b-4836-a601-b0589eda7704';
const SCOPES = ['user:design:read', 'user:design:write'];
const TOKEN_URL = 'https://platform.claude.com/v1/oauth/token';
const MANUAL_REDIRECT_URL = 'https://platform.claude.com/oauth/code/callback';
const DIR = join(homedir(), '.config', 'claude-design-mcp');
const PENDING = join(DIR, 'pending-oauth.json');
const STORE_PATH = join(DIR, 'credentials.json');

const pasted = process.argv[2]?.trim();
if (!pasted) {
  console.error('Usage: node scripts/complete-design-login.mjs CODE#STATE');
  process.exit(1);
}

const pending = JSON.parse(await readFile(PENDING, 'utf8'));
const [code, state] = pasted.split('#');
if (!code || !state) {
  console.error('Invalid format. Paste the full CODE#STATE value.');
  process.exit(1);
}
if (state !== pending.state) {
  console.error(`State mismatch. Expected ${pending.state}, got ${state}.`);
  process.exit(1);
}

const res = await fetch(TOKEN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: MANUAL_REDIRECT_URL,
    client_id: DESIGN_CLIENT_ID,
    code_verifier: pending.verifier,
    state,
  }),
});
const text = await res.text();
if (!res.ok) {
  console.error(`Token exchange failed (${res.status}): ${text.slice(0, 500)}`);
  process.exit(1);
}

const data = JSON.parse(text);
const store = {
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  scopes: typeof data.scope === 'string' ? data.scope.split(' ').filter(Boolean) : SCOPES,
  clientId: DESIGN_CLIENT_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
await writeFile(STORE_PATH, JSON.stringify(store, null, 2), { mode: 0o600 });
await rm(PENDING, { force: true });
console.log('Design-system access authorized.');
console.log(`Saved credentials to ${STORE_PATH}`);
console.log(`Scopes: ${store.scopes.join(' ')}`);
console.log(`Expires: ${new Date(store.expiresAt).toISOString()}`);
