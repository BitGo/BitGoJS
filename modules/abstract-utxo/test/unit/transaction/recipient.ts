import assert from 'assert';

import { getUtxoCoin } from '../util/utxoCoins';

describe('AbstractUtxoCoin.preprocessBuildParams', function () {
  const coin = getUtxoCoin('btc');

  it('does not crash when recipients includes an OP_RETURN output with no address field', function () {
    const params = {
      recipients: [
        { address: '3L3jdUJ9YCpGFjYB2Tuu7iBJes6ZHJFmnS', amount: '999612' },
        { amount: '0', script: '6a0c3230323651312d6175646974' }, // OP_RETURN, no address
      ],
    };
    assert.doesNotThrow(() => coin.preprocessBuildParams(params));
    // The OP_RETURN recipient should be passed through unchanged
    assert.deepStrictEqual(params.recipients[1], { amount: '0', script: '6a0c3230323651312d6175646974' });
  });
});

describe('AbstractUtxoCoin.checkRecipient', function () {
  const coin = getUtxoCoin('btc');

  it('does not throw for OP_RETURN output with no address field', function () {
    // Simulates { amount: '0', script: '6a0c...' } coming from buildParams.recipients
    assert.doesNotThrow(() => {
      coin.checkRecipient({ amount: '0' });
    });
  });

  it('does not throw for script-prefixed address with zero amount', function () {
    assert.doesNotThrow(() => {
      coin.checkRecipient({ address: 'scriptPubKey:6a0c68656c6c6f20776f726c64', amount: '0' });
    });
  });

  it('does not throw for a regular address', function () {
    // A valid mainnet P2PKH address
    assert.doesNotThrow(() => {
      coin.checkRecipient({ address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf', amount: '1000' });
    });
  });

  it('throws when OP_RETURN output (no address) has non-zero amount', function () {
    assert.throws(() => {
      coin.checkRecipient({ amount: '1000' });
    }, /Only zero amounts allowed for non-encodeable scriptPubkeys/);
  });

  it('throws when script-prefixed address has non-zero amount', function () {
    assert.throws(() => {
      coin.checkRecipient({ address: 'scriptPubKey:6a0c68656c6c6f20776f726c64', amount: '500' });
    }, /Only zero amounts allowed for non-encodeable scriptPubkeys/);
  });
});
