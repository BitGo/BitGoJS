import * as assert from 'assert';
import sinon from 'sinon';
import { Wallet } from '../../../../src';

describe('Wallet - custodial tx/initiate', function () {
  const unstakingParams = {
    pox5: { branch: 'early-exit', principalPreimage: '00'.repeat(32) },
  };
  const recipients = [{ address: 'tb1qexample', amount: 'max' }];

  let wallet: Wallet;
  let mockBitGo: any;
  let sendStub: sinon.SinonStub;

  beforeEach(function () {
    sendStub = sinon.stub().returns({ result: sinon.stub().resolves({ status: 'accepted' }) });
    mockBitGo = {
      post: sinon.stub().returns({ send: sendStub }),
      setRequestTracer: sinon.stub(),
    };
    const mockBaseCoin = {
      url: sinon.stub().callsFake((path: string) => `/tbtcstxsignet${path}`),
      checkRecipient: sinon.stub(),
      preprocessBuildParams: sinon.stub().callsFake((params: unknown) => params),
      getExtraPrebuildParams: sinon.stub().resolves({}),
      supportsTss: sinon.stub().returns(false),
    };
    wallet = new Wallet(mockBitGo, mockBaseCoin as any, {
      id: 'test-wallet-id',
      keys: ['user-key'],
      type: 'custodial',
      multisigType: 'onchain',
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('forwards unstakingParams from sendMany to the tx/initiate request body', async function () {
    await wallet.sendMany({ recipients, txFormat: 'psbt', noSplitChange: true, unstakingParams } as any);

    assert.strictEqual(mockBitGo.post.callCount, 1);
    assert.strictEqual(mockBitGo.post.firstCall.args[0], '/tbtcstxsignet/wallet/test-wallet-id/tx/initiate');
    const body = sendStub.firstCall.args[0];
    assert.deepStrictEqual(body.unstakingParams, unstakingParams);
    assert.deepStrictEqual(body.recipients, recipients);
    assert.strictEqual(body.txFormat, 'psbt');
  });

  it('does not add unstakingParams when the caller did not set it', async function () {
    await wallet.sendMany({ recipients } as any);

    assert.ok(!('unstakingParams' in sendStub.firstCall.args[0]));
  });
});
