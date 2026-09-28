import assert from 'assert';
import * as sinon from 'sinon';
import { IBaseCoin, KeychainsTriplet } from '../../../../src/bitgo/baseCoin';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';
import { MpcUtils } from '../../../../src/bitgo/utils/mpcUtils';
import { RequestTracer } from '../../../../src';

class TestMpcUtils extends MpcUtils {
  createKeychains(): Promise<KeychainsTriplet> {
    return Promise.reject(new Error('unused'));
  }
}

describe('populateIntent unwrap', function () {
  const reqId = new RequestTracer();
  let mpcUtils: TestMpcUtils;
  let coin: IBaseCoin;

  beforeEach(function () {
    const mockBitgo = { getEnv: sinon.stub().returns('test') } as unknown as BitGoBase;
    coin = {
      getChain: () => 'hteth',
      getFamily: () => 'eth',
      isEVM: () => true,
      supportsTss: () => true,
    } as unknown as IBaseCoin;
    mpcUtils = new TestMpcUtils(mockBitgo, coin);
  });

  afterEach(function () {
    sinon.restore();
  });

  it('flattens unwrapParams onto unwrap intent', function () {
    const unwrapParams = { tokenName: 'hteth:cusdt', amount: '1000000' };
    const feeOptions = { maxFeePerGas: 3000000000, maxPriorityFeePerGas: 2000000000 };

    const intent = mpcUtils.populateIntent(coin, {
      reqId,
      intentType: 'unwrap',
      unwrapParams,
      feeOptions,
    });

    assert.strictEqual(intent.intentType, 'unwrap');
    assert.strictEqual(intent.tokenName, unwrapParams.tokenName);
    assert.strictEqual(intent.amount, unwrapParams.amount);
    assert.deepStrictEqual(intent.feeOptions, feeOptions);
    assert.strictEqual(intent.recipients, undefined);
  });

  it('allows partial unshield amounts', function () {
    const unwrapParams = { tokenName: 'hteth:cusdt', amount: '1' };

    const intent = mpcUtils.populateIntent(coin, {
      reqId,
      intentType: 'unwrap',
      unwrapParams,
    });

    assert.strictEqual(intent.amount, '1');
  });

  it('requires unwrapParams for unwrap', function () {
    assert.throws(
      () =>
        mpcUtils.populateIntent(coin, {
          reqId,
          intentType: 'unwrap',
        }),
      /unwrapParams/
    );
  });

  it('rejects non-positive unwrapParams.amount', function () {
    assert.throws(
      () =>
        mpcUtils.populateIntent(coin, {
          reqId,
          intentType: 'unwrap',
          unwrapParams: { tokenName: 'hteth:cusdt', amount: '0' },
        }),
      /unwrapParams.amount/
    );
  });
});
