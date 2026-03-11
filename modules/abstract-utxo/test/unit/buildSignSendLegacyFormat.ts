import * as assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import { hasPsbtMagic } from '@bitgo/wasm-utxo';
import nock = require('nock');
import { common, HalfSignedUtxoTransaction } from '@bitgo/sdk-core';
import { getSeed } from '@bitgo/sdk-test';

import {
  defaultBitGo,
  encryptKeychain,
  getDefaultWalletKeys,
  getMinUtxoCoins,
  getUtxoWallet,
  keychainsBase58,
  getScriptTypes,
} from './util';

const walletPassphrase = 'gabagool';

const rootWalletKeys = getDefaultWalletKeys();
const keyDocumentObjects = rootWalletKeys.triple.map((bip32, keyIdx) => ({
  id: getSeed(keychainsBase58[keyIdx].pub).toString('hex'),
  pub: bip32.neutered().toBase58(),
  source: ['user', 'backup', 'bitgo'][keyIdx],
  encryptedPrv: encryptKeychain(walletPassphrase, keychainsBase58[keyIdx]),
  coinSpecific: {},
}));

// Test that txFormat: 'legacy' converts the signed PSBT back to legacy (non-PSBT) format.
// Uses BTC with legacy-compatible script types (no taproot).
describe('prebuildAndSign-returnLegacyFormat', function () {
  const coin = getMinUtxoCoins().find((c) => c.getChain() === 'btc')!;
  const inputScripts = getScriptTypes(coin, 'legacy');
  const wallet = getUtxoWallet(coin, {
    coinSpecific: { addressVersion: 'base58' },
    keys: keyDocumentObjects.map((k) => k.id),
    id: 'walletId',
  });
  const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;
  let prebuild: utxolib.bitgo.UtxoPsbt;
  let recipient: { address: string; amount: string };
  const fee = BigInt(10000);

  before(function () {
    const outputAmount = BigInt(inputScripts.length) * BigInt(1e8) - fee;
    const outputScriptType: utxolib.bitgo.outputScripts.ScriptType = 'p2sh';
    const outputChain = utxolib.bitgo.getExternalChainCode(outputScriptType);
    const outputAddress = utxolib.bitgo.getWalletAddress(rootWalletKeys, outputChain, 0, coin.network);
    recipient = { address: outputAddress, amount: outputAmount.toString() };
    prebuild = utxolib.testutil.constructPsbt(
      inputScripts.map((s) => ({ scriptType: s, value: BigInt(1e8) })),
      [{ scriptType: outputScriptType, value: outputAmount }],
      coin.network,
      rootWalletKeys,
      'unsigned'
    );
    utxolib.bitgo.addXpubsToPsbt(prebuild, rootWalletKeys);
  });

  afterEach(nock.cleanAll);

  it('should build with PSBT internally but return legacy format to the caller', async function () {
    // WP receives a PSBT build request (getExtraPrebuildParams maps 'legacy' -> 'psbt-lite')
    const nocks: nock.Scope[] = [];
    nocks.push(
      nock(bgUrl)
        .post(`/api/v2/${coin.getChain()}/wallet/${wallet.id()}/tx/build`)
        .reply(200, { txHex: prebuild.toHex(), txInfo: {} })
    );
    nocks.push(nock(bgUrl).get(`/api/v2/${coin.getChain()}/public/block/latest`).reply(200, { height: 1000 }));
    keyDocumentObjects.forEach((keyDocument) => {
      nocks.push(nock(bgUrl).get(`/api/v2/${coin.getChain()}/key/${keyDocument.id}`).times(3).reply(200, keyDocument));
    });

    // The prebuild from WP is a PSBT
    assert.strictEqual(hasPsbtMagic(Buffer.from(prebuild.toHex(), 'hex')), true);

    // The caller requests txFormat: 'legacy'
    const res = (await wallet.prebuildAndSignTransaction({
      recipients: [recipient],
      walletPassphrase,
      txFormat: 'legacy',
    })) as HalfSignedUtxoTransaction;

    nocks.forEach((n) => assert.ok(n.isDone()));

    // The signed result is converted back to legacy (non-PSBT) format
    assert.strictEqual(hasPsbtMagic(Buffer.from(res.txHex, 'hex')), false);
  });
});
