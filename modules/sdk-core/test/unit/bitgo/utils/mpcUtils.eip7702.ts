import assert from 'assert';
import * as sinon from 'sinon';
import { IBaseCoin, KeychainsTriplet } from '../../../../src/bitgo/baseCoin';
import { BitGoBase } from '../../../../src/bitgo/bitgoBase';
import { MpcUtils } from '../../../../src/bitgo/utils/mpcUtils';
import { Eip7702IntentParams } from '../../../../src/bitgo/utils/tss/baseTypes';
import { RequestTracer } from '../../../../src/bitgo/utils/util';

class TestMpcUtils extends MpcUtils {
  createKeychains(): Promise<KeychainsTriplet> {
    return Promise.reject(new Error('unused'));
  }
}

describe('populateIntent eip7702', function () {
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

  const eip7702Params: Eip7702IntentParams = {
    implementationAddress: '0x0000000000000000000000000000000000000001',
    chainId: 1,
    nonce: 0,
    authorizationList: [
      {
        chainId: 1,
        address: '0x0000000000000000000000000000000000000001',
        nonce: 0,
        yParity: 0,
        r: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        s: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      },
    ],
    envelope: {
      maxPriorityFeePerGas: 2000000000,
      maxFeePerGas: 3000000000,
      gasLimit: 21000,
      destination: '0x0000000000000000000000000000000000000002',
      value: 0,
      data: '0x',
    },
  };

  it('flattens eip7702Params onto eip7702 intent', function () {
    const intent = mpcUtils.populateIntent(coin, {
      reqId,
      intentType: 'eip7702',
      eip7702Params,
    });

    assert.strictEqual(intent.intentType, 'eip7702');
    assert.strictEqual(intent.implementationAddress, eip7702Params.implementationAddress);
    assert.strictEqual(intent.chainId, eip7702Params.chainId);
    assert.strictEqual(intent.nonce, '0');
    assert.deepStrictEqual(intent.authorizationList, eip7702Params.authorizationList);
    assert.strictEqual(intent.maxPriorityFeePerGas, eip7702Params.envelope.maxPriorityFeePerGas);
    assert.strictEqual(intent.maxFeePerGas, eip7702Params.envelope.maxFeePerGas);
    assert.strictEqual(intent.gasLimit, eip7702Params.envelope.gasLimit);
    assert.strictEqual(intent.destination, eip7702Params.envelope.destination);
    assert.strictEqual(intent.value, eip7702Params.envelope.value);
    assert.strictEqual(intent.data, eip7702Params.envelope.data);
    assert.strictEqual(intent.recipients, undefined);
  });

  it('carries feeOptions and feeToken through', function () {
    const feeOptions = { maxFeePerGas: 3000000000, maxPriorityFeePerGas: 2000000000 };
    const intent = mpcUtils.populateIntent(coin, {
      reqId,
      intentType: 'eip7702',
      eip7702Params,
      feeOptions,
      feeToken: 'hteth:cusdt',
    });

    assert.deepStrictEqual(intent.feeOptions, feeOptions);
    assert.strictEqual(intent.feeToken, 'hteth:cusdt');
  });

  it('requires eip7702Params', function () {
    assert.throws(
      () =>
        mpcUtils.populateIntent(coin, {
          reqId,
          intentType: 'eip7702',
        }),
      /eip7702Params/
    );
  });
});
