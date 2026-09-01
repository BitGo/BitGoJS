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

describe('populateIntent wrapApprove / wrap', function () {
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

  it('flattens wrapParams onto wrapApprove intent', function () {
    const wrapParams = { tokenName: 'hteth:cusdt', amount: '1000000' };
    const feeOptions = { maxFeePerGas: 3000000000, maxPriorityFeePerGas: 2000000000 };

    const intent = mpcUtils.populateIntent(coin, {
      reqId,
      intentType: 'wrapApprove',
      wrapParams,
      feeOptions,
    });

    assert.strictEqual(intent.intentType, 'wrapApprove');
    assert.strictEqual(intent.tokenName, wrapParams.tokenName);
    assert.strictEqual(intent.amount, wrapParams.amount);
    assert.deepStrictEqual(intent.feeOptions, feeOptions);
    assert.strictEqual(intent.recipients, undefined);
  });

  it('flattens wrapParams onto wrap intent', function () {
    const wrapParams = { tokenName: 'hteth:cusdt', amount: '1000000' };

    const intent = mpcUtils.populateIntent(coin, {
      reqId,
      intentType: 'wrap',
      wrapParams,
    });

    assert.strictEqual(intent.intentType, 'wrap');
    assert.strictEqual(intent.tokenName, wrapParams.tokenName);
    assert.strictEqual(intent.amount, wrapParams.amount);
    assert.strictEqual(intent.recipients, undefined);
  });

  it('requires wrapParams for wrapApprove', function () {
    assert.throws(
      () =>
        mpcUtils.populateIntent(coin, {
          reqId,
          intentType: 'wrapApprove',
        }),
      /wrapParams/
    );
  });

  it('rejects non-positive wrapParams.amount', function () {
    assert.throws(
      () =>
        mpcUtils.populateIntent(coin, {
          reqId,
          intentType: 'wrapApprove',
          wrapParams: { tokenName: 'hteth:cusdt', amount: '0' },
        }),
      /wrapParams.amount/
    );
  });
});
