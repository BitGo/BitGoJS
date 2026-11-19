import * as assert from 'assert';
import * as sinon from 'sinon';
import { CoinFeature } from '@bitgo/statics';
import { IBaseCoin } from '../../../../../src/bitgo/baseCoin';
import {
  isCoinWithSerializedTxHexVerification,
  shouldVerifyWithSerializedTxHex,
} from '../../../../../src/bitgo/utils/tss/serializedTxHexVerify';
import { SignableTransaction } from '../../../../../src/bitgo/utils/tss/baseTypes';

describe('serializedTxHexVerify', function () {
  const sampleTx: SignableTransaction = {
    serializedTxHex: 'f86c808504a817c80082520894' + '00'.repeat(20) + '80808080',
    signableHex: 'f86c808504a817c80082520894' + '00'.repeat(20) + '80808080',
  };

  it('returns true when coin has TSS_VERIFY_USE_SERIALIZED_TX_HEX feature', function () {
    const coin = {
      getConfig: () => ({ features: [CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX] }),
    } as unknown as IBaseCoin;

    assert.strictEqual(shouldVerifyWithSerializedTxHex(coin), true);
    assert.strictEqual(shouldVerifyWithSerializedTxHex(coin, sampleTx), true);
  });

  it('delegates to coin.shouldVerifyWithSerializedTxHex when unsignedTx is provided', function () {
    const check = sinon.stub().returns(true);
    const coin = {
      getConfig: () => ({ features: [CoinFeature.EIP1559] }),
      shouldVerifyWithSerializedTxHex: check,
    } as unknown as IBaseCoin;

    assert.strictEqual(isCoinWithSerializedTxHexVerification(coin), true);
    assert.strictEqual(shouldVerifyWithSerializedTxHex(coin, sampleTx), true);
    assert.strictEqual(check.callCount, 1);
    assert.strictEqual(check.firstCall.args[0], sampleTx);
  });

  it('returns false when coin hook returns false or unsignedTx is omitted', function () {
    const check = sinon.stub().returns(false);
    const coin = {
      getConfig: () => ({ features: [CoinFeature.EIP1559] }),
      shouldVerifyWithSerializedTxHex: check,
    } as unknown as IBaseCoin;

    assert.strictEqual(shouldVerifyWithSerializedTxHex(coin, sampleTx), false);
    assert.strictEqual(shouldVerifyWithSerializedTxHex(coin), false);
    assert.strictEqual(check.callCount, 1);
  });

  it('short-circuits on CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX without calling coin hook', function () {
    const check = sinon.stub().returns(false);
    const coin = {
      getConfig: () => ({ features: [CoinFeature.TSS_VERIFY_USE_SERIALIZED_TX_HEX] }),
      shouldVerifyWithSerializedTxHex: check,
    } as unknown as IBaseCoin;

    assert.strictEqual(shouldVerifyWithSerializedTxHex(coin, sampleTx), true);
    assert.strictEqual(check.callCount, 0);
  });

  it('isCoinWithSerializedTxHexVerification type guard', function () {
    assert.strictEqual(isCoinWithSerializedTxHexVerification({ shouldVerifyWithSerializedTxHex: () => true }), true);
    assert.strictEqual(isCoinWithSerializedTxHexVerification({}), false);
    assert.strictEqual(isCoinWithSerializedTxHexVerification(null), false);
  });
});
