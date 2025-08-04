import assert from 'assert';

import { buildToSpendTransaction, hashMessageWithTag } from '../../src/bip322';

import { BIP322_PAYMENT_P2WPKH_FIXTURE } from './bip322.utils';

describe('to_spend', function () {
  describe('Message hashing', function () {
    // Test vectors from BIP322
    // Source: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki#message-hashing
    const fixtures = [
      {
        message: '',
        hash: 'c90c269c4f8fcbe6880f72a721ddfbf1914268a794cbb21cfafee13770ae19f1',
      },
      {
        message: 'Hello World',
        hash: 'f0eb03b1a75ac6d9847f55c624a99169b5dccba2a31f5b23bea77ba270de0a7a',
      },
    ];
    fixtures.forEach(({ message, hash }) => {
      it(`should hash the message "${message}"`, function () {
        const result = hashMessageWithTag(Buffer.from(message));
        assert.deepStrictEqual(
          result.toString('hex'),
          hash,
          `Hash for message "${message}" does not match expected value`
        );
      });
    });
  });

  describe('build to_spend transaction', function () {
    const scriptPubKey = BIP322_PAYMENT_P2WPKH_FIXTURE.output as Buffer;

    // Source: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki#transaction-hashes
    const fixtures = [
      {
        message: '',
        txid: 'c5680aa69bb8d860bf82d4e9cd3504b55dde018de765a91bb566283c545a99a7',
      },
      {
        message: 'Hello World',
        txid: 'b79d196740ad5217771c1098fc4a4b51e0535c32236c71f1ea4d61a2d603352b',
      },
    ];

    fixtures.forEach(({ message, txid }) => {
      it(`should build a to_spend transaction for message "${message}"`, function () {
        const result = buildToSpendTransaction(scriptPubKey, Buffer.from(message));
        const computedTxid = result.getId();
        assert.strictEqual(computedTxid, txid, `Transaction ID for message "${message}" does not match expected value`);
      });
    });
  });
});
