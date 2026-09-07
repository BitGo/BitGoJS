import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { selectSmallestSufficientUnspent } from './live-matrix-live';
import {
  loadTestEnvOverlay,
  parseTestEnvConfig,
  readUserSessionToken,
  testEnvConfigOverlay,
  userSessionPath,
} from './test-env-config';

const validConfig = {
  environment: 'test',
  coin: 'tbtcstxsignet',
  enterprise: { id: '62f290357776000008c345b42f96de70' },
  users: {
    initiator: { username: 'test-user+1@test.bitgo.com', userId: 'init-id' },
    approver: { username: 'test-user+2@test.bitgo.com', userId: 'approver-id' },
  },
  wallets: { custodialStake: { label: 'pox5-live-test-tbtcstxsignet-custodial-stake', id: 'wallet-id' } },
  staker: { address: 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6' },
  sessionDir: '/tmp/unused-sessions',
};

describe('PoX-5 test env config (offline)', function () {
  it('accepts the test-only config shape', function () {
    const parsed = parseTestEnvConfig(validConfig);
    assert.equal(parsed.users.approver.username, 'test-user+2@test.bitgo.com');
    assert.equal(parsed.wallets.custodialStake.id, 'wallet-id');
  });

  it('rejects other environments, coins and missing sections', function () {
    assert.throws(() => parseTestEnvConfig({ ...validConfig, environment: 'staging' }), /environment must be "test"/);
    assert.throws(() => parseTestEnvConfig({ ...validConfig, coin: 'tbtcstx' }), /coin must be/);
    assert.throws(() => parseTestEnvConfig({ ...validConfig, users: undefined }), /sections are required/);
    assert.throws(
      () => parseTestEnvConfig({ ...validConfig, users: { ...validConfig.users, approver: { username: 'x' } } }),
      /users.approver.userId is required/
    );
  });

  it('maps user sessions to the per-user session file naming used by bitgo-http', function () {
    assert.equal(
      userSessionPath('/home/u/.bgadmin/user-sessions', 'test-user+1@test.bitgo.com'),
      '/home/u/.bgadmin/user-sessions/test-test-user+1@test.bitgo.com.json'
    );
    assert.match(userSessionPath('~/.bgadmin/user-sessions', 'a b@x.com'), /test-a_b@x\.com\.json$/);
  });

  it('refuses expired or near-expiry sessions', async function () {
    const dir = await mkdtemp(join(tmpdir(), 'pox5-session-'));
    const path = join(dir, 'session.json');
    await writeFile(path, JSON.stringify({ accessToken: 'token-value', expiresAt: 1_000 }));
    await assert.rejects(() => readUserSessionToken(path, 999), /expired or near expiry/);
    assert.equal(await readUserSessionToken(path, 1), 'token-value');
  });

  it('overlays config identifiers and session tokens onto the harness env keys', async function () {
    const dir = await mkdtemp(join(tmpdir(), 'pox5-overlay-'));
    await writeFile(
      join(dir, 'test-test-user+1@test.bitgo.com.json'),
      JSON.stringify({ accessToken: 'init-token', expiresAt: 10_000 })
    );
    await writeFile(
      join(dir, 'test-test-user+2@test.bitgo.com.json'),
      JSON.stringify({ accessToken: 'approver-token', expiresAt: 10_000 })
    );
    await writeFile(
      join(dir, 'test-custodyadmin@test.bitgo.com.json'),
      JSON.stringify({ accessToken: 'custodyadmin-token', expiresAt: 10_000 })
    );
    const overlay = await testEnvConfigOverlay(
      parseTestEnvConfig({
        ...validConfig,
        sessionDir: dir,
        users: {
          ...validConfig.users,
          custodyadmin: {
            username: 'custodyadmin@test.bitgo.com',
            userId: 'custodyadmin-id',
            bitgoAdmin: true,
          },
        },
      }),
      1
    );
    assert.equal(overlay.POX5_LIVE_ENTERPRISE_TEST, '62f290357776000008c345b42f96de70');
    assert.equal(overlay.BITGO_TOKEN_TEST, 'init-token');
    assert.equal(overlay.BITGO_APPROVER_TOKEN_TEST, 'approver-token');
    assert.equal(overlay.BITGO_CUSTODYADMIN_TOKEN_TEST, 'custodyadmin-token');
    assert.equal(overlay.POX5_LIVE_CUSTODYADMIN_USERNAME_TEST, 'custodyadmin@test.bitgo.com');
    assert.equal(overlay.POX5_LIVE_CUSTODYADMIN_USER_ID_TEST, 'custodyadmin-id');
    assert.equal(overlay.POX5_STACKS_STAKER_ADDRESS, 'STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6');
  });

  it('omits the custodyadmin overlay keys when no custodyadmin session is available', async function () {
    const dir = await mkdtemp(join(tmpdir(), 'pox5-overlay-'));
    await writeFile(
      join(dir, 'test-test-user+1@test.bitgo.com.json'),
      JSON.stringify({ accessToken: 'init-token', expiresAt: 10_000 })
    );
    await writeFile(
      join(dir, 'test-test-user+2@test.bitgo.com.json'),
      JSON.stringify({ accessToken: 'approver-token', expiresAt: 10_000 })
    );
    const withUser = await testEnvConfigOverlay(
      parseTestEnvConfig({
        ...validConfig,
        sessionDir: dir,
        users: {
          ...validConfig.users,
          custodyadmin: { username: 'custodyadmin@test.bitgo.com', userId: 'custodyadmin-id' },
        },
      }),
      1
    );
    assert.equal('BITGO_CUSTODYADMIN_TOKEN_TEST' in withUser, false);
    const withoutUser = await testEnvConfigOverlay(parseTestEnvConfig({ ...validConfig, sessionDir: dir }), 1);
    assert.equal('BITGO_CUSTODYADMIN_TOKEN_TEST' in withoutUser, false);
  });

  it('returns no overlay when the config file is absent', async function () {
    const dir = await mkdtemp(join(tmpdir(), 'pox5-noconfig-'));
    assert.deepEqual(await loadTestEnvOverlay(dir), {});
  });
});

describe('PoX-5 funding source selection (offline)', function () {
  it('prefers the smallest confirmed unspent that covers the minimum', async function () {
    const candidates = [
      { outpoint: 'b:0', amountSats: 50_000_000, confirmations: 3 },
      { outpoint: 'a:1', amountSats: 40_000, confirmations: 1 },
      { outpoint: 'a:0', amountSats: 40_000, confirmations: 1 },
      { outpoint: 'c:0', amountSats: 10_000, confirmations: 5 },
      { outpoint: 'd:0', amountSats: 90_000, confirmations: 0 },
    ];
    assert.equal(selectSmallestSufficientUnspent(candidates, 35_000), 'a:0');
  });

  it('returns nothing when no confirmed unspent covers the minimum, so the caller funds by faucet', async function () {
    assert.equal(
      selectSmallestSufficientUnspent([{ outpoint: 'c:0', amountSats: 10_000, confirmations: 5 }], 35_000),
      undefined
    );
  });
});
