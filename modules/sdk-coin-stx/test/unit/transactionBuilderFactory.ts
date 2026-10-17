import assert from 'assert';

import { coins } from '@bitgo/statics';
import { createCoinbasePayload, deserializeTransaction } from '@stacks/transactions';

import { StxLib } from '../../src';
import * as testData from './resources';

describe('Stx TransactionBuilderFactory', function () {
  const factory = new StxLib.TransactionBuilderFactory(coins.get('stx'));

  it('rejects an empty raw transaction', function () {
    assert.throws(() => factory.from(''), /Raw transaction is empty/);
  });

  it('rejects a raw transaction that cannot be deserialized', function () {
    assert.throws(() => factory.from('deadbeef'), /Invalid raw transaction/);
  });

  it('does not implement wallet initialization', function () {
    assert.throws(() => factory.getWalletInitializationBuilder(), /method not implemented/);
  });

  it('rejects a transaction with an unsupported payload type', function () {
    const tx = deserializeTransaction(testData.RAW_TX_UNSIGNED);
    // replace the token-transfer payload with a coinbase payload (PayloadType.Coinbase is not handled)
    (tx as unknown as { payload: unknown }).payload = createCoinbasePayload(new Uint8Array(32));
    const raw = tx.serialize();
    assert.throws(() => factory.from(raw), /There was an error parsing the raw transaction/);
  });
});
