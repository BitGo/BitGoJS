import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('PoX-5 dashboard', function () {
  it('exposes both shared network profiles and the development seed default', async function () {
    const page = await readFile(join(__dirname, 'dashboard-public', 'index.html'), 'utf8');

    assert.match(page, /tbtcstx \/ public testnet/);
    assert.match(page, /tbtcstxprivate1 \/ private testnet/);
    assert.match(page, /Direct RPC \/ no indexer-utxo/);
    assert.match(page, /value="too many secrets"/);
  });

  it('offers the complete requested lifecycle controls', async function () {
    const page = await readFile(join(__dirname, 'dashboard-public', 'index.html'), 'utf8');

    for (const action of ['up', 'faucet', 'stake', 'early-exit', 'late-exit']) {
      assert.match(page, new RegExp(`data-action="${action}"`));
    }
  });

  it('exposes separate nodes, wallet, BitGo API, and stake pages', async function () {
    const page = await readFile(join(__dirname, 'dashboard-public', 'index.html'), 'utf8');
    const app = await readFile(join(__dirname, 'dashboard-public', 'app.js'), 'utf8');

    for (const route of ['nodes', 'wallets', 'bitgo-api', 'staked-funds']) {
      assert.match(page, new RegExp(`href="#/${route}"`));
      assert.match(page, new RegExp(`data-page="${route}"`));
    }
    assert.match(page, /id="network"/);
    assert.match(page, /id="fullnodeMode"/);
    assert.match(page, /id="seedPhrase"/);
    assert.match(page, /id="accountPreset"/);
    assert.match(page, /<option value="private1-account5" selected>/);
    assert.match(page, /id="signerManager"/);
    assert.match(page, /id="bondIndex"/);
    assert.match(page, /id="logOutput"/);
    for (const endpoint of ['/api/btc-wallet', '/api/stx-wallet', '/api/staked-funds']) {
      assert.ok(app.includes(endpoint));
    }
    for (const endpoint of [
      '/api/bitgo/status',
      '/api/bitgo/wallets',
      '/api/bitgo/wallets/create',
      '/api/bitgo/delegations',
      '/api/bitgo/deposits/prepare',
      '/api/bitgo/deposits/send',
      '/api/bitgo/withdrawals/prepare',
      '/api/bitgo/withdrawals/send',
    ]) {
      assert.ok(app.includes(endpoint));
    }
    assert.doesNotMatch(app, /BITGO_TOKEN_(?:TEST|STAGING)/);
    for (const field of ['bitgoCreatePassphrase', 'bitgoDepositPassphrase', 'bitgoWithdrawalPassphrase']) {
      assert.match(page, new RegExp(`id="${field}"[\\s\\S]*?type="password"`));
    }
  });
});
