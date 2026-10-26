import assert from 'assert';
import * as sinon from 'sinon';
import { IBaseCoin, KeychainsTriplet } from '../../../../src/bitgo/baseCoin';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';
import { RequestTracer } from '../../../../src';
import { MpcUtils } from '../../../../src/bitgo/utils/mpcUtils';
import { PopulatedIntent, PrebuildTransactionWithIntentOptions } from '../../../../src/bitgo/utils/tss/baseTypes';

class TestMpcUtils extends MpcUtils {
  createKeychains(): Promise<KeychainsTriplet> {
    return Promise.reject(new Error('unused'));
  }
}

describe('populateIntent cantonBroadridgeStandingDelegation', function () {
  const reqId = new RequestTracer();
  let mpcUtils: TestMpcUtils;
  let coin: IBaseCoin;

  beforeEach(function () {
    const mockBitgo = { getEnv: sinon.stub().returns('test') } as unknown as BitGoBase;
    coin = {
      getChain: () => 'tcanton',
      getFamily: () => 'canton',
      isEVM: () => false,
      supportsTss: () => true,
      setCoinSpecificFieldsInIntent: (intent: PopulatedIntent, params: PrebuildTransactionWithIntentOptions) => {
        intent.executorPartyId = params.executorPartyId;
      },
    } as unknown as IBaseCoin;
    mpcUtils = new TestMpcUtils(mockBitgo, coin);
  });

  it('populates the executor party without recipients', function () {
    const intent = mpcUtils.populateIntent(coin, {
      reqId,
      intentType: 'cantonBroadridgeStandingDelegation',
      executorPartyId: 'executor::1220bbbb',
    });

    assert.strictEqual(intent.intentType, 'cantonBroadridgeStandingDelegation');
    assert.strictEqual(intent.executorPartyId, 'executor::1220bbbb');
    assert.strictEqual(intent.recipients, undefined);
  });

  it('requires executorPartyId', function () {
    assert.throws(
      () =>
        mpcUtils.populateIntent(coin, {
          reqId,
          intentType: 'cantonBroadridgeStandingDelegation',
        }),
      /executorPartyId.*required/
    );
  });

  it('rejects the intent for non-Canton coins', function () {
    const nonCantonCoin = { ...coin, getFamily: () => 'eth' } as unknown as IBaseCoin;
    assert.throws(
      () =>
        mpcUtils.populateIntent(nonCantonCoin, {
          reqId,
          intentType: 'cantonBroadridgeStandingDelegation',
          executorPartyId: 'executor::1220bbbb',
        }),
      /only supported for the canton coin family/
    );
  });
});
