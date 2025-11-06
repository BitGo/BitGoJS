import assert from 'assert';

import { Triple } from '@bitgo/sdk-core';

import { bip322Fixtures } from './fixtures/bip322/fixtures';
import { psbtTxHex } from './fixtures/psbtHexProof';
import { getUtxoCoin } from './util';

describe('Explain Transaction', function () {
  describe('Verify paygo output when explaining psbt transaction', function () {
    const coin = getUtxoCoin('tbtc4');

    it('should detect and verify paygo address proof in PSBT', async function () {
      // Call explainTransaction
      await coin.explainTransaction(psbtTxHex);
    });
  });

  describe('BIP322 Proof', function () {
    const coin = getUtxoCoin('btc');
    const pubs = bip322Fixtures.valid.rootWalletKeys.triple.map((b) => b.neutered().toBase58()) as Triple<string>;

    it('should successfully run with a user nonce', async function () {
      const psbtHex = bip322Fixtures.valid.userNonce;
      const result = await coin.explainTransaction({ txHex: psbtHex, pubs });
      assert.strictEqual(result.outputAmount, '0');
      assert.strictEqual(result.changeAmount, '0');
      assert.strictEqual(result.outputs.length, 1);
      assert.strictEqual(result.outputs[0].address, 'scriptPubKey:6a');
      assert.strictEqual(result.fee, '0');
      assert.strictEqual(result.signatures, 0);
      assert.ok(result.messages);
      result.messages?.forEach((obj) => {
        assert.ok(obj.address);
        assert.ok(obj.message);
        assert.strictEqual(obj.message, bip322Fixtures.valid.message);
      });
    });

    it('should successfully run with a user signature', async function () {
      const psbtHex = bip322Fixtures.valid.userSignature;
      const result = await coin.explainTransaction({ txHex: psbtHex, pubs });
      assert.strictEqual(result.outputAmount, '0');
      assert.strictEqual(result.changeAmount, '0');
      assert.strictEqual(result.outputs.length, 1);
      assert.strictEqual(result.outputs[0].address, 'scriptPubKey:6a');
      assert.strictEqual(result.fee, '0');
      assert.strictEqual(result.signatures, 1);
      assert.ok(result.messages);
      result.messages?.forEach((obj) => {
        assert.ok(obj.address);
        assert.ok(obj.message);
        assert.strictEqual(obj.message, bip322Fixtures.valid.message);
      });
    });

    it('should successfully run with a hsm signature', async function () {
      const psbtHex = bip322Fixtures.valid.hsmSignature;
      const result = await coin.explainTransaction({ txHex: psbtHex, pubs });
      assert.strictEqual(result.outputAmount, '0');
      assert.strictEqual(result.changeAmount, '0');
      assert.strictEqual(result.outputs.length, 1);
      assert.strictEqual(result.outputs[0].address, 'scriptPubKey:6a');
      assert.strictEqual(result.fee, '0');
      assert.strictEqual(result.signatures, 2);
      assert.ok(result.messages);
      result.messages?.forEach((obj) => {
        assert.ok(obj.address);
        assert.ok(obj.message);
        assert.strictEqual(obj.message, bip322Fixtures.valid.message);
      });
    });
  });
});
