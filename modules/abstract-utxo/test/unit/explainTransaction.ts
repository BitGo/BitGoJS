import assert from 'assert';

import { common, Triple, Wallet } from '@bitgo/sdk-core';
import nock = require('nock');

import { bip322Fixtures } from './fixtures/bip322/fixtures';
import { psbtTxHex } from './fixtures/psbtHexProof';
import { defaultBitGo, getUtxoCoin } from './util';

nock.disableNetConnect();

const bgUrl = common.Environments[defaultBitGo.getEnv()].uri;

describe('Explain Transaction', function () {
  afterEach(function () {
    nock.cleanAll();
  });

  describe('Verify paygo output when explaining psbt transaction', function () {
    const coin = getUtxoCoin('tbtc4');

    const pubs: Triple<string> = [
      'xpub661MyMwAqRbcFaKvNBFdV6HY7ibXxFSbL7rDjY1cVM8s3pGPTNKfjTu8SmatNZ7AcZQehSqcEnC7vezMoprQvhqQUszLhuY4G8ruv6PGEr7',
      'xpub661MyMwAqRbcGkAVVQVHrEYQA4hfbDW9Rpn35b6sXA9TSBd5Qzjwz7F6Weje57kBVeVfimfJjXutwUDBSMz5yRwsWik9gNyxrdvSaJbjgi6',
      'xpub661MyMwAqRbcGCCL3GYNbvKs1t5k5yeKZcV5smto9T5Z17zkcgRF4X9uzDfPxMHHedwF4JcJ6kpg8M2NWHEFC5LMSv1t3nMMm1GC9PcVmq5',
    ];

    const keyIds = ['key-user', 'key-backup', 'key-bitgo'];

    function nockKeyFetch(): void {
      keyIds.forEach((id, i) => {
        nock(bgUrl).get(`/api/v2/${coin.getChain()}/key/${id}`).reply(200, { pub: pubs[i] });
      });
    }

    it('should detect and verify paygo address proof in PSBT', async function () {
      nockKeyFetch();
      const wallet = new Wallet(defaultBitGo, coin, {
        id: 'mock-wallet-id',
        coin: coin.getChain(),
        keys: keyIds,
      });
      await coin.explainTransaction(psbtTxHex, wallet);
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
      assert.ok('signatures' in result);
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
      assert.ok('signatures' in result);
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
      assert.ok('signatures' in result);
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
