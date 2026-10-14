import 'mocha';
import * as assert from 'assert';

import nock = require('nock');
import { common } from '@bitgo/sdk-core';

import {
  constructPsbt,
  createWasmWalletKeys,
  defaultBitGo,
  getDefaultWalletKeys,
  getDefaultWasmWalletKeys,
  getWalletAddress,
  keychainsBase58,
  getUtxoCoin,
  getUtxoWallet,
} from './util';

nock.disableNetConnect();

describe('Wallet.sweep', function () {
  const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;

  const coin = getUtxoCoin('btc');
  const walletId = '5b34252f1bf349930e34020a00000000';
  const keyIds = ['key-user', 'key-backup', 'key-bitgo'];
  const wallet = getUtxoWallet(coin, { id: walletId, coin: coin.getChain(), keys: keyIds });

  const userPrv = getDefaultWalletKeys().user.toBase58();

  // Sweep destination is derived from unrelated keys so that the prebuild explanation
  // classifies it as an external output rather than a wallet change output.
  const destinationKeys = createWasmWalletKeys('sweep-destination');
  const destination = getWalletAddress('btc', destinationKeys.walletKeys);

  // Sweep-shaped prebuild: a single wallet input spending to a single external output.
  // The /sweepWallet response does not carry a `pubs` field.
  const psbt = constructPsbt(
    [{ scriptType: 'p2sh' as const, value: BigInt(100000) }],
    [{ address: destination, value: BigInt(99000) }],
    'btc',
    getDefaultWasmWalletKeys().walletKeys
  );
  const txHex = Buffer.from(psbt.serialize()).toString('hex');
  const txid = '856e0d0f0f0f5f1a455d0f8c4c9a3a4fbd0b0d7a0d9f4e3c2b1a0f9e8d7c6b5a4';

  function nockSweepPrebuild(): nock.Scope {
    return nock(bgUrl)
      .post(`/api/v2/${coin.getChain()}/wallet/${walletId}/sweepWallet`)
      .reply(200, { txHex, walletId });
  }

  function nockKeychainFetches(): nock.Scope[] {
    return keyIds.map((id, i) =>
      nock(bgUrl).get(`/api/v2/${coin.getChain()}/key/${id}`).reply(200, { pub: keychainsBase58[i].pub })
    );
  }

  function nockSendTransaction(): nock.Scope {
    return nock(bgUrl).post(`/api/v2/${coin.getChain()}/wallet/${walletId}/tx/send`).reply(200, { txid, tx: txHex });
  }

  afterEach(function () {
    nock.cleanAll();
  });

  it('explains the sweep prebuild with the wallet pubs and completes the sweep', async function () {
    const sweepScope = nockSweepPrebuild();
    // The wallet keychains are fetched exactly once: the pubs are used both for
    // explaining the prebuild and for signing, so no further key fetch is expected.
    const keyScopes = nockKeychainFetches();
    const sendScope = nockSendTransaction();

    const result = await wallet.sweep({ address: destination, xprv: userPrv });

    assert.strictEqual(result.txid, txid);
    [sweepScope, ...keyScopes, sendScope].forEach((scope) => assert.ok(scope.isDone()));
  });

  it('rejects a sweep prebuild whose outputs do not match the requested destination', async function () {
    const sweepScope = nockSweepPrebuild();
    const keyScopes = nockKeychainFetches();
    const otherAddress = getWalletAddress('btc', createWasmWalletKeys('other-address').walletKeys);

    await assert.rejects(wallet.sweep({ address: otherAddress, xprv: userPrv }), {
      message: `invalid sweep destination ${destination}, specified ${otherAddress}`,
    });

    [sweepScope, ...keyScopes].forEach((scope) => assert.ok(scope.isDone()));
  });
});
