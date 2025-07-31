import assert from 'assert';

import { hashMessageWithTag } from '../../src/bip322';

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
});
